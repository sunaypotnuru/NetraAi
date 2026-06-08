# Quick Start: Fix View Permissions

## TL;DR

Run this SQL script in Supabase Dashboard → SQL Editor:

**File**: `fix_view_permissions.sql`

## 3-Step Fix

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your Netra AI project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### Step 2: Run the Fix Script
1. Open `infrastructure/database/supabase/schema/fix_view_permissions.sql`
2. Copy all contents (Ctrl+A, Ctrl+C)
3. Paste into SQL Editor
4. Click **Run** button
5. Wait for "Success. No rows returned" message

### Step 3: Verify It Works
Run this test query:

```sql
SELECT * FROM public.vw_admin_dashboard_stats;
```

✅ **Success**: You see data with patient/doctor/appointment counts  
❌ **Failed**: You see "permission denied" error

## What This Fixes

| Issue | Solution |
|-------|----------|
| ❌ Views not accessible | ✅ Added SELECT grants |
| ❌ RLS blocking queries | ✅ Created bypass policies |
| ❌ Service role denied | ✅ Full access for service_role |
| ❌ Schema permission error | ✅ Granted USAGE on schema |

## Views Now Working

### Admin Dashboard (6 views)
- `vw_admin_dashboard_stats` - Platform metrics
- `vw_appointment_trends` - 30-day trends
- `vw_user_activity` - All users combined
- `vw_scan_performance` - Scan stats by type
- `vw_admin_appointments` - Appointments with names
- `vw_admin_scans` - Scans with patient info

### MCP Analytics (5 views)
- `vw_mcp_tool_performance` - Success rates
- `vw_mcp_usage_trends_hourly` - Last 24 hours
- `vw_mcp_usage_trends_daily` - Last 30 days
- `vw_mcp_error_breakdown` - Error categories
- `vw_mcp_latency_stats` - Performance metrics

## Test Your API

After running the fix, test your admin endpoints:

```bash
# Replace with your actual API URL and key
curl https://your-api.com/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_KEY"
```

Should return JSON with stats, not a permission error.

## Need Help?

- **Full docs**: See `README_VIEW_PERMISSIONS.md`
- **Rollback**: Instructions in full README
- **Still broken**: Check Supabase logs in Dashboard → Logs

## Common Issues

**Q: "relation vw_xxx does not exist"**  
A: Run `add_admin_views.sql` and `mcp_analytics_views.sql` first

**Q: "must be owner of table"**  
A: Use postgres role or service_role in SQL Editor

**Q: Views return empty data**  
A: Check that base tables have data, RLS might be too strict

## Security Note

- ✅ Service role: Full access (backend only)
- ✅ Authenticated: Read-only access
- ✅ Anon: No access (blocked by RLS)

Never expose service_role key to frontend!
