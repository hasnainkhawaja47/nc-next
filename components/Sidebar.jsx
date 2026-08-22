'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/new-bill', label: 'New Bill' },
  { href: '/payments', label: 'Payments' },
  { href: '/clients', label: 'Clients' },
  { href: '/products', label: 'Products' },
  { href: '/reports', label: 'Reports' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="w-56 shrink-0 bg-[#1a1a2e] text-white h-screen flex flex-col p-4">
      <div className="mb-6">
        <div className="font-semibold">Needle Craft</div>
        <div className="text-xs text-gray-400">Manager</div>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded text-sm ${
              pathname === link.href ? 'bg-[#2a2a4e] text-[#C8A951]' : 'text-gray-300 hover:bg-[#2a2a4e]'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <button
        onClick={handleSignOut}
        className="text-left px-3 py-2 rounded text-sm text-red-300 hover:bg-[#2a2a4e] mt-4"
      >
        Sign out
      </button>
    </nav>
  )
}