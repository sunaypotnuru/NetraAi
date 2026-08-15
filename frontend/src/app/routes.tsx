import { createBrowserRouter, Navigate } from "react-router";
import React, { lazy, Suspense, ComponentType } from "react";
import Root from "./pages/Root";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import SignUpRolePage from "./pages/SignUpRolePage";
import PatientLoginPage from "./pages/PatientLoginPage";
import SignUpPage from "./pages/SignUpPage";
import NotFoundPage from "./pages/NotFoundPage";
import ErrorBoundary from "../components/shared/ErrorBoundary";
import { ECGLoadingScreen } from "../components/shared/ECGLoadingScreen";
import ProtectedRoute from "../components/features/domain/ProtectedRoute";

// Helper to wrap lazy components with Suspense and auto-recovery for chunk errors
const withSuspense = (LazyComp: React.LazyExoticComponent<any>) => {
    const Wrapped: React.FC<any> = (props) => (
        <ErrorBoundary>
            <Suspense fallback={<ECGLoadingScreen />}>
                <LazyComp {...props} />
            </Suspense>
        </ErrorBoundary>
    );
    return Wrapped;
};

// Error-resilient lazy loader to handle version mismatches/chunk load errors
const lazyWithRetry = (componentImport: () => Promise<{ default: ComponentType<any> }>) =>
    lazy(async () => {
        try {
            return await componentImport();
        } catch (error: any) {
            console.error("Lazy loading failed, attempting auto-recovery...", error);
            // Check if error is related to missing chunks (typical after new deployment)
            const errorMsg = error?.message || error?.toString() || "";
            if (errorMsg.includes("fetch") || errorMsg.includes("dynamically imported module")) {
                // Perform a one-time force reload to get fresh index.html with new hashes
                window.location.reload();
                // Return a dummy promise to keep React happy while page reloads
                return new Promise(() => {});
            }
            throw error;
        }
    });

const DoctorLoginPage = withSuspense(lazyWithRetry(() => import("./pages/DoctorLoginPage")));
const AdminLoginPage = withSuspense(lazyWithRetry(() => import("./pages/AdminLoginPage")));
const DoctorSignUpPage = withSuspense(lazyWithRetry(() => import("./pages/DoctorSignUpPage")));
const DashboardPage = withSuspense(lazyWithRetry(() => import("./pages/DashboardPage")));
const DoctorsPage = withSuspense(lazyWithRetry(() => import("./pages/DoctorsPage")));
const DoctorDetailPage = withSuspense(lazyWithRetry(() => import("./pages/DoctorDetailPage")));
const AppointmentsPage = withSuspense(lazyWithRetry(() => import("./pages/AppointmentsPage")));
const VideoCallPage = withSuspense(lazyWithRetry(() => import("./pages/VideoCallPage")));
const WaitingRoomPage = withSuspense(lazyWithRetry(() => import("./pages/WaitingRoomPage")));
const AnemiaDetectionPage = withSuspense(lazyWithRetry(() => import("./pages/AnemiaDetectionPage")));
const CataractScanPage = withSuspense(lazyWithRetry(() => import("./pages/patient/CataractScanPage")));
const DiabeticRetinopathyScanPage = withSuspense(lazyWithRetry(() => import("./pages/patient/DiabeticRetinopathyScanPage")));
const MentalHealthPage = withSuspense(lazyWithRetry(() => import("./pages/patient/MentalHealthPage")));
const ParkinsonsVoicePage = withSuspense(lazyWithRetry(() => import("./pages/patient/ParkinsonsVoicePage")));
const ARSessionPage = withSuspense(lazyWithRetry(() => import("./pages/patient/ARSessionPage")));
const MedicationSchedulePage = withSuspense(lazyWithRetry(() => import("./pages/patient/MedicationSchedulePage")));
const PROSubmissionPage = withSuspense(lazyWithRetry(() => import("./pages/patient/PROSubmissionPage")));
const PatientExercisesPage = withSuspense(lazyWithRetry(() => import("./pages/patient/PatientExercisesPage")));
const ProfilePage = withSuspense(lazyWithRetry(() => import("./pages/ProfilePage")));
const NearbyHospitalsPage = withSuspense(lazyWithRetry(() => import("./pages/NearbyHospitalsPage")));
const MedicalHistoryPage = withSuspense(lazyWithRetry(() => import("./pages/MedicalHistoryPage")));

