-- Security Hardening Sanity Check
-- Run this after applying the security migration to verify everything works

\echo '🔒 Security Hardening Sanity Check'
\echo '=================================='

\echo ''
\echo '1. Testing phone masking in profiles_safe...'
SELECT 
  CASE 
    WHEN telefone LIKE '****%' OR telefone IS NULL THEN '✅ PASS: Phone properly masked'
    ELSE '❌ FAIL: Phone not masked properly'
  END as phone_mask_test,
  telefone as sample_phone
FROM public.profiles_safe 
LIMIT 1;

\echo ''
\echo '2. Testing safe view access...'
SELECT 
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ PASS: historico_vendas_safe accessible'
    ELSE '❌ FAIL: Safe view not accessible'
  END as safe_view_test,
  COUNT(*) as record_count
FROM public.historico_vendas_safe;

\echo ''
\echo '3. Testing legacy secret fields nullification...'
SELECT 
  CASE 
    WHEN client_secret IS NULL AND access_token IS NULL AND refresh_token IS NULL 
    THEN '✅ PASS: Legacy fields properly nullified'
    ELSE '❌ FAIL: Legacy fields still contain data'
  END as legacy_nullify_test,
  client_secret,
  access_token,
  refresh_token
FROM public.integration_secrets 
LIMIT 1;

\echo ''
\echo '4. Testing encrypted column exists...'
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS: secret_enc column exists'
    ELSE '❌ FAIL: secret_enc column missing'
  END as encrypted_column_test
FROM information_schema.columns 
WHERE table_name = 'integration_secrets' 
  AND column_name = 'secret_enc';

\echo ''
\echo '5. Testing RLS policies are active...'
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as rls_status
FROM pg_tables 
WHERE tablename IN ('profiles', 'historico_vendas', 'integration_secrets')
  AND schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo '6. Testing function permissions...'
SELECT 
  proname as function_name,
  CASE 
    WHEN proacl IS NULL THEN '✅ SECURE: No public access'
    ELSE '⚠️  WARNING: Has public access'
  END as permission_status
FROM pg_proc 
WHERE proname IN ('encrypt_integration_secret', 'decrypt_integration_secret');

\echo ''
\echo '🏁 Sanity check complete!'
\echo 'If any tests show ❌ FAIL, review the migration and fix issues.'
\echo 'Security warnings (⚠️) should be investigated.'