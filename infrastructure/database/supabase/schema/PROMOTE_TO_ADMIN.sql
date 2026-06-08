-- ============================================================
-- NETRA AI — ADMIN PROMOTION SCRIPT (v1.1.0)
-- Description: Promotes a manually registered user to ADMIN.
-- Fixes: Removed 'confirmed_at' update (it is a generated column).
-- Usage: Run this AFTER signing up manually with the admin email.
-- ============================================================

DO $$
DECLARE
    v_admin_email TEXT := 'sunaypotnuru@gmail.com';
BEGIN
    -- 1. Update the user metadata to set the role as 'admin'
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
    WHERE email = v_admin_email;

    -- 2. Ensure they are confirmed via the standard auth field
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE email = v_admin_email;

    RAISE NOTICE 'SUCCESS: % has been promoted to Admin.', v_admin_email;
END $$;
