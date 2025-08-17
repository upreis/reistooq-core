# Security Hardening Implementation

## Overview
This document outlines the security hardening measures implemented to protect sensitive data in the application.

## Encryption Key Setup

### Required Environment Variable
Set the encryption key in your Supabase environment:

```bash
# CLI method
supabase secrets set APP_ENCRYPTION_KEY="your-strong-32-character-key-here"

# Or via Supabase Dashboard:
# Settings → Edge Functions → Environment Variables
# Add: APP_ENCRYPTION_KEY = "your-strong-32-character-key-here"
```

**Important**: Use a strong, random 32+ character key. Never expose this key in client-side code.

## Integration Secrets Management

### Saving Secrets (Edge Functions only)
```typescript
// In Edge Functions only - never in client code!
const encryptionKey = Deno.env.get('APP_ENCRYPTION_KEY');

const { data, error } = await supabase.rpc('encrypt_integration_secret', {
  p_account_id: accountId,
  p_provider: 'mercadolivre',
  p_client_id: 'ML_CLIENT_ID',
  p_client_secret: 'ML_CLIENT_SECRET', 
  p_access_token: 'ML_ACCESS_TOKEN',
  p_refresh_token: 'ML_REFRESH_TOKEN',
  p_expires_at: '2024-12-31T23:59:59Z',
  p_encryption_key: encryptionKey
});
```

### Reading Secrets (Edge Functions only)
```typescript
// In Edge Functions only - never in client code!
const encryptionKey = Deno.env.get('APP_ENCRYPTION_KEY');

const { data, error } = await supabase.rpc('decrypt_integration_secret', {
  p_account_id: accountId,
  p_provider: 'mercadolivre',
  p_encryption_key: encryptionKey
});

if (data) {
  const secrets = data;
  const accessToken = secrets.access_token;
  const clientSecret = secrets.client_secret;
  // Use for API calls...
}
```

## Secure Data Access Patterns

### Profiles
- **Own profile**: Use `profiles` table directly (RLS allows)
- **Organization profiles**: Use `profiles_safe` view (phone masked)

```typescript
// Current user's profile (unmasked)
const { data } = await supabase
  .from('profiles')
  .select('*')
  .single();

// Organization profiles (phone masked)
const { data } = await supabase
  .from('profiles_safe')
  .select('*');
```

### Sales History
- **Always use**: `get_historico_vendas_masked` RPC function
- **Never use**: Direct `historico_vendas` table access (blocked)

```typescript
// Correct way - uses existing RPC with PII masking
const { data } = await supabase.rpc('get_historico_vendas_masked', {
  _search: 'search term',
  _start: '2024-01-01',
  _end: '2024-12-31',
  _limit: 100,
  _offset: 0
});
```

## Security Verification Queries

Run these queries to verify security implementation:

```sql
-- 1. Phone masking works
SELECT telefone FROM public.profiles_safe LIMIT 1;
-- Expected: "****1234" format

-- 2. Direct historico_vendas access blocked (should fail)
-- SELECT * FROM public.historico_vendas LIMIT 1;
-- Expected: permission denied

-- 3. Safe view works
SELECT count(*) FROM public.historico_vendas_safe;
-- Expected: numeric count

-- 4. Legacy secret fields nullified
SELECT client_secret, access_token, refresh_token 
FROM public.integration_secrets LIMIT 1;
-- Expected: all NULL values
```

## Migration Files
- **Apply**: `db/migrations/2025-08-16_security_hardening.sql`
- **Rollback**: `db/migrations/_rollback_2025-08-16_security_hardening.sql`

## Critical Security Rules

1. **Never expose encryption functions to client code**
2. **Never store encryption keys in client-accessible locations**
3. **Always use safe views for displaying organization data**
4. **Use existing RPC functions for sales history access**
5. **Regularly audit secret access patterns**

## Testing Checklist

- [ ] Phone numbers appear masked in organization views
- [ ] Direct table access properly blocked
- [ ] OAuth flows save/retrieve secrets correctly
- [ ] Edge Functions can encrypt/decrypt secrets
- [ ] Client code cannot access integration_secrets
- [ ] Sales history displays via safe RPC calls

## Support

For issues with encrypted secrets:
1. Verify APP_ENCRYPTION_KEY is set correctly
2. Check Edge Function deployment status
3. Ensure RPC calls use correct parameter names
4. Review Supabase logs for encryption errors