import React from 'react';
import { motion } from "motion/react";
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import api from '@/lib/api';
import {
  BarChart3, Users, Calendar, DollarSign, TrendingUp, TrendingDown,
  Clock, Star, Activity, Eye, ArrowUpRight, ArrowDownRight, RefreshCw,
  Filter, Download, ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeartbeatLoader } from '@/components/shared/HeartbeatLoader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface AnalyticsOverview {
  summary: {
    total_patients: number;
    new_patients_this_month: number;
    total_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    total_revenue: number;
    average_rating: number;
    response_time: number; // minutes
    patient_satisfaction: number; // percentage
    growth_metrics: {
      patients_growth: number;
      revenue_growth: number;
      appointments_growth: number;
      rating_growth: number;
    };
  };
  appointment_trends: Array<{
    date: string;
    appointments: number;
    completed: number;
    cancelled: number;
    revenue: number;
  }>;
  patient_demographics: Array<{
    age_group: string;
    count: number;
    percentage: number;
  }>;
  top_conditions: Array<{
    condition: string;
    count: number;
    percentage: number;
  }>;
  performance_metrics: {
    consultation_time: number;
    follow_up_rate: number;
    prescription_accuracy: number;
    patient_retention: number;
  };
  recent_activities: Array<{
    id: string;
    type: 'appointment' | 'review' | 'achievement' | 'milestone';
    title: string;
    description: string;
    timestamp: string;
    value?: number;
  }>;
}

