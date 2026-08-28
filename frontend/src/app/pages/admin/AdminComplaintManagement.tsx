import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Clock, CheckCircle, AlertCircle, Search, Filter, Shield, MoreVertical, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complianceAPI } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const severityColors: Record<string, string> = {
  High: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

const statusColors: Record<string, string> = {
  Open: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  "In Progress": "text-[#0EA5E9] bg-[#0EA5E9]/10 border-[#0EA5E9]/20",
  "Under Review": "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Resolved: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

export default function AdminComplaintManagement() {
  const [query, setQuery] = React.useState("");
  const queryClient = useQueryClient();

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["complaints"],
    queryFn: () => complianceAPI.getComplaints().then(res => res.data),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => complianceAPI.resolveComplaint(id),
    onSuccess: () => {
      toast.success("Complaint marked as resolved.");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["soc2Stats"] });
    },
    onError: () => toast.error("Failed to resolve complaint.")
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-background">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-[200px] w-full bg-muted rounded-3xl" />
          <Skeleton className="h-[500px] w-full bg-muted rounded-3xl" />
        </div>
      </div>
    );
  }

  interface Complaint {
    id: string;
    ticket_id?: string;
    subject: string;
    category?: { category_name: string };
    subcategory?: { subcategory_name: string };
    status: string;
    severity?: string;
    created_at: string;
    mdr_reportable?: boolean;
    reporter?: {
      full_name?: string;
      email?: string;
    };
    [key: string]: unknown;
  }

  const filtered = (complaints as Complaint[]).filter((c) =>
    c.subject.toLowerCase().includes(query.toLowerCase()) ||
    (c.ticket_id || c.id).toLowerCase().includes(query.toLowerCase()) ||
    (c.category?.category_name || '').toLowerCase().includes(query.toLowerCase())
  );

  const counts = {
    open: (complaints as Complaint[]).filter((c) => c.status === "Open").length,
    inProgress: (complaints as Complaint[]).filter((c) => c.status === "In Progress" || c.status === "Under Review").length,
    resolved: (complaints as Complaint[]).filter((c) => c.status === "Resolved").length,
  };

  return (
    <div className="min-h-screen pt-3 pb-12 px-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              Regulatory Complaints
            </h1>
            <p className="text-muted-foreground mt-2">FDA MDR Compliance • Feedback Processing Hub</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5 rounded-xl h-11 px-6">
                <Shield className="w-4 h-4 mr-2" /> Compliance Audit
             </Button>
          </div>
        </div>        {/* Global Stats Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-card border border-rose-500/20 shadow-xl overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <AlertCircle className="w-16 h-16 text-rose-500" />
             </div>
             <CardContent className="p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Open Tickets</p>
                <p className="text-4xl font-bold text-rose-500 mt-2">{counts.open}</p>
                <div className="flex items-center gap-2 mt-4 text-[10px] text-rose-400 font-bold uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                   Priority Action Required
                </div>
             </CardContent>
          </Card>
 
          <Card className="bg-card border border-amber-500/20 shadow-xl overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Clock className="w-16 h-16 text-amber-500" />
             </div>
             <CardContent className="p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Under Review</p>
                <p className="text-4xl font-bold text-amber-500 mt-2">{counts.inProgress}</p>
                <div className="flex items-center gap-2 mt-4 text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                   Lifecycle In Progress
                </div>
             </CardContent>
          </Card>
 
          <Card className="bg-card border border-emerald-500/20 shadow-xl overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
             </div>
             <CardContent className="p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Resolved</p>
                <p className="text-4xl font-bold text-emerald-500 mt-2">{counts.resolved}</p>
                <div className="flex items-center gap-2 mt-4 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   MDR Closed
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Complaints Table Matrix */}
        <Card className="bg-card border-border shadow-xl overflow-hidden rounded-3xl">
          <CardContent className="p-0">
            <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-primary" />
                All Operational Feedback
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search tickets..."
                  className="w-full md:w-80 bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-widest font-bold">
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Reporter Node</th>
                    <th className="px-6 py-4">Subject Vector</th>
                    <th className="px-6 py-4">Domain</th>
                    <th className="px-6 py-4">Criticality</th>
                    <th className="px-6 py-4">Lifecycle</th>
                    <th className="px-6 py-4 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((c, i) => (
                      <motion.tr 
                        key={c.id} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded w-fit">
                            {c.ticket_id || `ID-${c.id.split("-")[0]}`}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">
                            {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground/90">{c.reporter?.full_name || "Internal System"}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{c.reporter?.email || "sys@netra.ai"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <div className="text-foreground/80 max-w-xs truncate font-medium">{c.subject}</div>
                             {c.mdr_reportable && (
                               <Badge className="bg-rose-500/20 text-rose-500 border-none text-[8px] h-4 px-1 font-bold">MDR</Badge>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                             <Badge variant="outline" className="border-border text-foreground text-[10px] uppercase tracking-widest w-fit">
                               {c.category?.category_name || "General"}
                             </Badge>
                             {c.subcategory?.subcategory_name && (
                               <span className="text-[9px] text-muted-foreground font-bold uppercase ml-1 opacity-70">
                                 › {c.subcategory.subcategory_name}
                               </span>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${severityColors[c.severity || "Low"]} border-none font-bold text-[10px]`}>
                            {c.severity || "LOW"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${statusColors[c.status] || "bg-white/5 text-gray-400"} border-none font-bold text-[10px]`}>
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {c.status !== "Resolved" && (
                               <Button 
                                 size="sm"
                                 variant="ghost"
                                 onClick={() => resolveMutation.mutate(c.id)}
                                 disabled={resolveMutation.isPending}
                                 className="h-8 px-3 text-[#0EA5E9] hover:bg-[#0EA5E9]/10 hover:text-[#0EA5E9] text-xs font-bold rounded-lg"
                               >
                                 <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Resolve
                               </Button>
                             )}
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-white">
                                <MoreVertical className="w-4 h-4" />
                             </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <MessageSquare className="w-16 h-16 text-white/5 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white">No active complaints</h3>
                <p className="text-gray-500 text-xs mt-1">Platform operational health is 100%.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operational Intelligence Note */}
        <div className="p-6 bg-[#161B2B] border border-white/5 rounded-3xl flex items-start gap-4">
           <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Shield className="w-5 h-5" />
           </div>
           <div>
              <p className="text-sm text-gray-400 leading-relaxed">
                 <span className="text-white font-bold">Compliance Vector:</span> All complaint processing is logged under the SOC 2 forensic stream and mapped to FDA MDR reporting requirements. Resolving a ticket updates the global Regulatory Health Index automatically.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}
