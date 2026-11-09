import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const page = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8')
const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
const layout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8')
const dashboard = page.slice(page.indexOf('function Dashboard'), page.indexOf('function Metric'))

describe('clean white mobile dashboard contract', () => {
  it('uses a light white canvas and matching browser chrome', () => {
    expect(css).toContain('color-scheme:light')
    expect(css).toContain('--bg:#FFFFFF')
    expect(layout).toContain("themeColor: '#FFFFFF'")
  })

  it('prioritizes today, latest workout, weekly progress, and compact summary', () => {
    expect(dashboard).toContain('วันนี้ฝึก')
    expect(dashboard).toContain('ครั้งล่าสุด')
    expect(dashboard).toContain('สัปดาห์นี้')
    expect(dashboard).toContain('สรุปวันนี้')
    expect(dashboard).not.toContain('chart-card')
    expect(dashboard).not.toContain('metric-grid')
  })

  it('supports a single contextual resume or start action', () => {
    expect(dashboard).toContain('active?: ActiveWorkout | null')
    expect(dashboard).toContain('เล่นต่อ')
    expect(dashboard).toContain('เริ่ม Workout')
  })
})
