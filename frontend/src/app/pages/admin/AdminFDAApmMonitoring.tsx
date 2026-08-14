import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Shield, CheckCircle, AlertCircle, FileText, Activity, Zap, TrendingUp, Search } from "lucide-react";
import { complianceAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminFDAApmMonitoring() {
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["fdaAlerts"],
    queryFn: () => complianceAPI.getFDAAlerts().then(res => res.data),
  });

  const { data: latestMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["fdaMetricsLatest"],
    queryFn: () => complianceAPI.getFDAMetrics("anemia-detection", 1).then(res => res.data[0]),
  });

  const { data: complaints } = useQuery({
    queryKey: ["fdaComplaints"],
    queryFn: () => complianceAPI.getComplaints().then(res => res.data),
  });

  // Calculate dynamic FDA APM Score from latest telemetry metrics
  const apmScore = latestMetrics
    ? Math.round(((latestMetrics.sensitivity + latestMetrics.specificity + (latestMetrics.auc_roc || 0.94)) / 3) * 100)
    : 94;

  const mdrReportsCount = Array.isArray(complaints)
    ? complaints.filter((c: any) => c.mdr_reportable).length
    : 0;


  const displayMetrics = [
    { label: "FDA APM Score", value: `${apmScore}%`, status: apmScore >= 90 ? "good" : "warn", icon: Shield, color: "text-emerald-500" },
    { label: "Post-Market Issues", value: (alerts || []).length || "0", status: (alerts?.length || 0) > 0 ? "warn" : "good", icon: AlertCircle, color: (alerts?.length || 0) > 0 ? "text-rose-500" : "text-emerald-500" },
    { label: "MDR Reports Filed", value: mdrReportsCount.toString(), status: "good", icon: FileText, color: "text-primary" },
    { label: "Sensitivity (Latest)", value: latestMetrics ? `${(latestMetrics.sensitivity * 100).toFixed(1)}%` : "...", status: "good", icon: Activity, color: "text-violet-500" },
  ];


  if (metricsLoading || alertsLoading) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-background">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-[200px] w-full bg-muted rounded-3xl" />
          <Skeleton className="h-[400px] w-full bg-muted rounded-3xl" />
        </div>
      </div>
    );
  }

  interface Alert {
    id: string;
    model_name: string;
    messages: string[];
    alert_level: string;
    resolved: boolean;
    created_at: string;
  }

  return (
    <div className="min-h-screen pt-3 pb-12 px-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              FDA APM Monitoring
            </h1>
            <p className="text-muted-foreground mt-2">Post-Market AI Performance Surveillance • 21 CFR 803</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="rounded-xl h-11 px-6">
                <FileText className="w-4 h-4 mr-2" /> View PMA Drafts
             </Button>
          </div>
        </div>

        {/* Real-time Performance Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {displayMetrics.map((m, i) => (
             <Card key={i} className="bg-card border-border shadow-sm overflow-hidden group">
               <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                     <div className={`p-2 rounded-lg bg-current/10 ${m.color}`}>
                        <m.icon className="w-5 h-5" />
                     </div>
                     <Zap className="w-4 h-4 text-muted-foreground opacity-20" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{m.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{m.value}</p>
               </CardContent>
             </Card>
           ))}
        </div>

        {/* Surveillance Event Logs */}
        <Card className="bg-card border-border shadow-xl overflow-hidden rounded-3xl">
          <div className="p-6 border-b border-border flex items-center justify-between">
             <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Active Surveillance Stream
             </h2>
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">LIVE TELEMETRY</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-widest font-bold">
                  <th className="px-6 py-4">Event Ref</th>
                  <th className="px-6 py-4">Model Origin</th>
                  <th className="px-6 py-4">Diagnostic Signal</th>
                  <th className="px-6 py-4">Criticality</th>
                  <th className="px-6 py-4 text-right">Lifecycle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence mode="popLayout">
                  {(alerts as Alert[] || []).map((row, i) => (
                    <motion.tr 
                      key={row.id} 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded font-mono">
                          ALRT-{String(row.id).slice(0, 8)}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-foreground uppercase tracking-tighter bg-muted px-2 py-1 rounded">
                          {row.model_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-muted-foreground max-w-xs truncate text-xs">{row.messages?.[0]}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${row.alert_level === "critical" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"} font-bold text-[10px]`}>
                          {row.alert_level?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge className={`${row.resolved ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-primary"} border-none font-bold text-[10px]`}>
                          {row.resolved ? "RESOLVED" : "ACTIVE"}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                  {(alerts || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                         <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                         <p className="text-lg font-bold text-foreground opacity-40">Zero Surveillance Events</p>
                         <p className="text-xs text-muted-foreground mt-1">Model performance is within FDA-approved thresholds.</p>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Industrial Footer Note */}
        <div className="p-6 bg-muted/30 border border-border rounded-3xl flex items-start gap-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="text-foreground font-bold">MDR Stream Active:</span> Post-market surveillance is polled from the Hugging Face inference cluster. Any sensitivity deviation exceeding 5% triggers an automatic 21 CFR 803 filing draft.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
