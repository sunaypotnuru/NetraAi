-- ============================================================
-- NETRA AI COMPLETE SCHEMA v3.2.0 — PART 05
-- Section : RLS_Policies_Part_B
-- Lines   : 6287-7873 in NETRA_COMPLETE_SCHEMA.sql
-- SAFE TO RE-RUN: All objects use DROP IF EXISTS guards
-- ============================================================

-- ============================================================


SELECT 
  '========================================' as info
UNION ALL
SELECT '4. EXISTING FUNCTIONS CHECK'
UNION ALL
SELECT '========================================';

SELECT 
  routine_name as function_name,
  routine_type as type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name IN (
  'is_admin', 'is_doctor', 'is_patient',
  'update_updated_at_column', 'award_points',
  'update_login_streak', 'get_user_stats'
)
ORDER BY routine_name;

-- ============================================================

-- 5. CHECK EXISTING TRIGGERS
-- ============================================================


SELECT 
  '========================================' as info
UNION ALL
SELECT '5. EXISTING TRIGGERS CHECK'
UNION ALL
SELECT '========================================';

SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;



-- FILE: 02_core_tables.sql
-- ============================================================

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================


 ALTER TABLE public.profiles_patient ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.profiles_doctor ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.soap_notes ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on new FHIR tables
 ALTER TABLE public.fhir_organizations ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.fhir_practitioners ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.fhir_patients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on healthcare tables
 ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.patient_insurance ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.medical_conditions ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.patient_medical_history ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.patient_allergies ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.medications_reference ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.patient_medications ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.lab_tests_reference ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.patient_lab_results ENABLE ROW LEVEL SECURITY;

-- Enable RLS on appointment management tables
 ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.doctor_time_slots ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.scheduling_rules ENABLE ROW LEVEL SECURITY;

-- Enable RLS on imaging and AI tables
 ALTER TABLE public.medical_imaging_studies ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;

-- Enable RLS on notification tables
 ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.notifications_enhanced ENABLE ROW LEVEL SECURITY;

-- Enable RLS on family and relationship tables
 ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.family_medical_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on billing and payment tables
 ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.patient_statements ENABLE ROW LEVEL SECURITY;

-- Enable RLS on telemedicine tables
 ALTER TABLE public.video_consultations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.waiting_room ENABLE ROW LEVEL SECURITY;

-- Enable RLS on analytics tables
 ALTER TABLE public.analytics_dashboards ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.healthcare_kpis ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.population_health_metrics ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.clinical_quality_measures ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.clinical_decision_support_rules ENABLE ROW LEVEL SECURITY;

-- Enable RLS on security and compliance tables
 ALTER TABLE public.data_access_audit ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing tables
 ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.login_streaks ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.shared_achievements ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.prescription_templates ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.waiting_room ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.pro_questionnaires ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.pro_submissions ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.follow_up_templates ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.follow_up_surveys ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.video_recordings ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.mental_health_screenings ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.voice_call_logs ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.vitals_log ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.patient_exercises ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.symptom_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================

-- 5. CREATE RLS POLICIES
-- ============================================================


-- ---------------------------------------------------------------------
-- 5.1 Helper functions for RLS
-- ---------------------------------------------------------------------