// New Feature Pages - Lazy loaded
const MessagesPage = withSuspense(lazyWithRetry(() => import("./pages/MessagesPage")));
const AchievementsPage = withSuspense(lazyWithRetry(() => import("./pages/AchievementsPage")));
const ReferralPage = withSuspense(lazyWithRetry(() => import("./pages/ReferralPage")));
const NotificationSettingsPage = withSuspense(lazyWithRetry(() => import("./pages/NotificationSettingsPage")));
const DocumentsPage = withSuspense(lazyWithRetry(() => import("./pages/DocumentsPage")));
const PrescriptionTemplatesPage = withSuspense(lazyWithRetry(() => import("./pages/PrescriptionTemplatesPage")));
const HealthTimelinePage = withSuspense(lazyWithRetry(() => import("./pages/HealthTimelinePage")));
const PatientChatbotPage = withSuspense(lazyWithRetry(() => import("./pages/PatientChatbotPage")));
const ModelsPage = withSuspense(lazyWithRetry(() => import("./pages/ModelsPage")));
const LabAnalyzerPage = withSuspense(lazyWithRetry(() => import("./pages/LabAnalyzerPage")));
const InsuranceVerificationPage = withSuspense(lazyWithRetry(() => import("./pages/InsuranceVerificationPage")));
const HealthRiskAssessmentPage = withSuspense(lazyWithRetry(() => import("./pages/HealthRiskAssessmentPage")));
const MedicationRemindersPage = withSuspense(lazyWithRetry(() => import("./pages/MedicationRemindersPage")));
const MedicationsListPage = withSuspense(lazyWithRetry(() => import("./pages/patient/medications/MedicationsListPage")));
const MedicationDetailsPage = withSuspense(lazyWithRetry(() => import("./pages/patient/medications/MedicationDetailsPage")));
const MedicationLogPage = withSuspense(lazyWithRetry(() => import("./pages/patient/medications/MedicationLogPage")));
const HealthGoalsDashboard = withSuspense(lazyWithRetry(() => import("./pages/patient/goals/HealthGoalsDashboard")));
const CreateHealthGoalPage = withSuspense(lazyWithRetry(() => import("./pages/patient/goals/CreateHealthGoalPage")));
const HealthGoalDetailsPage = withSuspense(lazyWithRetry(() => import("./pages/patient/goals/HealthGoalDetailsPage")));
const LogGoalProgressPage = withSuspense(lazyWithRetry(() => import("./pages/patient/goals/LogGoalProgressPage")));
const FamilyMembersPage = withSuspense(lazyWithRetry(() => import("./pages/patient/family/FamilyMembersPage")));
const AddEditFamilyMemberPage = withSuspense(lazyWithRetry(() => import("./pages/patient/family/AddEditFamilyMemberPage")));
const VitalsHistoryPage = withSuspense(lazyWithRetry(() => import("./pages/patient/records/VitalsHistoryPage")));
const LabResultsHistoryPage = withSuspense(lazyWithRetry(() => import("./pages/patient/records/LabResultsHistoryPage")));
const FollowUpPage = withSuspense(lazyWithRetry(() => import("./pages/FollowUpPage")));
const IntakeFormPage = withSuspense(lazyWithRetry(() => import("./pages/IntakeFormPage")));
const SemanticSearchPage = withSuspense(lazyWithRetry(() => import("./pages/SemanticSearchPage")));
const BookingSummaryPage = withSuspense(lazyWithRetry(() => import("./pages/BookingSummaryPage")));
const SettingsPage = withSuspense(lazyWithRetry(() => import("./pages/SettingsPage")));
const ChronicDiseaseTracker = withSuspense(lazyWithRetry(() => import("./pages/ChronicDiseaseTracker")));

