import React from 'react';

import { motion } from "motion/react";
import {
  ArrowLeft,
  TrendingUp,
  Save,
  FileText,
  Target,
  Sparkles
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { patientPortalAPI } from "@/services/patientPortalAPI";
import { HealthGoal } from "@/types/patientPortal";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export default function LogGoalProgressPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goalId } = useParams<{ goalId: string }>();

  const [goal, setGoal] = React.useState<HealthGoal | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form state
  const [value, setValue] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (goalId) {
      fetchGoalDetails();
    }
  }, [goalId]);

  const fetchGoalDetails = async () => {
    if (!goalId) return;

    setIsLoading(true);
    try {
      const response = await patientPortalAPI.getGoal(goalId);
      const goalData = response.data;
      setGoal(goalData);
      // Pre-fill with current value
      setValue(goalData.current_value.toString());
    } catch (error) {
      console.error("Error fetching goal:", error);
      toast.error(t('patient.goals.load_failed', "Failed to load goal"));
      navigate("/patient/goals");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!goalId || !goal) return;

    if (!value || parseFloat(value) < 0) {
      toast.error(t('patient.goals.value_required', "Please enter a valid value"));
      return;
    }

    setIsSaving(true);
    try {
      await patientPortalAPI.logGoalProgress(goalId, {
        value: parseFloat(value),
        notes: notes.trim() || undefined
      });

      toast.success(t('patient.goals.progress_logged', "Progress logged successfully!"));
      navigate(`/patient/goals/${goalId}`);
    } catch (error) {
      console.error("Error logging progress:", error);
      toast.error(t('patient.goals.log_failed', "Failed to log progress"));
    } finally {
      setIsSaving(false);
    }
  };

  const getGoalTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      weight: "⚖️",
      steps: "👟",
      exercise: "💪",
      sleep: "😴",
      water: "💧",
      blood_pressure: "❤️",
      blood_sugar: "🩸",
      custom: "🎯"
    };
    return icons[type] || "🎯";
  };

  const calculateNewProgress = () => {
    if (!goal || !value) return 0;
    const numValue = parseFloat(value);
    const progress = ((numValue - 0) / (goal.target_value - 0)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const newProgress = calculateNewProgress();
  const progressDiff = goal ? newProgress - goal.progress_percentage : 0;

  if (isLoading || !goal) {
    return (
      <div className="min-h-screen pt-3 pb-12 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">{t('patient.goals.loading', "Loading...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-3 pb-12 bg-transparent text-slate-900 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <button
          onClick={() => navigate(`/patient/goals/${goalId}`)}
          className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all duration-300 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          {t('patient.goals.back_to_details', "Back to Goal Details")}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="p-6 sm:p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl filter drop-shadow-md">{getGoalTypeIcon(goal.goal_type)}</div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    {t('patient.goals.log_progress', "Log Progress")}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    {t('patient.goals.log_for', "Logging for")}: <span className="font-semibold text-teal-600 dark:text-teal-400">{goal.title}</span>
                  </p>
                </div>
              </div>

              {/* Current Status Panel */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/20 dark:border-slate-800/20">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    {t('patient.goals.current', "Current")}
                  </p>
                  <p className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200">
                    {goal.current_value} {goal.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    {t('patient.goals.target', "Target")}
                  </p>
                  <p className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400">
                    {goal.target_value} {goal.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    {t('patient.goals.progress', "Progress")}
                  </p>
                  <p className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                    {goal.progress_percentage}%
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Value Input */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-500" />
                  {t('patient.goals.new_value', "New Value")} ({goal.unit})
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`${t('patient.goals.enter_value', "Enter value")} (${goal.unit})`}
                  required
                  className="text-xl sm:text-2xl font-black h-16 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                />
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {t('patient.goals.value_hint', "Enter your current measurement or progress value")}
                </p>
              </div>

              {/* Progress Preview */}
              {value && parseFloat(value) >= 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-4 bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/30 dark:border-teal-400/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 animate-spin" />
                        {t('patient.goals.new_progress', "New Progress")}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-teal-700 dark:text-teal-400">
                          {newProgress.toFixed(1)}%
                        </span>
                        {progressDiff !== 0 && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            progressDiff > 0
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}>
                            {progressDiff > 0 ? '+' : ''}{progressDiff.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp className={`w-4 h-4 ${progressDiff >= 0 ? 'text-green-600 dark:text-green-450' : 'text-red-600 dark:text-red-450'}`} />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {progressDiff > 0
                          ? t('patient.goals.great_progress', "Great progress! Keep it up!")
                          : progressDiff < 0
                          ? t('patient.goals.keep_trying', "Keep trying! Every step counts.")
                          : t('patient.goals.no_change', "No change from last entry")}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-500" />
                  {t('patient.goals.notes', "Notes")} ({t('common.optional', "Optional")})
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('patient.goals.notes_placeholder', "How are you feeling? Any challenges or wins to note?")}
                  className="min-h-[120px] resize-none bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                />
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {t('patient.goals.notes_hint', "Add any observations, feelings, or context about this progress entry")}
                </p>
              </div>

              {/* Quick Tips */}
              <Card className="p-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/30 rounded-xl">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2.5 flex items-center gap-1.5">
                  <span>💡</span>
                  {t('patient.goals.tips_title', "Tips for Success")}
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside font-semibold leading-relaxed">
                  <li>{t('patient.goals.tip1', "Log your progress regularly for better tracking")}</li>
                  <li>{t('patient.goals.tip2', "Be honest with your measurements")}</li>
                  <li>{t('patient.goals.tip3', "Celebrate small wins along the way")}</li>
                </ul>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/patient/goals/${goalId}`)}
                  className="flex-1 bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all"
                  disabled={isSaving}
                >
                  {t('common.cancel', "Cancel")}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white gap-2 rounded-xl transition-all shadow-md shadow-teal-600/15"
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
                      {t('patient.goals.save_progress', "Save Progress")}
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
