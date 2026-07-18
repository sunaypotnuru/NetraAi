import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Activity, Plus, Dumbbell, Target, Clock,
  Edit2, Trash2, CheckCircle, Bone, X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration_seconds: number;
  target_joints: string[];
}

interface ExercisePayload {
  name: string;
  description: string;
  difficulty: string;
  duration_seconds: number;
  target_joints: string[];
  category: string;
}

export default function DoctorExercisesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [duration, setDuration] = useState(60);
  const [selectedJoints, setSelectedJoints] = useState<string[]>([]);

  const JOINT_OPTIONS = [
    t("doctor.exercises.joint_left_shoulder", "LEFT_SHOULDER"),
    t("doctor.exercises.joint_right_shoulder", "RIGHT_SHOULDER"),
    t("doctor.exercises.joint_left_elbow", "LEFT_ELBOW"),
    t("doctor.exercises.joint_right_elbow", "RIGHT_ELBOW"),
    t("doctor.exercises.joint_left_wrist", "LEFT_WRIST"),
    t("doctor.exercises.joint_right_wrist", "RIGHT_WRIST"),
    t("doctor.exercises.joint_left_hip", "LEFT_HIP"),
    t("doctor.exercises.joint_right_hip", "RIGHT_HIP"),
    t("doctor.exercises.joint_left_knee", "LEFT_KNEE"),
    t("doctor.exercises.joint_right_knee", "RIGHT_KNEE"),
    t("doctor.exercises.joint_left_ankle", "LEFT_ANKLE"),
    t("doctor.exercises.joint_right_ankle", "RIGHT_ANKLE")
  ];

  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: async () => {
      const res = await api.get("/api/v1/exercises");
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: ExercisePayload) => {
      if (editingId) {
        return api.put(`/api/v1/exercises/${editingId}`, payload);
      }
      return api.post("/api/v1/exercises", payload);
    },
    onSuccess: () => {
      toast.success(editingId ? "Exercise updated" : "Exercise created");
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      closeModal();
    },
    onError: (err) => {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      toast.error(errorMessage || "Failed to save exercise");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/exercises/${id}`),
    onSuccess: () => {
      toast.success("Exercise deleted");
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    }
  });

  const openModal = (ex?: Exercise) => {
    if (ex) {
      setEditingId(ex.id);
      setName(ex.name);
      setDescription(ex.description || "");
      setDifficulty(ex.difficulty || "beginner");
      setDuration(ex.duration_seconds || 60);
      setSelectedJoints(ex.target_joints || []);
    } else {
      setEditingId(null);
      setName("");
      setDescription("");
      setDifficulty("beginner");
      setDuration(60);
      setSelectedJoints([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = () => {
    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (selectedJoints.length === 0) {
      toast.error("Please select at least one target joint for AR tracking");
      return;
    }
    saveMutation.mutate({
      name,
      description,
      difficulty,
      duration_seconds: duration,
      target_joints: selectedJoints,
      category: "physical_therapy"
    });
  };

  const toggleJoint = (j: string) => {
    setSelectedJoints(prev =>
      prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]
    );
  };

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
              <Dumbbell className="w-8 h-8 text-[#0D9488]" />
              AR Therapy Exercises
            </h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium text-sm mt-1">Manage physical therapy routines and assign MediaPipe target joints.</p>
          </div>
          <Button
            onClick={() => openModal()}
            className="bg-[#0D9488] hover:bg-[#0F766E] dark:bg-teal-600 dark:hover:bg-teal-700 text-white font-bold h-11 px-5 rounded-2xl shadow-lg shadow-teal-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
          >
            <Plus className="w-4 h-4" /> Create Exercise
          </Button>
        </div>

        {/* Exercises Grid */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : exercises.length === 0 ? (
          <Card className="p-16 text-center border-gray-200/50 dark:border-white/10 shadow-xl rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-md flex flex-col items-center justify-center">
            <Activity className="w-12 h-12 mb-4 text-[#0D9488]" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No exercises defined yet</h3>
            <p className="text-slate-600 dark:text-slate-400 font-medium mb-4 max-w-sm">Create exercises so patients can use the AR scan features for joints and movement tracking.</p>
            <Button variant="outline" className="border-gray-200/50 dark:border-white/10 text-[#0D9488] font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => openModal()}>
              Create your first exercise
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.map((ex) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group"
              >
                <Card className="p-6 h-full flex flex-col border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#0D9488]/5 rounded-full -translate-y-1/2 translate-x-1/2" />

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">{ex.name}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openModal(ex)}
                        className="p-2 text-slate-400 hover:text-[#0D9488] hover:bg-[#0D9488]/10 dark:hover:bg-[#0D9488]/20 rounded-xl transition-all duration-200"
                        title="Edit Exercise"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(ex.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl transition-all duration-200"
                        title="Delete Exercise"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium line-clamp-3 mb-6 flex-1 relative z-10 leading-relaxed">
                    {ex.description || "No description provided."}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5 relative z-10">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 font-bold"><Target className="w-3.5 h-3.5 text-[#0D9488]" /> DIFFICULTY</span>
                      <span className="capitalize font-black text-slate-800 dark:text-slate-200 bg-slate-100/70 dark:bg-slate-800/40 px-2.5 py-0.5 rounded-full">{ex.difficulty}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 font-bold"><Clock className="w-3.5 h-3.5 text-[#0D9488]" /> DURATION</span>
                      <span className="font-black text-slate-800 dark:text-slate-200 bg-slate-100/70 dark:bg-slate-800/40 px-2.5 py-0.5 rounded-full">{ex.duration_seconds} sec</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 font-bold"><Bone className="w-3.5 h-3.5 text-[#0D9488]" /> TRACKED JOINTS</span>
                      <span className="font-black text-[#0D9488] bg-[#0D9488]/10 dark:bg-[#0D9488]/20 px-2.5 py-0.5 rounded-full truncate max-w-[140px]" title={ex.target_joints?.join(", ")}>
                        {ex.target_joints?.length || 0} joints
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 dark:bg-slate-900/95 border border-gray-200/50 dark:border-white/10 backdrop-blur-xl shadow-2xl rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative scrollbar-none"
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 pr-8">
                {editingId ? "Edit Exercise" : "Create AR Exercise"}
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Exercise Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200/50 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] outline-none bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 transition-all shadow-sm"
                    placeholder="e.g. Shoulder Raise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200/50 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] outline-none bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 transition-all shadow-sm"
                    placeholder="Provide step-by-step instructions for the patient..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200/50 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] outline-none bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 transition-all shadow-sm"
                    >
                      <option value="beginner" className="dark:bg-slate-900">Beginner</option>
                      <option value="intermediate" className="dark:bg-slate-900">Intermediate</option>
                      <option value="advanced" className="dark:bg-slate-900">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Duration (seconds)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200/50 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] outline-none bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 transition-all shadow-sm"
                      min="10"
                    />
                  </div>
                </div>

                {/* Target Joints Selector */}
                <div className="pt-5 border-t border-slate-100 dark:border-white/5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Bone className="w-4 h-4 text-[#0D9488]" />
                    AR Tracked Joints (MediaPipe Pose landmark mapping)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {JOINT_OPTIONS.map(j => {
                      const isSelected = selectedJoints.includes(j);
                      return (
                        <button
                          key={j}
                          onClick={() => toggleJoint(j)}
                          className={`text-xs px-3.5 py-2.5 rounded-2xl border transition-all text-left flex items-center gap-2 ${
                            isSelected
                              ? "bg-teal-50 border-teal-200 text-teal-800 font-bold dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-200 shadow-sm"
                              : "bg-white/50 border-gray-200/50 dark:bg-slate-950/20 dark:border-white/5 text-slate-650 dark:text-slate-400 font-semibold hover:border-teal-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full flex shrink-0 items-center justify-center transition-all ${isSelected ? "bg-[#0D9488]" : "border border-gray-300 dark:border-slate-700"}`}>
                            {isSelected && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="truncate">{j.replace(/_/g, " ")}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-white/5">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="bg-white/70 dark:bg-slate-900/50 border-gray-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold rounded-2xl h-11 px-5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="bg-[#0D9488] hover:bg-[#0F766E] dark:bg-teal-600 dark:hover:bg-teal-700 text-white font-bold h-11 px-6 rounded-2xl shadow-lg shadow-teal-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {saveMutation.isPending ? "Saving..." : "Save Exercise"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
