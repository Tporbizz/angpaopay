"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { calculatePricing } from "@/lib/pricing";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Application {
  id: string;
  created_at: string;
  product_id: string;
  product_name: string;
  product_price: number;
  down_pct: number;
  months: number;
  down_amt: number;
  monthly_payment: number;
  final_rate: number;
  name: string;
  id_card: string;
  phone: string;
  phone_duration: string;
  social_url: string;
  address: string;
  residence_type: string;
  community_bond: string;
  job_type: string;
  workplace: string;
  work_duration: string;
  income: number;
  ref1_name: string;
  ref1_relation: string;
  ref1_phone: string;
  ref2_name: string;
  ref2_relation: string;
  ref2_phone: string;
  stmt_url: string;
  stmt_password: string;
  work_photo_url: string;
  auto_score: number;
  staff_score: number;
  total_score: number;
  status: string;
  staff_note: string;
  approved_at: string;
  approved_by: string;
}

const JOB_LABELS: Record<string, string> = {
  government: "ข้าราชการ/รัฐวิสาหกิจ",
  company_employee: "พนักงานบริษัทเอกชน",
  business_owner: "เจ้าของกิจการ",
  general_labor: "รับจ้างทั่วไป",
  merchant: "ค้าขาย/ชาวสวน",
  rider: "ไรเดอร์",
  student: "นักเรียน/นักศึกษา",
  other: "อื่นๆ",
};

const PHONE_LABELS: Record<string, string> = {
  less_than_6_months: "น้อยกว่า 6 เดือน",
  "6_months_to_1_year": "6 เดือน - 1 ปี",
  "1_to_3_years": "1 - 3 ปี",
  more_than_3_years: "มากกว่า 3 ปี",
};

const RESIDENCE_LABELS: Record<string, string> = {
  own: "บ้านตัวเอง/ครอบครัว",
  rent: "เช่ารายเดือน",
  other: "อื่นๆ",
};

const WORK_DURATION_LABELS: Record<string, string> = {
  less_than_6_months: "น้อยกว่า 6 เดือน",
  "6_months_to_1_year": "6 เดือน - 1 ปี",
  more_than_1_year: "มากกว่า 1 ปี",
};

function fmt(n: number) {
  return n?.toLocaleString("th-TH");
}

