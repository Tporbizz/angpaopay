"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Application {
  id: string;
  created_at: string;
  name: string;
  product_name: string;
  down_pct: number;
  months: number;
  income: number;
  auto_score: number;
  total_score: number;
  status: string;
  monthly_payment: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "รอพิจารณา", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "อนุมัติ", color: "bg-green-100 text-green-800" },
  rejected: { label: "ปฏิเสธ", color: "bg-red-100 text-red-800" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setApps(data);
        setLoading(false);
      });
  }, []);

  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  const stats = {
    pending: apps.filter((a) => a.status === "pending").length,
    approved: apps.filter((a) => a.status === "approved").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
    total: apps.length,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">รายการใบสมัคร</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="รอพิจารณา" value={stats.pending} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard label="อนุมัติแล้ว" value={stats.approved} color="text-green-600" bg="bg-green-50" />
        <StatCard label="ปฏิเสธ" value={stats.rejected} color="text-red-600" bg="bg-red-50" />
        <StatCard label="ทั้งหมด" value={stats.total} color="text-blue-600" bg="bg-blue-50" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { value: "all", label: "ทั้งหมด" },
          { value: "pending", label: "รอพิจารณา" },
          { value: "approved", label: "อนุมัติ" },
          { value: "rejected", label: "ปฏิเสธ" },
        ].map((f) => (
          <button
            key={f.value}
            className={`pill whitespace-nowrap ${filter === f.value ? "active" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-gray-400 py-8">กำลังโหลด...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">ไม่มีรายการ</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const status = STATUS_MAP[app.status] || STATUS_MAP.pending;
            return (
              <Link
                key={app.id}
                href={`/admin/${app.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{app.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{app.product_name}</p>
                  </div>
                  <span className={`badge ${status.color}`}>{status.label}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                  <span>ดาวน์ {app.down_pct * 100}%</span>
                  <span>{app.months} งวด</span>
                  <span>฿{app.monthly_payment?.toLocaleString()}/เดือน</span>
                  <span>รายได้ ฿{app.income?.toLocaleString()}</span>
                  <span>คะแนน {app.total_score ?? app.auto_score}</span>
                  <span>{formatDate(app.created_at)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
