#!/usr/bin/env python3
"""Verify all MCP server fixes (Windows-compatible)"""
import sys
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 80)
print("MCP SERVER FIX VERIFICATION")
print("=" * 80)

errors = []
warnings = []

# Test 1: Import main module
print("\n[TEST 1] Importing main module...")
try:
    sys.path.insert(0, '.')
    import main
    print("PASS: Main module imported successfully")
except Exception as e:
    print(f"FAIL: {e}")
    errors.append("Main module import failed")

# Test 2: Check FastMCP server
print("\n[TEST 2] Checking FastMCP server...")
try:
    if hasattr(main, 'mcp'):
        print(f"PASS: FastMCP server created - {main.mcp.name}")
    else:
        print("FAIL: FastMCP server not found")
        errors.append("FastMCP server not found")
except Exception as e:
    print(f"FAIL: {e}")
    errors.append("FastMCP server check failed")

# Test 3: Check FastAPI app
print("\n[TEST 3] Checking FastAPI app...")
try:
    if hasattr(main, 'app'):
        print("PASS: FastAPI app created")
    else:
        print("FAIL: FastAPI app not found")
        errors.append("FastAPI app not found")
except Exception as e:
    print(f"FAIL: {e}")
    errors.append("FastAPI app check failed")

# Test 4: Check tool imports
print("\n[TEST 4] Checking tool imports...")
try:
    from tools import anemia, cataract, dr, mental_health, parkinsons
    from tools import fhir_ops, comparison, prior_auth, workflow
    print("PASS: All tool modules imported")
except Exception as e:
    print(f"FAIL: {e}")
    errors.append("Tool imports failed")

# Test 5: Check audit logger
print("\n[TEST 5] Checking audit logger...")
try:
    from audit.logger import audit_logger
    if audit_logger.supabase:
        print("PASS: Audit logger initialized with Supabase")
    else:
        print("WARN: Audit logger in degraded mode")
        warnings.append("Audit logger not connected to Supabase")
except Exception as e:
    print(f"FAIL: {e}")
    errors.append("Audit logger check failed")

# Test 6: Check environment variables
print("\n[TEST 6] Checking environment variables...")
required_vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'MCP_API_KEY']
missing = []
for var in required_vars:
    if os.getenv(var):
        print(f"PASS: {var} is set")
    else:
        print(f"FAIL: {var} not set")
        missing.append(var)

if missing:
    errors.append(f"Missing environment variables: {', '.join(missing)}")

# Test 7: Test database connection
print("\n[TEST 7] Testing database connection...")
try:
    from supabase import create_client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if supabase_url and supabase_key:
        client = create_client(supabase_url, supabase_key)
        result = client.table("audit_logs").select("*").limit(1).execute()
        print("PASS: Database connection successful")
        
        # Test analytics views
        views = [
            "vw_mcp_tool_performance",
            "vw_mcp_usage_trends_hourly",
            "vw_mcp_usage_trends_daily",
            "vw_mcp_error_breakdown",
            "vw_mcp_latency_stats"
        ]
        
        view_errors = []
        for view in views:
            try:
                client.table(view).select("*").limit(1).execute()
            except Exception as e:
                view_errors.append(view)
        
        if view_errors:
            print(f"WARN: Some views not accessible: {', '.join(view_errors)}")
            warnings.append(f"Views not accessible: {', '.join(view_errors)}")
        else:
            print("PASS: All analytics views accessible")
    else:
        print("SKIP: Database credentials not set")
        warnings.append("Database credentials not set")
        
except Exception as e:
    print(f"FAIL: {e}")
    errors.append("Database connection failed")

# Test 8: Test audit logger insert
print("\n[TEST 8] Testing audit logger insert...")
try:
    import asyncio
    from audit.logger import audit_logger
    
    async def test_insert():
        if not audit_logger.enabled or not audit_logger.supabase:
            return False
        
        await audit_logger.log_tool_invocation(
            tool_name="verify_test_tool",
            user_id=None,  # Will be stored in old_data
            patient_id="test_patient",
            action="test",
            status="success",
            input_data={"test": "input"},
            output_data={"test": "output"},
            execution_time_ms=100.0,
        )
        return True
    
    if asyncio.run(test_insert()):
        print("PASS: Audit logger insert successful")
    else:
        print("SKIP: Audit logger not enabled")
        warnings.append("Audit logger not enabled")
        
except Exception as e:
    print(f"FAIL: {e}")
    errors.append("Audit logger insert failed")

# Summary
print("\n" + "=" * 80)
print("VERIFICATION SUMMARY")
print("=" * 80)

if errors:
    print(f"\nERRORS FOUND ({len(errors)}):")
    for i, error in enumerate(errors, 1):
        print(f"  {i}. {error}")

if warnings:
    print(f"\nWARNINGS ({len(warnings)}):")
    for i, warning in enumerate(warnings, 1):
        print(f"  {i}. {warning}")

if not errors:
    print("\nSUCCESS: All critical tests passed!")
    print("\nThe MCP server is fully operational and can be started with:")
    print("  python main.py")
    print("  or")
    print("  uvicorn main:app --host 0.0.0.0 --port 8080")
    exit(0)
else:
    print("\nFAILURE: Critical errors found. Please review the errors above.")
    exit(1)