-- Check if user is a patient
CREATE OR REPLACE FUNCTION public.is_patient(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles_patient WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 5.2 Profiles RLS Policies
-- ---------------------------------------------------------------------

-- Patients can view and update their own profile
DROP POLICY IF EXISTS "Patients can view own profile" ON public.profiles_patient;
CREATE POLICY "Patients can view own profile"
  ON public.profiles_patient FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Patients can update own profile" ON public.profiles_patient;
CREATE POLICY "Patients can update own profile"
  ON public.profiles_patient FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Patients can insert own profile" ON public.profiles_patient;
CREATE POLICY "Patients can insert own profile"
  ON public.profiles_patient FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Doctors can view and update their own profile
DROP POLICY IF EXISTS "Doctors can view own profile" ON public.profiles_doctor;
CREATE POLICY "Doctors can view own profile"
  ON public.profiles_doctor FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Doctors can update own profile" ON public.profiles_doctor;
CREATE POLICY "Doctors can update own profile"
  ON public.profiles_doctor FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Doctors can insert own profile" ON public.profiles_doctor;
CREATE POLICY "Doctors can insert own profile"
  ON public.profiles_doctor FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Doctors can view patient profiles (for appointments)
DROP POLICY IF EXISTS "Doctors can view patient profiles" ON public.profiles_patient;
CREATE POLICY "Doctors can view patient profiles"
  ON public.profiles_patient FOR SELECT
  USING (public.is_doctor(auth.uid()));

-- Patients can view doctor profiles
DROP POLICY IF EXISTS "Patients can view doctor profiles" ON public.profiles_doctor;
CREATE POLICY "Patients can view doctor profiles"
  ON public.profiles_doctor FOR SELECT
  USING (public.is_patient(auth.uid()));

-- Admins can view all profiles
DROP POLICY IF EXISTS " Admins can view all patient profiles" ON public.profiles_patient;
CREATE POLICY " Admins can view all patient profiles"
  ON public.profiles_patient FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS " Admins can view all doctor profiles" ON public.profiles_doctor;
CREATE POLICY " Admins can view all doctor profiles"
  ON public.profiles_doctor FOR ALL
  USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 5.3 Appointments RLS Policies
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;
CREATE POLICY "Patients can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view own appointments" ON public.appointments;
CREATE POLICY "Doctors can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
CREATE POLICY "Patients can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can update own appointments" ON public.appointments;
CREATE POLICY "Patients can update own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can update appointments" ON public.appointments;
CREATE POLICY "Doctors can update appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS " Admins can manage all appointments" ON public.appointments;
CREATE POLICY " Admins can manage all appointments"
  ON public.appointments FOR ALL
  USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 5.4 Scans RLS Policies
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Patients can view own scans" ON public.scans;
CREATE POLICY "Patients can view own scans"
  ON public.scans FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can create own scans" ON public.scans;
CREATE POLICY "Patients can create own scans"
  ON public.scans FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view patient scans" ON public.scans;
CREATE POLICY "Doctors can view patient scans"
  ON public.scans FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = scans.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS " Admins can manage all scans" ON public.scans;
CREATE POLICY " Admins can manage all scans"
  ON public.scans FOR ALL
  USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 5.5 Prescriptions RLS Policies
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Patients can view own prescriptions" ON public.prescriptions;
CREATE POLICY "Patients can view own prescriptions"
  ON public.prescriptions FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view own prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors can view own prescriptions"
  ON public.prescriptions FOR SELECT
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors can create prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors can create prescriptions"
  ON public.prescriptions FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors can update own prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors can update own prescriptions"
  ON public.prescriptions FOR UPDATE
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS " Admins can manage all prescriptions" ON public.prescriptions;
CREATE POLICY " Admins can manage all prescriptions"
  ON public.prescriptions FOR ALL
  USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 5.6 Messages RLS Policies
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- ---------------------------------------------------------------------
-- 5.7 Notifications RLS Policies
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 5.8 Documents RLS Policies
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Patients can view own documents" ON public.documents;
CREATE POLICY "Patients can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = ANY(shared_with));

DROP POLICY IF EXISTS "Users can create documents" ON public.documents;
CREATE POLICY "Users can create documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Doctors can view shared documents" ON public.documents;
CREATE POLICY "Doctors can view shared documents"
  ON public.documents FOR SELECT
  USING (public.is_doctor(auth.uid()) AND (is_shared = true OR auth.uid() = ANY(shared_with)));

-- ---------------------------------------------------------------------
-- 5.9 Gamification RLS Policies
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view all achievements" ON public.achievements;
CREATE POLICY "Users can view all achievements"
  ON public.achievements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can view own user_achievements" ON public.user_achievements;
CREATE POLICY "Users can view own user_achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage user_achievements" ON public.user_achievements;
CREATE POLICY "System can manage user_achievements"
  ON public.user_achievements FOR ALL
  USING (true);

DROP POLICY IF EXISTS "Users can view own points" ON public.user_points;
CREATE POLICY "Users can view own points"
  ON public.user_points FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all badges" ON public.badges;
CREATE POLICY "Users can view all badges"
  ON public.badges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can view own user_badges" ON public.user_badges;
CREATE POLICY "Users can view own user_badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all challenges" ON public.challenges;
CREATE POLICY "Users can view all challenges"
  ON public.challenges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can view own user_challenges" ON public.user_challenges;
CREATE POLICY "Users can view own user_challenges"
  ON public.user_challenges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_challenges" ON public.user_challenges;
CREATE POLICY "Users can update own user_challenges"
  ON public.user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own streaks" ON public.login_streaks;
CREATE POLICY "Users can view own streaks"
  ON public.login_streaks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own shared_achievements" ON public.shared_achievements;
CREATE POLICY "Users can view own shared_achievements"
  ON public.shared_achievements FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create shared_achievements" ON public.shared_achievements;
CREATE POLICY "Users can create shared_achievements"
  ON public.shared_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 5.11 Enhanced Healthcare Tables RLS Policies
-- ---------------------------------------------------------------------

-- FHIR Organizations
DROP POLICY IF EXISTS " Anyone can view active organizations" ON public.fhir_organizations;
CREATE POLICY " Anyone can view active organizations"
  ON public.fhir_organizations FOR SELECT
  USING (active = TRUE);

DROP POLICY IF EXISTS " Admins can manage organizations" ON public.fhir_organizations;
CREATE POLICY " Admins can manage organizations"
  ON public.fhir_organizations FOR ALL
  USING (public.is_admin(auth.uid()));

-- FHIR Practitioners
DROP POLICY IF EXISTS "Practitioners can view own FHIR record" ON public.fhir_practitioners;
CREATE POLICY "Practitioners can view own FHIR record"
  ON public.fhir_practitioners FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Practitioners can update own FHIR record" ON public.fhir_practitioners;
CREATE POLICY "Practitioners can update own FHIR record"
  ON public.fhir_practitioners FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS " Anyone can view active practitioners" ON public.fhir_practitioners;
CREATE POLICY " Anyone can view active practitioners"
  ON public.fhir_practitioners FOR SELECT
  USING (active = TRUE);

-- FHIR Patients
DROP POLICY IF EXISTS "Patients can view own FHIR record" ON public.fhir_patients;
CREATE POLICY "Patients can view own FHIR record"
  ON public.fhir_patients FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Patients can update own FHIR record" ON public.fhir_patients;
CREATE POLICY "Patients can update own FHIR record"
  ON public.fhir_patients FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Doctors can view patient FHIR records" ON public.fhir_patients;
CREATE POLICY "Doctors can view patient FHIR records"
  ON public.fhir_patients FOR SELECT
  USING (public.is_doctor(auth.uid()));

-- Insurance Providers
DROP POLICY IF EXISTS " Anyone can view active insurance providers" ON public.insurance_providers;
CREATE POLICY " Anyone can view active insurance providers"
  ON public.insurance_providers FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS " Admins can manage insurance providers" ON public.insurance_providers;
CREATE POLICY " Admins can manage insurance providers"
  ON public.insurance_providers FOR ALL
  USING (public.is_admin(auth.uid()));

-- Patient Insurance
DROP POLICY IF EXISTS "Patients can view own insurance" ON public.patient_insurance;
CREATE POLICY "Patients can view own insurance"
  ON public.patient_insurance FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can manage own insurance" ON public.patient_insurance;
CREATE POLICY "Patients can manage own insurance"
  ON public.patient_insurance FOR ALL
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view patient insurance" ON public.patient_insurance;
CREATE POLICY "Doctors can view patient insurance"
  ON public.patient_insurance FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = patient_insurance.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

-- Medical Conditions
DROP POLICY IF EXISTS " Anyone can view medical conditions" ON public.medical_conditions;
CREATE POLICY " Anyone can view medical conditions"
  ON public.medical_conditions FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS " Admins can manage medical conditions" ON public.medical_conditions;
CREATE POLICY " Admins can manage medical conditions"
  ON public.medical_conditions FOR ALL
  USING (public.is_admin(auth.uid()));

-- Patient Medical History
DROP POLICY IF EXISTS "Patients can view own medical history" ON public.patient_medical_history;
CREATE POLICY "Patients can view own medical history"
  ON public.patient_medical_history FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can manage own medical history" ON public.patient_medical_history;
CREATE POLICY "Patients can manage own medical history"
  ON public.patient_medical_history FOR ALL
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view patient medical history" ON public.patient_medical_history;
CREATE POLICY "Doctors can view patient medical history"
  ON public.patient_medical_history FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = patient_medical_history.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

-- Patient Allergies
DROP POLICY IF EXISTS "Patients can view own allergies" ON public.patient_allergies;
CREATE POLICY "Patients can view own allergies"
  ON public.patient_allergies FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can manage own allergies" ON public.patient_allergies;
CREATE POLICY "Patients can manage own allergies"
  ON public.patient_allergies FOR ALL
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view patient allergies" ON public.patient_allergies;
CREATE POLICY "Doctors can view patient allergies"
  ON public.patient_allergies FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = patient_allergies.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

-- Medications Reference
DROP POLICY IF EXISTS " Anyone can view medications reference" ON public.medications_reference;
CREATE POLICY " Anyone can view medications reference"
  ON public.medications_reference FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS " Admins can manage medications reference" ON public.medications_reference;
CREATE POLICY " Admins can manage medications reference"
  ON public.medications_reference FOR ALL
  USING (public.is_admin(auth.uid()));

-- Patient Medications
DROP POLICY IF EXISTS "Patients can view own medications" ON public.patient_medications;
CREATE POLICY "Patients can view own medications"
  ON public.patient_medications FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can manage own medications" ON public.patient_medications;
CREATE POLICY "Patients can manage own medications"
  ON public.patient_medications FOR ALL
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view patient medications" ON public.patient_medications;
CREATE POLICY "Doctors can view patient medications"
  ON public.patient_medications FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND (auth.uid() = prescribed_by OR
     EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = patient_medications.patient_id AND appointments.doctor_id = auth.uid()
    ))
  );

