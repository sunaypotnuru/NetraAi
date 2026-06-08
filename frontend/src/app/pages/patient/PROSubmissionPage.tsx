import { useState, FormEvent, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { patientAPI } from "@/lib/api";
import { ClipboardList, Send, CheckCircle, Clock, Calendar, ArrowLeft, Loader2, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

export default function PROSubmissionPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  interface Question {
    id: string;
    text: string;
    type: string;
    options?: string[];
  }

  interface Questionnaire {
    id: string;
    name: string;
    frequency?: string;
    questions: Question[];
  }

  interface PROSubmission {
    questionnaire_id: string;
    submitted_at: string;
  }

  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Fetch assigned questionnaires
  const { data: questionnaires = [], isLoading } = useQuery({
    queryKey: ["patientPROQuestionnaires"],
    queryFn: () => patientAPI.getPROQuestionnaires().then((res: { data: Questionnaire[] }) => res.data)
  });

  // Fetch submission history
  const { data: submissions = [] } = useQuery({
    queryKey: ["patientPROSubmissions"],
    queryFn: (): Promise<PROSubmission[]> => (patientAPI.submitPROQuestionnaire({} as Parameters<typeof patientAPI.submitPROQuestionnaire>[0]) as Promise<{ data: PROSubmission[] }>).then((res) => res.data).catch(() => [])
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (data: { questionnaire_id: string; responses: Array<{ question_id: string; question_text: string; answer: string }> }) => patientAPI.submitPROQuestionnaire(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientPROSubmissions"] });
      queryClient.invalidateQueries({ queryKey: ["patientPROQuestionnaires"] });
      toast.success(t("patient.pro.submit_success", "Questionnaire submitted successfully!"));
      setSelectedQuestionnaire(null);
      setResponses({});
      setCurrentQuestionIndex(0);
    },
    onError: () => toast.error(t("patient.pro.submit_error", "Failed to submit questionnaire"))
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!selectedQuestionnaire) return;

    // Validate all questions answered
    const allAnswered = selectedQuestionnaire.questions.every(
      (q: Question) => responses[q.id] !== undefined && responses[q.id] !== ""
    );

    if (!allAnswered) {
      return toast.error(t("patient.pro.error_incomplete", "Please answer all questions"));
    }

    submitMutation.mutate({
      questionnaire_id: selectedQuestionnaire.id,
      responses: selectedQuestionnaire.questions.map((q: Question) => ({
        question_id: q.id,
        question_text: q.text,
        answer: responses[q.id]
      }))
    });
  };

  const handleNext = () => {
    if (!selectedQuestionnaire) return;
    const currentQuestion = selectedQuestionnaire.questions[currentQuestionIndex];
    if (!responses[currentQuestion.id] || responses[currentQuestion.id] === "") {
      return toast.error(t("patient.pro.error_answer_required", "Please answer this question before continuing"));
    }
    if (currentQuestionIndex < selectedQuestionnaire.questions.length - 1) {
      setCurrentQuestionIndex((prev: number) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev: number) => prev - 1);
    }
  };

  // Check if questionnaire is due based on frequency
  const isQuestionnaireDue = (q: Questionnaire) => {
    const lastSubmission = submissions.find((s: { questionnaire_id: string; submitted_at: string }) => s.questionnaire_id === q.id);
    if (!lastSubmission) return true;

    const lastDate = new Date(lastSubmission.submitted_at);
    const now = new Date();

    if (q.frequency === 'daily') {
      return lastDate.toDateString() !== now.toDateString();
    } else if (q.frequency === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return lastDate < weekAgo;
    } else if (q.frequency === 'monthly') {
      return lastDate.getMonth() !== now.getMonth() || lastDate.getFullYear() !== now.getFullYear();
    } else if (q.frequency === 'once') {
      return false; // Already submitted once
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
      </div>
    );
  }

  // If viewing a specific questionnaire
  if (selectedQuestionnaire) {
    const currentQuestion = selectedQuestionnaire.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selectedQuestionnaire.questions.length) * 100;

    return (
      <div className="min-h-screen bg-transparent py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedQuestionnaire(null);
              setResponses({});
              setCurrentQuestionIndex(0);
            }}
            className="mb-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-white/5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back", "Back to Questionnaires")}
          </Button>

          <Card className="p-6 sm:p-8 shadow-2xl border border-white/20 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2.5rem]">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 gap-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{selectedQuestionnaire.name}</h1>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-xl shrink-0 border border-blue-500/25">
                  {currentQuestionIndex + 1} / {selectedQuestionnaire.questions.length}
                </span>
              </div>
              <Progress value={progress} className="h-2 mb-3 bg-slate-100 dark:bg-white/5" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {t("patient.pro.progress_text", "Your responses help your doctor provide better care")}
              </p>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="p-6 rounded-2xl border border-blue-100 dark:border-white/5 bg-gradient-to-br from-blue-500/5 to-teal-500/5 backdrop-blur-sm shadow-inner">
                  <Label className="text-xl font-extrabold text-slate-900 dark:text-white mb-6 block leading-snug">
                    {currentQuestion.text}
                  </Label>

                  {currentQuestion.type === 'number' && (
                    <div className="space-y-6">
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={responses[currentQuestion.id] || ""}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setResponses({ ...responses, [currentQuestion.id]: e.target.value })}
                        placeholder={t("patient.pro.placeholder_number", "Enter a number from 1 to 10")}
                        className="text-lg p-6 text-center font-bold bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 rounded-xl transition-all"
                      />
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold px-2">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                          1 ({t("patient.pro.scale_low", "Low")})
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                          10 ({t("patient.pro.scale_high", "High")})
                        </span>
                      </div>

                      {/* Visual scale buttons with glow */}
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setResponses({ ...responses, [currentQuestion.id]: num.toString() })}
                            className={`w-11 h-11 rounded-xl font-bold transition-all duration-200 ${
                              responses[currentQuestion.id] === num.toString()
                                ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white scale-110 shadow-lg shadow-blue-500/20'
                                : 'bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 dark:hover:bg-blue-500/5 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentQuestion.type === 'text' && (
                    <Textarea
                      value={responses[currentQuestion.id] || ""}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setResponses({ ...responses, [currentQuestion.id]: e.target.value })}
                      placeholder={t("patient.pro.placeholder_text", "Type your answer here...")}
                      rows={6}
                      className="text-lg bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 rounded-xl transition-all"
                    />
                  )}

                  {currentQuestion.type === 'multiple_choice' && (
                    <div className="space-y-3">
                      {currentQuestion.options?.map((option) => (
                        <label
                          key={option}
                          className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                            responses[currentQuestion.id] === option
                              ? 'border-blue-500/50 dark:border-blue-500/30 bg-blue-500/10 dark:bg-blue-500/5 shadow-md text-blue-600 dark:text-blue-400 font-semibold'
                              : 'border-slate-200 dark:border-white/5 bg-white/20 dark:bg-slate-950/10 hover:border-blue-500/30 hover:bg-blue-500/5 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name={currentQuestion.id}
                            value={option}
                            checked={responses[currentQuestion.id] === option}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setResponses({ ...responses, [currentQuestion.id]: e.target.value })}
                            className="w-5 h-5 text-blue-500 focus:ring-blue-500/30 border-slate-300 dark:border-white/10"
                          />
                          <span className="text-lg font-medium">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-6 rounded-xl hover:bg-slate-100/50 dark:hover:bg-white/5 border-slate-200 dark:border-white/10 transition-all font-semibold"
                  >
                    {t("common.previous", "Previous")}
                  </Button>

                  {currentQuestionIndex < selectedQuestionnaire.questions.length - 1 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="px-8 py-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/10 transition-all duration-200 hover:scale-[1.01]"
                    >
                      {t("common.next", "Next")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitMutation.isPending}
                      className="px-8 py-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/10 transition-all duration-200 hover:scale-[1.01]"
                    >
                      {submitMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {t("patient.pro.submit", "Submit Survey")}
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        </div>
      </div>
    );
  }

  // Main view: List of questionnaires
  const pendingQuestionnaires = (questionnaires as Questionnaire[]).filter(isQuestionnaireDue);
  const completedSubmissions = (submissions as Array<{ id: string; questionnaire_id: string; submitted_at: string; pro_questionnaires?: { name?: string } }>).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-transparent">
      <div className="bg-gradient-to-r from-blue-600/90 to-teal-600/90 dark:from-blue-950/40 dark:to-teal-950/40 text-white p-8 rounded-3xl shadow-xl border border-white/20 dark:border-white/5 backdrop-blur-md shadow-blue-500/5">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">{t("patient.pro.title", "Health Questionnaires")}</h1>
        <p className="text-blue-100 text-lg font-medium">
          {t("patient.pro.subtitle", "Complete these questionnaires to help your doctor track your progress")}
        </p>
      </div>

      {/* Pending Questionnaires */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2.5 text-slate-900 dark:text-white">
          <Clock className="w-6 h-6 text-orange-500" />
          {t("patient.pro.pending", "Pending Questionnaires")}
          {pendingQuestionnaires.length > 0 && (
            <span className="text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full border border-orange-500/20">
              {pendingQuestionnaires.length}
            </span>
          )}
        </h2>

        {pendingQuestionnaires.length === 0 ? (
          <Card className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-white/5 bg-white/30 dark:bg-slate-900/20 backdrop-blur-md rounded-[2rem] shadow-sm">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
              {String(t("patient.pro.all_complete", "All Caught Up!"))}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {String(t("patient.pro.no_pending", "You have no pending questionnaires at this time."))}
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingQuestionnaires.map((q) => (
              <Card
                key={q.id}
                className="p-6 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/20 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md hover:border-blue-500/40 dark:hover:border-blue-500/30 shadow-lg dark:shadow-2xl rounded-3xl group"
                onClick={() => setSelectedQuestionnaire(q)}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-md">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1 rounded-xl uppercase tracking-wider border border-orange-500/20">
                    {String(t(`patient.pro.freq_${q.frequency}`, { defaultValue: q.frequency || 'unknown' }))}
                  </span>
                </div>
                <h3 className="font-extrabold text-xl mb-2 text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                  {q.name}
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
                  {q.questions?.length || 0} {t("patient.pro.questions", "questions")} •
                  {t("patient.pro.takes", "Takes")} ~{Math.ceil((q.questions?.length || 0) * 0.5)} {t("patient.pro.min", "min")}
                </p>
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl py-5 shadow-lg shadow-blue-500/10 group-hover:shadow-blue-500/20 transition-all duration-200">
                  {t("patient.pro.start", "Start Questionnaire")}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Submissions */}
      {completedSubmissions.length > 0 && (
        <div className="pt-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2.5 text-slate-900 dark:text-white">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            {t("patient.pro.recent", "Recent Submissions")}
          </h2>
          <div className="space-y-4">
            {completedSubmissions.map((submission) => (
              <Card key={submission.id} className="p-5 flex items-center justify-between hover:shadow-lg hover:scale-[1.01] transition-all border border-white/20 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white leading-snug">{submission.pro_questionnaires?.name || "Questionnaire"}</h4>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-emerald-500/70" />
                      {t("patient.pro.submitted", "Submitted")} {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-slate-400 dark:text-slate-600 shrink-0" />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
