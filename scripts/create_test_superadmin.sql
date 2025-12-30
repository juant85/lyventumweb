-- ================================================
-- LYVENTUM: Create Test Superadmin User
-- ================================================
-- This script creates a superadmin user for testing
-- the mobile dashboard implementation
-- ================================================

-- 1. Create auth user (this is the login account)
-- Note: You'll need to run this in Supabase SQL Editor
-- Password will be: TestAdmin123!

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test@lyventum.com',
  -- This is the bcrypt hash for 'TestAdmin123!'
  -- Generated with: node -e "console.log(require('bcryptjs').hashSync('TestAdmin123!', 10))"
  crypt('TestAdmin123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- 2. Get the user ID (save this for next step)
-- If you're running this interactively, the RETURNING id above will give you the UUID
-- Otherwise, run this query to get it:
-- SELECT id FROM auth.users WHERE email = 'test@lyventum.com';

-- 3. Create profile with superadmin role
-- Replace 'USER_ID_HERE' with the UUID from step 1
INSERT INTO public.profiles (
  id,
  email,
  role,
  created_at,
  updated_at
)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@lyventum.com'),
  'test@lyventum.com',
  'superadmin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'superadmin';

-- ================================================
-- ALTERNATIVE: Single Transaction (Recommended)
-- ================================================
-- Run this if the above doesn't work due to permissions

DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create user and get ID
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@lyventum.com',
    crypt('TestAdmin123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (email) DO UPDATE
  SET email = 'test@lyventum.com'
  RETURNING id INTO new_user_id;

  -- Create profile
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (new_user_id, 'test@lyventum.com', 'superadmin', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET role = 'superadmin';

  RAISE NOTICE 'Superadmin created with ID: %', new_user_id;
END $$;

-- ================================================
-- EVEN SIMPLER: Use Supabase Auth API (Recommended!)
-- ================================================
-- Instead of SQL, you can also create the user via Supabase Dashboard:
-- 1. Go to: Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Email: test@lyventum.com
-- 4. Password: TestAdmin123!
-- 5. Confirm email: YES (check the box)
-- 6. Click "Create user"
-- 7. Then run this SQL to set role:

UPDATE public.profiles
SET role = 'superadmin'
WHERE email = 'test@lyventum.com';

-- ================================================
-- VERIFICATION
-- ================================================
-- Run these queries to verify the user was created:

-- Check auth user exists
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'test@lyventum.com';

-- Check profile has superadmin role
SELECT id, email, role, created_at
FROM public.profiles
WHERE email = 'test@lyventum.com';

-- ================================================
-- CLEANUP (if needed)
-- ================================================
-- To delete the test user later:

-- DELETE FROM public.profiles WHERE email = 'test@lyventum.com';
-- DELETE FROM auth.users WHERE email = 'test@lyventum.com';

-- ================================================
-- LOGIN CREDENTIALS
-- ================================================
-- Email: test@lyventum.com
-- Password: TestAdmin123!
-- ================================================
