import { Link, useLocation } from "react-router";
import { ChevronRight, Home } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuthStore } from "@/lib/store";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { doctorAPI, adminAPI, patientAPI } from "@/lib/api";

export default function Breadcrumb() {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Don't show breadcrumb on home or auth pages
  if (
    location.pathname === "/" ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/signup")
  ) {
    return null;
  }

  // Parse pathname into segments
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Check if any segment is a Doctor ID, Patient ID, or User ID requiring dynamic lookup
  let doctorIdToFetch: string | null = null;
  let patientIdToFetch: string | null = null;
  let userIdToFetch: string | null = null;

  pathSegments.forEach((segment, index) => {
    const prevSegment = index > 0 ? pathSegments[index - 1] : "";
    const isIdLike = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(segment) || (!isNaN(Number(segment)) && segment.length > 5);
    if (isIdLike) {
      if (prevSegment === "doctors" || prevSegment === "booking-summary") {
        doctorIdToFetch = segment;
      } else if (prevSegment === "patients") {
        patientIdToFetch = segment;
      } else if (prevSegment === "users") {
        userIdToFetch = segment;
      }
    }
  });

  // Dynamic Query for doctor name if on a doctor route
  const { data: fetchedDoctor } = useQuery({
    queryKey: ["doctor", doctorIdToFetch],
    queryFn: () => doctorAPI.getDoctor(doctorIdToFetch!).then((res) => res.data),
    enabled: !!doctorIdToFetch,
    staleTime: 5 * 60 * 1000,
  });

  // Dynamic Query for patient name if on a patient route
  const { data: fetchedPatient } = useQuery({
    queryKey: ["patient", patientIdToFetch],
    queryFn: () => doctorAPI.getPatientDetails(patientIdToFetch!).then((res) => res.data),
    enabled: !!patientIdToFetch,
    staleTime: 5 * 60 * 1000,
  });

  // Dynamic Query for user name if on a user route
  const { data: fetchedUser } = useQuery({
    queryKey: ["user", userIdToFetch],
    queryFn: () => adminAPI.getPatient(userIdToFetch!).then((res) => res.data),
    enabled: !!userIdToFetch,
    staleTime: 5 * 60 * 1000,
  });

  // Determine intelligent home link based on current portal path or user role
  let homePath = "/";
  if (location.pathname.startsWith("/patient")) {
    homePath = "/patient/dashboard";
  } else if (location.pathname.startsWith("/doctor")) {
    homePath = "/doctor/dashboard";
  } else if (location.pathname.startsWith("/admin")) {
    homePath = "/admin/dashboard";
  } else if (user) {
    if (user.role === "doctor") {
      homePath = "/doctor/dashboard";
    } else if (user.role === "admin") {
      homePath = "/admin/dashboard";
    } else {
      homePath = "/patient/dashboard";
    }
  }

  // Build breadcrumb items
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const prevSegment = index > 0 ? pathSegments[index - 1] : "";
    const isIdLike = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(segment) || (!isNaN(Number(segment)) && segment.length > 5);

    // Format segment name
    let name = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Special cases for static path keys
    const nameMap: Record<string, string> = {
      "patient": t("breadcrumb.patient", "Patient Portal"),
      "doctor": t("breadcrumb.doctor", "Doctor Portal"),
      "admin": t("breadcrumb.admin", "Admin Portal"),
      "dashboard": t("breadcrumb.dashboard", "Dashboard"),
      "models": t("breadcrumb.models", "AI Models"),
      "scans": t("breadcrumb.scans", "AI Screening"),
      "anemia": t("breadcrumb.anemia", "Anemia Detection"),
      "cataract": t("breadcrumb.cataract", "Cataract Detection"),
      "dr": t("breadcrumb.dr", "Retinopathy Detection"),
      "mental": t("breadcrumb.mental_health", "Mental Health Voice"),
      "parkinsons": t("breadcrumb.parkinsons", "Parkinson's Voice"),
      "doctors": t("breadcrumb.doctors", "Find Doctors"),
      "patients": t("breadcrumb.patients", "Patients"),
      "users": t("breadcrumb.users", "User Management"),
      "hospitals": t("breadcrumb.hospitals", "Hospitals"),
      "appointments": t("breadcrumb.appointments", "Appointments"),
      "documents": t("breadcrumb.documents", "Document Vault"),
      "timeline": t("breadcrumb.timeline", "Health Timeline"),
      "exercises": t("breadcrumb.exercises", "AR Eye Exercises"),
      "achievements": t("breadcrumb.achievements", "Health Achievements"),
      "profile": t("breadcrumb.profile", "Profile"),
      "messages": t("breadcrumb.messages", "Messages"),
      "settings": t("breadcrumb.settings", "Settings"),
      "video-call": t("breadcrumb.video_call", "Video Consultation"),
      "about": t("breadcrumb.about", "About Us"),
      "contact": t("breadcrumb.contact", "Contact Us"),
      "services": t("breadcrumb.services", "Our Services"),
      "how-it-works": t("breadcrumb.how_it_works", "How It Works"),
      "pricing": t("breadcrumb.pricing", "Pricing"),
      "faq": t("breadcrumb.faq", "FAQ"),
      "help": t("breadcrumb.help", "Help Center"),
      "careers": t("breadcrumb.careers", "Careers"),
      "booking-summary": t("breadcrumb.booking_summary", "Booking Summary"),
      "waiting-room": t("breadcrumb.waiting_room", "Waiting Room"),
      "consultation": t("breadcrumb.consultation", "Consultation"),
      "follow-up": t("breadcrumb.follow_up", "Follow Up"),
      "intake": t("breadcrumb.intake", "Intake Form"),
      "records": t("breadcrumb.records", "Records"),
      "vitals": t("breadcrumb.vitals", "Vitals History"),
      "lab-results": t("breadcrumb.lab_results", "Lab Results"),
      "goals": t("breadcrumb.goals", "Health Goals"),
      "family": t("breadcrumb.family", "Family Members"),
      "medications": t("breadcrumb.medications", "Medications"),
    };

    if (nameMap[segment]) {
      name = nameMap[segment];
    } else if (isIdLike) {
      // Dynamic ID resolution: replaces raw UUID string with actual entity name
      if (prevSegment === "doctors" || prevSegment === "booking-summary") {
        const cachedDoctor = queryClient.getQueryData<any>(["doctor", segment]);
        const docObj = fetchedDoctor || cachedDoctor;
        name = docObj?.full_name || docObj?.name || t("breadcrumb.doctor_profile", "Doctor Profile");
      } else if (prevSegment === "patients") {
        const cachedPatient = queryClient.getQueryData<any>(["patient", segment]) || queryClient.getQueryData<any>(["admin-patient", segment]);
        const patObj = fetchedPatient || cachedPatient;
        name = patObj?.full_name || patObj?.name || patObj?.user?.full_name || t("breadcrumb.patient_profile", "Patient Profile");
      } else if (prevSegment === "users") {
        const cachedUser = queryClient.getQueryData<any>(["user", segment]);
        const userObj = fetchedUser || cachedUser;
        name = userObj?.full_name || userObj?.name || userObj?.email || t("breadcrumb.user_profile", "User Details");
      } else if (prevSegment === "appointments" || prevSegment === "follow-up" || prevSegment === "intake") {
        name = t("breadcrumb.appointment_details", "Appointment Details");
      } else if (prevSegment === "medications") {
        name = t("breadcrumb.medication_details", "Medication Details");
      } else if (prevSegment === "goals") {
        name = t("breadcrumb.goal_details", "Goal Details");
      } else {
        name = t("breadcrumb.details", "Details");
      }
    }

    return { name, path, isLast: index === pathSegments.length - 1 };
  });

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isAdmin ? 'pt-20 pb-1' : 'pt-20 pb-1'}`}>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-xs">
        <Link
          to={homePath}
          className="flex items-center gap-1 hover:text-[#0D9488] transition-colors"
          title={homePath === "/" ? "Landing Page" : "Portal Dashboard"}
        >
          <Home className="w-3.5 h-3.5" />
        </Link>

        {breadcrumbItems.map((item) => (
          <div key={item.path} className="flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {item.isLast ? (
              <span className="font-semibold text-[#0F172A] dark:text-white">
                {item.name}
              </span>
            ) : (
              <Link
                to={item.path}
                className="hover:text-[#0D9488] transition-colors"
              >
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
