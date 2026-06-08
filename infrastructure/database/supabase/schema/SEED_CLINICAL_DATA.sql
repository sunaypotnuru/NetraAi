-- ============================================================
-- NETRA AI — FINAL CLINICAL DATA SEED
-- Description: Injects clinical data into MANUALLY created accounts.
-- Usage: Run this AFTER you have signed up as Doctor and Patient.
-- ============================================================

DO $$
DECLARE
    v_doctor_email TEXT := 'rohitpanduru8@gmail.com';
    v_patient_email TEXT := 'sunaysujsy@gmail.com';
    
    v_doctor_id UUID;
    v_patient_id UUID;
    
    -- Model IDs
    v_anemia_model_id UUID := '11111111-1111-1111-1111-111111111111';
    v_cataract_model_id UUID := '22222222-2222-2222-2222-222222222222';
    v_dr_model_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- 1. FIND THE MANUAL USER IDs
    SELECT id INTO v_doctor_id FROM auth.users WHERE email = v_doctor_email;
    SELECT id INTO v_patient_id FROM auth.users WHERE email = v_patient_email;

    IF v_doctor_id IS NULL OR v_patient_id IS NULL THEN
        RAISE EXCEPTION 'COULD NOT FIND USERS. Please make sure you signed up with % and % first.', v_doctor_email, v_patient_email;
    END IF;

    -- 2. UPGRADE DOCTOR ROLE & PROFILE
    UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "doctor"}'::jsonb WHERE id = v_doctor_id;
    
    UPDATE public.profiles_doctor SET 
        specialty = 'Hematology & Ophthalmic Diagnostics',
        is_verified = true,
        consultation_fee = 1200,
        experience_years = 18,
        license_number = 'NETRA-DOC-2026-X1',
        rating = 4.98,
        city = 'Hyderabad',
        bio = 'Senior AI-Assisted Clinical Diagnostician specializing in non-invasive screening technologies.'
    WHERE id = v_doctor_id;

    -- 3. UPGRADE PATIENT PROFILE
    UPDATE public.profiles_patient SET 
        age = 26,
        gender = 'male',
        blood_type = 'B+',
        city = 'Hyderabad',
        health_score = 88,
        points = 2450,
        login_streak = 12
    WHERE id = v_patient_id;

    -- 4. REGISTER AI MODELS
    INSERT INTO public.ai_models (id, name, version, model_type, medical_domain) VALUES
    (v_anemia_model_id, 'Netra-Anemia-V3', '3.1.0', 'Classification', 'Hematology'),
    (v_cataract_model_id, 'Netra-Cataract-V2', '2.0.5', 'Segmentation', 'Ophthalmology'),
    (v_dr_model_id, 'Netra-DR-V2', '2.2.0', 'Detection', 'Ophthalmology')
    ON CONFLICT (id) DO UPDATE SET version = EXCLUDED.version;

    -- 5. INJECT CLINICAL SCANS (Linked to both Patient and Doctor)
    -- Allowed predictions: 'normal', 'mild', 'moderate', 'severe', 'anemic', 'critical'
    INSERT INTO public.scans (patient_id, doctor_id, ai_model_id, scan_type, image_url, prediction, confidence, explanation_text, status, created_at) VALUES
    (v_patient_id, v_doctor_id, v_anemia_model_id, 'anemia', 'https://images.unsplash.com/photo-1579154235602-3c20f005ba25?auto=format&fit=crop&q=80&w=400', 'anemic', 0.85, 'Noticeable pallor in palpebral conjunctiva suggests iron deficiency.', 'completed', NOW() - INTERVAL '7 days'),
    (v_patient_id, v_doctor_id, v_cataract_model_id, 'cataract', 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=400', 'normal', 0.99, 'Clear crystalline lens detected. No surgical intervention required.', 'completed', NOW() - INTERVAL '5 days'),
    (v_patient_id, v_doctor_id, v_dr_model_id, 'diabetic_retinopathy', 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&q=80&w=400', 'normal', 0.96, 'Retinal vasculature appears healthy. No microaneurysms detected.', 'completed', NOW() - INTERVAL '3 days'),
    (v_patient_id, v_doctor_id, v_anemia_model_id, 'anemia', 'https://images.unsplash.com/photo-1584362946521-4c19971eeeb3?auto=format&fit=crop&q=80&w=400', 'mild', 0.92, 'Conjunctival tissue showing improved vascularity compared to last scan.', 'completed', NOW() - INTERVAL '1 day');

    -- 6. INJECT LAB RESULTS & MEDS
    INSERT INTO public.patient_lab_results (patient_id, test_name, result_value, units, abnormal_flag, collected_date) VALUES
    (v_patient_id, 'Hemoglobin (Hb)', 11.2, 'g/dL', 'L', NOW() - INTERVAL '7 days');

    INSERT INTO public.patient_medications (patient_id, medication_name, dosage, frequency, prescribed_by, start_date, status) VALUES
    (v_patient_id, 'Ferrous Ascorbate', '100mg', 'Twice daily', v_doctor_id, NOW() - INTERVAL '2 days', 'active');

    -- 7. INITIALIZE NOTIFICATION PREFERENCES
    INSERT INTO public.notification_preferences (user_id, email_enabled, sms_enabled, push_enabled)
    VALUES (v_doctor_id, true, true, true), (v_patient_id, true, true, true)
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'SUCCESS: Clinical data seeded for manually created accounts.';
END $$;
