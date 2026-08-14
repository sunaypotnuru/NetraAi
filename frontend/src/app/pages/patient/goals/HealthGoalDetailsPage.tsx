import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Target,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Plus
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { patientPortalAPI } from "@/services/patientPortalAPI";
import { HealthGoal, GoalProgress } from "@/types/patientPortal";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function HealthGoalDetailsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goalId } = useParams<{ goalId: string }>();

  const [goal, setGoal] = useState<HealthGoal | null>(null);
  const [progressHistory, setProgressHistory] = useState<GoalProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTargetValue, setEditTargetValue] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "completed" | "abandoned">("active");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
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
      setEditTitle(goalData.title);
      setEditDescription(goalData.description || "");
      setEditTargetValue(goalData.target_value.toString());
      setEditStatus(goalData.status);

      // Fetch real progress history from API
      try {
        const progressRes = await patientPortalAPI.getGoalProgress(goalId);
        const progressData = Array.isArray(progressRes.data) ? progressRes.data : [];
        setProgressHistory(progressData);

        // Prepare chart data from real records
        const chartPoints = progressData.map((p: any) => ({
          date: new Date(p.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: p.value,
          target: goalData.target_value
        }));

        setChartData(chartPoints);
      } catch (err) {
        console.warn("Failed to fetch goal progress history:", err);
        setProgressHistory([]);
        setChartData([]);
      }
    } catch (error) {
      console.error("Error fetching goal:", error);
      toast.error(t('patient.goals.load_failed', "Failed to load goal details"));
      navigate("/patient/goals");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!goalId || !goal) return;

    if (!editTitle.trim()) {
      toast.error(t('patient.goals.title_required', "Goal title is required"));
      return;
    }

    setIsSaving(true);
    try {
      await patientPortalAPI.updateGoal(goalId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        target_value: parseFloat(editTargetValue),
        status: editStatus
      });

      toast.success(t('patient.goals.update_success', "Goal updated successfully"));
      setShowEditDialog(false);
      fetchGoalDetails();
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error(t('patient.goals.update_failed', "Failed to update goal"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!goalId) return;

    if (!confirm(t('patient.goals.confirm_delete', "Are you sure you want to delete this goal?"))) {
      return;
    }

    try {
      await patientPortalAPI.deleteGoal(goalId);
      toast.success(t('patient.goals.deleted', "Goal deleted successfully"));
      navigate("/patient/goals");
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error(t('patient.goals.delete_failed', "Failed to delete goal"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'abandoned':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'abandoned':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
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

  const daysRemaining = goal
    ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (isLoading || !goal) {
    return (
      <div className="min-h-screen pt-3 pb-12 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">{t('patient.goals.loading', "Loading goal...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-3 pb-12 bg-transparent text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <button
          onClick={() => navigate("/patient/goals")}
          className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all duration-300 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          {t('patient.goals.back_to_goals', "Back to Health Goals")}
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-5xl filter drop-shadow-md">{getGoalTypeIcon(goal.goal_type)}</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                {goal.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`${getStatusColor(goal.status)} border flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold`}>
                  {getStatusIcon(goal.status)}
                  {t(`patient.goals.status_${goal.status}`, goal.status)}
                </Badge>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t('patient.goals.type', "Type")}: {t(`patient.goals.type_${goal.goal_type}`, goal.goal_type)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowEditDialog(true)}
              variant="outline"
              className="gap-2 bg-white/40 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <Edit className="w-4 h-4" />
              {t('common.edit', "Edit")}
            </Button>
            {goal.status === 'active' && (
              <Button
                onClick={() => navigate(`/patient/goals/${goalId}/log`)}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white gap-2 rounded-xl transition-all shadow-md shadow-teal-600/15"
              >
                <Plus className="w-4 h-4" />
                {t('patient.goals.log_progress', "Log Progress")}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('patient.goals.progress_tracking', "Progress Tracking")}
                </h2>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t('patient.goals.overall_progress', "Overall Progress")}
                  </span>
                  <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    {goal.progress_percentage}%
                  </span>
                </div>
                <Progress value={goal.progress_percentage} className="h-3 mb-3 bg-slate-100 dark:bg-slate-800" />
                <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-955/30 p-2.5 rounded-lg border border-slate-200/20 dark:border-slate-850">
                  <span>{goal.current_value} {goal.unit}</span>
                  <span className="text-teal-600 dark:text-teal-400">{goal.target_value} {goal.unit}</span>
                </div>
              </div>

              {goal.description && (
                <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/20 dark:border-slate-800/20 text-sm leading-relaxed italic">
                  "{goal.description}"
                </p>
              )}
            </Card>

            {/* Progress Chart */}
            {chartData.length > 0 && (
              <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('patient.goals.progress_chart', "Progress Chart")}
                  </h2>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
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
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#0d9488"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        name={t('patient.goals.current', "Current")}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name={t('patient.goals.target', "Target")}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Progress History */}
            <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('patient.goals.progress_history', "Progress History")}
                  </h2>
                </div>
                <Badge className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5">
                  {progressHistory.length} {t('patient.goals.entries', "entries")}
                </Badge>
              </div>

              {progressHistory.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    {t('patient.goals.no_history', "No progress logged yet")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {progressHistory.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-950/20 hover:bg-white/50 dark:hover:bg-slate-950/40 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-lg">
                            {entry.value} {goal.unit}
                          </p>
                          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                            {new Date(entry.recorded_at).toLocaleString()}
                          </p>
                          {entry.notes && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200/20 dark:border-slate-850/50 italic leading-relaxed">
                              "{entry.notes}"
                            </p>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                          <TrendingUp className="w-4 h-4" />
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
            {/* Goal Info */}
            <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-500" />
                {t('patient.goals.goal_info', "Goal Information")}
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mt-0.5">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {t('patient.goals.target_value', "Target Value")}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white text-base">
                      {goal.target_value} {goal.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mt-0.5">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {t('patient.goals.current_value', "Current Value")}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white text-base">
                      {goal.current_value} {goal.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {t('patient.goals.start_date', "Start Date")}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white text-base">
                      {new Date(goal.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {t('patient.goals.target_date', "Target Date")}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white text-base">
                      {new Date(goal.target_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {daysRemaining > 0 && goal.status === 'active' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-900 dark:text-blue-200 border border-blue-500/20 rounded-xl text-center font-bold text-sm"
                  >
                    {t('patient.goals.days_remaining', `${daysRemaining} days remaining`)}
                  </motion.div>
                )}
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/30 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                {t('patient.goals.danger_zone', "Danger Zone")}
              </h2>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-all font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                {t('patient.goals.delete_goal', "Delete Goal")}
              </Button>
            </Card>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                {t('patient.goals.edit_goal', "Edit Goal")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t('patient.goals.goal_title', "Goal Title")}
                </Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t('patient.goals.description', "Description")}
                </Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 min-h-[100px] bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500 rounded-xl resize-none"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t('patient.goals.target_value', "Target Value")}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editTargetValue}
                  onChange={(e) => setEditTargetValue(e.target.value)}
                  className="mt-1 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t('patient.goals.status', "Status")}
                </Label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as typeof editStatus)}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium"
                >
                  <option className="bg-white dark:bg-slate-900" value="active">{t('patient.goals.status_active', "Active")}</option>
                  <option className="bg-white dark:bg-slate-900" value="completed">{t('patient.goals.status_completed', "Completed")}</option>
                  <option className="bg-white dark:bg-slate-900" value="abandoned">{t('patient.goals.status_abandoned', "Abandoned")}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <Button
                  onClick={() => setShowEditDialog(false)}
                  variant="outline"
                  className="flex-1 bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all"
                  disabled={isSaving}
                >
                  {t('common.cancel', "Cancel")}
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl shadow-md transition-all"
                >
                  {isSaving ? t('common.saving', "Saving...") : t('common.save', "Save")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
