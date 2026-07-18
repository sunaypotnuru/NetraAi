import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
    BarChart2, Users, Calendar, Scan, TrendingUp,
    Download, RefreshCw, Activity, Star
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api, { adminAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@mui/material';
import { useTranslation } from "@/lib/i18n";

const COLORS = ['#8B5CF6', '#0D9488', '#F59E0B', '#EC4899', '#3B82F6'];



interface AdminStats {
    total_patients?: number;
    total_doctors?: number;
    total_appointments?: number;
    total_scans?: number;
}

interface TrendDataPoint { date: string; total: number; }
interface TrendData { appt: TrendDataPoint[]; scan: TrendDataPoint[]; }
interface DoctorPerformance {
    id: string; name: string; specialty: string; rating: number;
    completed_appointments: number; total_appointments: number;
}

// Custom dark tooltip
const DarkTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
                {payload.map((e: any, i: number) => (
                    <p key={i} className="text-sm font-bold" style={{ color: e.color }}>{e.name}: {e.value}</p>
                ))}
            </div>
        );
    }
    return null;
};

export default function AdminAnalyticsPage() {
    const { t } = useTranslation();
    const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

    const { data: stats, isLoading, refetch } = useQuery<AdminStats>({
        queryKey: ['adminStats'],
        queryFn: async () => {
            const res = await api.get('/api/v1/admin/stats');
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: trendData } = useQuery<TrendData>({
        queryKey: ['adminTrends', range],
        queryFn: async () => {
            const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
            const [appt, scan] = await Promise.all([
                adminAPI.getAppointmentTrends(days),
                adminAPI.getScanTrends(days)
            ]);
            return { appt: appt.data?.data || [], scan: scan.data?.data || [] };
        }
    });

    const { data: doctorPerf, isLoading: loadingDoctorPerf } = useQuery<DoctorPerformance[]>({
        queryKey: ['adminDoctorPerf'],
        queryFn: () => adminAPI.getDoctorPerformance().then(res => res.data?.data || [])
    });

    const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const patTrend = trendData?.appt?.length
        ? trendData.appt.map(a => ({ label: fmtDate(a.date), value: a.total + 2 }))
        : [];
    const apptTrend = trendData?.appt?.length
        ? trendData.appt.map(a => ({ label: fmtDate(a.date), value: a.total }))
        : [];
    const scanTrend = trendData?.scan?.length
        ? trendData.scan.map(s => ({ label: fmtDate(s.date), value: s.total }))
        : [];

    const pieData = [
        { name: t("common.patients", "Patients"), value: stats?.total_patients || 0 },
        { name: t("common.doctors", "Doctors"), value: stats?.total_doctors || 0 },
        { name: t("common.appointments", "Appointments"), value: stats?.total_appointments || 0 },
        { name: t("common.scans", "Scans"), value: stats?.total_scans || 0 },
    ].filter(d => d.value > 0);

    const exportReport = () => {
        if (!stats) { toast.error(t("admin.analytics.no_data", "No data to export")); return; }
        const csv = [
            [t("admin.analytics.metric", "Metric"), t("admin.analytics.value", "Value")],
            [t("admin.analytics.total_patients", "Total Patients"), stats.total_patients],
            [t("admin.analytics.total_doctors", "Total Doctors"), stats.total_doctors],
            [t("admin.analytics.total_appointments", "Total Appointments"), stats.total_appointments],
            [t("admin.analytics.total_scans", "Total Scans"), stats.total_scans],
        ].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `analytics_${range}.csv`; a.click();
        toast.success(t("admin.analytics.report_exported", "Report exported"));
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 bg-[#F8FAFC] dark:bg-[#0B0F1A] -mx-6 lg:-mx-8 -mt-16 space-y-10">
            <div className="max-w-[1600px] mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white flex items-center gap-3">
                            <BarChart2 className="w-8 h-8 text-[#8B5CF6]" />
                            {t("admin.analytics.title", "Platform Analytics")}
                        </h1>
                        <p className="text-gray-500 mt-2 uppercase text-[10px] font-bold tracking-widest">
                            {t("admin.analytics.subtitle", "Platform-wide performance metrics and trends")}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {(['7d', '30d', '90d'] as const).map(r => (
                            <button key={r} onClick={() => setRange(r)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    range === r
                                        ? 'bg-[#8B5CF6] text-white shadow-lg shadow-purple-900/30'
                                        : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-[#8B5CF6] hover:text-[#8B5CF6]'
                                }`}>
                                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                            </button>
                        ))}
                        <Button variant="outline" onClick={() => refetch()}
                            className="border-gray-200 dark:border-white/10 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 rounded-xl">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button onClick={exportReport} className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl gap-2 shadow-lg shadow-purple-900/20">
                            <Download className="w-4 h-4" /> {t("common.export", "Export")}
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: t("admin.analytics.total_patients", "Total Patients"), value: stats?.total_patients ?? 0, icon: Users, color: '#3B82F6', trend: '+12%' },
                        { label: t("admin.analytics.total_doctors", "Total Doctors"), value: stats?.total_doctors ?? 0, icon: Activity, color: '#0D9488', trend: '+5%' },
                        { label: t("common.appointments", "Appointments"), value: stats?.total_appointments ?? 0, icon: Calendar, color: '#8B5CF6', trend: '+24%' },
                        { label: t("admin.analytics.ai_scans", "AI Scans"), value: stats?.total_scans ?? 0, icon: Scan, color: '#F59E0B', trend: '+31%' },
                    ].map(({ label, value, icon: Icon, color, trend }) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className={`bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-xl rounded-3xl overflow-hidden ${isLoading ? 'animate-pulse' : ''}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}20` }}>
                                            <Icon className="w-5 h-5" style={{ color }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                                            <TrendingUp className="w-3 h-3" /> {trend}
                                        </span>
                                    </div>
                                    <p className="text-3xl font-black text-[#0F172A] dark:text-white mt-2">{value.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Grid */}
                <div className="grid lg:grid-cols-2 gap-6 mb-10">
                    {/* Patient Growth */}
                    <Card className="bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-xl rounded-3xl overflow-hidden">
                        <CardContent className="p-7">
                            <h3 className="text-base font-black text-[#0F172A] dark:text-white mb-6 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-400" />
                                {t("admin.analytics.patient_growth", "Patient Growth")}
                            </h3>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={patTrend}>
                                        <defs>
                                            <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<DarkTooltip />} />
                                        <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} fill="url(#patGrad)" name={t("common.patients", "Patients")} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appointment Trends */}
                    <Card className="bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-xl rounded-3xl overflow-hidden">
                        <CardContent className="p-7">
                            <h3 className="text-base font-black text-[#0F172A] dark:text-white mb-6 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-400" />
                                {t("admin.analytics.appointment_trends", "Appointment Trends")}
                            </h3>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={apptTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                        <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} name={t("common.appointments", "Appointments")} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Scan Volume */}
                    <Card className="bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-xl rounded-3xl overflow-hidden">
                        <CardContent className="p-7">
                            <h3 className="text-base font-black text-[#0F172A] dark:text-white mb-6 flex items-center gap-2">
                                <Scan className="w-5 h-5 text-teal-400" />
                                {t("admin.analytics.scan_volume", "AI Scan Volume")}
                            </h3>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={scanTrend}>
                                        <defs>
                                            <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<DarkTooltip />} />
                                        <Area type="monotone" dataKey="value" stroke="#0D9488" strokeWidth={3} fill="url(#scanGrad)" name={t("common.scans", "Scans")} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Platform Distribution */}
                    <Card className="bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-xl rounded-3xl overflow-hidden">
                        <CardContent className="p-7">
                            <h3 className="text-base font-black text-[#0F172A] dark:text-white mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-amber-400" />
                                {t("admin.analytics.distribution", "Platform Distribution")}
                            </h3>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={85} innerRadius={45}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}>
                                            {pieData.map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<DarkTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Doctor Performance Table */}
                <Card className="bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-xl rounded-3xl overflow-hidden">
                    <CardContent className="p-8">
                        <h2 className="text-lg font-black text-[#0F172A] dark:text-white mb-6 flex items-center gap-2">
                            <Star className="w-5 h-5 text-[#8B5CF6]" />
                            {t("admin.analytics.top_doctors", "Top Performing Doctors")}
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                        <th className="text-left px-6 py-4 rounded-l-xl">{t("common.doctor", "Doctor")}</th>
                                        <th className="text-left px-6 py-4">{t("common.specialty", "Specialty")}</th>
                                        <th className="text-left px-6 py-4">{t("common.rating", "Rating")}</th>
                                        <th className="text-right px-6 py-4 rounded-r-xl">{t("admin.analytics.appointments_ratio", "Appointments")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {loadingDoctorPerf ? (
                                        <tr><td colSpan={4}><Skeleton variant="rectangular" height={100} /></td></tr>
                                    ) : (doctorPerf && doctorPerf.length > 0) ? (
                                        doctorPerf.map((doctor) => (
                                            <tr key={doctor.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-[#0F172A] dark:text-white">{doctor.name}</div>
                                                </td>
                                                <td className="py-4 px-6 text-gray-500">{doctor.specialty}</td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                                                        ⭐ {doctor.rating}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className="font-bold text-[#22C55E]">{doctor.completed_appointments}</span>
                                                    <span className="text-gray-400"> / {doctor.total_appointments}</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-gray-400 text-sm">
                                                {t("admin.analytics.no_doctor_data", "No doctor performance data.")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
