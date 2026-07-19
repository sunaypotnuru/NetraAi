-- ============================================================
-- NETRA AI COMPLETE SCHEMA v3.2.0 — PART 02
-- Section : Clinical_AI_Analytics
-- Lines   : 1565-3167 in NETRA_COMPLETE_SCHEMA.sql
-- SAFE TO RE-RUN: All objects use DROP IF EXISTS guards
-- ============================================================

-- ---------------------------------------------------------------------

ALTER TABLE public.video_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiting_room ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_quality_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own video consultations" ON public.video_consultations;
CREATE POLICY "Users can view own video consultations"
  ON public.video_consultations FOR SELECT
  USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can manage own consultations" ON public.video_consultations;
CREATE POLICY "Doctors can manage own consultations"
  ON public.video_consultations FOR ALL
  USING (auth.uid() = doctor_id);

-- ---------------------------------------------------------------------
-- 2.13 Advanced Analytics and Reporting
-- ---------------------------------------------------------------------

-- Healthcare Analytics Dashboards
CREATE TABLE IF NOT EXISTS public.analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  dashboard_type VARCHAR(100), -- clinical, financial, operational, quality
  target_audience VARCHAR(100), -- doctors, administrators, patients, executives
  
  -- Configuration
  widgets JSONB NOT NULL, -- Array of widget configurations
  layout JSONB NOT NULL,
  filters JSONB DEFAULT '[]'::jsonb,
  refresh_interval_minutes INTEGER DEFAULT 60,
  
  -- access control
  is_public BOOLEAN DEFAULT FALSE,
  allowed_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  allowed_users UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Key Performance Indicators (KPIs)
CREATE TABLE IF NOT EXISTS public.healthcare_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_name VARCHAR(255) NOT NULL,
  kpi_category VARCHAR(100), -- clinical, financial, operational, patient_satisfaction
  description TEXT,
  
  -- Calculation
  calculation_method TEXT NOT NULL,
  data_sources JSONB,
  calculation_frequency VARCHAR(50), -- real_time, hourly, daily, weekly, monthly
  
  -- Target values
  target_value DECIMAL(15,6),
  warning_threshold DECIMAL(15,6),
  critical_threshold DECIMAL(15,6),
  
  -- Current metrics
  current_value DECIMAL(15,6),
  previous_value DECIMAL(15,6),
  trend_direction VARCHAR(20), -- improving, declining, stable
  
  -- Time series data
  last_calculated_at TIMESTAMPTZ,
  calculation_period_start TIMESTAMPTZ,
  calculation_period_end TIMESTAMPTZ,
  
  -- Metadata
  unit_of_measure VARCHAR(50),
  is_higher_better BOOLEAN DEFAULT TRUE,
  benchmark_source VARCHAR(255),
  
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical Decision Support Rules
CREATE TABLE IF NOT EXISTS public.clinical_decision_support_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(255) NOT NULL,
  rule_category VARCHAR(100), -- drug_interaction, allergy_alert, guideline_reminder
  description TEXT,
  
  -- Rule logic
  condition_logic JSONB NOT NULL, -- Complex condition definitions
  action_type VARCHAR(100), -- alert, recommendation, auto_order, block_action
  action_details JSONB,
  
  -- Triggering conditions
  trigger_events TEXT[], -- prescription_create, lab_result, diagnosis_add
  applicable_conditions TEXT[], -- ICD-10 codes
  applicable_medications TEXT[], -- Drug names or codes
  
  -- Severity and priority
  severity_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  priority INTEGER DEFAULT 5, -- 1-10 scale
  
  -- Evidence and references
  evidence_level VARCHAR(20), -- , B, C, D (evidence quality)
  clinical_references TEXT[],
  guideline_source VARCHAR(255),
  
  -- Usage tracking
  times_triggered INTEGER DEFAULT 0,
  times_accepted INTEGER DEFAULT 0,
  times_overridden INTEGER DEFAULT 0,
  
  -- Lifecycle
  effective_date DATE,
  expiration_date DATE,
  version VARCHAR(20) DEFAULT '1.0',
  
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences (used by i18n/preferences)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme VARCHAR(50) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translations Cache
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language VARCHAR(10) NOT NULL,
  key TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(language, key)
);

-- Unified Profiles View (used by legacy and message routes)
CREATE OR REPLACE VIEW public.profiles AS SELECT id, email, full_name, avatar_url, 'patient' as role FROM public.profiles_patient
UNION ALL
SELECT id, email, full_name, avatar_url, 'doctor' as role FROM public.profiles_doctor;

-- Mental Health Screenings
CREATE TABLE IF NOT EXISTS public.mental_health_screenings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  screening_type TEXT NOT NULL,
  score INTEGER,
  severity TEXT,
  responses JSONB,
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Voice Call Logs (Proactive Nurse agent)
CREATE TABLE IF NOT EXISTS public.voice_call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  call_sid TEXT,
  purpose TEXT,
  transcript TEXT,
  side_effects TEXT,
  alert_sent BOOLEAN DEFAULT FALSE,
  call_status TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  final_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vitals Log
CREATE TABLE IF NOT EXISTS public.vitals_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles_patient(id) ON DELETE CASCADE,
  tracker_type TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  unit TEXT,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.3 Communication & Notifications