// Animation Demo Page
const AnimationDemoPage = withSuspense(lazyWithRetry(() => import("./pages/AnimationDemo")));

// Doctor Portal Pages
const DoctorDashboardPage = withSuspense(lazyWithRetry(() => import("./pages/DoctorDashboardPage")));
const AvailabilityPage = withSuspense(lazyWithRetry(() => import("./pages/AvailabilityPage")));
const DoctorAppointmentsPage = withSuspense(lazyWithRetry(() => import("./pages/DoctorAppointmentsPage")));
const DoctorScansPage = withSuspense(lazyWithRetry(() => import("./pages/DoctorScansPage")));
const DoctorScanDetailPage = withSuspense(lazyWithRetry(() => import("./pages/DoctorScanDetailPage")));
const DoctorRatingsPage = withSuspense(lazyWithRetry(() => import("./pages/DoctorRatingsPage")));
const DoctorRevenuePage = withSuspense(lazyWithRetry(() => import("./pages/DoctorRevenuePage")));
const DoctorAlertsPage = withSuspense(lazyWithRetry(() => import("./pages/doctor/AlertsPage")));
const DoctorPrescriptionBuilderPage = withSuspense(lazyWithRetry(() => import("./pages/doctor/DoctorPrescriptionBuilder")));
const PatientTimelineViewPage = withSuspense(lazyWithRetry(() => import("./pages/doctor/PatientTimelineView")));
const DoctorFollowUpTemplatesPage = withSuspense(lazyWithRetry(() => import("./pages/doctor/DoctorFollowUpTemplates")));
const DoctorPROBuilderPage = withSuspense(lazyWithRetry(() => import("./pages/doctor/DoctorPROBuilder")));
const PROAnalyticsPage = withSuspense(lazyWithRetry(() => import("./pages/doctor/PROAnalytics")));
const DoctorExercisesPage = withSuspense(lazyWithRetry(() => import("./pages/doctor/DoctorExercisesPage")));
const DoctorPatientsPage = withSuspense(lazyWithRetry(() => import("./pages/doctor/PatientsPage")));
const DoctorReferralPage = withSuspense(lazyWithRetry(() => import("./pages/doctor/ReferralPage")));

// Doctor Analytics Pages
const DoctorAnalyticsDashboard = withSuspense(lazyWithRetry(() => import("./pages/doctor/analytics/DoctorAnalyticsDashboard")));
const DoctorPatientAnalytics = withSuspense(lazyWithRetry(() => import("./pages/doctor/analytics/DoctorPatientAnalytics")));
const DoctorRevenueAnalytics = withSuspense(lazyWithRetry(() => import("./pages/doctor/analytics/DoctorRevenueAnalytics")));

// Doctor Templates Pages
const NoteTemplatesList = withSuspense(lazyWithRetry(() => import("./pages/doctor/templates/NoteTemplatesList")));
const CreateEditNoteTemplate = withSuspense(lazyWithRetry(() => import("./pages/doctor/templates/CreateEditNoteTemplate")));

// Doctor Patient Management Pages
const PatientDetailsPage = withSuspense(lazyWithRetry(() => import("./pages/doctor/patients/PatientDetailsPage")));
const PatientMedicalHistory = withSuspense(lazyWithRetry(() => import("./pages/doctor/patients/PatientMedicalHistory")));

// Doctor Earnings Pages
const DoctorEarningsSummary = withSuspense(lazyWithRetry(() => import("./pages/doctor/earnings/DoctorEarningsSummary")));
const DoctorTransactionHistory = withSuspense(lazyWithRetry(() => import("./pages/doctor/earnings/DoctorTransactionHistory")));

// Doctor Settings Pages
const DoctorProfileSettings = withSuspense(lazyWithRetry(() => import("./pages/doctor/settings/DoctorProfileSettings")));
const DoctorAvailabilitySettings = withSuspense(lazyWithRetry(() => import("./pages/doctor/settings/DoctorAvailabilitySettings")));
const DoctorNotificationSettings = withSuspense(lazyWithRetry(() => import("./pages/doctor/settings/DoctorNotificationSettings")));

