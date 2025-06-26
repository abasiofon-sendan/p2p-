"use client"

import type React from "react"

import { useApp } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, TrendingUp, Plus, MessageSquare, Settings, LogOut, Wallet, Shield } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { state, logout, connectWallet } = useApp()
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Orders", href: "/orders", icon: TrendingUp },
    { name: "Create Order", href: "/place-order", icon: Plus },
    { name: "Disputes", href: "/disputes", icon: MessageSquare },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  const adminNavigation = [{ name: "Admin Dashboard", href: "/admin/dashboard", icon: Shield }]

  const isActive = (href: string) => pathname === href

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Image src="/logo.png" alt="Logo" width={180} height={40} className="" />
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Button onClick={connectWallet} variant="outline" size="sm">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
              <div className="text-sm">
                <p className="font-medium">{state.user?.email}</p>
                <p className="text-gray-500">
                  Balance: ${(state.walletBalance.usdt + state.walletBalance.usdc).toFixed(2)}
                </p>
              </div>
              <Button onClick={logout} variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-screen">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button variant={isActive(item.href) ? "default" : "ghost"} className="w-full justify-start">
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Button>
              </Link>
            ))}

            {state.user?.isAdmin && (
              <>
                <div className="pt-4 mt-4 border-t">
                  <p className="text-xs font-medium text-gray-500 mb-2">ADMIN</p>
                  {adminNavigation.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <Button variant={isActive(item.href) ? "destructive" : "ghost"} className="w-full justify-start">
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
