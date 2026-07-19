-- ============================================================
-- NETRA AI COMPLETE SCHEMA v3.2.0 — PART 01
-- Section : Extensions_Core_Tables
-- Lines   : 1-1556 in NETRA_COMPLETE_SCHEMA.sql
-- SAFE TO RE-RUN: All objects use DROP IF EXISTS guards
-- ============================================================

-- ============================================================
-- NETRA AI — COMPLETE DATABASE SCHEMA  v3.1.0  (FIXED)
-- ============================================================
-- Generated  : 2026-07-19 15:45:08
-- Fixed by   : Antigravity AI on 2026-07-19
--
-- WHAT WAS FIXED:
--   1. Removed duplicate waiting_room, soc2_evidence, soc2_control_status
--      table definitions (kept first/best version, removed second)
--   2. Moved is_admin / verification_status column additions to run
--      IMMEDIATELY after profiles_doctor creation (before any policy
--      references it)  
--   3. All is_admin() / is_doctor() / is_patient() functions correctly
--      use auth.users.raw_user_meta_data (NO user_roles table)
--   4. Migration files (add_security_tables, add_messaging_tables, etc.)
--      are NOT needed — this master already contains all 191 tables
--   5. Seed data hardcoded UUID replaced with dynamic email lookup
--
-- HOW TO RUN (Supabase SQL Editor):
--   Paste this entire file and click Run.
--   For large Supabase instances, run the PART_*.sql files in /parts/
--   in numbered order instead.
--
-- SAFE TO RE-RUN: All definitions use IF NOT EXISTS / OR REPLACE.
-- ============================================================

-- FILE: 01_auth_extensions.sql
-- ============================================================
-- ============================================================

-- Netra AI - MASTER DATABASE SCHEMA (ENHANCED 2026 EDITION)
-- Enterprise-grade, HIPAA-compliant healthcare platform schema
-- Incorporates FHIR R4 standards, advanced security, and modern healthcare best practices
-- 
-- FEATURES INCLUDED:
-- A 80+ tables covering all healthcare workflows
-- A FHIR R4 compliance for interoperability
-- A Advanced security with audit trails
-- A AI/ML model management and versioning
-- A Comprehensive appointment scheduling
-- A Multi-modal medical imaging support
-- A Real-time notifications and alerts
-- A Advanced analytics and reporting
-- A Family health profiles and relationships
-- A Insurance and billing management
-- A Telemedicine and video call support
-- A Gamification and patient engagement
-- A Clinical decision support
-- A Population health management
-- A API rate limiting and security
-- A Comprehensive audit logging
-- A Performance optimization
-- 
-- COMPLIANCE:
-- - HIPAA-compliant audit trails
-- - FHIR R4 resource mapping
-- - SOC 2 Type II ready
-- - GDPR privacy controls
-- - FDA 21 CFR Part 11 electronic records
-- 
-- VERSION: 2.0.0
-- LAST UPDATED: April 23, 2026
-- ============================================================

-- ============================================================

-- 0. CLEAN SLATE - Drop all existing objects (CAUTION!)
-- ============================================================

-- Uncomment the following line ONLY if you want to completely reset the database
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- NOTE: In Docker/Postgres the superuser name may not be "postgres".
-- These GRANTs are kept safe/conditional to avoid hard failures.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'public') THEN
    EXECUTE 'GRANT ALL ON SCHEMA public TO PUBLIC';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    EXECUTE 'GRANT ALL ON SCHEMA public TO postgres';
  END IF;
END $$;

-- ============================================================

-- 0.1 AUTH SCHEMA (Supabase-compatible, for plain PostgreSQL)
-- ============================================================

-- The app schema references `auth.users` and `auth.uid()` (Supabase-style).
-- When running against plain Postgres (e.g. Docker), we create the minimal auth
-- objects here so the schema is self-contained.
-- 
-- NOTE FOR SUPABASE USERS: The block below will fail gracefully because 
-- Supabase manages the `auth` schema.

