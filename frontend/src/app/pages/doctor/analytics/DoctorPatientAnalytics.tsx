import React, { useState } from 'react';
import { motion } from "motion/react";
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import api from '@/lib/api';
import {
  ArrowLeft, Users, TrendingUp, MapPin, Calendar, Clock,
  Heart, Activity, AlertTriangle, CheckCircle, Filter, Download,
  Eye, UserPlus, UserMinus, BarChart3, PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface PatientAnalytics {
  summary: {
    total_patients: number;
    active_patients: number;
    new_patients_this_month: number;
    returning_patients: number;
    patient_retention_rate: number;
    average_age: number;
    gender_distribution: {
      male: number;
      female: number;
      other: number;
    };
  };
  growth_trends: Array<{
    month: string;
    new_patients: number;
    returning_patients: number;
    total_active: number;
  }>;
  demographics: {
    age_groups: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    locations: Array<{
      city: string;
      count: number;
      percentage: number;
    }>;
    conditions: Array<{
      condition: string;
      count: number;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  engagement_metrics: {
    appointment_frequency: Array<{
      frequency: string;
      count: number;
      percentage: number;
    }>;
    communication_preferences: Array<{
      method: string;
      count: number;
      percentage: number;
    }>;
    satisfaction_scores: Array<{
      score: number;
      count: number;
    }>;
  };
  health_outcomes: {
    improvement_rate: number;
    follow_up_compliance: number;
    medication_adherence: number;
    lifestyle_changes: number;
  };
  risk_analysis: Array<{
    risk_level: 'low' | 'medium' | 'high';
    count: number;
    conditions: string[];
  }>;
}

export default function DoctorPatientAnalytics() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('year');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['doctor-patient-analytics', timeFilter],
    queryFn: async (): Promise<PatientAnalytics> => {
      const response = await api.get<PatientAnalytics>(`/api/v1/doctor/analytics/patients?period=${timeFilter}`);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <Skeleton className="w-[300px] h-[40px] bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-[140px] bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl" />
            ))}
          </div>
          <Skeleton className="h-[400px] bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent">
        <div className="max-w-7xl mx-auto text-center py-20 border border-gray-200/50 dark:border-white/10 shadow-xl rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-[#0F172A] dark:text-white mb-2">Unable to Load Patient Analytics</h2>
          <p className="text-slate-650 dark:text-slate-400 font-medium mb-6">There was an error loading your patient analytics data.</p>
          <Button onClick={() => refetch()} className="bg-[#0EA5E9] hover:bg-[#0284C7] dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-bold h-11 px-6 rounded-2xl shadow-lg shadow-sky-500/10 transition-all">
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
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/doctor/analytics')}
              className="p-2.5 bg-white/70 dark:bg-slate-900/50 border-gray-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 rounded-2xl shadow-sm transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Patient Analytics</h1>
              <p className="text-slate-650 dark:text-slate-400 font-medium">Detailed insights into your patient demographics and engagement</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[150px] bg-white/70 dark:bg-slate-900/50 border-gray-200/50 dark:border-white/10 rounded-2xl h-11 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
                <Filter className="w-4 h-4 mr-2 text-[#0EA5E9]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-white/10 rounded-2xl">
                <SelectItem value="month" className="dark:text-slate-200">This Month</SelectItem>
                <SelectItem value="quarter" className="dark:text-slate-200">This Quarter</SelectItem>
                <SelectItem value="year" className="dark:text-slate-200">This Year</SelectItem>
                <SelectItem value="all" className="dark:text-slate-200">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-bold h-11 px-5 rounded-2xl shadow-lg shadow-sky-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
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
                  <Badge variant="secondary" className="bg-blue-100/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold rounded-lg border-0">
                    Total
                  </Badge>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Total Patients</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{summary.total_patients.toLocaleString()}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-2">
                  {summary.active_patients} active patients
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* New Patients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl hover:shadow-2xl hover:translate-y-[-2px] transition-all rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-950/30 flex items-center justify-center border border-green-200/20">
                    <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <Badge variant="secondary" className="bg-green-100/60 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-bold rounded-lg border-0">
                    New
                  </Badge>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">New This Month</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{summary.new_patients_this_month}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-2">
                  {Math.round((summary.new_patients_this_month / summary.total_patients) * 100)}% of total
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Retention Rate */}
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
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="secondary" className="bg-purple-100/60 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold rounded-lg border-0">
                    Retention
                  </Badge>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Retention Rate</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{summary.patient_retention_rate}%</p>
                <div className="mt-2.5">
                  <Progress value={summary.patient_retention_rate} className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Average Age */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl hover:shadow-2xl hover:translate-y-[-2px] transition-all rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center border border-orange-200/20">
                    <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-450" />
                  </div>
                  <Badge variant="secondary" className="bg-orange-100/60 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold rounded-lg border-0">
                    Age
                  </Badge>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Average Age</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{summary.average_age}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-2">
                  years old
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100/50 dark:bg-slate-950/40 p-1.5 rounded-3xl border border-gray-200/50 dark:border-white/5 backdrop-blur-md h-13">
            <TabsTrigger value="overview" className="rounded-2xl font-bold py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#0EA5E9] data-[state=active]:shadow-md transition-all text-slate-650 dark:text-slate-450">Overview</TabsTrigger>
            <TabsTrigger value="demographics" className="rounded-2xl font-bold py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#0EA5E9] data-[state=active]:shadow-md transition-all text-slate-650 dark:text-slate-450">Demographics</TabsTrigger>
            <TabsTrigger value="engagement" className="rounded-2xl font-bold py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#0EA5E9] data-[state=active]:shadow-md transition-all text-slate-650 dark:text-slate-450">Engagement</TabsTrigger>
            <TabsTrigger value="outcomes" className="rounded-2xl font-bold py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#0EA5E9] data-[state=active]:shadow-md transition-all text-slate-650 dark:text-slate-450">Outcomes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Patient Growth Trends */}
              <Card className="lg:col-span-2 border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#0EA5E9]" />
                    Patient Growth Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.growth_trends}>
                        <defs>
                          <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorRet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }} />
                        <Area
                          type="monotone"
                          dataKey="new_patients"
                          stackId="1"
                          stroke="#22C55E"
                          fill="url(#colorNew)"
                          strokeWidth={2}
                          name="New Patients"
                        />
                        <Area
                          type="monotone"
                          dataKey="returning_patients"
                          stackId="1"
                          stroke="#0EA5E9"
                          fill="url(#colorRet)"
                          strokeWidth={2}
                          name="Returning Patients"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gender Distribution */}
              <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#8B5CF6]" />
                    Gender Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Male', value: summary.gender_distribution.male },
                            { name: 'Female', value: summary.gender_distribution.female },
                            { name: 'Other', value: summary.gender_distribution.other }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={6}
                          dataKey="value"
                        >
                          {[summary.gender_distribution.male, summary.gender_distribution.female, summary.gender_distribution.other].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: 'none', color: '#fff' }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'Male', value: summary.gender_distribution.male },
                      { name: 'Female', value: summary.gender_distribution.female },
                      { name: 'Other', value: summary.gender_distribution.other }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-2xl border border-slate-100/50 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index] }}
                          />
                          <span className="text-xs font-bold text-slate-650 dark:text-slate-400">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">{item.value}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">
                            {Math.round((item.value / summary.total_patients) * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Age Groups */}
              <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#0EA5E9]" />
                    Age Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.demographics.age_groups}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                        <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }} />
                        <Bar dataKey="count" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Geographic Distribution */}
              <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#22C55E]" />
                    Geographic Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.demographics.locations.map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100/50 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#22C55E]/10 flex items-center justify-center border border-[#22C55E]/20">
                            <MapPin className="w-4.5 h-4.5 text-[#22C55E]" />
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{location.city}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-900 dark:text-white text-sm">{location.count} pts</p>
                          <p className="text-xs text-slate-500 dark:text-slate-450 font-bold">{location.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Common Conditions */}
            <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#8B5CF6]" />
                  Common Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.demographics.conditions.map((condition, index) => (
                    <div key={index} className="p-4 border border-slate-200/50 dark:border-white/5 bg-slate-50/20 dark:bg-slate-850/10 rounded-2xl relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-250 text-sm">{condition.condition}</h3>
                        <Badge
                          variant="secondary"
                          className={`font-black rounded-lg text-[10px] tracking-wide uppercase px-2 py-0.5 border-0 ${
                            condition.severity === 'high' ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' :
                            condition.severity === 'medium' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-405' :
                            'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                          }`}
                        >
                          {condition.severity}
                        </Badge>
                      </div>
                      <p className="text-2xl font-black text-[#0EA5E9] mb-1">{condition.count}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-450 font-semibold">patients affected</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Appointment Frequency */}
              <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#0EA5E9]" />
                    Appointment Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.engagement_metrics.appointment_frequency.map((freq, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100/50 dark:border-white/5">
                        <span className="text-sm font-bold text-slate-650 dark:text-slate-400">{freq.frequency}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                            <div
                              className="bg-[#0EA5E9] h-1.5 rounded-full"
                              style={{ width: `${freq.percentage}%` }}
                            />
                          </div>
                          <span className="font-black text-slate-900 dark:text-white w-12 text-right text-sm">{freq.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Communication Preferences */}
              <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[#22C55E]" />
                    Communication Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={analytics.engagement_metrics.communication_preferences}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={6}
                          dataKey="count"
                        >
                          {analytics.engagement_metrics.communication_preferences.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: 'none', color: '#fff' }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {analytics.engagement_metrics.communication_preferences.map((pref, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-2xl border border-slate-100/50 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-xs font-bold text-slate-650 dark:text-slate-400">{pref.method}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">{pref.count} pts</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">{pref.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Satisfaction Scores */}
            <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#F59E0B]" />
                  Patient Satisfaction Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.engagement_metrics.satisfaction_scores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                      <XAxis dataKey="score" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }} />
                      <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outcomes Tab */}
          <TabsContent value="outcomes" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(analytics.health_outcomes).map(([key, value], index) => (
                <Card key={key} className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-black text-slate-900 dark:text-white capitalize flex items-center gap-2">
                      <Heart className="w-5 h-5 text-[#EF4444]" />
                      {key.replace('_', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <p className="text-4xl font-black text-[#0EA5E9] mb-4 tracking-tight">{value}%</p>
                      <Progress value={value} className="h-2 mb-4 bg-slate-100 dark:bg-slate-800" />
                      <p className="text-sm text-slate-650 dark:text-slate-400 font-bold">
                        {value >= 80 ? 'Excellent Outcomes' :
                         value >= 60 ? 'Healthy and Consistent' :
                         'Needs Clinical Intervention'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Risk Analysis */}
            <Card className="border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                  Patient Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {analytics.risk_analysis.map((risk, index) => (
                    <div key={index} className="text-center p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-slate-100/50 dark:border-white/5 relative overflow-hidden group">
                      <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center border ${
                        risk.risk_level === 'high' ? 'bg-red-100 dark:bg-red-950/40 border-red-200/20' :
                        risk.risk_level === 'medium' ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-200/20' :
                        'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200/20'
                      }`}>
                        <AlertTriangle className={`w-8 h-8 ${
                          risk.risk_level === 'high' ? 'text-red-600 dark:text-red-400' :
                          risk.risk_level === 'medium' ? 'text-amber-600 dark:text-amber-450' :
                          'text-emerald-600 dark:text-emerald-450'
                        }`} />
                      </div>
                      <h3 className="font-black text-slate-850 dark:text-slate-200 mb-2 capitalize">{risk.risk_level} Risk</h3>
                      <p className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{risk.count}</p>
                      <p className="text-xs text-slate-550 dark:text-slate-450 font-bold mb-4">patients</p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {risk.conditions.slice(0, 3).map((condition, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] font-black uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-lg border-0 px-2 py-0.5">
                            {condition}
                          </Badge>
                        ))}
                      </div>
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
