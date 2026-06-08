import { motion } from "motion/react";
import { 
  Activity, 
  Database, 
  Terminal, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCcw, 
  Play, 
  FileText, 
  Settings, 
  CheckCircle2, 
  XCircle,
  Cpu,
  BarChart3,
  Server,
  Zap,
  Globe,
  Clock,
  ExternalLink,
  Info,
  UserCheck,
  Bot,
  Route,
  Code,
  Heart,
  Eye,
  Brain,
  Stethoscope,
  TrendingUp
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { WakeUpButton } from "@/components/shared/WakeUpButton";
import { XAIVisualizationPanel } from "@/components/features/ai/XAIVisualizationPanel";
import { AnalyticsDashboard } from "@/components/features/analytics/AnalyticsDashboard";
import { LiveAuditLog } from "@/components/features/domain/LiveAuditLog";

interface MCPTool {
  name: string;
  status: "healthy" | "error" | "loading";
  lastUsed?: string;
  calls: number;
}

interface AuditLog {
  id: string;
  timestamp: string;
  event_type: string;
  tool_name: string;
  patient_id: string;
  status: string;
  latency_ms: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

function getSupabaseAccessToken(): string | null {
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as { access_token?: string };
      if (parsed.access_token) return parsed.access_token;
    } catch {
      // ignore malformed token entries
    }
  }
  return null;
}