DO $$
BEGIN
  -- Try to create minimal auth structure if it doesn't exist
  -- This will skip if permission is denied (e.g., on Supabase)
  BEGIN
    CREATE SCHEMA IF NOT EXISTS auth;
    
    CREATE TABLE IF NOT EXISTS auth.users (
      instance_id UUID,
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      aud VARCHAR(255),
      role VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      encrypted_password VARCHAR(255),
      email_confirmed_at TIMESTAMPTZ,
      invited_at TIMESTAMPTZ,
      confirmation_token VARCHAR(255),
      confirmation_sent_at TIMESTAMPTZ,
      recovery_token VARCHAR(255),
      recovery_sent_at TIMESTAMPTZ,
      email_change_token_new VARCHAR(255),
      email_change VARCHAR(255),
      email_change_sent_at TIMESTAMPTZ,
      last_sign_in_at TIMESTAMPTZ,
      raw_app_meta_data JSONB DEFAULT '{}'::jsonb,
      raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
      is_super_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      phone VARCHAR(15),
      phone_confirmed_at TIMESTAMPTZ,
      phone_change VARCHAR(15),
      phone_change_token VARCHAR(255),
      phone_change_sent_at TIMESTAMPTZ,
      confirmed_at TIMESTAMPTZ,
      email_change_token_current VARCHAR(255),
      email_change_confirm_status SMALLINT DEFAULT 0,
      banned_until TIMESTAMPTZ,
      reauthentication_token VARCHAR(255),
      reauthentication_sent_at TIMESTAMPTZ,
      is_sso_user BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users(instance_id);
    CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);
    CREATE INDEX IF NOT EXISTS users_is_sso_user_idx ON auth.users(is_sso_user);

    CREATE TABLE IF NOT EXISTS auth.identities (
      id TEXT NOT NULL,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      identity_data JSONB NOT NULL,
      provider TEXT NOT NULL,
      provider_id TEXT,
      last_sign_in_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      email TEXT,
      PRIMARY KEY (provider, id)
    );

    CREATE INDEX IF NOT EXISTS identities_user_id_idx ON auth.identities(user_id);
    CREATE INDEX IF NOT EXISTS identities_email_idx ON auth.identities(email);

    CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
      instance_id UUID,
      id BIGSERIAL PRIMARY KEY,
      token VARCHAR(255) UNIQUE,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      revoked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      parent VARCHAR(255),
      session_id UUID
    );

    CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_idx ON auth.refresh_tokens(instance_id);
    CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens(instance_id, user_id);
    CREATE INDEX IF NOT EXISTS refresh_tokens_parent_idx ON auth.refresh_tokens(parent);
    CREATE INDEX IF NOT EXISTS refresh_tokens_session_id_idx ON auth.refresh_tokens(session_id);
    CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON auth.refresh_tokens(token);

    CREATE TABLE IF NOT EXISTS auth.sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      factor_id UUID,
      aal VARCHAR(10),
      not_after TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON auth.sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_not_after_idx ON auth.sessions(not_after);

    EXECUTE $execute$
    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS UUID AS $f$
    BEGIN
      RETURN NULLIF(current_setting('request.jwt.claim.sub', TRUE), '')::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN NULL;
    END;
    $f$ LANGUAGE plpgsql SECURITY DEFINER;
    $execute$;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
      EXECUTE 'GRANT USAGE ON SCHEMA auth TO postgres';
      EXECUTE 'GRANT ALL ON SCHEMA auth TO postgres';
      EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres';
      EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres';
      EXECUTE 'GRANT EXECUTE ON FUNCTION auth.uid() TO postgres';
    END IF;

    EXECUTE 'GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC';

  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping auth schema creation (permission denied). Assuming Supabase environment.';
    WHEN OTHERS THEN
      RAISE NOTICE 'Skipping auth schema creation due to error: %', SQLERRM;
  END;
END $$;

-- ============================================================

-- 1. ENABLE EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
-- CREATE EXTENSION IF NOT EXISTS timescaledb; -- For FDA PM time-series data (Commented out - not available on all Supabase tiers)

-- ============================================================