-- Lab Tests Reference
DROP POLICY IF EXISTS " Anyone can view lab tests reference" ON public.lab_tests_reference;
CREATE POLICY " Anyone can view lab tests reference"
  ON public.lab_tests_reference FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS " Admins can manage lab tests reference" ON public.lab_tests_reference;
CREATE POLICY " Admins can manage lab tests reference"
  ON public.lab_tests_reference FOR ALL
  USING (public.is_admin(auth.uid()));

-- Patient Lab Results
DROP POLICY IF EXISTS "Patients can view own lab results" ON public.patient_lab_results;
CREATE POLICY "Patients can view own lab results"
  ON public.patient_lab_results FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view patient lab results" ON public.patient_lab_results;
CREATE POLICY "Doctors can view patient lab results"
  ON public.patient_lab_results FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND (auth.uid() = ordered_by OR
     EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = patient_lab_results.patient_id AND appointments.doctor_id = auth.uid()
    ))
  );

-- Appointment Types
DROP POLICY IF EXISTS " Anyone can view active appointment types" ON public.appointment_types;
CREATE POLICY " Anyone can view active appointment types"
  ON public.appointment_types FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS " Admins can manage appointment types" ON public.appointment_types;
CREATE POLICY " Admins can manage appointment types"
  ON public.appointment_types FOR ALL
  USING (public.is_admin(auth.uid()));

-- Doctor Time Slots
DROP POLICY IF EXISTS "Doctors can manage own time slots" ON public.doctor_time_slots;
CREATE POLICY "Doctors can manage own time slots"
  ON public.doctor_time_slots FOR ALL
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS " Anyone can view active time slots" ON public.doctor_time_slots;
CREATE POLICY " Anyone can view active time slots"
  ON public.doctor_time_slots FOR SELECT
  USING (is_active = TRUE);

-- Medical Imaging Studies
DROP POLICY IF EXISTS "Patients can view own imaging studies" ON public.medical_imaging_studies;
CREATE POLICY "Patients can view own imaging studies"
  ON public.medical_imaging_studies FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view patient imaging studies" ON public.medical_imaging_studies;
