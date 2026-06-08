# Graph Report - Netra-Ai  (2026-05-19)

## Corpus Check
- 766 files · ~729,127 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6184 nodes · 13508 edges · 85 communities detected
- Extraction: 52% EXTRACTED · 48% INFERRED · 0% AMBIGUOUS · INFERRED: 6537 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 124|Community 124]]
- [[_COMMUNITY_Community 136|Community 136]]
- [[_COMMUNITY_Community 141|Community 141]]
- [[_COMMUNITY_Community 222|Community 222]]
- [[_COMMUNITY_Community 223|Community 223]]
- [[_COMMUNITY_Community 224|Community 224]]
- [[_COMMUNITY_Community 225|Community 225]]
- [[_COMMUNITY_Community 226|Community 226]]
- [[_COMMUNITY_Community 227|Community 227]]
- [[_COMMUNITY_Community 228|Community 228]]
- [[_COMMUNITY_Community 234|Community 234]]
- [[_COMMUNITY_Community 235|Community 235]]

## God Nodes (most connected - your core abstractions)
1. `Table()` - 411 edges
2. `TokenPayload` - 371 edges
3. `Col` - 228 edges
4. `Tables` - 223 edges
5. `ContextManager` - 165 edges
6. `ConversationMemory` - 149 edges
7. `AIValidationService` - 141 edges
8. `PromptTemplate` - 139 edges
9. `t()` - 120 edges
10. `AnalyticsService` - 93 edges

## Surprising Connections (you probably didn't know these)
- `Adds scans, appointments, and vitals for a patient.` --uses--> `Tables`  [INFERRED]
  backend\core\reseed_presentation_data.py → backend\core\app\db\schema.py
- `Adds mock medical documents for a patient.` --uses--> `Tables`  [INFERRED]
  backend\core\reseed_presentation_data.py → backend\core\app\db\schema.py
- `Adds historical timeline events for a patient.` --uses--> `Tables`  [INFERRED]
  backend\core\reseed_presentation_data.py → backend\core\app\db\schema.py
- `Session Timeout Middleware (HIPAA Compliant).  Automatically tracks user activ` --uses--> `SessionExpiredError`  [INFERRED]
  backend\core\app\middleware\session_timeout.py → backend\core\app\services\session_service.py
