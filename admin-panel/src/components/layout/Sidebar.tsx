'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  CreditCard,
  AlertTriangle,
  Star,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  Shield,
  UserCheck,
  Phone,
  DollarSign,
  Clock,
  Activity,
} from 'lucide-react'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Approvals', href: '/approvals', icon: UserCheck, badge: 'pending' },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Drivers', href: '/drivers', icon: Car },
  { name: 'Rides', href: '/rides', icon: MapPin },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Emergencies', href: '/emergencies', icon: AlertTriangle, badge: 'urgent' },
  { name: 'Reviews', href: '/reviews', icon: Star },
  { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const quickStats = [
  { name: 'Active Users', value: '1,234', icon: Users, change: '+12%' },
  { name: 'Pending Approvals', value: '23', icon: Clock, change: '+5' },
  { name: 'Open Emergencies', value: '2', icon: AlertTriangle, change: '-1' },
  { name: 'Today\'s Revenue', value: 'KSH 45,678', icon: DollarSign, change: '+8%' },
]

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn(
      'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-black" />
            <span className="text-xl font-bold text-black">MOTO Admin</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5 text-gray-600" />
          ) : (
            <X className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group',
                isActive
                  ? 'bg-gray-100 text-black'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-black'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 flex-shrink-0',
                isActive ? 'text-black' : 'text-gray-400 group-hover:text-black'
              )} />
              {!isCollapsed && (
                <>
                  <span className="ml-3 truncate">{item.name}</span>
                  {item.badge && (
                    <span className={cn(
                      'ml-auto px-2 py-1 text-xs font-medium rounded-full',
                      item.badge === 'urgent'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Quick Stats */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Stats
          </h3>
          <div className="space-y-3">
            {quickStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-600">{stat.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-black">{stat.value}</div>
                    <div className="text-xs text-green-600">{stat.change}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
