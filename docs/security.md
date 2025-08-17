# Security Hardening - Verification Guide

## 🔒 Post-Migration Security Checks

After applying the security hardening migration and configuring `APP_ENCRYPTION_KEY`, run these smoke tests to verify proper implementation:

### 1. Database Smoke Tests

Run these SQL queries to verify security measures:

```sql
-- 1. Verify phone masking in profiles_safe (should show ****XXXX format)
SELECT telefone FROM public.profiles_safe LIMIT 3;
-- Expected: NULL or masked format like "****1234"

-- 2. Verify historico_vendas_safe view is accessible
SELECT count(*) FROM public.historico_vendas_safe;
-- Expected: Numeric count (≥0)

-- 3. Verify legacy secret fields are nullified
SELECT client_secret, access_token, refresh_token FROM public.integration_secrets LIMIT 3;
-- Expected: All fields should be NULL
```

### 2. Code Security Verification

The following should be true after hardening:

#### ✅ Safe Client Access Only
- **NO** direct access to `profiles` table from client code (except for own profile updates)
- **NO** direct access to `historico_vendas` table from client code
- **NO** direct access to `integration_secrets` table from client code

#### ✅ Use Safe Views
- Client code uses `profiles_safe` for organization member data
- Client code uses `historico_vendas_safe` or existing RPC functions for sales data
- Edge Functions use encrypted secret functions with `APP_ENCRYPTION_KEY`

### 3. Edge Functions Setup

Ensure Edge Functions are properly configured:

#### Environment Variables
```bash
# Set in Supabase Dashboard → Settings → Edge Functions
APP_ENCRYPTION_KEY="your-strong-32-character-key-here"
```

#### Function Usage
Edge Functions should call encrypted secret functions:

```typescript
// Save secrets (in Edge Functions only)
const { data, error } = await supabase.rpc('encrypt_integration_secret', {
  p_account_id: accountId,
  p_provider: 'mercadolivre',
  p_client_id: 'CLIENT_ID',
  p_client_secret: 'CLIENT_SECRET',
  p_access_token: 'ACCESS_TOKEN',
  p_refresh_token: 'REFRESH_TOKEN',
  p_expires_at: '2025-12-31T23:59:59Z',
  p_encryption_key: Deno.env.get('APP_ENCRYPTION_KEY')
});

// Get secrets (in Edge Functions only)
const { data, error } = await supabase.rpc('decrypt_integration_secret', {
  p_account_id: accountId,
  p_provider: 'mercadolivre',
  p_encryption_key: Deno.env.get('APP_ENCRYPTION_KEY')
});
```

### 4. Client Integration

Client code should use the new secure services:

```typescript
// Use SecretsService for encrypted secrets
import { SecretsService } from '@/services/SecretsService';

// Save OAuth tokens
await SecretsService.saveSecret({
  integration_account_id: accountId,
  provider: 'mercadolivre',
  client_id: 'CLIENT_ID',
  client_secret: 'CLIENT_SECRET',
  access_token: 'ACCESS_TOKEN',
  refresh_token: 'REFRESH_TOKEN'
});

// Get OAuth tokens
const secret = await SecretsService.getSecret({
  integration_account_id: accountId,
  provider: 'mercadolivre'
});
```

### 5. Redeploy Checklist

After applying security hardening:

1. **✅ Set APP_ENCRYPTION_KEY** in Supabase Dashboard
2. **✅ Deploy Edge Functions** (they deploy automatically with code changes)
3. **✅ Test OAuth flows** with encrypted secret storage
4. **✅ Verify safe view access** works in UI
5. **✅ Run smoke test queries** to confirm security

### 6. Security Verification Commands

Use these commands to verify no insecure access patterns remain:

```bash
# Check for direct profiles table access (should only find own profile access)
grep -r "from('profiles')" src/

# Check for direct historico_vendas access (should find none)
grep -r "from('historico_vendas')" src/

# Check for direct integration_secrets access (should find none)
grep -r "from('integration_secrets')" src/

# Check for select('*') usage (should find none)
grep -r "select('\\*')" src/
```

### 7. Expected Results Summary

✅ **Database**: Phone numbers masked, legacy secret fields NULL, safe views accessible  
✅ **Code**: No direct table access, only safe views and RPC functions used  
✅ **Edge Functions**: Use APP_ENCRYPTION_KEY for encrypt/decrypt operations  
✅ **Client**: Uses SecretsService for all secret operations  

## 🛡️ Security Rules

1. **Never expose encryption functions to client code**
2. **Never store encryption keys in client-accessible locations** 
3. **Always use safe views for displaying organization data**
4. **Use encrypted secret functions only in Edge Functions**
5. **Regularly audit access patterns with verification commands**