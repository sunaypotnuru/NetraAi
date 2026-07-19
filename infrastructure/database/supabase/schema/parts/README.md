# Netra AI — SQL Schema Parts v3.2.0 (FULLY RECONCILED & GUARDED)
## Run Order Guide

This folder contains the complete Netra AI database schema split into
8 manageable parts (< 70 KB each) to avoid Supabase SQL Editor limits.

### CRITICAL SECURITY & EXECUTION GUARANTEES IN v3.2.0:
  - EVERY `CREATE TRIGGER` has a preceding `DROP TRIGGER IF EXISTS ... ON public.<table>` guard.
  - EVERY `CREATE POLICY` has a preceding `DROP POLICY IF EXISTS ... ON public.<table>` guard.
  - Zero duplicate functions (e.g. `cleanup_expired_sessions_enhanced()` separated from legacy).
  - All syntax anomalies (`complaints`, `profiles_doctor`, `submitted_by_id`, genomic typos) fixed.
  - Safe to re-run any part multiple times without throwing "already exists" errors.

---

## How to Run in Supabase SQL Editor

1. Open Supabase Dashboard -> SQL Editor
2. Run parts in ORDER (01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08)
3. Wait for "Success" before starting the next part

---

## Part Summary

| Part | File | Size | Contents |
|------|------|------|----------|
| 01 | PART_01_Extensions_Core_Tables.sql | ~57 KB | Extensions, helper functions (`is_admin`, `is_doctor`, `is_patient`), `profiles_patient`, `profiles_doctor` (with `is_admin`), FHIR tables |
| 02 | PART_02_Clinical_AI_Analytics.sql | ~68 KB | Appointments, scans, prescriptions, clinical notes, video consultations, analytics, AI models |
| 03 | PART_03_Advanced_FHIR_Compliance.sql | ~63 KB | Advanced FHIR tables, genetic data, compliance (IEC62304), complaint system tables & triggers |
| 04 | PART_04_RLS_Policies_Part_A.sql | ~63 KB | Row Level Security policies (Core tables, appointments, scans) with `DROP POLICY IF EXISTS` guards |
| 05 | PART_05_RLS_Policies_Part_B.sql | ~69 KB | Row Level Security policies (Clinical, billing, notifications, compliance) with `DROP POLICY IF EXISTS` guards |
| 06 | PART_06_Functions_Triggers.sql | ~65 KB | Automation functions, updated_at triggers, session cleanup (`cleanup_expired_sessions_enhanced`) |
| 07 | PART_07_Indexes_Verify.sql | ~51 KB | Performance indexes + verification queries |
| 08 | PART_08_Views_Grants_Finalize.sql | ~60 KB | Admin dashboard views, MCP analytics views, all GRANTs, `trusted_devices` table |

---

## After Running All Parts

Run this verification query:

  SELECT
    tablename,
    rowsecurity AS rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;

Expected: **192 tables**, all with `rls_enabled = true`

---

## Full Consolidated Master File

  infrastructure/database/supabase/schema/NETRA_COMPLETE_SCHEMA.sql  (476 KB, 12,584 lines)

---
Generated: 2026-07-19 | Netra AI v3.2.0 (Reconciled & Guarded)
