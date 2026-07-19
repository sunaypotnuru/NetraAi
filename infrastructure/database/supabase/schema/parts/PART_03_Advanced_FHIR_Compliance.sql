-- ============================================================
-- NETRA AI COMPLETE SCHEMA v3.2.0 — PART 03
-- Section : Advanced_FHIR_Compliance
-- Lines   : 3152-4706 in NETRA_COMPLETE_SCHEMA.sql
-- SAFE TO RE-RUN: All objects use DROP IF EXISTS guards
-- ============================================================

-- ============================================================

-- 3.1 CRITICAL PERFORM NCE INDEXES ( dded for Production)
-- ============================================================

-- Critical composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_appointments_patient_status_date 
  ON public.appointments(patient_id, status, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_status_date 
  ON public.appointments(doctor_id, status, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_patient_created 
  ON public.ai_analysis_results(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
  ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action 
  ON public.audit_logs(user_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_resource 
  ON public.audit_logs(table_name, resource_id);

-- Indexes for data retention cleanup queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
  ON public.activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at 
  ON public.security_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempted_at 
  ON public.failed_login_attempts(attempted_at DESC);

-- Indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_user_created 
  ON public.notifications_enhanced(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_scheduled_status 
  ON public.notifications_enhanced(scheduled_for, status) 
  WHERE scheduled_for IS NOT NULL;

-- Indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_payment_transactions_patient_created 
  ON public.payment_transactions(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_created 
  ON public.payment_transactions(status, created_at DESC);

-- Indexes for medical imaging queries
CREATE INDEX IF NOT EXISTS idx_medical_imaging_patient_date 
  ON public.medical_imaging_studies(patient_id, study_date DESC);

-- Indexes for prescription queries
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_date 
  ON public.prescriptions(patient_id, prescription_date DESC);

CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_date 
  ON public.prescriptions(doctor_id, prescription_date DESC);

-- Indexes for lab results queries
CREATE INDEX IF NOT EXISTS idx_patient_lab_results_patient_date 
  ON public.patient_lab_results(patient_id, collected_date DESC);

-- FILE: 04_indexes_and_rls.sql
-- ============================================================

-- Wearable Devices (Patient connected devices)
CREATE TABLE IF NOT EXISTS public.wearable_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Device information
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(100) NOT NULL, -- smartwatch, fitness_tracker, cgm, blood_pressure_monitor
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(200),
  firmware_version VARCHAR(50),
  
  -- Connectivity
  connection_type VARCHAR(50), -- bluetooth, wifi, cellular, nfc
  mac_address VARCHAR(17),
  device_token TEXT, -- For push notifications
  api_endpoint TEXT,
  
  -- Capabilities
  sensors JSONB, -- heart_rate, steps, sleep, glucose, etc.
  measurement_frequency VARCHAR(100), -- continuous, hourly, daily
  battery_life_days INTEGER,
  waterproof_rating VARCHAR(20),
  
  -- Status and health
  device_status VARCHAR(50) DEFAULT 'active', -- active, inactive, maintenance, lost
  last_sync_at TIMESTAMPTZ,
  battery_level INTEGER, -- 0-100
  signal_strength INTEGER, -- 0-100
  
  -- Data quality
  accuracy_rating DECIMAL(3,2), -- 0-5 stars
  calibration_date DATE,
  calibration_due_date DATE,
  
  -- Privacy and consent
  data_sharing_enabled BOOLEAN DEFAULT TRUE,
  location_tracking_enabled BOOLEAN DEFAULT FALSE,
  
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time Health Metrics (Continuous monitoring data)
CREATE TABLE IF NOT EXISTS public.realtime_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.wearable_devices(id),
  
  -- Metric details
  metric_type VARCHAR(100) NOT NULL, -- heart_rate, blood_pressure, glucose, steps, sleep
  metric_value DECIMAL(15,6) NOT NULL,
  metric_unit VARCHAR(50) NOT NULL,
  
  -- Contextual data
  measurement_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  measurement_context VARCHAR(100), -- resting, active, sleeping, eating
  activity_type VARCHAR(100), -- walking, running, cycling, swimming
  
  -- Quality indicators
  confidence_score DECIMAL(5,4), -- 0-1 confidence in measurement
  data_quality VARCHAR(50), -- excellent, good, fair, poor
  anomaly_detected BOOLEAN DEFAULT FALSE,
  
  -- Environmental factors
  ambient_temperature DECIMAL(5,2),
  humidity_percent INTEGER,
  altitude_meters INTEGER,
  
  -- Derived metrics
  trend_direction VARCHAR(20), -- increasing, decreasing, stable
  percentile_rank DECIMAL(5,2), -- Compared to patient's historical data
  
  -- Alerts and notifications
  alert_triggered BOOLEAN DEFAULT FALSE,
  alert_level VARCHAR(20), -- info, warning, critical
  alert_message TEXT,
  
  -- Data processing
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_algorithm VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Alerts ( utomated health monitoring alerts)
CREATE TABLE IF NOT EXISTS public.health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.wearable_devices(id),
  metric_id UUID REFERENCES public.realtime_health_metrics(id),
  
  -- Alert details
  alert_type VARCHAR(100) NOT NULL, -- threshold_breach, trend_anomaly, device_malfunction
  severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Triggering conditions
  trigger_metric VARCHAR(100),
  trigger_value DECIMAL(15,6),
  threshold_breached DECIMAL(15,6),
  duration_minutes INTEGER, -- How long the condition persisted
  
  -- Clinical context
  clinical_significance VARCHAR(100),
  recommended_actions TEXT[],
  requires_immediate_attention BOOLEAN DEFAULT FALSE,
  
  -- Response tracking
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Escalation
  escalated BOOLEAN DEFAULT FALSE,
  escalated_to UUID REFERENCES auth.users(id),
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  
  -- Notifications sent
  patient_notified BOOLEAN DEFAULT FALSE,
  doctor_notified BOOLEAN DEFAULT FALSE,
  emergency_contact_notified BOOLEAN DEFAULT FALSE,
  
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device Calibration Records
CREATE TABLE IF NOT EXISTS public.device_calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.wearable_devices(id) ON DELETE CASCADE,
  
  -- Calibration details
  calibration_type VARCHAR(100), -- factory, clinical, user
  calibrated_by UUID REFERENCES auth.users(id),
  calibration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Reference measurements
  reference_values JSONB, -- Known accurate values for comparison
  device_readings JSONB, -- Device readings during calibration
  
  -- Calibration results
  accuracy_before DECIMAL(5,4), -- ccuracy before calibration
  accuracy_after DECIMAL(5,4), -- ccuracy after calibration
  calibration_successful BOOLEAN DEFAULT TRUE,
  
  -- djustments made
  calibration_factors JSONB, -- Mathematical adjustments applied
  firmware_updated BOOLEAN DEFAULT FALSE,
  new_firmware_version VARCHAR(50),
  
  -- Quality assurance
  qa_performed BOOLEAN DEFAULT FALSE,
  qa_results JSONB,
  certification_number VARCHAR(100),
  
  -- Next calibration
  next_calibration_due DATE,
  calibration_interval_days INTEGER DEFAULT 365,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sleep Analysis ( Advanced sleep tracking)
CREATE TABLE IF NOT EXISTS public.sleep_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.wearable_devices(id),
  
  -- Sleep session
  sleep_date DATE NOT NULL,
  bedtime TIMESTAMPTZ,
  sleep_onset TIMESTAMPTZ,
  wake_time TIMESTAMPTZ,
  out_of_bed_time TIMESTAMPTZ,
  
  -- Sleep duration
  total_time_in_bed_minutes INTEGER,
  total_sleep_time_minutes INTEGER,
  sleep_efficiency_percent DECIMAL(5,2), -- (sleep time / time in bed) * 100
  
  -- Sleep stages
  light_sleep_minutes INTEGER,
  deep_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  awake_minutes INTEGER,
  
  -- Sleep quality metrics
  sleep_onset_latency_minutes INTEGER, -- Time to fall asleep
  wake_after_sleep_onset_minutes INTEGER, -- Time awake during sleep
  number_of_awakenings INTEGER,
  
  -- Heart rate during sleep
  avg_heart_rate_sleeping INTEGER,
  min_heart_rate_sleeping INTEGER,
  max_heart_rate_sleeping INTEGER,
  heart_rate_variability DECIMAL(8,4),
  
  -- Respiratory metrics
  avg_respiratory_rate DECIMAL(5,2),
  respiratory_disturbances INTEGER,
  
  -- Environmental factors
  room_temperature DECIMAL(5,2),
  noise_level_db DECIMAL(5,2),
  light_exposure_lux DECIMAL(8,2),
  
  -- Sleep score and insights
  sleep_score INTEGER, -- 0-100
  sleep_debt_minutes INTEGER, -- Cumulative sleep deficit
  circadian_rhythm_alignment DECIMAL(5,4), -- 0-1 score
  
  -- AI analysis
  sleep_pattern_analysis JSONB,
  anomalies_detected TEXT[],
  recommendations TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for IoT Tables
CREATE INDEX IF NOT EXISTS idx_wearable_devices_patient ON public.wearable_devices(patient_id);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_status ON public.wearable_devices(device_status);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_type ON public.wearable_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_patient ON public.realtime_health_metrics(patient_id);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_timestamp ON public.realtime_health_metrics(measurement_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_type ON public.realtime_health_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_device ON public.realtime_health_metrics(device_id);
CREATE INDEX IF NOT EXISTS idx_health_alerts_patient ON public.health_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_alerts_severity ON public.health_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_health_alerts_unresolved ON public.health_alerts(resolved) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_device_calibrations_device ON public.device_calibrations(device_id);
CREATE INDEX IF NOT EXISTS idx_device_calibrations_due ON public.device_calibrations(next_calibration_due);
CREATE INDEX IF NOT EXISTS idx_sleep_analysis_patient ON public.sleep_analysis(patient_id);
CREATE INDEX IF NOT EXISTS idx_sleep_analysis_date ON public.sleep_analysis(sleep_date DESC);

-- RLS Policies for IoT Tables
 ALTER TABLE public.wearable_devices ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.realtime_health_metrics ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.health_alerts ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.device_calibrations ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.sleep_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can manage own wearable devices" ON public.wearable_devices;
CREATE POLICY "Patients can manage own wearable devices"
  ON public.wearable_devices FOR ALL
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view patient wearable devices" ON public.wearable_devices;
CREATE POLICY "Doctors can view patient wearable devices"
  ON public.wearable_devices FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = wearable_devices.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Patients can view own health metrics" ON public.realtime_health_metrics;
CREATE POLICY "Patients can view own health metrics"
  ON public.realtime_health_metrics FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "System can create health metrics" ON public.realtime_health_metrics;
CREATE POLICY "System can create health metrics"
  ON public.realtime_health_metrics FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Doctors can view patient health metrics" ON public.realtime_health_metrics;
CREATE POLICY "Doctors can view patient health metrics"
  ON public.realtime_health_metrics FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = realtime_health_metrics.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Patients can view own health alerts" ON public.health_alerts;
CREATE POLICY "Patients can view own health alerts"
  ON public.health_alerts FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can acknowledge own health alerts" ON public.health_alerts;
CREATE POLICY "Patients can acknowledge own health alerts"
  ON public.health_alerts FOR UPDATE
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can manage patient health alerts" ON public.health_alerts;
CREATE POLICY "Doctors can manage patient health alerts"
  ON public.health_alerts FOR ALL
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = health_alerts.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Patients can view own device calibrations" ON public.device_calibrations;
CREATE POLICY "Patients can view own device calibrations"
  ON public.device_calibrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wearable_devices
      WHERE wearable_devices.id = device_calibrations.device_id AND wearable_devices.patient_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Technicians can manage device calibrations" ON public.device_calibrations;
CREATE POLICY "Technicians can manage device calibrations"
  ON public.device_calibrations FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Patients can view own sleep analysis" ON public.sleep_analysis;
CREATE POLICY "Patients can view own sleep analysis"
  ON public.sleep_analysis FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "System can create sleep analysis" ON public.sleep_analysis;
CREATE POLICY "System can create sleep analysis"
  ON public.sleep_analysis FOR INSERT
  WITH CHECK (true);

-- Triggers for IoT Tables
DROP TRIGGER IF EXISTS update_wearable_devices_updated_at ON public.wearable_devices;
CREATE TRIGGER update_wearable_devices_updated_at BEFORE UPDATE ON public.wearable_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ============================================================

-- 18. SOCIAL DETERMINANTS OF HEALTH (2026 ENHANCEMENT)
-- Comprehensive social, economic, and environmental health factors
-- ============================================================

-- Social Determinants Assessment
CREATE TABLE IF NOT EXISTS public.social_determinants_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Assessment metadata
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessed_by UUID REFERENCES auth.users(id),
  assessment_type VARCHAR(100), -- initial, annual, triggered_by_event
  data_source VARCHAR(100), -- patient_reported, ehr_integrated, survey
  
  -- Economic Stability
  employment_status VARCHAR(100), -- employed, unemployed, retired, disabled, student
  income_level VARCHAR(50), -- below_poverty, low_income, middle_income, high_income
  income_annual_usd INTEGER,
  financial_strain_score INTEGER, -- 1-10 scale
  food_security_status VARCHAR(50), -- secure, marginal, low, very_low
  housing_stability VARCHAR(50), -- stable, temporary, homeless, at_risk
  
  -- Education access and Quality
  education_level VARCHAR(100), -- less_than_hs, hs_diploma, some_college, bachelor, graduate
  health_literacy_score INTEGER, -- 1-10 scale
  digital_literacy_score INTEGER, -- 1-10 scale
  language_barriers BOOLEAN DEFAULT FALSE,
  primary_language VARCHAR(50),
  interpreter_needed BOOLEAN DEFAULT FALSE,
  
  -- Healthcare access and Quality
  insurance_status VARCHAR(100), -- insured, uninsured, underinsured
  usual_source_of_care BOOLEAN DEFAULT TRUE,
  transportation_barriers BOOLEAN DEFAULT FALSE,
  distance_to_provider_miles DECIMAL(8,2),
  cultural_barriers BOOLEAN DEFAULT FALSE,
  discrimination_experienced BOOLEAN DEFAULT FALSE,
  
  -- Neighborhood and Environment
  zip_code VARCHAR(10),
  neighborhood_safety_score INTEGER, -- 1-10 scale
  air_quality_index INTEGER, -- 0-500 QI
  walkability_score INTEGER, -- 1-100 Walk Score
  access_to_parks BOOLEAN DEFAULT FALSE,
  access_to_healthy_food BOOLEAN DEFAULT TRUE,
  noise_pollution_level VARCHAR(50), -- low, moderate, high
  
  -- Social and Community Context
  social_support_score INTEGER, -- 1-10 scale
  marital_status VARCHAR(50),
  household_size INTEGER,
  caregiver_responsibilities BOOLEAN DEFAULT FALSE,
  community_engagement_score INTEGER, -- 1-10 scale
  religious_spiritual_support BOOLEAN DEFAULT FALSE,
  
  -- Behavioral Factors
  tobacco_use VARCHAR(50), -- never, former, current
  alcohol_use VARCHAR(50), -- none, moderate, heavy
  physical_activity_level VARCHAR(50), -- sedentary, low, moderate, high
  diet_quality_score INTEGER, -- 1-10 scale
  stress_level VARCHAR(50), -- low, moderate, high, severe
  
  -- Adverse Childhood Experiences ( CEs)
  aces_score INTEGER, -- 0-10 CE score
  trauma_history BOOLEAN DEFAULT FALSE,
  mental_health_history BOOLEAN DEFAULT FALSE,
  
  -- Risk Stratification
  overall_sdoh_risk_score INTEGER, -- 1-100 composite risk score
  risk_category VARCHAR(50), -- low, moderate, high, very_high
  priority_interventions TEXT[],
  
  -- Follow-up
  reassessment_due_date DATE,
  interventions_recommended TEXT[],
  referrals_made TEXT[],
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Resources ( Available social services and programs)
CREATE TABLE IF NOT EXISTS public.community_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Resource identification
  resource_name VARCHAR(255) NOT NULL UNIQUE,
  organization_name VARCHAR(255),
  resource_type VARCHAR(100), -- food_assistance, housing, transportation, healthcare, education
  category VARCHAR(100), -- government, nonprofit, faith_based, private
  
  -- Contact information
  phone VARCHAR(20),
  email VARCHAR(255),
  website_url TEXT,
  
  -- Location and service area
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(10),
  service_area TEXT[], -- ZIP codes or regions served
  coordinates POINT, -- PostGIS point for mapping
  
  -- Service details
  services_offered TEXT[],
  eligibility_criteria TEXT,
  application_process TEXT,
  required_documents TEXT[],
  
  -- availability
  hours_of_operation JSONB, -- Day/time schedule
  languages_supported TEXT[],
  accessibility_features TEXT[], -- wheelchair_accessible, interpreter_services
  
  -- Capacity and waitlists
  current_capacity INTEGER,
  waitlist_length INTEGER,
  average_wait_time_days INTEGER,
  
  -- Quality metrics
  user_rating DECIMAL(3,2), -- 1-5 star rating
  success_rate_percent DECIMAL(5,2),
  last_quality_review DATE,
  
  -- administrative
  funding_sources TEXT[],
  license_number VARCHAR(100),
  accreditation VARCHAR(100),
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource Referrals (Tracking referrals to community resources)
CREATE TABLE IF NOT EXISTS public.resource_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.community_resources(id),
  referring_provider_id UUID REFERENCES auth.users(id),
  
  -- Referral details
  referral_date DATE NOT NULL DEFAULT CURRENT_DATE,
  referral_reason TEXT NOT NULL,
  urgency_level VARCHAR(50), -- routine, urgent, emergency
  
  -- Patient needs
  specific_needs TEXT[],
  barriers_identified TEXT[],
  patient_preferences TEXT,
  
  -- Referral status
  status VARCHAR(50) DEFAULT 'pending', -- pending, contacted, enrolled, declined, completed
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Follow-up tracking
  patient_contacted_resource BOOLEAN DEFAULT FALSE,
  contact_date DATE,
  enrollment_date DATE,
  completion_date DATE,
  
  -- Outcomes
  services_received TEXT[],
  outcome_achieved BOOLEAN DEFAULT FALSE,
  outcome_description TEXT,
  patient_satisfaction_score INTEGER, -- 1-10 scale
  
  -- Barriers encountered
  barriers_encountered TEXT[],
  barrier_resolution TEXT,
  
  -- Follow-up needed
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Equity Metrics (Population-level health equity tracking)
CREATE TABLE IF NOT EXISTS public.health_equity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metric identification
  metric_name VARCHAR(255) NOT NULL,
  metric_category VARCHAR(100), -- access, quality, outcomes, experience
  measurement_period_start DATE NOT NULL,
  measurement_period_end DATE NOT NULL,
  
  -- Population stratification
  demographic_group VARCHAR(100), -- race_ethnicity, income_level, geography, age_group
  stratification_value VARCHAR(100), -- specific group identifier
  
  -- Geographic scope
  geographic_level VARCHAR(50), -- national, state, county, zip_code, neighborhood
  geographic_identifier VARCHAR(100),
  
  -- Metric values
  numerator INTEGER,
  denominator INTEGER,
  rate_per_1000 DECIMAL(10,4),
  confidence_interval_lower DECIMAL(10,4),
  confidence_interval_upper DECIMAL(10,4),
  
  -- Disparity analysis
  reference_group_rate DECIMAL(10,4), -- Rate for comparison group
  absolute_disparity DECIMAL(10,4), -- Difference from reference
  relative_disparity DECIMAL(10,4), -- Ratio to reference
  disparity_significance VARCHAR(50), -- significant, not_significant
  
  -- Trend analysis
  previous_period_rate DECIMAL(10,4),
  trend_direction VARCHAR(50), -- improving, worsening, stable
  trend_significance VARCHAR(50),
  
  -- Data quality
  data_completeness_percent DECIMAL(5,2),
  data_source VARCHAR(255),
  methodology_notes TEXT,
  
  -- Interventions
  interventions_in_place TEXT[],
  target_rate DECIMAL(10,4),
  target_date DATE,
  
  calculated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Social Determinants Tables
CREATE INDEX IF NOT EXISTS idx_sdoh_assessment_patient ON public.social_determinants_assessment(patient_id);
CREATE INDEX IF NOT EXISTS idx_sdoh_assessment_date ON public.social_determinants_assessment(assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_sdoh_assessment_risk ON public.social_determinants_assessment(risk_category);
CREATE INDEX IF NOT EXISTS idx_community_resources_type ON public.community_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_community_resources_zip ON public.community_resources(zip_code);
CREATE INDEX IF NOT EXISTS idx_community_resources_active ON public.community_resources(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_resources_location ON public.community_resources USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_resource_referrals_patient ON public.resource_referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_resource_referrals_resource ON public.resource_referrals(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_referrals_status ON public.resource_referrals(status);
CREATE INDEX IF NOT EXISTS idx_resource_referrals_date ON public.resource_referrals(referral_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_equity_metrics_category ON public.health_equity_metrics(metric_category);
CREATE INDEX IF NOT EXISTS idx_health_equity_metrics_group ON public.health_equity_metrics(demographic_group);
CREATE INDEX IF NOT EXISTS idx_health_equity_metrics_period ON public.health_equity_metrics(measurement_period_start, measurement_period_end);

-- RLS Policies for Social Determinants Tables
 ALTER TABLE public.social_determinants_assessment ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.resource_referrals ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.health_equity_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can view own SDOH assessments" ON public.social_determinants_assessment;
CREATE POLICY "Patients can view own SDOH assessments"
  ON public.social_determinants_assessment FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can manage own SDOH assessments" ON public.social_determinants_assessment;
CREATE POLICY "Patients can manage own SDOH assessments"
  ON public.social_determinants_assessment FOR ALL
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Healthcare providers can view patient SDOH assessments" ON public.social_determinants_assessment;
CREATE POLICY "Healthcare providers can view patient SDOH assessments"
  ON public.social_determinants_assessment FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = social_determinants_assessment.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS " Anyone can view active community resources" ON public.community_resources;
CREATE POLICY " Anyone can view active community resources"
  ON public.community_resources FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS " Admins can manage community resources" ON public.community_resources;
CREATE POLICY " Admins can manage community resources"
  ON public.community_resources FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Patients can view own resource referrals" ON public.resource_referrals;
CREATE POLICY "Patients can view own resource referrals"
  ON public.resource_referrals FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Healthcare providers can manage patient resource referrals" ON public.resource_referrals;
CREATE POLICY "Healthcare providers can manage patient resource referrals"
  ON public.resource_referrals FOR ALL
  USING (
    public.is_doctor(auth.uid()) AND (auth.uid() = referring_provider_id OR
     EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = resource_referrals.patient_id AND appointments.doctor_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Researchers can view health equity metrics" ON public.health_equity_metrics;
CREATE POLICY "Researchers can view health equity metrics"
  ON public.health_equity_metrics FOR SELECT
  USING (public.is_admin(auth.uid()) OR public.is_doctor(auth.uid()));

DROP POLICY IF EXISTS " Admins can manage health equity metrics" ON public.health_equity_metrics;
CREATE POLICY " Admins can manage health equity metrics"
  ON public.health_equity_metrics FOR ALL
  USING (public.is_admin(auth.uid()));

-- Triggers for Social Determinants Tables
DROP TRIGGER IF EXISTS update_sdoh_assessment_updated_at ON public.social_determinants_assessment;
CREATE TRIGGER update_sdoh_assessment_updated_at BEFORE UPDATE ON public.social_determinants_assessment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_resources_updated_at ON public.community_resources;
CREATE TRIGGER update_community_resources_updated_at BEFORE UPDATE ON public.community_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_resource_referrals_updated_at ON public.resource_referrals;
CREATE TRIGGER update_resource_referrals_updated_at BEFORE UPDATE ON public.resource_referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ============================================================

-- 19. ADVANCED AI AND MACHINE LEARNING (2026 ENHANCEMENT)
-- Next-generation AI models, federated learning, and explainable AI -- ============================================================

-- AI Model Versions table moved earlier to resolve forward references

-- Federated Learning Nodes (Distributed learning infrastructure)
CREATE TABLE IF NOT EXISTS public.federated_learning_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Node identification
  node_name VARCHAR(255) NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.fhir_organizations(id),
  node_type VARCHAR(50), -- hospital, clinic, research_center, edge_device
  
  -- Technical specifications
  compute_capacity JSONB, -- CPU, GPU, memory specifications
  storage_capacity_gb INTEGER,
  network_bandwidth_mbps INTEGER,
  security_level VARCHAR(50), -- basic, enhanced, maximum
  
  -- Geographic information
  country VARCHAR(100),
  region VARCHAR(100),
  timezone VARCHAR(50),
  
  -- Participation status
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, maintenance, suspended
  last_heartbeat TIMESTAMPTZ,
  uptime_percentage DECIMAL(5,2),
  
  -- Data characteristics
  patient_count INTEGER,
  data_types TEXT[], -- imaging, ehr, genomics, wearables
  data_quality_score DECIMAL(5,2), -- 1-10 scale
  
  -- Privacy and security
  differential_privacy_enabled BOOLEAN DEFAULT TRUE,
  privacy_budget DECIMAL(10,6), -- Epsilon value for differential privacy
  encryption_method VARCHAR(100),
  secure_aggregation BOOLEAN DEFAULT TRUE,
  
  -- Performance metrics
  training_rounds_participated INTEGER DEFAULT 0,
  average_training_time_minutes DECIMAL(10,2),
  model_accuracy_contribution DECIMAL(8,6),
  
  -- Compliance
  data_governance_certified BOOLEAN DEFAULT FALSE,
  hipaa_compliant BOOLEAN DEFAULT FALSE,
  gdpr_compliant BOOLEAN DEFAULT FALSE,
  
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Federated Learning Experiments (Collaborative training sessions)
CREATE TABLE IF NOT EXISTS public.federated_learning_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Experiment identification
  experiment_name VARCHAR(255) NOT NULL,
  model_id UUID REFERENCES public.ai_models(id),
  coordinator_node_id UUID REFERENCES public.federated_learning_nodes(id),
  
  -- Experiment configuration
  objective TEXT NOT NULL,
  target_accuracy DECIMAL(8,6),
  max_rounds INTEGER DEFAULT 100,
  min_participants INTEGER DEFAULT 3,
  
  -- Privacy settings
  differential_privacy_epsilon DECIMAL(10,6),
  secure_aggregation_enabled BOOLEAN DEFAULT TRUE,
  homomorphic_encryption BOOLEAN DEFAULT FALSE,
  
  -- Participant selection
  participant_criteria JSONB, -- Selection criteria for nodes
  selected_nodes UUID[], -- Array of participating node IDs
  minimum_data_size INTEGER,
  
  -- Training parameters
  learning_rate DECIMAL(12,10),
  batch_size INTEGER,
  local_epochs INTEGER DEFAULT 1,
  aggregation_method VARCHAR(100), -- fedavg, fedprox, scaffold
  
  -- Experiment status
  status VARCHAR(50) DEFAULT 'planned', -- planned, running, completed, failed, cancelled
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  current_round INTEGER DEFAULT 0,
  
  -- Results
  final_accuracy DECIMAL(8,6),
  convergence_round INTEGER,
  total_training_time_hours DECIMAL(10,2),
  
  -- Model artifacts
  global_model_path TEXT,
  model_checkpoints JSONB, -- Paths to round-by-round checkpoints
  
  -- Analysis
  convergence_analysis JSONB,
  participant_contributions JSONB,
  privacy_analysis JSONB,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Model Versions ( Advanced model versioning and lifecycle management)
CREATE TABLE IF NOT EXISTS public.ai_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.ai_models(id) ON DELETE CASCADE,
  
  -- Version information
  version_number VARCHAR(50) NOT NULL,
  version_type VARCHAR(50), -- major, minor, patch, hotfix
  release_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Model artifacts
  model_file_path TEXT NOT NULL,
  model_size_bytes BIGINT,
  model_checksum VARCHAR(128), -- SH -256 hash for integrity
  
  -- Training information
  training_dataset_id UUID,
  training_start_date TIMESTAMPTZ,
  training_end_date TIMESTAMPTZ,
  training_duration_hours DECIMAL(10,2),
  training_compute_cost DECIMAL(12,2),
  
  -- Model architecture
  architecture_type VARCHAR(100), -- transformer, cnn, rnn, ensemble
  model_parameters BIGINT, -- Number of parameters
  model_size_mb DECIMAL(10,2),
  framework VARCHAR(50), -- pytorch, tensorflow, jax
  framework_version VARCHAR(50),
  
  -- Performance metrics
  validation_accuracy DECIMAL(8,6),
  validation_precision DECIMAL(8,6),
  validation_recall DECIMAL(8,6),
  validation_f1_score DECIMAL(8,6),
  validation_auc DECIMAL(8,6),
  validation_loss DECIMAL(12,8),
  
  -- Clinical validation
  clinical_validation_status VARCHAR(50), -- pending, in_progress, passed, failed
  clinical_validation_date DATE,
  clinical_validation_notes TEXT,
  sensitivity DECIMAL(8,6), -- True positive rate
  specificity DECIMAL(8,6), -- True negative rate
  ppv DECIMAL(8,6), -- Positive predictive value
  npv DECIMAL(8,6), -- Negative predictive value
  
  -- Regulatory compliance
  fda_status VARCHAR(50), -- not_submitted, submitted, approved, rejected
  ce_marking BOOLEAN DEFAULT FALSE,
  iso_compliance VARCHAR(100),
  bias_testing_completed BOOLEAN DEFAULT FALSE,
  fairness_metrics JSONB,
  
  -- Deployment information
  deployment_status VARCHAR(50) DEFAULT 'development',
  deployment_date TIMESTAMPTZ,
  rollback_version VARCHAR(50), -- Previous version to rollback to
  
  -- Change log
  changes_from_previous TEXT,
  breaking_changes BOOLEAN DEFAULT FALSE,
  migration_required BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approval_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(model_id, version_number)
);

-- Explainable AI Results (X I explanations for model predictions)
CREATE TABLE IF NOT EXISTS public.explainable_ai_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- associated prediction
  prediction_id UUID, -- Links to scans, ai_analysis_results, etc.
  model_version_id UUID REFERENCES public.ai_model_versions(id),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Explanation metadata
  explanation_method VARCHAR(100), -- lime, shap, grad_cam, integrated_gradients
  explanation_type VARCHAR(50), -- local, global, counterfactual
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Feature importance
  feature_importances JSONB, -- Feature names and importance scores
  top_features TEXT[], -- Most important features in order
  feature_interactions JSONB, -- Interaction effects between features
  
  -- Visual explanations
  heatmap_url TEXT, -- ttention/saliency maps for images
  overlay_image_url TEXT, -- Original image with explanation overlay
  region_annotations JSONB, -- Bounding boxes or segmentation masks
  
  -- Textual explanations
  natural_language_explanation TEXT,
  confidence_explanation TEXT,
  uncertainty_explanation TEXT,
  
  -- Counterfactual analysis
  counterfactual_examples JSONB, -- What would change the prediction
  decision_boundary_distance DECIMAL(12,8),
  
  -- Model behavior insights
  prediction_confidence DECIMAL(8,6),
  model_uncertainty DECIMAL(8,6),
  prediction_stability DECIMAL(8,6), -- Consistency across similar inputs
  
  -- Clinical context
  clinical_relevance_score DECIMAL(5,2), -- 1-10 scale
  actionable_insights TEXT[],
  recommended_follow_up TEXT,
  
  -- Quality metrics
  explanation_quality_score DECIMAL(5,2), -- 1-10 scale
  user_feedback_rating INTEGER, -- 1-5 stars from clinicians
  explanation_used BOOLEAN DEFAULT FALSE,
  
  -- Compliance and audit
  explanation_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Model Performance Monitoring (Continuous monitoring in production)
CREATE TABLE IF NOT EXISTS public.ai_model_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id UUID NOT NULL REFERENCES public.ai_model_versions(id),
  
  -- Monitoring period
  monitoring_date DATE NOT NULL DEFAULT CURRENT_DATE,
  monitoring_period VARCHAR(50), -- daily, weekly, monthly
  
  -- Usage statistics
  total_predictions INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  failed_predictions INTEGER DEFAULT 0,
  average_inference_time_ms DECIMAL(10,4),
  
  -- Performance metrics
  accuracy DECIMAL(8,6),
  precision DECIMAL(8,6),
  recall DECIMAL(8,6),
  f1_score DECIMAL(8,6),
  auc DECIMAL(8,6),
  
  -- Data drift detection
  input_drift_score DECIMAL(8,6), -- 0-1 score indicating distribution shift
  prediction_drift_score DECIMAL(8,6),
  drift_alert_triggered BOOLEAN DEFAULT FALSE,
  
  -- Bias monitoring
  demographic_parity DECIMAL(8,6), -- Fairness across demographic groups
  equalized_odds DECIMAL(8,6),
  bias_alert_triggered BOOLEAN DEFAULT FALSE,
  
  -- Error analysis
  error_rate_by_category JSONB, -- Error rates for different prediction categories
  common_failure_modes TEXT[],
  edge_cases_detected INTEGER DEFAULT 0,
  
  -- Resource utilization
  cpu_usage_percent DECIMAL(5,2),
  memory_usage_gb DECIMAL(10,2),
  gpu_usage_percent DECIMAL(5,2),
  storage_usage_gb DECIMAL(10,2),
  
  -- Alerts and notifications
  performance_alerts TEXT[],
  alert_severity VARCHAR(50), -- low, medium, high, critical
  alert_acknowledged BOOLEAN DEFAULT FALSE,
  
  -- Recommendations
  retraining_recommended BOOLEAN DEFAULT FALSE,
  model_update_recommended BOOLEAN DEFAULT FALSE,
  deployment_action_needed VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for AI/ML Tables
CREATE INDEX IF NOT EXISTS idx_ai_model_versions_model ON public.ai_model_versions(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_model_versions_version ON public.ai_model_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_ai_model_versions_status ON public.ai_model_versions(deployment_status);
CREATE INDEX IF NOT EXISTS idx_federated_nodes_status ON public.federated_learning_nodes(status);
CREATE INDEX IF NOT EXISTS idx_federated_nodes_org ON public.federated_learning_nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_federated_experiments_status ON public.federated_learning_experiments(status);
CREATE INDEX IF NOT EXISTS idx_federated_experiments_model ON public.federated_learning_experiments(model_id);
CREATE INDEX IF NOT EXISTS idx_explainable_ai_patient ON public.explainable_ai_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_explainable_ai_model ON public.explainable_ai_results(model_version_id);
CREATE INDEX IF NOT EXISTS idx_explainable_ai_method ON public.explainable_ai_results(explanation_method);
CREATE INDEX IF NOT EXISTS idx_ai_monitoring_model ON public.ai_model_monitoring(model_version_id);
CREATE INDEX IF NOT EXISTS idx_ai_monitoring_date ON public.ai_model_monitoring(monitoring_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_monitoring_alerts ON public.ai_model_monitoring(drift_alert_triggered, bias_alert_triggered);

-- RLS Policies for AI/ML Tables
 ALTER TABLE public.ai_model_versions ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.federated_learning_nodes ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.federated_learning_experiments ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.explainable_ai_results ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.ai_model_monitoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS " I researchers can view model versions" ON public.ai_model_versions;
CREATE POLICY " I researchers can view model versions"
  ON public.ai_model_versions FOR SELECT
  USING (public.is_admin(auth.uid()) OR public.is_doctor(auth.uid()));

DROP POLICY IF EXISTS " I researchers can manage model versions" ON public.ai_model_versions;
CREATE POLICY " I researchers can manage model versions"
  ON public.ai_model_versions FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS " Anyone can view ai_model_versions" ON public.ai_model_versions;
CREATE POLICY " Anyone can view ai_model_versions"
  ON public.ai_model_versions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS " Admins can manage ai_model_versions" ON public.ai_model_versions;
CREATE POLICY " Admins can manage ai_model_versions"
  ON public.ai_model_versions FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS " Admins can manage federated learning nodes" ON public.federated_learning_nodes;
CREATE POLICY " Admins can manage federated learning nodes"
  ON public.federated_learning_nodes FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Researchers can view federated learning nodes" ON public.federated_learning_nodes;
CREATE POLICY "Researchers can view federated learning nodes"
  ON public.federated_learning_nodes FOR SELECT
  USING (public.is_admin(auth.uid()) OR public.is_doctor(auth.uid()));

DROP POLICY IF EXISTS " Admins can manage federated learning experiments" ON public.federated_learning_experiments;
CREATE POLICY " Admins can manage federated learning experiments"
  ON public.federated_learning_experiments FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Researchers can view federated learning experiments" ON public.federated_learning_experiments;
CREATE POLICY "Researchers can view federated learning experiments"
  ON public.federated_learning_experiments FOR SELECT
  USING (public.is_admin(auth.uid()) OR public.is_doctor(auth.uid()));

DROP POLICY IF EXISTS "Patients can view own AI explanations" ON public.explainable_ai_results;
CREATE POLICY "Patients can view own AI explanations"
  ON public.explainable_ai_results FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view patient AI explanations" ON public.explainable_ai_results;
CREATE POLICY "Doctors can view patient AI explanations"
  ON public.explainable_ai_results FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = explainable_ai_results.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can create AI explanations" ON public.explainable_ai_results;
CREATE POLICY "System can create AI explanations"
  ON public.explainable_ai_results FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS " Admins can view AI model monitoring" ON public.ai_model_monitoring;
CREATE POLICY " Admins can view AI model monitoring"
  ON public.ai_model_monitoring FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can create AI monitoring records" ON public.ai_model_monitoring;
CREATE POLICY "System can create AI monitoring records"
  ON public.ai_model_monitoring FOR INSERT
  WITH CHECK (true);

-- Triggers for AI/ML Tables
DROP TRIGGER IF EXISTS update_ai_model_versions_updated_at ON public.ai_model_versions;
CREATE TRIGGER update_ai_model_versions_updated_at BEFORE UPDATE ON public.ai_model_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_federated_learning_nodes_updated_at ON public.federated_learning_nodes;
CREATE TRIGGER update_federated_learning_nodes_updated_at BEFORE UPDATE ON public.federated_learning_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_federated_learning_experiments_updated_at ON public.federated_learning_experiments;
CREATE TRIGGER update_federated_learning_experiments_updated_at BEFORE UPDATE ON public.federated_learning_experiments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ============================================================

-- 20. BLOCKCHAIN AND INTEROPERABILITY (2026 ENHANCEMENT)
-- Decentralized health records and cross-system interoperability
-- ============================================================

-- Blockchain Health Records (Immutable health record references)
CREATE TABLE IF NOT EXISTS public.blockchain_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Blockchain information
  blockchain_network VARCHAR(100), -- ethereum, hyperledger_fabric, polygon
  contract_address VARCHAR(100), -- Smart contract address
  transaction_hash VARCHAR(128) NOT NULL UNIQUE, -- Blockchain transaction hash
  block_number BIGINT,
  block_timestamp TIMESTAMPTZ,
  
  -- Record metadata
  record_type VARCHAR(100), -- medical_record, prescription, lab_result, imaging_study
  record_id UUID, -- Reference to local record
  record_hash VARCHAR(128), -- SH -256 hash of record content
  
  -- access control
  access_permissions JSONB, -- Who can access this record
  encryption_key_id VARCHAR(128), -- Reference to encryption key
  data_location VARCHAR(255), -- IPFS hash or storage location
  
  -- Interoperability
  fhir_resource_type VARCHAR(100), -- FHIR resource type
  fhir_resource_id VARCHAR(100),
  hl7_message_type VARCHAR(50),
  
  -- Provenance
  created_by_organization UUID REFERENCES public.fhir_organizations(id),
  attested_by UUID REFERENCES auth.users(id),
  attestation_signature TEXT,
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  verification_method VARCHAR(100),
  
  -- Gas and costs
  gas_used BIGINT,
  transaction_cost_wei BIGINT,
  transaction_cost_usd DECIMAL(12,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FHIR Resource Mappings (Standardized healthcare data exchange)
CREATE TABLE IF NOT EXISTS public.fhir_resource_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Local resource information
  local_table_name VARCHAR(100) NOT NULL,
  local_record_id UUID NOT NULL,
  
  -- FHIR resource details
  fhir_resource_type VARCHAR(100) NOT NULL, -- Patient, Observation, DiagnosticReport, etc.
  fhir_resource_id VARCHAR(100) NOT NULL,
  fhir_version VARCHAR(20) DEFAULT 'R4',
  
  -- Resource content
  fhir_json JSONB NOT NULL, -- Complete FHIR resource in JSON format
  fhir_xml TEXT, -- FHIR resource in XML format (optional)
  
  -- Metadata
  profile_url TEXT, -- FHIR profile URL if using specific profile
  meta_version_id VARCHAR(100),
  meta_last_updated TIMESTAMPTZ DEFAULT NOW(),
  meta_source VARCHAR(255),
  
  -- Validation
  validation_status VARCHAR(50) DEFAULT 'pending', -- pending, valid, invalid
  validation_errors JSONB,
  validation_warnings JSONB,
  
  -- Synchronization
  sync_status VARCHAR(50) DEFAULT 'pending', -- pending, synced, failed
  last_sync_attempt TIMESTAMPTZ,
  sync_error_message TEXT,
  external_system_id VARCHAR(255), -- ID in external FHIR server
  
  -- Provenance
  created_by_system VARCHAR(255),
  organization_id UUID REFERENCES public.fhir_organizations(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(local_table_name, local_record_id, fhir_resource_type)
);

-- Interoperability Endpoints (External system connections)
CREATE TABLE IF NOT EXISTS public.interoperability_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Endpoint identification
  endpoint_name VARCHAR(255) NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.fhir_organizations(id),
  endpoint_type VARCHAR(100), -- fhir_r4, hl7_v2, hl7_v3, cda, dicom
  
  -- Connection details
  base_url TEXT NOT NULL,
  authentication_type VARCHAR(100), -- oauth2, basic_auth, api_key, mutual_tls
  authentication_config JSONB, -- uth configuration (encrypted)
  
  -- Capabilities
  supported_resources TEXT[], -- FHIR resources or HL7 message types
  supported_operations TEXT[], -- read, write, search, etc.
  supported_formats TEXT[], -- json, xml, hl7
  
  -- SM RT on FHIR
  smart_enabled BOOLEAN DEFAULT FALSE,
  authorization_endpoint TEXT,
  token_endpoint TEXT,
  introspection_endpoint TEXT,
  
  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  burst_limit INTEGER DEFAULT 10,
  
  -- Status and monitoring
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, maintenance, error
  last_successful_connection TIMESTAMPTZ,
  last_error_message TEXT,
  uptime_percentage DECIMAL(5,2),
  
  -- Data exchange statistics
  total_requests_sent INTEGER DEFAULT 0,
  total_responses_received INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  average_response_time_ms DECIMAL(10,2),
  
  -- Security
  tls_version VARCHAR(20),
  certificate_fingerprint VARCHAR(128),
  certificate_expiry_date DATE,
  
  -- Compliance
  hipaa_compliant BOOLEAN DEFAULT FALSE,
  gdpr_compliant BOOLEAN DEFAULT FALSE,
  data_processing_agreement BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Exchange Logs ( Audit trail for interoperability)
CREATE TABLE IF NOT EXISTS public.data_exchange_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Exchange details
  endpoint_id UUID REFERENCES public.interoperability_endpoints(id),
  exchange_type VARCHAR(50), -- inbound, outbound
  operation VARCHAR(100), -- create, read, update, delete, search
  
  -- Request information
  request_id VARCHAR(255), -- Unique request identifier
  request_timestamp TIMESTAMPTZ DEFAULT NOW(),
  request_method VARCHAR(10), -- GET, POST, PUT, DELETE
  request_url TEXT,
  request_headers JSONB,
  request_body_size_bytes INTEGER,
  
  -- Response information
  response_timestamp TIMESTAMPTZ,
  response_status_code INTEGER,
  response_headers JSONB,
  response_body_size_bytes INTEGER,
  response_time_ms INTEGER,
  
  -- Data details
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  patient_id UUID REFERENCES auth.users(id),
  
  -- Success/failure
  success BOOLEAN DEFAULT FALSE,
  error_code VARCHAR(100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Security and compliance
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  authorization_method VARCHAR(100),
  
  -- Data sensitivity
  contains_phi BOOLEAN DEFAULT TRUE,
  data_classification VARCHAR(50), -- public, internal, confidential, restricted
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consent Management for Data Sharing
CREATE TABLE IF NOT EXISTS public.data_sharing_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Consent details
  consent_type VARCHAR(100), -- research, treatment, public_health, quality_improvement
  purpose_of_use TEXT NOT NULL,
  data_categories TEXT[], -- demographics, diagnoses, medications, lab_results, imaging
  
  -- Recipient information
  recipient_organization_id UUID REFERENCES public.fhir_organizations(id),
  recipient_name VARCHAR(255),
  recipient_type VARCHAR(100), -- healthcare_provider, researcher, public_health_agency
  
  -- Consent scope
  geographic_scope VARCHAR(100), -- local, national, international
  time_scope VARCHAR(100), -- one_time, ongoing, limited_duration
  
  -- Consent status
  consent_status VARCHAR(50) DEFAULT 'active', -- active, withdrawn, expired, suspended
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id), -- Who granted (patient or authorized representative)
  
  -- Expiration and withdrawal
  expires_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT,
  
  -- Legal basis (GDPR)
  legal_basis VARCHAR(100), -- consent, legitimate_interest, vital_interests, public_task
  
  -- Restrictions and conditions
  data_minimization_applied BOOLEAN DEFAULT TRUE,
  anonymization_required BOOLEAN DEFAULT FALSE,
  geographic_restrictions TEXT[],
  use_restrictions TEXT[],
  
  -- Audit and compliance
  consent_document_url TEXT,
  digital_signature TEXT,
  witness_signature TEXT,
  consent_version VARCHAR(50),
  
  -- Blockchain integration
  blockchain_transaction_hash VARCHAR(128),
  immutable_consent_hash VARCHAR(128),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Smart Contracts (Healthcare automation)
CREATE TABLE IF NOT EXISTS public.smart_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contract identification
  contract_name VARCHAR(255) NOT NULL,
  contract_type VARCHAR(100), -- consent_management, payment_automation, data_sharing, insurance_claim
  blockchain_network VARCHAR(100),
  contract_address VARCHAR(100) NOT NULL,
  
  -- Contract details
  contract_abi JSONB, -- pplication Binary Interface
  contract_bytecode TEXT,
  source_code TEXT,
  compiler_version VARCHAR(50),
  
  -- Deployment information
  deployed_by UUID REFERENCES auth.users(id),
  deployment_transaction_hash VARCHAR(128),
  deployment_block_number BIGINT,
  deployment_date TIMESTAMPTZ,
  deployment_cost_wei BIGINT,
  
  -- Contract state
  status VARCHAR(50) DEFAULT 'active', -- active, paused, deprecated, destroyed
  current_version VARCHAR(50),
  upgrade_proxy_address VARCHAR(100), -- For upgradeable contracts
  
  -- Functionality
  functions_available TEXT[], -- List of available contract functions
  events_emitted TEXT[], -- List of events the contract emits
  permissions_required TEXT[], -- Required permissions to interact
  
  -- Usage statistics
  total_transactions INTEGER DEFAULT 0,
  total_gas_used BIGINT DEFAULT 0,
  total_cost_wei BIGINT DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  
  -- Security
  audit_status VARCHAR(50), -- pending, in_progress, passed, failed
  audit_report_url TEXT,
  security_score INTEGER, -- 1-100 security rating
  vulnerabilities_found INTEGER DEFAULT 0,
  
  -- Compliance
  regulatory_approval VARCHAR(100),
  compliance_frameworks TEXT[], -- HIPAA, GDPR, SOX, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Blockchain/Interoperability Tables
CREATE INDEX IF NOT EXISTS idx_blockchain_records_patient ON public.blockchain_health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_records_hash ON public.blockchain_health_records(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_records_type ON public.blockchain_health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_fhir_mappings_local ON public.fhir_resource_mappings(local_table_name, local_record_id);
CREATE INDEX IF NOT EXISTS idx_fhir_mappings_resource ON public.fhir_resource_mappings(fhir_resource_type, fhir_resource_id);
CREATE INDEX IF NOT EXISTS idx_fhir_mappings_sync ON public.fhir_resource_mappings(sync_status);
CREATE INDEX IF NOT EXISTS idx_interop_endpoints_status ON public.interoperability_endpoints(status);
CREATE INDEX IF NOT EXISTS idx_interop_endpoints_org ON public.interoperability_endpoints(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_exchange_logs_endpoint ON public.data_exchange_logs(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_data_exchange_logs_timestamp ON public.data_exchange_logs(request_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_data_exchange_logs_patient ON public.data_exchange_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_data_sharing_consents_patient ON public.data_sharing_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_data_sharing_consents_status ON public.data_sharing_consents(consent_status);
CREATE INDEX IF NOT EXISTS idx_data_sharing_consents_org ON public.data_sharing_consents(recipient_organization_id);
CREATE INDEX IF NOT EXISTS idx_smart_contracts_address ON public.smart_contracts(contract_address);
CREATE INDEX IF NOT EXISTS idx_smart_contracts_type ON public.smart_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_smart_contracts_status ON public.smart_contracts(status);

-- RLS Policies for Blockchain/Interoperability Tables
 ALTER TABLE public.blockchain_health_records ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.fhir_resource_mappings ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.interoperability_endpoints ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.data_exchange_logs ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.data_sharing_consents ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.smart_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can view own blockchain records" ON public.blockchain_health_records;
CREATE POLICY "Patients can view own blockchain records"
  ON public.blockchain_health_records FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Healthcare providers can view patient blockchain records" ON public.blockchain_health_records;
CREATE POLICY "Healthcare providers can view patient blockchain records"
  ON public.blockchain_health_records FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = blockchain_health_records.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can create blockchain records" ON public.blockchain_health_records;
CREATE POLICY "System can create blockchain records"
  ON public.blockchain_health_records FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS " Admins can manage FHIR mappings" ON public.fhir_resource_mappings;
CREATE POLICY " Admins can manage FHIR mappings"
  ON public.fhir_resource_mappings FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Healthcare providers can view FHIR mappings" ON public.fhir_resource_mappings;
CREATE POLICY "Healthcare providers can view FHIR mappings"
  ON public.fhir_resource_mappings FOR SELECT
  USING (public.is_doctor(auth.uid()) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS " Admins can manage interoperability endpoints" ON public.interoperability_endpoints;
CREATE POLICY " Admins can manage interoperability endpoints"
  ON public.interoperability_endpoints FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Healthcare providers can view interoperability endpoints" ON public.interoperability_endpoints;
CREATE POLICY "Healthcare providers can view interoperability endpoints"
  ON public.interoperability_endpoints FOR SELECT
  USING (public.is_doctor(auth.uid()) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS " Admins can view data exchange logs" ON public.data_exchange_logs;
CREATE POLICY " Admins can view data exchange logs"
  ON public.data_exchange_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can create data exchange logs" ON public.data_exchange_logs;
CREATE POLICY "System can create data exchange logs"
  ON public.data_exchange_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Patients can manage own data sharing consents" ON public.data_sharing_consents;
CREATE POLICY "Patients can manage own data sharing consents"
  ON public.data_sharing_consents FOR ALL
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Healthcare providers can view patient consents" ON public.data_sharing_consents;
CREATE POLICY "Healthcare providers can view patient consents"
  ON public.data_sharing_consents FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = data_sharing_consents.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS " Admins can manage smart contracts" ON public.smart_contracts;
CREATE POLICY " Admins can manage smart contracts"
  ON public.smart_contracts FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Healthcare providers can view smart contracts" ON public.smart_contracts;
CREATE POLICY "Healthcare providers can view smart contracts"
  ON public.smart_contracts FOR SELECT
  USING (public.is_doctor(auth.uid()) OR public.is_admin(auth.uid()));

-- Triggers for Blockchain/Interoperability Tables
DROP TRIGGER IF EXISTS update_fhir_resource_mappings_updated_at ON public.fhir_resource_mappings;
CREATE TRIGGER update_fhir_resource_mappings_updated_at BEFORE UPDATE ON public.fhir_resource_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_interoperability_endpoints_updated_at ON public.interoperability_endpoints;
CREATE TRIGGER update_interoperability_endpoints_updated_at BEFORE UPDATE ON public.interoperability_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_sharing_consents_updated_at ON public.data_sharing_consents;
CREATE TRIGGER update_data_sharing_consents_updated_at BEFORE UPDATE ON public.data_sharing_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_smart_contracts_updated_at ON public.smart_contracts;
CREATE TRIGGER update_smart_contracts_updated_at BEFORE UPDATE ON public.smart_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
