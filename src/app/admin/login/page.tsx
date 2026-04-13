"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = "/admin";
      } else {
        setError("รหัสผ่านไม่ถูกต้อง");
      }
    } catch {
      setError("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-[#C9252B] rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-4 h-4 bg-[#D4AF37] rounded-bl-xl" />
          </div>
          <span className="text-xl font-bold text-[#C9252B]">อั่งเปาเพย์</span>
        </div>
        <p className="text-center text-gray-500 mb-6">เข้าสู่ระบบแอดมิน</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            className="input-field"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading || !password}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
