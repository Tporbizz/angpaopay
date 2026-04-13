"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calculatePricing, getBaseRate } from "@/lib/pricing";
import { calculateAutoScore } from "@/lib/scoring";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
}

const DOWN_OPTIONS = [0.15, 0.2, 0.25, 0.3];
const FIXED_MONTHS = 12;

const JOB_OPTIONS = [
  { value: "government", label: "ข้าราชการ/รัฐวิสาหกิจ" },
  { value: "company_employee", label: "พนักงานบริษัทเอกชน" },
  { value: "business_owner", label: "เจ้าของกิจการ" },
  { value: "general_labor", label: "รับจ้างทั่วไป" },
  { value: "merchant", label: "ค้าขาย/ชาวสวน" },
  { value: "rider", label: "ไรเดอร์" },
  { value: "student", label: "นักเรียน/นักศึกษา" },
  { value: "other", label: "อื่นๆ" },
];

const PHONE_DURATION_OPTIONS = [
  { value: "less_than_6_months", label: "น้อยกว่า 6 เดือน" },
  { value: "6_months_to_1_year", label: "6 เดือน - 1 ปี" },
  { value: "1_to_3_years", label: "1 - 3 ปี" },
  { value: "more_than_3_years", label: "มากกว่า 3 ปี" },
];

const RESIDENCE_OPTIONS = [
  { value: "own", label: "บ้านตัวเอง/ครอบครัว" },
  { value: "rent", label: "เช่ารายเดือน" },
  { value: "other", label: "อื่นๆ" },
];

const WORK_DURATION_OPTIONS = [
  { value: "less_than_6_months", label: "น้อยกว่า 6 เดือน" },
  { value: "6_months_to_1_year", label: "6 เดือน - 1 ปี" },
  { value: "more_than_1_year", label: "มากกว่า 1 ปี" },
];

function formatNumber(n: number): string {
  return n.toLocaleString("th-TH");
}

