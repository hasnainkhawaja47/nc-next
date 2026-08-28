'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar'
import { LayoutDashboard, FileText, Wallet, Users, Package, BarChart3, LogOut, Scissors } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/new-bill', label: 'New Bill', icon: FileText },
    { href: '/payments', label: 'Payments', icon: Wallet },
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
]

export default function AppSidebar() {
    const pathname = usePathname()
    const router = useRouter()

    async function handleSignOut() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="py-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#C8A951] flex items-center justify-center shrink-0">
                        <Scissors className="w-4 h-4 text-[#1a1a2e]" />
                    </div>
                    <div className="overflow-hidden transition-[opacity,width] duration-200 ease-linear group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                        <div className="text-sm font-semibold leading-none whitespace-nowrap">Needle Craft</div>
                        <div className="text-xs text-gray-400 whitespace-nowrap">Manager</div>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {links.map((link) => {
                                const Icon = link.icon
                                return (
                                    <SidebarMenuItem key={link.href}>
                                        <SidebarMenuButton
                                            render={<Link href={link.href} />}
                                            isActive={pathname === link.href}
                                            onClick={
                                                link.href === '/new-bill'
                                                    ? () => window.dispatchEvent(new Event('reset-new-bill'))
                                                    : undefined
                                            }
                                        >
                                            <Icon />
                                            <span>{link.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <ThemeToggle />
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleSignOut} className="text-red-500 hover:text-red-600">
                            <LogOut />
                            <span>Sign out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}