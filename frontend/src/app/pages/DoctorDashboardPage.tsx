import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { StaggerContainer, StaggerItem, FadeIn, ScaleIn } from "../../animations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import {
    Calendar, Activity, AlertCircle, Clock, Video, ShieldAlert, DollarSign, CheckCircle2, ChevronRight, User
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { doctorAPI } from "../../lib/api";
import { useTranslation } from "../../lib/i18n";
import { getWebSocketManager } from "../services/websocket";
import { toast } from "sonner";
import { PresenceList } from "@/components/features/notifications/PresenceList";
import { HeartbeatLoader } from "@/components/shared/HeartbeatLoader";

function AnimatedCounter({ target, suffix = "" }: { target: number | string; suffix?: string }) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (typeof target === "number") {
            let start = 0;
            const end = target;
            if (start === end) {
                setCurrent(end);
                return;
            }
            const duration = 1000;
            const stepTime = Math.abs(Math.floor(duration / end));
            const timer = setInterval(() => {
                start += 1;
                setCurrent(start);
                if (start >= end) {
                    clearInterval(timer);
                }
            }, Math.max(stepTime, 15));
            return () => clearInterval(timer);
        }
    }, [target]);

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="text-3xl font-black tracking-tight"
        >
            {typeof target === "number" ? current : target}{suffix}
        </motion.span>
    );
}