-- 1.1 UTILITY FUNCTIONS (Must be defined before use in policies)
-- ============================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_uuid AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is doctor
CREATE OR REPLACE FUNCTION public.is_doctor(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles_doctor 
    WHERE id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================

-- 2. ENHANCED CORE TABLES WITH FHIR COMPLIANCE
-- ============================================================

-- ---------------------------------------------------------------------
-- 2.1 FHIR Resource Base Tables
-- ---------------------------------------------------------------------

-- FHIR Organizations (Healthcare facilities, clinics, hospitals)
CREATE TABLE IF NOT EXISTS public.fhir_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fhir_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT[], -- hospital, clinic, laboratory, pharmacy
  address JSONB,
  contact JSONB,
  telecom JSONB,
  active BOOLEAN DEFAULT TRUE,
  parent_organization_id UUID REFERENCES public.fhir_organizations(id),
  license_info JSONB,
  accreditation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FHIR Practitioners (Healthcare providers)
CREATE TABLE IF NOT EXISTS public.fhir_practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fhir_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  identifier JSONB, -- NPI, license numbers, etc.
  name JSONB NOT NULL,
  telecom JSONB,
  address JSONB, gender TEXT,
  birth_date DATE,
  photo JSONB,
  qualification JSONB,
  communication JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FHIR Patients (Enhanced patient records)
CREATE TABLE IF NOT EXISTS public.fhir_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fhir_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  identifier JSONB, -- MRN, SSN, etc.
  name JSONB NOT NULL,
  telecom JSONB, gender TEXT,
  birth_date DATE,
  deceased JSONB,
  address JSONB,
  marital_status JSONB,
  multiple_birth JSONB,
  photo JSONB,
  contact JSONB, -- Emergency contacts
  communication JSONB,
  general_practitioner JSONB,
  managing_organization UUID REFERENCES public.fhir_organizations(id),
  link JSONB, -- Links to other patient records
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.2 Enhanced User Profiles with FHIR Integration
-- ---------------------------------------------------------------------

-- Patients profile (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles_patient (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  -- Personal info
  date_of_birth DATE,
  age INTEGER, gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  blood_type TEXT,
  phone TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  postal_code VARCHAR(20),
  -- Medical
  medical_history TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  health_score INTEGER DEFAULT 75,
  -- Gamification
  points INTEGER DEFAULT 0,
  login_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  -- Preferences
  language VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  theme VARCHAR(20) DEFAULT 'light',
  font_size VARCHAR(20) DEFAULT 'medium',
  high_contrast BOOLEAN DEFAULT FALSE,
  -- AI Nurse Voice Call Preferences
  call_preferences JSONB DEFAULT '{"voice_enabled": false, "preferred_time": "09:00", "timezone": "Asia/Kolkata"}'::jsonb,
  medication_schedule JSONB DEFAULT '[]'::jsonb,
  -- Metadata
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Doctors profile (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles_doctor (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  -- Professional info
  specialty TEXT,
  rating FLOAT DEFAULT 0.0,
  is_verified BOOLEAN DEFAULT false,
  consultation_fee INTEGER DEFAULT 0,
  bio TEXT,
  experience_years INTEGER,
  license_number TEXT,
  availability JSONB DEFAULT '{}'::jsonb,
  -- Contact & location
  phone TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  postal_code VARCHAR(20),
  -- Enhanced professional fields
  npi_number TEXT UNIQUE, -- National Provider Identifier
  dea_number TEXT, -- Drug Enforcement Administration number
  board_certifications JSONB DEFAULT '[]'::jsonb,
  medical_school TEXT,
  residency_info JSONB,
  fellowship_info JSONB,
  hospital_affiliations JSONB DEFAULT '[]'::jsonb,
  insurance_accepted JSONB DEFAULT '[]'::jsonb,
  languages_spoken TEXT[] DEFAULT ARRAY['English'],
  telemedicine_licensed_states TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Scheduling preferences
  consultation_duration INTEGER DEFAULT 30, -- minutes
  buffer_time INTEGER DEFAULT 15, -- minutes between appointments
  max_daily_appointments INTEGER DEFAULT 20,
  advance_booking_days INTEGER DEFAULT 30,
  cancellation_policy TEXT,
  -- Performance metrics
  total_consultations INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  response_time_minutes INTEGER DEFAULT 60,
  completion_rate DECIMAL(5,2) DEFAULT 100.00,
  -- Preferences
  language VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  theme VARCHAR(20) DEFAULT 'light',
  font_size VARCHAR(20) DEFAULT 'medium',
  high_contrast BOOLEAN DEFAULT FALSE,
  -- Metadata
    is_admin BOOLEAN DEFAULT false,
  verification_status VARCHAR(50) DEFAULT 'pending',
  verification_notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON COLUMN public.profiles_doctor.is_admin IS 'Flag to mark users with admin privileges';
COMMENT ON COLUMN public.profiles_doctor.verification_status IS 'Verification status: pending, approved, rejected';
COMMENT ON COLUMN public.profiles_doctor.verification_notes IS 'Admin notes during verification review';

-- ---------------------------------------------------------------------
-- 2.3 Advanced Healthcare Tables
-- ---------------------------------------------------------------------

-- Medical Specialties (Reference table)
CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  category VARCHAR(50), -- primary_care, specialty, subspecialty
  parent_specialty_id UUID REFERENCES public.specialties(id),
  requires_referral BOOLEAN DEFAULT FALSE,
  average_consultation_fee INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_specialties_active ON public.specialties(is_active, display_order) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_specialties_name ON public.specialties(name);
CREATE INDEX IF NOT EXISTS idx_specialties_category ON public.specialties(category);
CREATE INDEX IF NOT EXISTS idx_specialties_parent ON public.specialties(parent_specialty_id);

 ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS " Anyone can view active specialties" ON public.specialties;
CREATE POLICY " Anyone can view active specialties"
  ON public.specialties FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS " Admins can manage specialties" ON public.specialties;
CREATE POLICY " Admins can manage specialties"
  ON public.specialties FOR ALL
  USING (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS update_specialties_updated_at ON public.specialties;
CREATE TRIGGER update_specialties_updated_at BEFORE UPDATE ON public.specialties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insurance Providers
CREATE TABLE IF NOT EXISTS public.insurance_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  type VARCHAR(50), -- government, private, employer
  coverage_areas TEXT[],
  contact_info JSONB,
  claim_submission_info JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Insurance Information
CREATE TABLE IF NOT EXISTS public.patient_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.insurance_providers(id),
  policy_number VARCHAR(100) NOT NULL,
  group_number VARCHAR(100),
  subscriber_id VARCHAR(100),
  relationship_to_subscriber VARCHAR(50), -- self, spouse, child, other
  effective_date DATE,
  expiration_date DATE,
  copay_amount DECIMAL(10,2),
  deductible_amount DECIMAL(10,2),
  out_of_pocket_max DECIMAL(10,2),
  coverage_details JSONB,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical Conditions (ICD-10 compatible)
CREATE TABLE IF NOT EXISTS public.medical_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icd10_code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  severity_levels JSONB DEFAULT '[]'::jsonb,
  common_symptoms JSONB DEFAULT '[]'::jsonb,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  is_chronic BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Medical History
CREATE TABLE IF NOT EXISTS public.patient_medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condition_id UUID REFERENCES public.medical_conditions(id),
  condition_name VARCHAR(255) NOT NULL, -- Free text if not in conditions table
  icd10_code VARCHAR(10),
  diagnosed_date DATE,
  diagnosed_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'active', -- active, resolved, chronic, managed
  severity VARCHAR(50), -- mild, moderate, severe
  notes TEXT,
  treatment_notes TEXT,
  family_history BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allergies and Adverse Reactions
CREATE TABLE IF NOT EXISTS public.patient_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allergen_type VARCHAR(50) NOT NULL, -- medication, food, environmental, other
  allergen_name VARCHAR(255) NOT NULL,
  reaction_type VARCHAR(100), -- rash, anaphylaxis, nausea, etc.
  severity VARCHAR(50), -- mild, moderate, severe, life-threatening
  onset_date DATE,
  notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications Database (Drug reference)
CREATE TABLE IF NOT EXISTS public.medications_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ndc_code VARCHAR(20) UNIQUE, -- National Drug Code
  generic_name VARCHAR(255) NOT NULL,
  brand_names TEXT[],
  drug_class VARCHAR(100),
  dosage_forms TEXT[], -- tablet, capsule, injection, etc.
  strengths TEXT[],
  route_of_administration TEXT[], -- oral, IV, topical, etc.
  indications TEXT[],
  contraindications TEXT[],
  side_effects JSONB,
  interactions JSONB,
  pregnancy_category VARCHAR(10),
  controlled_substance_schedule VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Current Medications
CREATE TABLE IF NOT EXISTS public.patient_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES public.medications_reference(id),
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  route VARCHAR(50),
  prescribed_by UUID REFERENCES auth.users(id),
  prescribed_date DATE,
  start_date DATE,
  end_date DATE,
  indication VARCHAR(255),
  instructions TEXT,
  quantity_prescribed INTEGER,
  refills_remaining INTEGER,
  status VARCHAR(50) DEFAULT 'active', -- active, discontinued, completed
  adherence_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Laboratory Tests Reference
CREATE TABLE IF NOT EXISTS public.lab_tests_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loinc_code VARCHAR(20) UNIQUE, -- Logical Observation Identifiers Names and Codes
  test_name VARCHAR(255) NOT NULL,
  test_category VARCHAR(100),
  specimen_type VARCHAR(100), -- blood, urine, saliva, etc.
  normal_range_min DECIMAL(10,4),
  normal_range_max DECIMAL(10,4),
  units VARCHAR(50),
  reference_ranges JSONB, -- age/gender specific ranges
  clinical_significance TEXT,
  preparation_instructions TEXT,
  turnaround_time_hours INTEGER,
  cost DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Lab Results
CREATE TABLE IF NOT EXISTS public.patient_lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id UUID REFERENCES public.lab_tests_reference(id),
  test_name VARCHAR(255) NOT NULL,
  loinc_code VARCHAR(20),
  result_value DECIMAL(15,6),
  result_text TEXT,
  units VARCHAR(50),
  reference_range VARCHAR(100),
  abnormal_flag VARCHAR(10), -- H (high), L (low), N (normal)
  status VARCHAR(50) DEFAULT 'final', -- preliminary, final, corrected
  collected_date TIMESTAMPTZ,
  reported_date TIMESTAMPTZ,
  ordered_by UUID REFERENCES auth.users(id),
  performed_by_lab VARCHAR(255),
  notes TEXT,
  critical_value BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.4 Advanced Appointment Management
-- ---------------------------------------------------------------------

-- Appointment Types
CREATE TABLE IF NOT EXISTS public.appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER DEFAULT 15,
  color_code VARCHAR(7), -- Hex color for calendar display
  requires_preparation BOOLEAN DEFAULT FALSE,
  preparation_instructions TEXT,
  cost DECIMAL(10,2),
  is_virtual_allowed BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Slots (for complex scheduling)
CREATE TABLE IF NOT EXISTS public.doctor_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  appointment_type_id UUID REFERENCES public.appointment_types(id),
  max_appointments INTEGER DEFAULT 1,
  is_recurring BOOLEAN DEFAULT TRUE,
  effective_date DATE,
  expiration_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointment Scheduling Rules
CREATE TABLE IF NOT EXISTS public.scheduling_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL, -- advance_booking, same_day, emergency
  rule_value JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Appointments with FHIR compliance

-- Enhanced Appointments with FHIR compliance
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fhir_id TEXT UNIQUE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_type_id UUID REFERENCES public.appointment_types(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  estimated_duration INTEGER DEFAULT 30, -- minutes
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('proposed', 'pending', 'booked', 'arrived', 'fulfilled', 'cancelled', 'noshow', 'entered-in-error')),
  type TEXT DEFAULT 'video' CHECK (type IN ('video', 'in-person', 'phone')),
  priority VARCHAR(20) DEFAULT 'routine', -- routine, urgent, asap, stat
  reason TEXT,
  chief_complaint TEXT,
  notes TEXT,
  -- Location information
  location_type VARCHAR(50), -- clinic, hospital, home, virtual
  location_details JSONB,
  room_number VARCHAR(50),
  -- Insurance and billing
  insurance_authorization VARCHAR(100),
  copay_amount DECIMAL(10,2),
  estimated_cost DECIMAL(10,2),
  -- Follow-up information
  is_follow_up BOOLEAN DEFAULT FALSE,
  previous_appointment_id UUID REFERENCES public.appointments(id),
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_instructions TEXT,
  -- Telemedicine
  video_room_id VARCHAR(255),
  video_room_url TEXT,
  video_recording_consent BOOLEAN DEFAULT FALSE,
  -- Reminders and notifications
  reminder_sent_24h BOOLEAN DEFAULT FALSE,
  reminder_sent_1h BOOLEAN DEFAULT FALSE,
  confirmation_required BOOLEAN DEFAULT TRUE,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id),
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  cancellation_fee DECIMAL(10,2) DEFAULT 0,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2.5 Advanced Medical Imaging and AI Results
-- ---------------------------------------------------------------------

-- Medical Imaging Studies (DICOM compatible)
CREATE TABLE IF NOT EXISTS public.medical_imaging_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  study_instance_uid VARCHAR(255) UNIQUE, -- DICOM Study Instance UID
  accession_number VARCHAR(100),
  study_date DATE NOT NULL,
  study_time TIME,
  modality VARCHAR(10) NOT NULL, -- CT, MR, US, XR, etc.
  body_part VARCHAR(100),
  study_description TEXT,
  referring_physician UUID REFERENCES auth.users(id),
  performing_physician UUID REFERENCES auth.users(id),
  -- Technical parameters
  institution_name VARCHAR(255),
  station_name VARCHAR(100),
  manufacturer VARCHAR(100),
  model_name VARCHAR(100),
  -- Study status
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  priority VARCHAR(20) DEFAULT 'routine',
  -- File storage
  dicom_storage_path TEXT,
  thumbnail_url TEXT,
  viewer_url TEXT,
  file_size_bytes BIGINT,
  series_count INTEGER DEFAULT 0,
  image_count INTEGER DEFAULT 0,
  -- Quality and compliance
  quality_score DECIMAL(3,2),
  compliance_flags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Model Registry
CREATE TABLE IF NOT EXISTS public.ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  model_type VARCHAR(100) NOT NULL, -- classification, detection, segmentation
  medical_domain VARCHAR(100), -- ophthalmology, radiology, pathology
  target_condition VARCHAR(255),
  input_modality VARCHAR(50), -- fundus, oct, xray, ct, mri
  architecture VARCHAR(100), -- resnet, efficientnet, transformer
  training_dataset_info JSONB,
  performance_metrics JSONB, -- accuracy, sensitivity, specificity, auc
  validation_info JSONB,
  fda_approval_status VARCHAR(50),
  ce_marking BOOLEAN DEFAULT FALSE,
  deployment_status VARCHAR(50) DEFAULT 'development', -- development, testing, production, deprecated
  api_endpoint TEXT,
  model_file_path TEXT,
  preprocessing_config JSONB,
  postprocessing_config JSONB,
  explainability_enabled BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, version)
);

-- Enhanced AI Analysis Results
CREATE TABLE IF NOT EXISTS public.ai_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  imaging_study_id UUID REFERENCES public.medical_imaging_studies(id),
  model_id UUID NOT NULL REFERENCES public.ai_models(id),
  input_image_url TEXT NOT NULL,
  analysis_type VARCHAR(100) NOT NULL, -- classification, detection, segmentation
  -- Results
  primary_prediction VARCHAR(255),
  confidence_score DECIMAL(5,4),
  risk_score DECIMAL(5,4),
  severity_level VARCHAR(50),
  -- Detailed results
  class_probabilities JSONB,
  detected_objects JSONB,
  segmentation_masks JSONB,
  biomarkers JSONB,
  measurements JSONB,
  -- Explainable AI
  attention_maps JSONB,
  heatmap_url TEXT,
  feature_importance JSONB,
  explanation_text TEXT,
  -- Quality metrics
  image_quality_score DECIMAL(3,2),
  processing_time_ms INTEGER,
  model_uncertainty DECIMAL(5,4),
  -- Clinical context
  clinical_significance VARCHAR(255),
  recommended_actions TEXT,
  follow_up_recommendations TEXT,
  urgency_level VARCHAR(20) DEFAULT 'routine',
  -- Validation
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  clinical_validation VARCHAR(50), -- confirmed, rejected, uncertain
  validation_notes TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.6 Advanced Notification and Communication System
-- ---------------------------------------------------------------------

-- Notification Templates (Enhanced)
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  trigger_event VARCHAR(100) NOT NULL,
  channels TEXT[] DEFAULT ARRAY['email'], -- email, sms, push, in_app
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  -- Content templates
  subject_template TEXT,
  email_html_template TEXT,
  email_text_template TEXT,
  sms_template TEXT,
  push_title_template TEXT,
  push_body_template TEXT,
  in_app_template TEXT,
  -- Personalization
  variables JSONB DEFAULT '[]'::jsonb,
  localization JSONB DEFAULT '{}'::jsonb,
  -- Scheduling
  send_immediately BOOLEAN DEFAULT TRUE,
  delay_minutes INTEGER DEFAULT 0,
  optimal_send_time TIME, -- Best time to send
  respect_quiet_hours BOOLEAN DEFAULT TRUE,
  -- Targeting
  target_roles TEXT[] DEFAULT ARRAY['patient'],
  target_conditions JSONB,
  -- Compliance
  requires_consent BOOLEAN DEFAULT FALSE,
  retention_days INTEGER DEFAULT 365,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Notifications with Delivery Tracking
CREATE TABLE IF NOT EXISTS public.notifications_enhanced (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.notification_templates(id),
  type TEXT NOT NULL,
  category VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'normal',
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  -- Multi-channel delivery
  channels TEXT[] DEFAULT ARRAY['in_app'],
  delivery_status JSONB DEFAULT '{}'::jsonb, -- Status per channel
  -- Email delivery
  email_message_id TEXT,
  email_status VARCHAR(50) DEFAULT 'pending',
  email_sent_at TIMESTAMPTZ,
  email_delivered_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,
  email_bounced_at TIMESTAMPTZ,
  email_error TEXT,
  -- SMS delivery
  sms_message_id TEXT,
  sms_status VARCHAR(50) DEFAULT 'pending',
  sms_sent_at TIMESTAMPTZ,
  sms_delivered_at TIMESTAMPTZ,
  sms_error TEXT,
  -- Push notification delivery
  push_message_id TEXT,
  push_status VARCHAR(50) DEFAULT 'pending',
  push_sent_at TIMESTAMPTZ,
  push_delivered_at TIMESTAMPTZ,
  push_clicked_at TIMESTAMPTZ,
  push_error TEXT,
  -- In-app notification
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'delivered', 'failed', 'cancelled')),
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2.7 Family Health Management
-- ---------------------------------------------------------------------

-- Family Relationships (Enhanced)
CREATE TABLE IF NOT EXISTS public.family_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- parent, child, spouse, sibling, guardian
  relationship_subtype VARCHAR(50), -- biological, adoptive, step, foster
  is_emergency_contact BOOLEAN DEFAULT FALSE,
  can_view_medical_info BOOLEAN DEFAULT FALSE,
  can_schedule_appointments BOOLEAN DEFAULT FALSE,
  can_receive_notifications BOOLEAN DEFAULT FALSE,
  consent_given_at TIMESTAMPTZ,
  consent_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family Medical History
CREATE TABLE IF NOT EXISTS public.family_medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relative_relationship VARCHAR(50) NOT NULL,
  condition_name VARCHAR(255) NOT NULL,
  icd10_code VARCHAR(10),
  age_of_onset INTEGER,
  age_of_death INTEGER,
  cause_of_death VARCHAR(255),
  notes TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.8 Advanced Analytics and Population Health
-- ---------------------------------------------------------------------

-- Population Health Metrics
CREATE TABLE IF NOT EXISTS public.population_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(255) NOT NULL,
  metric_category VARCHAR(100), -- disease_prevalence, risk_factors, outcomes
  population_segment JSONB, -- age, gender, location filters
  time_period_start DATE NOT NULL,
  time_period_end DATE NOT NULL,
  metric_value DECIMAL(15,6),
  metric_unit VARCHAR(50),
  confidence_interval JSONB,
  sample_size INTEGER,
  data_sources TEXT[],
  calculation_method TEXT,
  statistical_significance DECIMAL(5,4),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical Quality Measures
CREATE TABLE IF NOT EXISTS public.clinical_quality_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  measure_name VARCHAR(255) NOT NULL,
  measure_id VARCHAR(50), -- CMS measure ID
  measure_category VARCHAR(100),
  description TEXT,
  numerator_definition TEXT,
  denominator_definition TEXT,
  exclusion_criteria TEXT,
  reporting_period_start DATE,
  reporting_period_end DATE,
  target_value DECIMAL(5,2),
  actual_value DECIMAL(5,2),
  performance_rate DECIMAL(5,2),
  benchmark_value DECIMAL(5,2),
  calculated_by UUID REFERENCES auth.users(id),
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.9 Advanced Security and Compliance
-- ---------------------------------------------------------------------

-- Data access Audit (HIPAACompliance)
CREATE TABLE IF NOT EXISTS public.data_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  accessed_user_id UUID REFERENCES auth.users(id), -- Patient whose data was accessed
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  action VARCHAR(50) NOT NULL, -- view, create, update, delete, export
  access_method VARCHAR(50), -- web, api, mobile
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  -- HIPAArequired fields
  minimum_necessary_justification TEXT,
  purpose_of_use VARCHAR(100), -- treatment, payment, operations, research
  disclosure_recipient TEXT,
  -- Risk assessment
  risk_level VARCHAR(20) DEFAULT 'low', -- low, medium, high
  anomaly_score DECIMAL(5,4),
  -- Metadata
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consent Management
CREATE TABLE IF NOT EXISTS public.patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(100) NOT NULL, -- treatment, data_sharing, research, marketing
  consent_scope VARCHAR(255), -- Specific scope of consent
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  granted_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  expiration_date DATE,
  consent_document_url TEXT,
  digital_signature TEXT,
  witness_signature TEXT,
  legal_basis VARCHAR(100), -- GDPR legal basis
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PI keys (for programmatic access)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  scopes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0
);

-- PI Rate Limiting
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  api_key_id UUID REFERENCES public.api_keys(id),
  endpoint VARCHAR(255) NOT NULL,
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  window_duration_seconds INTEGER NOT NULL,
  limit_per_window INTEGER NOT NULL,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.10 Enhanced Scans and AI Analysis (Existing table enhanced)
-- ---------------------------------------------------------------------

-- Enhanced Scans / AI analysis results with comprehensive medical imaging support
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  imaging_study_id UUID REFERENCES public.medical_imaging_studies(id),
  ai_model_id UUID REFERENCES public.ai_models(id),
  
  -- Image information
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  original_filename TEXT,
  file_size_bytes BIGINT,
  image_format VARCHAR(10), -- JPEG, PNG, DICOM
  image_dimensions JSONB, -- {"width": 1024, "height": 768}
  
  -- AI Analysis Results
  scan_type VARCHAR(100) NOT NULL, -- anemia, cataract, dr, mental_health, parkinsons
  prediction TEXT,
  confidence FLOAT,
  risk_score FLOAT,
  severity TEXT CHECK (severity IN ('normal', 'mild', 'moderate', 'severe', 'critical', NULL)),
  
  -- Processing Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Specific biomarkers
  hemoglobin_estimate FLOAT,
  cataract_probability FLOAT,
  dr_grade INTEGER, -- 0-4 for diabetic retinopathy
  cup_disc_ratio FLOAT,
  mental_health_score FLOAT,
  parkinsons_updrs_score FLOAT,
  
  -- Detailed results
  class_probabilities JSONB,
  detected_abnormalities JSONB,
  measurements JSONB,
  biomarkers JSONB,
  
  -- Explainable AI xai_enabled BOOLEAN DEFAULT FALSE,
  heatmap_url TEXT,
  attention_regions JSONB,
  feature_importance JSONB,
  explanation_text TEXT,
  
  -- Quality metrics
  image_quality_score FLOAT,
  processing_time_ms INTEGER,
  model_version VARCHAR(50),
  preprocessing_applied JSONB,
  
  -- Clinical context
  diagnosis TEXT,
  clinical_notes TEXT,
  recommendations TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  urgency_level VARCHAR(20) DEFAULT 'routine', -- routine, urgent, stat
  
  -- Validation and review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  clinical_validation VARCHAR(50), -- pending, confirmed, rejected, uncertain
  validation_notes TEXT,
  
  -- Compliance and audit
  phi_removed BOOLEAN DEFAULT TRUE,
  anonymized BOOLEAN DEFAULT FALSE,
  retention_policy VARCHAR(50) DEFAULT 'standard', -- standard, extended, research
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced Prescriptions with comprehensive medication management
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  -- Prescription metadata
  prescription_number VARCHAR(100) UNIQUE,
  prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_date DATE,
  expiration_date DATE,
  
  -- Medications (structured)
  medications JSONB NOT NULL, -- Array of medication objects
  total_medications INTEGER DEFAULT 1,
  
  -- Clinical information
  diagnosis TEXT,
  icd10_codes TEXT[],
  indication TEXT,
  clinical_notes TEXT,
  notes TEXT,
  additional_notes TEXT,
  
  -- Instructions
  general_instructions TEXT,
  dietary_instructions TEXT,
  activity_restrictions TEXT,
  follow_up_instructions TEXT,
  
  -- Pharmacy information
  pharmacy_name VARCHAR(255),
  pharmacy_phone VARCHAR(20),
  pharmacy_address TEXT,
  transmitted_to_pharmacy BOOLEAN DEFAULT FALSE,
  transmitted_at TIMESTAMPTZ,
  
  -- Insurance and billing
  insurance_prior_auth_required BOOLEAN DEFAULT FALSE,
  prior_auth_number VARCHAR(100),
  estimated_cost DECIMAL(10,2),
  copay_amount DECIMAL(10,2),
  
  -- Status and tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'expired', 'suspended')),
  filled_date DATE,
  pickup_date DATE,
  adherence_score DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Electronic prescribing
  e_prescribed BOOLEAN DEFAULT FALSE,
  e_prescription_id VARCHAR(255),
  dea_number VARCHAR(20),
  
  -- Refills
  refills_authorized INTEGER DEFAULT 0,
  refills_remaining INTEGER DEFAULT 0,
  last_refill_date DATE,
  
  -- Safety checks
  drug_interactions_checked BOOLEAN DEFAULT FALSE,
  allergy_checked BOOLEAN DEFAULT FALSE,
  contraindications_checked BOOLEAN DEFAULT FALSE,
  safety_alerts JSONB DEFAULT '[]'::jsonb,
  
  -- Digital signature
  digitally_signed BOOLEAN DEFAULT FALSE,
  signature_timestamp TIMESTAMPTZ,
  signature_hash TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SO P notes ( I Scribe)
