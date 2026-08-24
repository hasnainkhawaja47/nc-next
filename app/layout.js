import './globals.css'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ActivityProvider } from '@/lib/activity-context'
import AppShell from '@/components/AppShell'
import { TooltipProvider } from '@/components/ui/tooltip'
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata = { title: 'Needle Craft Manager' }

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ActivityProvider>
          <TooltipProvider>
            <AppShell>{children}</AppShell>
          </TooltipProvider>
        </ActivityProvider>
        <Toaster position="top-center" closeButton />
      </body>
    </html>
  )
}