CREATE POLICY "Doctors can view patient imaging studies"
  ON public.medical_imaging_studies FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND (auth.uid() = referring_physician OR auth.uid() = performing_physician OR
     EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = medical_imaging_studies.patient_id AND appointments.doctor_id = auth.uid()
    ))
  );

-- AI Models
DROP POLICY IF EXISTS " Anyone can view active AI models" ON public.ai_models;
CREATE POLICY " Anyone can view active AI models"
  ON public.ai_models FOR SELECT
  USING (deployment_status = 'production');

DROP POLICY IF EXISTS " Admins can manage AI models" ON public.ai_models;
CREATE POLICY " Admins can manage AI models"
  ON public.ai_models FOR ALL
  USING (public.is_admin(auth.uid()));

-- AI Analysis Results
DROP POLICY IF EXISTS "Patients can view own AI analysis results" ON public.ai_analysis_results;
CREATE POLICY "Patients can view own AI analysis results"
  ON public.ai_analysis_results FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view patient AI analysis results" ON public.ai_analysis_results;
CREATE POLICY "Doctors can view patient AI analysis results"
  ON public.ai_analysis_results FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = ai_analysis_results.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

-- Notification Templates
DROP POLICY IF EXISTS " Admins can manage notification templates" ON public.notification_templates;
CREATE POLICY " Admins can manage notification templates"
  ON public.notification_templates FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS " Anyone can view active notification templates" ON public.notification_templates;
CREATE POLICY " Anyone can view active notification templates"
  ON public.notification_templates FOR SELECT
  USING (is_active = TRUE);

-- Enhanced Notifications
DROP POLICY IF EXISTS "Users can view own enhanced notifications" ON public.notifications_enhanced;
CREATE POLICY "Users can view own enhanced notifications"
  ON public.notifications_enhanced FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enhanced notifications" ON public.notifications_enhanced;
CREATE POLICY "Users can update own enhanced notifications"
  ON public.notifications_enhanced FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create enhanced notifications" ON public.notifications_enhanced;
CREATE POLICY "System can create enhanced notifications"
  ON public.notifications_enhanced FOR INSERT
  WITH CHECK (true);

-- Family Relationships
DROP POLICY IF EXISTS "Users can view own family relationships" ON public.family_relationships;
CREATE POLICY "Users can view own family relationships"
  ON public.family_relationships FOR SELECT
  USING (auth.uid() = primary_user_id OR auth.uid() = related_user_id);

DROP POLICY IF EXISTS "Users can manage own family relationships" ON public.family_relationships;
CREATE POLICY "Users can manage own family relationships"
  ON public.family_relationships FOR ALL
  USING (auth.uid() = primary_user_id);

-- Family Medical History
DROP POLICY IF EXISTS "Patients can view own family medical history" ON public.family_medical_history;
CREATE POLICY "Patients can view own family medical history"
  ON public.family_medical_history FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can manage own family medical history" ON public.family_medical_history;
CREATE POLICY "Patients can manage own family medical history"
  ON public.family_medical_history FOR ALL
  USING (auth.uid() = patient_id);

-- Insurance Claims
DROP POLICY IF EXISTS "Patients can view own insurance claims" ON public.insurance_claims;
CREATE POLICY "Patients can view own insurance claims"
  ON public.insurance_claims FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view own insurance claims" ON public.insurance_claims;
CREATE POLICY "Doctors can view own insurance claims"
  ON public.insurance_claims FOR SELECT
  USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Doctors can create insurance claims" ON public.insurance_claims;
CREATE POLICY "Doctors can create insurance claims"
  ON public.insurance_claims FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

-- Payment Transactions
DROP POLICY IF EXISTS "Users can view own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own payment transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "System can create payment transactions" ON public.payment_transactions;
CREATE POLICY "System can create payment transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS " Admins can view all payment transactions" ON public.payment_transactions;
CREATE POLICY " Admins can view all payment transactions"
  ON public.payment_transactions FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Patient Statements
DROP POLICY IF EXISTS "Patients can view own statements" ON public.patient_statements;
CREATE POLICY "Patients can view own statements"
  ON public.patient_statements FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "System can create patient statements" ON public.patient_statements;
CREATE POLICY "System can create patient statements"
  ON public.patient_statements FOR INSERT
  WITH CHECK (true);


-- (Telemedicine Policies relocated to Category 2.12b)