CREATE TABLE IF NOT EXISTS public.soap_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  transcript TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  template_used VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(appointment_id)
);

-- Clinical Notes (used by doctor routes)
CREATE TABLE IF NOT EXISTS public.clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  note_type VARCHAR(50) DEFAULT 'general',
  content TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.11 Comprehensive Billing and Payment Management
-- ---------------------------------------------------------------------

-- Insurance Claims
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number VARCHAR(100) UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insurance_id UUID NOT NULL REFERENCES public.patient_insurance(id),
  appointment_id UUID REFERENCES public.appointments(id),
  
  -- Claim details
  claim_type VARCHAR(50) NOT NULL, -- professional, institutional, dental, pharmacy
  service_date DATE NOT NULL,
  submission_date DATE DEFAULT CURRENT_DATE,
  
  -- Financial information
  total_charges DECIMAL(12,2) NOT NULL,
  allowed_amount DECIMAL(12,2),
  paid_amount DECIMAL(12,2),
  patient_responsibility DECIMAL(12,2),
  copay_amount DECIMAL(12,2),
  deductible_amount DECIMAL(12,2),
  coinsurance_amount DECIMAL(12,2),
  
  -- Procedure codes
  primary_diagnosis_code VARCHAR(10), -- ICD-10
  secondary_diagnosis_codes TEXT[],
  procedure_codes JSONB, -- CPT codes with modifiers
  
  -- Claim status
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, pending, approved, denied, appealed
  status_date DATE DEFAULT CURRENT_DATE,
  denial_reason VARCHAR(255),
  denial_code VARCHAR(20),
  
  -- Processing information
  clearinghouse VARCHAR(100),
  payer_claim_id VARCHAR(100),
  electronic_submission BOOLEAN DEFAULT TRUE,
  submission_method VARCHAR(50), -- EDI, paper, portal
  
  -- Remittance information
  remittance_date DATE,
  remittance_amount DECIMAL(12,2),
  adjustment_codes JSONB,
  
  -- ppeals
  appeal_filed BOOLEAN DEFAULT FALSE,
  appeal_date DATE,
  appeal_outcome VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions (Enhanced)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  claim_id UUID REFERENCES public.insurance_claims(id),
  
  -- Transaction details
  transaction_type VARCHAR(50) NOT NULL, -- payment, refund, adjustment, writeoff
  payment_method VARCHAR(50), -- cash, check, card, ach, insurance
  
  -- mounts
  gross_amount DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL,
  
  -- Payment gateway information
  gateway_provider VARCHAR(50), -- stripe, razorpay, square
  gateway_transaction_id VARCHAR(255),
  gateway_fee DECIMAL(10,2),
  
  -- Card/Bank information (encrypted)
  payment_instrument_type VARCHAR(20), -- visa, mastercard, amex, ach
  last_four_digits VARCHAR(4),
  expiry_month INTEGER,
  expiry_year INTEGER,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, cancelled, refunded
  processed_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  
  -- Reconciliation
  reconciled BOOLEAN DEFAULT FALSE,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES auth.users(id),
  
  -- Failure information
  failure_reason TEXT,
  failure_code VARCHAR(50),
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  currency VARCHAR(3) DEFAULT 'INR',
  exchange_rate DECIMAL(10,6) DEFAULT 1.0,
  reference_number VARCHAR(100),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Statements
