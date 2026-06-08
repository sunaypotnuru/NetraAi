import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Target,
  Calendar as CalendarIcon,
  TrendingUp,
  Save,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { patientPortalAPI } from "@/services/patientPortalAPI";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

export default function CreateHealthGoalPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [goalType, setGoalType] = useState<string>("weight");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [targetDate, setTargetDate] = useState<Date>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  );

  const goalTypes = [
    { value: "weight", label: t('patient.goals.type_weight', "Weight"), icon: "⚖️", defaultUnit: "kg" },
    { value: "steps", label: t('patient.goals.type_steps', "Steps"), icon: "👟", defaultUnit: "steps" },
    { value: "exercise", label: t('patient.goals.type_exercise', "Exercise"), icon: "💪", defaultUnit: "minutes" },
    { value: "sleep", label: t('patient.goals.type_sleep', "Sleep"), icon: "😴", defaultUnit: "hours" },
    { value: "water", label: t('patient.goals.type_water', "Water Intake"), icon: "💧", defaultUnit: "liters" },
    { value: "blood_pressure", label: t('patient.goals.type_bp', "Blood Pressure"), icon: "❤️", defaultUnit: "mmHg" },
    { value: "blood_sugar", label: t('patient.goals.type_sugar', "Blood Sugar"), icon: "🩸", defaultUnit: "mg/dL" },
    { value: "custom", label: t('patient.goals.type_custom', "Custom"), icon: "🎯", defaultUnit: "units" }
  ];

  const handleGoalTypeChange = (type: string) => {
    setGoalType(type);
    const selectedType = goalTypes.find(gt => gt.value === type);
    if (selectedType) {
      setUnit(selectedType.defaultUnit);
      // Auto-generate title if empty
      if (!title) {
        setTitle(selectedType.label);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error(t('patient.goals.title_required', "Goal title is required"));
      return;
    }

    if (!targetValue || parseFloat(targetValue) <= 0) {
      toast.error(t('patient.goals.target_required', "Target value must be greater than 0"));
      return;
    }

    if (!currentValue || parseFloat(currentValue) < 0) {
      toast.error(t('patient.goals.current_required', "Current value must be 0 or greater"));
      return;
    }

    if (targetDate <= startDate) {
      toast.error(t('patient.goals.date_validation', "Target date must be after start date"));
      return;
    }

    setIsSaving(true);
    try {
      await patientPortalAPI.createGoal({
        goal_type: goalType,
        title: title.trim(),
        description: description.trim() || undefined,
        target_value: parseFloat(targetValue),
        current_value: parseFloat(currentValue),
        unit: unit,
        start_date: startDate.toISOString(),
        target_date: targetDate.toISOString()
      });

      toast.success(t('patient.goals.create_success', "Health goal created successfully!"));
      navigate("/patient/goals");
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error(t('patient.goals.create_failed', "Failed to create health goal"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-transparent text-slate-900 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <button
          onClick={() => navigate("/patient/goals")}
          className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all duration-300 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          {t('patient.goals.back_to_goals', "Back to Health Goals")}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="p-6 sm:p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  {t('patient.goals.create_new', "Create New Health Goal")}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {t('patient.goals.create_subtitle', "Set a target and track your progress")}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Goal Type Selection */}
              <div>
                <Label className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3 block">
                  {t('patient.goals.select_type', "Select Goal Type")}
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {goalTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleGoalTypeChange(type.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-center flex flex-col items-center justify-center gap-2 ${
                        goalType === type.value
                          ? 'bg-teal-500/10 dark:bg-teal-500/20 border-teal-500 dark:border-teal-400 shadow-lg shadow-teal-500/5 scale-[1.02]'
                          : 'bg-white/40 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-teal-500/50 dark:hover:border-teal-400/50 hover:bg-white/60 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-3xl filter drop-shadow-sm">{type.icon}</span>
                      <p className={`text-xs font-semibold ${
                        goalType === type.value ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {type.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal Title */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-500" />
                  {t('patient.goals.goal_title', "Goal Title")}
                </Label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('patient.goals.title_placeholder', "e.g., Lose 5kg in 2 months")}
                  required
                  className="w-full bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                  {t('patient.goals.description', "Description")} ({t('common.optional', "Optional")})
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('patient.goals.description_placeholder', "Add more details about your goal...")}
                  className="min-h-[100px] resize-none bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                />
              </div>

              {/* Current and Target Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                    {t('patient.goals.current_value', "Current Value")}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-500" />
                    {t('patient.goals.target_value', "Target Value")}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                    {t('patient.goals.unit', "Unit")}
                  </Label>
                  <Input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kg"
                    required
                    className="w-full bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-teal-500" />
                    {t('patient.goals.start_date', "Start Date")}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500 rounded-xl text-slate-900 dark:text-white"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-teal-500" />
                        {format(startDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-teal-500" />
                    {t('patient.goals.target_date', "Target Date")}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500 rounded-xl text-slate-900 dark:text-white"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-teal-500" />
                        {format(targetDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={targetDate}
                        onSelect={(date) => date && setTargetDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Preview */}
              {title && targetValue && currentValue && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-4 bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/30 dark:border-teal-400/30 rounded-xl">
                    <p className="text-sm font-bold text-teal-900 dark:text-teal-300 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      {t('patient.goals.preview', "Goal Preview")}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {title} - <span className="font-semibold text-teal-700 dark:text-teal-400">{t('patient.goals.preview_text', {
                        current: currentValue,
                        target: targetValue,
                        unit: unit,
                        defaultValue: `From ${currentValue} ${unit} to ${targetValue} ${unit}`
                      })}</span>
                    </p>
                  </Card>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/patient/goals")}
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
                      {t('common.creating', "Creating...")}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t('patient.goals.create_goal', "Create Goal")}
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
