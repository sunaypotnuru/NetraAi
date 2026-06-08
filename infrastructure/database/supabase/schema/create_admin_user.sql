-- Create Admin User Profile for sunaypotnuru@gmail.com
-- This will create the doctor profile with admin privileges
-- SIMPLIFIED VERSION - only uses columns that exist

-- ============================================================
-- Insert your doctor profile with admin flag (minimal columns)
-- ============================================================
INSERT INTO public.profiles_doctor (
    id,
    email,
    full_name,
    is_admin
)
VALUES (
    '6e0629f1-f301-4772-a4a2-1721f9c0c5d5',  -- Your auth user ID from Step 4
    'sunaypotnuru@gmail.com',
    'Sunay Potnuru',
    true  -- Admin flag
)
ON CONFLICT (id) DO UPDATE SET
    is_admin = true,
    full_name = 'Sunay Potnuru';

-- ============================================================
-- Verify the profile was created
-- ============================================================
SELECT 
    id,
    email,
    full_name,
    is_admin,
    created_at
FROM public.profiles_doctor
WHERE email = 'sunaypotnuru@gmail.com';
