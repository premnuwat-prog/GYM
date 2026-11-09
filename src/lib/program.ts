export type Exercise = { id: string; en: string; th: string; muscle: string; sets: number; min: number; max: number; rest: number; increment: number }
export type ProgramDay = { day: number; name: string; focus: string; exercises: Exercise[] }

export const PROGRAM: ProgramDay[] = [
  { day: 1, name: 'Day 1 — Chest, Shoulders & Arms', focus: 'อก • ไหล่ • แขน', exercises: [
    { id: 'incline-db-press', en: 'Incline Dumbbell Press', th: 'ดัมเบลเพรสบน', muscle: 'อกบน', sets: 3, min: 8, max: 12, rest: 90, increment: 2 },
    { id: 'machine-chest-press', en: 'Machine Chest Press', th: 'แมชชีนเชสต์เพรส', muscle: 'อก', sets: 3, min: 8, max: 12, rest: 90, increment: 2.5 },
    { id: 'seated-cable-row', en: 'Seated Cable Row', th: 'เคเบิลโรว์นั่ง', muscle: 'หลัง', sets: 3, min: 8, max: 12, rest: 75, increment: 2.5 },
    { id: 'lateral-raise', en: 'Dumbbell Lateral Raise', th: 'ยกดัมเบลด้านข้าง', muscle: 'ไหล่ข้าง', sets: 3, min: 12, max: 15, rest: 60, increment: 1 },
    { id: 'triceps-pushdown', en: 'Rope Triceps Pushdown', th: 'เชือกกดไตรเซปส์', muscle: 'หลังแขน', sets: 2, min: 10, max: 15, rest: 60, increment: 2.5 },
    { id: 'db-curl', en: 'Dumbbell Biceps Curl', th: 'ดัมเบลเคิร์ล', muscle: 'หน้าแขน', sets: 2, min: 10, max: 15, rest: 60, increment: 1 },
    { id: 'leg-press', en: 'Leg Press', th: 'เลกเพรส', muscle: 'ขา', sets: 2, min: 10, max: 12, rest: 75, increment: 5 },
  ]},
  { day: 2, name: 'Day 2 — Back, Shoulders & Legs', focus: 'หลัง • ไหล่ • ขา', exercises: [
    { id: 'lat-pulldown', en: 'Lat Pulldown', th: 'แลตพูลดาวน์', muscle: 'หลัง', sets: 3, min: 8, max: 12, rest: 90, increment: 2.5 },
    { id: 'shoulder-press', en: 'Dumbbell Shoulder Press', th: 'ดัมเบลโชลเดอร์เพรส', muscle: 'ไหล่', sets: 3, min: 8, max: 12, rest: 90, increment: 2 },
    { id: 'pec-deck', en: 'Pec Deck Fly', th: 'เพคเดคฟลาย', muscle: 'อก', sets: 3, min: 10, max: 15, rest: 75, increment: 2.5 },
    { id: 'db-rdl', en: 'Dumbbell Romanian Deadlift', th: 'ดัมเบลโรมาเนียนเดดลิฟต์', muscle: 'หลังขา', sets: 3, min: 8, max: 12, rest: 90, increment: 2 },
    { id: 'face-pull', en: 'Cable Face Pull', th: 'เคเบิลเฟซพูล', muscle: 'ไหล่หลัง', sets: 2, min: 12, max: 15, rest: 60, increment: 2.5 },
    { id: 'incline-curl', en: 'Incline Dumbbell Curl', th: 'อินไคลน์ดัมเบลเคิร์ล', muscle: 'หน้าแขน', sets: 2, min: 10, max: 15, rest: 60, increment: 1 },
    { id: 'overhead-triceps', en: 'Overhead Triceps Extension', th: 'โอเวอร์เฮดไตรเซปส์', muscle: 'หลังแขน', sets: 2, min: 10, max: 15, rest: 60, increment: 1 },
  ]},
]

export const THAI_FOODS = ['ข้าวสวย', 'ไข่ต้ม', 'อกไก่', 'ข้าวกะเพรา', 'ข้าวมันไก่', 'ข้าวผัด', 'ปลา', 'กล้วย', 'เวย์โปรตีน']
