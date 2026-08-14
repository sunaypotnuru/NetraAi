import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Calendar, FileText, Pill, TestTube, Stethoscope,
  Activity, AlertTriangle, Clock, Download, Filter, Search,
  ChevronDown, ChevronRight, Eye, Edit, Plus, Heart, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeartbeatLoader } from "@/components/shared/HeartbeatLoader";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { doctorAPI, vitalsAPI } from '@/lib/api';

interface MedicalEvent {
  id: string;
  date: string;
  type: 'appointment' | 'lab_result' | 'prescription' | 'diagnosis' | 'procedure' | 'vital_signs';
  title: string;
  description: string;
  provider: string;
  details: any;
  attachments?: string[];
  status: 'completed' | 'pending' | 'cancelled';
}

export default function PatientMedicalHistory() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient-basic', patientId],
    queryFn: async () => {
      const res = await doctorAPI.getPatientDetails(patientId!);
      return {
        id: res.data.patient.id,
        full_name: res.data.patient.full_name,
        mrn: res.data.patient.mrn || `MRN-${res.data.patient.id.slice(0, 8)}`,
        date_of_birth: res.data.patient.date_of_birth,
        gender: res.data.patient.gender
      };
    },
    enabled: !!patientId
  });

  const { data: medicalHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['patient-medical-history', patientId],
    queryFn: async () => {
      const res = await doctorAPI.getPatientTimeline(patientId!);
      // Map timeline records to MedicalEvent interface
      return res.data.records.map((record: any) => ({
        id: record.id,
        date: record.raw_date || record.date,
        type: record.type.toLowerCase().replace(' ', '_'),
        title: record.title,
        description: record.summary,
        provider: record.details || 'Netra AI',
        details: record.metadata || {},
        status: 'completed'
      })) as MedicalEvent[];
    },
    enabled: !!patientId
  });

  const { data: vitalTrends, isLoading: vitalsLoading } = useQuery({
    queryKey: ['patient-vital-trends', patientId],
    queryFn: async () => {
      const res = await vitalsAPI.getVitalsHistory(patientId!);
      const logs = res.data || [];
      const groupedByDate: Record<string, any> = {};

      logs.forEach((log: any) => {
        const date = log.logged_at.split('T')[0].substring(0, 7); // YYYY-MM
        if (!groupedByDate[date]) {
          groupedByDate[date] = { date };
        }
        if (log.tracker_type === 'blood_pressure') {
          const parts = log.value.split('/');
          groupedByDate[date].bp_systolic = parseInt(parts[0]);
          groupedByDate[date].bp_diastolic = parseInt(parts[1]);
        } else if (log.tracker_type === 'heart_rate') {
          groupedByDate[date].heart_rate = parseInt(log.value);
        } else if (log.tracker_type === 'weight') {
          groupedByDate[date].weight = parseFloat(log.value);
        }
      });

      return Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!patientId
  });

  const isLoading = patientLoading || historyLoading || vitalsLoading;

  // Filter medical history
  const filteredHistory = medicalHistory?.filter((event: MedicalEvent) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesDate = filterDate === 'all' ||
                       (filterDate === '30days' && new Date(event.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
                       (filterDate === '90days' && new Date(event.date) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) ||
                       (filterDate === '1year' && new Date(event.date) >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesType && matchesDate;
  }) || [];

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Stethoscope className="w-5 h-5 text-sky-500" />;
      case 'lab_result': return <TestTube className="w-5 h-5 text-purple-500" />;
      case 'prescription': return <Pill className="w-5 h-5 text-emerald-500" />;
      case 'diagnosis': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'procedure': return <Activity className="w-5 h-5 text-rose-500" />;
      case 'vital_signs': return <Heart className="w-5 h-5 text-pink-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'bg-sky-500/5 dark:bg-sky-500/10 border-sky-500/20';
      case 'lab_result': return 'bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/20';
      case 'prescription': return 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20';
      case 'diagnosis': return 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20';
      case 'procedure': return 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20';
      case 'vital_signs': return 'bg-pink-500/5 dark:bg-pink-500/10 border-pink-500/20';
      default: return 'bg-white/30 dark:bg-slate-900/30 border-gray-200/50 dark:border-white/5';
    }
  };

  if (isLoading) {
    return <HeartbeatLoader text="Synchronizing Medical Records..." />;
  }

  return (
    <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-900 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/doctor/patients/${patientId}`)}
              className="p-2 hover:bg-white/20 dark:hover:bg-slate-800/30 border border-transparent hover:border-slate-200/50 dark:hover:border-white/10 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-355" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Medical History</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                Complete medical history for {patient?.full_name} (MRN: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs text-slate-600 dark:text-slate-300 font-mono">{patient?.mrn}</code>)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-xl transition-all duration-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Export History
            </Button>
            <Button
              onClick={() => navigate(`/doctor/patients/${patientId}/timeline`)}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Eye className="w-4 h-4 mr-2" />
              Timeline View
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main History Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="lg:col-span-2 space-y-6"
          >

            {/* Filters */}
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search medical history..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 text-slate-900 dark:text-white rounded-xl transition-all">
                      <Filter className="w-4 h-4 mr-2 text-slate-500" />
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-955/95 backdrop-blur-md border-gray-250/50 dark:border-white/10 rounded-xl">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="appointment">Appointments</SelectItem>
                      <SelectItem value="lab_result">Lab Results</SelectItem>
                      <SelectItem value="prescription">Prescriptions</SelectItem>
                      <SelectItem value="diagnosis">Diagnoses</SelectItem>
                      <SelectItem value="vital_signs">Vital Signs</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDate} onValueChange={setFilterDate}>
                    <SelectTrigger className="w-full sm:w-[150px] bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 text-slate-900 dark:text-white rounded-xl transition-all">
                      <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                      <SelectValue placeholder="Time period" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-955/95 backdrop-blur-md border-gray-250/50 dark:border-white/10 rounded-xl">
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                      <SelectItem value="1year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Medical Events Timeline */}
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                  <CardContent className="text-center py-16 px-6">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-200/50 dark:border-slate-700/50">
                      <FileText className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Records Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm">
                      {searchQuery || filterType !== 'all' || filterDate !== 'all'
                        ? 'Try adjusting your search query or expanding the selection filters.'
                        : 'No comprehensive medical logs have been synchronized yet for this patient profile.'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredHistory.map((event: MedicalEvent, index: number) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(0.04 * index, 0.4), duration: 0.35 }}
                  >
                    <Card className={`border backdrop-blur-md shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 ${getEventColor(event.type)}`}>
                      <Collapsible>
                        <CollapsibleTrigger
                          onClick={() => toggleEventExpansion(event.id)}
                          className="w-full text-left"
                        >
                          <CardHeader className="hover:bg-white/20 dark:hover:bg-slate-900/20 transition-colors p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-950 flex items-center justify-center border border-slate-250/20 dark:border-white/10 shadow-sm shrink-0">
                                  {getEventIcon(event.type)}
                                </div>
                                <div>
                                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                    {event.title}
                                  </CardTitle>
                                  <p className="text-xs text-slate-550 dark:text-slate-400 font-medium mt-1 flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                    {new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} • {event.provider}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto border-t sm:border-0 border-slate-200/50 pt-2 sm:pt-0">
                                <Badge
                                  variant={event.status === 'completed' ? 'default' : 'secondary'}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    event.status === 'completed'
                                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 border-emerald-500/20'
                                      : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-505/20'
                                  }`}
                                >
                                  {event.status}
                                </Badge>
                                <div className="w-8 h-8 rounded-lg bg-white/40 dark:bg-slate-955/20 flex items-center justify-center border border-slate-200/50 dark:border-white/5">
                                  {expandedEvents.has(event.id) ? (
                                    <ChevronDown className="w-4 h-4 text-slate-650 dark:text-slate-350" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-650 dark:text-slate-355" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0 pb-5 px-5">
                            <Separator className="mb-4 border-slate-250/20 dark:border-white/5" />
                            <div className="space-y-4">
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{event.description}</p>

                              {/* Event-specific details */}
                              {event.type === 'appointment' && event.details && (
                                <div className="space-y-3.5 bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5 p-4 rounded-xl shadow-sm">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Diagnosis</h4>
                                      <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold">{event.details.diagnosis}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Symptoms</h4>
                                      <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold">{event.details.symptoms}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Treatment Plan</h4>
                                    <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold">{event.details.plan}</p>
                                  </div>
                                </div>
                              )}

                              {event.type === 'lab_result' && event.details?.tests && (
                                <div className="space-y-2.5">
                                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Test Results</h4>
                                  <div className="grid gap-2">
                                    {event.details.tests.map((test: any, idx: number) => (
                                      <div key={idx} className="flex items-center justify-between p-3.5 bg-white/40 dark:bg-slate-955/20 border border-slate-200/30 dark:border-white/5 rounded-xl shadow-sm">
                                        <div>
                                          <p className="font-bold text-slate-900 dark:text-white text-sm">{test.name}</p>
                                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">Reference: {test.range}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-black text-slate-900 dark:text-white text-sm">{test.value}</p>
                                          <Badge
                                            variant={test.status === 'normal' ? 'default' : 'destructive'}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${
                                              test.status === 'normal'
                                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-455 border-rose-500/20'
                                            }`}
                                          >
                                            {test.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {event.type === 'prescription' && event.details?.medications && (
                                <div className="space-y-2.5">
                                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prescribed Medications</h4>
                                  <div className="grid gap-2">
                                    {event.details.medications.map((med: any, idx: number) => (
                                      <div key={idx} className="flex items-center justify-between p-3.5 bg-white/40 dark:bg-slate-955/20 border border-slate-200/30 dark:border-white/5 rounded-xl shadow-sm">
                                        <div>
                                          <p className="font-bold text-slate-900 dark:text-white text-sm">{med.name}</p>
                                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{med.dosage} • {med.frequency}</p>
                                        </div>
                                        <Badge variant="secondary" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                          {med.change}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {event.type === 'vital_signs' && event.details && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/40 dark:bg-slate-955/20 border border-slate-200/30 dark:border-white/5 rounded-xl">
                                  {Object.entries(event.details).map(([key, value]) => (
                                    <div key={key} className="text-center p-3.5 bg-white/40 dark:bg-slate-950/20 border border-slate-200/50 dark:border-white/5 rounded-xl shadow-sm">
                                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider capitalize">
                                        {key.replace('_', ' ')}
                                      </p>
                                      <p className="text-base font-black text-sky-500 mt-1">{value as string}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {event.type === 'diagnosis' && event.details && (
                                <div className="space-y-3 bg-white/40 dark:bg-slate-955/20 border border-slate-200/30 dark:border-white/5 p-4 rounded-xl shadow-sm">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">ICD Reference Code</h4>
                                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">{event.details.icd_code}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Severity Status</h4>
                                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{event.details.severity}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Clinical Notes</h4>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{event.details.notes}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Sidebar - Vital Trends */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="space-y-6"
          >

            {/* Vital Signs Trends */}
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-200/50 dark:border-white/10 px-6 py-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky-500" />
                  Vital Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[250px] w-full">
                  {vitalTrends && vitalTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} stroke="currentColor" strokeOpacity={0.5} style={{ fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} stroke="currentColor" strokeOpacity={0.5} style={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                        <Line type="monotone" dataKey="bp_systolic" stroke="#F43F5E" strokeWidth={2.5} name="Systolic BP" activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="heart_rate" stroke="#0EA5E9" strokeWidth={2.5} name="Heart Rate" activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-450 text-xs">
                      No vitals records logged
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-200/50 dark:border-white/10 px-6 py-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/50 hover:text-sky-500 dark:hover:text-sky-400 transition-all"
                  onClick={() => navigate(`/doctor/patients/${patientId}`)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Patient Details
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/50 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Entry
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/50 hover:text-purple-500 dark:hover:text-purple-400 transition-all"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit History
                </Button>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-200/50 dark:border-white/10 px-6 py-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">History Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Total Entries</span>
                    <span className="text-slate-900 dark:text-white">{medicalHistory?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Appointments</span>
                    <span className="text-slate-900 dark:text-white">
                      {medicalHistory?.filter(e => e.type === 'appointment').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Lab Results</span>
                    <span className="text-slate-900 dark:text-white">
                      {medicalHistory?.filter(e => e.type === 'lab_result').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Prescriptions</span>
                    <span className="text-slate-900 dark:text-white">
                      {medicalHistory?.filter(e => e.type === 'prescription').length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
