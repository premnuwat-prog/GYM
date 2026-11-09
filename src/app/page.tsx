'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Activity, Apple, BarChart3, Camera, Check, ChevronRight, Dumbbell, Home, LogOut, Play, Plus, RotateCcw, Settings, TimerReset, Trash2, TrendingUp, UserRound } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { z } from 'zod'
import { getSupabase } from '@/lib/supabase'
import { PROGRAM, THAI_FOODS, type ProgramDay } from '@/lib/program'
import { recommendProgression, workoutVolume } from '@/lib/progression'

type Tab = 'home' | 'workout' | 'nutrition' | 'progress' | 'settings'
type Measurement = { id: string; measured_at: string; weight_kg: number | null; waist_cm: number | null }
type FoodLog = { id: string; logged_at: string; meal_type: string; food_name_snapshot: string; calories_snapshot: number; protein_snapshot: number; carbs_snapshot: number; fat_snapshot: number }
type SessionRow = { id: string; workout_name_snapshot: string; started_at: string; finished_at: string | null; duration_minutes: number | null; total_volume: number | null }
type Profile = { height_cm: number; training_level: string; primary_goal: string; workout_days_per_week: number; session_duration_minutes: number; program_start_date: string }
type SetDraft = { id: string; weight: number; reps: number; rir: number; done: boolean; warmup: boolean; pain: boolean }
type ActiveWorkout = { day: number; startedAt: string; current: number; sets: Record<string, SetDraft[]>; machines: Record<string, string | null> }
type ExerciseMachine = { id: string; exercise_key: string; nickname: string; brand: string | null; gym_name: string | null; seat_setting: string | null; notes: string | null; photo_path: string; photoUrl?: string }

const profileSchema = z.object({ height_cm: z.coerce.number().min(100).max(250), workout_days_per_week: z.coerce.number().min(1).max(7), session_duration_minutes: z.coerce.number().min(15).max(240) })
const measurementSchema = z.object({ weight_kg: z.coerce.number().positive().max(500), waist_cm: z.coerce.number().positive().max(300) })
const foodSchema = z.object({ name: z.string().min(1), calories: z.coerce.number().nonnegative(), protein: z.coerce.number().nonnegative(), carbs: z.coerce.number().nonnegative(), fat: z.coerce.number().nonnegative() })
const DEFAULT_PROFILE: Profile = { height_cm: 169, training_level: 'intermediate', primary_goal: 'Upper Body Hypertrophy', workout_days_per_week: 2, session_duration_minutes: 60, program_start_date: new Date().toISOString().slice(0, 10) }
const TARGETS = { calories: 2100, protein: 115, carbs: 275, fat: 60 }
const fmt = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' })

