# Database View Permissions Fix

## Overview

This document provides instructions for applying the view permissions fix to resolve RLS policy and grant issues for admin and MCP analytics views.

## Problem Statement

New database views were created but not accessible due to:
- Missing RLS policies on underlying tables
- Missing GRANT statements for service_role and authenticated users
- No schema usage permissions

## Views Affected

### Admin Dashboard Views
- `vw_admin_dashboard_stats` - Aggregated platform metrics
- `vw_appointment_trends` - Appointment trends over last 30 days
- `vw_user_activity` - Combined user activity (patients + doctors)
- `vw_scan_performance` - Scan performance by type
- `vw_admin_appointments` - Appointments with patient/doctor details
- `vw_admin_scans` - Scans with patient details

### MCP Analytics Views
- `vw_mcp_tool_performance` - Tool success rates and latency
- `vw_mcp_usage_trends_hourly` - Hourly usage trends (last 24 hours)
- `vw_mcp_usage_trends_daily` - Daily usage trends (last 30 days)
- `vw_mcp_error_breakdown` - Error categorization and counts
- `vw_mcp_latency_stats` - Latency percentiles and statistics

## Solution Applied

The `fix_view_permissions.sql` script applies the following fixes:

1. **Schema Usage Grants**: Allows authenticated and service_role to use the public schema
2. **View SELECT Grants**: Grants SELECT permission on all views to both roles
3. **RLS Enablement**: Enables RLS on all underlying tables
4. **Service Role Policies**: Creates bypass policies for service_role (full access)
5. **Authenticated Policies**: Creates read policies for authenticated users
6. **Default Privileges**: Sets default privileges for future tables/views

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Log in to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `fix_view_permissions.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the script
7. Verify success by checking for "Success. No rows returned" message

### Option 2: Using Supabase CLI

```bash
# Navigate to the project root
cd Netra-Ai

# Apply the migration using Supabase CLI
supabase db execute -f infrastructure/database/supabase/schema/fix_view_permissions.sql

# Or if you have the CLI configured with your project
supabase db push
```

### Option 3: Using psql (Direct Database Connection)

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the script
\i infrastructure/database/supabase/schema/fix_view_permissions.sql

# Exit
\q
```

## Verification Steps

After applying the fix, run these verification queries in the SQL Editor:

### 1. Check View Permissions

```sql
SELECT table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name LIKE 'vw_%'
ORDER BY table_name, grantee;
```

**Expected Result**: Each view should have SELECT grants for both `service_role` and `authenticated`.

### 2. Check RLS Status on Base Tables

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles_patient', 'profiles_doctor', 'appointments', 'scans', 'audit_logs');
```

**Expected Result**: All tables should have `rowsecurity = true`.

### 3. Check Policies on Base Tables

```sql
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Result**: Each table should have policies for both `service_role` and `authenticated`.

### 4. Test View Access

```sql
-- Test admin dashboard stats
SELECT * FROM public.vw_admin_dashboard_stats;

-- Test MCP tool performance
SELECT * FROM public.vw_mcp_tool_performance;

-- Test appointment trends
SELECT * FROM public.vw_appointment_trends LIMIT 5;
```

**Expected Result**: All queries should return data without permission errors.

## Testing from Application

After applying the fix, test the admin API endpoints:

```bash
# Test admin dashboard stats endpoint
curl -X GET "https://your-api-url/api/admin/dashboard/stats" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# Test MCP analytics endpoint
curl -X GET "https://your-api-url/api/admin/mcp/performance" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Rollback Instructions

If you need to rollback the changes:

```sql
-- Remove policies
DROP POLICY IF EXISTS "service_role_all_profiles_patient" ON public.profiles_patient;
DROP POLICY IF EXISTS "service_role_all_profiles_doctor" ON public.profiles_doctor;
DROP POLICY IF EXISTS "service_role_all_appointments" ON public.appointments;
DROP POLICY IF EXISTS "service_role_all_scans" ON public.scans;
DROP POLICY IF EXISTS "service_role_all_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "authenticated_read_profiles_patient" ON public.profiles_patient;
DROP POLICY IF EXISTS "authenticated_read_profiles_doctor" ON public.profiles_doctor;
DROP POLICY IF EXISTS "authenticated_read_appointments" ON public.appointments;
DROP POLICY IF EXISTS "authenticated_read_scans" ON public.scans;
DROP POLICY IF EXISTS "authenticated_read_audit_logs" ON public.audit_logs;

-- Revoke grants (optional, only if needed)
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM authenticated;
```

## Security Considerations

- **Service Role**: Has full bypass access to all data. Use only in backend services, never expose to frontend.
- **Authenticated Role**: Has read access to views. Individual user data filtering should be implemented at the application level if needed.
- **RLS Policies**: Views inherit RLS from underlying tables. The policies created allow broad read access for analytics purposes.

## Troubleshooting

### Error: "permission denied for table vw_xxx"

**Solution**: Ensure the script was run with sufficient privileges (postgres or service_role).

### Error: "policy already exists"

**Solution**: The script uses `DROP POLICY IF EXISTS` to handle this. If you still see errors, manually drop the policies first.

### Views Return Empty Results

**Solution**: Check that the underlying tables have data and that RLS policies are not too restrictive.

### "relation does not exist" Error

**Solution**: Ensure the views were created first by running `add_admin_views.sql` and `mcp_analytics_views.sql` before this fix.

## Related Files

- `add_admin_views.sql` - Creates admin dashboard views
- `mcp_analytics_views.sql` - Creates MCP analytics views
- `fix_view_permissions.sql` - This permissions fix script

## Support

For issues or questions:
1. Check the verification queries above
2. Review Supabase logs in the dashboard
3. Check application logs for specific error messages
4. Consult Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security

## Changelog

- **2024-01-XX**: Initial creation of permissions fix script
- Fixed RLS policies for 5 base tables
- Added grants for 11 analytics views
- Documented verification and rollback procedures
