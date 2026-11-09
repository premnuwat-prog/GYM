import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GYM — Personal Trainer',
  description: 'ผู้ช่วยติดตามการฝึก กล้ามเนื้อ โภชนาการ และรูปร่าง',
  applicationName: 'GYM',
  manifest: '/GYM/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'GYM', statusBarStyle: 'black-translucent' },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover', themeColor: '#0B0F14' }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>
}
