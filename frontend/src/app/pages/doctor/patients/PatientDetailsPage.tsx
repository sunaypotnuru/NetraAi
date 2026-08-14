import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router';
import { useAuthStore } from '@/lib/store';
import { getWebSocketManager } from '@/app/services/websocket';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, AlertTriangle,
  Heart, Activity, Thermometer, Zap, FileText, Pill, TestTube,
  User, Edit, MessageCircle, Video, Plus, Download, Share,
  ChevronRight, Star, Flag, Shield, Eye, Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeartbeatLoader } from "@/components/shared/HeartbeatLoader";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useWebSocket } from '@/app/contexts/WebSocketContext';
import { doctorAPI } from '@/lib/api';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  emergency_contact: string;
  insurance_provider: string;
  mrn: string;
  avatar_url?: string;
  risk_level: 'low' | 'medium' | 'high';
  last_visit: string;
  next_appointment?: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: any[];
  recent_vitals: any;
  lab_results: any[];
  appointments_count: number;
  adherence_score: number;
  vital_trends?: any[];
  recent_appointments?: any[];
}

export default function PatientDetailsPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { send } = useWebSocket();
  const [activeTab, setActiveTab] = useState('overview');
  const [collaborators, setCollaborators] = useState<any[]>([]);

  useEffect(() => {
    const setupCollaboration = async () => {
      try {
        const manager = getWebSocketManager();
        if (manager) {
          const conn = await manager.connect('presence');

          // Signal we are viewing
          conn.send('view_page', {
            page: 'patient_details',
            id: patientId,
            user: { id: user?.id, name: user?.name || user?.email }
          });

          // Listen for others viewing
          conn.on('user_viewing_page', (data) => {
            if (data.page === 'patient_details' && data.id === patientId && data.user.id !== user?.id) {
              setCollaborators(prev => {
                const exists = prev.find(c => c.id === data.user.id);
                if (exists) return prev;
                toast.info(`${data.user.name} is also viewing this patient`);
                return [...prev, data.user];
              });
            }
          });

          // Listen for users leaving
          conn.on('user_stopped_viewing', (data) => {
            if (data.page === 'patient_details' && data.id === patientId) {
              setCollaborators(prev => prev.filter(c => c.id !== data.user_id));
            }
          });
        }
      } catch (err) {
        console.error("Collaboration setup failed:", err);
      }
    };

    setupCollaboration();
  }, [patientId, user?.id, user?.name, user?.email]);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-details', patientId],
    queryFn: async (): Promise<Patient> => {
      const response = await doctorAPI.getPatientDetails(patientId!);
      const dbPatient = response.data.patient;

      // Map DB patient to Patient interface
      return {
        id: dbPatient.id,
        full_name: dbPatient.full_name || 'Unknown Patient',
        email: dbPatient.email || '',
        phone: dbPatient.phone || '',
        date_of_birth: dbPatient.date_of_birth || '',
        gender: dbPatient.gender || 'Unknown',
        address: dbPatient.address || '',
        emergency_contact: dbPatient.emergency_contact || '',
        insurance_provider: dbPatient.insurance_info?.provider || 'None',
        mrn: dbPatient.mrn || `MRN-${dbPatient.id.slice(0, 8)}`,
        avatar_url: dbPatient.avatar_url,
        risk_level: dbPatient.risk_level || 'low',
        last_visit: dbPatient.last_visit || 'Never',
        next_appointment: dbPatient.next_appointment,
        allergies: dbPatient.medical_history?.allergies || [],
        chronic_conditions: dbPatient.medical_history?.chronic_conditions || [],
        current_medications: dbPatient.medical_history?.current_medications || [],
        recent_vitals: dbPatient.recent_vitals || {
          blood_pressure: 'N/A',
          heart_rate: 'N/A',
          temperature: 'N/A',
          weight: 'N/A',
          height: 'N/A',
          bmi: 'N/A',
          oxygen_saturation: 'N/A'
        },
        lab_results: dbPatient.lab_results || [],
        appointments_count: dbPatient.stats?.appointments_count || 0,
        adherence_score: dbPatient.stats?.adherence_score || 0,
        vital_trends: dbPatient.vital_trends || [],
        recent_appointments: dbPatient.recent_appointments || []
      };
    },
    enabled: !!patientId
  });

  useEffect(() => {
    const setupRealtime = async () => {
      try {
        const manager = getWebSocketManager();
        if (manager) {
          const conn = await manager.connect('notifications');
          conn.on('vitals_update', (data) => {
            if (data.patient_id === patientId) {
              queryClient.invalidateQueries({ queryKey: ['patient-details', patientId] });
              toast.info(`Vitals updated for ${patient?.full_name || 'patient'}`);
            }
          });
          conn.on('lab_update', (data) => {
            if (data.patient_id === patientId) {
              queryClient.invalidateQueries({ queryKey: ['patient-details', patientId] });
              toast.success(`New lab results available`);
            }
          });
        }
      } catch (err) {
        console.error("Failed to setup real-time patient updates:", err);
      }
    };
    setupRealtime();
  }, [patientId, queryClient, patient?.full_name]);

  // Vital trends and appointments data (loaded dynamically with mock fallbacks)
  const vitalTrends = (patient && patient.vital_trends && patient.vital_trends.length > 0)
    ? patient.vital_trends
    : [
        { date: '2024-01', bp_systolic: 135, bp_diastolic: 85, weight: 67, hba1c: 7.5 },
        { date: '2024-02', bp_systolic: 138, bp_diastolic: 88, weight: 66, hba1c: 7.3 },
        { date: '2024-03', bp_systolic: 142, bp_diastolic: 92, weight: 65, hba1c: 7.2 },
        { date: '2024-04', bp_systolic: 140, bp_diastolic: 90, weight: 65, hba1c: 7.2 },
        { date: '2024-05', bp_systolic: 138, bp_diastolic: 88, weight: 64, hba1c: 7.1 }
      ];

  const recentAppointments = (patient && patient.recent_appointments && patient.recent_appointments.length > 0)
    ? patient.recent_appointments
    : [
        { date: '2024-05-01', type: 'Follow-up', diagnosis: 'Diabetes Management', status: 'completed' },
        { date: '2024-04-15', type: 'Consultation', diagnosis: 'Hypertension Review', status: 'completed' },
        { date: '2024-03-20', type: 'Lab Review', diagnosis: 'Routine Check-up', status: 'completed' }
      ];

  if (isLoading) {
    return <HeartbeatLoader text="Retrieving Patient File..." />;
  }

  if (!patient) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-900 dark:text-white flex items-center justify-center">
        <div className="max-w-md w-full text-center py-12 px-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Patient Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">The patient you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate('/doctor/patients')} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();

  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-rose-500/10 text-rose-700 dark:text-rose-450 border border-rose-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-700 dark:text-amber-450 border border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 border border-emerald-500/20';
    }
  };

  return (
    <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-900 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/doctor/patients')}
              className="p-2 hover:bg-white/20 dark:hover:bg-slate-800/30 border border-transparent hover:border-slate-200/50 dark:hover:border-white/10 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Patient Details</h1>
              <div className="flex items-center gap-3 flex-wrap mt-0.5">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Comprehensive patient information and medical history</p>
                {collaborators.length > 0 && (
                  <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                    <div className="flex -space-x-1 overflow-hidden">
                      {collaborators.map((c, i) => (
                        <div
                          key={i}
                          className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-950 bg-sky-500 text-white flex items-center justify-center"
                          title={`${c.name} is viewing`}
                        >
                          <span className="text-[8px] font-bold uppercase">{c.name?.[0]}</span>
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 animate-pulse">
                      {collaborators.length} other{collaborators.length > 1 ? 's' : ''} viewing
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/doctor/patients/${patientId}/timeline`)}
              className="bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-xl transition-all duration-300"
            >
              <Eye className="w-4 h-4 mr-2" />
              Timeline
            </Button>
            <Button
              onClick={() => navigate(`/doctor/consultation/new?patientId=${patientId}`)}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Video className="w-4 h-4 mr-2" />
              Start Consultation
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Patient Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden sticky top-28">
              <CardHeader className="text-center pb-4 pt-6">
                <div className="flex justify-center mb-4">
                  <Avatar className="w-24 h-24 ring-4 ring-sky-500/20 dark:ring-sky-600/30">
                    <AvatarImage src={patient.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-600 text-white text-2xl font-bold">
                      {patient.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{patient.full_name}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{age} years • {patient.gender}</p>
                  <Badge className={`mt-2 font-semibold px-2.5 py-0.5 text-xs rounded-full uppercase ${getRiskStyles(patient.risk_level)}`}>
                    {patient.risk_level} RISK
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/5 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">MRN Number</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{patient.mrn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/5 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Email Address</p>
                      <p className="font-semibold text-slate-850 dark:text-slate-200 truncate">{patient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/5 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Phone Number</p>
                      <p className="font-semibold text-slate-850 dark:text-slate-200">{patient.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/5 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Home Address</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{patient.address}</p>
                    </div>
                  </div>
                </div>

                <Separator className="border-slate-200/50 dark:border-white/10" />

                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Patient Adherence & Activity</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3.5 bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5 rounded-xl">
                      <p className="text-2xl font-black text-sky-500">{patient.appointments_count}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Total Visits</p>
                    </div>
                    <div className="text-center p-3.5 bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5 rounded-xl">
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{patient.adherence_score}%</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Adherence</p>
                    </div>
                  </div>
                </div>

                <Separator className="border-slate-200/50 dark:border-white/10" />

                <div className="flex gap-2 pb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-800/50 hover:text-sky-500 dark:hover:text-sky-400 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-800/50 hover:text-emerald-500 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
                  >
                    <Phone className="w-4 h-4 mr-1.5" />
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="lg:col-span-2 space-y-6"
          >

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/40 dark:bg-slate-900/40 border border-gray-200/50 dark:border-white/5 p-1 rounded-2xl backdrop-blur-md shadow-lg">
                <TabsTrigger value="overview" className="rounded-xl transition-all">Overview</TabsTrigger>
                <TabsTrigger value="vitals" className="rounded-xl transition-all">Vitals</TabsTrigger>
                <TabsTrigger value="medications" className="rounded-xl transition-all">Medications</TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl transition-all">History</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 focus-visible:outline-none focus-visible:ring-0 mt-6">

                {/* Current Vitals */}
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                  <CardHeader className="pb-3 border-b border-slate-200/50 dark:border-white/10 px-6 py-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-sky-500" />
                      Current Vitals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-950/20 border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-sm">
                        <Heart className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                        <p className="text-lg font-black text-slate-950 dark:text-white tracking-tight">{patient.recent_vitals.blood_pressure}</p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Blood Pressure</p>
                      </div>
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-955/20 border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-sm">
                        <Zap className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-lg font-black text-slate-950 dark:text-white tracking-tight">{patient.recent_vitals.heart_rate}</p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Heart Rate (bpm)</p>
                      </div>
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-955/20 border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-sm">
                        <Thermometer className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                        <p className="text-lg font-black text-slate-950 dark:text-white tracking-tight">{patient.recent_vitals.temperature}°F</p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Temperature</p>
                      </div>
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-955/20 border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-sm">
                        <Activity className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <p className="text-lg font-black text-slate-955 dark:text-white tracking-tight">{patient.recent_vitals.bmi}</p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">BMI</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Alerts & Conditions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Allergies & Conditions */}
                  <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                    <CardHeader className="pb-3 border-b border-slate-200/50 dark:border-white/10 px-6 py-4">
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                        Allergies & Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Allergies</h4>
                        <div className="flex flex-wrap gap-2">
                          {patient.allergies.length > 0 ? patient.allergies.map((allergy, index) => (
                            <Badge key={index} variant="destructive" className="bg-rose-500/10 text-rose-755 dark:text-rose-400 border border-rose-500/20 font-semibold px-2 py-0.5 rounded-md">
                              {allergy}
                            </Badge>
                          )) : (
                            <span className="text-xs text-slate-450 font-medium">No recorded allergies</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Chronic Conditions</h4>
                        <div className="flex flex-wrap gap-2">
                          {patient.chronic_conditions.length > 0 ? patient.chronic_conditions.map((condition, index) => (
                            <Badge key={index} variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold px-2 py-0.5 rounded-md">
                              {condition}
                            </Badge>
                          )) : (
                            <span className="text-xs text-slate-450 font-medium">No chronic conditions</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Lab Results */}
                  <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                    <CardHeader className="pb-3 border-b border-slate-200/50 dark:border-white/10 px-6 py-4">
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TestTube className="w-5 h-5 text-purple-500" />
                        Recent Lab Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {patient.lab_results.length > 0 ? patient.lab_results.map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-3.5 bg-white/40 dark:bg-slate-950/20 border border-slate-200/50 dark:border-white/5 rounded-xl shadow-sm">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{result.test}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{result.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-900 dark:text-white text-sm">{result.value}</p>
                              <Badge
                                variant={result.status === 'normal' ? 'default' : 'destructive'}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${
                                  result.status === 'normal'
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-455 border-rose-500/20'
                                }`}
                              >
                                {result.status}
                              </Badge>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-4 text-slate-500 text-sm">No recent lab results</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Appointments */}
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                  <CardHeader className="pb-3 border-b border-slate-200/50 dark:border-white/10 px-6 py-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-sky-500" />
                      Recent Appointments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3.5">
                      {recentAppointments.map((appointment, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200/50 dark:border-white/10 rounded-xl hover:bg-white/40 dark:hover:bg-slate-950/20 transition-all duration-300 gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shadow-inner shrink-0">
                              <Stethoscope className="w-5 h-5 text-sky-500" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{appointment.type}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{appointment.diagnosis}</p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">{appointment.date}</p>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold px-2 py-0.5 rounded-full capitalize text-[10px]">
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Vitals Tab */}
              <TabsContent value="vitals" className="space-y-6 focus-visible:outline-none focus-visible:ring-0 mt-6">
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                  <CardHeader className="pb-3 border-b border-slate-200/50 dark:border-white/10 px-6 py-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Vital Signs Trends</CardTitle>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track patient's vital signs over time</p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-[320px] w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} stroke="currentColor" strokeOpacity={0.5} style={{ fontSize: 11 }} />
                          <YAxis axisLine={false} tickLine={false} stroke="currentColor" strokeOpacity={0.5} style={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                          <Line type="monotone" dataKey="bp_systolic" stroke="#F43F5E" strokeWidth={3} name="Systolic BP" activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="weight" stroke="#0EA5E9" strokeWidth={3} name="Weight (kg)" activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="hba1c" stroke="#A855F7" strokeWidth={3} name="HbA1c (%)" activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Medications Tab */}
              <TabsContent value="medications" className="space-y-6 focus-visible:outline-none focus-visible:ring-0 mt-6">
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                  <CardHeader className="pb-3 border-b border-slate-200/50 dark:border-white/10 px-6 py-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Pill className="w-5 h-5 text-emerald-500" />
                      Current Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {patient.current_medications.length > 0 ? patient.current_medications.map((medication, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-slate-200/50 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-slate-950/20 hover:bg-white/70 dark:hover:bg-slate-950/40 transition-colors duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner shrink-0">
                              <Pill className="w-5 h-5 text-emerald-600 dark:text-emerald-450" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{medication.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{medication.dosage} • {medication.frequency}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-350 hover:bg-white/80 dark:hover:bg-slate-800/50">
                            <Edit className="w-3.5 h-3.5 mr-1.5" />
                            Edit
                          </Button>
                        </div>
                      )) : (
                        <div className="text-center py-12">
                          <Pill className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Active Medications</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-450 max-w-xs mx-auto">This patient does not currently have any active medications logged in the system.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6 focus-visible:outline-none focus-visible:ring-0 mt-6">
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
                  <CardHeader className="pb-3 border-b border-slate-200/50 dark:border-white/10 px-6 py-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-500" />
                      Medical History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center py-12 px-4 bg-white/40 dark:bg-slate-950/20 border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-sm">
                      <FileText className="w-12 h-12 text-purple-500/20 dark:text-purple-400/20 mx-auto mb-4" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">View Longitudinal History</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                        Access vital sheets, previous visit reports, clinical notes, and physical therapy logs in a unified longitudinal chart.
                      </p>
                      <Button
                        onClick={() => navigate(`/doctor/patients/${patientId}/history`)}
                        className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20"
                      >
                        View Full History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
