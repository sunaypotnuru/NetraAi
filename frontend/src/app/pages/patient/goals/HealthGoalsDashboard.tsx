import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Target,
  Plus,
  Search,
  Filter,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Calendar,
  Trophy,
  Flame
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { patientPortalAPI } from "@/services/patientPortalAPI";
import { HealthGoal } from "@/types/patientPortal";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export default function HealthGoalsDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<HealthGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "abandoned">("all");

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    filterGoals();
  }, [goals, searchTerm, statusFilter]);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const response = await patientPortalAPI.getGoals();
      setGoals(response.data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error(t('patient.goals.load_failed', "Failed to load health goals"));
    } finally {
      setIsLoading(false);
    }
  };

  const filterGoals = () => {
    let filtered = goals;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.goal_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredGoals(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50';
      case 'completed':
        return 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/50';
      case 'abandoned':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-3.5 h-3.5" />;
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'abandoned':
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return <Target className="w-3.5 h-3.5" />;
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-teal-650 dark:text-teal-400';
    if (percentage >= 50) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 25) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-650 dark:text-red-400';
  };

  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const totalGoals = goals.length;
  const averageProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress_percentage, 0) / goals.length)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-10 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">{t('patient.goals.loading', "Loading health goals...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Header */}
        <button
          onClick={() => navigate("/patient/dashboard")}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back_to_dashboard', "Back to Dashboard")}
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t('patient.goals.title', "Health Goals")}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t('patient.goals.subtitle', "Track your progress and achieve your health targets")}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/patient/goals/create")}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-2 rounded-xl shadow-md transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            {t('patient.goals.create_goal', "Create Goal")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {t('patient.goals.total_goals', "Total Goals")}
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalGoals}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950/40 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {t('patient.goals.active_goals', "Active Goals")}
                </p>
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{activeGoals}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {t('patient.goals.completed_goals', "Completed")}
                </p>
                <p className="text-3xl font-black text-green-600 dark:text-green-400 mt-1">{completedGoals}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {t('patient.goals.avg_progress', "Avg Progress")}
                </p>
                <p className={`text-3xl font-black mt-1 ${getProgressColor(averageProgress)}`}>
                  {averageProgress}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/40 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl transition-all duration-300">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={t('patient.goals.search_placeholder', "Search goals...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-300"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-4 py-2 bg-slate-55 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-slate-900 dark:text-white transition-all duration-300"
              >
                <option value="all" className="bg-white dark:bg-slate-900">{t('patient.goals.all_status', "All Status")}</option>
                <option value="active" className="bg-white dark:bg-slate-900">{t('patient.goals.status_active', "Active")}</option>
                <option value="completed" className="bg-white dark:bg-slate-900">{t('patient.goals.status_completed', "Completed")}</option>
                <option value="abandoned" className="bg-white dark:bg-slate-900">{t('patient.goals.status_abandoned', "Abandoned")}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Goals Grid */}
        {filteredGoals.length === 0 ? (
          <Card className="p-12 text-center bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl transition-all duration-300">
            <Target className="w-16 h-16 text-slate-300 dark:text-slate-650 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== "all"
                ? t('patient.goals.no_results', "No goals found")
                : t('patient.goals.no_goals', "No health goals yet")}
            </h3>
            <p className="text-slate-500 dark:text-slate-450 mb-6">
              {searchTerm || statusFilter !== "all"
                ? t('patient.goals.try_different_filter', "Try adjusting your search or filters")
                : t('patient.goals.create_first', "Create your first health goal to start tracking progress")}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button
                onClick={() => navigate("/patient/goals/create")}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-2 rounded-xl shadow-md transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                {t('patient.goals.create_goal', "Create Goal")}
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredGoals.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    onClick={() => navigate(`/patient/goals/${goal.id}`)}
                    className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl hover:shadow-2xl hover:border-slate-300/50 dark:hover:border-white/20 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-full"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-4xl filter drop-shadow-md select-none">{getGoalTypeIcon(goal.goal_type)}</div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-1.5 leading-snug">
                              {goal.title}
                            </h3>
                            <Badge className={`${getStatusColor(goal.status)} border flex items-center gap-1.5 w-fit font-semibold text-xs py-0.5 px-2`}>
                              {getStatusIcon(goal.status)}
                              <span>{t(`patient.goals.status_${goal.status}`, goal.status)}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {goal.description && (
                        <p className="text-sm text-slate-650 dark:text-slate-300 mb-5 leading-relaxed line-clamp-2">
                          {goal.description}
                        </p>
                      )}

                      {/* Progress */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {t('patient.goals.progress', "Progress")}
                          </span>
                          <span className={`text-sm font-black ${getProgressColor(goal.progress_percentage)}`}>
                            {goal.progress_percentage}%
                          </span>
                        </div>
                        <Progress value={goal.progress_percentage} className="h-2 bg-slate-100 dark:bg-slate-800" />
                        <div className="flex items-center justify-between mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <span>{goal.current_value} {goal.unit}</span>
                          <span>{goal.target_value} {goal.unit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-455">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {t('patient.goals.target_date', "Target")}: {new Date(goal.target_date).toLocaleDateString()}
                        </span>
                      </div>
                      {goal.status === 'active' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/patient/goals/${goal.id}/log`);
                          }}
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 text-white h-7 text-xs font-bold px-3 rounded-xl transition-all duration-300"
                        >
                          {t('patient.goals.log_progress', "Log")}
                        </Button>
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