function makeActive(day: ProgramDay): ActiveWorkout {
  return { day: day.day, startedAt: new Date().toISOString(), current: 0, sets: Object.fromEntries(day.exercises.map((exercise) => [exercise.id, Array.from({ length: exercise.sets }, () => ({ id: crypto.randomUUID(), weight: 0, reps: exercise.min, rir: 2, done: false, warmup: false, pain: false }))])), machines: {} }
}
function minutesSince(iso: string) { return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)) }
function secondsLabel(value: number) { const s = Math.max(0, value); return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}` }
function currentWeekStart() { const date = new Date(); const daysFromMonday = (date.getDay() + 6) % 7; date.setDate(date.getDate() - daysFromMonday); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }

export default function Page() {
  const supabase = getSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    if (!supabase) { setChecking(false); return }
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setChecking(false) })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [supabase])
  if (!supabase) return <SetupRequired />
  if (checking) return <div className="center"><div className="spinner" /><p>กำลังเตรียมพื้นที่ฝึก…</p></div>
  if (!user) return <Auth />
  return <FitnessApp user={user} />
}

function SetupRequired() {
  return <main className="auth-page"><div className="brand-mark"><Dumbbell size={28} /></div><h1>GYM</h1><p className="muted">ระบบยังไม่ได้รับค่าเชื่อมต่อฐานข้อมูล กรุณาตั้งค่า GitHub Actions secrets ตาม README แล้ว deploy ใหม่</p></main>
}

function Auth() {
  const supabase = getSupabase()!
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('')
    const result = mode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/GYM/' } })
    setBusy(false)
    if (result.error) setMessage(result.error.message)
    else if (mode === 'signup' && !result.data.session) setMessage('ส่งอีเมลยืนยันแล้ว กรุณาตรวจกล่องข้อความ')
  }
  return <main className="auth-page"><div className="brand-mark"><Dumbbell size={28} /></div><p className="eyebrow">PERSONAL TRAINER</p><h1>ฝึกให้ชัด<br />วัดผลได้จริง</h1><p className="muted">บันทึกทุกเซต ติดตามรูปร่าง และเพิ่มความแข็งแรงอย่างเป็นระบบ</p><form className="auth-card" onSubmit={submit}><label>อีเมล<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label><label>รหัสผ่าน<input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>{message && <p className="form-message">{message}</p>}<button className="primary" disabled={busy}>{busy ? 'กำลังดำเนินการ…' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}</button></form><button className="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'ยังไม่มีบัญชี? สร้างบัญชี' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}</button></main>
}

function FitnessApp({ user }: { user: User }) {
  const supabase = getSupabase()!
  const [tab, setTab] = useState<Tab>('home')
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [foods, setFoods] = useState<FoodLog[]>([])
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [weeklyTarget, setWeeklyTarget] = useState(DEFAULT_PROFILE.workout_days_per_week)
  const [active, setActive] = useState<ActiveWorkout | null>(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const weekStart = currentWeekStart()

  useEffect(() => {
    const saved = localStorage.getItem(`gym-active-${user.id}`)
    if (saved) try { const parsed = JSON.parse(saved); setActive({ ...parsed, machines: parsed.machines ?? {} }) } catch { localStorage.removeItem(`gym-active-${user.id}`) }
    Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('body_measurements').select('*').eq('user_id', user.id).order('measured_at', { ascending: true }),
      supabase.from('food_logs').select('*').eq('user_id', user.id).gte('logged_at', new Date().toISOString().slice(0, 10)).order('logged_at'),
      supabase.from('workout_sessions').select('id,workout_name_snapshot,started_at,finished_at,duration_minutes,total_volume').eq('user_id', user.id).eq('status', 'completed').order('started_at', { ascending: false }).limit(20),
      supabase.from('weekly_training_targets').select('target_days').eq('user_id', user.id).eq('week_start_date', weekStart).maybeSingle(),
    ]).then(async ([p, m, f, s, w]) => {
      if (p.data) setProfile({ ...DEFAULT_PROFILE, ...p.data })
      else await supabase.from('profiles').insert({ id: user.id, ...DEFAULT_PROFILE })
      setWeeklyTarget(w.data?.target_days ?? p.data?.workout_days_per_week ?? DEFAULT_PROFILE.workout_days_per_week)
      setMeasurements(m.data ?? []); setFoods(f.data ?? []); setSessions(s.data ?? []); setLoading(false)
    })
  }, [supabase, user.id, weekStart])
  useEffect(() => { if (active) localStorage.setItem(`gym-active-${user.id}`, JSON.stringify(active)); else localStorage.removeItem(`gym-active-${user.id}`) }, [active, user.id])

  async function deleteSession(sessionId: string) {
    const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId).eq('user_id', user.id)
    if (error) return error.message
    setSessions((current) => current.filter((session) => session.id !== sessionId))
    setNotice('ลบประวัติการฝึกแล้ว')
    return null
  }

  async function saveWeeklyTarget(targetDays: number) {
    const { error } = await supabase.from('weekly_training_targets').upsert({ user_id: user.id, week_start_date: weekStart, target_days: targetDays, updated_at: new Date().toISOString() }, { onConflict: 'user_id,week_start_date' })
    if (error) return error.message
    setWeeklyTarget(targetDays)
    setNotice(`ตั้งเป้าสัปดาห์นี้ ${targetDays} วันแล้ว`)
    return null
  }

  const content = loading ? <div className="center"><div className="spinner" /></div> : tab === 'home' ? <Dashboard profile={profile} measurements={measurements} foods={foods} sessions={sessions} active={active} weeklyTarget={weeklyTarget} onStart={() => setTab('workout')} onDelete={deleteSession} onWeeklyTargetChange={saveWeeklyTarget} /> : tab === 'workout' ? <Workout active={active} setActive={setActive} userId={user.id} sessions={sessions} onCompleted={(session) => { setSessions((current) => [session, ...current]); setNotice('บันทึก Workout แล้ว'); setTab('home') }} /> : tab === 'nutrition' ? <Nutrition userId={user.id} foods={foods} setFoods={setFoods} /> : tab === 'progress' ? <Progress userId={user.id} measurements={measurements} setMeasurements={setMeasurements} /> : <ProfileSettings user={user} profile={profile} setProfile={setProfile} />
  return <div className="app-shell"><header><div><p className="eyebrow">GYM • WEEK {programWeek(profile.program_start_date)}</p><h1>{tabTitle(tab)}</h1></div><div className="avatar"><UserRound size={20} /></div></header>{notice && <button className="toast" onClick={() => setNotice('')}><Check size={16} />{notice}</button>}<main className="content">{content}</main><BottomNav tab={tab} setTab={setTab} /></div>
}
function tabTitle(tab: Tab) { return ({ home: 'วันนี้', workout: 'โปรแกรมฝึก', nutrition: 'โภชนาการ', progress: 'ความก้าวหน้า', settings: 'ตั้งค่า' })[tab] }
function programWeek(start: string) { return Math.min(12, Math.max(1, Math.floor((Date.now() - new Date(start).getTime()) / 604800000) + 1)) }

function Dashboard({ profile, measurements, foods, sessions, active, weeklyTarget, onStart, onDelete, onWeeklyTargetChange }: { profile: Profile; measurements: Measurement[]; foods: FoodLog[]; sessions: SessionRow[]; active?: ActiveWorkout | null; weeklyTarget: number; onStart: () => void; onDelete: (sessionId: string) => Promise<string | null>; onWeeklyTargetChange: (targetDays: number) => Promise<string | null> }) {
  const [pendingDelete, setPendingDelete] = useState<SessionRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [targetSaving, setTargetSaving] = useState(false)
  const [targetError, setTargetError] = useState('')
  const latest = measurements.at(-1)
  const previous = measurements.at(-2)
  const macros = foods.reduce((a, f) => ({ calories: a.calories + Number(f.calories_snapshot), protein: a.protein + Number(f.protein_snapshot), carbs: a.carbs + Number(f.carbs_snapshot), fat: a.fat + Number(f.fat_snapshot) }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  const thisWeek = sessions.filter((s) => new Date(s.started_at).getTime() >= new Date(`${currentWeekStart()}T00:00:00`).getTime()).length
  const activeDay = active ? PROGRAM[active.day - 1] : null
  const next = activeDay ?? PROGRAM[thisWeek % PROGRAM.length]
  const latestSession = sessions[0]
  const weightTrend = latest?.weight_kg && previous?.weight_kg ? latest.weight_kg - previous.weight_kg : null

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true); setDeleteError('')
    const error = await onDelete(pendingDelete.id)
    setDeleting(false)
    if (error) setDeleteError(error)
    else setPendingDelete(null)
  }

  async function updateWeeklyTarget(targetDays: number) {
    if (targetDays < 1 || targetDays > 7 || targetSaving) return
    setTargetSaving(true); setTargetError('')
    const error = await onWeeklyTargetChange(targetDays)
    setTargetSaving(false)
    if (error) setTargetError(error)
  }

  return <div className="stack dashboard-stack">
    <section className="today-card">
      <div className="today-topline"><span>วันนี้ฝึก</span><span>{next.exercises.length} ท่า · {profile.session_duration_minutes} นาที</span></div>
      <p className="eyebrow">DAY {next.day} · {next.focus}</p>
      <h2>{next.name}</h2>
      {active && <p className="resume-note">กำลังฝึก · ท่า {active.current + 1}/{next.exercises.length} · {next.exercises[active.current]?.en}</p>}
      <button className="primary dashboard-cta" onClick={onStart}><Play size={18} fill="currentColor" />{active ? `เล่นต่อ — ท่า ${active.current + 1}/${next.exercises.length}` : 'เริ่ม Workout'}</button>
    </section>

    <section className="home-section latest-session">
      <div className="home-heading"><h3>ครั้งล่าสุด</h3>{latestSession && <span>{sessions.length} รายการ</span>}</div>
      {latestSession ? <div className="history-list">{sessions.slice(0, 5).map((session) => <div className="session-summary" key={session.id}><div className="session-icon"><Dumbbell size={22}/></div><div><b>{session.workout_name_snapshot}</b><small>{fmt.format(new Date(session.started_at))} · {session.duration_minutes ?? 0} นาที · Volume {Math.round(session.total_volume ?? 0).toLocaleString()} kg</small></div><button className="history-delete" aria-label={`ลบประวัติ ${session.workout_name_snapshot}`} onClick={() => { setDeleteError(''); setPendingDelete(session) }}><Trash2 size={18}/></button></div>)}</div> : <div className="home-empty"><Dumbbell size={20}/><span>เมื่อฝึกครั้งแรก ผลลัพธ์จะอยู่ตรงนี้</span></div>}
    </section>

    <section className="home-section week-section">
      <div className="home-heading"><h3>สัปดาห์นี้</h3><span>{thisWeek}/{weeklyTarget} ครั้ง</span></div>
      <div className="weekly-target-row"><div><b>เป้าหมายสัปดาห์นี้</b><small>ปรับเฉพาะสัปดาห์ปัจจุบัน</small></div><div className="weekly-stepper"><button className="target-step" aria-label="ลดจำนวนวันฝึก" disabled={weeklyTarget <= 1 || targetSaving} onClick={() => updateWeeklyTarget(weeklyTarget - 1)}>−</button><strong>{weeklyTarget} วัน</strong><button className="target-step" aria-label="เพิ่มจำนวนวันฝึก" disabled={weeklyTarget >= 7 || targetSaving} onClick={() => updateWeeklyTarget(weeklyTarget + 1)}>+</button></div></div>
      {targetError && <p className="error target-error">{targetError}</p>}
      <div className="week-track">{Array.from({ length: weeklyTarget }, (_, index) => <div className={`week-day ${index < thisWeek ? 'done' : ''}`} key={index}><span>{index < thisWeek ? <Check size={15}/> : index + 1}</span><small>Day {index + 1}</small></div>)}</div>
    </section>

    <section className="home-section compact-summary">
      <div className="home-heading"><h3>สรุปวันนี้</h3><span>{Math.round(macros.calories)} / {TARGETS.calories} kcal</span></div>
      <div className="summary-row"><div><small>น้ำหนัก</small><strong>{latest?.weight_kg ? `${latest.weight_kg} kg` : '—'}</strong>{weightTrend !== null && <em>{weightTrend > 0 ? '+' : ''}{weightTrend.toFixed(1)} kg</em>}</div><div><small>รอบเอว</small><strong>{latest?.waist_cm ? `${latest.waist_cm} cm` : '—'}</strong></div><div><small>โปรตีน</small><strong>{Math.round(macros.protein)}g</strong><em>/ {TARGETS.protein}g</em></div></div>
    </section>
    {pendingDelete && <div className="modal-backdrop" onClick={() => !deleting && setPendingDelete(null)}><div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-workout-title" onClick={(event) => event.stopPropagation()}><div><p className="eyebrow">ยืนยันการลบประวัติ</p><h3 id="delete-workout-title">ลบ {pendingDelete.workout_name_snapshot}?</h3><p className="muted">เซตและรายการท่าของการฝึกครั้งนี้จะถูกลบถาวร แต่รูปเครื่องและข้อมูลสัดส่วนจะยังอยู่</p></div>{deleteError && <p className="error">{deleteError}</p>}<div className="confirm-actions"><button className="secondary" disabled={deleting} onClick={() => setPendingDelete(null)}>ยกเลิก</button><button className="danger-button" disabled={deleting} onClick={confirmDelete}>{deleting ? 'กำลังลบ…' : 'ลบถาวร'}</button></div></div></div>}
  </div>
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="metric"><span>{icon}</span><p>{label}</p><strong>{value}</strong></div> }
function Macro({ label, value, target }: { label: string; value: number; target: number }) { const percent = Math.min(100, value / target * 100); return <div className="macro"><div><span>{label}</span><b>{Math.round(value)} / {target}g</b></div><div className="progress"><i style={{ width: `${percent}%` }} /></div></div> }
function SectionTitle({ title, action }: { title: string; action?: string }) { return <div className="section-title"><h3>{title}</h3>{action && <span>{action}</span>}</div> }
function Empty({ text }: { text: string }) { return <div className="empty"><BarChart3 /><p>{text}</p></div> }

function Workout({ active, setActive, userId, sessions, onCompleted }: { active: ActiveWorkout | null; setActive: (a: ActiveWorkout | null) => void; userId: string; sessions: SessionRow[]; onCompleted: (s: SessionRow) => void }) {
  const supabase = getSupabase()!
  const [restUntil, setRestUntil] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [machines, setMachines] = useState<ExerciseMachine[]>([])
  const [machineOpen, setMachineOpen] = useState(false)
  const currentExerciseKey = active ? PROGRAM[active.day - 1]?.exercises[active.current]?.id : null
  useEffect(() => {
    if (!currentExerciseKey) { setMachines([]); return }
    supabase.from('exercise_machines').select('*').eq('user_id', userId).eq('exercise_key', currentExerciseKey).order('last_used_at', { ascending: false, nullsFirst: false }).then(async ({ data }) => {
      const rows = (data ?? []) as ExerciseMachine[]
      const withUrls = await Promise.all(rows.map(async (machine) => {
        const { data: signed } = await supabase.storage.from('machine-photos').createSignedUrl(machine.photo_path, 3600)
        return { ...machine, photoUrl: signed?.signedUrl }
      }))
      setMachines(withUrls)
    })
  }, [currentExerciseKey, supabase, userId])
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  if (!active) return <div className="stack">{PROGRAM.map((day) => <section className="program-card" key={day.day}><div className="day-number">0{day.day}</div><div><p className="eyebrow">60 MIN • {day.exercises.length} EXERCISES</p><h2>{day.name}</h2><p>{day.focus}</p><div className="exercise-preview">{day.exercises.slice(0, 4).map((e) => <span key={e.id}>{e.en}</span>)}</div><button className="primary" onClick={() => setActive(makeActive(day))}>เริ่ม Day {day.day}<ChevronRight size={18} /></button></div></section>)}</div>
  const day = PROGRAM[active.day - 1]; const exercise = day.exercises[active.current]; const sets = active.sets[exercise.id]
  function updateSet(index: number, patch: Partial<SetDraft>) { setActive({ day: active!.day, startedAt: active!.startedAt, current: active!.current, sets: { ...active!.sets, [exercise.id]: sets.map((s, i) => i === index ? { ...s, ...patch } : s) }, machines: active!.machines ?? {} }) }
  function done(index: number) { updateSet(index, { done: !sets[index].done }); if (!sets[index].done) setRestUntil(Date.now() + exercise.rest * 1000) }
  async function finish() {
    setSaving(true); setError('')
    const currentActive = active!
    const allSets = day.exercises.flatMap((e) => currentActive.sets[e.id])
    const volume = workoutVolume(allSets)
    const duration = minutesSince(currentActive.startedAt)
    const { data: session, error: sessionError } = await supabase.from('workout_sessions').insert({ user_id: userId, workout_day_id: null, workout_name_snapshot: day.name, started_at: currentActive.startedAt, finished_at: new Date().toISOString(), status: 'completed', duration_minutes: duration, total_volume: volume }).select().single()
    if (sessionError) { setError(sessionError.message); setSaving(false); return }
    for (let index = 0; index < day.exercises.length; index++) {
      const e = day.exercises[index]
      const machineId = currentActive.machines?.[e.id] ?? null
      const { data: machine } = machineId ? await supabase.from('exercise_machines').select('nickname,photo_path').eq('id', machineId).single() : { data: null }
      const { data: se, error: seError } = await supabase.from('workout_session_exercises').insert({ session_id: session.id, exercise_id: null, sort_order: index, exercise_name_snapshot: e.en, weight_tracking_type_snapshot: 'per_side', machine_id: machineId, machine_name_snapshot: machine?.nickname ?? null, machine_photo_path_snapshot: machine?.photo_path ?? null }).select().single()
      if (machineId) await supabase.from('exercise_machines').update({ last_used_at: new Date().toISOString() }).eq('id', machineId)
      if (seError) { setError(seError.message); setSaving(false); return }
      const rows = currentActive.sets[e.id].map((s, i) => ({ id: s.id, session_exercise_id: se.id, set_number: i + 1, weight_kg: s.weight, reps: s.reps, rir: s.rir, completed_at: s.done ? new Date().toISOString() : null, is_warmup: s.warmup, technique_ok: true, pain_reported: s.pain }))
      const { error: insertSetError } = await supabase.from('workout_sets').insert(rows); if (insertSetError) { setError(insertSetError.message); setSaving(false); return }
    }
    setActive(null); setSaving(false); onCompleted(session as SessionRow)
  }
  const recommendation = recommendProgression({ weight: sets[0]?.weight ?? 0, reps: sets.filter((s) => s.done).map((s) => s.reps), rirs: sets.filter((s) => s.done).map((s) => s.rir), sets: exercise.sets, repMin: exercise.min, repMax: exercise.max, increment: exercise.increment, pain: sets.some((s) => s.pain), techniqueOk: true })
  const remaining = Math.ceil((restUntil - now) / 1000)
  const selectedMachine = machines.find((machine) => machine.id === active.machines?.[exercise.id])
  function selectMachine(machine: ExerciseMachine) {
    setActive({ ...active!, machines: { ...(active!.machines ?? {}), [exercise.id]: machine.id } })
    setMachineOpen(false)
  }
  return <div className="active-workout"><div className="workout-sticky"><div><p className="eyebrow">{active.current + 1}/{day.exercises.length} • {minutesSince(active.startedAt)} MIN</p><h2>{day.name}</h2></div><button className="danger-link" onClick={finish} disabled={saving}>{saving ? 'กำลังบันทึก…' : 'จบการฝึก'}</button></div>{remaining > 0 && <div className="rest-banner"><TimerReset /><div><small>REST TIMER</small><strong>{secondsLabel(remaining)}</strong></div><button onClick={() => setRestUntil(restUntil + 15000)}>+15s</button><button onClick={() => setRestUntil(0)}>ข้าม</button></div>}<section className="exercise-main"><div className="exercise-visual machine-visual">{selectedMachine?.photoUrl ? <img src={selectedMachine.photoUrl} alt={selectedMachine.nickname}/> : <><Dumbbell size={38} /><span>{exercise.muscle}</span></>}</div><div><p className="eyebrow">{exercise.sets} SETS • {exercise.min}–{exercise.max} REPS • REST {exercise.rest}s</p><h1>{exercise.en}</h1><p>{exercise.th}</p>{selectedMachine && <small className="machine-label">เครื่อง: {selectedMachine.nickname}{selectedMachine.seat_setting ? ` • เบาะ ${selectedMachine.seat_setting}` : ''}</small>}</div></section><button className="machine-button" onClick={() => setMachineOpen(true)}><Camera size={20}/><div><b>{selectedMachine ? 'เปลี่ยนเครื่อง / ดูรูป' : 'ถ่ายรูปเครื่องนี้'}</b><small>{selectedMachine ? selectedMachine.nickname : 'จำเครื่องและน้ำหนักให้ถูกตัวในครั้งหน้า'}</small></div><ChevronRight size={18}/></button><div className="set-header"><span>SET</span><span>KG</span><span>REPS</span><span>RIR</span><span>DONE</span></div>{sets.map((set, index) => <div className={`set-row ${set.done ? 'completed' : ''}`} key={set.id}><b>{index + 1}</b><input aria-label={`น้ำหนักเซต ${index + 1}`} type="number" inputMode="decimal" value={set.weight} onChange={(e) => updateSet(index, { weight: Number(e.target.value) })}/><input aria-label={`จำนวนครั้งเซต ${index + 1}`} type="number" inputMode="numeric" value={set.reps} onChange={(e) => updateSet(index, { reps: Number(e.target.value) })}/><input aria-label={`RIR เซต ${index + 1}`} type="number" inputMode="numeric" min="0" max="5" value={set.rir} onChange={(e) => updateSet(index, { rir: Number(e.target.value) })}/><button aria-label={`บันทึกเซต ${index + 1}`} className="done-button" onClick={() => done(index)}>{set.done && <Check />}</button></div>)}<label className="pain-toggle"><input type="checkbox" checked={sets.some((s) => s.pain)} onChange={(e) => setActive({ ...active, sets: { ...active.sets, [exercise.id]: sets.map((s) => ({ ...s, pain: e.target.checked })) } })}/> มีอาการเจ็บจากท่านี้</label><div className={`recommendation ${recommendation.action}`}><TrendingUp /><div><b>คำแนะนำครั้งถัดไป</b><p>{recommendation.reason}{recommendation.action === 'increase' ? ` (${recommendation.recommendedWeight} กก.)` : ''}</p></div></div>{error && <p className="error">{error}</p>}<div className="workout-nav"><button className="secondary" disabled={active.current === 0} onClick={() => setActive({ ...active, current: active.current - 1 })}>ก่อนหน้า</button>{active.current < day.exercises.length - 1 ? <button className="primary" onClick={() => setActive({ ...active, current: active.current + 1 })}>ท่าถัดไป<ChevronRight /></button> : <button className="primary" onClick={finish} disabled={saving}>บันทึก Workout<Check /></button>}</div>{sessions.length > 0 && <p className="muted tiny">Workout ล่าสุด: {fmt.format(new Date(sessions[0].started_at))}</p>}{machineOpen && <MachinePicker userId={userId} exerciseKey={exercise.id} machines={machines} onSelect={selectMachine} onCreated={(machine) => { setMachines([machine, ...machines]); selectMachine(machine) }} onClose={() => setMachineOpen(false)}/>}</div>
}

function MachinePicker({ userId, exerciseKey, machines, onSelect, onCreated, onClose }: { userId: string; exerciseKey: string; machines: ExerciseMachine[]; onSelect: (machine: ExerciseMachine) => void; onCreated: (machine: ExerciseMachine) => void; onClose: () => void }) {
  const supabase = getSupabase()!
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  function chooseFile(next: File | null) {
    if (!next) return
    if (!next.type.startsWith('image/')) { setError('กรุณาเลือกไฟล์รูปภาพ'); return }
    if (next.size > 8 * 1024 * 1024) { setError('รูปต้องมีขนาดไม่เกิน 8 MB'); return }
    if (preview) URL.revokeObjectURL(preview)
    setFile(next); setPreview(URL.createObjectURL(next)); setError('')
  }
  async function createMachine(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!file) { setError('ถ่ายรูปเครื่องก่อนบันทึก'); return }
    setSaving(true); setError('')
    const form = new FormData(event.currentTarget)
    const id = crypto.randomUUID()
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const photoPath = `${userId}/${id}/${Date.now()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('machine-photos').upload(photoPath, file, { contentType: file.type, upsert: false })
    if (uploadError) { setError(uploadError.message); setSaving(false); return }
    const row = { id, user_id: userId, exercise_key: exerciseKey, nickname: String(form.get('nickname')), brand: String(form.get('brand') || '') || null, gym_name: String(form.get('gym_name') || '') || null, seat_setting: String(form.get('seat_setting') || '') || null, notes: String(form.get('notes') || '') || null, photo_path: photoPath, last_used_at: new Date().toISOString() }
    const { data, error: insertError } = await supabase.from('exercise_machines').insert(row).select().single()
    if (insertError) { await supabase.storage.from('machine-photos').remove([photoPath]); setError(insertError.message); setSaving(false); return }
    const { data: signed } = await supabase.storage.from('machine-photos').createSignedUrl(photoPath, 3600)
    setSaving(false); onCreated({ ...(data as ExerciseMachine), photoUrl: signed?.signedUrl })
  }
  return <div className="modal-backdrop" onClick={onClose}><div className="modal machine-modal" onClick={(event) => event.stopPropagation()}><SectionTitle title="เลือกหรือถ่ายรูปเครื่อง" action={`${machines.length} เครื่อง`}/>{machines.length > 0 && <div className="machine-list">{machines.map((machine) => <button key={machine.id} className="machine-card" onClick={() => onSelect(machine)}>{machine.photoUrl ? <img src={machine.photoUrl} alt={machine.nickname}/> : <Camera/>}<div><b>{machine.nickname}</b><small>{[machine.brand, machine.gym_name, machine.seat_setting ? `เบาะ ${machine.seat_setting}` : ''].filter(Boolean).join(' • ') || 'แตะเพื่อเลือกเครื่องนี้'}</small></div><ChevronRight/></button>)}</div>}<form className="machine-form" onSubmit={createMachine}><p className="eyebrow">เพิ่มเครื่องใหม่</p><label className="camera-capture">{preview ? <img src={preview} alt="รูปเครื่องใหม่"/> : <><Camera size={32}/><b>เปิดกล้องถ่ายเครื่อง</b><span>ถ่ายให้เห็นตัวเครื่องและแผ่นน้ำหนัก</span></>}<input type="file" accept="image/*" capture="environment" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}/></label><label>ชื่อเรียกเครื่อง<input name="nickname" required placeholder="เช่น Chest Press ตัวริมหน้าต่าง"/></label><div className="form-grid"><label>ยี่ห้อ<input name="brand" placeholder="Technogym"/></label><label>ตำแหน่งเบาะ<input name="seat_setting" placeholder="เช่น 4"/></label></div><label>ชื่อยิม/สาขา<input name="gym_name" placeholder="เช่น Fitness First พระราม 9"/></label><label>หมายเหตุ<input name="notes" placeholder="เช่น น้ำหนักเครื่องนี้รู้สึกหนักกว่าตัวอื่น"/></label>{error && <p className="error">{error}</p>}<button className="primary full" disabled={saving}>{saving ? 'กำลังอัปโหลด…' : 'บันทึกและใช้เครื่องนี้'}</button></form></div></div>
}

