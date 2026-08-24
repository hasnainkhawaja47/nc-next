'use client'

import { usePathname } from 'next/navigation'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import AppSidebar from '@/components/AppSidebar'
import ActivityPanel from '@/components/ActivityPanel'

export default function AppShell({ children }) {
  const pathname = usePathname()

  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="sticky top-0 z-30 flex items-center h-12 px-3 border-b bg-background">
          <SidebarTrigger />
        </div>
        <div className="max-w-6xl w-full mx-auto">
          {children}
        </div>
      </SidebarInset>
      <ActivityPanel />
    </SidebarProvider>
  )
}