#!/bin/bash

# Post-Migration Security Check Script
# Run this after applying the security hardening migration

echo "🔒 Security Hardening Post-Migration Check"
echo "==========================================="

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Please install PostgreSQL client tools."
    exit 1
fi

# Check for database connection environment variables
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ No database connection URL found."
    echo "Please set DATABASE_URL or SUPABASE_DB_URL environment variable."
    exit 1
fi

# Use the appropriate database URL
DB_URL=${DATABASE_URL:-$SUPABASE_DB_URL}

echo ""
echo "🔍 Running sanity checks..."

# Run the sanity check SQL
psql "$DB_URL" -f db/sanity-check.sql

echo ""
echo "🔑 Encryption Key Check..."

# Check if APP_ENCRYPTION_KEY is set (this would be in Supabase dashboard)
echo "Please verify that APP_ENCRYPTION_KEY is set in your Supabase environment:"
echo "1. Go to Supabase Dashboard → Settings → Edge Functions"
echo "2. Check that APP_ENCRYPTION_KEY exists and has a strong 32+ character value"
echo "3. Redeploy your Edge Functions after setting the key"

echo ""
echo "📋 Manual Testing Checklist:"
echo "□ Test OAuth flow (Mercado Livre/Shopee)"
echo "□ Verify secrets are encrypted in database"
echo "□ Check that phone numbers are masked in organization views"
echo "□ Confirm direct table access is blocked"
echo "□ Test existing sales history functionality"

echo ""
echo "✅ Post-migration check complete!"
echo "Review the output above for any failures that need attention."