function Nutrition({ userId, foods, setFoods }: { userId: string; foods: FoodLog[]; setFoods: (f: FoodLog[]) => void }) {
  const supabase = getSupabase()!; const [open, setOpen] = useState(false); const [error, setError] = useState('')
  const total = useMemo(() => foods.reduce((a, f) => ({ calories: a.calories + Number(f.calories_snapshot), protein: a.protein + Number(f.protein_snapshot), carbs: a.carbs + Number(f.carbs_snapshot), fat: a.fat + Number(f.fat_snapshot) }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [foods])
  async function add(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); const form = new FormData(e.currentTarget); const parsed = foodSchema.safeParse(Object.fromEntries(form)); if (!parsed.success) { setError('กรอกข้อมูลให้ครบและเป็นตัวเลขบวก'); return } const row = { user_id: userId, logged_at: new Date().toISOString(), meal_type: String(form.get('meal')), food_name_snapshot: parsed.data.name, calories_snapshot: parsed.data.calories, protein_snapshot: parsed.data.protein, carbs_snapshot: parsed.data.carbs, fat_snapshot: parsed.data.fat }; const { data, error } = await supabase.from('food_logs').insert(row).select().single(); if (error) setError(error.message); else { setFoods([...foods, data]); setOpen(false) } }
  return <div className="stack"><section className="nutrition-ring"><div><strong>{Math.round(total.calories)}</strong><span>/{TARGETS.calories} kcal</span></div><p>พลังงานวันนี้</p></section><section className="card"><Macro label="โปรตีน" value={total.protein} target={TARGETS.protein}/><Macro label="คาร์บ" value={total.carbs} target={TARGETS.carbs}/><Macro label="ไขมัน" value={total.fat} target={TARGETS.fat}/></section><button className="primary full" onClick={() => setOpen(true)}><Plus/>เพิ่มอาหาร</button><section className="card"><SectionTitle title="รายการวันนี้" action={`${foods.length} รายการ`}/>{foods.length ? foods.map((food) => <div className="food-row" key={food.id}><div><b>{food.food_name_snapshot}</b><small>{food.meal_type} • {Math.round(food.protein_snapshot)}g โปรตีน</small></div><strong>{Math.round(food.calories_snapshot)} kcal</strong></div>) : <Empty text="ยังไม่มีรายการอาหารวันนี้"/>}</section>{open && <div className="modal-backdrop" onClick={() => setOpen(false)}><form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={add}><SectionTitle title="เพิ่มอาหาร"/><label>ชื่ออาหาร<input name="name" list="foods" required/><datalist id="foods">{THAI_FOODS.map((f) => <option key={f}>{f}</option>)}</datalist></label><div className="form-grid"><label>แคลอรี<input name="calories" type="number" inputMode="decimal" required/></label><label>โปรตีน (g)<input name="protein" type="number" inputMode="decimal" required/></label><label>คาร์บ (g)<input name="carbs" type="number" inputMode="decimal" required/></label><label>ไขมัน (g)<input name="fat" type="number" inputMode="decimal" required/></label></div><label>มื้อ<select name="meal"><option>เช้า</option><option>กลางวัน</option><option>เย็น</option><option>ของว่าง</option></select></label><p className="muted tiny">กรุณากรอกค่าจากฉลากหรือแหล่งข้อมูลที่เชื่อถือได้ ค่าอาหารทั่วไปเป็นเพียงตัวช่วยค้นหา ไม่ได้เติมโภชนาการอัตโนมัติ</p>{error && <p className="error">{error}</p>}<button className="primary full">บันทึก</button></form></div>}</div>
}

function Progress({ userId, measurements, setMeasurements }: { userId: string; measurements: Measurement[]; setMeasurements: (m: Measurement[]) => void }) {
  const supabase = getSupabase()!; const [open, setOpen] = useState(false); const [error, setError] = useState('')
  async function add(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)); const parsed = measurementSchema.safeParse(values); if (!parsed.success) { setError('กรอกน้ำหนักและรอบเอวให้ถูกต้อง'); return } const { data, error } = await supabase.from('body_measurements').insert({ user_id: userId, measured_at: new Date().toISOString(), ...parsed.data }).select().single(); if (error) setError(error.message); else { setMeasurements([...measurements, data]); setOpen(false) } }
  const latest = measurements.at(-1); const first = measurements[0]
  return <div className="stack"><button className="primary full" onClick={() => setOpen(true)}><Plus/>บันทึกสัดส่วน</button><section className="metric-grid"><Metric label="น้ำหนักล่าสุด" value={latest?.weight_kg ? `${latest.weight_kg} kg` : '—'} icon={<Activity/>}/><Metric label="เปลี่ยนแปลง" value={latest?.weight_kg && first?.weight_kg ? `${(latest.weight_kg - first.weight_kg).toFixed(1)} kg` : '—'} icon={<TrendingUp/>}/><Metric label="รอบเอวล่าสุด" value={latest?.waist_cm ? `${latest.waist_cm} cm` : '—'} icon={<RotateCcw/>}/><Metric label="จำนวนบันทึก" value={`${measurements.length} ครั้ง`} icon={<BarChart3/>}/></section><section className="card chart-card"><SectionTitle title="น้ำหนักและรอบเอว" action="ทั้งหมด"/>{measurements.length ? <ResponsiveContainer width="100%" height={260}><AreaChart data={measurements.map((m) => ({ date: fmt.format(new Date(m.measured_at)), weight: m.weight_kg, waist: m.waist_cm }))}><CartesianGrid stroke="#E5E5EA" vertical={false}/><XAxis dataKey="date" stroke="#86868B"/><YAxis stroke="#86868B"/><Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1D1D1F' }}/><Area dataKey="weight" name="น้ำหนัก" stroke="#111111" fill="#11111122"/><Area dataKey="waist" name="รอบเอว" stroke="#60a5fa" fill="#60a5fa11"/></AreaChart></ResponsiveContainer> : <Empty text="ยังไม่มีข้อมูลสัดส่วน"/>}</section>{open && <div className="modal-backdrop" onClick={() => setOpen(false)}><form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={add}><SectionTitle title="บันทึกสัดส่วนวันนี้"/><label>น้ำหนัก (kg)<input name="weight_kg" type="number" step="0.1" inputMode="decimal" required/></label><label>รอบเอว (cm)<input name="waist_cm" type="number" step="0.1" inputMode="decimal" required/></label>{error && <p className="error">{error}</p>}<button className="primary full">บันทึก</button></form></div>}</div>
}

