import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useTranslation } from "@/lib/i18n";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Users, UserRoundPlus, Calendar, Scan, TrendingUp, AlertCircle, ArrowUpRight, Zap, ShieldCheck, FileText, Activity, UserCheck, AlertTriangle, Brain } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { adminAPI } from '@/lib/api';
import { HeartbeatLoader } from '@/components/shared/HeartbeatLoader';
import { Button } from "@/components/ui/button";
import { getWebSocketManager } from '../../services/websocket';
import { toast } from 'sonner';
import { StaggerContainer, StaggerItem, FadeIn, ScaleIn } from "@/animations";

interface DayData {
    name: string;
    count: number;
}

interface DashboardStats {
    total_patients?: number;
    total_doctors?: number;
    total_appointments?: number;
    total_scans?: number;
    total_doctors_pending?: number;
    growth_data?: Array<{ name: string; users: number; scans: number }>;
    appointments_weekly?: DayData[];
}

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
        >
            {typeof target === "number" ? current : target}{suffix}
        </motion.span>
    );
}

export default function AdminDashboardPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: dashboardData, isLoading, error } = useQuery<DashboardStats>({
        queryKey: ['adminStats'],
        queryFn: () => adminAPI.getStats().then(res => res.data)
    });

    useEffect(() => {
        const setupRealtime = async () => {
            try {
                const manager = getWebSocketManager();
                if (manager) {
                    const conn = await manager.connect('notifications');
                    conn.on('admin_dashboard_update', () => {
                        queryClient.invalidateQueries({ queryKey: ['adminStats'] });
                        toast.info("Admin dashboard refreshed");
                    });
                    conn.on('system_alert', (data) => {
                        toast.error(`System Alert: ${data.message || 'Critical Issue Detected'}`);
                    });
                }
            } catch (err) {
                console.error("Failed to setup real-time admin updates:", err);
            }
        };
        setupRealtime();
    }, [queryClient]);

    if (isLoading) {
        return <HeartbeatLoader text="Initializing Platform Command Center..." />;
    }

    if (error) {
        console.error("[AdminDashboardPage] Error loading dashboard stats:", error);
        return (
            <div className="min-h-screen pt-24 px-6 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-[#0B0F1A] -mx-6 lg:-mx-8">
                <div className="w-16 h-16 bg-red-100/10 dark:bg-red-100/5 text-[#F43F5E] rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{t("admin.dashboard.unable_to_load", "Unable to load dashboard")}</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">{t("admin.dashboard.fetch_error", "We encountered an issue fetching platform statistics:")} {(error as any)?.response?.data?.detail || (error as Error).message}</p>
                {import.meta.env.DEV && (
                    <div className="mb-6 p-4 bg-black/5 dark:bg-white/5 rounded text-left overflow-auto max-h-40 max-w-lg mx-auto">
                        <pre className="text-xs text-red-500/80">{JSON.stringify(error, null, 2)}</pre>
                    </div>
                )}
                <Button onClick={() => window.location.reload()} className="bg-[#0D9488] hover:bg-[#0F766E] text-white px-8 rounded-xl font-bold shadow-lg shadow-[#0D9488]/20">
                    {t("common.try_again", "Try Again")}
                </Button>
            </div>
        );
    }

    const statsData = dashboardData || {};

    const dynamicStats = [
        { title: t("admin.dashboard.stats.total_patients", "Total Patients"), value: statsData.total_patients || 0, change: (statsData as any).patient_growth || '+0%', icon: Users, color: '#0D9488', bg: 'bg-[#0D9488]/10' },
        { title: t("admin.dashboard.stats.total_doctors", "Total Doctors"), value: statsData.total_doctors || 0, change: (statsData as any).doctor_growth || '+0%', icon: UserRoundPlus, color: '#0EA5E9', bg: 'bg-[#0EA5E9]/10' },
        { title: t("admin.dashboard.stats.total_appointments", "Total Appointments"), value: statsData.total_appointments || 0, change: (statsData as any).appointment_growth || '+0%', icon: Calendar, color: '#F43F5E', bg: 'bg-[#F43F5E]/10' },
        { title: t("admin.dashboard.stats.total_scans", "AI Scans Processed"), value: statsData.total_scans || 0, change: (statsData as any).scan_growth || '+0%', icon: Scan, color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10' },
    ];

    const growthData = statsData.growth_data || [];
    const appointmentsData = statsData.appointments_weekly || [];

    const hasGrowthData = growthData.length > 0;
    const hasAppointmentsData = appointmentsData.length > 0;

    return (
        <div className="min-h-screen pt-4 pb-12 px-6 bg-transparent">
            <StaggerContainer stagger="normal" delayChildren={0.05} className="max-w-[1600px] mx-auto space-y-10">
                <StaggerItem>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tighter mb-2">
                                {t("admin.dashboard.title", "Platform Overview")}
                            </h1>
                            <p className="text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
                                {t("admin.dashboard.subtitle", "NetraAI Operational Command Center")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-white/5 text-xs text-emerald-500 font-black tracking-wider uppercase shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Live Telemetry Feed
                        </div>
                    </div>
                </StaggerItem>

                {/* Stats Grid */}
                <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" stagger="fast">
                    {dynamicStats.map((stat) => (
                        <StaggerItem key={stat.title}>
                            <motion.div
                                whileHover={{ y: -6, scale: 1.015 }}
                                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                            >
                                <Card className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-lg dark:shadow-2xl rounded-[2.5rem] group hover:border-[#8B5CF6]/30 dark:hover:border-[#8B5CF6]/30 transition-all relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                        <stat.icon className="w-24 h-24 text-white" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} border border-white/5`}>
                                                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-black bg-green-500/10 text-green-500 dark:text-green-400 px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-widest">
                                                <TrendingUp className="w-3 h-3" />
                                                {stat.change}
                                            </div>
                                        </div>
                                        <h3 className="text-[#64748B] dark:text-gray-400 text-sm font-semibold tracking-tight">{stat.title}</h3>
                                        <p className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tighter mt-1">
                                            <AnimatedCounter target={stat.value} />
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Growth Area Chart */}
                    <StaggerItem className="lg:col-span-2">
                        <Card className="p-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-lg dark:shadow-2xl rounded-[3rem] relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div>
                                    <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">{t("admin.dashboard.platform_growth", "Platform Growth")}</h3>
                                    <p className="text-[10px] text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-wider mt-0.5">{t("admin.dashboard.growth_subtitle", "Aggregated User Engagement and Diagnostic Throughput")}</p>
                                </div>
                                <select className="px-4 py-2 bg-white/50 dark:bg-slate-900/40 border border-gray-200 dark:border-white/10 rounded-xl text-[10px] text-gray-700 dark:text-white font-black uppercase tracking-widest outline-none focus:border-[#8B5CF6]">
                                    <option>{t("common.last_6_months", "Last 6 Months")}</option>
                                    <option>{t("common.this_year", "This Year")}</option>
                                </select>
                            </div>
                            <div className="h-80 w-full relative z-10">
                                {hasGrowthData ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)' }}
                                                labelStyle={{ fontWeight: 'black', color: 'white', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                            />
                                            <Area type="monotone" dataKey="scans" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#colorScans)" />
                                            <Area type="monotone" dataKey="users" stroke="#0EA5E9" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center border border-white/5 rounded-[2rem] bg-black/10">
                                        <div className="text-center">
                                            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-10 text-white" />
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t("admin.dashboard.no_growth_data", "No growth data available yet")}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </StaggerItem>

                    {/* Weekly Appointments Bar Chart */}
                    <StaggerItem>
                        <Card className="p-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-lg dark:shadow-2xl rounded-[3rem] relative overflow-hidden flex flex-col h-full">
                            <div className="mb-8 relative z-10">
                                <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">{t("admin.dashboard.weekly_appointments", "Consultations")}</h3>
                                <p className="text-[10px] text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-wider mt-0.5">Weekly Appointment Density</p>
                            </div>
                            <div className="flex-1 min-h-[250px] relative z-10">
                                {hasAppointmentsData ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={appointmentsData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                contentStyle={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)' }}
                                            />
                                            <Bar dataKey="count" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center border border-gray-200 dark:border-white/5 rounded-[2rem] bg-gray-50 dark:bg-black/10">
                                        <div className="text-center">
                                            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-10 text-black dark:text-white" />
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Awaiting Schedule Data</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5 flex items-center justify-between relative z-10">
                                <div>
                                    <p className="text-[9px] text-[#64748B] dark:text-gray-500 font-black uppercase tracking-widest mb-1">{t("common.total_this_week", "Weekly Total")}</p>
                                    <p className="text-2xl font-black text-[#0F172A] dark:text-white">
                                        <AnimatedCounter target={hasAppointmentsData ? appointmentsData.reduce((sum, day) => sum + (day.count || 0), 0) : 0} />
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-[#F43F5E]/10 flex items-center justify-center border border-[#F43F5E]/20">
                                    <Calendar className="w-6 h-6 text-[#F43F5E]" />
                                </div>
                            </div>
                        </Card>
                    </StaggerItem>
                </div>

                {/* Attention Needed Section */}
                <StaggerItem>
                    <div className="flex items-center gap-3 mt-12 mb-6">
                        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                        <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-widest">{t("admin.dashboard.requires_attention", "System Alerts & Approvals")}</h3>
                    </div>
                </StaggerItem>

                <StaggerContainer className="grid md:grid-cols-3 gap-8" stagger="normal">
                    {[
                        { title: t("admin.dashboard.action.pending_doctors", "Pending Approvals"), count: (statsData.total_doctors_pending || 0), action: t("admin.dashboard.action.review_profiles", "Review Profiles"), color: "#F59E0B", path: "/admin/doctors", icon: UserCheck, pulse: true },
                        { title: t("admin.dashboard.action.reported_issues", "Critical Tickets"), count: 0, action: t("admin.dashboard.action.view_tickets", "Resolve Now"), color: "#F43F5E", path: "/admin/patients", icon: AlertTriangle, pulse: false },
                        { title: t("admin.dashboard.action.system_updates", "Core Intelligence"), count: 1, action: t("admin.dashboard.action.view_logs", "View Engine Logs"), color: "#0EA5E9", path: "/admin/scans", icon: Zap, pulse: false }
                    ].map((item) => (
                        <StaggerItem key={item.title}>
                            <motion.div
                                whileHover={{ y: -6, scale: 1.015 }}
                                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                            >
                                <Card className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-lg dark:shadow-2xl rounded-[2.5rem] group hover:border-gray-200 dark:hover:border-white/10 transition-all">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-start gap-3">
                                            <div>
                                                <p className="text-4xl font-black mb-2" style={{ color: item.color }}>
                                                    <AnimatedCounter target={item.count} />
                                                </p>
                                                <p className="font-black text-[#0F172A] dark:text-white text-xs uppercase tracking-widest">{item.title}</p>
                                            </div>
                                            {item.pulse && item.count > 0 && (
                                                <span className="relative flex h-3 w-3 mt-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: item.color }}></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: item.color }}></span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                                            <item.icon className="w-5 h-5" style={{ color: item.color }} />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate(item.path)}
                                        variant="ghost"
                                        className="w-full h-12 bg-white/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-between px-6 transition-all group shadow-sm border border-gray-200/50 dark:border-transparent"
                                        style={{ color: item.color }}
                                    >
                                        {item.action} <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </Button>
                                </Card>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                {/* Intelligence Feeds */}
                <StaggerContainer className="grid md:grid-cols-2 gap-8 mt-12 pb-12" stagger="normal">
                    <StaggerItem>
                        <motion.div
                            whileHover={{ y: -6, scale: 1.015 }}
                            transition={{ type: "spring", stiffness: 300, damping: 18 }}
                        >
                            <Card className="p-8 bg-gradient-to-br from-[#0D9488] to-[#0F766E] border-none shadow-2xl rounded-[3rem] text-white relative overflow-hidden group h-full">
                                <div className="absolute right-0 bottom-0 p-12 opacity-10 -rotate-12 group-hover:rotate-0 transition-transform">
                                    <Brain className="w-40 h-40" />
                                </div>
                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                                        <Activity className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black tracking-tight">Diagnostic Intelligence</h4>
                                        <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">Model Accuracy and Performance Metrics</p>
                                    </div>
                                </div>
                                <p className="text-sm text-white/70 mb-8 max-w-sm font-medium">Analyze ML model accuracy, latency, and success rates across all diagnostic tools in real-time.</p>
                                <div className="flex gap-4 relative z-10">
                                    <Button
                                        onClick={() => navigate('/admin/reports')}
                                        className="bg-white text-[#0D9488] hover:bg-white/90 rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] shadow-xl"
                                    >
                                        Generate Audit
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/admin/mcp')}
                                        variant="ghost"
                                        className="bg-white/10 hover:bg-white/20 text-white rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] border border-white/10"
                                    >
                                        Live Monitor
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </StaggerItem>

                    <StaggerItem>
                        <motion.div
                            whileHover={{ y: -6, scale: 1.015 }}
                            transition={{ type: "spring", stiffness: 300, damping: 18 }}
                        >
                            <Card className="p-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-lg dark:shadow-2xl rounded-[3rem] relative overflow-hidden group h-full hover:border-[#8B5CF6]/30 transition-all">
                                <div className="absolute right-0 bottom-0 p-12 opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform">
                                    <ShieldCheck className="w-40 h-40 text-black dark:text-white" />
                                </div>
                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    <div className="w-14 h-14 bg-[#8B5CF6]/10 rounded-2xl flex items-center justify-center shadow-lg border border-[#8B5CF6]/20">
                                        <ShieldCheck className="w-7 h-7 text-[#8B5CF6]" />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">Compliance Trails</h4>
                                        <p className="text-[10px] text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-widest">HIPAA & SOC 2 Audit Evidence</p>
                                    </div>
                                </div>
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mb-8 max-w-sm font-medium">Access HIPAA-compliant logs for all patient data access and diagnostic operations across the platform.</p>
                                <div className="flex gap-4 relative z-10">
                                    <Button
                                        onClick={() => navigate('/admin/reports')}
                                        className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#8B5CF6]/20"
                                    >
                                        Export Evidence
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/admin/security')}
                                        variant="ghost"
                                        className="bg-white/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-foreground rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] border border-gray-200 dark:border-white/10"
                                    >
                                        Security Hub
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </StaggerItem>
                </StaggerContainer>
            </StaggerContainer>
        </div>
    );
}
