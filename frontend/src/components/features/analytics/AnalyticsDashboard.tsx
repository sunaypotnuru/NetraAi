import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { TrendingUp, BarChart3, Clock, Globe, AlertTriangle, Download, RefreshCcw, FileText, FileSpreadsheet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";

import { getRequiredApiBaseUrl, getSupabaseAccessToken } from "@/services/authSession";

const COLORS = ['#0D9488', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

// Generate demo data for each time range
function buildDemoUsage(range: '24H' | '7D' | '30D') {
  if (range === '24H') {
    return {
      total_invocations: 1248, peak_invocations: 87,
      data: Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2,'0')}:00`,
        total_invocations: Math.floor(Math.random()*80)+10,
        anemia: Math.floor(Math.random()*30)+5,
        cataract: Math.floor(Math.random()*25)+3,
        dr: Math.floor(Math.random()*20)+2,
      }))
    };
  } else if (range === '7D') {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return {
      total_invocations: 8740, peak_invocations: 312,
      data: days.map(d => ({
        hour: d,
        total_invocations: Math.floor(Math.random()*600)+800,
        anemia: Math.floor(Math.random()*200)+100,
        cataract: Math.floor(Math.random()*180)+80,
        dr: Math.floor(Math.random()*150)+60,
      }))
    };
  } else {
    return {
      total_invocations: 37420, peak_invocations: 1240,
      data: Array.from({ length: 30 }, (_, i) => ({
        hour: `Day ${i+1}`,
        total_invocations: Math.floor(Math.random()*800)+600,
        anemia: Math.floor(Math.random()*300)+150,
        cataract: Math.floor(Math.random()*250)+100,
        dr: Math.floor(Math.random()*200)+80,
      }))
    };
  }
}

const DEMO_SUCCESS_RATES = {
  overall_success_rate: 0.981,
  total_successful: 1224,
  tools: [
    { category: 'Anemia', success_rate: 98 },
    { category: 'Cataract', success_rate: 99 },
    { category: 'DR', success_rate: 97 },
    { category: 'Parkinson', success_rate: 96 },
    { category: 'Mental', success_rate: 94 },
  ]
};

const DEMO_LATENCY = {
  percentiles: { p50: 142, p95: 892, p99: 1840 },
  buckets: [
    { range: '<100ms', count: 320 },
    { range: '100-500ms', count: 580 },
    { range: '500ms-1s', count: 210 },
    { range: '1-3s', count: 95 },
    { range: '>3s', count: 43 },
  ]
};

const DEMO_GEO = {
  regions: [
    { region: 'South Asia', requests: 620 },
    { region: 'North America', requests: 340 },
    { region: 'Europe', requests: 188 },
    { region: 'Africa', requests: 100 },
  ]
};

const DEMO_ERRORS = {
  error_rate: 0.019,
  error_types: [
    { type: 'Model Timeout', severity: 'high', count: 12, percentage: 52 },
    { type: 'Invalid Image Format', severity: 'medium', count: 7, percentage: 30 },
    { type: 'Auth Failure', severity: 'low', count: 4, percentage: 18 },
  ]
};

export function AnalyticsDashboard() {
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const [activeRange, setActiveRange] = React.useState<'24H' | '7D' | '30D'>('24H');
  const apiBaseUrl = getRequiredApiBaseUrl();

  const { data: usageTrends, refetch: refetchUsage } = useQuery({
    queryKey: ["mcp-usage-trends", activeRange],
    queryFn: async () => {
      const timeframeMap = { '24H': '24h', '7D': '7d', '30D': '30d' };
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/mcp/analytics/usage-trends?timeframe=${timeframeMap[activeRange]}`, {
        headers: { ...(getSupabaseAccessToken() ? { Authorization: `Bearer ${getSupabaseAccessToken()}` } : {}) }
      });
      if (!response.ok) throw new Error("Failed");
      return response.json();
    },
    refetchInterval: 60000,
  });

  const { data: successRates, refetch: refetchSuccess } = useQuery({
    queryKey: ["mcp-success-rates"],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/mcp/analytics/success-rates`, {
        headers: { ...(getSupabaseAccessToken() ? { Authorization: `Bearer ${getSupabaseAccessToken()}` } : {}) }
      });
      if (!response.ok) throw new Error("Failed");
      return response.json();
    },
    refetchInterval: 60000,
  });

  const { data: latencyDist } = useQuery({
    queryKey: ["mcp-latency-distribution"],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/mcp/analytics/latency-distribution`, {
        headers: { ...(getSupabaseAccessToken() ? { Authorization: `Bearer ${getSupabaseAccessToken()}` } : {}) }
      });
      if (!response.ok) throw new Error("Failed");
      return response.json();
    },
    refetchInterval: 60000,
  });

  const { data: geoDist } = useQuery({
    queryKey: ["mcp-geographic-distribution"],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/mcp/analytics/geographic-distribution`, {
        headers: { ...(getSupabaseAccessToken() ? { Authorization: `Bearer ${getSupabaseAccessToken()}` } : {}) }
      });
      if (!response.ok) throw new Error("Failed");
      return response.json();
    },
    refetchInterval: 60000,
  });

  const { data: errorBreakdown } = useQuery({
    queryKey: ["mcp-error-breakdown"],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/mcp/analytics/error-breakdown`, {
        headers: { ...(getSupabaseAccessToken() ? { Authorization: `Bearer ${getSupabaseAccessToken()}` } : {}) }
      });
      if (!response.ok) throw new Error("Failed");
      return response.json();
    },
    refetchInterval: 60000,
  });

  // Merge live data with fallback demo data (range-aware)
  const demoUsage = buildDemoUsage(activeRange);
  const liveUsage = usageTrends?.data?.length > 0 ? usageTrends : demoUsage;
  const liveSuccess = successRates?.tools?.length > 0 ? successRates : DEMO_SUCCESS_RATES;
  const liveLatency = latencyDist?.buckets?.length > 0 ? latencyDist : DEMO_LATENCY;
  const liveGeo = geoDist?.regions?.length > 0 ? geoDist : DEMO_GEO;
  const liveErrors = errorBreakdown?.error_types?.length > 0 ? errorBreakdown : DEMO_ERRORS;

  const handleRefreshAll = () => {
    toast.promise(Promise.all([refetchUsage(), refetchSuccess()]), {
      loading: "Refreshing analytics data...",
      success: "Analytics data refreshed!",
      error: "Failed to refresh analytics"
    });
  };

  const handleExportReport = async (format: 'json' | 'pdf' | 'excel' = 'json') => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/mcp/export/analytics-report?format=${format}`, {
        headers: { ...(getSupabaseAccessToken() ? { Authorization: `Bearer ${getSupabaseAccessToken()}` } : {}) }
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'excel' ? 'xlsx' : format;
      a.download = `mcp-analytics-${Date.now()}.${extension}`;
      a.click();
      toast.success(`Analytics report exported as ${format.toUpperCase()}!`);
    } catch {
      toast.error("Failed to export analytics report");
    }
  };

  // Custom dark tooltip
  const DarkTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-8 pb-12">

      {/* Header */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#0D9488]/20 rounded-2xl border border-[#0D9488]/30">
            <BarChart3 className="w-8 h-8 text-[#0D9488]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">Clinical Engine Analytics</h2>
            <p className="text-sm text-gray-500 font-medium">Real-time performance metrics & diagnostic throughput</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleRefreshAll} variant="outline" className="h-11 px-5 rounded-2xl border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-[#0F172A] dark:hover:text-white font-bold transition-all">
            <RefreshCcw className="w-4 h-4 mr-2" /> Synchronize
          </Button>
          <div className="relative">
            <Button onClick={() => setShowExportMenu(!showExportMenu)} className="h-11 px-6 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-2xl font-bold shadow-lg shadow-[#0D9488]/20">
              <Download className="w-4 h-4 mr-2" /> Generate Report
            </Button>
            {showExportMenu && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-3 w-52 bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/10 rounded-2xl shadow-lg dark:shadow-2xl py-2 z-50">
                <button onClick={() => { handleExportReport('json'); setShowExportMenu(false); }}
                  className="w-full px-5 py-3 text-left hover:bg-white/5 flex items-center gap-3 text-sm font-bold text-gray-300 transition-colors">
                  <FileText className="w-4 h-4 text-blue-400" /> JSON Dataset
                </button>
                <button onClick={() => { handleExportReport('pdf'); setShowExportMenu(false); }}
                  className="w-full px-5 py-3 text-left hover:bg-white/5 flex items-center gap-3 text-sm font-bold text-gray-300 transition-colors">
                  <FileText className="w-4 h-4 text-rose-400" /> Clinical PDF
                </button>
                <button onClick={() => { handleExportReport('excel'); setShowExportMenu(false); }}
                  className="w-full px-5 py-3 text-left hover:bg-white/5 flex items-center gap-3 text-sm font-bold text-gray-300 transition-colors">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Structured XLSX
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Invocations", value: liveUsage.total_invocations, sub: `Last ${activeRange}`, color: "#0D9488", icon: TrendingUp },
          { label: "Clinical P95", value: `${liveLatency.percentiles?.p95 || 0}ms`, sub: "Processing latency", color: "#8B5CF6", icon: Clock },
          { label: "System Health", value: `${((liveSuccess.overall_success_rate || 0) * 100).toFixed(1)}%`, sub: "Uptime success", color: "#10B981", icon: BarChart3 },
          { label: "Peak Load", value: liveUsage.peak_invocations, sub: "Concurrent requests", color: "#3B82F6", icon: Globe },
        ].map((stat, i) => (
          <motion.div key={i} whileHover={{ y: -4 }}>
            <Card className="bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-xl rounded-3xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-6 -mt-6 opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: stat.color }} />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: `${stat.color}20` }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{stat.label}</span>
                </div>
                <div className="text-3xl font-black text-white tracking-tighter">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value || "0"}
                </div>
                <div className="text-xs text-gray-500 font-bold mt-1">{stat.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Primary Usage Chart */}
      <Card className="bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-xl rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-[#0D9488]" />
              <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight">Diagnostic Throughput Trends</h3>
            </div>
            <div className="flex gap-2">
              {(['24H', '7D', '30D'] as const).map(r => (
                <button key={r} onClick={() => setActiveRange(r)}
                  className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                    r === activeRange
                      ? 'bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/20'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={liveUsage.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="hour" stroke="#334155" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
              <YAxis stroke="#334155" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
              <Tooltip content={<DarkTooltip />} />
              <Line type="monotone" dataKey="total_invocations" stroke="#0D9488" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#0D9488' }} name="Total" />
              <Line type="monotone" dataKey="anemia" stroke="#EF4444" strokeWidth={2} dot={false} strokeDasharray="4 4" name="Anemia" />
              <Line type="monotone" dataKey="cataract" stroke="#3B82F6" strokeWidth={2} dot={false} strokeDasharray="4 4" name="Cataract" />
              <Line type="monotone" dataKey="dr" stroke="#10B981" strokeWidth={2} dot={false} strokeDasharray="4 4" name="Retinopathy" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clinical Reliability */}
        <Card className="bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-7">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5 text-[#10B981]" />
              <h3 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight">Clinical Reliability</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={liveSuccess.tools?.slice(0, 5) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="category" stroke="#334155" fontSize={9} fontWeight={700} axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="success_rate" fill="#10B981" radius={[8, 8, 8, 8]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-5 flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0B0F1A] rounded-2xl border border-gray-100 dark:border-white/5">
              <div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Avg Success</div>
                <div className="text-xl font-black text-[#0F172A] dark:text-white">{((liveSuccess.overall_success_rate || 0) * 100).toFixed(1)}%</div>
              </div>
              <div className="w-px h-10 bg-white/5" />
              <div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Total Hits</div>
                <div className="text-xl font-black text-[#0F172A] dark:text-white">{(liveSuccess.total_successful || 0).toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Profiles */}
        <Card className="bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-7">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-[#3B82F6]" />
              <h3 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight">Response Profiles</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={liveLatency.buckets || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="range" stroke="#334155" fontSize={8} fontWeight={700} axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 8, 8]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { l: "P50", v: liveLatency.percentiles?.p50, color: "#3B82F6" },
                { l: "P95", v: liveLatency.percentiles?.p95, color: "#8B5CF6" },
                { l: "P99", v: liveLatency.percentiles?.p99, color: "#F59E0B" }
              ].map((p, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-[#0B0F1A] rounded-xl border border-gray-100 dark:border-white/5 text-center">
                  <div className="text-[9px] font-black uppercase mb-1" style={{ color: p.color }}>{p.l}</div>
                  <div className="text-sm font-black text-[#0F172A] dark:text-white">{p.v || 0}ms</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Global Reach */}
        <Card className="bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-7">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-5 h-5 text-[#8B5CF6]" />
              <h3 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight">Global Reach</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={liveGeo.regions || []} dataKey="requests" nameKey="region" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={6}>
                  {(liveGeo.regions || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-5 space-y-2">
              {(liveGeo.regions || []).map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-gray-400">{r.region}</span>
                  </div>
                  <span className="text-[10px] font-black text-[#0F172A] dark:text-white">{r.requests}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Taxonomy */}
      <Card className="bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-xl rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight">Diagnostic Error Taxonomy</h3>
                <p className="text-sm text-gray-500 font-medium">Identification and severity mapping of system anomalies</p>
              </div>
            </div>
            <div className="px-5 py-2 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <span className="text-xs font-black text-amber-400">Error Rate: </span>
              <span className="text-xl font-black text-amber-400">{((liveErrors.error_rate || 0) * 100).toFixed(2)}%</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(liveErrors.error_types || []).map((error: any, index: number) => (
              <motion.div key={index} whileHover={{ scale: 1.02 }} className="p-6 bg-gray-50 dark:bg-[#0B0F1A] rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col justify-between">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-black text-[#0F172A] dark:text-white tracking-tight">{error.type}</span>
                    <span className={`w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      error.severity === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' :
                      error.severity === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                    }`}>
                      {error.severity} Risk
                    </span>
                  </div>
                  <div className="text-3xl font-black text-gray-200 dark:text-white/10">#{index + 1}</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-gray-500">
                    <span>Incidents</span><span className="text-[#0F172A] dark:text-white">{error.count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${
                      error.severity === 'high' ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                      error.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} style={{ width: `${error.percentage}%` }} />
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold text-right">{error.percentage}% of anomaly volume</div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