-- Analytics Dashboards
DROP POLICY IF EXISTS "Users can view accessible dashboards" ON public.analytics_dashboards;
CREATE POLICY "Users can view accessible dashboards"
  ON public.analytics_dashboards FOR SELECT
  USING (
    is_public = TRUE OR
    auth.uid() = created_by OR
    auth.uid() = ANY(allowed_users) OR
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage own dashboards" ON public.analytics_dashboards;
CREATE POLICY "Users can manage own dashboards"
  ON public.analytics_dashboards FOR ALL
  USING (auth.uid() = created_by);

-- Healthcare KPIs
DROP POLICY IF EXISTS " Admins can manage healthcare KPIs" ON public.healthcare_kpis;
CREATE POLICY " Admins can manage healthcare KPIs"
  ON public.healthcare_kpis FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS " Anyone can view active KPIs" ON public.healthcare_kpis;
CREATE POLICY " Anyone can view active KPIs"
  ON public.healthcare_kpis FOR SELECT
  USING (is_active = TRUE);

-- Population Health Metrics
DROP POLICY IF EXISTS " Admins can manage population health metrics" ON public.population_health_metrics;
CREATE POLICY " Admins can manage population health metrics"
  ON public.population_health_metrics FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Researchers can view population health metrics" ON public.population_health_metrics;
CREATE POLICY "Researchers can view population health metrics"
  ON public.population_health_metrics FOR SELECT
  USING (public.is_admin(auth.uid()) OR public.is_doctor(auth.uid()));

-- Clinical Quality Measures
DROP POLICY IF EXISTS " Admins can manage clinical quality measures" ON public.clinical_quality_measures;
CREATE POLICY " Admins can manage clinical quality measures"
  ON public.clinical_quality_measures FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Healthcare providers can view quality measures" ON public.clinical_quality_measures;
CREATE POLICY "Healthcare providers can view quality measures"
  ON public.clinical_quality_measures FOR SELECT
  USING (public.is_doctor(auth.uid()) OR public.is_admin(auth.uid()));

-- Clinical Decision Support Rules
DROP POLICY IF EXISTS " Admins can manage CDS rules" ON public.clinical_decision_support_rules;
CREATE POLICY " Admins can manage CDS rules"
  ON public.clinical_decision_support_rules FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Healthcare providers can view active CDS rules" ON public.clinical_decision_support_rules;
CREATE POLICY "Healthcare providers can view active CDS rules"
  ON public.clinical_decision_support_rules FOR SELECT
  USING (is_active = TRUE AND (public.is_doctor(auth.uid()) OR public.is_admin(auth.uid())));

-- Data access Audit
DROP POLICY IF EXISTS " Admins can view data access audit" ON public.data_access_audit;
CREATE POLICY " Admins can view data access audit"
  ON public.data_access_audit FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can create audit records" ON public.data_access_audit;
CREATE POLICY "System can create audit records"
  ON public.data_access_audit FOR INSERT
  WITH CHECK (true);

-- Patient Consents
DROP POLICY IF EXISTS "Patients can view own consents" ON public.patient_consents;
CREATE POLICY "Patients can view own consents"
  ON public.patient_consents FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can manage own consents" ON public.patient_consents;
CREATE POLICY "Patients can manage own consents"
  ON public.patient_consents FOR ALL
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view patient consents" ON public.patient_consents;
CREATE POLICY "Doctors can view patient consents"
  ON public.patient_consents FOR SELECT
  USING (
    public.is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = patient_consents.patient_id AND appointments.doctor_id = auth.uid()
    )
  );

-- PI Rate Limits
DROP POLICY IF EXISTS "Users can view own rate limits" ON public.api_rate_limits;
CREATE POLICY "Users can view own rate limits"
  ON public.api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage rate limits" ON public.api_rate_limits;
CREATE POLICY "System can manage rate limits"
  ON public.api_rate_limits FOR ALL
  USING (true);

-- ---------------------------------------------------------------------
-- 5.12 Enhanced Existing Table Policies
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
CREATE POLICY "Users can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can view own activity_logs" ON public.activity_logs;
CREATE POLICY "Users can view own activity_logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create activity_logs" ON public.activity_logs;
CREATE POLICY "System can create activity_logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS " Admins can view all audit_logs" ON public.audit_logs;
CREATE POLICY " Admins can view all audit_logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert audit_logs" ON public.audit_logs;
CREATE POLICY "System can insert audit_logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics_data;
CREATE POLICY "Users can view own analytics"
  ON public.analytics_data FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = generated_by);

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = generated_by);

DROP POLICY IF EXISTS " Admins can view all reports" ON public.reports;
CREATE POLICY " Admins can view all reports"
  ON public.reports FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own search_history" ON public.search_history;
CREATE POLICY "Users can view own search_history"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create search_history" ON public.search_history;
CREATE POLICY "Users can create search_history"
  ON public.search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own family_members" ON public.family_members;
CREATE POLICY "Users can view own family_members"
  ON public.family_members FOR SELECT
  USING (auth.uid() = primary_user_id);

DROP POLICY IF EXISTS "Users can manage own family_members" ON public.family_members;
CREATE POLICY "Users can manage own family_members"
  ON public.family_members FOR ALL
  USING (auth.uid() = primary_user_id);

DROP POLICY IF EXISTS " Anyone can view team_members" ON public.team_members;
CREATE POLICY " Anyone can view team_members"
  ON public.team_members FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS " Admins can manage team_members" ON public.team_members;
CREATE POLICY " Admins can manage team_members"
  ON public.team_members FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS " Anyone can create contact_messages" ON public.contact_messages;
CREATE POLICY " Anyone can create contact_messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS " Admins can view contact_messages" ON public.contact_messages;
CREATE POLICY " Admins can view contact_messages"
  ON public.contact_messages FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS " Admins can update contact_messages" ON public.contact_messages;
CREATE POLICY " Admins can update contact_messages"
  ON public.contact_messages FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own timeline_events" ON public.timeline_events;
CREATE POLICY "Users can view own timeline_events"
  ON public.timeline_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create timeline_events" ON public.timeline_events;
CREATE POLICY "System can create timeline_events"
  ON public.timeline_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Doctors can view own prescription_templates" ON public.prescription_templates;
CREATE POLICY "Doctors can view own prescription_templates"
  ON public.prescription_templates FOR SELECT
  USING (auth.uid() = doctor_id OR is_public = true);

