import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Calendar, Save, PhoneCall } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { patientAPI } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

export default function MedicationSchedulePage() {
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  interface Medication {
    id: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    time: string;
    taken: boolean;
  }

  const [schedule, setSchedule] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load existing schedule from profile or fetch from DB
    if (profile?.medication_schedule) {
      setSchedule(profile.medication_schedule);
    }
    setLoading(false);
  }, [profile]);

  const handleAddMedication = () => {
    setSchedule([...schedule, {
      id: `temp-${Date.now()}`,
      medication_name: "",
      dosage: "",
      frequency: "daily",
      time: "09:00",
      taken: false
    }]);
  };

  const handleRemoveMedication = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule.splice(index, 1);
    setSchedule(newSchedule);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string | boolean) => {
    const newSchedule = [...schedule];
    (newSchedule[index][field] as string | boolean) = value;
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await patientAPI.updateMedicationSchedule(schedule);
      toast.success(t('patient.medication.save_success', 'Medication schedule synced with the Autonomous Nurse System!'));
    } catch (e) {
      toast.error(t('patient.medication.save_error', 'Failed to save medication schedule.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent pt-24 pb-12 px-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-transparent">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-teal-500/10 dark:bg-teal-500/5 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.15)] border border-teal-500/20">
              <PhoneCall className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t('patient.medication.title', 'Nurse AI Schedule')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                {t('patient.medication.subtitle', 'Configure the medications our Autonomous Voice Agent will check on during its daily call.')}
              </p>
            </div>
          </div>

          <Card className="p-6 sm:p-8 shadow-2xl border border-white/20 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md mb-8 rounded-[2rem]">
            <div className="space-y-6">
              {schedule.length === 0 ? (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-white/20 dark:bg-slate-950/10 backdrop-blur-sm">
                  <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="font-semibold text-lg text-slate-700 dark:text-slate-300">
                    {t('patient.medication.no_medications', 'No medications scheduled')}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Add active medications to enable proactive voice agent tracking.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {schedule.map((med, index) => (
                    <motion.div
                      key={med.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="p-6 border border-slate-200/60 dark:border-white/5 rounded-2xl bg-white/30 dark:bg-slate-950/20 backdrop-blur-sm relative group hover:border-teal-500/30 dark:hover:border-teal-500/20 transition-all duration-300"
                    >
                      <button
                        onClick={() => handleRemoveMedication(index)}
                        className="absolute top-4 right-4 text-red-500 dark:text-red-400 hover:text-white hover:bg-red-500 dark:hover:bg-red-500 bg-red-50 dark:bg-red-950/30 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm border border-red-100 dark:border-red-950/20"
                        title="Remove medication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-semibold">{t('patient.medication.medication_name', 'Medication Name')}</Label>
                          <Input
                            className="bg-white/60 dark:bg-slate-950/60 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 rounded-xl transition-all"
                            value={med.medication_name}
                            onChange={(e) => updateMedication(index, "medication_name", e.target.value)}
                            placeholder={t('patient.medication.name_placeholder', 'e.g. Amlodipine')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-semibold">{t('patient.medication.dosage', 'Dosage')}</Label>
                          <Input
                            className="bg-white/60 dark:bg-slate-950/60 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 rounded-xl transition-all"
                            value={med.dosage}
                            onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                            placeholder={t('patient.medication.dosage_placeholder', 'e.g. 10mg')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-semibold">{t('patient.medication.time', 'Time')}</Label>
                          <Input
                            className="bg-white/60 dark:bg-slate-950/60 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 rounded-xl transition-all"
                            type="time"
                            value={med.time}
                            onChange={(e) => updateMedication(index, "time", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                          <Calendar className="w-4 h-4 text-teal-500" />
                          {t('patient.medication.frequency', 'Frequency')}
                        </Label>
                        <Input
                          className="bg-white/60 dark:bg-slate-950/60 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 rounded-xl transition-all"
                          value={med.frequency}
                          onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                          placeholder={t('patient.medication.frequency_placeholder', 'e.g. daily, twice daily')}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleAddMedication}
                variant="outline"
                className="w-full py-6 border-dashed border-2 rounded-2xl text-teal-600 dark:text-teal-400 bg-white/20 dark:bg-slate-900/20 hover:bg-teal-500/10 dark:hover:bg-teal-500/5 border-teal-200 dark:border-teal-800/30 transition-all duration-200 shadow-sm"
              >
                <Plus className="w-5 h-5 mr-2" /> {t('patient.medication.add_medication', 'Add Active Medication')}
              </Button>
            </div>
          </Card>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 text-white font-semibold py-6 rounded-2xl text-lg shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? t('patient.medication.saving', 'Deploying Instructions to AI...') : t('patient.medication.sync_schedule', 'Sync Schedule to Nurse Agent')}
          </Button>

          <div className="text-sm text-teal-700 dark:text-teal-400 mt-6 text-center bg-teal-500/10 dark:bg-teal-950/20 p-4 rounded-2xl border border-teal-500/20 dark:border-teal-800/30 font-medium backdrop-blur-md shadow-sm">
            {t('patient.medication.info', 'ℹ️ If you miss the AI Nurse\'s call, it will automatically try again in 30 minutes.')}
          </div>

        </motion.div>
      </div>
    </div>
  );
}
