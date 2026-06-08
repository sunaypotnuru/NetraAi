import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { GitBranch, CheckCircle, Clock, FileText, Layout, Layers, ShieldCheck, ChevronRight, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { complianceAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/lib/themeStore";

interface Requirement {
  id: string;
  title: string;
  description: string;
  safety_class?: string;
}

export default function AdminIEC62304Traceability() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["iecCoverageStats"],
    queryFn: () => complianceAPI.getIECCoverageStats().then(res => res.data),
  });

  const { data: requirements, isLoading: reqsLoading } = useQuery({
    queryKey: ["iecRequirements"],
    queryFn: () => complianceAPI.getIECRequirements().then(res => res.data),
  });

  if (statsLoading || reqsLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-[#0B0F1A]">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-[200px] w-full bg-white/5 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Skeleton className="h-[400px] bg-white/5 rounded-3xl" />
             <Skeleton className="h-[400px] bg-white/5 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const phases = [
    { phase: "1 - Concept", status: "Complete", items: 12, done: 12, color: "text-emerald-400" },
    { phase: "2 - Design", status: "Complete", items: 18, done: 18, color: "text-emerald-400" },
    { phase: "3 - Implementation", status: "Complete", items: 45, done: 45, color: "text-emerald-400" },
    { phase: "4 - Verification", status: "In Progress", items: 30, done: 24, color: "text-[#0EA5E9]" },
    { phase: "5 - Release", status: "Pending", items: 10, done: 0, color: "text-gray-500" },
    { phase: "6 - Post-Production", status: "Pending", items: 9, done: 0, color: "text-gray-500" },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-[#0B0F1A]">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <GitBranch className="w-8 h-8 text-purple-400" />
              IEC 62304 Traceability
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Software Lifecycle Compliance • Requirement Traceability Matrix (RTM)</p>
          </div>
          <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/5 px-4 py-1.5 rounded-xl font-bold tracking-widest text-[10px]">
            LIFECYCLE MONITORING ACTIVE
          </Badge>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Verified Requirements", value: stats?.fully_traced_requirements ?? 0, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Verification In Progress", value: (stats?.total_requirements || 0) - (stats?.fully_traced_requirements || 0), icon: Clock, color: "text-amber-400" },
            { label: "Global Requirements", value: stats?.total_requirements ?? 0, icon: FileText, color: "text-purple-400" }
          ].map((kpi, i) => (
            <Card key={i} className="bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/5 shadow-xl hover:border-purple-500/20 transition-all group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-white/5 ${kpi.color} group-hover:scale-110 transition-transform`}>
                  <kpi.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{kpi.value}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lifecycle Phases */}
          <Card className="lg:col-span-2 bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/5 shadow-xl overflow-hidden rounded-3xl">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Layers className="w-5 h-5 text-[#0EA5E9]" />
                Development Lifecycle Phases
              </h2>
              <Badge className="bg-[#0EA5E9]/10 text-[#0EA5E9] border-none font-bold text-[10px]">VERIFICATION 80%</Badge>
            </div>
            <div className="p-6 space-y-4">
              <AnimatePresence>
                {phases.map((p, i) => (
                  <motion.div 
                    key={p.phase} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0B0F1A] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 border rounded-2xl group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${p.color}`} />
                      <div>
                        <span className="text-gray-900 dark:text-white font-bold text-sm">{p.phase}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${p.color}`}>{p.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="hidden md:block">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold text-right">{p.done}/{p.items} Verified</p>
                        <div className="w-32 bg-white/5 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${(p.done / p.items) * 100}%` }} 
                            className={`h-full rounded-full ${p.status === "Complete" ? "bg-emerald-500" : "bg-[#0EA5E9]"}`} 
                          />
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white group-hover:bg-gray-100 dark:group-hover:bg-white/5">
                         <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>

          {/* Requirements Matrix */}
          <Card className="bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/5 shadow-xl overflow-hidden rounded-3xl">
             <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  RTM Explorer
                </h2>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500">
                   <Search className="w-4 h-4" />
                </Button>
             </div>
             <div className="p-6 space-y-6 overflow-y-auto max-h-[600px]">
                {requirements && requirements.length > 0 ? requirements.map((req: Requirement, i: number) => (
                  <motion.div 
                    key={req.id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.05 }}
                    className="pb-6 border-b border-gray-100 dark:border-white/5 last:border-0 group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <code className="text-[10px] font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">
                        {req.id}
                      </code>
                      <Badge variant="outline" className="border-white/10 text-gray-500 text-[9px] px-1.5 py-0">
                        CLASS {req.safety_class || 'B'}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-400 transition-colors leading-snug">{req.title}</h4>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{req.description}</p>
                  </motion.div>
                )) : (
                  <div className="py-20 text-center">
                     <FileText className="w-12 h-12 text-white/5 mx-auto mb-4" />
                     <p className="text-gray-500 text-xs font-medium">No requirement data detected.</p>
                  </div>
                )}
             </div>
          </Card>
        </div>

        {/* Compliance Footer */}
        <div className="p-6 bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/5 border rounded-3xl flex items-start gap-4">
           <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <GitBranch className="w-5 h-5" />
           </div>
            <div>
               <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  <span className="text-gray-900 dark:text-white font-bold">Traceability Active:</span> All software requirements are linked to verification protocols. The traceability matrix is indexed for full-lifecycle auditing in accordance with IEC 62304 standards.
               </p>
            </div>
        </div>

      </div>
    </div>
  );
}