DROP POLICY IF EXISTS "Doctors can manage own prescription_templates" ON public.prescription_templates;
CREATE POLICY "Doctors can manage own prescription_templates"
  ON public.prescription_templates FOR ALL
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS " Admins can view email_templates" ON public.email_templates;
CREATE POLICY " Admins can view email_templates"
  ON public.email_templates FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS " Admins can manage email_templates" ON public.email_templates;
CREATE POLICY " Admins can manage email_templates"
  ON public.email_templates FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own waitlist" ON public.waitlist;
CREATE POLICY "Users can view own waitlist"
  ON public.waitlist FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Patients can create waitlist" ON public.waitlist;
CREATE POLICY "Patients can create waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Users can view own waiting_queue" ON public.waiting_room;
CREATE POLICY "Users can view own waiting_queue"
  ON public.waiting_room FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Users can view own notification_preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification_preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own notification_preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification_preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Doctors can view own soap_notes" ON public.soap_notes;
CREATE POLICY "Doctors can view own soap_notes"
  ON public.soap_notes FOR SELECT
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Patients can view own soap_notes" ON public.soap_notes;
CREATE POLICY "Patients can view own soap_notes"
  ON public.soap_notes FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can manage own soap_notes" ON public.soap_notes;
CREATE POLICY "Doctors can manage own soap_notes"
  ON public.soap_notes FOR ALL
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS " Admins can view security_events" ON public.security_events;
CREATE POLICY " Admins can view security_events"
  ON public.security_events FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can create security_events" ON public.security_events;
CREATE POLICY "System can create security_events"
  ON public.security_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can create failed_login_attempts" ON public.failed_login_attempts;
CREATE POLICY "System can create failed_login_attempts"
  ON public.failed_login_attempts FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS " Admins can view failed_login_attempts" ON public.failed_login_attempts;
CREATE POLICY " Admins can view failed_login_attempts"
  ON public.failed_login_attempts FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own sessions" ON public.user_sessions;
CREATE POLICY "Users can manage own sessions"
  ON public.user_sessions FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own api_keys" ON public.api_keys;
CREATE POLICY "Users can view own api_keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own api_keys" ON public.api_keys;
CREATE POLICY "Users can manage own api_keys"
  ON public.api_keys FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS " Admins can view newsletters" ON public.newsletters;
CREATE POLICY " Admins can view newsletters"
  ON public.newsletters FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS " Admins can manage newsletters" ON public.newsletters;
CREATE POLICY " Admins can manage newsletters"
  ON public.newsletters FOR ALL
  USING (public.is_admin(auth.uid()));

-- AI Models policies
DROP POLICY IF EXISTS " Anyone can view active ai_models" ON public.ai_models;
CREATE POLICY " Anyone can view active ai_models"
  ON public.ai_models FOR SELECT
  USING (deployment_status = 'production' OR deployment_status = 'testing');

DROP POLICY IF EXISTS " Admins can manage ai_models" ON public.ai_models;
CREATE POLICY " Admins can manage ai_models"
  ON public.ai_models FOR ALL
  USING (public.is_admin(auth.uid()));

-- AI Model Versions policies will be created after table definition

-- Analytics Data policies
DROP POLICY IF EXISTS "Users can view own analytics_data" ON public.analytics_data;
CREATE POLICY "Users can view own analytics_data"
  ON public.analytics_data FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS " Admins can view all analytics_data" ON public.analytics_data;
CREATE POLICY " Admins can view all analytics_data"
  ON public.analytics_data FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert analytics_data" ON public.analytics_data;
CREATE POLICY "System can insert analytics_data"
  ON public.analytics_data FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Doctors can view own pro_questionnaires" ON public.pro_questionnaires;
CREATE POLICY "Doctors can view own pro_questionnaires"
  ON public.pro_questionnaires FOR SELECT
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors can manage own pro_questionnaires" ON public.pro_questionnaires;
CREATE POLICY "Doctors can manage own pro_questionnaires"
  ON public.pro_questionnaires FOR ALL
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Patients can view own pro_submissions" ON public.pro_submissions;
CREATE POLICY "Patients can view own pro_submissions"
  ON public.pro_submissions FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can create pro_submissions" ON public.pro_submissions;
CREATE POLICY "Patients can create pro_submissions"
  ON public.pro_submissions FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view own follow_up_templates" ON public.follow_up_templates;
CREATE POLICY "Doctors can view own follow_up_templates"
  ON public.follow_up_templates FOR SELECT
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors can manage own follow_up_templates" ON public.follow_up_templates;
CREATE POLICY "Doctors can manage own follow_up_templates"
  ON public.follow_up_templates FOR ALL
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Patients can view own follow_up_surveys" ON public.follow_up_surveys;
CREATE POLICY "Patients can view own follow_up_surveys"
  ON public.follow_up_surveys FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can create follow_up_surveys" ON public.follow_up_surveys;
CREATE POLICY "Patients can create follow_up_surveys"
  ON public.follow_up_surveys FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Users can view own video_recordings" ON public.video_recordings;