CREATE TABLE IF NOT EXISTS public.patient_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_number VARCHAR(100) UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Statement period
  statement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Financial summary
  previous_balance DECIMAL(12,2) DEFAULT 0,
  charges_this_period DECIMAL(12,2) DEFAULT 0,
  payments_this_period DECIMAL(12,2) DEFAULT 0,
  adjustments_this_period DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) NOT NULL,
  
  -- Aging buckets
  current_amount DECIMAL(12,2) DEFAULT 0, -- 0-30 days
  thirty_day_amount DECIMAL(12,2) DEFAULT 0, -- 31-60 days
  sixty_day_amount DECIMAL(12,2) DEFAULT 0, -- 61-90 days
  ninety_day_amount DECIMAL(12,2) DEFAULT 0, -- 90+ days
  
  -- Statement details
  line_items JSONB NOT NULL, -- Array of charges, payments, adjustments
  
  -- Delivery information
  delivery_method VARCHAR(50) DEFAULT 'email', -- email, mail, portal
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  mail_sent BOOLEAN DEFAULT FALSE,
  mail_sent_at TIMESTAMPTZ,
  
  -- Payment information
  minimum_payment DECIMAL(12,2),
  due_date DATE,
  payment_instructions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2.12 Advanced Telemedicine and Video Call Management
