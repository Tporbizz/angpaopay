import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white">
      <div className="text-center max-w-lg px-4">
        <h1 className="text-5xl font-bold text-orange-500 mb-2">AngpaoPay</h1>
        <p className="text-gray-600 text-lg mb-8">
          สมัครเช่าซื้อ iPhone, iPad, MacBook
          <br />
          ผ่อนสบาย อนุมัติไว
        </p>
        <Link
          href="/apply"
          className="btn-primary inline-block text-lg px-8 py-3"
        >
          สมัครเลย
        </Link>
        <p className="mt-8 text-sm text-gray-400">
          <Link href="/admin" className="hover:text-orange-500 transition-colors">
            สำหรับเจ้าหน้าที่ &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
