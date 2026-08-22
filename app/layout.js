import './globals.css'
import { Geist, Geist_Mono } from 'next/font/google'
import Sidebar from '@/components/Sidebar'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Needle Craft Manager',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}