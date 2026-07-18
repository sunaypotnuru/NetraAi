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

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-teal-500/10 dark:bg-teal-500/5 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.15)] flex items-center justify-center">
              <Dumbbell className="w-7 h-7" />
            </div>
            {t("patient.exercises.title", "My Physical Therapy")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-3 ml-1">
            {t("patient.exercises.subtitle", "Complete your prescribed AR tracking exercises below.")}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : assignments.length === 0 ? (
          <Card className="p-16 text-center flex flex-col items-center justify-center border border-white/20 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] shadow-2xl">
            <Activity className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-700 drop-shadow-[0_0_10px_rgba(20,184,166,0.1)]" />
            <p className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {t("patient.exercises.none", "No Exercises Prescribed")}
            </p>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm">
              {t("patient.exercises.none_desc", "Your doctor has not prescribed any physical therapy routines yet.")}
            </p>
            <Button
              className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl py-6 px-8 shadow-lg shadow-blue-500/10 transition-all duration-200"
              onClick={() => navigate("/patient/doctors")}
            >
              Consult a Doctor
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {assignments.map((assignment, index) => {
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
                          <Target className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500 mr-3 shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400 w-24 font-semibold">Goal:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {assignment.prescribed_sets} sets of {assignment.prescribed_reps} reps
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500 mr-3 shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400 w-24 font-semibold">Duration:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{ex.duration_seconds} sec</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Bone className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500 mr-3 shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400 w-24 font-semibold">Joints:</span>
                          <span className="font-extrabold text-teal-600 dark:text-teal-400">
                            {ex.target_joints?.length || 0} tracked points
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-5 bg-white/20 dark:bg-slate-950/20 border-t border-slate-200/50 dark:border-white/5 mt-auto">
                      <Button
                        className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-2xl py-6 shadow-lg shadow-teal-500/10 group-hover:shadow-teal-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 gap-2"
                        onClick={() => navigate(`/patient/exercises/${assignment.id}/session`)}
                      >
                        <PlayCircle className="w-5 h-5 shrink-0" />
                        {t("patient.exercises.start", "Start AR Session")}
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
