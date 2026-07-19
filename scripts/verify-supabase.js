/**
 * NetraAI - Standalone Live Supabase Database Verifier
 * Checks ALL actual table names based on the live schema.
 *
 * Run from project root:
 *   node scripts/verify-supabase.js
 */

const path = require('path');
const fs = require('fs');

// Resolve @supabase/supabase-js from frontend node_modules
const localSupabasePath = path.join(__dirname, '../frontend/node_modules/@supabase/supabase-js');
const { createClient } = require(localSupabasePath);

// Read env from frontend/.env
const envPath = path.join(__dirname, '../frontend/.env');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL='))      supabaseUrl = trimmed.split('=')[1].trim().replace(/['"]/g, '');
    if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = trimmed.split('=')[1].trim().replace(/['"]/g, '');
  });
}

console.log("\n=======================================================");
console.log("   NetraAI — Live Supabase Database Structure Verifier");
console.log("=======================================================");
console.log(`📡  Endpoint  : ${supabaseUrl || 'NOT FOUND'}`);
console.log(`🔑  API Key   : ${supabaseKey ? 'YES (Valid)' : 'NO (Missing)'}`);
console.log("=======================================================\n");

if (!supabaseUrl || !supabaseKey) {
  console.error("❌  ERROR: Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in frontend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── All tables based on the ACTUAL live schema ──────────────────────────────
const TABLES = [
  // Core user tables
  { name: 'profiles_patient',            category: 'Core'        },
  { name: 'profiles_doctor',             category: 'Core'        },

  // Clinical records
  { name: 'scans',                        category: 'Clinical'    },
  { name: 'appointments',                category: 'Clinical'    },
  { name: 'prescriptions',               category: 'Clinical'    },
  { name: 'clinical_notes',              category: 'Clinical'    },
  { name: 'soap_notes',                  category: 'Clinical'    },

  // Medications (actual table name in DB)
  { name: 'patient_medications',         category: 'Medications' },
  { name: 'medication_logs',             category: 'Medications' },
  { name: 'medications_reference',       category: 'Medications' },

  // Patient portal
  { name: 'health_goals',                category: 'Patient'     },
  { name: 'family_members',             category: 'Patient'     },
  { name: 'documents',                   category: 'Patient'     },
  { name: 'patient_lab_results',        category: 'Patient'     },
  { name: 'patient_consents',           category: 'Patient'     },

  // Messaging & notifications
  { name: 'messages',                    category: 'Comms'       },
  { name: 'notifications_enhanced',     category: 'Comms'       },

  // Security & audit
  { name: 'audit_logs',                  category: 'Security'    },
  { name: 'security_logs',              category: 'Security'    },
  { name: 'user_sessions',             category: 'Security'    },
  { name: 'login_history',             category: 'Security'    },
  { name: 'data_access_audit',         category: 'Security'    },

  // Finance
  { name: 'payment_transactions',       category: 'Finance'     },
  { name: 'insurance_claims',           category: 'Finance'     },

  // FHIR
  { name: 'fhir_patients',             category: 'FHIR'        },
  { name: 'fhir_practitioners',        category: 'FHIR'        },
  { name: 'fhir_organizations',        category: 'FHIR'        },

  // Content & engagement
  { name: 'reviews',                    category: 'Content'     },
  { name: 'waitlist',                   category: 'Content'     },
  { name: 'referrals',                  category: 'Content'     },
  { name: 'exercise_assignments',       category: 'Content'     },
  { name: 'specialties',                category: 'Content'     },

  // Admin config (may be missing)
  { name: 'system_config',              category: 'Admin'       },
  { name: 'blogs',                      category: 'Admin'       },
];

async function run() {
  let online = 0;
  let missing = 0;
  let lastCategory = '';

  for (const table of TABLES) {
    if (table.category !== lastCategory) {
      console.log(`\n── ${table.category} ────────────────────────────────────────`);
      lastCategory = table.category;
    }

    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ❌  ${table.name.padEnd(28)} ➔  MISSING / ERROR`);
        missing++;
      } else {
        console.log(`  ✅  ${table.name.padEnd(28)} ➔  ONLINE  (${count ?? 0} rows)`);
        online++;
      }
    } catch (e) {
      console.log(`  ❌  ${table.name.padEnd(28)} ➔  EXCEPTION (${e.message})`);
      missing++;
    }
  }

  console.log("\n=======================================================");
  console.log(`📊  TOTAL: ${online} Online  |  ${missing} Missing`);

  if (missing === 0) {
    console.log("🎉  All tables are present and accessible!");
  } else {
    console.log(`⚠️   ${missing} table(s) need to be created.`);
    console.log("    Run: backend/core/migrations/fix_missing_tables.sql in Supabase SQL Editor");
  }
  console.log("=======================================================\n");
}

run();
