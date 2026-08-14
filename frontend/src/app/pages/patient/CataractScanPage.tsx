import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, UploadCloud, AlertCircle, Activity, ArrowLeft, ListChecks, ShieldCheck, HeartPulse, ArrowRight, Stethoscope } from 'lucide-react';
import { patientAPI } from '@/lib/api';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import Breadcrumb from "@/components/shared/Breadcrumb";

const CataractScanPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  interface CataractResult {
    status: string;
    confidence: number;
    heatmap_url?: string;
    attention_regions?: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
      feature?: string;
    }>;
  }

  const [result, setResult] = useState<CataractResult | null>(null);
  const [error, setError] = useState('');
  const [qualityStatus, setQualityStatus] = useState<'checking' | 'good' | 'poor' | null>(null);
  const [qualityMessage, setQualityMessage] = useState<string>('');
  interface ScanHistory {
    id: string;
    image_url?: string;
    created_at: string;
    [key: string]: any;
  }

  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [comparing, setComparing] = useState(false);

  React.useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await patientAPI.getScans();
      setHistory(res.data || []);
    } catch (err) {
      console.error("Failed to load scan history", err);
    }
  };

  const scanId = (result as { id?: string })?.id;
  const historyItems = history.filter(s => s.id !== scanId);
  const previousScan = historyItems[0];

  const checkImageQuality = async (file: File) => {
    setQualityStatus('good');
    setQualityMessage(t("patient.scan.quality_checking", "Checking image quality..."));

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setQualityStatus('poor');
      setQualityMessage(t("patient.scan.quality_wrong_type", "Please upload a JPEG or PNG image."));
      return;
    }

    // Validate file size (max 10 MB)
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setQualityStatus('poor');
      setQualityMessage(t("patient.scan.quality_too_large", "Image exceeds 10 MB. Please use a smaller file."));
      return;
    }

    // Validate image dimensions (min 100×100 for a useful scan)
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          if (img.width < 100 || img.height < 100) {
            setQualityStatus('poor');
            setQualityMessage(t("patient.scan.quality_too_small", "Image resolution is too low. Minimum 100×100 px required."));
          } else {
            setQualityStatus('good');
            setQualityMessage(t("patient.scan.quality_ok", "Image quality looks good. Ready to analyze."));
          }
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          setQualityStatus('poor');
          setQualityMessage(t("patient.scan.quality_unreadable", "Unable to read image. Please try a different file."));
          resolve();
        };
        img.src = objectUrl;
      });
    } catch {
      // On any unexpected error, fall back to good so the user isn't blocked
      setQualityStatus('good');
      setQualityMessage(t("patient.scan.quality_ok", "Image ready to analyze."));
    }
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setResult(null);
      setError('');
      checkImageQuality(selectedFile);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      const response = await patientAPI.analyzeCataractWithXAI(formData);
      setResult(response.data);
      loadHistory();
    } catch (err) {
      const errorDetail = err instanceof Error && 'response' in err && (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(errorDetail || 'Analysis pipeline failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 }
    }
  };

  return (
    <motion.div
      className="container mx-auto p-4 max-w-4xl space-y-6 bg-transparent"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Button
        variant="outline"
        onClick={() => navigate("/patient/models")}
        className="mb-4 bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-semibold rounded-xl text-teal-600 dark:text-teal-400 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("common.back_to_models", "Back to AI Models")}
      </Button>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-lg shadow-teal-500/10">
          <Eye className="w-7 h-7 text-teal-600 dark:text-teal-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t("patient.cataract.title", "Cataract AI Scan")}</h1>
      </div>

      <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium">
        {t("patient.cataract.description", "Upload a clear close-up image of your eye to detect early indicators of cataracts using our ML model.")}
      </p>

      <Card className="p-8 shadow-xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-2xl flex flex-col items-center hover:shadow-2xl transition-all duration-300">
        {!preview ? (
          <label className="w-full h-64 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-500/5 dark:hover:bg-teal-500/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all">
            <UploadCloud className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-2" />
            <span className="text-slate-600 dark:text-slate-300 font-bold text-sm">{t("patient.cataract.upload_hint", "Click or drag an eye image here")}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
          </label>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className="relative w-64 h-64 mb-6 rounded-full overflow-hidden border-4 border-teal-500/20 shadow-lg bg-black flex items-center justify-center">
              <img src={preview} alt="Eye preview" className="w-full h-full object-cover opacity-90" />

              {/* Ocular circular targeting reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center rounded-full">
                {/* HUD rings */}
                <motion.div
                  className="w-48 h-48 border border-dashed border-emerald-500/30 rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="w-36 h-36 border border-emerald-500/20 rounded-full absolute"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Aiming lines */}
                <div className="absolute top-2 bottom-2 left-1/2 w-[1px] bg-emerald-500/10" />
                <div className="absolute left-2 right-2 top-1/2 h-[1px] bg-emerald-500/10" />
              </div>

              {analyzing && (
                <>
                  {/* Glowing neon emerald scanner line */}
                  <motion.div
                    className="absolute left-0 w-full h-[3px] bg-emerald-400 shadow-[0_0_15px_#10b981,0_0_30px_#10b981]"
                    animate={{ y: [0, 256, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                  {/* Matching glow sweep */}
                  <motion.div
                    className="absolute left-0 w-full h-16 bg-gradient-to-b from-transparent to-emerald-500/15 pointer-events-none"
                    animate={{ y: [-64, 256, -64] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </>
              )}

              {qualityStatus && qualityStatus !== 'checking' && (
                <div className={`absolute bottom-0 left-0 right-0 p-3 text-[10px] font-bold backdrop-blur-md flex items-center justify-center gap-2 z-20
                  ${qualityStatus === 'good' ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'}`}
                >
                  {qualityStatus === 'good' ? <span>✓</span> : <AlertCircle className="w-4 h-4" />}
                  {qualityMessage}
                </div>
              )}
            </div>

            {!analyzing && !result && (
              <div className="flex gap-4">
                <Button onClick={uploadAndAnalyze} size="lg" className="bg-teal-600 hover:bg-teal-700 text-white w-48 shadow-lg font-bold rounded-xl transition-all">
                  <Activity className="w-5 h-5 mr-2" /> {t("common.start_scan", "Start Scan")}
                </Button>
                <Button onClick={() => setPreview(null)} variant="outline" size="lg" className="w-32 bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold rounded-xl">
                  {t("common.retake", "Retake")}
                </Button>
              </div>
            )}

            {analyzing && (
              <div className="flex flex-col items-center">
                <p className="text-teal-600 dark:text-teal-400 font-bold animate-pulse text-lg flex items-center gap-2">
                   <Activity className="w-5 h-5 animate-spin" /> {t("patient.cataract.analyzing", "Analyzing ocular density...")}
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-6 w-full max-w-md">
            <AlertCircle className="w-5 h-5" /> {error}
          </Alert>
        )}
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Card className="p-8 glass-card shadow-2xl mt-6 relative overflow-hidden bg-white/70 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/10 rounded-2xl">
              <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  {t("patient.scan.results_title", "Scan Results")}
                </h2>
                {history.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setComparing(!comparing)}
                    className="border-teal-500/50 text-teal-600 dark:text-teal-400 bg-white/70 dark:bg-slate-900/50 hover:bg-teal-500/10 font-bold rounded-xl"
                  >
                    {comparing ? t("common.hide_comparison", "Hide Comparison") : t("common.compare_history", "Compare with History")}
                  </Button>
                )}
              </motion.div>

              {comparing && (
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-white/10"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs font-bold text-slate-500 uppercase">{t("common.current_scan", "Current")}</p>
                    <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-teal-500 shadow-sm">
                      <img src={result.heatmap_url || preview || ""} alt="Current" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400">{(result.confidence * 100).toFixed(1)}%</p>
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-8 h-8 text-slate-300 dark:text-slate-600 hidden md:block" />
                    <div className="h-8 w-[2px] bg-slate-200 dark:bg-slate-800 md:hidden" />
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs font-bold text-slate-500 uppercase">{t("common.previous_scan", "Previous Best")}</p>
                    {previousScan ? (
                      <>
                        <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-slate-200 dark:border-white/10 shadow-sm bg-white dark:bg-slate-800 flex items-center justify-center">
                          {previousScan.image_url ? (
                            <img src={previousScan.image_url} alt="Previous" className="w-full h-full object-cover" />
                          ) : (
                            <Eye className="w-12 h-12 text-slate-300" />
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                          {new Date(previousScan.created_at).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <div className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 italic text-xs p-4 text-center">
                        {t("common.no_prior_scans", "No prior scans found for comparison")}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <motion.div
                    variants={itemVariants}
                    className="p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20"
                  >
                    <p className="text-blue-600 dark:text-blue-300 font-semibold mb-1 text-sm">{t("patient.scan.diagnosis_status", "Diagnosis Status")}</p>
                    <p className="text-3xl font-black text-blue-900 dark:text-blue-100">{t(`models.prediction.${(result.status || '').toLowerCase()}`, result.status)}</p>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20"
                  >
                    <p className="text-emerald-600 dark:text-emerald-300 font-semibold mb-1 text-sm">{t("patient.scan.ai_confidence", "AI Confidence")}</p>
                    <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100">{(result.confidence * 100).toFixed(1)}%</p>
                  </motion.div>

                  {result.attention_regions && result.attention_regions.length > 0 && (
                    <motion.div
                      variants={itemVariants}
                      className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20"
                    >
                      <p className="text-amber-600 dark:text-amber-300 font-semibold mb-2 text-sm">{t("patient.scan.attention_regions", "Attention Regions")}</p>
                      <div className="flex flex-wrap gap-2">
                        {result.attention_regions.map((region, i) => (
                          <span key={i} className="px-3 py-1 bg-white/70 dark:bg-slate-800 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {typeof region === 'string' ? region : `${region.feature || 'Attention Area'} (${Math.round((region.confidence || 0) * 100)}%)`}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {result.heatmap_url && (
                  <motion.div variants={itemVariants} className="space-y-2">
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" /> {t("patient.scan.explainability_map", "Explainability Heatmap")}
                    </p>
                    <div className="relative rounded-2xl overflow-hidden border-2 border-teal-500/20 shadow-md aspect-square bg-slate-100 dark:bg-slate-900">
                      <img src={result.heatmap_url} alt="XAI Heatmap" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                        <p className="text-xs text-white/90 leading-relaxed font-semibold">
                          {t("patient.scan.heatmap_desc", "Red regions indicate high-importance features used by the AI for this diagnosis.")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* What is Cataract Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Card className="p-8 bg-gradient-to-r from-teal-500/10 to-blue-500/10 backdrop-blur-md border border-teal-500/20 dark:border-teal-500/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex items-center justify-center flex-shrink-0 border border-slate-100 dark:border-white/5">
              <Eye className="w-10 h-10 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {t("patient.cataract.what_is_title", "What is Cataract?")}
              </h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {t("patient.cataract.what_is_desc", "A cataract is a cloudy area in the lens of your eye. As we age, the proteins in our eye lens can clump together, causing the lens to become cloudy and yellowish. This prevents light from passing through clearly, leading to blurred or dim vision. Most cataracts develop slowly and don't disturb your eyesight early on, but eventually, they interfere with your vision.")}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* WHO Educational Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 pb-12">
        {/* Cataract Stages Section */}
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <Card className="p-6 h-full bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <ListChecks className="w-6 h-6" />
              {t("patient.cataract.who_stages", "WHO Cataract Stages")}
            </h3>
            <div className="space-y-4">
              {[
                { title: t('patient.cataract.stage0', 'Immature Cataract'), desc: t('patient.cataract.stage0_desc', 'The lens is partially opaque. Vision is slightly blurred but often manageable with glasses.') },
                { title: t('patient.cataract.stage1', 'Mature Cataract'), desc: t('patient.cataract.stage1_desc', 'The lens is completely opaque. Significant vision loss. Surgery is typically recommended at this stage.') },
                { title: t('patient.cataract.stage2', 'Hypermature Cataract'), desc: t('patient.cataract.stage2_desc', 'The lens has become liquid or shrunken. Can lead to inflammation and glaucoma if left untreated.') },
              ].map((stage, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-white/5 hover:border-teal-500/30 transition-colors">
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{stage.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{stage.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <div className="space-y-6">
          {/* Prevention Section */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl bg-gradient-to-br from-teal-500/5 to-transparent">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-6 h-6" />
                {t("patient.cataract.prevention", "Prevention Guidelines")}
              </h3>
              <ul className="space-y-3">
                {[
                  { icon: Eye, text: t('patient.cataract.prev1', 'Wear UV-protective sunglasses when outdoors.') },
                  { icon: Activity, text: t('patient.cataract.prev2', 'Manage blood sugar levels (Diabetes increases risk).') },
                  { icon: ShieldCheck, text: t('patient.cataract.prev3', 'Quit smoking and reduce alcohol consumption.') },
                  { icon: HeartPulse, text: t('patient.cataract.prev4', 'Maintain a diet rich in antioxidants (Vitamin C and E).') },
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                    <item.icon className="w-5 h-5 flex-shrink-0 text-blue-500" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          {/* Treatment Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Stethoscope className="w-6 h-6" />
                {t("patient.cataract.treatments", "Standard Treatments")}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <ArrowRight className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{t('patient.cataract.treat1', 'Phacoemulsification')}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{t('patient.cataract.treat1_desc', 'Modern ultrasound surgery to break up and remove the cloudy lens.')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <ArrowRight className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{t('patient.cataract.treat2', 'Laser-Assisted Surgery')}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{t('patient.cataract.treat2_desc', 'Using femtosecond lasers for higher precision in incision and lens fragmentation.')}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CataractScanPage;
