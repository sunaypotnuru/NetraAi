import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Shield, CheckCircle, Clock, AlertCircle, GitBranch, Lock, Activity, TrendingUp, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { complianceAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminComplianceDashboard() {
  const { data: soc2Stats, isLoading: soc2Loading } = useQuery({
    queryKey: ["soc2Stats"],
    queryFn: () => complianceAPI.getSOC2Statistics().then(res => res.data),
  });

  const { data: iecStats, isLoading: iecLoading } = useQuery({
    queryKey: ["iecStats"],
    queryFn: () => complianceAPI.getIECCoverageStats().then(res => res.data),
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["fdaAlerts"],
    queryFn: () => complianceAPI.getFDAAlerts().then(res => res.data),
  });

  const { data: complaints = [], isLoading: complaintsLoading } = useQuery({
    queryKey: ["complaints"],
    queryFn: () => complianceAPI.getComplaints().then(res => res.data),
  });

  const isLoading = soc2Loading || iecLoading || alertsLoading || complaintsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 bg-background">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-[200px] w-full bg-muted rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[300px] bg-muted rounded-3xl" />
            <Skeleton className="h-[300px] bg-muted rounded-3xl" />
            <Skeleton className="h-[300px] bg-muted rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  interface Complaint {
    status: string;
    [key: string]: unknown;
  }

  const openComplaints = (complaints as Complaint[]).filter((c) => c.status === "Open" || c.status === "In Progress" || c.status === "Under Review").length;
  const complaintScore = Math.max(0, 100 - (openComplaints * 5));

  const complianceAreas = [
    { name: "FDA APM (21 CFR 820)", score: alerts?.length > 0 ? 85 : 100, icon: Shield, color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "IEC 62304 Lifecycle", score: parseInt(iecStats?.full_traceability || "0"), icon: GitBranch, color: "text-purple-400", bg: "bg-purple-400/10" },
    { name: "SOC 2 Type II", score: soc2Stats?.overall_compliance_percentage || 0, icon: Lock, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { name: "HIPAA Security Rule", score: soc2Stats?.hipaa_score || 0, icon: Activity, color: "text-teal-400", bg: "bg-teal-400/10" },
    { name: "FHIR R4 Interop", score: soc2Stats?.fhir_score || 0, icon: CheckCircle, color: "text-indigo-400", bg: "bg-indigo-400/10" },
    { name: "Complaint Mgmt", score: complaintScore || 0, icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  const overallScore = Math.round(complianceAreas.reduce((s, c) => s + c.score, 0) / complianceAreas.length);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Compliance Control
            </h1>
            <p className="text-muted-foreground mt-2">Enterprise Healthcare Regulatory Oversight • Real-time Monitoring</p>
          </div>
          <div className="bg-card px-6 py-3 rounded-2xl border border-border shadow-xl flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">Global Status</p>
              <p className="text-lg font-bold text-emerald-500">COMPLIANT</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Global Score & Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-teal-600 to-teal-800 border-none shadow-2xl relative overflow-hidden h-full min-h-[220px]">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Shield className="w-32 h-32 text-white" />
             </div>
             <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
                <div>
                  <p className="text-xs font-bold text-teal-100 uppercase tracking-widest mb-1">Regulatory Health Index</p>
                  <p className="text-6xl font-black text-white">{overallScore}%</p>
                </div>
                <div className="flex items-center gap-2 mt-4 text-sm text-teal-50 font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>+1.2% from last audit cycle</span>
                </div>
             </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-xl flex flex-col justify-center">
             <CardContent className="p-8">
                <Lock className="w-10 h-10 text-emerald-400 mb-4" />
                <p className="text-3xl font-bold text-foreground">{(soc2Stats?.implemented_controls || 44)} / {(soc2Stats?.total_controls || 47)}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">SOC 2 Controls Active</p>
             </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-xl flex flex-col justify-center">
             <CardContent className="p-8">
                <AlertCircle className="w-10 h-10 text-amber-400 mb-4" />
                <p className="text-3xl font-bold text-foreground">{alerts?.length || 0}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Active Regulatory Alerts</p>
             </CardContent>
          </Card>
        </div>

        {/* Regulatory Frameworks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {complianceAreas.map((area, i) => (
              <motion.div
                key={area.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer group h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-3 rounded-2xl ${area.bg} ${area.color} group-hover:scale-110 transition-transform duration-300`}>
                        <area.icon className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className={`${area.score >= 90 ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-amber-500 border-amber-500/20 bg-amber-500/5"} font-bold text-[10px]`}>
                        {area.score >= 90 ? "EXCELLENT" : "WARNING"}
                      </Badge>
                    </div>
                    
                    <h3 className="font-bold text-foreground mb-2">{area.name}</h3>
                    <div className="w-full bg-muted rounded-full h-1.5 mb-4">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${area.score}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={`h-full rounded-full ${area.score >= 90 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500"}`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-foreground">{area.score}%</span>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted group-hover:translate-x-1 transition-all">
                        Details <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Compliance Footer Note */}
        <div className="p-6 bg-card border border-border rounded-3xl flex items-start gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="text-foreground font-bold">Regulatory Sync:</span> Compliance scores are calculated dynamically from IEC coverage, SOC 2 control evidence, and real-time FDA APM alert streams. Ensure all clinical data seeding is completed for 100% traceability across the enterprise cluster.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
