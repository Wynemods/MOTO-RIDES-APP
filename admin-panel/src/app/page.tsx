'use client'

import React, { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { cn } from '@/lib/utils'
import {
  Users,
  UserPlus,
  Clock,
  AlertTriangle,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Car,
  Star,
  Phone,
} from 'lucide-react'

interface DashboardStats {
  activeUsers: number
  newSignups: number
  pendingApprovals: number
  openEmergencies: number
  totalRides: number
  totalRevenue: number
  cancellationRate: number
  driverAcceptanceRate: number
}

interface RecentActivity {
  id: string
  type: 'ride' | 'user' | 'driver' | 'emergency'
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  React.useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      setIsLoadingStats(true)
      
      // Simulate API call
      setTimeout(() => {
        setStats({
          activeUsers: 1234,
          newSignups: 45,
          pendingApprovals: 23,
          openEmergencies: 2,
          totalRides: 567,
          totalRevenue: 45678,
          cancellationRate: 12.5,
          driverAcceptanceRate: 87.3,
        })

        setRecentActivity([
          {
            id: '1',
            type: 'emergency',
            description: 'Emergency alert from John Doe',
            timestamp: '2 minutes ago',
            status: 'error',
          },
          {
            id: '2',
            type: 'ride',
            description: 'New ride completed - KSH 450',
            timestamp: '5 minutes ago',
            status: 'success',
          },
          {
            id: '3',
            type: 'driver',
            description: 'Driver verification approved',
            timestamp: '10 minutes ago',
            status: 'success',
          },
          {
            id: '4',
            type: 'user',
            description: 'User account suspended',
            timestamp: '15 minutes ago',
            status: 'warning',
          },
          {
            id: '5',
            type: 'ride',
            description: 'Ride cancelled - refund processed',
            timestamp: '20 minutes ago',
            status: 'info',
          },
        ])

        setIsLoadingStats(false)
      }, 1000)
    }

    loadDashboardData()
  }, [])

  const statCards = [
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'New Signups',
      value: stats?.newSignups || 0,
      change: '+5',
      changeType: 'positive' as const,
      icon: UserPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      change: '+3',
      changeType: 'negative' as const,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Open Emergencies',
      value: stats?.openEmergencies || 0,
      change: '-1',
      changeType: 'positive' as const,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  const performanceCards = [
    {
      title: 'Total Rides Today',
      value: stats?.totalRides || 0,
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Revenue (KSH)',
      value: `KSH ${stats?.totalRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Cancellation Rate',
      value: `${stats?.cancellationRate || 0}%`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Driver Acceptance',
      value: `${stats?.driverAcceptanceRate || 0}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return MapPin
      case 'user':
        return Users
      case 'driver':
        return Car
      case 'emergency':
        return AlertTriangle
      default:
        return Activity
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      case 'info':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black">Dashboard</h1>
        <p className="text-gray-600">Overview of your MOTO Rides platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-black">{card.value}</p>
                  <div className="flex items-center mt-1">
                    {card.changeType === 'positive' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={cn(
                      'ml-1 text-sm',
                      card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {card.change}
                    </span>
                  </div>
                </div>
                <div className={cn('p-3 rounded-full', card.bgColor)}>
                  <Icon className={cn('h-6 w-6', card.color)} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-black">{card.value}</p>
                </div>
                <div className={cn('p-3 rounded-full', card.bgColor)}>
                  <Icon className={cn('h-6 w-6', card.color)} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-black">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className={cn('p-2 rounded-full', getActivityColor(activity.status))}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-black">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-black">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <UserPlus className="h-5 w-5 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Approve Driver</span>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Phone className="h-5 w-5 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Handle Emergency</span>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Star className="h-5 w-5 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Review Feedback</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  )
}

export default DashboardPage