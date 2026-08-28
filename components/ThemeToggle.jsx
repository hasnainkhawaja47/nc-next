'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { SidebarMenuButton } from '@/components/ui/sidebar'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // Avoid rendering theme-dependent UI until mounted, since the server
  // can't know the user's system/stored preference (hydration mismatch).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <SidebarMenuButton
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun /> : <Moon />}
      <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
    </SidebarMenuButton>
  )
}