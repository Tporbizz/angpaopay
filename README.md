# AngpaoPay - ระบบสมัครเช่าซื้อมือถือ

ระบบสมัครเช่าซื้อ iPhone, iPad, MacBook พร้อม Admin Panel สำหรับพิจารณาอนุมัติ

## URLs

| URL | คืออะไร |
|-----|---------|
| `/apply` | หน้าลูกค้า — กรอก���บสมัคร เห���นยอดผ่อนทันที |
| `/admin` | หน้าแอดมิน — รายชื่อใบส���ัคร ตัดสินใจ |
| `/admin/products` | จัดการราคา — แก้ราคา เพิ่มสินค้า |

## Setup

### 1. ตั้งค่า Environment Variables

แก้ไฟล์ `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ADMIN_PASSWORD=angpao2024
```

### 2. รัน Supabase Migration

���ข้า Supabase Dashboard > SQL Editor แล้วรัน SQL จากไ���ล์ `supabase/migrations/001_init.sql`

สร้าง Storage Bucket ชื่อ `documents` (ตั้งเป็น public)

### 3. รันโปรเจค

```bash
npm install
npm run dev
```

## Deploy ขึ้น Vercel

1. สร้าง GitHub repo แล้ว push code
2. ไปที่ vercel.com > New Project > Import repo
3. ตั้ง Environment Variables ใน Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_PASSWORD`
4. Deploy!

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- Supabase (Database + Storage)
- react-hook-form + zod
