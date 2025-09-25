'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CashPaymentStats {
  totalCashRides: number;
  confirmedCashRides: number;
  disputedCashRides: number;
  pendingConfirmations: number;
  totalCommissionCollected: number;
  currency: string;
}

interface DailyStats {
  date: string;
  cashRides: number;
  confirmedRides: number;
  disputedRides: number;
  commission: number;
}

export default function CashPaymentStats() {
  const [stats, setStats] = useState<CashPaymentStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      // In a real app, this would call the API
      const mockStats: CashPaymentStats = {
        totalCashRides: 1250,
        confirmedCashRides: 1180,
        disputedCashRides: 45,
        pendingConfirmations: 25,
        totalCommissionCollected: 12500,
        currency: 'KSH'
      };
      setStats(mockStats);

      // Mock daily stats for the last 7 days
      const mockDailyStats: DailyStats[] = [
        { date: '2024-12-14', cashRides: 45, confirmedRides: 42, disputedRides: 2, commission: 450 },
        { date: '2024-12-15', cashRides: 52, confirmedRides: 48, disputedRides: 3, commission: 520 },
        { date: '2024-12-16', cashRides: 38, confirmedRides: 35, disputedRides: 1, commission: 380 },
        { date: '2024-12-17', cashRides: 61, confirmedRides: 58, disputedRides: 2, commission: 610 },
        { date: '2024-12-18', cashRides: 47, confirmedRides: 44, disputedRides: 1, commission: 470 },
        { date: '2024-12-19', cashRides: 55, confirmedRides: 52, disputedRides: 2, commission: 550 },
        { date: '2024-12-20', cashRides: 43, confirmedRides: 40, disputedRides: 1, commission: 430 }
      ];
      setDailyStats(mockDailyStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfirmationRate = () => {
    if (!stats || stats.totalCashRides === 0) return 0;
    return Math.round((stats.confirmedCashRides / stats.totalCashRides) * 100);
  };

  const getDisputeRate = () => {
    if (!stats || stats.totalCashRides === 0) return 0;
    return Math.round((stats.disputedCashRides / stats.totalCashRides) * 100);
  };

  const pieData = stats ? [
    { name: 'Confirmed', value: stats.confirmedCashRides, color: '#10B981' },
    { name: 'Disputed', value: stats.disputedCashRides, color: '#F59E0B' },
    { name: 'Pending', value: stats.pendingConfirmations, color: '#3B82F6' }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Failed to load statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cash Payment Statistics</h2>
        <Badge variant="outline" className="text-sm">
          Last 30 Days
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash Rides</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCashRides.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time cash payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Rides</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.confirmedCashRides.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {getConfirmationRate()}% confirmation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disputed Rides</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.disputedCashRides}
            </div>
            <p className="text-xs text-muted-foreground">
              {getDisputeRate()}% dispute rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalCommissionCollected.toLocaleString()} {stats.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              From confirmed rides
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cash Rides Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Cash Rides (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-KE')}
                  formatter={(value, name) => [value, name === 'cashRides' ? 'Total Rides' : name === 'confirmedRides' ? 'Confirmed' : 'Disputed']}
                />
                <Bar dataKey="cashRides" fill="#3B82F6" name="Total Rides" />
                <Bar dataKey="confirmedRides" fill="#10B981" name="Confirmed" />
                <Bar dataKey="disputedRides" fill="#F59E0B" name="Disputed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Confirmations */}
      {stats.pendingConfirmations > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span>Pending Confirmations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">
              {stats.pendingConfirmations} cash payment(s) are waiting for mutual confirmation. 
              These rides require both driver and rider to confirm payment before commission can be deducted.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