export default function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Staff scoring
  const [socialScore, setSocialScore] = useState(0);
  const [communityScore, setCommunityScore] = useState(0);
  const [finalRate, setFinalRate] = useState(0);
  const [staffNote, setStaffNote] = useState("");

  useEffect(() => {
    supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          setApp(data);
          setFinalRate(Number(data.final_rate));
          setStaffNote(data.staff_note || "");
          setSocialScore(0);
          setCommunityScore(0);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="text-center text-gray-400 py-8">กำลังโหลด...</p>;
  if (!app) return <p className="text-center text-red-500 py-8">ไม่พบรายการ</p>;

  const staffScore = socialScore + communityScore;
  const totalScore = (app.auto_score || 0) + staffScore;

  const pricing = calculatePricing({
    price: app.product_price,
    downPct: app.down_pct,
    months: app.months,
    rate: finalRate,
  });

  function getScoreColor(score: number) {
    if (score >= 75) return "text-green-600 bg-green-50";
    if (score >= 55) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  }

  function getScoreLabel(score: number) {
    if (score >= 75) return "แนะนำอนุมัติ";
    if (score >= 55) return "พิจารณาเพิ่มเติม";
    return "เสี่ยงสูง";
  }

  async function handleDecision(status: "approved" | "rejected") {
    if (!app) return;
    setSaving(true);
    const { error } = await supabase
      .from("applications")
      .update({
        status,
        staff_score: staffScore,
        total_score: totalScore,
        final_rate: finalRate,
        monthly_payment: pricing.monthly,
        staff_note: staffNote,
        approved_at: new Date().toISOString(),
        approved_by: "admin",
      })
      .eq("id", app.id);

    if (error) {
      alert("เกิดข้อผิดพลาด");
    } else {
      router.push("/admin");
    }
    setSaving(false);
  }

  const isDecided = app.status !== "pending";

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[#C9252B] mb-4 inline-block">
        &larr; กลับไปรายการ
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
        <span
          className={`badge text-sm px-3 py-1 ${
            app.status === "approved"
              ? "bg-green-100 text-green-800"
              : app.status === "rejected"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {app.status === "approved" ? "อนุมัติแล้ว" : app.status === "rejected" ? "ปฏิเสธ" : "รอพิจารณา"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section A - Customer Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">ข้อมูลสินค้า</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="สินค้า" value={app.product_name} />
              <InfoRow label="ราคา" value={`฿${fmt(app.product_price)}`} />
              <InfoRow label="ดาวน์" value={`${app.down_pct * 100}% (฿${fmt(app.down_amt)})`} />
              <InfoRow label="จำนวนงวด" value={`${app.months} เดือน`} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">ข้อมูลส่วนตัว</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="ชื่อ-นามสกุล" value={app.name} />
              <InfoRow label="บัตรประชาชน" value={app.id_card} />
              <InfoRow label="เบอร์โทร" value={app.phone} />
              <InfoRow label="ใช้เบอร์มา" value={PHONE_LABELS[app.phone_duration] || app.phone_duration} />
              <InfoRow
                label="Social Media"
                value={
                  app.social_url ? (
                    <a href={app.social_url.startsWith("http") ? app.social_url : `https://${app.social_url}`} target="_blank" rel="noopener noreferrer" className="text-[#C9252B] underline">
                      {app.social_url}
                    </a>
                  ) : (
                    <span className="text-gray-400">ไม่ได้ระบุ</span>
                  )
                }
              />
              <InfoRow label="ที่อยู่" value={app.address} />
              <InfoRow label="สถานะที่อยู่" value={RESIDENCE_LABELS[app.residence_type] || app.residence_type} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">อาชีพและรายได้</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="อาชีพ" value={JOB_LABELS[app.job_type] || app.job_type} />
              <InfoRow label="สถานที่ทำงาน" value={app.workplace || "-"} />
              <InfoRow label="ระยะเวลาทำงาน" value={WORK_DURATION_LABELS[app.work_duration] || app.work_duration} />
              <InfoRow label="รายได้/เดือน" value={`฿${fmt(app.income)}`} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">บุคคลอ้างอิง</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">อ้างอิง 1</p>
                <p>{app.ref1_name} ({app.ref1_relation})</p>
                <p className="text-gray-500">{app.ref1_phone}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">อ้างอิง 2</p>
                <p>{app.ref2_name} ({app.ref2_relation})</p>
                <p className="text-gray-500">{app.ref2_phone}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">เอกสาร</h2>
            <div className="space-y-2 text-sm">
              {app.stmt_url ? (
                <div className="flex items-center gap-2">
                  <a href={app.stmt_url} target="_blank" rel="noopener noreferrer" className="text-[#C9252B] underline">
                    ดู Statement / สลิปเงินเดือน
                  </a>
                  {app.stmt_password && (
                    <span className="badge bg-red-100 text-[#C9252B] px-2 py-0.5">
                      Password: {app.stmt_password}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">ไม่มี Statement</p>
              )}
              {app.work_photo_url ? (
                <a href={app.work_photo_url} target="_blank" rel="noopener noreferrer" className="text-[#C9252B] underline block">
                  ดูรูปถ่ายชุดทำงาน
                </a>
              ) : (
                <p className="text-gray-400">ไม่มีรูปถ่ายชุดทำงาน</p>
              )}
            </div>
          </div>
        </div>

        {/* Section B+C - Quote & Decision */}
        <div className="space-y-4">
          {/* Quote */}
          <div className="bg-gradient-to-br from-red-50 to-[#f0e4b8]/30 border border-[#D4AF37]/30 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">สรุปค่าใช้จ่าย</h2>
            <p className="text-3xl font-bold text-[#C9252B] mb-3">
              ฿{fmt(pricing.monthly)}<span className="text-sm text-gray-500 font-normal"> /เดือน</span>
            </p>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between"><span>เงินดาวน์</span><span>฿{fmt(pricing.downAmt)}</span></div>
              <div className="flex justify-between"><span>ยอดคงเหลือ</span><span>฿{fmt(pricing.balance)}</span></div>
              <div className="flex justify-between"><span>ค่าบริการเช่าใช้ทรัพย์สิน</span><span>฿{fmt(pricing.hireFee)}</span></div>
              <div className="flex justify-between"><span>ค่าบริการรายเดือน</span><span>฿{fmt(pricing.svcTotal)}</span></div>
              <div className="flex justify-between"><span>ค่าธรรมเนียมลงทะเบียน</span><span>฿{fmt(pricing.registration)}</span></div>
              <div className="flex justify-between font-bold text-gray-800 border-t border-[#D4AF37]/30 pt-1 mt-1">
                <span>รวมทั้งสิ้น</span><span>฿{fmt(pricing.total)}</span>
              </div>
            </div>
          </div>

          {/* Scoring */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">ประเมินคะแนน</h2>

            <div className="mb-3">
              <p className="text-sm text-gray-500">คะแนนอัตโนมัติ</p>
              <p className="text-xl font-bold text-gray-800">{app.auto_score} คะแนน</p>
            </div>

            {!isDecided && (
              <>
                <div className="space-y-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Social Media</label>
                    <select className="input-field text-sm" value={socialScore} onChange={(e) => setSocialScore(Number(e.target.value))}>
                      <option value={0}>ยังไม่ตรวจ (0)</option>
                      <option value={10}>จริง (+10)</option>
                      <option value={-10}>น่าสงสัย (-10)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ความผูกพันชุมชน</label>
                    <select className="input-field text-sm" value={communityScore} onChange={(e) => setCommunityScore(Number(e.target.value))}>
                      <option value={0}>ต่ำ (0)</option>
                      <option value={5}>ปานกลาง (+5)</option>
                      <option value={10}>สูง (+10)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-500">คะแนนพนักงาน</p>
                  <p className="text-lg font-bold text-gray-700">{staffScore > 0 ? `+${staffScore}` : staffScore}</p>
                </div>
              </>
            )}

            <div className={`rounded-lg p-3 mb-4 ${getScoreColor(totalScore)}`}>
              <p className="text-sm font-medium">คะแนนรวม</p>
              <p className="text-2xl font-bold">{totalScore}</p>
              <p className="text-sm">{getScoreLabel(totalScore)}</p>
            </div>

            {!isDecided && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">อัตราค่าบริการ (%/เดือน)</label>
                  <select className="input-field text-sm" value={finalRate} onChange={(e) => setFinalRate(Number(e.target.value))}>
                    <option value={0.015}>1.5%</option>
                    <option value={0.03}>3%</option>
                    <option value={0.05}>5%</option>
                    <option value={0.07}>7%</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุพนักงาน</label>
                  <textarea
                    className="input-field text-sm min-h-[80px]"
                    value={staffNote}
                    onChange={(e) => setStaffNote(e.target.value)}
                    placeholder="บันทึกเพิ่มเติม..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                    onClick={() => handleDecision("approved")}
                    disabled={saving}
                  >
                    {saving ? "..." : "อนุมัติ"}
                  </button>
                  <button
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                    onClick={() => handleDecision("rejected")}
                    disabled={saving}
                  >
                    {saving ? "..." : "ปฏิเสธ"}
                  </button>
                </div>
              </>
            )}

            {isDecided && app.staff_note && (
              <div className="mt-3 text-sm">
                <p className="font-medium text-gray-700">หมายเหตุ:</p>
                <p className="text-gray-600">{app.staff_note}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-gray-800 font-medium">{typeof value === "string" ? value : value}</p>
    </div>
  );
}