// Admin Portal Pages
const AdminLayout = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminLayout")));
const AdminDashboardPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminDashboardPage")));
const AdminPatientsPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminPatientsPage")));
const AdminPatientDetailPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminPatientDetailPage")));
const AdminDoctorsPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminDoctorsPage")));
const AdminAppointmentsPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminAppointmentsPage")));
const AdminAppointmentDetailPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminAppointmentDetailPage")));
const AdminScansPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminScansPage")));
const AdminSettingsPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminSettingsPage")));
const AdminAnalyticsPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminAnalyticsPage")));
const AdminAuditLogsPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminAuditLogsPage")));
const AdminReportsPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminReportsPage")));
const AdminNewsletterPage = withSuspense(lazyWithRetry(() => import("./pages/admin/NewsletterPage")));
const AdminBlogsPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminBlogsPage")));
const AdminContactMessagesPage = withSuspense(lazyWithRetry(() => import("./pages/admin/ContactMessagesPage")));
const AdminReviewsPage = withSuspense(lazyWithRetry(() => import("./pages/admin/ReviewsPage")));
const AdminTeamPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminTeamPage")));
const EpidemicRadarPage = withSuspense(lazyWithRetry(() => import("./pages/admin/EpidemicRadarPage")));
const SystemHealthPage = withSuspense(lazyWithRetry(() => import("./pages/admin/SystemHealthPage")));
const ConfigurationPage = withSuspense(lazyWithRetry(() => import("./pages/admin/ConfigurationPage")));
const SecurityPage = withSuspense(lazyWithRetry(() => import("./pages/admin/SecurityPage")));
const AdminComplianceDashboardPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminComplianceDashboard")));
const AdminFDAApmPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminFDAApmMonitoring")));
const AdminIEC62304Page = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminIEC62304Traceability")));
const AdminSOC2Page = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminSOC2Evidence")));
const AdminFHIRPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminFHIRResourceManager")));
const MCPManagementPage = withSuspense(lazyWithRetry(() => import("./pages/admin/MCPManagementPage")));
const AdminComplaintPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminComplaintManagement")));
const AdminUsersPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminUsersPage")));
const AdminUserDetailPage = withSuspense(lazyWithRetry(() => import("./pages/admin/AdminUserDetailPage")));
const DoctorVerificationPage = withSuspense(lazyWithRetry(() => import("./pages/admin/DoctorVerificationPage")));
const PaymentManagementPage = withSuspense(lazyWithRetry(() => import("./pages/admin/PaymentManagementPage")));
const PaymentDetailPage = withSuspense(lazyWithRetry(() => import("./pages/admin/PaymentDetailPage")));
const RefundManagementPage = withSuspense(lazyWithRetry(() => import("./pages/admin/RefundManagementPage")));

// Public Static Pages
const AboutPage = withSuspense(lazyWithRetry(() => import("./pages/public/AboutPage")));
const HowItWorksPage = withSuspense(lazyWithRetry(() => import("./pages/public/HowItWorksPage")));
const ContactPage = withSuspense(lazyWithRetry(() => import("./pages/public/ContactPage")));
const PrivacyPolicyPage = withSuspense(lazyWithRetry(() => import("./pages/public/PrivacyPolicyPage")));
const AuthorPage = withSuspense(lazyWithRetry(() => import("./pages/public/AuthorPage")));
const TermsOfServicePage = withSuspense(lazyWithRetry(() => import("./pages/public/TermsOfServicePage")));
const FAQPage = withSuspense(lazyWithRetry(() => import("./pages/public/FAQPage")));
const ServicesPage = withSuspense(lazyWithRetry(() => import("./pages/public/ServicesPage")));
const PricingPage = withSuspense(lazyWithRetry(() => import("./pages/public/PricingPage")));
const HelpCenterPage = withSuspense(lazyWithRetry(() => import("./pages/public/HelpCenterPage")));
const ImpactPage = withSuspense(lazyWithRetry(() => import("./pages/public/ImpactPage")));
const ResearchPage = withSuspense(lazyWithRetry(() => import("./pages/public/ResearchPage")));
const PartnersPage = withSuspense(lazyWithRetry(() => import("./pages/public/PartnersPage")));
const PressPage = withSuspense(lazyWithRetry(() => import("./pages/public/PressPage")));
const CareersPage = withSuspense(lazyWithRetry(() => import("./pages/public/CareersPage")));
const DemoPage = withSuspense(lazyWithRetry(() => import("./pages/public/DemoPage")));
const BlogPage = withSuspense(lazyWithRetry(() => import("./pages/public/BlogPage")));
const GlobalReachPage = withSuspense(lazyWithRetry(() => import("./pages/public/GlobalReachPage")));

