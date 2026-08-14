import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Pill,
  Calendar,
  Clock,
  User,
  FileText,
  Bell,
  BellOff,
  Edit,
  Trash2,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { patientPortalAPI } from "@/services/patientPortalAPI";
import { Medication, MedicationLog } from "@/types/patientPortal";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function MedicationDetailsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { medicationId } = useParams<{ medicationId: string }>();

  const [medication, setMedication] = useState<Medication | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (medicationId) {
      fetchMedicationDetails();
      fetchMedicationLogs();
    }
  }, [medicationId]);

  const fetchMedicationDetails = async () => {
    if (!medicationId) return;

    setIsLoading(true);
    try {
      const response = await patientPortalAPI.getMedication(medicationId);
      setMedication(response.data);
    } catch (error) {
      console.error("Error fetching medication:", error);
      toast.error(t('patient.medications.load_failed', "Failed to load medication details"));
      navigate("/patient/medications");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMedicationLogs = async () => {
    if (!medicationId) return;

    try {
      const response = await patientPortalAPI.getMedicationLogs(medicationId);
      const logsData = response.data || [];
      setLogs(logsData);

      // Prepare chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const chartDataPoints = last7Days.map(date => {
        const dayLogs = logsData.filter((log: MedicationLog) =>
          log.scheduled_at.startsWith(date)
        );
        const taken = dayLogs.filter((log: MedicationLog) => log.status === 'taken').length;
        const missed = dayLogs.filter((log: MedicationLog) => log.status === 'missed').length;
        const skipped = dayLogs.filter((log: MedicationLog) => log.status === 'skipped').length;

        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          taken,
          missed,
          skipped,
          total: taken + missed + skipped
        };
      });

      setChartData(chartDataPoints);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const handleToggleReminders = async () => {
    if (!medication || !medicationId) return;

    try {
      await patientPortalAPI.updateMedicationReminders(medicationId, {
        reminder_times: medication.reminder_times || [],
        reminder_enabled: !medication.reminder_enabled
      });

      setMedication({
        ...medication,
        reminder_enabled: !medication.reminder_enabled
      });

      toast.success(
        medication.reminder_enabled
          ? t('patient.medications.reminders_disabled', "Reminders disabled")
          : t('patient.medications.reminders_enabled', "Reminders enabled")
      );
    } catch (error) {
      console.error("Error toggling reminders:", error);
      toast.error(t('patient.medications.update_failed', "Failed to update reminders"));
    }
  };

  const handleDelete = async () => {
    if (!medicationId) return;

    if (!confirm(t('patient.medications.confirm_delete', "Are you sure you want to delete this medication?"))) {
      return;
    }

    try {
      toast.info(t('patient.medications.delete_not_available', "Delete functionality coming soon"));
    } catch (error) {
      console.error("Error deleting medication:", error);
      toast.error(t('patient.medications.delete_failed', "Failed to delete medication"));
    }
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

  const getLogStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'missed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getLogStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300';
      case 'missed':
        return 'bg-red-500/5 dark:bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300';
      case 'skipped':
        return 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300';
      default:
        return 'bg-slate-500/5 dark:bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-350';
    }
  };

  if (isLoading || !medication) {
    return (
      <div className="min-h-screen pt-3 pb-12 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">{t('patient.medications.loading', "Loading medication...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-3 pb-12 bg-transparent text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <button
          onClick={() => navigate("/patient/medications")}
          className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all duration-300 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          {t('patient.medications.back_to_list', "Back to Medications")}
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
              <Pill className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                {medication.medication_name}
              </h1>
              <div className="flex items-center gap-3">
                <Badge className={`${getStatusColor(medication.status)} border px-2.5 py-0.5 rounded-full font-semibold`}>
                  {t(`patient.medications.status_${medication.status}`, medication.status)}
                </Badge>
                <span className="text-lg text-indigo-600 dark:text-indigo-400 font-extrabold">
                  {medication.dosage}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleToggleReminders}
              variant="outline"
              className="gap-2 bg-white/40 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              {medication.reminder_enabled ? (
                <>
                  <BellOff className="w-4 h-4 text-indigo-500" />
                  {t('patient.medications.disable_reminders', "Disable Reminders")}
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 text-indigo-500" />
                  {t('patient.medications.enable_reminders', "Enable Reminders")}
                </>
              )}
            </Button>
            <Button
              onClick={() => navigate(`/patient/medications/${medicationId}/log`)}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white gap-2 rounded-xl transition-all shadow-md shadow-indigo-600/15"
            >
              <Edit className="w-4 h-4" />
              {t('patient.medications.log_dose', "Log Dose")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Adherence Card */}
            {medication.status === 'active' && medication.adherence_rate !== undefined && (
              <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('patient.medications.adherence_tracking', "Adherence Tracking")}
                  </h2>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('patient.medications.overall_adherence', "Overall Adherence")}
                    </span>
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {medication.adherence_rate}%
                    </span>
                  </div>
                  <Progress value={medication.adherence_rate} className="h-3 bg-slate-100 dark:bg-slate-800" />
                </div>

                {medication.adherence_notes && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/20 dark:border-slate-800/20 italic leading-relaxed">
                    "{medication.adherence_notes}"
                  </p>
                )}
              </Card>
            )}

            {/* Adherence Chart */}
            {chartData.length > 0 && (
              <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('patient.medications.weekly_adherence', "Weekly Adherence")}
                  </h2>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                      <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(30, 41, 59, 0.9)',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Line
                        type="monotone"
                        dataKey="taken"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name={t('patient.medications.taken', "Taken")}
                      />
                      <Line
                        type="monotone"
                        dataKey="missed"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name={t('patient.medications.missed', "Missed")}
                      />
                      <Line
                        type="monotone"
                        dataKey="skipped"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name={t('patient.medications.skipped', "Skipped")}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Medication History */}
            <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('patient.medications.medication_history', "Medication History")}
                  </h2>
                </div>
                <Badge className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5">
                  {t('patient.medications.last_entries', `${logs.length} entries`)}
                </Badge>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    {t('patient.medications.no_history', "No medication history yet")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-xl border ${getLogStatusColor(log.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{getLogStatusIcon(log.status)}</div>
                          <div>
                            <p className="font-bold capitalize text-sm">
                              {t(`patient.medications.status_${log.status}`, log.status)}
                            </p>
                            <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
                              {new Date(log.scheduled_at).toLocaleString()}
                            </p>
                            {log.taken_at && (
                              <p className="text-xs text-slate-500 mt-1">
                                <span className="font-bold">{t('patient.medications.taken_at', "Taken at")}</span>: {new Date(log.taken_at).toLocaleString()}
                              </p>
                            )}
                            {log.notes && (
                              <p className="text-sm mt-2 italic bg-slate-900/5 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/10 dark:border-slate-800/10 leading-relaxed">
                                "{log.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Medication Info */}
            <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Pill className="w-5 h-5 text-indigo-500" />
                {t('patient.medications.medication_info', "Medication Information")}
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mt-0.5">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {t('patient.medications.dosage', "Dosage")}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white text-base">{medication.dosage}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {t('patient.medications.frequency', "Frequency")}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white text-base">{medication.frequency}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {t('patient.medications.route', "Route")}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white text-base">{medication.route}</p>
                  </div>
                </div>

                {medication.prescribed_by && (
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {t('patient.medications.prescribed_by', "Prescribed By")}
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-base">{medication.prescribed_by}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {t('patient.medications.start_date', "Start Date")}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white text-base font-mono">
                      {new Date(medication.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {medication.end_date && (
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {t('patient.medications.end_date', "End Date")}
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-base font-mono">
                        {new Date(medication.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Additional Info */}
            {(medication.indication || medication.instructions) && (
              <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  {t('patient.medications.additional_info', "Additional Information")}
                </h2>

                {medication.indication && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      {t('patient.medications.indication', "Indication")}
                    </p>
                    <p className="text-slate-700 dark:text-slate-350 text-sm leading-relaxed">{medication.indication}</p>
                  </div>
                )}

                {medication.instructions && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      {t('patient.medications.instructions', "Instructions")}
                    </p>
                    <p className="text-slate-700 dark:text-slate-350 text-sm leading-relaxed">{medication.instructions}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Refills Info */}
            {(medication.quantity_prescribed || medication.refills_remaining !== undefined) && (
              <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-indigo-500" />
                  {t('patient.medications.refills', "Refills")}
                </h2>

                <div className="space-y-4">
                  {medication.quantity_prescribed && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                        {t('patient.medications.quantity_prescribed', "Quantity Prescribed")}
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-base">{medication.quantity_prescribed}</p>
                    </div>
                  )}

                  {medication.refills_remaining !== undefined && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                        {t('patient.medications.refills_remaining', "Refills Remaining")}
                      </p>
                      <p className="font-bold text-indigo-650 dark:text-indigo-400 text-lg">{medication.refills_remaining}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Danger Zone */}
            <Card className="p-6 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/30 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                {t('patient.medications.danger_zone', "Danger Zone")}
              </h2>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-all font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                {t('patient.medications.delete_medication', "Delete Medication")}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