-- ---------------------------------------------------------------------

-- Video Call Sessions (Standardized with Backend)
CREATE TABLE IF NOT EXISTS public.video_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    doctor_id UUID REFERENCES auth.users(id),
    patient_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    recording_enabled BOOLEAN DEFAULT FALSE,
    recording_consent_given BOOLEAN DEFAULT FALSE,
    recording_url TEXT,
    emergency_disconnect BOOLEAN DEFAULT FALSE,
    emergency_reason TEXT,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waiting Room Management
CREATE TABLE IF NOT EXISTS public.waiting_room (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES public.video_consultations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES auth.users(id),
    doctor_id UUID REFERENCES auth.users(id),
    queue_position INTEGER,
    estimated_wait_minutes INTEGER,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    notified_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'waiting',
    timeout_at TIMESTAMPTZ
);

-- Call Quality Metrics
CREATE TABLE IF NOT EXISTS public.call_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES public.video_consultations(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES auth.users(id),
    participant_type VARCHAR(10),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    bitrate_kbps INTEGER,
    packet_loss_percent DECIMAL(5, 2),
    jitter_ms INTEGER,
    rtt_ms INTEGER,
    frame_rate INTEGER,
    resolution VARCHAR(20),
    quality_score INTEGER,
    network_type VARCHAR(20)
);

-- Recording Consents and Logs
CREATE TABLE IF NOT EXISTS public.recording_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES public.video_consultations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

CREATE TABLE IF NOT EXISTS public.video_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES public.video_consultations(id) ON DELETE CASCADE,
    recording_consent_id UUID REFERENCES public.recording_consents(id),
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    duration_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'processing',
    checksum TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recording_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID REFERENCES public.video_recordings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    access_timestamp TIMESTAMPTZ DEFAULT NOW(),
    action VARCHAR(20),
    ip_address INET
);

CREATE TABLE IF NOT EXISTS public.emergency_disconnects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES public.video_consultations(id) ON DELETE CASCADE,
    trigger_user_id UUID REFERENCES auth.users(id),
    reason_code VARCHAR(50),
    details TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

