export type ProgressionInput = {
  weight: number
  reps: number[]
  rirs: number[]
  sets: number
  repMin: number
  repMax: number
  increment: number
  pain: boolean
  techniqueOk: boolean
}

export type ProgressionResult = {
  action: 'increase' | 'maintain' | 'reduce' | 'pain'
  recommendedWeight: number
  reason: string
}

export function recommendProgression(input: ProgressionInput): ProgressionResult {
  if (input.pain) {
    return { action: 'pain', recommendedWeight: input.weight, reason: 'มีรายงานอาการเจ็บ จึงหยุดการเพิ่มน้ำหนักอัตโนมัติและควรหยุดท่าที่ทำให้เจ็บ' }
  }
  const allSetsCompleted = input.reps.length >= input.sets
  const hitTop = allSetsCompleted && input.reps.every((rep) => rep >= input.repMax)
  const enoughReserve = input.rirs.length >= input.sets && input.rirs.every((rir) => rir >= 1)
  if (hitTop && enoughReserve && input.techniqueOk) {
    return { action: 'increase', recommendedWeight: input.weight + input.increment, reason: `ทำครบ ${input.sets} เซตที่ ${input.repMax} ครั้ง ฟอร์มผ่านและยังเหลือแรง แนะนำเพิ่มน้ำหนักระดับถัดไป` }
  }
  const belowMinimum = allSetsCompleted && input.reps.every((rep) => rep < input.repMin)
  if (belowMinimum || !input.techniqueOk) {
    return { action: 'reduce', recommendedWeight: Math.max(0, Math.round(input.weight * 0.9 * 2) / 2), reason: 'จำนวนครั้งต่ำกว่าเป้าหมายหรือฟอร์มเริ่มเสีย แนะนำลดน้ำหนักประมาณ 5–10%' }
  }
  return { action: 'maintain', recommendedWeight: input.weight, reason: 'จำนวนครั้งอยู่ในช่วงเป้าหมาย ให้คงน้ำหนักและเพิ่มจำนวนครั้งก่อน' }
}

export function workoutVolume(sets: Array<{ weight: number; reps: number; done: boolean; warmup: boolean }>): number {
  return sets.filter((set) => set.done && !set.warmup).reduce((total, set) => total + set.weight * set.reps, 0)
}
