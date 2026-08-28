import React from 'react';

import { motion, AnimatePresence } from "motion/react";
import {
  Pill,
  Plus,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { patientPortalAPI } from "@/services/patientPortalAPI";
import { Medication } from "@/types/patientPortal";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export default function MedicationsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [medications, setMedications] = React.useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = React.useState<Medication[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "discontinued" | "completed">("all");
  const [overallAdherence, setOverallAdherence] = React.useState(0);

  React.useEffect(() => {
    fetchMedications();
  }, []);

  React.useEffect(() => {
    filterMedications();
  }, [medications, searchTerm, statusFilter]);

  const fetchMedications = async () => {
    setIsLoading(true);
    try {
      const response = await patientPortalAPI.getMedications();
      // Handle both raw list and paginated object formats returned by different API versions
      const meds = Array.isArray(response.data)
        ? response.data
        : (response.data?.medications || []);
      setMedications(meds);

      // Calculate overall adherence
      const activeMeds = meds.filter((m: Medication) => m.status === 'active');
      if (activeMeds.length > 0) {
        const totalAdherence = activeMeds.reduce((sum: number, m: Medication) => sum + (m.adherence_rate || 0), 0);
        setOverallAdherence(Math.round(totalAdherence / activeMeds.length));
      }
    } catch (error) {
      console.error("Error fetching medications:", error);
      toast.error(t('patient.medications.load_failed', "Failed to load medications"));
    } finally {
      setIsLoading(false);
    }
  };

  const filterMedications = () => {
    let filtered = medications;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.indication?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMedications(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'discontinued':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'completed':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return 'text-emerald-500';
    if (rate >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getAdherenceIcon = (rate: number) => {
    if (rate >= 80) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (rate >= 60) return <Clock className="w-5 h-5 text-amber-500" />;
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  const activeMedications = medications.filter(m => m.status === 'active').length;
  const totalMedications = medications.length;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-3 pb-12 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">{t('patient.medications.loading', "Loading medications...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-3 pb-12 bg-transparent text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <button
          onClick={() => navigate("/patient/dashboard")}
          className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all duration-300 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          {t('common.back_to_dashboard', "Back to Dashboard")}
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Pill className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-600 dark:from-indigo-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {t('patient.medications.title', "My Medications")}
              </h1>
              <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">
                {t('patient.medications.subtitle', "Manage your prescriptions and track adherence")}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/patient/medications/reminders")}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white gap-2 rounded-xl transition-all shadow-md shadow-indigo-600/15"
          >
            <Plus className="w-5 h-5" />
            {t('patient.medications.add_medication', "Add Medication")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {t('patient.medications.active_meds', "Active Medications")}
                </p>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{activeMedications}</p>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                  {t('patient.medications.total_meds', `of ${totalMedications} total`)}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                <Pill className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {t('patient.medications.adherence_rate', "Adherence Rate")}
                </p>
                <p className={`text-3xl font-black ${getAdherenceColor(overallAdherence)}`}>
                  {overallAdherence}%
                </p>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                  {overallAdherence >= 80
                    ? t('patient.medications.excellent', "Excellent!")
                    : overallAdherence >= 60
                    ? t('patient.medications.good', "Good progress")
                    : t('patient.medications.needs_improvement', "Needs improvement")}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-450 shadow-inner">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {t('patient.medications.upcoming_doses', "Upcoming Doses")}
                </p>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {medications.filter(m => m.status === 'active' && m.reminder_enabled).length}
                </p>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                  {t('patient.medications.today', "Today")}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={t('patient.medications.search_placeholder', "Search medications...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-semibold text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-4 py-2.5 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-semibold text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
              >
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="all">{t('patient.medications.all_status', "All Status")}</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="active">{t('patient.medications.status_active', "Active")}</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="discontinued">{t('patient.medications.status_discontinued', "Discontinued")}</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="completed">{t('patient.medications.status_completed', "Completed")}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Medications List */}
        {filteredMedications.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl">
            <Pill className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {searchTerm || statusFilter !== "all"
                ? t('patient.medications.no_results', "No medications found")
                : t('patient.medications.no_medications', "No medications yet")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-semibold mb-6">
              {searchTerm || statusFilter !== "all"
                ? t('patient.medications.try_different_filter', "Try adjusting your search or filters")
                : t('patient.medications.add_first', "Add your first medication to start tracking")}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button
                onClick={() => navigate("/patient/medications/reminders")}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white gap-2 rounded-xl transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
                {t('patient.medications.add_medication', "Add Medication")}
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredMedications.map((medication, idx) => (
                <motion.div
                  key={medication.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card
                    onClick={() => navigate(`/patient/medications/${medication.id}`)}
                    className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-lg rounded-2xl hover:shadow-2xl hover:border-indigo-500/55 dark:hover:border-indigo-400/55 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-full"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors mb-1 line-clamp-1">
                            {medication.medication_name}
                          </h3>
                          <p className="text-sm text-indigo-650 dark:text-indigo-400 font-extrabold">
                            {medication.dosage}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(medication.status)} border px-2.5 py-0.5 rounded-full font-bold text-xs`}>
                          {t(`patient.medications.status_${medication.status}`, medication.status)}
                        </Badge>
                      </div>

                      {/* Frequency */}
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>{medication.frequency}</span>
                      </div>

                      {/* Adherence */}
                      {medication.status === 'active' && medication.adherence_rate !== undefined && (
                        <div className="mb-4 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200/10 dark:border-slate-850/20">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getAdherenceIcon(medication.adherence_rate)}
                              <span className="text-xs font-bold text-slate-750 dark:text-slate-300">
                                {t('patient.medications.adherence', "Adherence")}
                              </span>
                            </div>
                            <span className={`text-xs font-black ${getAdherenceColor(medication.adherence_rate)}`}>
                              {medication.adherence_rate}%
                            </span>
                          </div>
                          <Progress value={medication.adherence_rate} className="h-2 bg-slate-100 dark:bg-slate-800" />
                        </div>
                      )}

                      {/* Indication */}
                      {medication.indication && (
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                          {medication.indication}
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-slate-450 dark:text-slate-500">
                      <span>
                        {t('patient.medications.started', "Started")} {new Date(medication.start_date).toLocaleDateString()}
                      </span>
                      {medication.reminder_enabled && (
                        <span className="flex items-center gap-1.5 text-indigo-650 dark:text-indigo-400">
                          <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                          {t('patient.medications.reminders_on', "Reminders On")}
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
