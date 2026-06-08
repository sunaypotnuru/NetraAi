import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { patientPortalAPI } from "@/services/patientPortalAPI";
import { LabResult } from "@/types/patientPortal";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export default function LabResultsHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "preliminary" | "final" | "corrected">("all");
  const [abnormalFilter, setAbnormalFilter] = useState<"all" | "normal" | "abnormal">("all");

  useEffect(() => {
    fetchLabResults();
  }, []);

  useEffect(() => {
    filterResults();
  }, [labResults, searchTerm, statusFilter, abnormalFilter]);

  const fetchLabResults = async () => {
    setIsLoading(true);
    try {
      const response = await patientPortalAPI.getLabResults();
      setLabResults(response.data || []);
    } catch (error) {
      console.error("Error fetching lab results:", error);
      toast.error(t('patient.labs.load_failed', "Failed to load lab results"));
    } finally {
      setIsLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = labResults;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filter by abnormal flag
    if (abnormalFilter === "normal") {
      filtered = filtered.filter(r => r.abnormal_flag === 'N' || !r.abnormal_flag);
    } else if (abnormalFilter === "abnormal") {
      filtered = filtered.filter(r => r.abnormal_flag === 'H' || r.abnormal_flag === 'L');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.test_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.result_text?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.reported_date || a.created_at).getTime();
      const dateB = new Date(b.reported_date || b.created_at).getTime();
      return dateB - dateA;
    });

    setFilteredResults(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final':
        return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20';
      case 'preliminary':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'corrected':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
    }
  };

  const getAbnormalIcon = (flag?: string) => {
    if (!flag || flag === 'N') return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    if (flag === 'H') return <TrendingUp className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
    if (flag === 'L') return <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
    return <Minus className="w-5 h-5 text-slate-400 dark:text-slate-500" />;
  };

  const getAbnormalLabel = (flag?: string) => {
    if (!flag || flag === 'N') return t('patient.labs.normal', "Normal");
    if (flag === 'H') return t('patient.labs.high', "High");
    if (flag === 'L') return t('patient.labs.low', "Low");
    return t('patient.labs.unknown', "Unknown");
  };

  const getAbnormalColor = (flag?: string) => {
    if (!flag || flag === 'N') return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20';
    if (flag === 'H' || flag === 'L') return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
    return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
  };

  const handleExport = () => {
    const headers = ["Test Name", "Category", "Result", "Unit", "Reference Range", "Status", "Abnormal", "Date"];
    const rows = filteredResults.map(r => [
      r.test_name,
      r.test_category || "",
      r.result_value?.toString() || r.result_text || "",
      r.units || "",
      r.reference_range || "",
      r.status,
      getAbnormalLabel(r.abnormal_flag),
      new Date(r.reported_date || r.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lab-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(t('patient.labs.export_success', "Lab results exported successfully"));
  };

  const criticalCount = labResults.filter(r => r.critical_value).length;
  const abnormalCount = labResults.filter(r => r.abnormal_flag === 'H' || r.abnormal_flag === 'L').length;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-10 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">{t('patient.labs.loading', "Loading lab results...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 bg-transparent">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate("/patient/dashboard")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back_to_dashboard', "Back to Dashboard")}
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FlaskConical className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t('patient.labs.title', "Lab Results")}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t('patient.labs.subtitle', "View your laboratory test results")}
              </p>
            </div>
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            className="gap-2 bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200"
            disabled={filteredResults.length === 0}
          >
            <Download className="w-5 h-5" />
            {t('patient.labs.export', "Export Data")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">
                  {t('patient.labs.total_results', "Total Results")}
                </p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{labResults.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                <FlaskConical className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">
                  {t('patient.labs.abnormal', "Abnormal")}
                </p>
                <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{abnormalCount}</p>
              </div>
              <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">
                  {t('patient.labs.critical', "Critical")}
                </p>
                <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{criticalCount}</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">
                  {t('patient.labs.filtered', "Filtered")}
                </p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{filteredResults.length}</p>
              </div>
              <div className="w-12 h-12 bg-slate-500/10 rounded-xl flex items-center justify-center border border-slate-500/20">
                <Filter className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={t('patient.labs.search_placeholder', "Search tests...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/10 backdrop-blur-md rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-300 text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2.5 bg-white/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/10 backdrop-blur-md rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 text-sm cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900">{t('patient.labs.all_status', "All Status")}</option>
              <option value="final" className="bg-white dark:bg-slate-900">{t('patient.labs.status_final', "Final")}</option>
              <option value="preliminary" className="bg-white dark:bg-slate-900">{t('patient.labs.status_preliminary', "Preliminary")}</option>
              <option value="corrected" className="bg-white dark:bg-slate-900">{t('patient.labs.status_corrected', "Corrected")}</option>
            </select>

            {/* Abnormal Filter */}
            <select
              value={abnormalFilter}
              onChange={(e) => setAbnormalFilter(e.target.value as typeof abnormalFilter)}
              className="px-4 py-2.5 bg-white/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/10 backdrop-blur-md rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 text-sm cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900">{t('patient.labs.all_results', "All Results")}</option>
              <option value="normal" className="bg-white dark:bg-slate-900">{t('patient.labs.normal_only', "Normal Only")}</option>
              <option value="abnormal" className="bg-white dark:bg-slate-900">{t('patient.labs.abnormal_only', "Abnormal Only")}</option>
            </select>
          </div>
        </Card>

        {/* Lab Results List */}
        {filteredResults.length === 0 ? (
          <Card className="p-12 text-center bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl">
            <FlaskConical className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== "all" || abnormalFilter !== "all"
                ? t('patient.labs.no_results', "No lab results found")
                : t('patient.labs.no_labs', "No lab results yet")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchTerm || statusFilter !== "all" || abnormalFilter !== "all"
                ? t('patient.labs.try_different_filter', "Try adjusting your search or filters")
                : t('patient.labs.results_appear', "Your lab results will appear here after tests are completed")}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.005 }}
                  className="rounded-2xl"
                >
                  <Card className={`p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 ${
                    result.critical_value ? 'border-l-4 border-l-rose-500 dark:border-l-rose-400' : ''
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {result.test_name}
                          </h3>
                          {result.critical_value && (
                            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35 flex items-center gap-1 font-semibold rounded-lg">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {t('patient.labs.critical', "Critical")}
                            </Badge>
                          )}
                        </div>
                        {result.test_category && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{result.test_category}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0">
                        <Badge className={`${getStatusColor(result.status)} border font-semibold rounded-lg`}>
                          {t(`patient.labs.status_${result.status}`, result.status)}
                        </Badge>
                        <Badge className={`${getAbnormalColor(result.abnormal_flag)} border flex items-center gap-1 font-semibold rounded-lg`}>
                          {getAbnormalIcon(result.abnormal_flag)}
                          {getAbnormalLabel(result.abnormal_flag)}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-white/5">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                          {t('patient.labs.result', "Result")}
                        </p>
                        <p className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                          {result.result_value !== null && result.result_value !== undefined
                            ? `${result.result_value} ${result.units || ''}`
                            : result.result_text || t('common.na', "N/A")}
                        </p>
                      </div>

                      {result.reference_range && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                            {t('patient.labs.reference_range', "Reference Range")}
                          </p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {result.reference_range}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                          {t('patient.labs.reported_date', "Reported Date")}
                        </p>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          {new Date(result.reported_date || result.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {result.notes && (
                      <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl mb-3">
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{result.notes}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-white/5 gap-2 font-medium">
                      <div className="flex flex-wrap items-center gap-4">
                        {result.ordered_by && (
                          <span>{t('patient.labs.ordered_by', "Ordered by")}: {result.ordered_by}</span>
                        )}
                        {result.performed_by_lab && (
                          <span>{t('patient.labs.lab', "Lab")}: {result.performed_by_lab}</span>
                        )}
                      </div>
                      {result.collected_date && (
                        <span>
                          {t('patient.labs.collected', "Collected")}: {new Date(result.collected_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}