export default function ApplyPage() {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Step 1
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("iphone");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [downPct, setDownPct] = useState(0.2);
  const months = FIXED_MONTHS;

  // Step 2
  const [name, setName] = useState("");
  const [idCard, setIdCard] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneDuration, setPhoneDuration] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [instagram, setInstagram] = useState("");
  const [address, setAddress] = useState("");
  const [residenceType, setResidenceType] = useState("");

  // Step 3
  const [jobType, setJobType] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [workDuration, setWorkDuration] = useState("");
  const [income, setIncome] = useState("");
  const [ref1Name, setRef1Name] = useState("");
  const [ref1Relation, setRef1Relation] = useState("");
  const [ref1Phone, setRef1Phone] = useState("");
  const [ref2Name, setRef2Name] = useState("");
  const [ref2Relation, setRef2Relation] = useState("");
  const [ref2Phone, setRef2Phone] = useState("");

  // Step 4
  const [stmtFile, setStmtFile] = useState<File | null>(null);
  const [stmtPassword, setStmtPassword] = useState("");
  const [workPhotoFile, setWorkPhotoFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setProducts(data);
        setLoading(false);
      });
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  const rate = getBaseRate(downPct);
  const pricing = selectedProduct
    ? calculatePricing({ price: selectedProduct.price, downPct, months, rate })
    : null;

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 1:
        return !!selectedProduct;
      case 2:
        return !!(name && idCard.length === 13 && phone && phoneDuration && address && residenceType);
      case 3:
        return !!(jobType && workDuration && income && ref1Name && ref1Relation && ref1Phone && ref2Name && ref2Relation && ref2Phone);
      case 4:
        return agree;
      default:
        return false;
    }
  };

  async function handleSubmit() {
    if (!selectedProduct || !pricing) return;
    setSubmitting(true);

    try {
      let stmtUrl = "";
      let workPhotoUrl = "";

      if (stmtFile) {
        const ext = stmtFile.name.split(".").pop();
        const path = `statements/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("documents").upload(path, stmtFile);
        if (!error) {
          const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
          stmtUrl = urlData.publicUrl;
        }
      }

      if (workPhotoFile) {
        const ext = workPhotoFile.name.split(".").pop();
        const path = `work-photos/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("documents").upload(path, workPhotoFile);
        if (!error) {
          const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
          workPhotoUrl = urlData.publicUrl;
        }
      }

      const autoScore = calculateAutoScore({
        income: parseInt(income),
        monthlyPayment: pricing.monthly,
        residenceType,
        communityBond: residenceType === "own" ? "high" : "low",
        jobType,
        workDuration,
        phoneDuration,
        hasSocial: !!(facebook || tiktok || instagram),
        hasStatement: !!stmtFile,
        hasWorkPhoto: !!workPhotoFile,
      });

      const { data, error } = await supabase
        .from("applications")
        .insert({
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          product_price: selectedProduct.price,
          down_pct: downPct,
          months,
          down_amt: pricing.downAmt,
          monthly_payment: pricing.monthly,
          final_rate: rate,
          name,
          id_card: idCard,
          phone,
          phone_duration: phoneDuration,
          social_url: [facebook, tiktok, instagram].filter(Boolean).join(" | "),
          facebook,
          tiktok,
          instagram,
          address,
          residence_type: residenceType,
          job_type: jobType,
          workplace,
          work_duration: workDuration,
          income: parseInt(income),
          ref1_name: ref1Name,
          ref1_relation: ref1Relation,
          ref1_phone: ref1Phone,
          ref2_name: ref2Name,
          ref2_relation: ref2Relation,
          ref2_phone: ref2Phone,
          stmt_url: stmtUrl,
          stmt_password: stmtPassword,
          work_photo_url: workPhotoUrl,
          auto_score: autoScore,
          total_score: autoScore,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;
      setSuccess(data.id.slice(0, 8).toUpperCase());
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ใบสมัครของคุณได้รับแล้ว!</h1>
          <p className="text-gray-600 mb-4">
            รหัสอ้างอิง: <span className="font-mono font-bold text-[#C9252B]">AP-{success}</span>
          </p>
          <p className="text-gray-500 text-sm mb-6">ทีมงานจะติดต่อกลับภายใน 1 ชั่วโมง</p>
          <Link href="/apply" className="btn-primary inline-block">สมัครอีกครั้ง</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C9252B] rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-3 h-3 bg-[#D4AF37] rounded-bl-lg" />
            </div>
            <span className="text-lg font-bold text-[#C9252B]">อั่งเปาเพย์</span>
          </Link>
          <span className="text-sm text-gray-500">สมัครเช่าซื้อ</span>
        </div>
      </header>

      {/* Stepper */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? "bg-[#C9252B] text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > s ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {s < 4 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-1 ${step > s ? "bg-[#C9252B]" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {step === 1 && "เลือกสินค้าและเงื่อนไข"}
          {step === 2 && "ข้อมูลส่วนตัว"}
          {step === 3 && "รายได้และบุคคลอ้างอิง"}
          {step === 4 && "เอกสารและยืนยัน"}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24">
        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field mb-4"
            />

            <div className="flex gap-2 mb-4 overflow-x-auto">
              {[
                { value: "iphone", label: "iPhone" },
                { value: "ipad", label: "iPad" },
              ].map((c) => (
                <button
                  key={c.value}
                  className={`pill whitespace-nowrap ${categoryFilter === c.value ? "active" : ""}`}
                  onClick={() => setCategoryFilter(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-center text-gray-400 py-8">กำลังโหลด...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {filteredProducts.map((p) => {
                  // Estimate: 30% down, 1.5%/month, 12 months
                  const est = calculatePricing({ price: p.price, downPct: 0.3, months: 12, rate: 0.015 });
                  return (
                    <button
                      key={p.id}
                      className={`card text-left ${
                        selectedProduct?.id === p.id
                          ? "ring-2 ring-[#C9252B] border-[#C9252B]"
                          : ""
                      }`}
                      onClick={() => setSelectedProduct(p)}
                    >
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-[#C9252B] font-bold text-lg mt-1">
                        ฿{formatNumber(p.price)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ผ่อนเริ่มต้น <span className="font-semibold text-[#C9252B]">฿{formatNumber(est.monthly)}/เดือน</span>
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedProduct && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">เงินดาวน์</label>
                  <div className="flex gap-2">
                    {DOWN_OPTIONS.map((d) => (
                      <button
                        key={d}
                        className={`pill flex-1 ${downPct === d ? "active" : ""}`}
                        onClick={() => setDownPct(d)}
                      >
                        {d * 100}%
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-4">ผ่อนชำระ {FIXED_MONTHS} เดือน</p>

                {pricing && (
                  <div className="bg-gradient-to-br from-red-50 to-[#f0e4b8]/30 border border-[#D4AF37]/30 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">ค่างวดต่อเดือน</p>
                    <p className="text-4xl font-bold text-[#C9252B]">
                      ฿{formatNumber(pricing.monthly)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ดาวน์ ฿{formatNumber(pricing.downAmt)} | {months} งวด
                    </p>
                    <p className="text-xs text-gray-400 mt-2">กดถัดไปเพื่อกรอกใบสมัคร</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล *</label>
              <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อ นามสกุล" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เลขบัตรประชาชน 13 หลัก *</label>
              <input className="input-field" value={idCard} onChange={(e) => setIdCard(e.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="X-XXXX-XXXXX-XX-X" maxLength={13} />
              {idCard && idCard.length !== 13 && <p className="text-red-500 text-xs mt-1">กรุณากรอกให้ครบ 13 หลัก</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ *</label>
              <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="0XX-XXX-XXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ใช้เบอร์นี้มานานเท่าไหร่ *</label>
              <select className="input-field" value={phoneDuration} onChange={(e) => setPhoneDuration(e.target.value)}>
                <option value="">เลือก</option>
                {PHONE_DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
              <input className="input-field" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="ชื่อโปรไฟล์หรือ URL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
              <input className="input-field" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@username หรือ URL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
              <input className="input-field" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@username หรือ URL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่ปัจจุบัน *</label>
              <textarea className="input-field min-h-[80px]" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะที่อยู่ *</label>
              <select className="input-field" value={residenceType} onChange={(e) => setResidenceType(e.target.value)}>
                <option value="">เลือก</option>
                {RESIDENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อาชีพ *</label>
              <select className="input-field" value={jobType} onChange={(e) => setJobType(e.target.value)}>
                <option value="">เลือก</option>
                {JOB_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่ทำงาน + เบอร์โทรที่ทำงาน</label>
              <input className="input-field" value={workplace} onChange={(e) => setWorkplace(e.target.value)} placeholder="ชื่อบริษัท/ร้าน + เบอร์โทร" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ระยะเวลาทำงาน *</label>
              <select className="input-field" value={workDuration} onChange={(e) => setWorkDuration(e.target.value)}>
                <option value="">เลือก</option>
                {WORK_DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รายได้/เดือน (บาท) *</label>
              <input className="input-field" type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="เช่น 15000" />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-gray-800 mb-3">บุคคลอ้างอิงที่ 1 *</h3>
              <div className="space-y-3">
                <input className="input-field" value={ref1Name} onChange={(e) => setRef1Name(e.target.value)} placeholder="ชื่อ-นามสกุล" />
                <input className="input-field" value={ref1Relation} onChange={(e) => setRef1Relation(e.target.value)} placeholder="ความสัมพันธ์ เช่น พี่น้อง, เพื่อน" />
                <input className="input-field" value={ref1Phone} onChange={(e) => setRef1Phone(e.target.value)} placeholder="เบอร์โทร" />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-gray-800 mb-3">บุคคลอ้างอิงที่ 2 *</h3>
              <div className="space-y-3">
                <input className="input-field" value={ref2Name} onChange={(e) => setRef2Name(e.target.value)} placeholder="ชื่อ-นามสกุล" />
                <input className="input-field" value={ref2Relation} onChange={(e) => setRef2Relation(e.target.value)} placeholder="ความสัมพันธ์" />
                <input className="input-field" value={ref2Phone} onChange={(e) => setRef2Phone(e.target.value)} placeholder="เบอร์โทร" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-[#D4AF37]/30 rounded-lg p-3 text-sm text-orange-800">
              ยิ่งมีเอกสารมาก ยิ่งได้เงื่อนไขดีกว่า
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statement / สลิปเงินเดือน (PDF/รูป)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setStmtFile(e.target.files?.[0] || null)}
                className="input-field"
              />
            </div>

            {stmtFile && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password เปิดไฟล์ (ถ้ามี)
                </label>
                <input
                  className="input-field"
                  value={stmtPassword}
                  onChange={(e) => setStmtPassword(e.target.value)}
                  placeholder="กรณีไฟล์ PDF มีรหัสผ่าน"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รูปถ่ายตัวเองในชุดทำงาน (รูป)
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => setWorkPhotoFile(e.target.files?.[0] || null)}
                className="input-field"
              />
            </div>

            {/* Summary quote */}
            {pricing && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3">สรุปค่าใช้จ่าย</h3>
                <QuoteCard pricing={pricing} months={months} downPct={downPct} rate={rate} />
              </div>
            )}

            {/* Contract terms */}
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto text-xs text-gray-600 space-y-2">
              <p className="font-semibold text-gray-800">เงื่อนไขการผ่อนชำระ การผิดสัญญา และการสิ้นสุดสัญญา ภายใต้แพลตฟอร์ม ANGPAOPAY</p>
              <p><strong>ข้อ 1</strong> ผู้เช่าซื้อมีหน้าที่ชำระเงินตามงวดและระยะเวลาที่กำหนดไว้ในสัญญา หากยกเลิกก่อนครบกำหนด ผู้ให้บริการมีสิทธิหักค่าเสื่อมราคา ค่าดำเนินการ และค่าความเสียหาย</p>
              <p><strong>ข้อ 2</strong> ค้างชำระได้ไม่เกิน 3 วัน ค่าธรรมเนียมติดตามทวงถาม: ค้าง 1 งวด 50 บาท/รอบ, มากกว่า 1 งวด 100 บาท/รอบ, ติดตามภาคสนาม 400 บาท/ครั้ง ค้างเกิน 10 วันอาจถูกระงับการใช้งานอุปกรณ์ชั่วคราว ค่าปลดล็อค 800 บาท/ครั้ง</p>
              <p><strong>ข้อ 3</strong> เมื่อบอกเลิกสัญญา ต้องส่งคืนทรัพย์สินในสภาพสมบูรณ์</p>
              <p><strong>ข้อ 4</strong> ทรัพย์สินเป็นกรรมสิทธิ์ของผู้ให้บริการจนกว่าจะชำระครบ ห้ามโอน จำหน่าย จำนำ Root/Jailbreak หรือปลดล็อค MDM</p>
              <p><strong>ข้อ 5</strong> หากสูญหาย/ถูกโจรกรรม ต้องแจ้งความภายใน 24 ชม. และส่งใบแจ้งความภายใน 3 วัน</p>
              <p><strong>ข้อ 6</strong> ยินยอมให้เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลตาม พ.ร.บ. ทวงถามหนี้</p>
              <p><strong>ข้อ 7-9</strong> ค่าดำเนินคดีตามจริง รับประกันไม่ครอบคลุมอุบัติเหตุ/ดัดแปลง เขตอำนาจศาลตามภูมิลำเนาผู้ให้บริการ</p>
            </div>

            <div className="flex items-start gap-2 mt-3">
              <input
                type="checkbox"
                id="agree"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 accent-[#C9252B]"
              />
              <label htmlFor="agree" className="text-sm text-gray-600">
                ข้าพเจ้าได้อ่านและยอมรับเงื่อนไขสัญญาเช่าซื้อข้างต้น ยืนยันว่าข้อมูลทั้งหมดเป็นความจริง และยินยอมให้ตรวจสอบข้อมูลเพื่อประกอบการพิจารณา
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 1 && (
            <button className="btn-outline flex-1" onClick={() => setStep(step - 1)}>
              ย้อนกลับ
            </button>
          )}
          {step < 4 ? (
            <button
              className="btn-primary flex-1"
              disabled={!validateStep(step)}
              onClick={() => setStep(step + 1)}
            >
              ถัดไป
            </button>
          ) : (
            <button
              className="btn-primary flex-1"
              disabled={!validateStep(4) || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "กำลังส่ง..." : "ส่งใบสมัคร"}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-16 left-0 right-0 text-center pb-1">
        <Link href="/admin" className="text-xs text-gray-400 hover:text-[#C9252B]">
          สำหรับเจ้าหน้าที่ &rarr;
        </Link>
      </div>
    </div>
  );
}

function QuoteCard({
  pricing,
  months,
  downPct,
  rate,
}: {
  pricing: ReturnType<typeof calculatePricing>;
  months: number;
  downPct: number;
  rate: number;
}) {
  return (
    <div className="bg-gradient-to-br from-red-50 to-[#f0e4b8]/30 border border-[#D4AF37]/30 rounded-xl p-4">
      <p className="text-sm text-gray-600 mb-1">ค่างวดต่อเดือน</p>
      <p className="text-3xl font-bold text-[#C9252B] mb-3">
        ฿{formatNumber(pricing.monthly)}
        <span className="text-sm text-gray-500 font-normal"> /เดือน</span>
      </p>
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>เงินดาวน์ ({downPct * 100}%)</span>
          <span className="font-medium">฿{formatNumber(pricing.downAmt)}</span>
        </div>
        <div className="flex justify-between">
          <span>ยอดคงเหลือ</span>
          <span>฿{formatNumber(pricing.balance)}</span>
        </div>
        <div className="flex justify-between">
          <span>ค่าบริการเช่าใช้ทรัพย์สิน ({rate * 100}%/เดือน x {months})</span>
          <span>฿{formatNumber(pricing.hireFee)}</span>
        </div>
        <div className="flex justify-between">
          <span>ค่าบริการรายเดือน (฿200 x {months})</span>
          <span>฿{formatNumber(pricing.svcTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>ค่าธรรมเนียมลงทะเบียน</span>
          <span>฿{formatNumber(pricing.registration)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-800 border-t border-[#D4AF37]/30 pt-1 mt-1">
          <span>ราคาเช่าซื้อรวมทั้งสิ้น</span>
          <span>฿{formatNumber(pricing.total)}</span>
        </div>
      </div>
    </div>
  );
}