CREATE POLICY "Users can view own video_recordings"
  ON public.video_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.video_consultations
      WHERE video_consultations.id = video_recordings.consultation_id AND (video_consultations.patient_id = auth.uid() OR video_consultations.doctor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Patients can view own mental_health_screenings" ON public.mental_health_screenings;
CREATE POLICY "Patients can view own mental_health_screenings"
  ON public.mental_health_screenings FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can create mental_health_screenings" ON public.mental_health_screenings;
CREATE POLICY "Patients can create mental_health_screenings"
  ON public.mental_health_screenings FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can view own voice_call_logs" ON public.voice_call_logs;
CREATE POLICY "Patients can view own voice_call_logs"
  ON public.voice_call_logs FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "System can manage voice_call_logs" ON public.voice_call_logs;
CREATE POLICY "System can manage voice_call_logs"
  ON public.voice_call_logs FOR ALL
  USING (true);

DROP POLICY IF EXISTS "Patients can view own vitals_log" ON public.vitals_log;
CREATE POLICY "Patients can view own vitals_log"
  ON public.vitals_log FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can create vitals_log" ON public.vitals_log;
CREATE POLICY "Patients can create vitals_log"
  ON public.vitals_log FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS " Anyone can view exercises" ON public.exercises;
CREATE POLICY " Anyone can view exercises"
  ON public.exercises FOR SELECT
  USING (true);

DROP POLICY IF EXISTS " Admins can manage exercises" ON public.exercises;
CREATE POLICY " Admins can manage exercises"
  ON public.exercises FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Patients can view own patient_exercises" ON public.patient_exercises;
CREATE POLICY "Patients can view own patient_exercises"
  ON public.patient_exercises FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can manage patient_exercises" ON public.patient_exercises;
CREATE POLICY "Doctors can manage patient_exercises"
  ON public.patient_exercises FOR ALL
  USING (auth.uid() = assigned_by);

DROP POLICY IF EXISTS "Patients can view own exercise_sessions" ON public.exercise_sessions;
CREATE POLICY "Patients can view own exercise_sessions"
  ON public.exercise_sessions FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can create exercise_sessions" ON public.exercise_sessions;
CREATE POLICY "Patients can create exercise_sessions"
  ON public.exercise_sessions FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS " Anyone can view symptom_reports" ON public.symptom_reports;
CREATE POLICY " Anyone can view symptom_reports"
  ON public.symptom_reports FOR SELECT
  USING (anonymized = true);

DROP POLICY IF EXISTS "Users can create symptom_reports" ON public.symptom_reports;
CREATE POLICY "Users can create symptom_reports"
  ON public.symptom_reports FOR INSERT
  WITH CHECK (true);

-- ============================================================

-- 6. CREATE TRIGGERS FOR UPDATED_ AT
-- ============================================================



-- pply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_patient_updated_at ON public.profiles_patient;
CREATE TRIGGER update_profiles_patient_updated_at BEFORE UPDATE ON public.profiles_patient
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_doctor_updated_at ON public.profiles_doctor;
CREATE TRIGGER update_profiles_doctor_updated_at BEFORE UPDATE ON public.profiles_doctor
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_scans_updated_at ON public.scans;
CREATE TRIGGER update_scans_updated_at BEFORE UPDATE ON public.scans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON public.prescriptions;
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_soap_notes_updated_at ON public.soap_notes;
CREATE TRIGGER update_soap_notes_updated_at BEFORE UPDATE ON public.soap_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescription_templates_updated_at ON public.prescription_templates;
CREATE TRIGGER update_prescription_templates_updated_at BEFORE UPDATE ON public.prescription_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_waitlist_updated_at ON public.waitlist;
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_points_updated_at ON public.user_points;
CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON public.user_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_challenges_updated_at ON public.user_challenges;
CREATE TRIGGER update_user_challenges_updated_at BEFORE UPDATE ON public.user_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON public.login_streaks;
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON public.login_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_newsletters_updated_at ON public.newsletters;
CREATE TRIGGER update_newsletters_updated_at BEFORE UPDATE ON public.newsletters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_recordings_updated_at ON public.video_recordings;
CREATE TRIGGER update_video_recordings_updated_at BEFORE UPDATE ON public.video_recordings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_members_updated_at ON public.family_members;
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================

-- 7. UTILITY FUNCTIONS
-- ============================================================


-- Get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_appointments', (SELECT COUNT(*) FROM public.appointments WHERE patient_id = user_uuid),
    'total_scans', (SELECT COUNT(*) FROM public.scans WHERE patient_id = user_uuid),
    'total_prescriptions', (SELECT COUNT(*) FROM public.prescriptions WHERE patient_id = user_uuid),
    'total_points', (SELECT COALESCE(SUM(total_points), 0) FROM public.user_points WHERE user_id = user_uuid),
    'current_streak', (SELECT COALESCE(current_streak, 0) FROM public.login_streaks WHERE user_id = user_uuid),
    'achievements_count', (SELECT COUNT(*) FROM public.user_achievements WHERE user_id = user_uuid AND is_completed = true)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean expired sessions
CREATE OR REPLACE FUNCTION public.clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < NOW()
  OR (last_activity_at < NOW() - INTERVAL '30 days');
  
  GET DI GNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log security event
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type VARCHAR,
  p_user_id UUID,
  p_ip_address INET,
  p_user_agent TEXT,
  p_details JSONB
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (event_type, user_id, ip_address, user_agent, details)
  VALUES (p_event_type, p_user_id, p_ip_address, p_user_agent, p_details)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ward points to user
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_achievement_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_points (user_id, total_points, achievement_id)
  VALUES (p_user_id, p_points, p_achievement_id)
  ON CONFLICT (user_id) DO UPDATE
  SET total_points = user_points.total_points + p_points,
    updated_at = NOW();
  
  -- Update profile points
  UPDATE public.profiles_patient
  SET points = points + p_points
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update login streak
CREATE OR REPLACE FUNCTION public.update_login_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_last_login DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  SELECT last_login_date, current_streak, longest_streak
  INTO v_last_login, v_current_streak, v_longest_streak
  FROM public.login_streaks
  WHERE user_id = p_user_id;
  
  IF v_last_login IS NULL THEN
    -- First login
    INSERT INTO public.login_streaks (user_id, current_streak, longest_streak, last_login_date)
    VALUES (p_user_id, 1, 1, CURRENT_DATE);
  ELSIF v_last_login = CURRENT_DATE THEN
    -- lready logged in today
    RETURN;
  ELSIF v_last_login = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day
    UPDATE public.login_streaks
    SET current_streak = current_streak + 1,
      longest_streak = GRE TEST(longest_streak, current_streak + 1),
      last_login_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken
    UPDATE public.login_streaks
    SET current_streak = 1,
      last_login_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Update profile
  UPDATE public.profiles_patient
  SET login_streak = (SELECT current_streak FROM public.login_streaks WHERE user_id = p_user_id),
    last_login_date = CURRENT_DATE
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================

-- 8. UDIT TRIGGER FUNCTION
-- ============================================================


CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, resource_id, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, resource_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, resource_id, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_prescriptions ON public.prescriptions;
CREATE TRIGGER audit_prescriptions AFTER INSERT OR UPDATE OR DELETE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_appointments ON public.appointments;
CREATE TRIGGER audit_appointments AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_scans ON public.scans;
CREATE TRIGGER audit_scans AFTER INSERT OR UPDATE OR DELETE ON public.scans
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_profiles_patient ON public.profiles_patient;
CREATE TRIGGER audit_profiles_patient AFTER UPDATE ON public.profiles_patient
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_profiles_doctor ON public.profiles_doctor;
CREATE TRIGGER audit_profiles_doctor AFTER UPDATE ON public.profiles_doctor
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================

-- 9. GRANT PERMISSIONS
-- ============================================================


-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on all tables to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant insert/update/delete based on RLS policies
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================

-- 10. SEED DATA -- ============================================================


-- ---------------------------------------------------------------------
-- 10.1 Achievements seed data
-- ---------------------------------------------------------------------

INSERT INTO public.achievements (code, name, title, description, icon, points, category, requirement_type, requirement_value, target_value, role_type) VALUES
('first_scan', 'First Scan', 'First Steps', 'Complete your first anemia scan', 'Ã°Å¸â€Â¬', 10, 'health', 'scan_count', 1, 1, 'patient'),
('scan_streak_7', '7-Day Scan Streak', 'Consistent Scanner', 'Complete scans for 7 consecutive days', 'Ã°Å¸â€œâ€¦', 50, 'health', 'scan_streak', 7, 7, 'patient'),
('scan_streak_30', '30-Day Scan Streak', 'Health Champion', 'Complete scans for 30 consecutive days', 'Ã°Å¸Ââ€ ', 200, 'health', 'scan_streak', 30, 30, 'patient'),
('first_appointment', 'First Appointment', 'Getting Started', 'Book your first appointment', 'Ã°Å¸â€œâ€¦', 10, 'engagement', 'appointment_count', 1, 1, 'patient'),
('appointments_10', '10 Appointments', 'Regular Visitor', 'Complete 10 appointments', 'Ã°Å¸Å½Â¯', 100, 'engagement', 'appointment_count', 10, 10, 'patient'),
('login_streak_7', '7-Day Login Streak', 'Dedicated User', 'Log in for 7 consecutive days', 'Ã°Å¸â€Â¥', 30, 'engagement', 'login_streak', 7, 7, 'patient'),
('login_streak_30', '30-Day Login Streak', 'Super Dedicated', 'Log in for 30 consecutive days', 'Ã¢Â­Â', 150, 'engagement', 'login_streak', 30, 30, 'patient'),
('referral_1', 'First Referral', 'Sharing is Caring', 'Refer your first friend', 'Ã°Å¸Â¤Â', 25, 'social', 'referral_count', 1, 1, 'patient'),
('referral_5', '5 Referrals', 'Influencer', 'Refer 5 friends', 'Ã°Å¸Å’Å¸', 100, 'social', 'referral_count', 5, 5, 'patient'),
('profile_complete', 'Profile Complete', 'All Set', 'Complete your profile 100%', 'A', 20, 'profile', 'profile_completion', 100, 100, 'patient'),
('first_consultation', 'First Consultation', 'Doctor Debut', 'Complete your first consultation', 'Ã°Å¸â€˜Â¨Ã¢â‚¬ÂÃ¢Å¡â€¢Ã¯Â¸Â', 10, 'professional', 'consultation_count', 1, 1, 'doctor'),
('consultations_50', '50 Consultations', 'Experienced Doctor', 'Complete 50 consultations', 'Ã°Å¸Â©Âº', 200, 'professional', 'consultation_count', 50, 50, 'doctor'),
('consultations_100', '100 Consultations', 'Expert Doctor', 'Complete 100 consultations', 'Ã°Å¸ÂÂ¥', 500, 'professional', 'consultation_count', 100, 100, 'doctor'),
('high_rating', 'Highly Rated', '5-Star Doctor', 'Maintain 4.5+ rating with 20+ reviews', 'Ã¢Â­Â', 150, 'professional', 'rating', 45, 45, 'doctor'),
('early_bird', 'Early Bird', 'Morning Person', 'Complete 10 appointments before 9 AM', 'Ã°Å¸Å’â€¦', 50, 'professional', 'early_appointments', 10, 10, 'doctor')
ON CONFLICT (code) DO NOTHING;