export const router = createBrowserRouter([
    {
        path: "/",
        Component: Root,
        children: [
            // Public
            { index: true, Component: HomePage },
            { path: "login", Component: LoginPage },
            { path: "login/patient", Component: PatientLoginPage },
            { path: "login/doctor", Component: DoctorLoginPage },
            { path: "login/admin", Component: AdminLoginPage },
            { path: "auth/callback", Component: AuthCallbackPage },
            { path: "signup", Component: SignUpRolePage },
            { path: "signup/patient", Component: SignUpPage },
            { path: "signup/doctor", Component: DoctorSignUpPage },

            // Aux pages
            { path: "models", Component: ModelsPage },
            { path: "about", Component: AboutPage },
            { path: "how-it-works", Component: HowItWorksPage },
            { path: "contact", Component: ContactPage },
            { path: "privacy", Component: PrivacyPolicyPage },
            { path: "author", Component: AuthorPage },
            { path: "terms", Component: TermsOfServicePage },
            { path: "faq", Component: FAQPage },
            { path: "services", Component: ServicesPage },
            { path: "pricing", Component: PricingPage },
            { path: "help-center", Component: HelpCenterPage },
            { path: "impact", Component: ImpactPage },
            { path: "research", Component: ResearchPage },
            { path: "partners", Component: PartnersPage },
            { path: "press", Component: PressPage },
            { path: "careers", Component: CareersPage },
            { path: "demo", Component: DemoPage },
            { path: "blog", Component: BlogPage },
            { path: "global-reach", Component: GlobalReachPage },

            // Animation Demo (Development/Testing)
            { path: "animation-demo", Component: AnimationDemoPage },

            // Route Aliases (to prevent 404s)
            { path: "register", element: <Navigate to="/signup" replace /> },
            { path: "privacy-policy", element: <Navigate to="/privacy" replace /> },
            { path: "terms-of-service", element: <Navigate to="/terms" replace /> },

            // Patient Portal (Protected)
            {
                path: "patient",
                element: <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']} />,
                children: [
                    { path: "dashboard", Component: DashboardPage },
                    { path: "models", Component: ModelsPage },
                    { path: "scan", Component: AnemiaDetectionPage },
                    { path: "cataract-scan", Component: CataractScanPage },
                    { path: "dr-scan", Component: DiabeticRetinopathyScanPage },
                    { path: "mental-health", Component: MentalHealthPage },
                    { path: "parkinsons-voice", Component: ParkinsonsVoicePage },
                    { path: "exercises", Component: PatientExercisesPage },
                    { path: "exercises/ar/:assignmentId", Component: ARSessionPage },
                    { path: "medication-schedule", Component: MedicationSchedulePage },
                    { path: "pro-questionnaires", Component: PROSubmissionPage },
                    { path: "hospitals", Component: NearbyHospitalsPage },
                    { path: "doctors", Component: DoctorsPage },
                    { path: "doctors/:id", Component: DoctorDetailPage },
                    { path: "booking-summary/:doctorId", Component: BookingSummaryPage },
                    { path: "appointments", Component: AppointmentsPage },
                    { path: "waiting-room/:appointmentId", Component: WaitingRoomPage },
                    { path: "consultation/:appointmentId", Component: VideoCallPage },
                    { path: "history", Component: MedicalHistoryPage },
                    { path: "profile", Component: ProfilePage },
                    { path: "messages", Component: MessagesPage },
                    { path: "timeline", Component: HealthTimelinePage },
                    { path: "achievements", Component: AchievementsPage },
                    { path: "documents", Component: DocumentsPage },
                    { path: "settings/notifications", Component: NotificationSettingsPage },
                    { path: "chatbot", Component: PatientChatbotPage },
                    { path: "lab-analyzer", Component: LabAnalyzerPage },
                    { path: "insurance", Component: InsuranceVerificationPage },
                    { path: "risk-assessment", Component: HealthRiskAssessmentPage },
                    { path: "medications", Component: MedicationsListPage },
                    { path: "medications/reminders", Component: MedicationRemindersPage },
                    { path: "medications/:medicationId", Component: MedicationDetailsPage },
                    { path: "medications/:medicationId/log", Component: MedicationLogPage },
                    { path: "goals", Component: HealthGoalsDashboard },
                    { path: "goals/create", Component: CreateHealthGoalPage },
                    { path: "goals/:goalId", Component: HealthGoalDetailsPage },
                    { path: "goals/:goalId/log", Component: LogGoalProgressPage },
                    { path: "family", Component: FamilyMembersPage },
                    { path: "family/add", Component: AddEditFamilyMemberPage },
                    { path: "family/edit/:memberId", Component: AddEditFamilyMemberPage },
                    { path: "records/vitals", Component: VitalsHistoryPage },
                    { path: "records/lab-results", Component: LabResultsHistoryPage },
                    { path: "follow-up/:appointmentId", Component: FollowUpPage },
                    { path: "intake/:specialty/:appointmentId", Component: IntakeFormPage },
                    { path: "referrals", Component: ReferralPage },
                    { path: "tracker", Component: ChronicDiseaseTracker },
                    { path: "search", Component: SemanticSearchPage },
                    { path: "settings", Component: SettingsPage },
                ]
            },

             // Doctor Portal (Protected)
             {
                 path: "doctor",
                 element: <ProtectedRoute allowedRoles={['doctor', 'admin']} />,
                 children: [
                     { path: "dashboard", Component: DoctorDashboardPage },
                     { path: "patients", Component: DoctorPatientsPage },
                     { path: "availability", Component: AvailabilityPage },
                     { path: "appointments", Component: DoctorAppointmentsPage },
                     { path: "scans", Component: DoctorScansPage },
                     { path: "scans/:id", Component: DoctorScanDetailPage },
                     { path: "ratings", Component: DoctorRatingsPage },
                     { path: "revenue", Component: DoctorRevenuePage },
                     { path: "alerts", Component: DoctorAlertsPage },
                     { path: "consultation/:appointmentId", Component: VideoCallPage },
                     { path: "profile", Component: ProfilePage },
                     { path: "messages", Component: MessagesPage },
                     { path: "achievements", Component: AchievementsPage },
                     { path: "referrals", Component: DoctorReferralPage },
                     { path: "prescriptions", Component: PrescriptionTemplatesPage },
                     { path: "prescriptions/new", Component: DoctorPrescriptionBuilderPage },
                     { path: "patients/:id/timeline", Component: PatientTimelineViewPage },
                     { path: "follow-up-templates", Component: DoctorFollowUpTemplatesPage },
                     { path: "pro-builder", Component: DoctorPROBuilderPage },
                     { path: "patients/:patientId/pro-analytics", Component: PROAnalyticsPage },
                     { path: "exercises", Component: DoctorExercisesPage },
                     { path: "documents", Component: DocumentsPage },
                     { path: "settings/notifications", Component: NotificationSettingsPage },
                     { path: "settings", Component: SettingsPage },
                     // Analytics Routes
                     { path: "analytics", Component: DoctorAnalyticsDashboard },
                     { path: "analytics/patients", Component: DoctorPatientAnalytics },
                     { path: "analytics/revenue", Component: DoctorRevenueAnalytics },
                     // Templates Routes
                     { path: "templates/notes", Component: NoteTemplatesList },
                     { path: "templates/notes/new", Component: CreateEditNoteTemplate },
                     { path: "templates/notes/edit/:templateId", Component: CreateEditNoteTemplate },
                     { path: "templates/notes/:templateId", Component: CreateEditNoteTemplate },
                     // Patient Management Routes
                     { path: "patients/:patientId", Component: PatientDetailsPage },
                     { path: "patients/:patientId/history", Component: PatientMedicalHistory },
                     // Earnings Routes
                     { path: "earnings", Component: DoctorEarningsSummary },
                     { path: "earnings/transactions", Component: DoctorTransactionHistory },
                     // Settings Routes
                     { path: "settings/profile", Component: DoctorProfileSettings },
                     { path: "settings/availability", Component: DoctorAvailabilitySettings },
                     { path: "settings/notifications", Component: DoctorNotificationSettings },
                 ]
             },

             {
                 path: "admin",
                 element: (
                     <ProtectedRoute allowedRoles={['admin']}>
                         <AdminLayout />
                     </ProtectedRoute>
                 ),
                 children: [
                     { index: true, Component: AdminDashboardPage },
                     { path: "dashboard", Component: AdminDashboardPage },
                     { path: "patients", Component: AdminPatientsPage },
                     { path: "patients/:id", Component: AdminPatientDetailPage },
                     { path: "doctors", Component: AdminDoctorsPage },
                     { path: "appointments", Component: AdminAppointmentsPage },
                     { path: "appointments/:id", Component: AdminAppointmentDetailPage },
                     { path: "scans", Component: AdminScansPage },
                     { path: "settings", Component: AdminSettingsPage },
                     { path: "analytics", Component: AdminAnalyticsPage },
                     { path: "audit-logs", Component: AdminAuditLogsPage },
                     { path: "reports", Component: AdminReportsPage },
                     { path: "messages", Component: MessagesPage },
                     { path: "achievements", Component: AchievementsPage },
                     { path: "newsletter", Component: AdminNewsletterPage },
                     { path: "blogs", Component: AdminBlogsPage },
                     { path: "contact-messages", Component: AdminContactMessagesPage },
                     { path: "reviews", Component: AdminReviewsPage },
                     { path: "team", Component: AdminTeamPage },
                     { path: "epidemic-radar", Component: EpidemicRadarPage },
                     { path: "system-health", Component: SystemHealthPage },
                     { path: "configuration", Component: ConfigurationPage },
                     { path: "security", Component: SecurityPage },
                     { path: "compliance", Component: AdminComplianceDashboardPage },
                     { path: "compliance/fda-apm", Component: AdminFDAApmPage },
                     { path: "compliance/iec62304", Component: AdminIEC62304Page },
                     { path: "compliance/soc2", Component: AdminSOC2Page },
                     { path: "compliance/complaints", Component: AdminComplaintPage },
                     { path: "fhir", Component: AdminFHIRPage },
                     { path: "mcp", Component: MCPManagementPage },
                     { path: "users", Component: AdminUsersPage },
                     { path: "users/:id", Component: AdminUserDetailPage },
                     { path: "doctors/verify/:id", Component: DoctorVerificationPage },
                     { path: "payments", Component: PaymentManagementPage },
                     { path: "payments/:id", Component: PaymentDetailPage },
                     { path: "refunds", Component: RefundManagementPage },
                 ]
             },

            // Legacy redirects
            { path: "dashboard", element: <Navigate to="/patient/dashboard" replace /> },
            { path: "doctors", element: <Navigate to="/patient/doctors" replace /> },
            { path: "appointments", element: <Navigate to="/patient/appointments" replace /> },
            { path: "profile", element: <Navigate to="/patient/profile" replace /> },

            // 404
            { path: "*", Component: NotFoundPage },
        ],
    },
]);
