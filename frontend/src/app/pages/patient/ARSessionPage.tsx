import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Camera } from "@mediapipe/camera_utils";
import { Pose, POSE_CONNECTIONS, Results } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Clock, Save, ArrowLeft, Play, Square, Loader2, Camera as CameraIcon, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTranslation } from "react-i18next";
import { useRepDetection } from "../../hooks/useRepDetection";

interface ExerciseAssignment {
  id: string;
  prescribed_reps?: number;
  prescribed_sets?: number;
  exercises?: {
    type?: string;
    name?: string;
    description?: string;
    target_reps?: number;
    duration_minutes?: number;
    duration_seconds?: number;
    target_joints?: string[];
    target_pose?: Record<string, number>;
  };
}

type PlayState = 'idle' | 'initializing' | 'running' | 'completed';

export default function ARSessionPage() {
  const { t } = useTranslation();
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera | null>(null);
  const poseRef = useRef<Pose | null>(null);

  const [state, setState] = useState<PlayState>('idle');
  const [sets] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [accuracy, setAccuracy] = useState(100);
  const [currentAngles, setCurrentAngles] = useState<Record<string, number> | null>(null);
  const [jointAccuracy, setJointAccuracy] = useState<Record<string, number>>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Assignment details
  const { data: assignments = [] } = useQuery<ExerciseAssignment[]>({
    queryKey: ["myExercises"],
    queryFn: async () => {
      const res = await api.get("/api/v1/exercises/my-exercises");
      return res.data;
    }
  });

  const assignment = (assignments || []).find((a: ExerciseAssignment) => a.id === assignmentId);
  const exercise = assignment?.exercises;

  // Use the rep detection hook
  const { repCount, repState, reset: resetReps } = useRepDetection(
    (exercise?.type === 'shoulder_press' ? 'shoulder_raises' : exercise?.type || 'bicep_curls') as 'bicep_curls' | 'squats' | 'shoulder_raises',
    currentAngles
  );

  const saveMutation = useMutation({
    mutationFn: (payload: {
      patient_exercise_id: string;
      reps_completed: number;
      sets_completed: number;
      duration_seconds: number;
      accuracy_percent: number;
      pain_level: number;
      notes: string;
      joint_data: Record<string, number>;
    }) => api.post("/api/v1/exercises/sessions", payload),
    onSuccess: () => {
      toast.success("Session saved successfully!");
      navigate("/patient/exercises");
    },
    onError: () => toast.error("Failed to save session.")
  });

  // Helper function to calculate angle between three points
  const calculateAngle = useCallback((a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  }, []);

  // Calculate all joint angles from landmarks
  const calculateJointAngles = useCallback((landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>) => {
    return {
      leftElbow: calculateAngle(landmarks[11], landmarks[13], landmarks[15]),
      rightElbow: calculateAngle(landmarks[12], landmarks[14], landmarks[16]),
      leftKnee: calculateAngle(landmarks[23], landmarks[25], landmarks[27]),
      rightKnee: calculateAngle(landmarks[24], landmarks[26], landmarks[28]),
      leftShoulder: calculateAngle(landmarks[13], landmarks[11], landmarks[23]),
      rightShoulder: calculateAngle(landmarks[14], landmarks[12], landmarks[24]),
      leftHip: calculateAngle(landmarks[11], landmarks[23], landmarks[25]),
      rightHip: calculateAngle(landmarks[12], landmarks[24], landmarks[26]),
    };
  }, [calculateAngle]);

  // Compare current angles with target pose
  const compareWithTarget = useCallback((current: Record<string, number>, target: Record<string, number>, tolerance: number = 15) => {
    if (!target) return { overall: 100, joints: {} };

    const scores: Record<string, number> = {};
    Object.keys(target).forEach(joint => {
      if (current[joint] !== undefined) {
        const diff = Math.abs(current[joint] - target[joint]);
        scores[joint] = diff <= tolerance ? 100 : Math.max(0, 100 - (diff - tolerance) * 2);
      }
    });

    const overall = Object.values(scores).length > 0
      ? Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
      : 100;

    return { overall, joints: scores };
  }, []);

  // MediaPipe pose detection callback
  const onResults = useCallback((results: Results) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvasCtx = canvasRef.current.getContext("2d");
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw Video
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw Pose
    if (results.poseLandmarks) {
      // Calculate joint angles
      const angles = calculateJointAngles(results.poseLandmarks);
      setCurrentAngles(angles);

      // Compare with target pose if available
      if (exercise?.target_pose) {
        const accuracyScores = compareWithTarget(angles, exercise.target_pose);
        setAccuracy(accuracyScores.overall);
        setJointAccuracy(accuracyScores.joints);
      }

      // Draw connections with color based on accuracy
      const connectionColor = accuracy > 85 ? "#10B981" : accuracy > 60 ? "#F59E0B" : "#EF4444";
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: connectionColor, lineWidth: 4
      });

      // Draw landmarks
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: "#0EA5E9", lineWidth: 2, radius: 5
      });

      // Draw joint accuracy indicators
      if (exercise?.target_joints && jointAccuracy) {
        const jointLandmarks: Record<string, number> = {
          leftElbow: 13,
          rightElbow: 14,
          leftKnee: 25,
          rightKnee: 26,
          leftShoulder: 11,
          rightShoulder: 12,
        };

        exercise.target_joints.forEach((joint: string) => {
          const landmarkIndex = jointLandmarks[joint];
          if (landmarkIndex && results.poseLandmarks[landmarkIndex]) {
            const landmark = results.poseLandmarks[landmarkIndex];
            const x = landmark.x * canvasRef.current!.width;
            const y = landmark.y * canvasRef.current!.height;
            const score = jointAccuracy[joint] || 0;

            // Draw accuracy circle
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 15, 0, 2 * Math.PI);
            canvasCtx.fillStyle = score > 85 ? "#10B98180" : score > 60 ? "#F59E0B80" : "#EF444480";
            canvasCtx.fill();
            canvasCtx.strokeStyle = score > 85 ? "#10B981" : score > 60 ? "#F59E0B" : "#EF4444";
            canvasCtx.lineWidth = 3;
            canvasCtx.stroke();
          }
        });
      }
    }
    canvasCtx.restore();
  }, [exercise, accuracy, jointAccuracy, calculateJointAngles, compareWithTarget]);

  const initCamera = useCallback(() => {
    if (!videoRef.current) return;

    setState('initializing');

    const pose = new Pose({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    pose.onResults(onResults);
    poseRef.current = pose;

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await pose.send({ image: videoRef.current });
        }
      },
      width: 1280,
      height: 720
    });
    camera.start().then(() => {
      setState('running');
      if (exercise?.duration_seconds) setTimeLeft(exercise.duration_seconds);
      resetReps(); // Reset rep counter when starting
    });
    cameraRef.current = camera;

  }, [onResults, exercise, resetReps]);

  const stopCamera = useCallback(() => {
    setState('completed');
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    if (poseRef.current) {
      poseRef.current.close();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Timer effect
  useEffect(() => {
    if (state === 'running' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            stopCamera();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, timeLeft, stopCamera]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      if (poseRef.current) poseRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!assignment || !exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-sky-500 mx-auto" />
          <p className="text-sm font-medium">{t('patient.a_r_session_page.loading_or_invalid_assignment', "Loading session configurations...")}</p>
        </div>
      </div>
    );
  }

  const handleFinish = () => {
    saveMutation.mutate({
      patient_exercise_id: assignment?.id || '',
      reps_completed: repCount,
      sets_completed: sets,
      duration_seconds: (exercise?.duration_seconds || 0) - timeLeft,
      accuracy_percent: Math.round(accuracy),
      pain_level: 0,
      notes: "Completed via AR Session with enhanced pose tracking",
      joint_data: currentAngles || {}
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col md:flex-row overflow-hidden font-sans">

      {/* Sidebar HUD */}
      <div className="w-full md:w-80 bg-slate-950/90 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-900 flex flex-col p-6 text-white shrink-0 z-10 shadow-2xl">
        <button
          onClick={() => { stopCamera(); navigate(-1); }}
          className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors text-sm font-semibold group self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
          {t('patient.a_r_session_page.back_to_dashboard_1', "Cancel Session")}
        </button>

        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">{exercise.name}</h1>
        <p className="text-slate-400 text-xs leading-relaxed mb-8">{exercise.description}</p>

        <div className="flex-1 space-y-6">
          {/* Timer */}
          <div className="bg-white/5 dark:bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 dark:border-slate-800/30 shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs font-semibold flex items-center gap-1 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-sky-400"/>
                {t('patient.a_r_session_page.time_left_2', "Time Left")}
              </span>
              <span className="text-2xl font-mono font-bold text-white">00:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
            <Progress value={(timeLeft / (exercise.duration_seconds ?? 1)) * 100} className="h-1.5 bg-slate-800 indicator-white rounded-full overflow-hidden" />
          </div>

          {/* Reps/Sets */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 dark:bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 dark:border-slate-800/30 text-center shadow-xl">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-bold mb-1">{t('patient.a_r_session_page.reps_3', "Reps")}</span>
              <div className="flex items-baseline justify-center gap-0.5 mt-1">
                <span className="text-3xl font-black text-emerald-450">{repCount}</span>
                <span className="text-slate-500 text-xs font-semibold"> / {assignment.prescribed_reps}</span>
              </div>
              {repState === 'up' && (
                <div className="mt-2 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-lg animate-pulse inline-block">
                  ↑ {t('patient.a_r_session_page.up_position', "UP")}
                </div>
              )}
            </div>
            <div className="bg-white/5 dark:bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 dark:border-slate-800/30 text-center shadow-xl">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-bold mb-1">{t('patient.a_r_session_page.sets_4', "Sets")}</span>
              <div className="flex items-baseline justify-center gap-0.5 mt-1">
                <span className="text-3xl font-black text-sky-400">{sets}</span>
                <span className="text-slate-500 text-xs font-semibold"> / {assignment.prescribed_sets}</span>
              </div>
            </div>
          </div>

          {/* Accuracy */}
          <div className="bg-white/5 dark:bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 dark:border-slate-800/30 shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs font-semibold flex items-center gap-1 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-emerald-400" />
                {t('patient.a_r_session_page.form_accuracy_5', "Accuracy")}
              </span>
              <span className={`text-xl font-black ${accuracy > 85 ? 'text-emerald-450' : accuracy > 60 ? 'text-yellow-450' : 'text-rose-450'}`}>
                {Math.round(accuracy)}%
              </span>
            </div>
            <Progress value={accuracy} className="h-2 bg-slate-800 rounded-full" />
            <p className="text-[10px] text-slate-500 font-medium mt-2 text-center">Tracking {exercise.target_joints?.length || 0} joints via real-time computer vision</p>
          </div>
        </div>

        {/* Controls */}
        <div className="pt-6 mt-6 border-t border-slate-900 space-y-3">
          {state === 'idle' && (
            <Button
              onClick={initCamera}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/20 font-bold border-0"
            >
              <Play className="w-5 h-5 mr-2" />
              {t('patient.a_r_session_page.start_session_6', "Start Session")}
            </Button>
          )}
          {state === 'initializing' && (
            <Button disabled className="w-full bg-slate-900 text-slate-400 py-6 text-lg rounded-xl border border-slate-850">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t('patient.a_r_session_page.loading_ai_model_7', "Loading AI Models...")}
            </Button>
          )}
          {state === 'running' && (
            <Button
              onClick={stopCamera}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white py-6 text-lg rounded-xl shadow-lg shadow-rose-500/20 font-bold border-0"
            >
              <Square className="w-5 h-5 mr-2 fill-current" />
              {t('patient.a_r_session_page.stop_session_8', "Stop Session")}
            </Button>
          )}
          {state === 'completed' && (
            <Button
              onClick={handleFinish}
              disabled={saveMutation.isPending}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white py-6 text-lg rounded-xl shadow-lg shadow-sky-500/20 font-bold border-0"
            >
              <Save className="w-5 h-5 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Progress"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Camera Feed */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
        {state === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-slate-950/85 backdrop-blur-sm px-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 mb-6 shadow-inner animate-pulse">
              <CameraIcon className="w-10 h-10 text-sky-400" />
            </div>
            <h2 className="text-white text-2xl font-extrabold tracking-tight mb-2">
              {t('patient.a_r_session_page.camera_required_9', "Pose Tracking Camera")}
            </h2>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              {t('patient.a_r_session_page.please_position_your_device_10', "Please grant camera permissions and position your device so your joints and body are fully visible.")}
            </p>
          </div>
        )}

        <video ref={videoRef} className="hidden" playsInline />
        <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-contain" />

        {/* Success Overlay */}
        <AnimatePresence>
          {state === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 backdrop-blur-lg p-4"
            >
              <div className="bg-slate-900 border border-slate-800 text-center max-w-sm w-full mx-4 shadow-2xl rounded-3xl p-8 space-y-6">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-10 h-10 text-emerald-450" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{t('patient.a_r_session_page.session_complete_11', "Session Complete!")}</h3>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">Awesome job completing your workout assignation.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-950/50 rounded-2xl p-4 border border-slate-850">
                  <div className="text-center space-y-1">
                    <span className="block text-2xl font-black text-white">{repCount}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('patient.a_r_session_page.reps_12', "Reps")}</span>
                  </div>
                  <div className="text-center space-y-1">
                    <span className="block text-2xl font-black text-white">{Math.round(accuracy)}%</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('patient.a_r_session_page.accuracy_13', "Accuracy")}</span>
                  </div>
                </div>

                <Button
                  onClick={handleFinish}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-6 font-bold text-base shadow-lg shadow-emerald-500/20 border-0"
                >
                  {t('patient.a_r_session_page.save_return_14', "Save & Return")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
