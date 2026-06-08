import React from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { doctorAPI } from "@/lib/api";
import { AlertTriangle, Clock, Phone, ArrowLeft, Stethoscope, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { useTranslation } from "@/lib/i18n";

interface AlertRecord {
  id: string;
  patient_id: string;
  created_at: string;
  side_effects_detected: string;
  transcript?: string;
  profiles_patient?: {
    full_name?: string;
  };
}

export default function AlertsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState("");
  const { data: alerts, isLoading } = useQuery<AlertRecord[]>({
    queryKey: ["doctorAlerts"],
    queryFn: () => doctorAPI.getAlerts().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 bg-transparent flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500 mb-4"></div>
        <p className="text-slate-650 dark:text-slate-400 font-medium">
          {t('doctor.alerts.loading', 'Loading AI Nurse alerts...')}
        </p>
      </div>
    );
  }

  const filteredAlerts = (alerts || []).filter(a =>
    (a.profiles_patient?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.side_effects_detected || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-24 pb-12 px-6 bg-transparent"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2 bg-white/70 dark:bg-slate-900/50 border-gray-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 rounded-2xl shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> {t('common.back', 'Back')}
          </Button>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder={t("common.search_patient", "Search patient...")}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200/50 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/20 bg-white/70 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 shadow-sm text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="relative overflow-hidden p-6 bg-gradient-to-r from-rose-600 to-red-700 dark:from-rose-950/50 dark:to-red-900/50 border border-rose-500/30 dark:border-rose-500/20 shadow-2xl rounded-3xl text-white flex items-center justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3 tracking-tight">
              <AlertTriangle className="w-8 h-8 text-rose-200" />
              {t('doctor.alerts.title', 'Nurse AI Escalations')}
            </h1>
            <p className="text-rose-100 max-w-xl text-base md:text-lg font-medium leading-relaxed">
              {t('doctor.alerts.subtitle', 'Critical side-effects detected by the autonomous voice agent during daily patient check-ins. Immediate triage is recommended.')}
            </p>
          </div>
          <div className="hidden md:flex bg-white/10 border border-white/10 p-5 rounded-2xl backdrop-blur-md items-center gap-4 relative z-10">
            <div className="text-center">
              <p className="text-4xl font-black tracking-tight">{filteredAlerts.length}</p>
              <p className="text-xs font-bold tracking-widest uppercase text-rose-200 mt-1">{t('doctor.alerts.active_alerts', 'Active Alerts')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {!alerts || alerts.length === 0 ? (
            <Card className="p-16 text-center border-gray-200/50 dark:border-white/10 shadow-xl rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
              <Stethoscope className="w-16 h-16 text-emerald-500/80 dark:text-emerald-400/80 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{t('doctor.alerts.all_clear', 'All Clear!')}</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium max-w-md mx-auto">{t('doctor.alerts.no_alerts', 'No severe side-effects detected by the AI Nurse today.')}</p>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className="p-6 border border-gray-200/50 dark:border-white/10 border-l-4 border-l-rose-500 dark:border-l-rose-500/80 hover:shadow-2xl transition-all bg-white/70 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl group cursor-pointer"
                  onClick={() => navigate(`/doctor/patients/${alert.patient_id}`)}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex gap-4 flex-1">
                      <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center shrink-0 border border-rose-200/30">
                        <Phone className="w-5 h-5 text-rose-600 dark:text-rose-450" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{alert.profiles_patient?.full_name || "Unknown Patient"}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {new Date(alert.created_at).toLocaleString()}
                        </p>

                        <div className="mt-4 p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-100/50 dark:border-rose-900/20">
                          <p className="text-xs font-black text-rose-900 dark:text-rose-300 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400"/> {t('doctor.alerts.reported_side_effect', 'Reported Side Effect:')}
                          </p>
                          <p className="text-rose-700 dark:text-rose-200 leading-relaxed font-medium">"{alert.side_effects_detected}"</p>
                        </div>

                        {alert.transcript && (
                          <details
                            className="mt-3 p-4 bg-slate-50/50 dark:bg-slate-850/40 rounded-2xl border border-slate-200/50 dark:border-white/5 cursor-pointer group/details relative z-10 transition-all hover:border-slate-350"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <summary className="font-bold text-slate-700 dark:text-slate-300 list-none select-none flex items-center justify-between outline-none text-sm">
                              <span className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                {t('doctor.alerts.view_transcript', 'View Full Call Transcript')}
                              </span>
                              <span className="text-slate-400 group-open/details:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="mt-3 pt-3 border-t border-slate-200/30 dark:border-white/5 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto custom-scrollbar">
                              {alert.transcript}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center shrink-0">
                      <Button
                        className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-rose-600/10 group-hover:shadow-rose-600/20 group-hover:scale-[1.02] active:scale-[0.98] transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/doctor/patients/${alert.patient_id}`);
                        }}
                      >
                        {t('doctor.alerts.view_patient', 'View Patient Record')}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
