# GYM — Personal Trainer

แอปติดตาม Workout, Progressive Overload, สัดส่วนร่างกาย และโภชนาการแบบ mobile-first ภาษาไทย

## ฟีเจอร์ MVP

- Supabase Auth และข้อมูลผู้ใช้แยกด้วย Row Level Security
- โปรแกรมฝึก 2 วัน/สัปดาห์ 12 สัปดาห์
- Active workout: บันทึกน้ำหนัก, reps, RIR, rest timer และกู้คืน draft หลัง refresh
- Rule-based Double Progression พร้อมเหตุผลประกอบ
- น้ำหนัก/รอบเอวและกราฟจากข้อมูลจริง
- Food logging และ macro summary
- Responsive iPhone UI พร้อม safe-area และ touch targets
- Static export และ deploy อัตโนมัติด้วย GitHub Pages

## เริ่มต้นในเครื่อง

```bash
npm install
cp .env.example .env.local
npm run dev
```

Environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
```

ใช้ migration ที่ `supabase/migrations/202611090001_initial_schema.sql` เพื่อสร้าง schema, constraints, private storage และ RLS

## ตรวจสอบ

```bash
npm test
npm run lint
npm run build
```

## Deployment

Workflow `.github/workflows/deploy-pages.yml` ใช้ repository secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Push เข้า `main` แล้ว GitHub Actions จะ test, build static export และ deployไป GitHub Pages

## ข้อจำกัด MVP

- Draft workout เก็บใน localStorage และ sync ตอนจบ session; pending-operation queue แบบ IndexedDB เป็นงาน Phase 2
- Push notifications, progress photos UI, custom program builder และ AI coach ยังไม่รวมใน MVP
- ค่าอาหารต้องกรอกจากฉลากหรือแหล่งที่เชื่อถือได้ แอปไม่สร้างค่าทางโภชนาการขึ้นเอง
