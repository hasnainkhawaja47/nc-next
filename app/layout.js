import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata = {
  title: 'Needle Craft Manager',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">{children}</main>
        </div>
      </body>
    </html>
  )
}