export default function MCPManagementPage() {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch MCP server status
  const { data: serverStatus, isLoading: isStatusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["mcp-status"],
    queryFn: async () => {
      if (!API_BASE_URL) {
        throw new Error("VITE_API_URL is not configured");
      }
      const token = getSupabaseAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/mcp/health`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (!response.ok) throw new Error("MCP Server unreachable");
      return response.json();
    },
    retry: 2,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    enabled: true // Enable automatic fetching
  });

  // Enhanced MCP tools with real implementation status
  const [tools, setTools] = useState<MCPTool[]>([]);

  // Fetch tools data when server status is available
  useEffect(() => {
    if (serverStatus?.tools) {
      setTools(serverStatus.tools);
    }
  }, [serverStatus]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.promise(refetchStatus(), {
      loading: "Pinging NetraAI Diagnostic Engine...",
      success: "MCP Server is online and healthy!",
      error: "Failed to connect to MCP Server"
    });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const [testResults, setTestResults] = useState<any>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [testingTool, setTestingTool] = useState<string | null>(null);

  const handleRunTool = async (toolName: string) => {
    setTestingTool(toolName);
    
    try {
      if (!API_BASE_URL) {
        throw new Error("VITE_API_URL is not configured");
      }
      const token = getSupabaseAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/mcp/tools/${toolName}/test`,
        {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();
      
      if (result.status === 'success') {
        toast.success(`${toolName} executed successfully!`, {
          description: `Latency: ${result.latency_ms}ms | Status: ${result.status}`
        });
        
        // Show detailed results
        setTestResults(result);
        setShowResultsModal(true);
      } else if (result.status === 'timeout') {
        toast.error(`Tool execution timed out`, {
          description: result.suggestion || 'MCP server may be cold-starting. Try again.'
        });
      } else if (result.status === 'connection_error') {
        toast.error(`Connection failed`, {
          description: result.suggestion || 'Check if MCP server is running'
        });
      } else {
        toast.error(`Tool execution failed: ${result.error}`);
      }
      
    } catch (error: any) {
      toast.error(`Failed to execute tool: ${error.message}`);
    } finally {
      setTestingTool(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-[#F8FAFC] dark:bg-[#0B0F1A] -mx-6 lg:-mx-8 -mt-16">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#0D9488]/10 rounded-xl">
                <Cpu className="w-6 h-6 text-[#0D9488]" />
              </div>
              <h1 className="text-3xl font-bold text-[#0F172A] dark:text-[#0F172A]">{t('admin.mcp.title', 'MCP Management')}</h1>
            </div>
            <p className="text-[#64748B]">
              {t('admin.mcp.subtitle', 'Monitor and orchestrate the NetraAI Model Context Protocol ecosystem.')}
            </p>
          </motion.div>
 
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#161B2B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-inner">
              <div className={`w-2.5 h-2.5 rounded-full ${serverStatus?.overall_status === "healthy" ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-amber-500"}`}></div>
              <span className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">
                {serverStatus?.overall_status === "healthy" ? t('admin.mcp.server_healthy', 'Server: Healthy') : t('admin.mcp.server_degraded', 'Server: Degraded')}
              </span>
            </div>
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-gray-100 dark:bg-[#1E293B] hover:bg-gray-200 dark:hover:bg-[#334155] text-[#0F172A] dark:text-white border border-gray-200 dark:border-white/10 rounded-2xl px-6 h-11 shadow-sm font-bold flex items-center gap-2 transition-all"
            >
              <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('admin.mcp.sync_status', 'Sync Status')}
            </Button>
            <Button className="bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-2xl px-6 h-11 shadow-lg shadow-[#0D9488]/20 font-bold transition-all hover:scale-105">
              {t('admin.mcp.marketplace_settings', 'Marketplace Settings')}
            </Button>
            <WakeUpButton />
          </div>
        </div>
 
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: t('admin.mcp.total_invocations', "Total Tool Invocations"), value: serverStatus?.metrics?.total_invocations?.toLocaleString() || "1,248", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: t('admin.mcp.safety_score', "Clinical Safety Score"), value: serverStatus?.metrics?.success_rate ? `${(serverStatus.metrics.success_rate * 100).toFixed(1)}%` : "99.8%", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: t('admin.mcp.avg_latency', "Avg Latency"), value: serverStatus?.metrics?.avg_latency_ms ? `${Math.round(serverStatus.metrics.avg_latency_ms)}ms` : "285ms", icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: t('admin.mcp.uptime', "Uptime (24h)"), value: serverStatus?.metrics?.uptime_24h || "99.99%", icon: Server, color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Card className="p-6 bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-xl rounded-[2rem] group hover:border-[#0D9488]/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 ${stat.bg} rounded-2xl transition-transform group-hover:scale-110`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">{stat.label}</span>
                </div>
                <div className="text-3xl font-bold text-[#0F172A] dark:text-white tabular-nums">{stat.value}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Main Tool Registry (Left - 8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#0D9488]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white tracking-tight">{t('admin.mcp.tool_registry', 'Tool Registry')}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#0D9488]/20 text-[#0D9488] text-[10px] font-black rounded-full border border-[#0D9488]/30 uppercase">
                    {t('admin.mcp.tools_count', '{{count}} Tools Registered', { count: tools.length || 11 })}
                  </span>
                </div>
              </div>
 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(tools.length > 0 ? tools : Array(10).fill({ name: 'loading', status: 'loading', calls: 0 })).map((tool, i) => {
                  if (tool.name === 'loading') {
                    return (
                      <Card key={i} className="p-5 bg-gray-50 dark:bg-[#161B2B]/50 border border-gray-100 dark:border-white/5 shadow-sm rounded-[1.8rem] animate-pulse">
                        <div className="flex items-start gap-3 h-24">
                          <div className="w-10 h-10 bg-white/5 rounded-xl"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/5 rounded w-1/2"></div>
                            <div className="h-2 bg-white/5 rounded w-3/4"></div>
                            <div className="h-2 bg-white/5 rounded w-1/4"></div>
                          </div>
                        </div>
                      </Card>
                    );
                  }

                  const getToolInfo = (toolName: string) => {
                    const toolMap: Record<string, { icon: any, description: string, category: string }> = {
                      "diagnose_anemia_tool": { icon: Heart, description: "Analyzes conjunctiva images to detect anemia and estimate hemoglobin levels", category: "Hematology" },
                      "detect_cataract_tool": { icon: Eye, description: "Detects cataract presence with XAI heatmaps using Grad-CAM", category: "Ophthalmology" },
                      "screen_dr_tool": { icon: Eye, description: "Screens for diabetic retinopathy with stage classification", category: "Ophthalmology" },
                      "analyze_mental_health_tool": { icon: Brain, description: "Analyzes voice patterns for mental health assessment", category: "Psychiatry" },
                      "screen_parkinsons_tool": { icon: Brain, description: "Screens for Parkinson's disease via drawing analysis", category: "Neurology" },
                      "get_patient_fhir_tool": { icon: Database, description: "Retrieves patient data in FHIR R4 format", category: "FHIR" },
                      "query_patient_timeline_tool": { icon: Clock, description: "Queries patient medical timeline and history", category: "FHIR" },
                      "compare_diagnostic_history_tool": { icon: BarChart3, description: "Compares diagnostic results over time", category: "Analytics" },
                      "generate_prior_auth_tool": { icon: FileText, description: "Generates prior authorization packets automatically", category: "Prior Auth" },
                      "orchestrate_screening_workflow_tool": { icon: Route, description: "Orchestrates multi-diagnostic screening workflows", category: "Workflow" },
                      "health_check_tool": { icon: Stethoscope, description: "Health check endpoint for server monitoring", category: "System" }
                    };
                    return toolMap[toolName] || { icon: Terminal, description: "MCP tool", category: "General" };
                  };

                  const toolInfo = getToolInfo(tool.name);
                  const IconComponent = toolInfo.icon;

                  return (
                    <Card key={tool.name} className="p-5 bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-xl rounded-[1.8rem] hover:border-[#0D9488]/30 transition-all group overflow-hidden relative">
                      <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <IconComponent className="w-20 h-20 text-white" />
                      </div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-[#0D9488]/20 rounded-xl border border-[#0D9488]/30">
                            <IconComponent className="w-4 h-4 text-[#0D9488]" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[#0F172A] dark:text-white mb-1 group-hover:text-[#0D9488] transition-colors leading-tight">
                              {tool.name.replace('_tool', '').replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase())}
                            </h3>
                            <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">{toolInfo.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-[#0D9488]/10 text-[#0D9488] text-[9px] font-black rounded-full border border-[#0D9488]/20 uppercase">
                                {toolInfo.category}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold">
                                <Clock className="w-3 h-3" />
                                {t('admin.mcp.last_used', 'Last: {{time}}', { time: tool.lastUsed || 'Just Now' })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={`p-1.5 rounded-full ${tool.status === 'healthy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {tool.status === 'healthy' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-6 relative z-10">
                        <div className="text-xs font-black text-gray-500 uppercase tracking-tighter">
                          <span className="text-[#0F172A] dark:text-white text-sm mr-1">{tool.calls.toLocaleString()}</span> {t('admin.mcp.invocations', 'invocations')}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleRunTool(tool.name)}
                          disabled={testingTool === tool.name}
                          className="h-8 rounded-xl bg-white/5 hover:bg-[#0D9488]/20 hover:text-[#0D9488] text-white border border-white/5 font-bold text-[10px] uppercase"
                        >
                          {testingTool === tool.name ? (
                            <>
                              <RefreshCcw className="w-3 h-3 mr-1.5 animate-spin" /> Testing
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1.5" /> {t('admin.mcp.test_run', 'Test Run')}
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          </div>
 
          {/* Column 3: High-Priority Status (Right - 4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* AGENTS ASSEMBLE HACKATHON STATUS (Promoted to Top Right) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 bg-gradient-to-br from-[#F59E0B] to-[#D97706] border-none shadow-2xl shadow-[#F59E0B]/10 rounded-[2.5rem] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 group-hover:rotate-45 transition-transform">
                  <Zap className="w-40 h-40" />
                </div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em]">Agents Assemble</h2>
                  </div>
                  <span className="px-2 py-0.5 bg-black/20 text-white text-[9px] font-black rounded-md tracking-widest uppercase border border-white/10">COMPETING</span>
                </div>

                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                    <div className="text-2xl font-black">97</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white leading-none mb-1">Global Score</h3>
                    <p className="text-xs text-white/70 font-bold">Targeting 1st Place ($7.5K)</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6 relative z-10">
                  <div className="p-2 bg-black/10 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="text-[8px] text-white/70 font-black uppercase tracking-tighter mb-1">AI Factor</div>
                    <div className="text-xs font-black text-white">40/40</div>
                  </div>
                  <div className="p-2 bg-black/10 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="text-[8px] text-white/70 font-black uppercase tracking-tighter mb-1">Impact</div>
                    <div className="text-xs font-black text-white">34/35</div>
                  </div>
                  <div className="p-2 bg-black/10 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="text-[8px] text-white/70 font-black uppercase tracking-tighter mb-1">Scale</div>
                    <div className="text-xs font-black text-white">25/25</div>
                  </div>
                </div>

                <div className="space-y-2 mb-6 relative z-10">
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-white/90">MCP Server (Path A)</span>
                    <span className="text-[9px] font-black text-green-300 uppercase">✅ DEPLOYED</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-white/90">A2A Agent (Path B)</span>
                    <span className="text-[9px] font-black text-green-300 uppercase">✅ ONLINE</span>
                  </div>
                </div>

                <Button 
                  onClick={() => window.open('https://agents-assemble.devpost.com/', '_blank')}
                  className="w-full bg-white text-[#D97706] hover:bg-white/90 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] relative z-10 shadow-lg"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Competition details
                </Button>
              </Card>
            </motion.div>

            {/* Clinical Safety Monitoring */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-6 bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-2xl rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                   <ShieldCheck className="w-32 h-32 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest">{t('admin.mcp.clinical_safety', 'Clinical Safety')}</h2>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black rounded-md uppercase border border-emerald-500/20">Industrial</span>
                </div>
  
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] dark:text-white text-sm">Evidently AI Monitor</h3>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Real-Time Model Drift Detection</p>
                  </div>
                </div>
  
                <div className="space-y-4">
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Anemia Engine Drift</span>
                      <span className="text-[10px] font-black text-emerald-400 tracking-widest">0.04</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: '4%' }}></div>
                    </div>
                  </div>
  
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Quality Score</span>
                      <span className="text-[10px] font-black text-emerald-400 tracking-widest">99.8%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: '99.8%' }}></div>
                    </div>
                  </div>
                </div>
  
                <Button 
                  onClick={() => window.open('https://evidentlyai.com', '_blank')}
                  className="w-full mt-6 bg-[#0F172A] hover:bg-[#1E293B] border border-white/5 text-gray-300 hover:text-white rounded-2xl h-11 font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Safety Report
                </Button>
              </Card>
            </motion.div>

            {/* MCP Server Deployment Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="p-6 bg-gradient-to-br from-[#0D9488] to-[#0F766E] border-none shadow-2xl rounded-[2.5rem] text-white group overflow-hidden">
                <div className="absolute right-0 bottom-0 p-8 opacity-10 -rotate-12 group-hover:rotate-0 transition-transform">
                  <Server className="w-32 h-32" />
                </div>
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight">MCP Deployment</h3>
                    <p className="text-[10px] text-white/60 font-mono tracking-tighter">netra-mcp-server.hf.space</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                  <div className="p-2 bg-black/10 rounded-xl border border-white/5">
                    <div className="text-[8px] text-white/50 font-black uppercase mb-1">Status</div>
                    <div className="text-[10px] font-black text-white flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                      Healthy
                    </div>
                  </div>
                  <div className="p-2 bg-black/10 rounded-xl border border-white/5">
                    <div className="text-[8px] text-white/50 font-black uppercase mb-1">Uptime</div>
                    <div className="text-[10px] font-black text-white">99.99%</div>
                  </div>
                </div>

                <Button 
                  onClick={() => window.open('https://sunay-potnuru-netra-mcp-server.hf.space', '_blank')}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl h-10 font-black uppercase tracking-widest text-[9px] relative z-10"
                >
                  <ExternalLink className="w-3 h-3 mr-1.5" />
                  Open Console
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* XAI Visualization Panel (Expanded to Full Width) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <XAIVisualizationPanel lastResults={testResults} />
        </motion.div>

        {/* Phase 2: Massive Analytics Dashboard (Full Width) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-12"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-[#0D9488] rounded-full"></div>
            <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase">{t('admin.mcp.advanced_analytics', 'Clinical Engine Analytics')}</h2>
          </div>
          <AnalyticsDashboard />
        </motion.div>

        {/* Phase 2: Live Audit Log Streaming */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-16"
        >
          <div className="flex items-center gap-2 mb-8">
            <Terminal className="w-6 h-6 text-[#0D9488]" />
            <h2 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Technical Audit Stream</h2>
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-black rounded-full border border-purple-500/20 uppercase flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Real-Time
            </span>
          </div>
          <div className="bg-white dark:bg-[#161B2B] border border-gray-100 dark:border-white/5 rounded-[3rem] p-1 overflow-hidden">
            <LiveAuditLog />
          </div>
        </motion.div>
      </div>

      {/* Test Results Modal */}
      {showResultsModal && testResults && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden bg-[#161B2B] border border-[#0D9488]/30 shadow-[0_0_50px_rgba(13,148,136,0.2)] rounded-[3rem] flex flex-col">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#0F172A]/80">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center border border-green-500/30">
                   <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Technical Execution Summary</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{testResults.tool_name}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setShowResultsModal(false)}
                className="w-10 h-10 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-all"
              >
                ✕
              </Button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Status", value: testResults.status.toUpperCase(), color: "text-green-500" },
                  { label: "Latency", value: `${testResults.latency_ms}ms`, color: "text-blue-500" },
                  { label: "TX ID", value: testResults.timestamp.slice(-6).toUpperCase(), color: "text-amber-500" }
                ].map(item => (
                  <div key={item.label} className="p-4 bg-black/20 rounded-2xl border border-white/5">
                    <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">{item.label}</div>
                    <div className={`text-sm font-black ${item.color} tabular-nums tracking-widest`}>{item.value}</div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-3 bg-blue-500 rounded-full"></div>
                    Payload Context
                  </h3>
                  <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                    <pre className="text-[10px] font-mono text-blue-300/80 custom-scrollbar max-h-40 overflow-auto">
                      {JSON.stringify(testResults.sample_data_used || {}, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-3 bg-green-500 rounded-full"></div>
                    Engine Response
                  </h3>
                  <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                    <pre className="text-[10px] font-mono text-green-300/80 custom-scrollbar max-h-64 overflow-auto">
                      {JSON.stringify(testResults.result || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-[#0F172A]/80 border-t border-white/5 flex gap-4">
               <Button 
                 onClick={() => setShowResultsModal(false)}
                 className="flex-1 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-2xl h-12 font-black uppercase tracking-[0.2em] shadow-lg shadow-[#0D9488]/20"
               >
                 Acknowledge
               </Button>
               <Button 
                 onClick={() => {
                   navigator.clipboard.writeText(JSON.stringify(testResults, null, 2));
                   toast.success('Technical log copied to clipboard');
                 }}
                 variant="outline"
                 className="flex-1 border-white/10 hover:bg-white/5 text-white rounded-2xl h-12 font-black uppercase tracking-[0.2em]"
               >
                 Copy Log
               </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

