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
        <div className="p-2 border-b sm:hidden">
          <SidebarTrigger />
        </div>
        {children}
      </SidebarInset>
      <ActivityPanel />
    </SidebarProvider>
  )
}