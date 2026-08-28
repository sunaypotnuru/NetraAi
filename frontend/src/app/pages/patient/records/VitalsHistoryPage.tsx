import React from 'react';

import { motion } from "motion/react";
import {
  Activity,
  Heart,
  Thermometer,
  Weight,
  Ruler,
  Droplet,
  Wind,
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Filter,
  Download
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { patientPortalAPI } from "@/services/patientPortalAPI";
import { VitalRecord } from "@/types/patientPortal";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function VitalsHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [vitals, setVitals] = React.useState<VitalRecord[]>([]);
  const [filteredVitals, setFilteredVitals] = React.useState<VitalRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedType, setSelectedType] = React.useState<string>("all");
  const [chartData, setChartData] = React.useState<any[]>([]);

  const vitalTypes = [
    { value: "all", label: t('patient.vitals.all', "All Vitals"), icon: Activity },
    { value: "blood_pressure", label: t('patient.vitals.bp', "Blood Pressure"), icon: Heart },
    { value: "heart_rate", label: t('patient.vitals.hr', "Heart Rate"), icon: Activity },
    { value: "temperature", label: t('patient.vitals.temp', "Temperature"), icon: Thermometer },
    { value: "weight", label: t('patient.vitals.weight', "Weight"), icon: Weight },
    { value: "height", label: t('patient.vitals.height', "Height"), icon: Ruler },
    { value: "blood_sugar", label: t('patient.vitals.sugar', "Blood Sugar"), icon: Droplet },
    { value: "oxygen_saturation", label: t('patient.vitals.oxygen', "Oxygen"), icon: Wind }
  ];

  React.useEffect(() => {
    fetchVitals();
  }, []);

  React.useEffect(() => {
    filterVitals();
    prepareChartData();
  }, [vitals, selectedType]);

  const fetchVitals = async () => {
    setIsLoading(true);
    try {
      const response = await patientPortalAPI.getVitalsHistory();
      setVitals(response.data || []);
    } catch (error) {
      console.error("Error fetching vitals:", error);
      toast.error(t('patient.vitals.load_failed', "Failed to load vitals history"));
    } finally {
      setIsLoading(false);
    }
  };

  const filterVitals = () => {
    let filtered = vitals;

    if (selectedType !== "all") {
      filtered = filtered.filter(v => v.vital_type === selectedType);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

    setFilteredVitals(filtered);
  };

  const prepareChartData = () => {
    if (selectedType === "all" || filteredVitals.length === 0) {
      setChartData([]);
      return;
    }

    // Get last 10 readings for the selected type
    const recentVitals = filteredVitals.slice(0, 10).reverse();

    const data = recentVitals.map(v => ({
      date: new Date(v.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseFloat(v.value),
      unit: v.unit
    }));

    setChartData(data);
  };

  const getVitalIcon = (type: string) => {
    const vitalType = vitalTypes.find(vt => vt.value === type);
    return vitalType ? vitalType.icon : Activity;
  };

  const getVitalColor = (type: string) => {
    const colors: Record<string, string> = {
      blood_pressure: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
      heart_rate: "text-pink-600 dark:text-pink-400 bg-pink-500/10",
      temperature: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
      weight: "text-purple-600 dark:text-purple-400 bg-purple-500/10",
      height: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
      blood_sugar: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
      oxygen_saturation: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10",
      bmi: "text-green-600 dark:text-green-400 bg-green-500/10"
    };
    return colors[type] || "text-slate-600 dark:text-slate-400 bg-slate-500/10";
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    return null;
  };

  const handleExport = () => {
    const headers = ["Date", "Type", "Value", "Unit", "Notes"];
    const rows = filteredVitals.map(v => [
      new Date(v.recorded_at).toLocaleString(),
      v.vital_type,
      v.value,
      v.unit,
      v.notes || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vitals-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(t('patient.vitals.export_success', "Vitals exported successfully"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-3 pb-10 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">{t('patient.vitals.loading', "Loading vitals history...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-3 pb-10 bg-transparent">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate("/patient/dashboard")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back_to_dashboard', "Back to Dashboard")}
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t('patient.vitals.title', "Vitals History")}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t('patient.vitals.subtitle', "Track your vital signs over time")}
              </p>
            </div>
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            className="gap-2 bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200"
            disabled={filteredVitals.length === 0}
          >
            <Download className="w-5 h-5" />
            {t('patient.vitals.export', "Export Data")}
          </Button>
        </div>

        {/* Stats Card */}
        <Card className="p-6 mb-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">
                {t('patient.vitals.total_readings', "Total Readings")}
              </p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{vitals.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">
                {t('patient.vitals.types_tracked', "Types Tracked")}
              </p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {new Set(vitals.map(v => v.vital_type)).size}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">
                {t('patient.vitals.latest_reading', "Latest Reading")}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                {vitals.length > 0
                  ? new Date(vitals[0].recorded_at).toLocaleDateString()
                  : t('common.none', "None")}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">
                {t('patient.vitals.filtered', "Filtered")}
              </p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{filteredVitals.length}</p>
            </div>
          </div>
        </Card>

        {/* Filter */}
        <Card className="p-5 mb-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {t('patient.vitals.filter_by_type', "Filter by Type")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {vitalTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`px-4 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 font-semibold text-sm ${
                    selectedType === type.value
                      ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 dark:border-rose-400'
                      : 'bg-white/50 dark:bg-slate-900/30 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-500/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Chart */}
        {chartData.length > 0 && selectedType !== "all" && (
          <Card className="p-6 mb-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
              {t('patient.vitals.trend_chart', "Trend Chart")}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800/50" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                  }}
                  itemStyle={{ color: '#fff', fontSize: '13px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  dot={{ r: 6, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                  name={vitalTypes.find(vt => vt.value === selectedType)?.label || "Value"}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Vitals List */}
        {filteredVitals.length === 0 ? (
          <Card className="p-12 text-center bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl">
            <Activity className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {selectedType !== "all"
                ? t('patient.vitals.no_readings_type', "No readings for this type")
                : t('patient.vitals.no_readings', "No vitals recorded yet")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {selectedType !== "all"
                ? t('patient.vitals.try_different_filter', "Try selecting a different vital type")
                : t('patient.vitals.start_tracking', "Start tracking your vitals during appointments")}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredVitals.map((vital, index) => {
              const Icon = getVitalIcon(vital.vital_type);
              const previousVital = filteredVitals[index + 1];
              const trendIcon = previousVital
                ? getTrendIcon(parseFloat(vital.value), parseFloat(previousVital.value))
                : null;

              return (
                <motion.div
                  key={vital.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.005 }}
                  className="rounded-2xl"
                >
                  <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/25 dark:border-white/5 ${getVitalColor(vital.vital_type)}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                              {vitalTypes.find(vt => vt.value === vital.vital_type)?.label || vital.vital_type}
                            </h3>
                            {trendIcon}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <Badge className="bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20 font-semibold rounded-lg">
                              {vital.value} {vital.unit}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                              <Calendar className="w-4 h-4 text-rose-500" />
                              {new Date(vital.recorded_at).toLocaleString()}
                            </div>
                          </div>
                          {vital.notes && (
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                              {vital.notes}
                            </p>
                          )}
                          {vital.recorded_by && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
                              {t('patient.vitals.recorded_by', "Recorded by")}: {vital.recorded_by}
                            </p>
                          )}
                        </div>
                      </div>
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
