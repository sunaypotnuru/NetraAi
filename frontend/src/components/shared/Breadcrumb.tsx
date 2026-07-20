import { Link, useLocation } from "react-router";
import { ChevronRight, Home } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuthStore } from "@/lib/store";

export default function Breadcrumb() {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Don't show breadcrumb on home or auth pages
  if (
    location.pathname === "/" ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/signup") ||
    location.pathname.startsWith("/admin")
  ) {
    return null;
  }

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

  // Parse pathname into segments
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    
    // Format segment name
    let name = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Special cases for better naming
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
    };

    name = nameMap[segment] || name;

    return { name, path, isLast: index === pathSegments.length - 1 };
  });

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isAdmin ? 'pt-24 pb-2' : 'pt-20 pb-2'}`}>
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