function ProfileSettings({ user, profile, setProfile }: { user: User; profile: Profile; setProfile: (p: Profile) => void }) {
  const supabase = getSupabase()!; const [saved, setSaved] = useState(false); const [error, setError] = useState('')
  async function save(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)); const parsed = profileSchema.safeParse(values); if (!parsed.success) { setError('ตรวจสอบส่วนสูง จำนวนวัน และระยะเวลาฝึก'); return } const next = { ...profile, ...parsed.data, training_level: String(values.training_level), primary_goal: String(values.primary_goal), program_start_date: String(values.program_start_date) }; const { error } = await supabase.from('profiles').upsert({ id: user.id, ...next }); if (error) setError(error.message); else { setProfile(next); setSaved(true); setTimeout(() => setSaved(false), 2000) } }
  return <div className="stack"><form className="card settings-form" onSubmit={save}><SectionTitle title="โปรไฟล์การฝึก"/><label>ส่วนสูง (cm)<input name="height_cm" type="number" defaultValue={profile.height_cm}/></label><label>ระดับ<select name="training_level" defaultValue={profile.training_level}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label>เป้าหมาย<input name="primary_goal" defaultValue={profile.primary_goal}/></label><div className="form-grid"><label>วันฝึก/สัปดาห์<input name="workout_days_per_week" type="number" defaultValue={profile.workout_days_per_week}/></label><label>นาที/ครั้ง<input name="session_duration_minutes" type="number" defaultValue={profile.session_duration_minutes}/></label></div><label>วันเริ่มโปรแกรม<input name="program_start_date" type="date" defaultValue={profile.program_start_date}/></label>{error && <p className="error">{error}</p>}<button className="primary full">{saved ? 'บันทึกแล้ว ✓' : 'บันทึกการตั้งค่า'}</button></form><section className="card"><SectionTitle title="บัญชี"/><p className="muted">{user.email}</p><button className="secondary full" onClick={() => supabase.auth.signOut()}><LogOut/>ออกจากระบบ</button></section><section className="card warning"><b>ข้อมูลสุขภาพ</b><p>ข้อมูลส่วนบุคคลถูกจำกัดด้วย Row Level Security และเข้าถึงได้เฉพาะบัญชีนี้</p></section></div>
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: Array<[Tab, string, React.ReactNode]> = [['home','วันนี้',<Home key="h"/>],['workout','ฝึก',<Dumbbell key="w"/>],['nutrition','อาหาร',<Apple key="n"/>],['progress','ผลลัพธ์',<BarChart3 key="p"/>],['settings','ตั้งค่า',<Settings key="s"/>]]
  return <nav className="bottom-nav">{items.map(([id,label,icon]) => <button key={id} aria-label={label} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{icon}<span>{label}</span></button>)}</nav>
}
