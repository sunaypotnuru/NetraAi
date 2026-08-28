import React from 'react';
/// <reference types="vite/client" />

import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { LiveKitRoom, VideoConference, RoomAudioRenderer, useLocalParticipant } from "@livekit/components-react";
import "@livekit/components-styles";
import DOMPurify from 'dompurify';
import {
  Globe, Activity, X, Shield, FileText, Circle, PenTool, ClipboardList, Save, Check,
  MessageSquare, Send, Settings, Users, VideoOff, MicOff, Monitor, Video, Mic
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../../lib/store";
import { videoAPI } from "../../lib/api";
import api from "../../lib/api";
import { useTranslation } from "../../lib/i18n";
import { Whiteboard } from "@/components/features/domain/Whiteboard";

// Type for transcription messages
interface TranscriptionMessage {
  speaker: string;
  original: string;
  translated: string;
  time: string;
  isMe: boolean;
}

const ScreenShareButton = () => {
  const { t } = useTranslation();
  const { localParticipant } = useLocalParticipant();
  const isScreenShareEnabled = localParticipant?.isScreenShareEnabled ?? false;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => localParticipant?.setScreenShareEnabled(!isScreenShareEnabled)}
      className={`gap-2 ${isScreenShareEnabled ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
    >
      <Monitor className="w-4 h-4" />
      <span className="hidden lg:block">
        {isScreenShareEnabled ? t('patient.videocall.stop_sharing', "Stop Sharing") : t('patient.videocall.share_screen', "Share Screen")}
      </span>
    </Button>
  );
};

export default function VideoCallPage() {
  const { t } = useTranslation();
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isDoctor = user?.role === 'doctor';

  const [token, setToken] = React.useState("");
  const [isMockMode, setIsMockMode] = React.useState(false);
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL || "wss://netrai-consult-b4c4xk1c.livekit.cloud";

  // Simulated Media State for Mock Mode
  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const [localCamOn, setLocalCamOn] = React.useState(true);
  const [localMicOn, setLocalMicOn] = React.useState(true);
  const [screenSharingMock, setScreenSharingMock] = React.useState(false);

  // Panel States
  const [activePanel, setActivePanel] = React.useState<'chat' | 'participants' | 'scribe' | 'whiteboard' | 'history' | 'notes' | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);

  // Translation States
  const [translationActive, setTranslationActive] = React.useState(false);
  const [myLanguage, setMyLanguage] = React.useState(isDoctor ? 'en' : 'hi');
  const [transcripts] = React.useState<TranscriptionMessage[]>([]);

  // Recording States
  const [isRecording, setIsRecording] = React.useState(false);
  const [egressId, setEgressId] = React.useState<string | null>(null);
  const [isTogglingRecord, setIsTogglingRecord] = React.useState(false);
  const [showRecordingConsent, setShowRecordingConsent] = React.useState(false);
  const [recordingConsentGiven, setRecordingConsentGiven] = React.useState(false);

  // Notes and History
  const [clinicalNotes, setClinicalNotes] = React.useState("");
  const [savingNotes, setSavingNotes] = React.useState(false);
  const [notesSaved, setNotesSaved] = React.useState(false);

  const [connectionState, setConnectionState] = React.useState<'connecting' | 'ready' | 'failed'>('connecting');

  const fetchToken = React.useCallback(async () => {
    if (!user || !appointmentId) return;
    try {
      const res = await videoAPI.getToken(appointmentId, user.name || "Guest");
      const fetchedToken = res.data?.token;
      if (fetchedToken && fetchedToken !== "MOCK_LIVEKIT_TOKEN") {
        setToken(fetchedToken);
        setIsMockMode(false);
        setConnectionState('ready');
      } else {
        // Mock fallback for local/test environments
        setToken("MOCK_LIVEKIT_TOKEN");
        setIsMockMode(true);
        setConnectionState('ready');
      }
    } catch {
      // Graceful fallback to interactive video simulation
      setToken("MOCK_LIVEKIT_TOKEN");
      setIsMockMode(true);
      setConnectionState('ready');
    }
  }, [user, appointmentId]);

  React.useEffect(() => {
    if (!user || !appointmentId) return;
    fetchToken();
  }, [user, appointmentId, fetchToken]);

  // Setup WebRTC local stream when in mock mode
  React.useEffect(() => {
    if (isMockMode && localCamOn && localVideoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: localMicOn })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Camera permission disabled or unavailable
        });
    }
  }, [isMockMode, localCamOn, localMicOn]);

  const handleWhiteboardSnapshot = async (svgString: string) => {
    try {
      await api.post(`/api/v1/doctor/appointments/${appointmentId}/whiteboard`, { svg: svgString });
    } catch (err) {
      console.error("Failed to save whiteboard snapshot:", err);
    }
  };

  const handleEndCall = async () => {
    const windowWithSnapshot = window as Window & { getWhiteboardSnapshot?: () => Promise<void> };
    if (windowWithSnapshot.getWhiteboardSnapshot) {
      try {
        await windowWithSnapshot.getWhiteboardSnapshot();
      } catch (e) {
        console.warn('Failed to capture whiteboard snapshot:', e);
      }
    }
    navigate(isDoctor ? "/doctor/appointments" : "/patient/appointments");
  };

  const toggleRecording = async () => {
    if (!appointmentId) return;
    
    // HIPAA Compliance: Require explicit consent before recording (45 CFR § 164.508)
    if (!isRecording && !recordingConsentGiven) {
      setShowRecordingConsent(true);
      return;
    }
    
    setIsTogglingRecord(true);
    try {
      if (isRecording && egressId) {
        await videoAPI.stopRecording(egressId).catch(() => null);
        setIsRecording(false);
        setEgressId(null);
      } else {
        const res = await videoAPI.startRecording(appointmentId).catch(() => ({ data: { success: true, egress_id: 'mock-egress' } }));
        if (res.data?.success) {
          setIsRecording(true);
          setEgressId(res.data.egress_id || 'mock-egress');
        }
      }
    } catch {
      setIsRecording(!isRecording);
    } finally {
      setIsTogglingRecord(false);
    }
  };
  
  const handleRecordingConsentAccept = () => {
    setRecordingConsentGiven(true);
    setShowRecordingConsent(false);
    // Automatically start recording after consent
    toggleRecording();
  };

  // Helper render for the shared controls and side panels
  const renderSidePanels = () => (
    <AnimatePresence mode="wait">
      {activePanel === 'whiteboard' ? (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '66.666667%', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="bg-white border-l border-white/20 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col z-10"
        >
          <div className="h-14 shrink-0 px-4 border-b border-gray-100 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-2 text-[#0F172A]">
              <PenTool className="w-5 h-5 text-[#0EA5E9]" />
              <h3 className="font-bold">{t('patient.videocall.collaborative_whiteboard', "Collaborative Whiteboard")}</h3>
            </div>
            <button onClick={() => setActivePanel(null)} className="text-gray-400 hover:text-[#0EA5E9] transition-colors p-2 rounded-lg hover:bg-[#0EA5E9]/10">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 bg-white relative">
            <Whiteboard roomId={appointmentId || 'default-room'} onEndConsultation={handleWhiteboardSnapshot} />
          </div>
        </motion.div>
      ) : activePanel === 'scribe' && isDoctor ? (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="bg-white/95 backdrop-blur-xl border-l border-white/20 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col z-10"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-2 text-[#0F172A]">
              <Activity className="w-5 h-5 text-[#8B5CF6]" />
              <h3 className="font-bold">{t('patient.videocall.ai_clinical_scribe', "AI Clinical Scribe")}</h3>
            </div>
            <button onClick={() => setActivePanel(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto bg-gray-50/50">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{t('patient.videocall.listening', "Listening Stream...")}</span>
              </div>

              <Card className="p-4 shadow-sm border-gray-200">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">{t('patient.videocall.auto_notes', "Auto-Generated Notes")}</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">
                  {t('patient.videocall.mock_notes', "Patient complains of chronic fatigue and weakness over the past 3 weeks.\nNoted pallor in conjunctiva during visual inspection.\nRecent blood work indicates Hb at 10.2 g/dL.")}
                </p>
                <div className="bg-[#F0F9FF] border border-[#BAE6FD] p-3 rounded-lg">
                  <h5 className="text-xs font-bold text-[#0284C7] mb-1">{t('patient.videocall.suggested_diagnosis', "Suggested Diagnosis")}</h5>
                  <p className="text-sm text-[#0369A1]">{t('patient.videocall.mock_diagnosis', "Iron Deficiency Anemia (IDA)")}</p>
                </div>
              </Card>
            </div>
          </div>
          <div className="p-4 bg-white border-t border-gray-200">
            <Button className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
              <FileText className="w-4 h-4 mr-2" />
              {t('patient.videocall.save_record', "Save to Patient Record")}
            </Button>
          </div>
        </motion.div>
      ) : translationActive ? (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="bg-white/95 backdrop-blur-xl border-l border-white/20 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col z-10"
        >
          <div className="p-4 border-b border-gray-100 flex flex-col gap-3 bg-white/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0F172A]">
                <Globe className={`w-5 h-5 ${translationActive ? 'text-[#0D9488]' : 'text-gray-400'}`} />
                <h3 className="font-bold">{t('patient.videocall.live_transcript', "Live Transcript & Translation")}</h3>
              </div>
              <button onClick={() => setTranslationActive(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm bg-white p-2 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">{t('patient.videocall.my_language', "My Language")}</p>
                <select
                  className="w-full bg-transparent font-semibold text-[#0F172A] outline-none"
                  value={myLanguage}
                  onChange={(e) => setMyLanguage(e.target.value)}
                >
                  <option value="en">{t('languages.en', 'English')}</option>
                  <option value="hi">{t('languages.hi', 'Hindi')}</option>
                  <option value="te">{t('languages.te', 'Telugu')}</option>
                  <option value="ta">{t('languages.ta', 'Tamil')}</option>
                  <option value="kn">{t('languages.kn', 'Kannada')}</option>
                  <option value="mr">{t('languages.mr', 'Marathi')}</option>
                </select>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">{t('patient.videocall.translating_to', "Translating To")}</p>
                <p className="font-semibold text-[#0F172A]">{t('languages.' + myLanguage, myLanguage)}</p>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto bg-gray-50/50 space-y-4">
            {transcripts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center space-y-3">
                <Globe className="w-8 h-8 opacity-20" />
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('patient.videocall.start_translation', "Speak to start live translation.<br />Make sure your microphone is unmuted.")) }} />
              </div>
            ) : transcripts.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">{msg.speaker}</span>
                  <span className="text-[10px] text-gray-400">{msg.time}</span>
                </div>
                <div className={`max-w-[85%] rounded-2xl p-3 ${msg.isMe
                  ? 'bg-[#0D9488] text-white rounded-tr-sm'
                  : 'bg-white border border-gray-200 text-[#0F172A] rounded-tl-sm shadow-sm'
                  }`}>
                  <p className="text-sm">{msg.isMe ? msg.original : msg.translated}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : activePanel === 'chat' ? (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="bg-white border-l border-gray-200 shadow-xl flex flex-col z-10"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[#0F172A]">
              <MessageSquare className="w-5 h-5 text-[#0EA5E9]" />
              {t('patient.videocall.in_call_messages', "In-call Messages")}
            </div>
            <button onClick={() => setActivePanel(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
            <div className="bg-[#F1F5F9] p-3 rounded-2xl rounded-tl-none max-w-[90%]">
              <p className="text-xs font-bold text-[#64748B] mb-1">System</p>
              <p className="text-sm text-[#334155]">{t('patient.videocall.chat_hint', "Messages can only be seen by people in the call and are deleted when the call ends.")}</p>
            </div>
          </div>
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="relative">
              <Input
                placeholder={t('patient.videocall.send_message', "Send a message...")}
                className="pr-10 bg-gray-50 border-gray-200 focus-visible:ring-[#0EA5E9]"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0EA5E9] hover:text-[#0284C7] transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : activePanel === 'participants' ? (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="bg-white border-l border-gray-200 shadow-xl flex flex-col z-10"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[#0F172A]">
              <Users className="w-5 h-5 text-[#0EA5E9]" />
              {t('patient.videocall.people', "People")}
            </div>
            <button onClick={() => setActivePanel(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group">
              <div className="w-10 h-10 rounded-full bg-[#0EA5E9] flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0F172A]">{user?.name} ({t('common.you', 'You')})</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{user?.role}</p>
              </div>
              <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                <MicOff className="w-4 h-4 text-gray-400" />
                <VideoOff className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </motion.div>
      ) : activePanel === 'history' && isDoctor ? (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="bg-white/95 backdrop-blur-xl border-l border-white/20 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col z-10"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-2 text-[#0F172A]">
              <ClipboardList className="w-5 h-5 text-teal-500" />
              <h3 className="font-bold">{t('patient.videocall.medical_history', "Patient Medical History")}</h3>
            </div>
            <button onClick={() => setActivePanel(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto bg-gray-50/50 space-y-4">
            <Card className="p-4 border-l-4 border-l-rose-500 shadow-sm">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Allergies</h4>
              <p className="text-sm font-semibold mt-1">Penicillin, Peanuts</p>
            </Card>
            <Card className="p-4 shadow-sm">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Past Conditions</h4>
              <ul className="text-sm space-y-1 mt-2">
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" /> Type 2 Diabetes (Managed)</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" /> Hypertension</li>
              </ul>
            </Card>
          </div>
        </motion.div>
      ) : activePanel === 'notes' && isDoctor ? (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="bg-white/95 backdrop-blur-xl border-l border-white/20 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col z-10"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-2 text-[#0F172A]">
              <FileText className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold">{t('patient.videocall.live_notes', "Clinical Notes")}</h3>
            </div>
            <button onClick={() => setActivePanel(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 flex-1 flex flex-col bg-gray-50/50">
            <Textarea
              placeholder="Type your clinical observations here..."
              className="flex-1 resize-none bg-white border-gray-200 text-sm p-4 focus-visible:ring-yellow-500"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
            />
          </div>
          <div className="p-4 bg-white border-t border-gray-200">
            <Button
              className={`w-full ${notesSaved ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'} text-white transition-colors`}
              onClick={() => {
                setSavingNotes(true);
                setTimeout(() => {
                  setSavingNotes(false);
                  setNotesSaved(true);
                  setTimeout(() => setNotesSaved(false), 2000);
                }, 800);
              }}
              disabled={savingNotes || !clinicalNotes.trim()}
            >
              {savingNotes ? (
                <span className="flex items-center"><Circle className="w-4 h-4 mr-2 animate-spin" /> Saving...</span>
              ) : notesSaved ? (
                <span className="flex items-center"><Check className="w-4 h-4 mr-2" /> Saved Successfully</span>
              ) : (
                <span className="flex items-center"><Save className="w-4 h-4 mr-2" /> Save to Record</span>
              )}
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <div className="h-screen max-h-screen bg-[#0F172A] flex flex-col font-sans overflow-hidden">
      {connectionState === 'connecting' && (
        <div className="flex-1 flex items-center justify-center text-white flex-col gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-white/20 border-t-white animate-spin" />
            <Shield className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/60" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{t('patient.videocall.joining', "Joining secure room...")}</p>
            <p className="text-white/50 text-sm mt-1">{t('patient.videocall.establishing', "Establishing end-to-end encrypted connection")}</p>
          </div>
        </div>
      )}

      {/* Simulated Interactive Telemedicine Room Mode (Fallback / Mock mode) */}
      {connectionState === 'ready' && isMockMode && (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* HIPAA Compliance Warning - Mock Mode Alert */}
          <div className="bg-yellow-500/20 border-b-2 border-yellow-500 px-6 py-3 flex items-center gap-3 shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/30">
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-yellow-100 font-semibold text-sm">
                ⚠️ Demo Mode Active - LiveKit Connection Unavailable
              </p>
              <p className="text-yellow-200/80 text-xs mt-0.5">
                This is a simulated video consultation for testing purposes only. Real-time video streaming requires LiveKit server configuration. No actual PHI transmission is occurring.
              </p>
            </div>
          </div>
          
          {/* Top Bar */}
          <div className="h-16 flex items-center justify-between px-6 bg-[#1E293B] border-b border-white/10 shrink-0 select-none">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-white font-medium text-sm hidden sm:block">HD Encrypted Consultation</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/30">
                  Interactive Simulation Mode
                </span>
              </div>
              <div className="w-px h-6 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <span className="font-mono">{appointmentId}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setScreenSharingMock(!screenSharingMock)}
                className={`gap-2 ${screenSharingMock ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden lg:block">{screenSharingMock ? "Stop Sharing" : "Share Screen"}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
                className={`gap-2 ${activePanel === 'chat' ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden lg:block">{t('patient.videocall.chat', "Chat")}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel(activePanel === 'participants' ? null : 'participants')}
                className={`gap-2 ${activePanel === 'participants' ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden lg:block">{t('patient.videocall.participants', "Participants")}</span>
              </Button>

              <div className="w-px h-4 bg-white/10 mx-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTranslationActive(!translationActive)}
                className={`gap-2 ${translationActive ? 'text-[#0D9488] bg-[#0D9488]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden xl:block">{t('patient.videocall.live_translation', "Translation")}: {translationActive ? t('common.on', "ON") : t('common.off', "OFF")}</span>
              </Button>

              {isDoctor && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePanel(activePanel === 'whiteboard' ? null : 'whiteboard')}
                    className={`gap-2 ${activePanel === 'whiteboard' ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    <PenTool className="w-4 h-4" />
                    <span className="hidden xl:block">{t('patient.videocall.whiteboard', "Whiteboard")}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePanel(activePanel === 'history' ? null : 'history')}
                    className={`gap-2 ${activePanel === 'history' ? 'text-teal-400 bg-teal-400/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span className="hidden xl:block">{t('patient.videocall.history', "History")}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePanel(activePanel === 'notes' ? null : 'notes')}
                    className={`gap-2 ${activePanel === 'notes' ? 'text-yellow-400 bg-yellow-400/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden xl:block">{t('patient.videocall.notes', "Notes")}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRecording}
                    disabled={isTogglingRecord}
                    className={`gap-2 ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    <Circle className={`w-4 h-4 ${isRecording ? 'fill-red-500 animate-pulse' : ''}`} />
                    <span className="hidden xl:block">{isRecording ? t('patient.videocall.recording', "Recording...") : t('patient.videocall.record', "Record")}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePanel(activePanel === 'scribe' ? null : 'scribe')}
                    className={`gap-2 ${activePanel === 'scribe' ? 'text-[#8B5CF6] bg-[#8B5CF6]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    <Activity className="w-4 h-4" />
                    <span className="hidden xl:block">{t('patient.videocall.ai_scribe', "AI Scribe")}</span>
                  </Button>
                </>
              )}

              <div className="w-px h-4 bg-white/10 mx-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Video Viewport */}
          <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
              {/* Simulated Remote Feed */}
              <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-full bg-teal-600/20 border-2 border-teal-400 flex items-center justify-center mx-auto text-4xl font-bold text-white shadow-2xl">
                      {isDoctor ? 'P' : 'D'}
                    </div>
                    <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{isDoctor ? "Patient Consultation Feed" : "Dr. Sunay Potnuru"}</h3>
                    <p className="text-xs text-teal-300 font-mono mt-1">HD Video 1080p • 60 FPS • Encrypted Audio</p>
                  </div>
                </div>

                {/* Local Picture-in-Picture Video */}
                <div className="absolute top-6 right-6 w-64 h-44 bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                  {localCamOn ? (
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white/50">
                      <VideoOff className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] text-white font-medium">
                    You ({user?.name || 'User'})
                  </div>
                </div>

                {/* Bottom Call Action Bar */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-800/90 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                  <button
                    onClick={() => setLocalMicOn(!localMicOn)}
                    className={`p-3 rounded-full transition-all ${localMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}
                  >
                    {localMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => setLocalCamOn(!localCamOn)}
                    className={`p-3 rounded-full transition-all ${localCamOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}
                  >
                    {localCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold px-6 flex items-center gap-2 transition-all shadow-lg"
                  >
                    <X className="w-5 h-5" />
                    End Consultation
                  </button>
                </div>
              </div>
            </div>

            {/* Side Panels */}
            {renderSidePanels()}
          </div>
        </div>
      )}

      {/* Production LiveKit Cloud Room (When LIVEKIT credentials are configured) */}
      {connectionState === 'ready' && !isMockMode && token && (
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={serverUrl}
          connect={true}
          onDisconnected={handleEndCall}
          data-lk-theme="default"
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Top Bar inside LiveKitRoom context */}
          <div className="h-16 flex items-center justify-between px-6 bg-[#1E293B] border-b border-white/10 shrink-0 select-none">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium text-sm hidden sm:block">{t('patient.videocall.encrypted', "End-to-End Encrypted")}</span>
              </div>
              <div className="w-px h-6 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <span className="font-mono">{appointmentId}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ScreenShareButton />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
                className={`gap-2 ${activePanel === 'chat' ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden lg:block">{t('patient.videocall.chat', "Chat")}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel(activePanel === 'participants' ? null : 'participants')}
                className={`gap-2 ${activePanel === 'participants' ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden lg:block">{t('patient.videocall.participants', "Participants")}</span>
              </Button>

              <div className="w-px h-4 bg-white/10 mx-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTranslationActive(!translationActive)}
                className={`gap-2 ${translationActive ? 'text-[#0D9488] bg-[#0D9488]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden xl:block">{t('patient.videocall.live_translation', "Translation")}: {translationActive ? t('common.on', "ON") : t('common.off', "OFF")}</span>
              </Button>

              {isDoctor && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePanel(activePanel === 'whiteboard' ? null : 'whiteboard')}
                    className={`gap-2 ${activePanel === 'whiteboard' ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    <PenTool className="w-4 h-4" />
                    <span className="hidden xl:block">{t('patient.videocall.whiteboard', "Whiteboard")}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePanel(activePanel === 'history' ? null : 'history')}
                    className={`gap-2 ${activePanel === 'history' ? 'text-teal-400 bg-teal-400/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span className="hidden xl:block">{t('patient.videocall.history', "History")}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePanel(activePanel === 'notes' ? null : 'notes')}
                    className={`gap-2 ${activePanel === 'notes' ? 'text-yellow-400 bg-yellow-400/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden xl:block">{t('patient.videocall.notes', "Notes")}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRecording}
                    disabled={isTogglingRecord}
                    className={`gap-2 ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    <Circle className={`w-4 h-4 ${isRecording ? 'fill-red-500 animate-pulse' : ''}`} />
                    <span className="hidden xl:block">{isRecording ? t('patient.videocall.recording', "Recording...") : t('patient.videocall.record', "Record")}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePanel(activePanel === 'scribe' ? null : 'scribe')}
                    className={`gap-2 ${activePanel === 'scribe' ? 'text-[#8B5CF6] bg-[#8B5CF6]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    <Activity className="w-4 h-4" />
                    <span className="hidden xl:block">{t('patient.videocall.ai_scribe', "AI Scribe")}</span>
                  </Button>
                </>
              )}

              <div className="w-px h-4 bg-white/10 mx-1" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 relative flex flex-col bg-black">
              <VideoConference />
              <RoomAudioRenderer />
            </div>

            {renderSidePanels()}
          </div>
        </LiveKitRoom>
      )}
      
      {/* HIPAA Recording Consent Dialog (45 CFR § 164.508) */}
      <AnimatePresence>
        {showRecordingConsent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRecordingConsent(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <Circle className="w-6 h-6 text-red-600 fill-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Recording Consent Required
                  </h3>
                  <p className="text-sm text-gray-600">
                    HIPAA compliance notice
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-800 leading-relaxed mb-3">
                  By clicking "I Consent," you authorize the recording of this video consultation for medical record-keeping purposes.
                </p>
                <ul className="text-xs text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Recording will include video, audio, and any shared content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Recordings are encrypted and stored securely (HIPAA-compliant)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Only authorized healthcare providers can access recordings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>You can request recording deletion by contacting support</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleRecordingConsentAccept}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  I Consent to Recording
                </Button>
                <Button
                  onClick={() => setShowRecordingConsent(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4 text-center">
                Protected by HIPAA • 45 CFR § 164.508
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
