import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-red-50 to-white">
      <div className="text-center max-w-lg px-4">
        {/* Logo area */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-14 h-14 bg-[#C9252B] rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-6 h-6 bg-[#D4AF37] rounded-bl-xl" />
            <div className="absolute top-0 right-0 w-5 h-5 bg-[#D4AF37]/60 rounded-bl-lg translate-x-0.5 -translate-y-0.5" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-[#C9252B] leading-tight" style={{ fontFamily: 'var(--font-kanit), Kanit, sans-serif' }}>
              อั่งเปาเพย์
            </h1>
            <p className="text-sm text-[#C9252B] font-medium -mt-0.5">Angpao Pay</p>
          </div>
        </div>

        <p className="text-[#333] text-lg mb-2 font-medium" style={{ fontFamily: 'var(--font-kanit), Kanit, sans-serif' }}>
          แอปผ่อนสินค้าง่ายๆ ไม่ต้องใช้บัตรเครดิต
        </p>
        <p className="text-gray-500 mb-8">
          สมัครเช่าซื้อ iPhone, iPad ผ่อนสบาย อนุมัติไว
        </p>

        <Link
          href="/apply"
          className="btn-primary inline-block text-lg px-10 py-3.5 rounded-xl shadow-lg shadow-red-200"
        >
          สมัครเลย
        </Link>

        <p className="mt-10 text-sm text-gray-400">
          <Link href="/admin" className="hover:text-[#C9252B] transition-colors">
            สำหรับเจ้าหน้าที่ &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