-- ---------------------------------------------------------------------

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  channel TEXT CHECK (channel IN ('email', 'sms', 'both')),
  email_status TEXT DEFAULT 'pending',
  sms_status TEXT DEFAULT 'pending',
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification preferences (per user)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  appointment_reminders BOOLEAN DEFAULT TRUE,
  scan_results BOOLEAN DEFAULT TRUE,
  prescription_updates BOOLEAN DEFAULT TRUE,
  marketing BOOLEAN DEFAULT FALSE,
  newsletter BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages (chat between patient and doctor)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.4 Gamification & Engagement
-- ---------------------------------------------------------------------

-- Achievements (static definitions)
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  points INTEGER DEFAULT 0,
  category VARCHAR(50),
  requirement_type VARCHAR(50),
  requirement_value INTEGER,
  target_value INTEGER NOT NULL,
  role_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- User points & achievements (legacy table, but kept)
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE SET NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges (enhanced gamification)
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  category VARCHAR(50),
  requirement_type VARCHAR(50),
  requirement_value INTEGER,
  rarity VARCHAR(20) DEFAULT 'common',
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges (earned badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Challenges (time-bound goals)
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  type VARCHAR(50),
  category VARCHAR(50),
  target_value INTEGER NOT NULL,
  reward_points INTEGER DEFAULT 0,
  reward_badge_id UUID REFERENCES public.badges(id),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User challenges (progress tracking)
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- User streaks (login consistency)
CREATE TABLE IF NOT EXISTS public.login_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Shared achievements (social sharing)
CREATE TABLE IF NOT EXISTS public.shared_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  share_url TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- 2.5 Documents & Templates
-- ---------------------------------------------------------------------

-- Documents (uploaded files)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  category VARCHAR(50),
  tags TEXT[],
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescription templates (doctor's reusable templates)
CREATE TABLE IF NOT EXISTS public.prescription_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  medications JSONB NOT NULL,
  instructions TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates (system)
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.6 Queues & Waitlists
-- ---------------------------------------------------------------------

-- Waitlist (patients waiting for a doctor)
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time TIME,
  reason TEXT,
  priority INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'waiting',
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waiting room queue (for virtual appointments)

-- ---------------------------------------------------------------------
-- 2.7 Analytics & Logs
-- ---------------------------------------------------------------------

-- ctivity logs (audit trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs (security & compliance)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  resource_type TEXT,
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics data (aggregated metrics)
CREATE TABLE IF NOT EXISTS public.analytics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC,
  metric_date DATE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports (generated exports) - Enhanced for Advanced Reporting
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  generated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB,
  format TEXT NOT NULL,
  date_range JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Reports
-- Search history
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  search_type VARCHAR(50),
  results_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.8 Security & access
-- ---------------------------------------------------------------------

-- Security events (login attempts, suspicious activity)
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Failed login attempts (for rate limiting)
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  reason VARCHAR(100)
);

-- User sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- ---------------------------------------------------------------------
-- 2.9 Miscellaneous features
-- ---------------------------------------------------------------------

-- Family members (dependents)
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relation VARCHAR(50),
  date_of_birth DATE,
  age INTEGER, gender VARCHAR(20),
  blood_group VARCHAR(5),
  phone VARCHAR(20),
  email VARCHAR(255),
  medical_conditions TEXT[],
  allergies TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact messages (from public contact form)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  replied_by UUID REFERENCES auth.users(id),
  reply_message TEXT,
  replied_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members (public about page)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  email VARCHAR(255),
  linkedin_url TEXT,
  twitter_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline events (health history)
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter templates (reusable newsletter templates)
CREATE TABLE IF NOT EXISTS public.newsletter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletters (campaigns)
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  plain_text TEXT,
  audience_type VARCHAR(20) DEFAULT 'all' CHECK (audience_type IN ('all', 'patients', 'doctors', 'custom')),
  custom_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  template_id UUID REFERENCES public.newsletter_templates(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRO questionnaires (created by doctors)
CREATE TABLE IF NOT EXISTS public.pro_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  questions JSONB NOT NULL,
  frequency TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRO submissions (filled by patients)
CREATE TABLE IF NOT EXISTS public.pro_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_id UUID REFERENCES public.pro_questionnaires(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-up surveys (Patient Reviews/Ratings)
CREATE TABLE IF NOT EXISTS public.follow_up_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  response TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor Ratings (Core feedback mechanism)
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_doctor ON public.ratings(doctor_id);

-- Follow-up templates (automated patient follow-ups)
CREATE TABLE IF NOT EXISTS public.follow_up_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  channel TEXT[] DEFAULT '{"email"}',
  subject TEXT,
  body TEXT NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises ( R Physical Therapy)
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT DEFAULT 'general',
  target_joints JSONB DEFAULT '[]'::jsonb,
  difficulty TEXT DEFAULT 'beginner',
  duration_seconds INTEGER DEFAULT 60,
  instructions TEXT,
  thumbnail_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient exercises (prescribed by doctors)
CREATE TABLE IF NOT EXISTS public.patient_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  prescribed_reps INTEGER NOT NULL DEFAULT 10,
  prescribed_sets INTEGER NOT NULL DEFAULT 3,
  notes TEXT,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise sessions (completed by patients)
CREATE TABLE IF NOT EXISTS public.exercise_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_exercise_id UUID REFERENCES public.patient_exercises(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reps_completed INTEGER NOT NULL DEFAULT 0,
  sets_completed INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  accuracy_percent FLOAT,
  pain_level INTEGER,
  notes TEXT,
  joint_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Symptom reports (Epidemic Radar with PostGIS)
CREATE TABLE IF NOT EXISTS public.symptom_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  symptoms JSONB NOT NULL,
  severity INTEGER DEFAULT 1,
  location geometry(Point, 4326) NOT NULL,
  location_hash TEXT,
  anonymized BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================

-- 2.14 FDAAI/ML LGORITHM PERFORM NCE MONITORING ( PM) SYSTEM
-- ============================================================


-- AI Performance Metrics Table (APM Metrics)
CREATE TABLE IF NOT EXISTS public.ai_apm_metrics (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  sensitivity FLOAT NOT NULL,
  specificity FLOAT NOT NULL,
  ppv FLOAT NOT NULL,
  npv FLOAT NOT NULL,
  auc_roc FLOAT NOT NULL,
  calibration_error FLOAT NOT NULL,
  prediction_latency FLOAT NOT NULL,
  total_predictions INTEGER NOT NULL,
  true_positives INTEGER NOT NULL,
  true_negatives INTEGER NOT NULL,
  false_positives INTEGER NOT NULL,
  false_negatives INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SELECT create_hypertable('ai_apm_metrics', 'timestamp', if_not_exists => TRUE); -- TimescaleDB not available
CREATE INDEX IF NOT EXISTS idx_metrics_model_time ON public.ai_apm_metrics (model_name, timestamp DESC);

-- AI Performance Alerts Table
CREATE TABLE IF NOT EXISTS public.ai_performance_alerts (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  alert_level VARCHAR(20) NOT NULL, -- INFO, WARNING, CRITICAL, EMERGENCY
  messages TEXT[] NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  metrics JSONB,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by VARCHAR(100),
  acknowledged_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by VARCHAR(100),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_model_time ON public.ai_performance_alerts (model_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON public.ai_performance_alerts (resolved) WHERE resolved = FALSE;

-- AI Predictions Table (for ground truth comparison)
CREATE TABLE IF NOT EXISTS public.ai_predictions (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  patient_id VARCHAR(100),
  image_id VARCHAR(100),
  predicted_label INTEGER NOT NULL,
  confidence FLOAT NOT NULL,
  true_label INTEGER,
  ground_truth_source VARCHAR(100),
  ground_truth_date TIMESTAMPTZ,
  timestamp TIMESTAMPTZ NOT NULL,
  processing_time FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SELECT create_hypertable('ai_predictions', 'timestamp', if_not_exists => TRUE); -- TimescaleDB not available
CREATE INDEX IF NOT EXISTS idx_predictions_model_time ON public.ai_predictions (model_name, timestamp DESC);

-- Data Drift Detection Table
CREATE TABLE IF NOT EXISTS public.data_drift_metrics (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  drift_score FLOAT NOT NULL,
  drift_detected BOOLEAN NOT NULL,
  baseline_mean FLOAT,
  current_mean FLOAT,
  baseline_std FLOAT,
  current_std FLOAT,
  statistical_test VARCHAR(50),
  p_value FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SELECT create_hypertable('data_drift_metrics', 'timestamp', if_not_exists => TRUE); -- TimescaleDB not available
CREATE INDEX IF NOT EXISTS idx_drift_model_time ON public.data_drift_metrics (model_name, timestamp DESC);

-- Bias Monitoring Table
CREATE TABLE IF NOT EXISTS public.bias_monitoring (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  demographic_group VARCHAR(100) NOT NULL,
  group_value VARCHAR(100) NOT NULL,
  sensitivity FLOAT NOT NULL,
  specificity FLOAT NOT NULL,
  ppv FLOAT NOT NULL,
  npv FLOAT NOT NULL,
  sample_size INTEGER NOT NULL,
  bias_detected BOOLEAN NOT NULL,
  fairness_metric VARCHAR(50),
  fairness_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SELECT create_hypertable('bias_monitoring', 'timestamp', if_not_exists => TRUE); -- TimescaleDB not available
CREATE INDEX IF NOT EXISTS idx_bias_model_time ON public.bias_monitoring (model_name, timestamp DESC);

-- Model Versions Table (PCCP tracking)
CREATE TABLE IF NOT EXISTS public.model_versions (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  version VARCHAR(50) NOT NULL UNIQUE,
  deployed_at TIMESTAMPTZ NOT NULL,
  deprecated_at TIMESTAMPTZ,
  pccp_authorized BOOLEAN DEFAULT FALSE,
  pccp_modification_type VARCHAR(100),
  training_data_version VARCHAR(50),
  architecture_changes TEXT,
  performance_improvements TEXT,
  validation_results JSONB,
  approval_status VARCHAR(50) NOT NULL,
  approved_by VARCHAR(100),
  approved_at TIMESTAMPTZ,
  rollback_version VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_versions_model ON public.model_versions (model_name, deployed_at DESC);

-- Adverse Events Table (FDA MDR reporting)
CREATE TABLE IF NOT EXISTS public.adverse_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(100) UNIQUE NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  patient_id VARCHAR(100),
  description TEXT NOT NULL,
  root_cause TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  fda_reported BOOLEAN DEFAULT FALSE,
  fda_report_date TIMESTAMPTZ,
  fda_report_number VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  assigned_to VARCHAR(100),
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adverse_events_model ON public.adverse_events (model_name, event_date DESC);

-- Continuous aggregates for FDA PM dashboards (TimescaleDB not available - commented out)
-- CREATE MATERIALIZED VIEW IF NOT EXISTS daily_performance_summary
-- WITH (timescaledb.continuous) AS -- SELECT
--   model_name,
--   time_bucket('1 day', timestamp) AS day,
--   AVG(sensitivity) AS avg_sensitivity,
--   AVG(specificity) AS avg_specificity,
--   AVG(auc_roc) AS avg_auc,
--   SUM(total_predictions) AS total_predictions
-- FROM ai_performance_metrics
-- GROUP BY model_name, day;

-- SELECT add_continuous_aggregate_policy('daily_performance_summary',
--   start_offset => INTERVAL '3 days',
--   end_offset => INTERVAL '1 hour',
--   schedule_interval => INTERVAL '1 hour');

-- Data retention policies (7 years for FDA compliance) - TimescaleDB not available - commented out
-- SELECT add_retention_policy('ai_performance_metrics', INTERVAL '7 years');
-- SELECT add_retention_policy('ai_predictions', INTERVAL '7 years');
-- SELECT add_retention_policy('data_drift_metrics', INTERVAL '7 years');
-- SELECT add_retention_policy('bias_monitoring', INTERVAL '7 years');

-- ============================================================

-- 2.15 IEC 62304 SOFTWARE LIFECYCLE TRACEABILITY
-- ============================================================


-- Requirements Table
CREATE TABLE IF NOT EXISTS public.requirements (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  safety_class VARCHAR(1) NOT NULL CHECK (safety_class IN (' ', 'B', 'C')),
  rationale TEXT NOT NULL,
  verification_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  parent_requirement_id VARCHAR(50) REFERENCES public.requirements(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100),
  approved_by VARCHAR(100),
  approved_at TIMESTAMPTZ
);

CREATE INDEX idx_requirements_safety_class ON public.requirements(safety_class);

-- Design Elements Table
CREATE TABLE IF NOT EXISTS public.design_elements (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  safety_class VARCHAR(1) NOT NULL CHECK (safety_class IN (' ', 'B', 'C')),
  interfaces JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Implementations Table
CREATE TABLE IF NOT EXISTS public.implementations (
  id VARCHAR(50) PRIMARY KEY,
  file_path VARCHAR(500) NOT NULL,
  function_name VARCHAR(200),
  class_name VARCHAR(200),
  git_commit VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test Cases Table
CREATE TABLE IF NOT EXISTS public.test_cases (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  test_procedure TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  actual_result TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'not_run',
  executed_by VARCHAR(100),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traceability Links
CREATE TABLE IF NOT EXISTS public.requirement_design_links (
  requirement_id VARCHAR(50) REFERENCES public.requirements(id) ON DELETE CASCADE,
  design_element_id VARCHAR(50) REFERENCES public.design_elements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (requirement_id, design_element_id)
);

CREATE TABLE IF NOT EXISTS public.design_implementation_links (
  design_element_id VARCHAR(50) REFERENCES public.design_elements(id) ON DELETE CASCADE,
  implementation_id VARCHAR(50) REFERENCES public.implementations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (design_element_id, implementation_id)
);

CREATE TABLE IF NOT EXISTS public.requirement_test_links (
  requirement_id VARCHAR(50) REFERENCES public.requirements(id) ON DELETE CASCADE,
  test_case_id VARCHAR(50) REFERENCES public.test_cases(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (requirement_id, test_case_id)
);

-- IEC 62304 Traceability Coverage View
CREATE OR REPLACE VIEW public.v_traceability_coverage AS SELECT 
  r.safety_class,
  COUNT(*) as total_requirements,
  COUNT(DISTINCT rdl.requirement_id) as requirements_with_design,
  COUNT(DISTINCT rtl.requirement_id) as requirements_with_tests,
  ROUND(COUNT(DISTINCT rdl.requirement_id)::numeric / COUNT(*)::numeric * 100, 2) as design_coverage_pct,
  ROUND(COUNT(DISTINCT rtl.requirement_id)::numeric / COUNT(*)::numeric * 100, 2) as test_coverage_pct
FROM public.requirements r
LEFT JOIN public.requirement_design_links rdl ON r.id = rdl.requirement_id
LEFT JOIN public.requirement_test_links rtl ON r.id = rtl.requirement_id
GROUP BY r.safety_class;

-- ============================================================

-- 2.16 SOC 2 EVIDENCE COLLECTION & COMPLIANCE
-- ============================================================


-- SOC 2 Evidence Table
CREATE TABLE IF NOT EXISTS public.soc2_evidence (
  id SERIAL PRIMARY KEY,
  control_id VARCHAR(20) NOT NULL,
  control_name VARCHAR(200) NOT NULL,
  evidence_type VARCHAR(50) NOT NULL,
  evidence_data JSONB NOT NULL,
  collection_date TIMESTAMPTZ NOT NULL,
  evidence_file_path VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_soc2_evidence_control ON public.soc2_evidence(control_id);

-- SOC 2 Control Status
CREATE TABLE IF NOT EXISTS public.soc2_control_status (
  control_id VARCHAR(20) PRIMARY KEY,
  control_name VARCHAR(200) NOT NULL,
  control_category VARCHAR(50) NOT NULL,
  implementation_status VARCHAR(50) NOT NULL,
  last_tested_date TIMESTAMPTZ,
  test_result VARCHAR(50),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- access Reviews (CC6.2)
CREATE TABLE IF NOT EXISTS public.access_reviews (
  id SERIAL PRIMARY KEY,
  review_date DATE NOT NULL,
  reviewer VARCHAR(100) NOT NULL,
  total_users_reviewed INTEGER NOT NULL,
  access_changes_made INTEGER NOT NULL DEFAULT 0,
  completion_status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Provisioning Log (CC6.3)
CREATE TABLE IF NOT EXISTS public.user_provisioning_log (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL,
  requested_by VARCHAR(100) NOT NULL,
  approved_by VARCHAR(100),
  completed_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents (CC7.3)
CREATE TABLE IF NOT EXISTS public.incidents (
  id SERIAL PRIMARY KEY,
  incident_id VARCHAR(100) UNIQUE NOT NULL,
  severity VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  assigned_to VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  root_cause TEXT,
  resolution TEXT,
  created_by VARCHAR(100) NOT NULL
);

-- SOC 2 Control Implementation Status View
CREATE OR REPLACE VIEW public.v_soc2_control_status AS SELECT 
  control_category,
  COUNT(*) as total_controls,
  COUNT(*) FILTER (WHERE implementation_status = 'implemented') as implemented,
  ROUND(COUNT(*) FILTER (WHERE implementation_status = 'implemented')::numeric / COUNT(*)::numeric * 100, 2) as implementation_pct
FROM public.soc2_control_status
GROUP BY control_category;

-- ============================================================

-- 2.17 COMPREHENSIVE AUDIT TRAIL (HIPAA+ SOC 2 + FDA)
-- ============================================================


CREATE TABLE IF NOT EXISTS public.audit_trail (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  user_id VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_timestamp ON public.audit_trail(timestamp DESC);
CREATE INDEX idx_audit_user ON public.audit_trail(user_id);

-- ============================================================

-- 2.18 COMPLIANCE DASHBOARD FUNCTION
-- ============================================================


CREATE OR REPLACE FUNCTION get_compliance_dashboard()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'fda_apm', (
      SELECT json_build_object(
        'total_models', COUNT(DISTINCT model_name),
        'active_alerts', (SELECT COUNT(*) FROM public.ai_performance_alerts WHERE resolved = FALSE),
        'predictions_today', (SELECT COUNT(*) FROM public.ai_predictions WHERE timestamp >= CURRENT_DATE)
      )
      FROM public.model_versions
    ),
    'iec62304', (
      SELECT json_build_object(
        'total_requirements', COUNT(*),
        'traceability_coverage', (SELECT json_agg(row_to_json(public.v_traceability_coverage)) FROM public.v_traceability_coverage)
      )
      FROM public.requirements
    ),
    'soc2', (
      SELECT json_build_object(
        'control_status', (SELECT json_agg(row_to_json(public.v_soc2_control_status)) FROM public.v_soc2_control_status),
        'recent_evidence_count', (SELECT COUNT(*) FROM public.soc2_evidence WHERE collection_date >= CURRENT_DATE - INTERVAL '30 days')
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================

-- 3. CREATE INDEXES FOR PERFORM NCE
-- ============================================================


-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_scheduled ON public.appointments(doctor_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_scheduled ON public.appointments(patient_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status_scheduled ON public.appointments(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON public.appointments(appointment_type_id);
CREATE INDEX IF NOT EXISTS idx_appointments_fhir_id ON public.appointments(fhir_id) WHERE fhir_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_priority ON public.appointments(priority);
CREATE INDEX IF NOT EXISTS idx_appointments_location_type ON public.appointments(location_type);

-- Enhanced Scans
CREATE INDEX IF NOT EXISTS idx_scans_patient ON public.scans(patient_id);
CREATE INDEX IF NOT EXISTS idx_scans_created ON public.scans(created_at);
CREATE INDEX IF NOT EXISTS idx_scans_patient_created ON public.scans(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_scan_type ON public.scans(scan_type);
CREATE INDEX IF NOT EXISTS idx_scans_severity ON public.scans(severity);
CREATE INDEX IF NOT EXISTS idx_scans_confidence ON public.scans(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_scans_ai_model ON public.scans(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_scans_imaging_study ON public.scans(imaging_study_id);
CREATE INDEX IF NOT EXISTS idx_scans_reviewed ON public.scans(reviewed_by, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_scans_validation_status ON public.scans(clinical_validation);
CREATE INDEX IF NOT EXISTS idx_scans_urgency ON public.scans(urgency_level);

-- Enhanced Prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON public.prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created ON public.prescriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_number ON public.prescriptions(prescription_number);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON public.prescriptions(prescription_date DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_expiration ON public.prescriptions(expiration_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_e_prescribed ON public.prescriptions(e_prescribed);

-- FHIR Organizations
CREATE INDEX IF NOT EXISTS idx_fhir_organizations_fhir_id ON public.fhir_organizations(fhir_id);
CREATE INDEX IF NOT EXISTS idx_fhir_organizations_name ON public.fhir_organizations(name);
CREATE INDEX IF NOT EXISTS idx_fhir_organizations_type ON public.fhir_organizations USING GIN(type);
CREATE INDEX IF NOT EXISTS idx_fhir_organizations_active ON public.fhir_organizations(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_fhir_organizations_parent ON public.fhir_organizations(parent_organization_id);

-- FHIR Practitioners
CREATE INDEX IF NOT EXISTS idx_fhir_practitioners_fhir_id ON public.fhir_practitioners(fhir_id);
CREATE INDEX IF NOT EXISTS idx_fhir_practitioners_user_id ON public.fhir_practitioners(user_id);
CREATE INDEX IF NOT EXISTS idx_fhir_practitioners_active ON public.fhir_practitioners(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_fhir_practitioners_identifier ON public.fhir_practitioners USING GIN(identifier);

-- FHIR Patients
CREATE INDEX IF NOT EXISTS idx_fhir_patients_fhir_id ON public.fhir_patients(fhir_id);
CREATE INDEX IF NOT EXISTS idx_fhir_patients_user_id ON public.fhir_patients(user_id);
CREATE INDEX IF NOT EXISTS idx_fhir_patients_active ON public.fhir_patients(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_fhir_patients_birth_date ON public.fhir_patients(birth_date);
CREATE INDEX IF NOT EXISTS idx_fhir_patients_managing_org ON public.fhir_patients(managing_organization);

-- Specialties
CREATE INDEX IF NOT EXISTS idx_specialties_name ON public.specialties(name);
CREATE INDEX IF NOT EXISTS idx_specialties_category ON public.specialties(category);
CREATE INDEX IF NOT EXISTS idx_specialties_active ON public.specialties(is_active, display_order) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_specialties_parent ON public.specialties(parent_specialty_id);

-- Insurance Providers
CREATE INDEX IF NOT EXISTS idx_insurance_providers_code ON public.insurance_providers(code);
CREATE INDEX IF NOT EXISTS idx_insurance_providers_name ON public.insurance_providers(name);
CREATE INDEX IF NOT EXISTS idx_insurance_providers_type ON public.insurance_providers(type);
CREATE INDEX IF NOT EXISTS idx_insurance_providers_active ON public.insurance_providers(is_active) WHERE is_active = TRUE;

-- Patient Insurance
CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient ON public.patient_insurance(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_provider ON public.patient_insurance(provider_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_policy ON public.patient_insurance(policy_number);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_primary ON public.patient_insurance(patient_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_patient_insurance_active ON public.patient_insurance(is_active) WHERE is_active = TRUE;

-- Medical Conditions
CREATE INDEX IF NOT EXISTS idx_medical_conditions_icd10 ON public.medical_conditions(icd10_code);
CREATE INDEX IF NOT EXISTS idx_medical_conditions_name ON public.medical_conditions(name);
CREATE INDEX IF NOT EXISTS idx_medical_conditions_category ON public.medical_conditions(category);
CREATE INDEX IF NOT EXISTS idx_medical_conditions_chronic ON public.medical_conditions(is_chronic) WHERE is_chronic = TRUE;

-- Patient Medical History
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_patient ON public.patient_medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_condition ON public.patient_medical_history(condition_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_diagnosed_date ON public.patient_medical_history(diagnosed_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_status ON public.patient_medical_history(status);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_family ON public.patient_medical_history(family_history) WHERE family_history = TRUE;

-- Patient Allergies
CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient ON public.patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_type ON public.patient_allergies(allergen_type);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_severity ON public.patient_allergies(severity);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_active ON public.patient_allergies(is_active) WHERE is_active = TRUE;

-- Medications Reference
CREATE INDEX IF NOT EXISTS idx_medications_reference_ndc ON public.medications_reference(ndc_code);
CREATE INDEX IF NOT EXISTS idx_medications_reference_generic ON public.medications_reference(generic_name);
CREATE INDEX IF NOT EXISTS idx_medications_reference_class ON public.medications_reference(drug_class);
CREATE INDEX IF NOT EXISTS idx_medications_reference_brand_names ON public.medications_reference USING GIN(brand_names);

-- Patient Medications
CREATE INDEX IF NOT EXISTS idx_patient_medications_patient ON public.patient_medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medications_medication ON public.patient_medications(medication_id);
CREATE INDEX IF NOT EXISTS idx_patient_medications_prescribed_by ON public.patient_medications(prescribed_by);
CREATE INDEX IF NOT EXISTS idx_patient_medications_status ON public.patient_medications(status);
CREATE INDEX IF NOT EXISTS idx_patient_medications_start_date ON public.patient_medications(start_date DESC);

-- Lab Tests Reference
CREATE INDEX IF NOT EXISTS idx_lab_tests_reference_loinc ON public.lab_tests_reference(loinc_code);
CREATE INDEX IF NOT EXISTS idx_lab_tests_reference_name ON public.lab_tests_reference(test_name);
CREATE INDEX IF NOT EXISTS idx_lab_tests_reference_category ON public.lab_tests_reference(test_category);

-- Patient Lab Results
CREATE INDEX IF NOT EXISTS idx_patient_lab_results_patient ON public.patient_lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_lab_results_test ON public.patient_lab_results(test_id);
CREATE INDEX IF NOT EXISTS idx_patient_lab_results_collected ON public.patient_lab_results(collected_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_lab_results_abnormal ON public.patient_lab_results(abnormal_flag);
CREATE INDEX IF NOT EXISTS idx_patient_lab_results_critical ON public.patient_lab_results(critical_value) WHERE critical_value = TRUE;

-- Appointment Types
CREATE INDEX IF NOT EXISTS idx_appointment_types_name ON public.appointment_types(name);
CREATE INDEX IF NOT EXISTS idx_appointment_types_duration ON public.appointment_types(duration_minutes);
CREATE INDEX IF NOT EXISTS idx_appointment_types_active ON public.appointment_types(is_active) WHERE is_active = TRUE;

-- Doctor Time Slots
CREATE INDEX IF NOT EXISTS idx_doctor_time_slots_doctor ON public.doctor_time_slots(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_time_slots_day ON public.doctor_time_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_doctor_time_slots_time ON public.doctor_time_slots(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_doctor_time_slots_active ON public.doctor_time_slots(is_active) WHERE is_active = TRUE;

-- Medical Imaging Studies
CREATE INDEX IF NOT EXISTS idx_medical_imaging_patient ON public.medical_imaging_studies(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_imaging_study_uid ON public.medical_imaging_studies(study_instance_uid);
CREATE INDEX IF NOT EXISTS idx_medical_imaging_accession ON public.medical_imaging_studies(accession_number);
CREATE INDEX IF NOT EXISTS idx_medical_imaging_modality ON public.medical_imaging_studies(modality);
CREATE INDEX IF NOT EXISTS idx_medical_imaging_date ON public.medical_imaging_studies(study_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_imaging_status ON public.medical_imaging_studies(status);

-- AI Models
CREATE INDEX IF NOT EXISTS idx_ai_models_name_version ON public.ai_models(name, version);
CREATE INDEX IF NOT EXISTS idx_ai_models_type ON public.ai_models(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_models_domain ON public.ai_models(medical_domain);
CREATE INDEX IF NOT EXISTS idx_ai_models_modality ON public.ai_models(input_modality);
CREATE INDEX IF NOT EXISTS idx_ai_models_status ON public.ai_models(deployment_status);

-- AI Analysis Results
CREATE INDEX IF NOT EXISTS idx_ai_analysis_patient ON public.ai_analysis_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_model ON public.ai_analysis_results(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_study ON public.ai_analysis_results(imaging_study_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_confidence ON public.ai_analysis_results(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created ON public.ai_analysis_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_reviewed ON public.ai_analysis_results(reviewed_by, reviewed_at);

-- Notification Templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON public.notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_trigger ON public.notification_templates(trigger_event);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON public.notification_templates(is_active) WHERE is_active = TRUE;

-- Enhanced Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_user ON public.notifications_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_template ON public.notifications_enhanced(template_id);
CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_priority ON public.notifications_enhanced(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_scheduled ON public.notifications_enhanced(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_created ON public.notifications_enhanced(created_at DESC);

-- Family Relationships
CREATE INDEX IF NOT EXISTS idx_family_relationships_primary ON public.family_relationships(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_related ON public.family_relationships(related_user_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_type ON public.family_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_family_relationships_emergency ON public.family_relationships(is_emergency_contact) WHERE is_emergency_contact = TRUE;

-- Insurance Claims
CREATE INDEX IF NOT EXISTS idx_insurance_claims_number ON public.insurance_claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient ON public.insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_provider ON public.insurance_claims(provider_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_insurance ON public.insurance_claims(insurance_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON public.insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_service_date ON public.insurance_claims(service_date DESC);

-- Payment Transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_id ON public.payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_patient ON public.payment_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_appointment ON public.payment_transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON public.payment_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON public.payment_transactions(created_at DESC);

-- Video Consultation Indices
CREATE INDEX IF NOT EXISTS idx_video_consultations_appointment ON public.video_consultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_video_consultations_doctor ON public.video_consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_video_consultations_patient ON public.video_consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_video_consultations_status ON public.video_consultations(status);

-- Healthcare KPIs
CREATE INDEX IF NOT EXISTS idx_healthcare_kpis_category ON public.healthcare_kpis(kpi_category);
CREATE INDEX IF NOT EXISTS idx_healthcare_kpis_calculated ON public.healthcare_kpis(last_calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_healthcare_kpis_active ON public.healthcare_kpis(is_active) WHERE is_active = TRUE;

-- Clinical Decision Support Rules
CREATE INDEX IF NOT EXISTS idx_cds_rules_category ON public.clinical_decision_support_rules(rule_category);
CREATE INDEX IF NOT EXISTS idx_cds_rules_severity ON public.clinical_decision_support_rules(severity_level);
CREATE INDEX IF NOT EXISTS idx_cds_rules_active ON public.clinical_decision_support_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cds_rules_effective ON public.clinical_decision_support_rules(effective_date, expiration_date);

-- Data access Audit
CREATE INDEX IF NOT EXISTS idx_data_access_audit_user ON public.data_access_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_audit_accessed_user ON public.data_access_audit(accessed_user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_audit_resource ON public.data_access_audit(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_data_access_audit_accessed_at ON public.data_access_audit(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_audit_risk ON public.data_access_audit(risk_level);

-- Patient Consents
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient ON public.patient_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_type ON public.patient_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_patient_consents_active ON public.patient_consents(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_patient_consents_granted ON public.patient_consents(granted, granted_at);

-- Population Health Metrics
CREATE INDEX IF NOT EXISTS idx_population_health_metric_name ON public.population_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_population_health_category ON public.population_health_metrics(metric_category);
CREATE INDEX IF NOT EXISTS idx_population_health_period ON public.population_health_metrics(time_period_start, time_period_end);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_medications_gin ON public.prescriptions USING GIN(to_tsvector('english', medications::text));
CREATE INDEX IF NOT EXISTS idx_clinical_notes_content_gin ON public.clinical_notes USING GIN(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_patient_allergies_allergen_gin ON public.patient_allergies USING GIN(to_tsvector('english', allergen_name));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_status ON public.appointments(doctor_id, scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_scans_patient_type_created ON public.scans(patient_id, scan_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_status_date ON public.prescriptions(patient_id, status, prescription_date DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, recipient_id, created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_provider_msg_id ON public.notifications (provider_message_id) WHERE provider_message_id IS NOT NULL;

-- Notification preferences
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON public.notification_preferences(user_id);

-- ctivity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_patient ON public.documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);

-- Waitlist
CREATE INDEX IF NOT EXISTS idx_waitlist_patient ON public.waitlist(patient_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_doctor ON public.waitlist(doctor_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_date ON public.waitlist(preferred_date);

-- Waiting queue
CREATE INDEX IF NOT EXISTS idx_waiting_queue_consultation ON public.waiting_room(consultation_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_doctor ON public.waiting_room(doctor_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_status ON public.waiting_room(status);

-- User streaks
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.login_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_login ON public.login_streaks(last_login_date DESC);

-- Security events
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(ip_address);

-- PI keys
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON public.api_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(is_active);

-- Failed login attempts
CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON public.failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_logins_ip ON public.failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_logins_attempted ON public.failed_login_attempts(attempted_at DESC);

-- User sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);

-- Achievements
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);

-- User points
CREATE INDEX IF NOT EXISTS idx_user_points_user ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_total ON public.user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_achievement ON public.user_points(achievement_id);

-- Badges
CREATE INDEX IF NOT EXISTS idx_badges_category ON public.badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON public.badges(rarity);

-- User badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON public.user_badges(badge_id);

-- Challenges
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON public.challenges(start_date, end_date);

-- User challenges
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON public.user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON public.user_challenges(completed);

-- Shared achievements
CREATE INDEX IF NOT EXISTS idx_shared_achievements_user ON public.shared_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_achievements_achievement ON public.shared_achievements(achievement_id);

-- Referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- Prescription templates
CREATE INDEX IF NOT EXISTS idx_prescription_templates_doctor ON public.prescription_templates(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescription_templates_public ON public.prescription_templates(is_public) WHERE is_public = TRUE;

-- Email templates
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active) WHERE is_active = TRUE;

-- Search history
CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON public.search_history(created_at DESC);

-- Timeline events
CREATE INDEX IF NOT EXISTS idx_timeline_user ON public.timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_date ON public.timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON public.timeline_events(event_type);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.analytics_data(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric ON public.analytics_data(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics_data(metric_date DESC);

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON public.reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports(created_at DESC);

-- SO P notes
CREATE INDEX IF NOT EXISTS idx_soap_notes_appointment ON public.soap_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_doctor ON public.soap_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_patient ON public.soap_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_created ON public.soap_notes(created_at DESC);

-- Family members
CREATE INDEX IF NOT EXISTS idx_family_members_primary_user ON public.family_members(primary_user_id);

-- Contact messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);

-- Team members
CREATE INDEX IF NOT EXISTS idx_team_members_active ON public.team_members(is_active, display_order);

-- PRO submissions
CREATE INDEX IF NOT EXISTS idx_pro_submissions_patient ON public.pro_submissions(patient_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_submissions_questionnaire ON public.pro_submissions(questionnaire_id);

-- Follow-up surveys
CREATE INDEX IF NOT EXISTS idx_follow_up_surveys_patient ON public.follow_up_surveys(patient_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_surveys_appointment ON public.follow_up_surveys(appointment_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_surveys_answered ON public.follow_up_surveys(answered_at DESC);

-- Video recordings
CREATE INDEX IF NOT EXISTS idx_video_recordings_consultation ON public.video_recordings(consultation_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_status ON public.video_recordings(status);
CREATE INDEX IF NOT EXISTS idx_video_recordings_created ON public.video_recordings(created_at DESC);

-- Symptom reports (PostGIS spatial index)
CREATE INDEX IF NOT EXISTS symptom_reports_gix ON symptom_reports USING GIST (location);

