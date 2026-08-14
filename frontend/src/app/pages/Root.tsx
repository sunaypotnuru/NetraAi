import { Outlet, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp } from "lucide-react";
import NavbarMain from "@/components/layout/NavbarMain";
import Footer from "@/components/layout/Footer";
import SOSButton from "@/components/shared/SOSButton";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { VoiceAccessibility } from "@/components/features/accessibility/VoiceAccessibility";
import ChatbotWidget from "@/components/features/ai/ChatbotWidget";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { useAuthStore } from "../../lib/store";

import { useThemeStore } from "../../lib/themeStore";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ScrollToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}

export default function Root() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const updateTheme = () => {
      if (theme === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setResolvedTheme(isDark ? "dark" : "light");
      } else {
        setResolvedTheme(theme === "dark" ? "dark" : "light");
      }
    };

    updateTheme();

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => updateTheme();
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme]);

  const isAuthPage = location.pathname.startsWith("/login") || location.pathname.startsWith("/signup");
  const isPortalPage = location.pathname.startsWith("/patient") || location.pathname.startsWith("/doctor");
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div
      className="min-h-screen flex flex-col relative"
    >
      {/* Dynamic global background */}
      <div
        className="fixed inset-0 pointer-events-none z-[-1] transition-all duration-700 ease-in-out"
        style={{
          background: resolvedTheme === 'dark'
            ? 'linear-gradient(135deg, #07090e 0%, #0a0d16 35%, #0d1220 70%, #150f22 100%)'
            : 'linear-gradient(135deg, #f0fdfa 0%, #f8fafc 30%, #f0f9ff 60%, #faf5ff 100%)',
        }}
      />

      <ScrollToTop />
      {!isAdminPage && <NavbarMain />}

      <main className="flex-1 overflow-x-hidden">
        {/* Global Location Breadcrumbs */}
        <Breadcrumb />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="h-full w-full"
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      {!isAuthPage && !isPortalPage && <Footer />}

      <ScrollToTopButton />
      {/* Floating SOS button — visible on all patient pages */}
      <SOSButton />

      {/* Global Widgets within Router context */}
      {user?.role !== "admin" && <VoiceAccessibility />}
      {(user?.role === "patient" || !user) && !isAdminPage && <ChatbotWidget />}

      {/* only a single toaster should exist in the app; the instance in App.tsx handles notifications */}
    </div>
  );
}