export default function DoctorDashboardPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, logout } = useAuth();
    const { t } = useTranslation();

    const { data: dashboardData, isLoading, error } = useQuery({
        queryKey: ['doctorDashboard'],
        queryFn: () => doctorAPI.getDashboard().then(res => res.data)
    });

    useEffect(() => {
        const setupRealtime = async () => {
            try {
                const manager = getWebSocketManager();
                if (manager) {
                    const conn = await manager.connect('notifications');
                    conn.on('dashboard_update', () => {
                        queryClient.invalidateQueries({ queryKey: ['doctorDashboard'] });
                        toast.info("Dashboard updated in real-time");
                    });
                    conn.on('appointment_update', () => {
                        queryClient.invalidateQueries({ queryKey: ['doctorDashboard'] });
                        toast.success("Appointment status changed!");
                    });
                }
            } catch (err) {
                console.error("Failed to setup real-time dashboard updates:", err);
            }
        };

        setupRealtime();
    }, [queryClient]);

    const { data: revenueData } = useQuery({
        queryKey: ['doctorRevenue'],
        queryFn: () => doctorAPI.getRevenue('week').then(res => res.data),
        enabled: !!user
    });

    const revenueTrends = revenueData?.trends || [];
    const revenueSummary = revenueData?.summary || { total: 0, week: 0, month: 0, today: 0 };

    if (isLoading) {
        return <HeartbeatLoader text={t('doctor.dashboard.loading', 'Loading Dashboard...')} />;
    }

    if (error) {
        const is403 = (error as any)?.response?.status === 403;
        const errorDetail = (error as any)?.response?.data?.detail || "";
        const isRejected = errorDetail.toLowerCase().includes("rejected");

        if (is403) {
            return (
                <div 
                    className="min-h-screen w-full flex flex-col items-center justify-center relative p-6 select-none bg-slate-50 dark:bg-slate-950"
                >
                    {/* Premium Ambient Background Glows */}
                    {isRejected ? (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-rose-500/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
                    ) : (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-amber-500/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
                    )}

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                        className="max-w-md w-full z-10"
                    >
                        <Card 
                            className={`p-8 border rounded-[2.5rem] backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] transition-all duration-500 text-center ${
                                isRejected 
                                    ? "bg-rose-950/20 border-rose-500/20 hover:border-rose-500/30" 
                                    : "bg-[#1E293B]/40 border-amber-500/20 hover:border-amber-500/30"
                            }`}
                        >
                            {/* Glowing Icon Enclosure */}
                            <div 
                                className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto border transition-all duration-300 ${
                                    isRejected 
                                        ? "bg-rose-500/10 border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.15)]" 
                                        : "bg-amber-500/10 border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                                }`}
                            >
                                <ShieldAlert 
                                    className={`w-10 h-10 animate-pulse ${
                                        isRejected 
                                            ? "text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" 
                                            : "text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                    }`} 
                                />
                            </div>

                            {/* Verification Header */}
                            <h2 className="text-2xl font-black tracking-tight text-white mb-3">
                                {isRejected 
                                    ? t('doctor.dashboard.restricted_title', 'Access Restricted') 
                                    : t('doctor.dashboard.review_title', 'Verification Under Review')}
                            </h2>

                            {/* Informational Message */}
                            <p className="text-[#94A3B8] text-sm leading-relaxed mb-8 px-2 font-medium">
                                {isRejected 
                                    ? t('doctor.dashboard.rejected_desc', 'Your clinical credentials did not clear our medical verification standards. As a result, your profile has been rejected and dashboard privileges are restricted. Please reach out to hospital administrators to appeal this decision.') 
                                    : t('doctor.dashboard.pending_desc', 'Your professional practitioner details are currently undergoing audit by our credentialing board. This typically takes 24 to 48 hours. You will receive full access as soon as your account is approved.')}
                            </p>

                            {/* Interactive Control Block */}
                            <div className="space-y-3">
                                <Button 
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['doctorDashboard'] })}
                                    className={`w-full font-bold h-12 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg ${
                                        isRejected 
                                            ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40" 
                                            : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40 font-extrabold"
                                    }`}
                                >
                                    {t('doctor.dashboard.recheck_status', 'Re-check Verification')}
                                </Button>

                                <Button 
                                    onClick={async () => {
                                        await logout();
                                        navigate("/login");
                                    }}
                                    variant="ghost" 
                                    className="w-full text-[#94A3B8] hover:text-white hover:bg-white/5 font-bold h-12 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
                                >
                                    {t('common.secure_sign_out', 'Secure Sign Out')}
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            );
        }

        return (
            <div className="min-h-screen pt-3 px-6 flex flex-col items-center justify-center text-center bg-gray-50">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-[#0F172A] mb-2">{t('doctor.dashboard.error', 'Dashboard Error')}</h2>
                <p className="text-[#64748B] max-w-md mb-6">{(error as Error).message}</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['doctorDashboard'] })} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-8">
                    {t('common.retry_connection', 'Retry Connection')}
                </Button>
            </div>
        );
    }
    const profile = dashboardData?.profile || {};
    const statsData = dashboardData?.stats || { appointments_today: 0, revenue_today: 0, pending_patients: 0 };
    const todayAppointments = Array.isArray(dashboardData?.appointments) ? dashboardData.appointments : [];
    const pendingScans = Array.isArray(dashboardData?.pending_scans) ? dashboardData.pending_scans : [];
    const isVerified = profile.is_verified;

    const stats = [
        { label: t('doctor.dashboard.todays_appts', "Today's Appts"), value: statsData.appointments_today || 0, icon: Calendar, color: "#0EA5E9", bg: "#F0F9FF", path: "/doctor/appointments" },
        { label: t('doctor.dashboard.patient_directory', 'Patient Directory'), value: statsData.pending_patients || 0, icon: User, color: "#8B5CF6", bg: "#F5F3FF", path: "/doctor/patients" },
        { label: t('doctor.dashboard.scans_to_review', 'Scans to Review'), value: statsData.pending_patients || 0, icon: Activity, color: "#F43F5E", bg: "#FFF1F2", path: "/doctor/scans" },
        { label: t('doctor.dashboard.revenue_today', 'Revenue Today'), value: `₹${statsData.revenue_today || 0}`, icon: DollarSign, color: "#22C55E", bg: "#F0FDF4", path: "/doctor/revenue" },
    ];

    return (
        <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent">
            <StaggerContainer stagger="normal" delayChildren={0.05} className="max-w-7xl mx-auto space-y-8">

                {/* Verification Notice */}
                {!isVerified && (
                    <StaggerItem>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-amber-50/80 backdrop-blur-md border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                                    <ShieldAlert className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-amber-900 font-extrabold">{t('doctor.dashboard.verification_pending', 'Verification Pending')}</h3>
                                    <p className="text-amber-700 text-xs mt-0.5 font-medium leading-relaxed">{t('doctor.dashboard.verification_msg', 'Your profile is being reviewed by our medical board. You will be notified once approved.')}</p>
                                </div>
                            </div>
                            <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl font-bold shrink-0 self-end sm:self-center">
                                {t('doctor.dashboard.update_documents', 'Update Documents')}
                            </Button>
                        </motion.div>
                    </StaggerItem>
                )}

                {/* Welcome Banner */}
                <StaggerItem>
                    <div className="bg-gradient-to-br from-[#0EA5E9] via-[#0284C7] to-[#0369A1] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl border border-sky-400/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h1 className="text-3xl font-black tracking-tight">{t('doctor.dashboard.welcome', 'Welcome back,')} {profile.full_name || user?.name || 'Doctor'}</h1>
                                    {isVerified && (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase bg-emerald-400/20 text-emerald-100 px-3 py-1 rounded-full border border-emerald-400/30 shadow-inner">
                                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                            ✓ {t('doctor.dashboard.verified', 'Verified')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-white/80 text-lg leading-relaxed font-medium">
                                    {t('doctor.dashboard.appointments_today', 'You have')} <span className="font-extrabold text-white">{todayAppointments.length}</span> {t('doctor.dashboard.scheduled_today', 'appointments scheduled for today.')}
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    onClick={() => navigate("/doctor/appointments")}
                                    className="bg-white text-[#0EA5E9] hover:bg-white/95 font-bold shadow-[0_4px_20px_rgba(255,255,255,0.15)] px-6 transition-all duration-200 hover:scale-105 active:scale-95 rounded-xl h-12"
                                >
                                    {t('doctor.dashboard.manage_schedule', 'Manage Schedule')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </StaggerItem>

                {/* Stats Grid */}
                <StaggerItem>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat) => (
                            <motion.div
                                key={stat.label}
                                whileHover={{ y: -6, scale: 1.02, boxShadow: "0px 20px 30px rgba(14, 165, 233, 0.08)" }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                onClick={() => stat.path && navigate(stat.path)}
                                className="cursor-pointer h-full w-full"
                            >
                                <Card className="p-6 h-full w-full transition-all border border-sky-100/50 bg-white/60 backdrop-blur-md group shadow-md rounded-[2rem] hover:border-sky-300/30">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: stat.bg }}>
                                            <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                                        </div>
                                        {stat.path && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0EA5E9] group-hover:translate-x-1 transition-all" />}
                                    </div>
                                    <div className="flex items-baseline gap-1 text-[#0F172A]">
                                        <AnimatedCounter target={stat.value} />
                                    </div>
                                    <p className="text-xs text-[#64748B] mt-1.5 font-bold uppercase tracking-wider">{stat.label}</p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </StaggerItem>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <StaggerItem>
                        <Card className="p-6 border border-sky-100/50 bg-white/50 backdrop-blur-md h-full shadow-lg rounded-[2rem] hover:shadow-2xl transition-all duration-300 flex flex-col">
                            <h2 className="text-lg font-black text-[#0F172A] mb-1 tracking-tight">{t('doctor.dashboard.risk_distribution', 'Patient Risk Distribution')}</h2>
                            <p className="text-xs text-[#64748B] mb-6 font-semibold uppercase tracking-wider">{t('doctor.dashboard.risk_desc', 'Aggregate risk levels across your patient base')}</p>

                            <div className="relative h-64 flex-1 flex flex-col justify-between">
                                {todayAppointments.filter(a => a.risk_level).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="80%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: t('doctor.dashboard.at_risk', 'At Risk'), value: todayAppointments.filter(a => a.risk_level === 'high' || a.risk_level === 'medium').length, color: '#F43F5E' },
                                                    { name: t('doctor.dashboard.stable', 'Stable'), value: todayAppointments.filter(a => a.risk_level === 'low' || !a.risk_level).length, color: '#22C55E' },
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={90}
                                                paddingAngle={8}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                <Cell fill="#F43F5E" />
                                                <Cell fill="#22C55E" />
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => `${value} patients`}
                                                contentStyle={{ borderRadius: '20px', border: '1px solid rgba(13,148,136,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
                                        <Activity className="w-10 h-10 mb-2 opacity-30 animate-pulse text-sky-500" />
                                        <p className="text-xs uppercase font-extrabold tracking-wider">{t('common.no_data', 'No Data Available')}</p>
                                    </div>
                                )}
                                <div className="flex justify-center gap-6 pt-2 border-t border-sky-100/30">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#F43F5E]" /> <span className="text-xs text-gray-600 font-extrabold uppercase">{t('doctor.dashboard.at_risk', 'At Risk')}</span></div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#22C55E]" /> <span className="text-xs text-gray-600 font-extrabold uppercase">{t('doctor.dashboard.stable', 'Stable')}</span></div>
                                </div>
                            </div>
                        </Card>
                    </StaggerItem>

                    <StaggerItem className="lg:col-span-2">
                        <Card className="p-6 border border-sky-100/50 bg-white/50 backdrop-blur-md h-full shadow-lg rounded-[2rem] hover:shadow-2xl transition-all duration-300 flex flex-col">
                            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                                <div>
                                    <h2 className="text-lg font-black text-[#0F172A] tracking-tight">{t('doctor.dashboard.revenue_insights', 'Revenue Insights')}</h2>
                                    <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">{t('doctor.dashboard.revenue_desc', 'Weekly consultation earnings breakdown')}</p>
                                </div>
                                <div className="text-right bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
                                    <p className="text-2xl font-black text-[#22C55E]">₹{revenueSummary.week}</p>
                                    <p className="text-[10px] text-emerald-600/80 font-bold uppercase tracking-widest">{t('doctor.dashboard.weekly_revenue', 'Weekly Revenue')}</p>
                                </div>
                            </div>
                            <div className="h-64 flex-1">
                                {revenueTrends.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={revenueTrends}
                                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#0EA5E9" />
                                                    <stop offset="100%" stopColor="#0284C7" />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#64748B', fontWeight: 'bold' }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#64748B', fontWeight: 'bold' }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(14,165,233,0.03)', radius: 8 }}
                                                contentStyle={{ borderRadius: '20px', border: '1px solid rgba(13,148,136,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                                            />
                                            <Bar dataKey="revenue" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                                        <DollarSign className="w-8 h-8 mb-2 opacity-30 text-sky-500 animate-pulse" />
                                        <p className="text-xs uppercase font-extrabold tracking-wider">{t('common.no_revenue_data', 'No Revenue Data Yet')}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </StaggerItem>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <StaggerItem>
                        <Card className="p-6 border border-sky-100/50 bg-white/50 backdrop-blur-md shadow-lg rounded-[2rem] hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                            <h2 className="text-lg font-black text-[#0F172A] mb-1 tracking-tight">{t('doctor.dashboard.scans_to_review', 'Scans to Review')}</h2>
                            <p className="text-xs text-[#64748B] mb-6 font-semibold uppercase tracking-wider">{t('doctor.dashboard.scans_desc', 'Patient conjunctiva analysis requests')}</p>

                            <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
                                {pendingScans.map((scan: { id: string; profiles_patient?: { full_name?: string }; created_at: string; prediction?: string; confidence?: number }, i: number) => {
                                    const patientName = scan.profiles_patient?.full_name || "Patient";
                                    const isAnemic = (scan.prediction || '').toLowerCase() === "anemic";
                                    return (
                                        <div
                                            key={scan.id || i}
                                            className="p-4 border border-sky-100/30 bg-white/40 backdrop-blur-sm rounded-2xl hover:bg-white hover:border-sky-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                                            onClick={() => navigate(`/doctor/scans/${scan.id}`)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-extrabold text-[#0F172A] truncate group-hover:text-[#0EA5E9] transition-colors">{patientName}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(scan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                                </div>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${isAnemic ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-amber-600 bg-amber-50 border border-amber-100'}`}>
                                                    {scan.prediction ? t(`models.prediction.${scan.prediction.toLowerCase()}`, scan.prediction) : "Pending"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-500 ${isAnemic ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${Math.round((scan.confidence || 0) * 100)}%` }} />
                                                    </div>
                                                    <p className="text-[10px] mt-1.5 text-gray-400 font-bold uppercase tracking-wider">{Math.round((scan.confidence || 0) * 100)}% {t('doctor.dashboard.match', 'Match')}</p>
                                                </div>
                                                <Button size="sm" className="bg-white border-gray-200 text-gray-600 hover:text-[#0EA5E9] hover:border-[#0EA5E9] text-xs h-8 shadow-none rounded-lg">View</Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {pendingScans.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-sky-50/20 backdrop-blur-sm rounded-3xl border-2 border-dashed border-sky-100">
                                        <Activity className="w-10 h-10 mb-2 text-sky-400 opacity-60 animate-pulse" />
                                        <p className="text-sm font-bold text-[#0EA5E9]">{t('doctor.dashboard.scans_cleared', 'All scans cleared!')}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </StaggerItem>

                    <StaggerItem className="lg:col-span-2">
                        <Card className="p-6 border border-sky-100/50 bg-white/50 backdrop-blur-md shadow-lg rounded-[2rem] hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                <h2 className="text-lg font-black text-[#0F172A] tracking-tight">{t('doctor.dashboard.todays_consultations', "Today's Consultations")}</h2>
                                <Button variant="ghost" size="sm" className="text-[#0EA5E9] text-xs font-black uppercase tracking-wider rounded-lg" onClick={() => navigate("/doctor/appointments")}>
                                    {t('doctor.dashboard.full_schedule', 'Full Schedule')} <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {todayAppointments.length === 0 ? (
                                    <div className="py-12 text-center bg-sky-50/20 backdrop-blur-sm rounded-3xl border-2 border-dashed border-sky-100">
                                        <Calendar className="w-12 h-12 text-sky-400 opacity-60 mx-auto mb-2 animate-pulse" />
                                        <p className="text-sm font-bold text-[#0EA5E9]">{t('doctor.dashboard.no_appts_today', 'No appointments scheduled for today.')}</p>
                                    </div>
                                ) : todayAppointments.map((apt: { id: string; profiles_patient?: { full_name?: string; avatar_url?: string; age?: number }; scheduled_at: string; notes?: string; consultation_type?: string; patient_id: string; risk_level?: string }, i: number) => {
                                    const patientName = apt.profiles_patient?.full_name || "Patient";
                                    const time = new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const isHighRisk = apt.risk_level === 'high';
                                    const isMedRisk = apt.risk_level === 'medium';

                                    return (
                                        <div
                                            key={apt.id || i}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/60 border border-sky-50 hover:border-sky-200 hover:shadow-md transition-all duration-200 group relative pl-6 overflow-hidden"
                                        >
                                            {/* Glowing indicator border cue based on risk level */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                                isHighRisk ? 'bg-rose-500' : isMedRisk ? 'bg-amber-400' : 'bg-emerald-400'
                                            }`} />

                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-14 h-14 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center text-[#0EA5E9] font-bold text-xl shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-inner border border-sky-100">
                                                    {apt.profiles_patient?.avatar_url ? (
                                                        <img src={apt.profiles_patient.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        patientName.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-extrabold text-[#0F172A]">{patientName}</p>
                                                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full uppercase tracking-widest">{apt.profiles_patient?.age || '25'}Y</span>
                                                        {apt.risk_level && (
                                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                                isHighRisk ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse' :
                                                                isMedRisk ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            }`}>
                                                                {isHighRisk && (
                                                                    <span className="relative flex h-1.5 w-1.5">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                                                    </span>
                                                                )}
                                                                {apt.risk_level} Risk
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-[#64748B] flex items-center gap-1.5 mt-1.5 font-semibold">
                                                        <Clock className="w-3.5 h-3.5 text-sky-500" /> {time} • {apt.notes || "Conjunctiva Review"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-4 sm:pt-0">
                                                <div className="text-left sm:text-right shrink-0">
                                                    <div className="text-[10px] font-black uppercase text-[#0EA5E9] mb-1 flex items-center justify-start sm:justify-end gap-1">
                                                        <Video className="w-3.5 h-3.5" /> {apt.consultation_type || 'Video'}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-400">#APT-{apt.id?.slice(0, 4).toUpperCase()}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() => navigate(`/doctor/patients/${apt.patient_id}/timeline`)}
                                                        variant="outline"
                                                        className="h-10 px-4 rounded-xl font-bold border-gray-200 text-gray-600 hover:text-[#0EA5E9] hover:bg-sky-50 hover:border-sky-200"
                                                    >
                                                        {t('common.timeline', 'Timeline')}
                                                    </Button>
                                                    <Button
                                                        onClick={() => navigate(`/doctor/consultation/${apt.id}`)}
                                                        className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-lg shadow-sky-500/25 h-10 px-6 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all"
                                                    >
                                                        {t('doctor.dashboard.join', 'Join')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </StaggerItem>
                </div>

            </StaggerContainer>
        </div>
    );
}

