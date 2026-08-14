import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity, CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, Server, Zap, Cpu, Database, Network
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { adminAPI } from "@/lib/api";
import { toast } from "sonner";

interface ServiceHealth {
  name: string;
  port: number;
  status: "healthy" | "unhealthy" | "down" | "checking";
  latency_ms?: number;
  last_check?: string;
  error?: string;
}

export default function SystemHealthPage() {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [overallHealth, setOverallHealth] = useState(0);

  const checkAllServices = async () => {
    setChecking(true);
    try {
      const response = await adminAPI.getSystemHealth();
      const data = response.data;

      const mappedServices = data.services.map((s: any) => ({
        name: s.name,
        status: s.status === "healthy" ? "healthy" : s.status === "unhealthy" ? "unhealthy" : "down",
        latency_ms: s.latency_ms,
        last_check: s.last_check,
        error: s.error_message,
        port: s.port
      }));

      setServices(mappedServices);
      setLastCheck(new Date(data.timestamp));

      const healthyCount = mappedServices.filter((s: any) => s.status === "healthy").length;
      setOverallHealth(mappedServices.length > 0 ? (healthyCount / mappedServices.length) * 100 : 0);

    } catch (error) {
      console.error("Health check failed:", error);
      toast.error("Failed to connect to Hugging Face backend for health metrics.");
      setServices(prev =>
        prev.map(service => ({
          ...service,
          status: "down",
          error: "Backend communication failure",
        }))
      );
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "healthy":
        return {
          icon: <CheckCircle className="w-5 h-5 text-[#22C55E]" />,
          text: "HEALTHY",
          cardClass: "border-[#22C55E]/30 bg-[#22C55E]/5 text-emerald-500",
          badgeClass: "bg-[#22C55E]/10 text-[#22C55E] border border-emerald-500/20"
        };
      case "unhealthy":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />,
          text: "UNSTABLE",
          cardClass: "border-[#F59E0B]/30 bg-[#F59E0B]/5 text-amber-500",
          badgeClass: "bg-[#F59E0B]/10 text-[#F59E0B] border border-amber-500/20"
        };
      case "down":
        return {
          icon: <XCircle className="w-5 h-5 text-[#EF4444]" />,
          text: "DOWN",
          cardClass: "border-[#EF4444]/30 bg-[#EF4444]/5 text-red-500",
          badgeClass: "bg-[#EF4444]/10 text-[#EF4444] border border-red-500/20"
        };
      default:
        return {
          icon: <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />,
          text: "CHECKING",
          cardClass: "border-white/10 bg-white/5",
          badgeClass: "bg-white/10 text-gray-400 border border-white/10"
        };
    }
  };

  return (
    <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
              <Activity className="w-9 h-9 text-[#0EA5E9] drop-shadow-[0_0_10px_rgba(14,165,233,0.2)]" />
              {t('admin.system_health.title', 'System Health')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 flex items-center gap-2">
              <Network className="w-4 h-4 text-[#0EA5E9]" />
              Real-time monitoring of Hugging Face backend microservices
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Last Synced</p>
              <p className="text-sm font-mono font-bold text-slate-800 dark:text-white mt-1">{lastCheck ? lastCheck.toLocaleTimeString() : '--:--:--'}</p>
            </div>
            <Button
              onClick={checkAllServices}
              disabled={checking}
              className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold h-11 px-6 rounded-xl shadow-lg shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              {checking ? "Checking..." : "Refresh Status"}
            </Button>
          </div>
        </div>

        {/* Global Performance Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-xl rounded-[2rem] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Cpu className="w-12 h-12 text-slate-900 dark:text-white" />
             </div>
             <CardContent className="p-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Uptime</p>
                <div className="flex items-end gap-2 mt-2">
                  <p className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{overallHealth.toFixed(0)}%</p>
                  <p className="text-xs text-[#22C55E] font-bold mb-1">Operational</p>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full mt-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallHealth}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-[#0EA5E9]"
                  />
                </div>
             </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-xl rounded-[2rem] overflow-hidden group">
             <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Healthy Services</p>
                  <CheckCircle className="w-5 h-5 text-[#22C55E]" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{services.filter(s => s.status === 'healthy').length}/{services.length}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-2 uppercase tracking-widest">All core systems online</p>
             </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-xl rounded-[2rem] overflow-hidden group">
             <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Interruptions</p>
                  <XCircle className="w-5 h-5 text-[#EF4444]" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{services.filter(s => s.status === 'down').length}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-2 uppercase tracking-widest">Requires action</p>
             </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-xl rounded-[2rem] overflow-hidden group">
             <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Latency</p>
                  <Zap className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {services.length > 0 ? (services.reduce((acc, s) => acc + (s.latency_ms || 0), 0) / services.length).toFixed(0) : 0}ms
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-2 uppercase tracking-widest">Global response speed</p>
             </CardContent>
          </Card>
        </div>

        {/* Microservices Cluster Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {services.map((service, idx) => {
              const config = getStatusConfig(service.status);
              return (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`backdrop-blur-md border ${config.cardClass} shadow-xl hover:scale-[1.02] transition-transform duration-300 overflow-hidden relative rounded-3xl bg-white/40 dark:bg-slate-900/40`}>
                    {service.status === 'down' && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-3xl rounded-full" />
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/10">
                            {service.name.includes('Database') || service.name.includes('Redis') ? <Database className="w-6 h-6 text-blue-400" /> : <Server className="w-6 h-6 text-[#0EA5E9]" />}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white leading-tight">{service.name}</h3>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Endpoint: Port {service.port || "443"}</p>
                          </div>
                        </div>
                        <Badge className={`${config.badgeClass} font-extrabold text-[10px] uppercase tracking-wider rounded-xl px-2.5 py-1 shadow-sm`}>
                          {config.text}
                        </Badge>
                      </div>

                      <div className="space-y-3 border-t border-slate-200/40 dark:border-white/5 pt-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-blue-500/70" /> Latency</span>
                          <span className="text-slate-900 dark:text-white font-mono font-bold">{service.latency_ms ? `${service.latency_ms}ms` : '---'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-blue-500/70" /> Last Check</span>
                          <span className="text-slate-900 dark:text-white font-mono font-bold">
                            {service.last_check ? new Date(service.last_check).toLocaleTimeString() : '---'}
                          </span>
                        </div>
                      </div>

                      {service.error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <p className="text-[10px] text-red-400 font-semibold leading-relaxed">
                            <span className="font-bold">ALERT:</span> {service.error}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Industrial Status Note */}
        <div className="mt-12 p-6 bg-white/50 dark:bg-slate-900/50 border border-white/20 dark:border-white/5 backdrop-blur-md rounded-[2rem] flex items-start gap-4 shadow-lg">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-[#0EA5E9] border border-blue-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              <span className="text-slate-900 dark:text-white font-extrabold">Industrial Monitoring Active:</span> Services are polled every 30 seconds across the Hugging Face microservice cluster. In case of a "DOWN" status, ensure the Space is not sleeping and check the backend logs for environment variable consistency.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
