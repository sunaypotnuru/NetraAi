-- ============================================================
-- NETRA AI — COMPREHENSIVE PRODUCTION SEED (v3.4.0)
-- Description: Surgical rebuild of all demo roles with Conflict-Resolution.
-- Fixes: Uses ON CONFLICT to merge with background trigger profiles.
-- Roles: Admin, Doctor, Patient
-- Password: naraYANA8861*
-- ============================================================

DO $$
DECLARE
    -- Stable UUIDs for consistent testing
    v_admin_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    v_doctor_id UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    v_patient_id UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    
    -- Model IDs
    v_anemia_model_id UUID := '11111111-1111-1111-1111-111111111111';
    v_cataract_model_id UUID := '22222222-2222-2222-2222-222222222222';
    v_dr_model_id UUID := '33333333-3333-3333-3333-333333333333';
    v_parkinson_model_id UUID := '44444444-4444-4444-4444-444444444444';
    
    v_pw_hash TEXT := crypt('naraYANA8861*', gen_salt('bf'));
BEGIN
    -- 1. SURGICAL CLEANUP (Delete existing records to ensure clean slate)
    -- We delete from public tables FIRST to avoid foreign key issues
    DELETE FROM public.notification_preferences WHERE user_id IN (v_admin_id, v_doctor_id, v_patient_id);
    DELETE FROM public.login_streaks WHERE user_id IN (v_admin_id, v_doctor_id, v_patient_id);
    DELETE FROM public.user_badges WHERE user_id IN (v_admin_id, v_doctor_id, v_patient_id);
    DELETE FROM public.notifications WHERE user_id IN (v_admin_id, v_doctor_id, v_patient_id);
    DELETE FROM public.activity_logs WHERE user_id IN (v_admin_id, v_doctor_id, v_patient_id);
    DELETE FROM public.patient_medications WHERE patient_id = v_patient_id;
    DELETE FROM public.appointments WHERE patient_id = v_patient_id;
    DELETE FROM public.patient_lab_results WHERE patient_id = v_patient_id;
    DELETE FROM public.scans WHERE patient_id = v_patient_id;
    
    DELETE FROM public.profiles_doctor WHERE id = v_doctor_id OR email = 'rohitpanduru8@gmail.com';
    DELETE FROM public.profiles_patient WHERE id = v_patient_id OR email = 'sunaysujsy@gmail.com';
    
    DELETE FROM auth.identities WHERE email IN ('sunaypotnuru@gmail.com', 'rohitpanduru8@gmail.com', 'sunaysujsy@gmail.com');
    DELETE FROM auth.users WHERE email IN ('sunaypotnuru@gmail.com', 'rohitpanduru8@gmail.com', 'sunaysujsy@gmail.com');

    -- 2. CREATE AUTH IDENTITIES
    -- Note: This will trigger the public.handle_new_user() trigger automatically.
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, aud, role, 
        is_sso_user, email_change_confirm_status, created_at, updated_at
    )
    VALUES 
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'sunaypotnuru@gmail.com', v_pw_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sunay Admin","role":"admin"}', 'authenticated', 'authenticated', false, 0, NOW(), NOW()),
    (v_doctor_id, '00000000-0000-0000-0000-000000000000', 'rohitpanduru8@gmail.com', v_pw_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Rohith","role":"doctor"}', 'authenticated', 'authenticated', false, 0, NOW(), NOW()),
    (v_patient_id, '00000000-0000-0000-0000-000000000000', 'sunaysujsy@gmail.com', v_pw_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sujay Patient","role":"patient"}', 'authenticated', 'authenticated', false, 0, NOW(), NOW());

    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
    VALUES 
    (v_admin_id, v_admin_id, 'sunaypotnuru@gmail.com', jsonb_build_object('sub', v_admin_id, 'email', 'sunaypotnuru@gmail.com', 'email_verified', true), 'email', NOW(), NOW()),
    (v_doctor_id, v_doctor_id, 'rohitpanduru8@gmail.com', jsonb_build_object('sub', v_doctor_id, 'email', 'rohitpanduru8@gmail.com', 'email_verified', true), 'email', NOW(), NOW()),
    (v_patient_id, v_patient_id, 'sunaysujsy@gmail.com', jsonb_build_object('sub', v_patient_id, 'email', 'sunaysujsy@gmail.com', 'email_verified', true), 'email', NOW(), NOW());

    -- 3. ENHANCE PUBLIC PROFILES (Merge with trigger-created records)
    INSERT INTO public.profiles_doctor (id, email, full_name, specialty, is_verified, consultation_fee, experience_years, license_number, rating, city, bio)
    VALUES (v_doctor_id, 'rohitpanduru8@gmail.com', 'Dr. Rohith', 'Hematology & Ophthalmic Diagnostics', true, 1200, 18, 'NETRA-DOC-2026-X1', 4.98, 'Hyderabad', 'Senior AI-Assisted Clinical Diagnostician specializing in non-invasive screening technologies.')
    ON CONFLICT (id) DO UPDATE SET 
        specialty = EXCLUDED.specialty,
        is_verified = EXCLUDED.is_verified,
        consultation_fee = EXCLUDED.consultation_fee,
        experience_years = EXCLUDED.experience_years,
        license_number = EXCLUDED.license_number,
        rating = EXCLUDED.rating,
        city = EXCLUDED.city,
        bio = EXCLUDED.bio;

    INSERT INTO public.profiles_patient (id, email, full_name, age, gender, blood_type, city, health_score, points, login_streak)
    VALUES (v_patient_id, 'sunaysujsy@gmail.com', 'Sujay', 26, 'male', 'B+', 'Hyderabad', 88, 2450, 12)
    ON CONFLICT (id) DO UPDATE SET 
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        blood_type = EXCLUDED.blood_type,
        city = EXCLUDED.city,
        health_score = EXCLUDED.health_score,
        points = EXCLUDED.points,
        login_streak = EXCLUDED.login_streak;

    -- 4. INITIALIZE PREFERENCES & STREAKS
    INSERT INTO public.notification_preferences (user_id, email_enabled, sms_enabled, push_enabled)
    VALUES 
    (v_admin_id, true, true, true),
    (v_doctor_id, true, true, true),
    (v_patient_id, true, true, true)
    ON CONFLICT (user_id) DO UPDATE SET email_enabled = true, sms_enabled = true, push_enabled = true;

    INSERT INTO public.login_streaks (user_id, current_streak, longest_streak, last_login_date)
    VALUES (v_patient_id, 12, 12, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET current_streak = EXCLUDED.current_streak, longest_streak = EXCLUDED.longest_streak;

    -- 5. SEED CLINICAL DATA
    INSERT INTO public.ai_models (id, name, version, model_type, medical_domain) VALUES
    (v_anemia_model_id, 'Netra-Anemia-V3', '3.1.0', 'Classification', 'Hematology'),
    (v_cataract_model_id, 'Netra-Cataract-V2', '2.0.5', 'Segmentation', 'Ophthalmology'),
    (v_dr_model_id, 'Netra-DR-V2', '2.2.0', 'Detection', 'Ophthalmology'),
    (v_parkinson_model_id, 'Netra-Voice-V2', '2.1.0', 'Signal Analysis', 'Neurology')
    ON CONFLICT (id) DO UPDATE SET version = EXCLUDED.version;

    INSERT INTO public.scans (patient_id, doctor_id, ai_model_id, scan_type, image_url, prediction, confidence, explanation_text, status, created_at) VALUES
    (v_patient_id, v_doctor_id, v_anemia_model_id, 'anemia', 'https://images.unsplash.com/photo-1579154235602-3c20f005ba25?auto=format&fit=crop&q=80&w=400', 'anemic', 0.85, 'Noticeable pallor in palpebral conjunctiva suggests iron deficiency.', 'completed', NOW() - INTERVAL '7 days'),
    (v_patient_id, v_doctor_id, v_cataract_model_id, 'cataract', 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=400', 'normal', 0.99, 'Clear crystalline lens detected. No surgical intervention required.', 'completed', NOW() - INTERVAL '5 days'),
    (v_patient_id, v_doctor_id, v_dr_model_id, 'diabetic_retinopathy', 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&q=80&w=400', 'normal', 0.96, 'Retinal vasculature appears healthy. No microaneurysms detected.', 'completed', NOW() - INTERVAL '3 days'),
    (v_patient_id, v_doctor_id, v_anemia_model_id, 'anemia', 'https://images.unsplash.com/photo-1584362946521-4c19971eeeb3?auto=format&fit=crop&q=80&w=400', 'mild', 0.92, 'Conjunctival tissue showing improved vascularity compared to last scan.', 'completed', NOW() - INTERVAL '1 day');

    -- Fake Lab Results
    INSERT INTO public.patient_lab_results (patient_id, test_name, result_value, units, abnormal_flag, collected_date) VALUES
    (v_patient_id, 'Hemoglobin (Hb)', 11.2, 'g/dL', 'L', NOW() - INTERVAL '7 days'),
    (v_patient_id, 'Serum Iron', 55, 'ug/dL', 'L', NOW() - INTERVAL '7 days'),
    (v_patient_id, 'Ferritin', 18, 'ng/mL', 'L', NOW() - INTERVAL '7 days');

    -- Fake Appointments
    INSERT INTO public.appointments (patient_id, doctor_id, scheduled_at, status, type, reason) VALUES
    (v_patient_id, v_doctor_id, NOW() - INTERVAL '2 days', 'fulfilled', 'video', 'AI screening follow-up for Anemia markers'),
    (v_patient_id, v_doctor_id, NOW() + INTERVAL '3 days', 'scheduled', 'video', 'Weekly clinical review and medication adjustment');

    -- Fake Medications
    INSERT INTO public.patient_medications (patient_id, medication_name, dosage, frequency, prescribed_by, start_date, status) VALUES
    (v_patient_id, 'Ferrous Ascorbate', '100mg', 'Twice daily', v_doctor_id, NOW() - INTERVAL '2 days', 'active'),
    (v_patient_id, 'Vitamin B12 (Cobalamin)', '1500mcg', 'Once daily', v_doctor_id, NOW() - INTERVAL '2 days', 'active');

    RAISE NOTICE 'SUCCESS: REBUILD COMPLETE USING CONFLICT-RESOLUTION. All roles are ready for login.';
END $$;
