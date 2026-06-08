import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Save,
  Pill
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { patientPortalAPI } from "@/services/patientPortalAPI";
import { Medication } from "@/types/patientPortal";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

export default function MedicationLogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { medicationId } = useParams<{ medicationId: string }>();

  const [medication, setMedication] = useState<Medication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [selectedStatus, setSelectedStatus] = useState<'taken' | 'missed' | 'skipped'>('taken');
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [scheduledTime, setScheduledTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [takenDate, setTakenDate] = useState<Date>(new Date());
  const [takenTime, setTakenTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (medicationId) {
      fetchMedicationDetails();
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
      toast.error(t('patient.medications.load_failed', "Failed to load medication"));
      navigate("/patient/medications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!medicationId) return;

    setIsSaving(true);
    try {
      const scheduledDateTime = new Date(scheduledDate);
      const [hours, minutes] = scheduledTime.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

      let takenDateTime: string | undefined;
      if (selectedStatus === 'taken') {
        const takenDateObj = new Date(takenDate);
        const [takenHours, takenMinutes] = takenTime.split(':');
        takenDateObj.setHours(parseInt(takenHours), parseInt(takenMinutes));
        takenDateTime = takenDateObj.toISOString();
      }

      await patientPortalAPI.logMedication(medicationId, {
        scheduled_at: scheduledDateTime.toISOString(),
        taken_at: takenDateTime,
        status: selectedStatus,
        notes: notes.trim() || undefined
      });

      toast.success(t('patient.medications.log_success', "Medication logged successfully"));
      navigate(`/patient/medications/${medicationId}`);
    } catch (error) {
      console.error("Error logging medication:", error);
      toast.error(t('patient.medications.log_failed', "Failed to log medication"));
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions = [
    {
      value: 'taken' as const,
      label: t('patient.medications.status_taken', "Taken"),
      description: t('patient.medications.status_taken_desc', "I took this medication as scheduled"),
      icon: CheckCircle2,
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500',
      hoverColor: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
      textColor: 'text-emerald-950 dark:text-emerald-200'
    },
    {
      value: 'missed' as const,
      label: t('patient.medications.status_missed', "Missed"),
      description: t('patient.medications.status_missed_desc', "I forgot to take this medication"),
      icon: XCircle,
      color: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-500/10 dark:bg-red-500/20 border-red-500',
      hoverColor: 'hover:border-red-500/50 hover:bg-red-500/5',
      textColor: 'text-red-950 dark:text-red-200'
    },
    {
      value: 'skipped' as const,
      label: t('patient.medications.status_skipped', "Skipped"),
      description: t('patient.medications.status_skipped_desc', "I intentionally skipped this dose"),
      icon: AlertCircle,
      color: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500',
      hoverColor: 'hover:border-amber-500/50 hover:bg-amber-500/5',
      textColor: 'text-amber-950 dark:text-amber-200'
    }
  ];

  if (isLoading || !medication) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">{t('patient.medications.loading', "Loading...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-transparent text-slate-900 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <button
          onClick={() => navigate(`/patient/medications/${medicationId}`)}
          className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all duration-300 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          {t('patient.medications.back_to_details', "Back to Medication Details")}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="p-6 sm:p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
            <div className="mb-8 flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                  {t('patient.medications.log_medication', "Log Medication")}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {t('patient.medications.log_for', "Logging for")}: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{medication.medication_name}</span> ({medication.dosage})
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Status Selection */}
              <div>
                <Label className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 block">
                  {t('patient.medications.select_status', "Select Status")}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {statusOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedStatus === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedStatus(option.value)}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 text-left flex flex-col justify-between ${
                          isSelected
                            ? `${option.bgColor} ${option.bgColor} border-2 shadow-lg scale-[1.02]`
                            : `bg-white/40 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800/50 ${option.hoverColor}`
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`w-6 h-6 ${option.color} flex-shrink-0 mt-0.5`} />
                          <div>
                            <p className={`font-bold ${isSelected ? option.textColor : 'text-slate-800 dark:text-slate-200'}`}>
                              {option.label}
                            </p>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scheduled Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                    {t('patient.medications.scheduled_date', "Scheduled Date")}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl text-slate-900 dark:text-white"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
                        {format(scheduledDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={(date) => date && setScheduledDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                    {t('patient.medications.scheduled_time', "Scheduled Time")}
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-550 dark:text-indigo-400" />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none rounded-xl font-semibold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Taken Time (only if status is 'taken') */}
              {selectedStatus === 'taken' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                      {t('patient.medications.taken_date', "Actual Date Taken")}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl text-slate-900 dark:text-white"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
                          {format(takenDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={takenDate}
                          onSelect={(date) => date && setTakenDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                      {t('patient.medications.taken_time', "Actual Time Taken")}
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-550 dark:text-indigo-400" />
                      <input
                        type="time"
                        value={takenTime}
                        onChange={(e) => setTakenTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none rounded-xl font-semibold text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-550" />
                  {t('patient.medications.notes', "Notes")} ({t('common.optional', "Optional")})
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('patient.medications.notes_placeholder', "Add any additional notes about this dose...")}
                  className="min-h-[100px] bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl resize-none"
                />
                <p className="text-xs font-semibold text-slate-450 dark:text-slate-500">
                  {t('patient.medications.notes_hint', "You can add information about side effects, how you felt, or any other relevant details.")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/patient/medications/${medicationId}`)}
                  className="flex-1 bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-855 rounded-xl transition-all"
                  disabled={isSaving}
                >
                  {t('common.cancel', "Cancel")}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white gap-2 rounded-xl transition-all shadow-md shadow-indigo-600/15"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('common.saving', "Saving...")}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t('patient.medications.save_log', "Save Log")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
