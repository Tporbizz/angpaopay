"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const DOWN_OPTIONS = ["0.25", "0.30", "0.40", "0.50"];
const DOWN_LABELS: Record<string, string> = {
  "0.25": "ดาวน์ 25%",
  "0.30": "ดาวน์ 30%",
  "0.40": "ดาวน์ 40%",
  "0.50": "ดาวน์ 50%",
};

export default function AdminSettingsPage() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [serviceFee, setServiceFee] = useState(200);
  const [regFee, setRegFee] = useState(800);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("settings")
      .select("*")
      .then(({ data }) => {
        if (data) {
          data.forEach((row) => {
            if (row.key === "rates") setRates(row.value as Record<string, number>);
            if (row.key === "service_fee_monthly") setServiceFee(Number(row.value));
            if (row.key === "registration_fee") setRegFee(Number(row.value));
          });
        }
        setLoading(false);
      });
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    setSaving(true);
    await Promise.all([
      supabase.from("settings").update({ value: rates, updated_at: new Date().toISOString() }).eq("key", "rates"),
      supabase.from("settings").update({ value: serviceFee, updated_at: new Date().toISOString() }).eq("key", "service_fee_monthly"),
      supabase.from("settings").update({ value: regFee, updated_at: new Date().toISOString() }).eq("key", "registration_fee"),
    ]);
    setSaving(false);
    showToast("บันทึกการตั้งค่าแล้ว");
  }

  if (loading) return <p className="text-center text-gray-400 py-8">กำลังโหลด...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ตั้งค่าอัตราค่าบริการ</h1>

      {/* Rates per down% */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">อัตราค่าบริการเช่าใช้ทรัพย์สิน (% ต่อเดือน)</h2>
        <p className="text-xs text-gray-500 mb-4">กำหนดอัตราค่าบริการสำหรับแต่ละระดับเงินดาวน์</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DOWN_OPTIONS.map((key) => (
            <div key={key} className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {DOWN_LABELS[key]}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="input-field w-24 text-center"
                  value={((rates[key] || 0) * 100).toFixed(1)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) / 100;
                    setRates((prev) => ({ ...prev, [key]: val }));
                  }}
                />
                <span className="text-sm text-gray-500">% /เดือน</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                = {(((rates[key] || 0) * 100) * 12).toFixed(1)}% ต่อปี
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Other fees */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">ค่าธรรมเนียมอื่นๆ</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ค่าบริการรายเดือน (บาท/เดือน)
            </label>
            <input
              type="number"
              className="input-field"
              value={serviceFee}
              onChange={(e) => setServiceFee(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ค่าธรรมเนียมลงทะเบียน (บาท)
            </label>
            <input
              type="number"
              className="input-field"
              value={regFee}
              onChange={(e) => setRegFee(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">ตัวอย่างการคำนวณ (สินค้าราคา ฿20,000)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">ดาวน์</th>
                <th className="p-2 text-right">เงินดาวน์</th>
                <th className="p-2 text-right">ค่าบริการเช่าใช้</th>
                <th className="p-2 text-right">ค่าบริการรายเดือน</th>
                <th className="p-2 text-right">ลงทะเบียน</th>
                <th className="p-2 text-right font-bold">ค่างวด/เดือน</th>
              </tr>
            </thead>
            <tbody>
              {DOWN_OPTIONS.map((key) => {
                const d = parseFloat(key);
                const price = 20000;
                const balance = price - Math.round(price * d);
                const r = rates[key] || 0;
                const hireFee = Math.round(balance * r * 12);
                const svc = serviceFee * 12;
                const total = balance + hireFee + svc + regFee;
                const monthly = Math.round(total / 12);
                return (
                  <tr key={key} className="border-t border-gray-100">
                    <td className="p-2">{d * 100}%</td>
                    <td className="p-2 text-right">฿{(Math.round(price * d)).toLocaleString()}</td>
                    <td className="p-2 text-right">฿{hireFee.toLocaleString()}</td>
                    <td className="p-2 text-right">฿{svc.toLocaleString()}</td>
                    <td className="p-2 text-right">฿{regFee.toLocaleString()}</td>
                    <td className="p-2 text-right font-bold text-[#C9252B]">฿{monthly.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <button className="btn-primary w-full sm:w-auto" onClick={handleSave} disabled={saving}>
        {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
      </button>

      {toast && <div className="toast bg-green-500">{toast}</div>}
    </div>
  );
}
