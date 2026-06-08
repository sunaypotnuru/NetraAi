-- ============================================================
-- NETRA AI — CLEAN SLATE SCRIPT
-- Description: Surgically removes all user data for a fresh start.
-- Use this before performing manual Sign-Ups via the UI.
-- ============================================================

DO $$
BEGIN
    -- 1. Clear all clinical and activity data
    TRUNCATE public.scans CASCADE;
    TRUNCATE public.appointments CASCADE;
    TRUNCATE public.patient_lab_results CASCADE;
    TRUNCATE public.patient_medications CASCADE;
    TRUNCATE public.notifications CASCADE;
    TRUNCATE public.activity_logs CASCADE;
    TRUNCATE public.user_badges CASCADE;
    TRUNCATE public.login_streaks CASCADE;
    TRUNCATE public.notification_preferences CASCADE;
    TRUNCATE public.profiles_doctor CASCADE;
    TRUNCATE public.profiles_patient CASCADE;

    -- 2. Clear all Auth data (DANGEROUS: Removes all users)
    -- We do this so you can reuse the same emails for manual signup
    DELETE FROM auth.identities;
    DELETE FROM auth.users;

    RAISE NOTICE 'SUCCESS: Database is now a clean slate. You can now perform manual Sign-Ups.';
END $$;
