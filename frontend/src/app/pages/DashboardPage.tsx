import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { StaggerContainer, StaggerItem, FadeIn, ScaleIn } from "../../animations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Eye, Calendar, Scan,
  ChevronRight, Activity, Heart, ArrowRight, ChevronDown, Users, AlertCircle, Settings2, Check, ListChecks, ShieldCheck, Pill, PhoneCall
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { patientAPI } from "../../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "../../lib/i18n";
import { useWebSocketStore } from "../../lib/store";
import { getWebSocketManager } from "../services/websocket";
import { PresenceList } from "@/components/features/notifications/PresenceList";
import { HeartbeatLoader } from "@/components/shared/HeartbeatLoader";

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const quickActions = [
    { label: t("patient.dashboard.qa_lab", "Analyze Lab Report"), desc: t("patient.dashboard.qa_lab_desc", "AI-based OCR vitals"), icon: Activity, path: "/patient/lab-analyzer", color: "#6366F1", bg: "#EEF2FF" },
    { label: t("patient.dashboard.qa_insurance", "Verify Insurance"), desc: t("patient.dashboard.qa_insurance_desc", "Check policy limits"), icon: ShieldCheck, path: "/patient/insurance", color: "#10B981", bg: "#ECFDF5" },
    { label: t("patient.dashboard.qa_risk", "Risk Assessment"), desc: t("patient.dashboard.qa_risk_desc", "Clinical scoring"), icon: Heart, path: "/patient/risk-assessment", color: "#E11D48", bg: "#FFF1F2" },
    { label: t("patient.dashboard.qa_meds", "Medications"), desc: t("patient.dashboard.qa_meds_desc", "Pill trackers & alerts"), icon: Pill, path: "/patient/medications", color: "#6366F1", bg: "#EEF2FF" },
    { label: t("patient.dashboard.qa_vitals", "Track Vitals"), desc: t("patient.dashboard.qa_vitals_desc", "Chronic disease monitoring"), icon: Activity, path: "/patient/tracker", color: "#E11D48", bg: "#FFF1F2" },
    { label: t("patient.dashboard.qa_nurse", "Nurse Settings"), desc: t("patient.dashboard.qa_nurse_desc", "Manage AI call routines"), icon: PhoneCall, path: "/patient/medication-schedule", color: "#0D9488", bg: "#F0FDFA" },
  ];
  const [showFamilyDropdown, setShowFamilyDropdown] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    const saved = localStorage.getItem("dashboardWidgets");
    return saved ? JSON.parse(saved) : {
      hero: true,
      healthScore: true,
      quickActions: true,
      recentScans: true,
      appointments: true
    };
  });

  const toggleWidget = (key: string) => {
    const next = { ...visibleWidgets, [key]: !visibleWidgets[key] };
    setVisibleWidgets(next);
    localStorage.setItem("dashboardWidgets", JSON.stringify(next));
  };

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['patientDashboard'],
    queryFn: () => patientAPI.getDashboard().then(res => res.data),
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && 'response' in error && (error as { response?: { status?: number } }).response?.status === 401) {
        // Production Guard: Automatically redirect to login if session expires
        console.warn("[Dashboard] 401 Unauthorized from main dashboard backend. Redirecting to login.");
        navigate('/login/patient', { replace: true });
        return false;
      }
      return failureCount < 3;
    }
  });

  const { data: questionnaires = [], isLoading: isLoadingPRO } = useQuery({
    queryKey: ["patientPROs"],
    queryFn: () => patientAPI.getPROQuestionnaires().then(res => res.data),
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && 'response' in error && (error as { response?: { status?: number } }).response?.status === 401) {
        // Production Guard: Automatically redirect to login if session expires
        console.warn("[Dashboard] 401 Unauthorized from PRO questionnaire backend. Redirecting to login.");
        navigate('/login/patient', { replace: true });
        return false;
      }
      return failureCount < 3;
    }
  });

  const submitPRO = useMutation({
    mutationFn: (data: { questionnaire_id: string; answers: Record<string, string> }) => patientAPI.submitPROQuestionnaire(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientPROs"] });
      toast.success(t("patient.dashboard.pro_submit_success", "Health report submitted successfully!"));
    },
    onError: () => toast.error(t("patient.dashboard.pro_submit_error", "Failed to submit health report"))
  });

  const [proAnswers, setProAnswers] = useState<Record<string, string>>({});
  const [activePRO, setActivePRO] = useState<{ id: string; name: string; questions: Array<{ id: string; text: string; type: string }> } | null>(null);

  const handlePROSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activePRO) {
      submitPRO.mutate({ questionnaire_id: activePRO.id, answers: proAnswers });
      setActivePRO(null);
      setProAnswers({});
    }
  };

  useEffect(() => {
    const handleOpenCustomize = () => setShowCustomize((prev) => !prev);
    window.addEventListener("open-dashboard-customize", handleOpenCustomize);

    // Real-time Dashboard Updates
    const setupRealtime = async () => {
      try {
        const manager = getWebSocketManager();
        if (manager) {
          const conn = await manager.connect('notifications'); // Reuse notification channel or dashboard
          conn.on('dashboard_update', () => {
            queryClient.invalidateQueries({ queryKey: ['patientDashboard'] });
            toast.info("Dashboard updated in real-time");
          });
          conn.on('appointment_update', () => {
            queryClient.invalidateQueries({ queryKey: ['patientDashboard'] });
            toast.success("Appointment status changed!");
          });
        }
      } catch (err) {
        console.error("Failed to setup real-time dashboard updates:", err);
      }
    };

    setupRealtime();

    return () => window.removeEventListener("open-dashboard-customize", handleOpenCustomize);
  }, [queryClient]);

  if (isLoading) {
    return <HeartbeatLoader text={t('patient.dashboard.loading', 'Loading Dashboard...')} />;
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 px-6 flex flex-col items-center justify-center text-center bg-gray-50">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-[#0F172A] mb-2">{t("patient.dashboard.error_title", "Unable to load dashboard")}</h2>
        <p className="text-[#64748B] max-w-md mb-6">{(error as Error).message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['patientDashboard'] })} className="bg-[#0D9488] hover:bg-[#0F766E] text-white px-8">
          {t("common.try_again", "Try Again")}
        </Button>
      </div>
    );
  }

  const profile = dashboardData?.profile || {};
  const upcomingAppointments = Array.isArray(dashboardData?.upcoming_appointments) ? dashboardData.upcoming_appointments : [];
  const recentScans = Array.isArray(dashboardData?.recent_scans) ? dashboardData.recent_scans : [];
  const healthScoreVal = dashboardData?.health_score ?? profile.health_score ?? 72;
  const healthScoreColor = healthScoreVal >= 80 ? '#22C55E' : healthScoreVal >= 60 ? '#F59E0B' : '#F43F5E';
  const healthScoreData = [
    { name: t("patient.dashboard.healthy", 'Healthy'), value: healthScoreVal, color: healthScoreColor },
    { name: t("patient.dashboard.risk", 'Risk'), value: 100 - healthScoreVal, color: '#F1F5F9' },
  ];
  const familyMembers = [
    { id: profile.id, name: profile.full_name || t("common.self", "Self"), relation: t("common.self", "Self"), avatar: (profile.full_name || "S").charAt(0) },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 bg-transparent">
      <StaggerContainer stagger="normal" delayChildren={0.05} className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ───────────────────────────────────────────── */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
                {t('patient.dashboard.welcome', { defaultValue: 'Welcome back, {{name}}!', name: profile.full_name?.split(' ')[0] || profile.first_name || 'there' })}
              </h1>
              <p className="text-[#64748B] text-sm mt-1 uppercase font-bold tracking-wider">{t('patient.dashboard.health_score', 'Health Score')}</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto relative">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D9488]/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t("common.search", "Search...")}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-[#0D9488] transition-all bg-white/50 backdrop-blur-sm text-[#0F172A] text-sm shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Widget toggle */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomize(v => !v)}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 rounded-xl"
                >
                  <Settings2 className="w-4 h-4" />
                  {t("patient.dashboard.widgets", "Widgets")}
                </Button>
                <AnimatePresence>
                  {showCustomize && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 w-56 glass-card rounded-xl shadow-xl border border-gray-100 py-3 z-50 px-3 bg-white/95 backdrop-blur-md"
                    >
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">{t("patient.dashboard.show_hide_widgets", "Show/Hide Widgets")}</p>
                      <div className="space-y-1">
                        {[
                          { key: 'hero', label: t("patient.dashboard.widget_hero", 'Hero Banner') },
                          { key: 'healthScore', label: t("patient.dashboard.widget_health_score", 'Health Score') },
                          { key: 'quickActions', label: t("patient.dashboard.widget_quick_actions", 'Quick Actions') },
                          { key: 'recentScans', label: t("patient.dashboard.widget_recent_scans", 'Recent Scans') },
                          { key: 'appointments', label: t("patient.dashboard.widget_appointments", 'Upcoming Visits') }
                        ].map(w => (
                          <button
                            key={w.key}
                            onClick={() => toggleWidget(w.key)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                          >
                            <span className="text-[#0F172A] font-medium">{w.label}</span>
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${visibleWidgets[w.key as keyof typeof visibleWidgets] ? 'bg-[#0D9488] text-white' : 'border border-gray-300'}`}>
                              {visibleWidgets[w.key as keyof typeof visibleWidgets] && <Check className="w-3 h-3" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Family profile picker */}
              <div className="relative">
                <button
                  onClick={() => setShowFamilyDropdown(!showFamilyDropdown)}
                  className="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-gray-200 px-3 py-2 rounded-xl shadow-sm hover:border-[#0D9488] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0D9488]/10 text-[#0D9488] font-bold flex items-center justify-center text-sm">
                    {familyMembers[0].avatar}
                  </div>
                  <span className="text-sm font-semibold text-[#0F172A]">{familyMembers[0].name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                <AnimatePresence>
                  {showFamilyDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 w-52 glass-card rounded-xl shadow-xl border border-gray-100 py-2 z-50 px-2 bg-white/95 backdrop-blur-md"
                    >
                      <div className="px-3 py-2 border-b border-gray-50 flex items-center gap-2 mb-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-400 uppercase">{t("common.profile", "Profile")}</span>
                      </div>
                      {familyMembers.map((m) => (
                        <button key={m.id} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0D9488]/10 text-[#0D9488]">
                          <div className="w-7 h-7 rounded-full bg-[#0D9488] text-white font-bold flex items-center justify-center text-sm">{m.avatar}</div>
                          <div className="text-left">
                            <p className="text-sm font-bold leading-tight">{m.name}</p>
                            <p className="text-xs text-[#0D9488]/70">{m.relation}</p>
                          </div>
                        </button>
                      ))}
                      <div className="px-2 mt-1 pt-1 border-t border-gray-50">
                        <Button variant="outline" className="w-full text-xs h-8 border-dashed rounded-lg" onClick={() => navigate('/patient/profile')}>
                          {t("patient.dashboard.manage_profile", "Manage Profile")}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* ── Hero Banner + Health Score + Streak ──────────────── */}
        <StaggerItem>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Hero Banner */}
            {visibleWidgets.hero && (
              <div className="lg:col-span-8 h-full">
                <div className="bg-gradient-to-br from-[#0D9488] to-[#0F766E] rounded-3xl p-8 text-white relative overflow-hidden h-full min-h-[220px] shadow-xl border border-teal-600/30">
                  <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full">{t("patient.dashboard.hero_tag1", "AI-Powered Screening")}</span>
                      {recentScans.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase bg-green-400/30 text-green-100 px-3 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          ✓ {t("patient.dashboard.hero_tag2", "Active")}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-black mb-2 leading-tight">{t('patient.dashboard.hero_title', 'Time for your next screening')}</h2>
                    <p className="text-white/80 mb-5 text-sm leading-relaxed max-w-sm font-medium">
                      {recentScans.length > 0
                        ? t("patient.dashboard.hero_desc_scan", { defaultValue: "Your last scan was on {{date}}. Regular conjunctiva scans help track hemoglobin trends and detect anemia risk early.", date: new Date(recentScans[0].created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) })
                        : t("patient.dashboard.hero_desc_new", "Welcome to Netra AI! Start with a free AI-powered conjunctiva scan — no blood test needed. Early detection saves lives.")}
                    </p>
                    {/* Stats row */}
                    <div className="flex items-center gap-6 mb-6 bg-black/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm max-w-md">
                      <div className="text-center flex-1">
                        <p className="text-3xl font-black tracking-tight">{recentScans.length}</p>
                        <p className="text-[10px] text-white/70 uppercase tracking-wide font-bold">{t("patient.dashboard.stat_scans", "Scans Done")}</p>
                      </div>
                      <div className="w-px h-8 bg-white/20" />
                      <div className="text-center flex-1">
                        <p className="text-3xl font-black tracking-tight">{upcomingAppointments.length}</p>
                        <p className="text-[10px] text-white/70 uppercase tracking-wide font-bold">{t("patient.dashboard.stat_upcoming", "Upcoming")}</p>
                      </div>
                      <div className="w-px h-8 bg-white/20" />
                      <div className="text-center flex-1">
                        <p className="text-sm font-black uppercase tracking-tight py-1.5">
                          {recentScans.length > 0
                            ? ((recentScans[0].prediction || '').toLowerCase() === 'anemic' ? `⚠️ ${t("patient.dashboard.risk", "Risk")}` : `✓ ${t("patient.dashboard.normal", "Normal")}`)
                            : t("patient.dashboard.pending", "Pending")}
                        </p>
                        <p className="text-[10px] text-white/70 uppercase tracking-wide font-bold">{t("patient.dashboard.stat_last_result", "Last Result")}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate("/patient/scan")}
                      className="bg-white text-[#0D9488] hover:bg-white/95 font-bold shadow-[0_4px_20px_rgba(255,255,255,0.25)] px-6 transition-all duration-200 hover:scale-105 active:scale-95 rounded-xl h-11"
                    >
                      <Scan className="w-4 h-4 mr-2" /> {t("patient.dashboard.btn_start_scan", "Start Smart Scan")}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Health Score */}
            {visibleWidgets.healthScore && (
              <div className="lg:col-span-4 h-full">
                <Card className="p-6 border border-teal-100/50 bg-white/50 backdrop-blur-md flex flex-col h-full glass-card min-h-[220px] shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl">
                  <h3 className="font-black text-[#0F172A] mb-0.5 tracking-tight">{t("patient.dashboard.health_score", "Health Score")}</h3>
                  <p className="text-xs text-[#64748B] mb-2 font-bold uppercase tracking-wider">{t("patient.dashboard.wellness_index", "Overall Wellness Index")}</p>
                  <div className="relative" style={{ minHeight: 160 }}>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={healthScoreData}
                          cx="50%" cy="100%"
                          startAngle={180} endAngle={0}
                          innerRadius="60%" outerRadius="90%"
                          dataKey="value" stroke="none"
                        >
                          {healthScoreData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute bottom-0 left-0 right-0 text-center">
                      <span
                        className="text-5xl font-black tracking-tighter drop-shadow-[0_2px_10px_rgba(13,148,136,0.2)]"
                        style={{ color: healthScoreColor }}
                      >
                        {healthScoreVal}
                      </span>
                      <span className="text-gray-400 text-sm font-semibold"> / 100</span>
                    </div>
                  </div>
                  {/* Score breakdown */}
                  <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                    {[
                      { label: t("patient.dashboard.breakdown_scans", "Scan History"), value: Math.min(100, recentScans.length * 20), color: "#0D9488" },
                      { label: t("patient.dashboard.breakdown_appt", "Appt. Adherence"), value: Math.min(100, upcomingAppointments.length > 0 ? 80 : 40), color: "#0EA5E9" },
                      { label: t("patient.dashboard.breakdown_activity", "Activity"), value: 65, color: "#8B5CF6" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-gray-500 font-bold uppercase tracking-wider">{item.label}</span>
                          <span className="font-extrabold" style={{ color: item.color }}>{item.value}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

          </div>
        </StaggerItem>

        {/* ── Quick Actions ────────────────────────────────────── */}
        {visibleWidgets.quickActions && (
          <StaggerItem>
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-wider">{t("patient.dashboard.quick_actions", "Quick Actions")}</h2>
              </div>
              <StaggerContainer stagger="fast" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {quickActions
                  .filter(a => a.label.toLowerCase().includes(searchTerm.toLowerCase()) || a.desc.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((action) => (
                  <motion.div
                    key={action.label}
                    whileHover={{ y: -6, scale: 1.015, boxShadow: "0px 20px 30px rgba(13, 148, 136, 0.08)" }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="p-6 cursor-pointer border border-teal-100/50 bg-white/60 backdrop-blur-md hover:border-teal-300/50 group flex flex-col h-full rounded-3xl relative overflow-hidden w-full shadow-lg"
                    onClick={() => navigate(action.path)}
                  >
                    {/* Subtle background glow on hover */}
                    <div className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" style={{ backgroundColor: action.color }} />

                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shrink-0 shadow-inner transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: action.bg }}>
                      <action.icon className="w-7 h-7" style={{ color: action.color }} />
                    </div>

                    <div className="space-y-2 mb-6 text-left">
                      <h3 className="font-extrabold text-[#0F172A] text-lg leading-tight group-hover:text-[#0D9488] transition-colors">{action.label}</h3>
                      <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2 font-medium">{action.desc}</p>
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100/50">
                      <div className="flex items-center gap-2 text-xs font-black transition-all uppercase tracking-widest" style={{ color: action.color }}>
                        <span>{t("common.open", "Open")}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </StaggerContainer>
            </div>
          </StaggerItem>
        )}

        {/* ── Recent Scans + Upcoming Appointments ─────────────── */}
        <StaggerItem>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent Scans */}
            {visibleWidgets.recentScans && (
              <Card className="p-6 border border-teal-100/50 bg-white/50 backdrop-blur-md glass-card h-full flex flex-col rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-[#0F172A] uppercase tracking-wider">{t("patient.dashboard.recent_scans", "Recent AI Scans")}</h2>
                  <Button variant="ghost" size="sm" className="text-[#0D9488] text-xs font-black uppercase tracking-wider rounded-lg" onClick={() => navigate("/patient/history")}>
                    {t("common.view_all", "View All")} <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3 flex-1">
                  {recentScans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Eye className="w-10 h-10 text-gray-200 mb-3 animate-pulse" />
                      <p className="text-gray-400 text-sm font-bold">{t("patient.dashboard.no_scans", "No scans yet")}</p>
                      <p className="text-gray-300 text-xs mt-1 font-medium">{t("patient.dashboard.no_scans_desc", "Take your first AI eye scan")}</p>
                    </div>
                  ) : (recentScans as Array<{ id?: string; prediction?: string; confidence?: number; created_at: string }>).map((scan, i) => {
                    const isAnemic = (scan.prediction || '').toLowerCase() === "anemic";
                    const isNormal = (scan.prediction || '').toLowerCase() === "normal";
                    return (
                      <div
                        key={scan.id || i}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 hover:bg-white/90 border border-transparent hover:border-teal-100 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => navigate('/patient/history')}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${isAnemic ? "bg-[#F43F5E]/10" : isNormal ? "bg-[#22C55E]/10" : "bg-orange-100"}`}>
                            <Eye className={`w-5 h-5 ${isAnemic ? "text-[#F43F5E]" : isNormal ? "text-[#22C55E]" : "text-orange-500"}`} />
                          </div>
                          <div className="text-left">
                            <p className="font-extrabold text-sm text-[#0F172A]">{new Date(scan.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            <p className="text-xs text-[#64748B] font-semibold">{t("patient.dashboard.confidence", "Confidence")}: {Math.round((scan.confidence || 0) * 100)}%</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${isAnemic ? "bg-[#F43F5E]/10 text-[#F43F5E] border border-[#F43F5E]/20" : isNormal ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20" : "bg-orange-100 text-orange-600 border border-orange-200"}`}>
                          {scan.prediction ? t(`models.prediction.${scan.prediction.toLowerCase()}`, scan.prediction) : t("patient.dashboard.done", "Done")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Upcoming Appointments */}
            {visibleWidgets.appointments && (
              <Card className="p-6 border border-[#EA580C]/10 bg-white/50 backdrop-blur-md glass-card h-full flex flex-col rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-[#0F172A] uppercase tracking-wider">{t("patient.dashboard.upcoming_visits", "Upcoming Visits")}</h2>
                  <Button variant="ghost" size="sm" className="text-[#0EA5E9] text-xs font-black uppercase tracking-wider rounded-lg" onClick={() => navigate("/patient/appointments")}>
                    {t("common.view_all", "View All")} <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3 flex-1">
                  {upcomingAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Calendar className="w-10 h-10 text-gray-200 mb-3 animate-pulse" />
                      <p className="text-gray-400 text-sm font-bold">{t("patient.dashboard.no_appointments", "No upcoming appointments")}</p>
                      <p className="text-gray-300 text-xs mt-1 font-medium">{t("patient.dashboard.no_appointments_desc", "Book a consultation below")}</p>
                    </div>
                  ) : (upcomingAppointments as Array<{
                    id?: string;
                    scheduled_at: string;
                    profiles_doctor?: {
                      name?: string;
                      specialty?: string;
                      avatar_url?: string
                    }
                  }>).map((apt, i) => {
                    const doctorName = apt.profiles_doctor?.name || t("common.doctor", "Doctor");
                    const specialty = apt.profiles_doctor?.specialty || t("common.specialist", "Specialist");
                    const time = new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const date = new Date(apt.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
                    return (
                      <div key={apt.id || i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/40 hover:bg-white/90 border border-transparent hover:border-sky-100 hover:shadow-md transition-all duration-200">
                        <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center text-[#0EA5E9] font-black shrink-0 overflow-hidden shadow-inner border border-[#0EA5E9]/20">
                          {apt.profiles_doctor?.avatar_url
                            ? <img src={apt.profiles_doctor.avatar_url} alt="" className="w-full h-full object-cover" />
                            : doctorName.charAt(0)
                          }
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-extrabold text-sm text-[#0F172A] truncate">{t("common.dr_prefix", "Dr.")} {doctorName.replace(t("common.dr_prefix", "Dr.") + " ", "").replace("Dr. ", "")}</p>
                          <p className="text-xs text-[#64748B] capitalize font-semibold">{specialty.replace("_", " ")}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-[#0F172A]">{time}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100/50">
                  <Button
                    onClick={() => navigate("/patient/doctors")}
                    className="w-full bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] hover:from-[#0F766E] hover:to-[#0284C7] text-white font-black uppercase tracking-wider h-11 rounded-xl shadow-md transition-all hover:scale-[1.01]"
                  >
                    {t("patient.dashboard.book_consultation", "Book Consultation")}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </StaggerItem>

        {/* ── Assigned Health Surveys (PROs) ───────────────────── */}
        {!isLoadingPRO && questionnaires.length > 0 && (
          <StaggerItem>
            <div className="w-full mt-4">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="w-5 h-5 text-[#0EA5E9]" />
                <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-wider">{t("patient.dashboard.assigned_surveys", "Assigned Health Surveys")}</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(questionnaires as Array<{ id: string; name: string; questions?: Array<{ id: string; text: string; type: string }> }>).map((q) => (
                  <Dialog key={q.id} open={activePRO?.id === q.id} onOpenChange={(open: boolean) => {
                    if (open) setActivePRO({ ...q, questions: q.questions || [] });
                    else { setActivePRO(null); setProAnswers({}); }
                  }}>
                    <DialogTrigger asChild>
                      <motion.div
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="p-5 border border-blue-100/60 bg-blue-50/40 backdrop-blur-md hover:bg-blue-50/70 transition-all cursor-pointer group shadow-lg rounded-3xl text-left"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                            <Activity className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#0EA5E9] bg-white border border-blue-100 px-2 py-0.5 rounded-lg shadow-sm">{t("patient.dashboard.required", "Required")}</span>
                        </div>
                        <h3 className="font-extrabold text-[#0F172A] text-sm mb-1 group-hover:text-blue-600 transition-colors">{q.name}</h3>
                        <p className="text-xs text-[#64748B] mb-4 font-medium leading-relaxed">{t("patient.dashboard.survey_desc", "Complete your routine health outcome assessment.")}</p>
                        <div className="flex items-center text-xs font-black text-blue-600 gap-1 uppercase tracking-widest">
                          {t("common.start", "Start")} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-800">{q.name}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handlePROSubmit} className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto px-2">
                        {(q.questions || []).map((qst, idx) => (
                          <div key={qst.id} className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                            <Label className="text-slate-700 font-extrabold text-sm leading-tight block mb-1">
                              {idx + 1}. {qst.text}
                            </Label>
                            <Input
                              type={qst.type === 'number' ? 'number' : 'text'}
                              placeholder={qst.type === 'number' ? t("patient.dashboard.enter_number", 'Enter a number (0-10)') : t("patient.dashboard.enter_response", 'Enter your response')}
                              required
                              value={proAnswers[qst.id] || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setProAnswers(prev => ({ ...prev, [qst.id]: e.target.value }))
                              }
                              className="bg-white border-slate-200 shadow-sm rounded-xl focus-visible:ring-[#0EA5E9]"
                            />
                          </div>
                        ))}
                        <DialogFooter>
                          <Button type="submit" disabled={submitPRO.isPending} className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold rounded-xl h-11 shadow-md transition-all">
                            {submitPRO.isPending ? t("common.submitting", "Submitting...") : t("common.submit_answers", "Submit Answers")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          </StaggerItem>
        )}

      </StaggerContainer>
    </div>
  );
}

