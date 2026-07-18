import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { doctorAPI } from "@/lib/api";
import { TrendingUp, Calendar, BarChart3, ArrowLeft, Download, Loader2, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface PROSubmission {
  submitted_at: string;
  responses?: Array<{ question_text: string; answer: string }>;
  pro_questionnaires?: { name?: string; frequency?: string };
}

interface GroupedPROData {
  name: string;
  frequency: string;
  submissions: PROSubmission[];
}

export default function PROAnalytics() {
  const { t } = useTranslation();
  const { patientId } = useParams();
  const navigate = useNavigate();

  const { data: proData = [], isLoading } = useQuery({
    queryKey: ["patientPROData", patientId],
    queryFn: () => doctorAPI.getPatientPROData(patientId!).then((res: { data: PROSubmission[] }) => res.data),
    enabled: !!patientId
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
      </div>
    );
  }

  if (!proData || proData.length === 0) {
    return (
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-6 bg-transparent">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("common.back", "Back")}
        </Button>
        <Card className="p-12 text-center bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border-2 border-dashed border-gray-200/50 dark:border-white/10 rounded-3xl">
          <BarChart3 className="w-16 h-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            {t("doctor.pro_analytics.no_data", "No PRO Data Available")}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {t("doctor.pro_analytics.no_data_desc", "This patient hasn't submitted any questionnaires yet.")}
          </p>
        </Card>
      </div>
    );
  }

  // Group by questionnaire
  const groupedData = proData.reduce((acc: Record<string, GroupedPROData>, submission: PROSubmission) => {
    const qName = submission.pro_questionnaires?.name || "Unknown";
    if (!acc[qName]) {
      acc[qName] = {
        name: qName,
        frequency: submission.pro_questionnaires?.frequency || "unknown",
        submissions: []
      };
    }
    acc[qName].submissions.push(submission);
    return acc;
  }, {});

  // Calculate overall compliance
  const totalExpected = Object.keys(groupedData).length * 4; // Assuming 4 submissions expected per questionnaire
  const totalActual = proData.length;
  const complianceRate = Math.round((totalActual / totalExpected) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto pt-24 pb-12 px-6 space-y-8 bg-transparent text-slate-800 dark:text-slate-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back", "Back to Patient")}
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t("doctor.pro_analytics.title", "Patient Outcomes Analytics")}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {t("doctor.pro_analytics.subtitle", "Track patient-reported outcomes over time")}
          </p>
        </div>
        <Button variant="outline" className="gap-2 bg-white/70 dark:bg-slate-900/50 border-gray-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <Download className="w-4 h-4" />
          {t("doctor.pro_analytics.export", "Export Report")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border border-blue-200/50 dark:border-blue-900/20 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{proData.length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {t("doctor.pro_analytics.total_submissions", "Total Submissions")}
          </div>
        </Card>

        <Card className="p-6 border border-emerald-200/50 dark:border-emerald-900/20 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{complianceRate}%</div>
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {t("doctor.pro_analytics.compliance_rate", "Compliance Rate")}
          </div>
        </Card>

        <Card className="p-6 border border-purple-200/50 dark:border-purple-900/20 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{Object.keys(groupedData).length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {t("doctor.pro_analytics.active_questionnaires", "Active Questionnaires")}
          </div>
        </Card>

        <Card className="p-6 border border-orange-200/50 dark:border-orange-900/20 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {proData[0] ? new Date(proData[0].submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {t("doctor.pro_analytics.last_submission", "Last Submission")}
          </div>
        </Card>
      </div>

      {/* Charts for Each Questionnaire */}
      {Object.entries(groupedData).map(([qName, groupData]) => {
        const typedData = groupData as GroupedPROData;
        // Prepare chart data - extract numeric responses
        const chartData = typedData.submissions
          .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
          .map((s) => {
            const dataPoint: Record<string, string | number> = {
              date: new Date(s.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              fullDate: new Date(s.submitted_at).toLocaleDateString()
            };

            // Extract numeric responses
            s.responses?.forEach((r: { question_text: string; answer: string }) => {
              if (r.answer && !isNaN(parseFloat(r.answer))) {
                // Truncate long question texts for legend
                const questionKey = r.question_text.length > 30
                  ? r.question_text.substring(0, 30) + '...'
                  : r.question_text;
                dataPoint[questionKey] = parseFloat(r.answer);
              }
            });

            return dataPoint;
          });

        // Get all numeric question keys
        const numericQuestions = chartData.length > 0
          ? Object.keys(chartData[0]).filter(k => k !== 'date' && k !== 'fullDate')
          : [];

        // Calculate trends
        const latestSubmission = typedData.submissions[typedData.submissions.length - 1];
        const previousSubmission = typedData.submissions[typedData.submissions.length - 2];

        let trendIndicator = null;
        if (latestSubmission && previousSubmission && numericQuestions.length > 0) {
          const latestAvg = numericQuestions.reduce((sum, q) => {
            const val = latestSubmission.responses?.find((r: { question_text: string; answer: string }) => r.question_text.startsWith(q.substring(0, 20)))?.answer;
            return sum + (val ? parseFloat(val) : 0);
          }, 0) / numericQuestions.length;

          const previousAvg = numericQuestions.reduce((sum, q) => {
            const val = previousSubmission.responses?.find((r: { question_text: string; answer: string }) => r.question_text.startsWith(q.substring(0, 20)))?.answer;
            return sum + (val ? parseFloat(val) : 0);
          }, 0) / numericQuestions.length;

          const change = ((latestAvg - previousAvg) / previousAvg) * 100;
          trendIndicator = {
            value: Math.abs(change).toFixed(1),
            direction: change > 0 ? 'up' : 'down',
            color: change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          };
        }

        // Color palette for lines
        const colors = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

        return (
          <Card key={qName} className="p-6 border border-gray-200/50 dark:border-white/10 shadow-xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-[#0EA5E9]" />
                  {qName}
                </h2>
                <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/70 px-3 py-1 rounded-full">
                      {String(t(`doctor.pro.freq_${typedData.frequency}`, typedData.frequency) || typedData.frequency)} {t("doctor.pro.frequency", "Frequency")}
                    </span>
                    {trendIndicator && (
                      <span className={`text-sm font-bold flex items-center gap-1 ${trendIndicator.color}`}>
                        <TrendingUp className={`w-4 h-4 ${trendIndicator.direction === 'down' ? 'rotate-180' : ''}`} />
                        {trendIndicator.value}% {trendIndicator.direction === 'up' ? String(t("common.increase", "increase")) : String(t("common.decrease", "decrease"))}
                      </span>
                    )}
                </div>
              </div>
            </div>

            {numericQuestions.length > 0 ? (
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      {numericQuestions.map((q, i) => (
                        <linearGradient key={q} id={`color${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="opacity-50 dark:opacity-10" />
                    <XAxis
                      dataKey="date"
                      stroke="#6B7280"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <YAxis
                      stroke="#6B7280"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                      domain={[0, 10]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: 'white'
                      }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    {numericQuestions.map((q, i) => (
                      <Area
                        key={q}
                        type="monotone"
                        dataKey={q}
                        stroke={colors[i % colors.length]}
                        strokeWidth={3}
                        fill={`url(#color${i})`}
                        dot={{ fill: colors[i % colors.length], r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-gray-200/50 dark:border-white/10">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {t("doctor.pro_analytics.no_numeric", "No numeric data to visualize")}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                    {t("doctor.pro_analytics.text_responses", "This questionnaire contains text responses only")}
                  </p>
                </div>
              </div>
            )}

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200/50 dark:border-white/10">
              <div className="text-center p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{typedData.submissions.length}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
                  {t("doctor.pro_analytics.submissions", "Submissions")}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50/50 dark:bg-green-950/20 rounded-2xl border border-green-100/50 dark:border-green-900/20">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Math.round((typedData.submissions.length / 12) * 100)}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
                  {t("doctor.pro_analytics.completion", "Completion")}
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-100/50 dark:border-purple-900/20">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {latestSubmission?.responses?.length || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
                  {t("doctor.pro_analytics.questions", "Questions")}
                </div>
              </div>
            </div>

            {/* Recent Text Responses */}
            {latestSubmission?.responses?.some((r) => isNaN(parseFloat(r.answer))) && (
              <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-white/10">
                <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white">
                  {t("doctor.pro_analytics.recent_responses", "Recent Text Responses")}
                </h3>
                <div className="space-y-3">
                  {latestSubmission.responses
                    .filter((r) => isNaN(parseFloat(r.answer)))
                    .slice(0, 3)
                    .map((r, i: number) => (
                      <div key={i} className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5">
                        <p className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">{r.question_text}</p>
                        <p className="text-slate-600 dark:text-slate-400 italic">"{r.answer}"</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </motion.div>
  );
}
