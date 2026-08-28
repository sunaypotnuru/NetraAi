import React from 'react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  DollarSign, TrendingUp, Calendar, Users, Download, ArrowUpRight,
  ArrowDownRight, CreditCard, Wallet, Target, Clock, Eye, Filter,
  BarChart3, PieChart, LineChart, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import api from '@/lib/api';

interface EarningsData {
  summary: {
    today: number;
    week: number;
    month: number;
    year: number;
    total: number;
    pending: number;
    growth_percentage: number;
    avg_per_appointment: number;
    total_appointments: number;
    completed_appointments: number;
    monthly_goal: number;
    goal_progress: number;
  };
  trends: Array<{
    date: string;
    earnings: number;
    appointments: number;
    avg_per_appointment: number;
  }>;
  breakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  payment_methods: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
  monthly_comparison: Array<{
    month: string;
    current_year: number;
    previous_year: number;
  }>;
}

export default function DoctorEarningsSummary() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = React.useState('month');
  const [activeTab, setActiveTab] = React.useState('overview');

  const { data: earningsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor-earnings-summary', timeFilter],
    queryFn: async (): Promise<EarningsData> => {
      const response = await api.get<EarningsData>(`/api/v1/doctor/earnings/summary?period=${timeFilter}`);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="w-[300px] h-[40px] bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-[140px] rounded-xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
          <Skeleton className="h-[400px] rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (isError || !earningsData) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent">
        <div className="max-w-7xl mx-auto text-center py-12 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-white/10 p-8 rounded-3xl shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Unable to Load Earnings</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">There was an error loading your earnings data. Please try again.</p>
          <Button onClick={() => refetch()} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const summary = earningsData?.summary;
  const trends = earningsData?.trends || [];
  const breakdown = earningsData?.breakdown || [];
  const paymentMethods = earningsData?.payment_methods || [];
  const monthlyComparison = earningsData?.monthly_comparison || [];

  return (
    <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-white/70 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-sm"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Earnings Summary</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Comprehensive overview of your earnings and financial performance</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-gray-200/50 dark:border-white/10 hover:border-[#0ea5e9] dark:hover:border-[#0ea5e9] hover:text-[#0ea5e9] bg-white/50 dark:bg-slate-850/50 text-slate-900 dark:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/doctor/earnings/transactions')}
              className="border-gray-200/50 dark:border-white/10 hover:border-[#0ea5e9] dark:hover:border-[#0ea5e9] hover:text-[#0ea5e9] bg-white/50 dark:bg-slate-850/50 text-slate-900 dark:text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Transactions
            </Button>
            <Button className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Time Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          {[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'year', label: 'This Year' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setTimeFilter(filter.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                timeFilter === filter.value
                  ? "bg-[#0ea5e9] text-white shadow-md"
                  : "bg-white/50 dark:bg-slate-850/50 border border-gray-205 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-800/70"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Today's Earnings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
                    <ArrowUpRight className="w-4 h-4" />
                    {summary?.growth_percentage}%
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Today's Earnings</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">₹{summary?.today?.toLocaleString()}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">vs yesterday</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Earnings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    This Month
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Monthly Earnings</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">₹{summary?.month?.toLocaleString()}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>Goal Progress</span>
                    <span>{summary?.goal_progress}%</span>
                  </div>
                  <Progress value={summary?.goal_progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Average per Appointment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Appointments</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{summary?.total_appointments}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Avg per Appointment</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">₹{summary?.avg_per_appointment?.toLocaleString()}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {summary?.completed_appointments} completed
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Payments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <AlertCircle className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pending Payments</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">₹{summary?.pending?.toLocaleString()}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">Awaiting collection</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-xl border border-gray-200/50 dark:border-white/10 mb-6">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-white text-slate-600 dark:text-slate-400">Overview</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-lg data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-white text-slate-600 dark:text-slate-400">Trends</TabsTrigger>
            <TabsTrigger value="breakdown" className="rounded-lg data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-white text-slate-600 dark:text-slate-400">Breakdown</TabsTrigger>
            <TabsTrigger value="goals" className="rounded-lg data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-white text-slate-600 dark:text-slate-400">Goals</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Earnings Trend */}
              <Card className="lg:col-span-2 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#0ea5e9]" />
                    Earnings Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} stroke="#888888" />
                        <YAxis axisLine={false} tickLine={false} stroke="#888888" />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                          formatter={(value, name) => [
                            name === 'earnings' ? `₹${value}` : value,
                            name === 'earnings' ? 'Earnings' : 'Appointments'
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="earnings"
                          stroke="#0ea5e9"
                          fill="#0ea5e9"
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Breakdown */}
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[#8b5cf6]" />
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={breakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="amount"
                        >
                          {breakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value}`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {breakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 border border-gray-200/50 dark:border-white/5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-slate-500 dark:text-slate-400">{item.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">₹{item.amount.toLocaleString()}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods */}
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#22c55e]" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {paymentMethods.map((method, index) => (
                    <div key={index} className="text-center p-6 bg-white/50 dark:bg-slate-800/50 border border-gray-200/50 dark:border-white/5 rounded-xl shadow-sm">
                      <div className="w-12 h-12 rounded-xl bg-[#0ea5e9]/10 mx-auto mb-4 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-[#0ea5e9]" />
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{method.method}</h3>
                      <p className="text-2xl font-bold text-[#0ea5e9] mb-1">₹{method.amount.toLocaleString()}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{method.count} transactions</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Monthly Comparison</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">Compare current year vs previous year earnings</p>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="#888888" />
                      <YAxis axisLine={false} tickLine={false} stroke="#888888" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value) => `₹${value}`} />
                      <Bar dataKey="current_year" fill="#0ea5e9" name="2024" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="previous_year" fill="#94a3b8" name="2023" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {breakdown.map((category, index) => (
                <Card key={index} className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      {category.category}
                      <Badge style={{ backgroundColor: category.color, color: 'white' }}>
                        {category.percentage}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        ₹{category.amount.toLocaleString()}
                      </p>
                      <Progress
                        value={category.percentage}
                        className="h-3 mb-2 animate-pulse"
                        style={{
                          '--progress-background': category.color
                        } as React.CSSProperties}
                      />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {category.percentage}% of total revenue
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  Monthly Goal Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-32 h-32 rounded-full border-8 border-green-500 border-t-slate-200 dark:border-t-slate-800 mx-auto mb-6 flex items-center justify-center relative">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary?.goal_progress}%</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Complete</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    ₹{summary?.month?.toLocaleString()} / ₹{summary?.monthly_goal?.toLocaleString()}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    You're ₹{((summary?.monthly_goal || 0) - (summary?.month || 0)).toLocaleString()} away from your monthly goal
                  </p>
                  <div className="flex justify-center gap-8">
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-500">₹{summary?.month?.toLocaleString()}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Earned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-500 dark:text-slate-400">
                        ₹{((summary?.monthly_goal || 0) - (summary?.month || 0)).toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Remaining</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
