import type { Metadata } from "next";
import { Kanit, Sarabun } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "อั่งเปาเพย์ AngpaoPay - สมัครเช่าซื้อมือถือ",
  description: "สมัครเช่าซื้อ iPhone, iPad ผ่อนสบาย อนุมัติไว ไม่ต้องใช้บัตรเครดิต",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${kanit.variable} ${sarabun.variable}`}>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
