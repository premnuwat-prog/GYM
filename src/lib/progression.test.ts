import { describe, expect, it } from 'vitest'
import { recommendProgression, workoutVolume } from './progression'

describe('recommendProgression', () => {
  it('เพิ่มน้ำหนักเมื่อครบทุกเซตที่ rep สูงสุดและ RIR อย่างน้อย 1', () => {
    expect(recommendProgression({ weight: 12, reps: [12, 12, 12], rirs: [2, 2, 1], sets: 3, repMin: 8, repMax: 12, increment: 2, pain: false, techniqueOk: true })).toMatchObject({ action: 'increase', recommendedWeight: 14 })
  })

  it('คงน้ำหนักเมื่อจำนวนครั้งยังอยู่ในช่วงเป้าหมาย', () => {
    expect(recommendProgression({ weight: 12, reps: [12, 11, 10], rirs: [2, 2, 1], sets: 3, repMin: 8, repMax: 12, increment: 2, pain: false, techniqueOk: true }).action).toBe('maintain')
  })

  it('หยุด progression เมื่อรายงานอาการเจ็บ', () => {
    expect(recommendProgression({ weight: 12, reps: [12, 12, 12], rirs: [2, 2, 2], sets: 3, repMin: 8, repMax: 12, increment: 2, pain: true, techniqueOk: true }).action).toBe('pain')
  })

  it('ลดน้ำหนักเมื่อทำต่ำกว่า rep ขั้นต่ำ', () => {
    expect(recommendProgression({ weight: 20, reps: [6, 6, 5], rirs: [0, 0, 0], sets: 3, repMin: 8, repMax: 12, increment: 2, pain: false, techniqueOk: false })).toMatchObject({ action: 'reduce', recommendedWeight: 18 })
  })
})

describe('workoutVolume', () => {
  it('รวมเฉพาะ working sets ที่เสร็จแล้ว', () => {
    expect(workoutVolume([{ weight: 10, reps: 10, done: true, warmup: false }, { weight: 20, reps: 5, done: false, warmup: false }, { weight: 5, reps: 10, done: true, warmup: true }])).toBe(100)
  })
})
