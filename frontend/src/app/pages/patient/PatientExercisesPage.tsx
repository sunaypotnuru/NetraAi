import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Activity, Dumbbell, PlayCircle, Target, Clock, Bone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import api from "@/lib/api";

interface PatientExercise {
  id: string; // patient_exercise_id
  prescribed_reps: number;
  prescribed_sets: number;
  exercises: {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    duration_seconds: number;
    target_joints: string[];
  };
}

export default function PatientExercisesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: assignments = [], isLoading } = useQuery<PatientExercise[]>({
    queryKey: ["myExercises"],
    queryFn: async () => {
      const res = await api.get("/api/v1/exercises/my-exercises");
      return res.data;
    }
  });

  const exerciseList = assignments || [];

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Hero Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0D9488] via-[#0F766E] to-[#065F46] text-white shadow-2xl border border-teal-400/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="space-y-3 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide border border-white/20">
              <Dumbbell className="w-3.5 h-3.5 text-teal-200" />
              <span>AI-POWERED COMPUTER VISION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t("patient.exercises.title", "Interactive AR Vision Therapy")}
            </h1>
            <p className="text-teal-100 text-sm sm:text-base leading-relaxed">
              {t("patient.exercises.subtitle", "Track form, joint angles, and eye focus in real-time using your device camera.")}
            </p>
          </div>

          <Button
            onClick={() => navigate(`/patient/exercises/ar/${exerciseList[0]?.id || 'ex-1'}`)}
            className="z-10 bg-white text-[#0D9488] hover:bg-teal-50 font-bold px-6 py-6 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0"
          >
            <PlayCircle className="w-6 h-6 text-[#0D9488]" />
            <span>{t("patient.exercises.launch_ar", "Launch Live AR Session")}</span>
          </Button>

          {/* Background Decorative Graphic */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        </motion.div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {exerciseList.map((assignment, index) => {
              const ex = assignment.exercises;
              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="flex flex-col h-full overflow-hidden border border-white/20 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 rounded-[2rem] shadow-lg group">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4 gap-4">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-snug">{ex.name}</h3>
                        <span className="capitalize text-xs font-bold px-3 py-1 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 shrink-0 select-none">
                          {ex.difficulty}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed font-medium line-clamp-3">
                        {ex.description || "No description provided."}
                      </p>

                      <div className="space-y-3.5 border-t border-slate-200/50 dark:border-white/5 pt-4">
                        <div className="flex items-center text-sm">
                          <Target className="w-4 h-4 mr-2 text-teal-600 dark:text-teal-400" />
                          <span className="text-slate-500 dark:text-slate-400 mr-2 font-medium">Target:</span>
                          <span className="font-bold text-slate-800 dark:text-white">
                            {assignment.prescribed_reps || 10} reps × {assignment.prescribed_sets || 3} sets
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 mr-2 text-teal-600 dark:text-teal-400" />
                          <span className="text-slate-500 dark:text-slate-400 mr-2 font-medium">Est. Duration:</span>
                          <span className="font-bold text-slate-800 dark:text-white">
                            {Math.round((ex.duration_seconds || 180) / 60)} mins
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0 mt-auto">
                      <Button
                        className="w-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold rounded-2xl py-6 shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 group-hover:bg-[#0F766E] transition-all"
                        onClick={() => navigate(`/patient/exercises/ar/${assignment.id}`)}
                      >
                        <PlayCircle className="w-5 h-5" />
                        <span>Start AR Tracking Session</span>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