export default function DoctorAnalyticsDashboard() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = React.useState('month');
  const [activeTab, setActiveTab] = React.useState('overview');

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['doctor-analytics-overview', timeFilter],
    queryFn: async (): Promise<AnalyticsOverview> => {
      const response = await api.get<AnalyticsOverview>(`/api/v1/doctor/analytics/overview?period=${timeFilter}`);
      return response.data;
    }
  });

  if (isLoading) {
    return <HeartbeatLoader text="Loading Analytics..." />;
  }

  if (!analytics) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent">
        <div className="max-w-7xl mx-auto text-center py-20 border border-gray-200/50 dark:border-white/10 shadow-xl rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Unable to Load Analytics</h2>
          <p className="text-slate-650 dark:text-slate-400 font-medium mb-6">There was an error loading your analytics data.</p>
          <Button onClick={() => refetch()} className="bg-[#0EA5E9] hover:bg-[#0284C7] dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-bold h-11 px-6 rounded-2xl shadow-lg shadow-sky-500/10 transition-all">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const summary = analytics.summary;
  const COLORS = ['#0EA5E9', '#22C55E', '#8B5CF6', '#F59E0B', '#EF4444'];

  return (
    <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">Analytics Dashboard</h1>
            <p className="text-slate-650 dark:text-slate-400 font-medium">Comprehensive insights into your practice performance</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[150px] bg-white/70 dark:bg-slate-900/50 border-gray-200/50 dark:border-white/10 rounded-2xl h-11 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
                <Filter className="w-4 h-4 mr-2 text-[#0EA5E9]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-white/10 rounded-2xl">
                <SelectItem value="week" className="dark:text-slate-200">This Week</SelectItem>
                <SelectItem value="month" className="dark:text-slate-200">This Month</SelectItem>
                <SelectItem value="quarter" className="dark:text-slate-200">This Quarter</SelectItem>
                <SelectItem value="year" className="dark:text-slate-200">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => navigate('/doctor/analytics/patients')}
              className="bg-white/70 dark:bg-slate-900/50 border-gray-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold rounded-2xl h-11 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 shadow-sm transition-all"
            >
              <Eye className="w-4 h-4 mr-2 text-[#0EA5E9]" />
              Patient Analytics
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/doctor/analytics/revenue')}
              className="bg-white/70 dark:bg-slate-900/50 border-gray-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold rounded-2xl h-11 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 shadow-sm transition-all"
            >
              <DollarSign className="w-4 h-4 mr-2 text-[#22C55E]" />
              Revenue Analytics
            </Button>
            <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-bold h-11 px-5 rounded-2xl shadow-lg shadow-sky-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Total Patients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl hover:shadow-2xl hover:translate-y-[-2px] transition-all rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center border border-blue-200/20">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/30 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {summary.growth_metrics.patients_growth}%
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Total Patients</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{summary.total_patients.toLocaleString()}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-2">
                  +{summary.new_patients_this_month} new this month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl hover:shadow-2xl hover:translate-y-[-2px] transition-all rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center border border-emerald-200/20">
                    <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/30 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {summary.growth_metrics.appointments_growth}%
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Total Appointments</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{summary.total_appointments.toLocaleString()}</p>
                <div className="mt-2.5">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    <span>Completion Rate</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.round((summary.completed_appointments / summary.total_appointments) * 100)}%</span>
                  </div>
                  <Progress value={(summary.completed_appointments / summary.total_appointments) * 100} className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl hover:shadow-2xl hover:translate-y-[-2px] transition-all rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center border border-purple-200/20">
                    <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/30 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {summary.growth_metrics.revenue_growth}%
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Total Revenue</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">₹{summary.total_revenue.toLocaleString()}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-2">
                  Avg: ₹{Math.round(summary.total_revenue / summary.completed_appointments).toLocaleString()} per appointment
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Patient Satisfaction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl hover:shadow-2xl hover:translate-y-[-2px] transition-all rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center border border-amber-200/20">
                    <Star className="w-6 h-6 text-amber-600 dark:text-amber-450" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/30 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {summary.growth_metrics.rating_growth}%
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Patient Satisfaction</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{summary.patient_satisfaction}%</p>
                <div className="flex items-center gap-1 mt-2 font-semibold">
                  <Star className="w-4 h-4 text-amber-500 fill-current" />
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200">{summary.average_rating.toFixed(1)}</span>
                  <span className="text-xs text-slate-550 dark:text-slate-450 font-bold ml-1">average rating</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100/50 dark:bg-slate-950/40 p-1.5 rounded-3xl border border-gray-200/50 dark:border-white/5 backdrop-blur-md h-13">
            <TabsTrigger value="overview" className="rounded-2xl font-bold py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#0EA5E9] data-[state=active]:shadow-md transition-all text-slate-650 dark:text-slate-450">Overview</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-2xl font-bold py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#0EA5E9] data-[state=active]:shadow-md transition-all text-slate-650 dark:text-slate-450">Trends</TabsTrigger>
            <TabsTrigger value="performance" className="rounded-2xl font-bold py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#0EA5E9] data-[state=active]:shadow-md transition-all text-slate-650 dark:text-slate-450">Performance</TabsTrigger>
            <TabsTrigger value="insights" className="rounded-2xl font-bold py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#0EA5E9] data-[state=active]:shadow-md transition-all text-slate-650 dark:text-slate-450">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Appointment Trends */}
              <Card className="lg:col-span-2 border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#0EA5E9]" />
                    Appointment Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.appointment_trends}>
                        <defs>
                          <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }} />
                        <Area
                          type="monotone"
                          dataKey="appointments"
                          stroke="#0EA5E9"
                          fill="url(#colorApps)"
                          strokeWidth={2}
                          name="Total Appointments"
                        />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          stroke="#22C55E"
                          fill="url(#colorComp)"
                          strokeWidth={2}
                          name="Completed"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Patient Demographics */}
              <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#8B5CF6]" />
                    Patient Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.patient_demographics}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={6}
                          dataKey="count"
                        >
                          {analytics.patient_demographics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: 'none', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {analytics.patient_demographics.map((demo, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-2xl border border-slate-100/50 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{demo.age_group}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">{demo.count} pts</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">{demo.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Conditions */}
            <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#22C55E]" />
                  Most Common Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {analytics.top_conditions.map((condition, index) => (
                    <div key={index} className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-slate-100/50 dark:border-white/5 relative overflow-hidden group">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 mx-auto mb-3 flex items-center justify-center shadow-md border border-slate-100 dark:border-white/5 group-hover:scale-105 transition-transform">
                        <Activity className="w-6 h-6 text-[#22C55E]" />
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-250 mb-1 text-sm">{condition.condition}</h3>
                      <p className="text-2xl font-black text-[#22C55E] mb-1">{condition.count}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-450 font-semibold">{condition.percentage}% of patients</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6 outline-none">
            <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white">Revenue vs Appointments Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.appointment_trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }} />
                      <Bar yAxisId="left" dataKey="appointments" fill="#0EA5E9" name="Appointments" radius={[6, 6, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={3} name="Revenue (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(analytics.performance_metrics).map(([key, value], index) => (
                <Card key={key} className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-black text-slate-900 dark:text-white capitalize tracking-tight">
                      {key.replace('_', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <p className="text-4xl font-black text-[#0EA5E9] tracking-tight mb-3">
                        {typeof value === 'number' ?
                          (key.includes('time') ? `${value} min` : `${value}%`) :
                          value
                        }
                      </p>
                      <Progress
                        value={typeof value === 'number' ? value : 0}
                        className="h-2 mb-3 bg-slate-100 dark:bg-slate-800"
                      />
                      <p className="text-sm text-slate-650 dark:text-slate-400 font-bold">
                        {value >= 80 ? 'Excellent Performance' : value >= 60 ? 'Healthy and Consistent' : 'Needs Optimization'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6 outline-none">
            <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#F59E0B]" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recent_activities.map((activity, index) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100/50 dark:border-white/5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 ${
                        activity.type === 'appointment' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' :
                        activity.type === 'review' ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-450' :
                        activity.type === 'achievement' ? 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400' :
                        'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
                      }`}>
                        {activity.type === 'appointment' && <Calendar className="w-5 h-5" />}
                        {activity.type === 'review' && <Star className="w-5 h-5" />}
                        {activity.type === 'achievement' && <CheckCircle className="w-5 h-5" />}
                        {activity.type === 'milestone' && <TrendingUp className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{activity.title}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">{activity.description}</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-black mt-1 uppercase tracking-wider">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      {activity.value && (
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-[#0EA5E9] tracking-tight">+{activity.value}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