- `Middleware to enforce session timeout.      Features:     - Tracks last activ` --uses--> `SessionExpiredError`  [INFERRED]
  backend\core\app\middleware\session_timeout.py → backend\core\app\services\session_service.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (566): _notify_and_grant_points(), Increment progress for a specific achievement.     If progress reaches target_v, Helper to silently update user_points and push notification (soft fail ok)., record_achievement_progress(), approve_refund(), create_team_member(), delete_review(), delete_team_member() (+558 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (355): AppointmentConflictError, AppointmentService, DoctorUnavailableError, get_appointment_service(), Industrial-Grade Appointment Service with Overlap Prevention.  Features: - Ov, Get available time slots for a doctor on a specific date.          Args:, # TODO: Fetch from doctor's availability settings, Schedule a new appointment with overlap prevention.          Args: (+347 more)

### Community 2 - "Community 2"
Cohesion: 0.01
Nodes (262): fetchMemberDetails(), handleSubmit(), Determine fallback action for failed validation, handleSend(), ApiClient, getSupabaseAccessToken(), useApi(), ComplianceService (+254 more)

### Community 3 - "Community 3"
Cohesion: 0.02
Nodes (218): AIMonitoringService, get_monitoring_service(), AI Monitoring Service Tracks AI performance metrics, detects drift, and provide, Service for monitoring AI performance and detecting issues, Get daily aggregated metrics          Args:             model_name: Model nam, Update daily metrics for a model (called after each request), Detect performance drift over time          Args:             model_name: Mod, Track an AI request          Args:             user_id: User ID (+210 more)

### Community 4 - "Community 4"
Cohesion: 0.01
Nodes (132): handleShare(), handleStartChallenge(), triggerDownload(), exportReport(), exportCSV(), handleDownloadPDF(), handleExportMCP(), handleGenerate() (+124 more)

### Community 5 - "Community 5"
Cohesion: 0.02
Nodes (155): calculate_anemia_status(), init_logger(), log_inference(), Calculate anemic status based on sex-specific Hb thresholds.     < 12.0 g/dL (F, Ensure log directory and audit file exist with headers., Log inference details with expanded clinical metadata., config.py - Configuration settings for NetraAI, AdaptiveThresholdSegmentation (+147 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (192): cached(), CacheEntry, get_ml_cache(), InMemoryCache, In-memory caching utility for ML model results. Uses TTL (Time To Live) to auto, Generate cache key from function arguments.          Args:             *args:, Get value from cache.          Args:             key: Cache key          Re, Set value in cache.          Args:             key: Cache key             va (+184 more)

### Community 7 - "Community 7"
Cohesion: 0.01
Nodes (220): ai_health(), _append_disclaimer(), AssistantFeedbackRequest, AssistantRequest, _audit_ai_interaction(), consultation_scribe(), extract_lab_vitals(), _extract_user_value() (+212 more)

### Community 8 - "Community 8"
Cohesion: 0.01
Nodes (161): acknowledge_alert(), AlertResponse, BiasMetrics, DriftMetrics, get_alerts(), get_bias_metrics(), get_drift_metrics(), get_latest_metrics() (+153 more)

### Community 9 - "Community 9"
Cohesion: 0.02
Nodes (180): _classify_anemia_severity(), diagnose_anemia(), _get_anemia_recommendation(), Tool 1: diagnose_anemia  Analyze palpebral conjunctiva image to detect anemia an, WHO 2023 Gender-Specific Classification., WHO 2023 Gender-Specific Classification., WHO-based clinical support., WHO-based clinical support. (+172 more)

### Community 10 - "Community 10"
Cohesion: 0.02
Nodes (133): get_platform_stats(), Platform wide statistics overview using optimized database views., export_analytics(), get_ai_usage_analytics(), get_analytics_service(), get_appointment_analytics(), get_appointment_trends(), get_doctor_performance() (+125 more)

### Community 11 - "Community 11"
Cohesion: 0.02
Nodes (116): setupWS(), setupRealtime(), handleSearch(), setupRealtime(), getClient(), healthCheck(), transaction(), cleanup() (+108 more)

### Community 12 - "Community 12"
Cohesion: 0.02
Nodes (141): ConversationNotFoundError, get_message_service(), MessageService, Industrial-Grade Message Service (HIPAA Compliant).  Features: - Create conve, Find existing direct conversation between two users.          Args:, Send a message in a conversation.          Args:             conversation_id:, Check if user is an active participant in conversation.          Args:, Get conversation message history (paginated).          Args:             conv (+133 more)

### Community 13 - "Community 13"
Cohesion: 0.02
Nodes (122): add_animation_imports(), find_page_file(), has_animations(), main(), process_page(), Wrap the main return JSX with motion.div., Process a single page file., Find the page file in various possible locations. (+114 more)

### Community 14 - "Community 14"
Cohesion: 0.03
Nodes (122): _best_effort_audit(), detect_suspicious_activity(), _get_attempt_state(), get_auth_security_policy(), get_login_history(), get_recent_logins(), login_precheck(), LoginAttemptReportRequest (+114 more)

### Community 15 - "Community 15"
Cohesion: 0.03
Nodes (89): CataractDetector, Cataract Detection AI - Production Deployment Code Model: Swin-Base Transformer, Initialize Grad-CAM generator for XAI, Predict cataract from preprocessed image tensor          Args:             im, Production-ready cataract detection system with XAI support      Features:, Get detailed model information          Returns:             Dictionary with, Predict cataract with XAI (Grad-CAM) visualization          Args:, Initialize the cataract detector          Args:             model_path: Path (+81 more)

### Community 16 - "Community 16"
Cohesion: 0.04
Nodes (74): ExcelReportGenerator, Excel Report Generator for NetraAI MCP Analytics Generates comprehensive Excel, Create dashboard summary sheet., Create usage trends sheet with chart., Professional Excel report generator for MCP analytics and audit logs.      Fea, Create success rates sheet with chart., Create latency distribution sheet., Create geographic distribution sheet. (+66 more)

### Community 17 - "Community 17"
Cohesion: 0.04
Nodes (53): AccessibilityTester, addAnimationImports(), hasAnimations(), main(), processPage(), wrapWithMotion(), AnimationPerformanceMonitor, query() (+45 more)

### Community 18 - "Community 18"
Cohesion: 0.03
Nodes (71): get_document_service(), FamilyAccountService, get_family_account_service(), get_health_goals_service(), HealthGoalsService, get_medication_reminder_service(), add_family_member(), create_health_goal() (+63 more)

### Community 19 - "Community 19"
Cohesion: 0.03
Nodes (57): ActivityLoggingMiddleware, Middleware to log user activity., AdvancedRateLimitingMiddleware, Get the real client IP address., Advanced rate limiting with multiple strategies:     - Per-IP rate limiting, Extract user ID from request if available., Get rate limit configuration for an endpoint., Check if IP is within rate limits. (+49 more)

### Community 20 - "Community 20"
Cohesion: 0.05
Nodes (35): A2AAgent, ModelMonitor, Model drift and performance monitoring using Evidently AI.     Saves reports to, Compare current inference data against baseline to detect drift., main(), NetraAIPriorAuthAgent, Create AgentCard from JSON data, Main task handler for A2A requests                  Routes tasks to appropriat (+27 more)

### Community 21 - "Community 21"
Cohesion: 0.04
Nodes (45): Achievements, Appointments, AuditLogs, Badges, Challenges, ClinicalNotes, ComplaintMessages, Complaints (+37 more)

### Community 22 - "Community 22"
Cohesion: 0.06
Nodes (28): cleanup_test_data(), client(), mock_admin(), mock_doctor(), mock_user(), Pytest configuration and fixtures, Test client for API testing, Mock authenticated user (+20 more)

### Community 23 - "Community 23"
Cohesion: 0.13
Nodes (37): Colors, main(), print_error(), print_header(), print_success(), print_test(), print_warning(), Test 4: FHIR Scopes Declaration (+29 more)

### Community 24 - "Community 24"
Cohesion: 0.07
Nodes (22): audit_tool(), AuditLogger, Custom Audit Logging System for NetraAI MCP Server (FREE) Uses Supabase free ti, Scrub Protected Health Information (PHI) from data.          Removes or redact, Check if a string is a valid UUID.                  Args:             uuid_st, Scrub Protected Health Information (PHI) from data.          Removes or redact, Check if a field name indicates PHI.          Args:             field_name: F, Free audit logging using Supabase.     Provides HIPAA-compliant audit trails wi (+14 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (25): APIError, AuthenticationError, AuthorizationError, ConflictError, DatabaseError, handle_database_error(), NotFoundError, Centralized error handling utilities (+17 more)

### Community 26 - "Community 26"
Cohesion: 0.1
Nodes (25): addContext(), checkModelHealth(), checkRateLimit(), clearContext(), compressContext(), createAIRequest(), createPromptTemplate(), deletePromptTemplate() (+17 more)

### Community 27 - "Community 27"
Cohesion: 0.09
Nodes (5): isOnline(), OfflineSync, saveForOfflineSync(), syncAllData(), useOfflineSync()

### Community 28 - "Community 28"
Cohesion: 0.07
Nodes (16): ConfigurationPage(), DoctorFollowUpTemplates(), DrugAutocomplete(), HealthRiskAssessmentPage(), useTranslation(), MessageBubble(), Navbar(), PrivacyPolicyPage() (+8 more)

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (19): collect_soc2_evidence(), _generate_mock_fda_metrics(), get_fda_alerts(), get_fda_metrics(), get_fda_models(), get_iec_coverage_stats(), get_iec_requirements(), get_latest_fda_metrics() (+11 more)

### Community 30 - "Community 30"
Cohesion: 0.13
Nodes (14): onSubmit(), AnalyticsDashboard(), buildDemoUsage(), getRequiredApiBaseUrl(), getSupabaseAccessToken(), fetchSafe(), GET(), POST() (+6 more)

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (23): _build_html_email(), fetch_templates(), _get_sendgrid(), _get_twilio(), process_appointments(), process_medication_reminders(), Netra AI — Notification Scheduler & Dispatch Engine ===========================, Dispatch an SMS via Twilio. Falls back to mock logging if unconfigured. (+15 more)

### Community 32 - "Community 32"
Cohesion: 0.19
Nodes (15): main(), MCPLocalTester, print_error(), print_header(), print_info(), print_success(), print_warning(), Test health endpoint. (+7 more)

### Community 33 - "Community 33"
Cohesion: 0.19
Nodes (11): main(), Test AI service prediction endpoint (without actual file), Test frontend accessibility, Run all service tests, Print formatted header, Print success message, Print warning message, Test service health endpoint (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.1
Nodes (2): getAllErrorMessages(), getFirstErrorMessage()

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (11): create_enhanced_model(), create_simple_model(), EnhancedAnemiaNet, NetraAI - PyTorch CNN Model for Anemia Detection Converted from TensorFlow impl, Enhanced CNN model with proper architecture for 96% accuracy, Count total trainable parameters, Create enhanced PyTorch model, Create simple PyTorch model (+3 more)

### Community 36 - "Community 36"
Cohesion: 0.14
Nodes (15): check_model_health(), deploy_model(), get_all_models_status(), get_model_details(), get_model_statistics(), get_public_model_info(), AI Model Status Tracking Routes Monitors and manages all AI models in the platf, Get detailed information about a specific AI model (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.13
Nodes (8): AnimatedPageTransition(), AnimatedTooltip(), FadeIn(), ScaleIn(), SlideIn(), StaggerContainer(), useAnimationConfig(), useReducedMotion()

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (9): Generate the authorization URL for the SMART launch., Fetch the access token using the authorization response., Validate the bearer token.         In a production environment, this would check, Token storage implementation for Supabase persistence., SMART on FHIR Client implementation using Authlib.     Supports OAuth 2.0 Launch, save_token(), SMARTonFHIRClient, TokenStorage (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.24
Nodes (10): MockContext, Demo Scenarios for Hackathon Presentation  These are the 3 "Winning Scenarios", Scenario B: The "Vision Problems" Workflow      Patient: John Smith (58M, Diab, Scenario C: The "Tremor" Workflow      Patient: Mary Johnson (67F)     Chief, Scenario A: The "Fatigue" Workflow      Patient: Jane Doe (45F)     Chief Com, Run all 3 winning scenarios for hackathon demo., run_all_scenarios(), scenario_a_fatigue_workup() (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.24
Nodes (11): downloadExport(), exportAnalytics(), getAIUsageAnalytics(), getAnalyticsOverview(), getAppointmentAnalytics(), getExportStatus(), getMessagingAnalytics(), getRevenueAnalytics() (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.2
Nodes (13): generate_audit_logs(), generate_backup_logs(), generate_export_requests(), generate_health_checks(), generate_sessions(), main(), Demo Data Generator for Netra AI Generates sample data for hackathon demonstrat, Generate sample user sessions (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.34
Nodes (13): Colors, main(), print_error(), print_header(), print_info(), print_success(), print_summary(), print_warning() (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.43
Nodes (13): Main(), Test-AdditionalApis(), Test-AdminApi(), Test-AiApi(), Test-CoreHealth(), Test-DoctorApi(), Test-Endpoint(), Test-PatientApi() (+5 more)

### Community 44 - "Community 44"
Cohesion: 0.26
Nodes (1): ComplaintService

### Community 45 - "Community 45"
Cohesion: 0.22
Nodes (6): AIService, AI Service with Groq Integration (Production-Ready)  Triple-Fallback Strategy: 1, Chat using Groq API (llama-3.3-70b-versatile)., Chat using Google Gemini API (gemini-1.5-flash)., Production-ready AI service with dual-fallback strategy.     Optimized for hacka, Main chat interface with dual-fallback logic.          Args:             prompt:

### Community 46 - "Community 46"
Cohesion: 0.27
Nodes (6): validateAppointmentForm(), validateForm(), validateLoginForm(), validateMedicalRecordForm(), validatePrescriptionForm(), validateRegistrationForm()

### Community 47 - "Community 47"
Cohesion: 0.42
Nodes (9): createIndexFiles(), ensureDir(), generateFeatureIndex(), generateMainIndex(), generateUIIndex(), log(), moveComponentsByCategory(), moveFile() (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 49 - "Community 49"
Cohesion: 0.39
Nodes (3): ConnectionManager, Broadcast delta diffs to all clients in the room except the sender., websocket_endpoint()

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (5): detailed_health(), health_check(), Health check and system monitoring endpoints. Returns uptime, database connecti, Basic liveness check - returns 200 OK if server is running., Detailed health metrics including system resources.

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (5): create_enhanced_model(), create_simple_model(), NetraAI - Enhanced CNN Model (Fixed Architecture), Enhanced model with proper architecture for 96% accuracy, Original simple CNN from GitHub

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (1): deletePatient()

### Community 64 - "Community 64"
Cohesion: 0.47
Nodes (3): getContrastRatio(), getRelativeLuminance(), hexToRgb()

### Community 65 - "Community 65"
Cohesion: 0.33
Nodes (3): AdminRoute(), useAuth(), ProtectedRoute()

### Community 68 - "Community 68"
Cohesion: 0.53
Nodes (4): FormControl(), FormDescription(), FormMessage(), useFormField()

### Community 70 - "Community 70"
Cohesion: 0.5
Nodes (3): Standalone Demo Runner for Hackathon Presentation  Runs the 3 winning scenario, Run all 3 demo scenarios, run_demo()

### Community 71 - "Community 71"
Cohesion: 0.4
Nodes (3): get_agent_card(), Generate an A2A Specification v1.0 compliant agent card with enhanced SHARP-on-M, Generate an A2A Specification v1.0 compliant agent card with enhanced SHARP-on-M

### Community 72 - "Community 72"
Cohesion: 0.4
Nodes (3): create_fhir_resource(), get_fhir_resources(), Get FHIR resources by type.

### Community 73 - "Community 73"
Cohesion: 0.8
Nodes (4): fixAllImports(), fixImportsInFile(), log(), printSummary()

### Community 74 - "Community 74"
Cohesion: 0.8
Nodes (4): log(), printSummary(), updateAllImports(), updateImportsInFile()

### Community 77 - "Community 77"
Cohesion: 0.5
Nodes (2): getSupabaseAccessToken(), handleRunTool()

### Community 79 - "Community 79"
Cohesion: 0.7
Nodes (4): addTimeSlot(), copySchedule(), handleScheduleUpdate(), removeTimeSlot()

### Community 83 - "Community 83"
Cohesion: 0.5
Nodes (4): download_model_files(), main(), Main function to download all models., Download model files from HuggingFace Space.

### Community 84 - "Community 84"
Cohesion: 0.7
Nodes (4): generate_bundle(), generate_observation(), generate_patient(), main()

### Community 85 - "Community 85"
Cohesion: 0.5
Nodes (2): Decorator to track tool metrics automatically., track_metrics()

### Community 91 - "Community 91"
Cohesion: 0.5
Nodes (1): toggleEventExpansion()

### Community 96 - "Community 96"
Cohesion: 0.5
Nodes (2): App(), MFASetup()

### Community 97 - "Community 97"
Cohesion: 0.5
Nodes (1): toggleSection()

### Community 99 - "Community 99"
Cohesion: 0.5
Nodes (2): NotificationBadge(), useNotifications()

### Community 110 - "Community 110"
Cohesion: 0.67
Nodes (1): main()

### Community 111 - "Community 111"
Cohesion: 0.67
Nodes (2): BaseSettings, Settings

### Community 112 - "Community 112"
Cohesion: 1.0
Nodes (2): log(), mergeDuplicates()

### Community 124 - "Community 124"
Cohesion: 1.0
Nodes (2): handleKeyDown(), toggleItem()

### Community 136 - "Community 136"
Cohesion: 0.67
Nodes (1): cn()

### Community 141 - "Community 141"
Cohesion: 0.67
Nodes (2): generate_test_assets(), Generates sample datasets and dummy images for NetraAI platform verification.

### Community 222 - "Community 222"
Cohesion: 1.0
Nodes (1): Get current circuit state.

### Community 223 - "Community 223"
Cohesion: 1.0
Nodes (1): Check if circuit is closed (normal operation).

### Community 224 - "Community 224"
Cohesion: 1.0
Nodes (1): Check if circuit is open (failing fast).

### Community 225 - "Community 225"
Cohesion: 1.0
Nodes (1): Check if circuit is half-open (testing recovery).

### Community 226 - "Community 226"
Cohesion: 1.0
Nodes (1): Validates an uploaded image file for:           - Allowed MIME type

### Community 227 - "Community 227"
Cohesion: 1.0
Nodes (1): Generate a secure, unique filename for storage.          Strips the original n

### Community 228 - "Community 228"
Cohesion: 1.0
Nodes (1): Returns a safe version of the original filename, trimmed to max_length.

### Community 234 - "Community 234"
Cohesion: 1.0
Nodes (1): Triangle thresholding (CP-AnemiC dataset method).          Args:

### Community 235 - "Community 235"
Cohesion: 1.0
Nodes (1): Color-based segmentation using HSV and YCrCb.          Args:             imag

## Knowledge Gaps
- **1106 isolated node(s):** `NetraAI Full Health Check Script Checks all 6 HF Spaces + MCP internal tool heal`, `NetraAI Prior Authorization Automation Agent          Implements the A2A proto`, `Create AgentCard from JSON data`, `Main task handler for A2A requests                  Routes tasks to appropriat`, `Extract data from task message` (+1101 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 34`** (21 nodes): `applyValidationErrors()`, `combineValidators()`, `createAsyncValidator()`, `createConditionalValidator()`, `createFileValidator()`, `createFormError()`, `debounceValidation()`, `formatDateForDisplay()`, `formatDateForInput()`, `formatPhoneNumber()`, `getAllErrorMessages()`, `getFieldErrorMessage()`, `getFirstErrorMessage()`, `getFormDataAsFormData()`, `hasFieldError()`, `hasFormErrors()`, `mergeValidationErrors()`, `sanitizeFormData()`, `validateFileUpload()`, `validateFormBeforeSubmit()`, `formIntegration.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (13 nodes): `ComplaintService`, `.getAuthToken()`, `.getComplaintCategories()`, `.getComplaints()`, `.getComplaintStats()`, `.getCurrentUser()`, `.getMyComplaints()`, `.submitComplaint()`, `.trackAnalytics()`, `.updateComplaint()`, `.uploadAttachments()`, `complaintService.ts`, `complaintService.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (10 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarFooter()`, `SidebarHeader()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `SidebarSeparator()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (6 nodes): `usePatient.ts`, `createPatient()`, `deletePatient()`, `updatePatient()`, `usePatient()`, `usePatients()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (5 nodes): `MCPManagementPage.tsx`, `getSupabaseAccessToken()`, `getToolInfo()`, `handleRefresh()`, `handleRunTool()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (4 nodes): `metrics.py`, `metrics.py`, `Decorator to track tool metrics automatically.`, `track_metrics()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 91`** (4 nodes): `PatientMedicalHistory.tsx`, `getEventColor()`, `getEventIcon()`, `toggleEventExpansion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (4 nodes): `App()`, `App.tsx`, `MFASetup.tsx`, `MFASetup()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 97`** (4 nodes): `SOAPEditor.tsx`, `applyTemplate()`, `handleChange()`, `toggleSection()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 99`** (4 nodes): `useNotifications.ts`, `NotificationBadge.tsx`, `NotificationBadge()`, `useNotifications()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 110`** (3 nodes): `scratch_inspect.py`, `scratch_inspect.py`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 111`** (3 nodes): `config.py`, `BaseSettings`, `Settings`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (3 nodes): `merge-duplicates.js`, `log()`, `mergeDuplicates()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (3 nodes): `handleKeyDown()`, `toggleItem()`, `animated-accordion.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (3 nodes): `utils.ts`, `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (3 nodes): `generate_test_assets()`, `Generates sample datasets and dummy images for NetraAI platform verification.`, `generate_test_assets.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 222`** (1 nodes): `Get current circuit state.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 223`** (1 nodes): `Check if circuit is closed (normal operation).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 224`** (1 nodes): `Check if circuit is open (failing fast).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 225`** (1 nodes): `Check if circuit is half-open (testing recovery).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 226`** (1 nodes): `Validates an uploaded image file for:           - Allowed MIME type`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 227`** (1 nodes): `Generate a secure, unique filename for storage.          Strips the original n`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 228`** (1 nodes): `Returns a safe version of the original filename, trimmed to max_length.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 234`** (1 nodes): `Triangle thresholding (CP-AnemiC dataset method).          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 235`** (1 nodes): `Color-based segmentation using HSV and YCrCb.          Args:             imag`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Table()` connect `Community 0` to `Community 1`, `Community 2`, `Community 38`, `Community 7`, `Community 6`, `Community 9`, `Community 10`, `Community 107`, `Community 12`, `Community 14`, `Community 16`, `Community 18`, `Community 19`, `Community 20`, `Community 22`, `Community 24`, `Community 29`, `Community 31`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `TokenPayload` connect `Community 1` to `Community 0`, `Community 2`, `Community 6`, `Community 7`, `Community 10`, `Community 16`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `t()` connect `Community 4` to `Community 2`, `Community 11`, `Community 30`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 499 inferred relationships involving `str` (e.g. with `get()` and `post()`) actually correct?**
  _`str` has 499 INFERRED edges - model-reasoned connections that need verification._
- **Are the 410 inferred relationships involving `Table()` (e.g. with `.log_tool_invocation()` and `.log_authentication()`) actually correct?**
  _`Table()` has 410 INFERRED edges - model-reasoned connections that need verification._
- **Are the 369 inferred relationships involving `TokenPayload` (e.g. with `Get current user from WebSocket token.      Args:         token: JWT token fr` and `Verify a Supabase JWT token with support for Base64 secrets and detailed logging`) actually correct?**
  _`TokenPayload` has 369 INFERRED edges - model-reasoned connections that need verification._
- **Are the 227 inferred relationships involving `Col` (e.g. with `List all verified doctors for patients with optional search.` and `Get a single doctor by ID. Falls back to mock data if not found in DB.`) actually correct?**
  _`Col` has 227 INFERRED edges - model-reasoned connections that need verification._