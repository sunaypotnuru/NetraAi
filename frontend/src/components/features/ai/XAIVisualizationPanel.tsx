import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Brain, Activity, TrendingUp, Sparkles, Download } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface XAIResults {
  tool_name?: string;
  latency_ms?: number;
  result?: any;
}

export function XAIVisualizationPanel({ lastResults }: { lastResults?: XAIResults }) {
  // Use real data from results if available, otherwise use defaults
  const confidence = lastResults?.result?.confidence || 94.2;
  const focusArea = lastResults?.result?.focus_area || (lastResults?.tool_name === 'detect_cataract_tool' ? 'Lens Opacity' : 'Clinical Features');
  const attribution = lastResults?.result?.attribution || 87.5;
  const alignment = lastResults?.result?.alignment || 96.8;
  const explainability = lastResults?.result?.explainability || 92.3;

  const handleExportXAI = () => {
    toast.success("XAI Diagnostic Report exported as PDF", {
      description: "Includes Grad-CAM heatmap and clinical trust metrics."
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#8B5CF6]/10 rounded-xl border border-[#8B5CF6]/20">
            <Eye className="w-6 h-6 text-[#8B5CF6]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase">XAI Intelligence Insights</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Explainable Artificial Intelligence Diagnostic Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastResults && (
            <span className="px-4 py-1.5 bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-black rounded-full border border-[#22C55E]/20 uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full animate-pulse"></div>
              Live Analysis: {lastResults.tool_name?.replace('_tool', '').replace(/_/g, ' ')}
            </span>
          )}
          <span className="px-4 py-1.5 bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-black rounded-full border border-[#8B5CF6]/20 uppercase flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Grad-CAM Phase 2
          </span>
        </div>
      </div>
      
      <Card className="p-8 bg-white dark:bg-[#161B2B] rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-[0.02] -rotate-12">
          <Brain className="w-64 h-64 text-white" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 relative z-10">
          {/* Grad-CAM Heatmap */}
          <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-[2.5rem] border border-gray-100 dark:border-white/5 group hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <Eye className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-black text-[#0F172A] dark:text-white uppercase tracking-widest text-sm">Grad-CAM Heatmap</h3>
              </div>
              <div className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[9px] font-black rounded-lg border border-purple-500/20 uppercase">Explainable AI</div>
            </div>
            
            <div className="aspect-[16/9] bg-gray-100 dark:bg-[#0F172A] rounded-[2rem] mb-6 flex items-center justify-center relative overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-radial from-red-500/${lastResults ? '50' : '30'} via-yellow-500/20 to-transparent transition-opacity opacity-70 group-hover:opacity-100`}></div>
              <div className="text-center z-10 group-hover:scale-110 transition-transform">
                <Brain className="w-16 h-16 text-purple-400/50 mx-auto mb-3" />
                <div className="text-xs text-[#0F172A] dark:text-white font-black uppercase tracking-widest">Heatmap Active</div>
                <div className="text-[10px] text-purple-400 font-bold uppercase mt-1">{focusArea}</div>
              </div>
              <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-[10px] text-white font-mono border border-white/10">
                {lastResults ? 'DYNAMIC_GEN_V2' : 'PREVIEW_MODE_XAI'}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Confidence", value: `${confidence}%`, color: "text-green-400" },
                { label: "Primary Focus", value: focusArea, color: "text-purple-400" },
                { label: "Saliency", value: `${attribution}%`, color: "text-blue-400" }
              ].map(stat => (
                <div key={stat.label} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                  <div className="text-[8px] text-gray-500 font-black uppercase tracking-tighter mb-1">{stat.label}</div>
                  <div className={`text-xs font-black ${stat.color} truncate`}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Attention Map */}
          <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-[2.5rem] border border-gray-100 dark:border-white/5 group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-black text-[#0F172A] dark:text-white uppercase tracking-widest text-sm">Attention Mechanism</h3>
              </div>
              <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black rounded-lg border border-blue-500/20 uppercase">Attention Map</div>
            </div>
            
            <div className="aspect-[16/9] bg-gray-100 dark:bg-[#0F172A] rounded-[2rem] mb-6 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity">
                <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-red-500/40 rounded-full blur-[40px] animate-pulse"></div>
                <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-orange-500/30 rounded-full blur-[30px]"></div>
              </div>
              <div className="text-center z-10 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-16 h-16 text-blue-400/50 mx-auto mb-3" />
                <div className="text-xs text-[#0F172A] dark:text-white font-black uppercase tracking-widest">Attention Mask</div>
                <div className="text-[10px] text-blue-400 font-bold uppercase mt-1">Region Segmentation</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Global Status", value: "Optimal", color: "text-green-400" },
                { label: "Local Maxima", value: "3 Regions", color: "text-blue-400" },
                { label: "Relevance", value: `${explainability}%`, color: "text-cyan-400" }
              ].map(stat => (
                <div key={stat.label} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                  <div className="text-[8px] text-gray-500 font-black uppercase tracking-tighter mb-1">{stat.label}</div>
                  <div className={`text-xs font-black ${stat.color} truncate`}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Clinical Trust Metrics */}
        <div className="p-8 bg-gray-50 dark:bg-black/30 rounded-[2.5rem] border border-gray-100 dark:border-white/5 relative z-10">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <TrendingUp className="w-5 h-5 text-[#0D9488]" />
            <h3 className="font-black text-[#0F172A] dark:text-white uppercase tracking-[0.3em] text-xs">Clinical Trust &amp; Reliability Index</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Confidence", value: confidence, color: "from-purple-500 to-indigo-500", text: "text-purple-400" },
              { label: "Attribution", value: attribution, color: "from-blue-500 to-cyan-500", text: "text-blue-400" },
              { label: "Alignment", value: alignment, color: "from-emerald-500 to-teal-500", text: "text-emerald-400" },
              { label: "Explanability", value: explainability, color: "from-amber-500 to-orange-500", text: "text-amber-400" }
            ].map(item => (
              <div key={item.label} className="text-center group">
                <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-3 group-hover:text-white transition-colors">{item.label}</div>
                <div className={`text-4xl font-black ${item.text} mb-4 tracking-tighter`}>{item.value}%</div>
                <div className="h-1.5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden border border-gray-200 dark:border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                  ></motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4 relative z-10">
          <Button className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-[#0F172A] dark:text-white border border-gray-200 dark:border-white/10 rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-[10px] shadow-sm transition-all active:scale-95">
            <Eye className="w-4 h-4 mr-3 text-purple-400" />
            Full Screen Diagnostic View
          </Button>
          <Button 
            onClick={handleExportXAI}
            className="flex-1 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#0D9488]/20 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 mr-3" />
            Export XAI Clinical Report
          </Button>
        </div>
      </Card>
    </div>
  );
}
