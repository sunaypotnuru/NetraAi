import React from 'react';
import { RouterProvider } from "react-router";

import { router } from "./routes";
import InstallPrompt from "../components/shared/InstallPrompt";
import ErrorBoundary from "../components/shared/ErrorBoundary";
import { Toaster } from "../components/ui/sonner";
import { useAccessibilityStore } from "../lib/accessibility";
import { gamificationAPI } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { useSettingsStore } from "../lib/settingsStore";
import { useThemeStore } from "../lib/themeStore";
import { FuturisticBackground } from "../components/shared/FuturisticBackground";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { AnimationProvider } from "../animations";

export default function App() {
  const { highContrast, largeText, reducedMotion, fontSize } = useAccessibilityStore();
  const { user } = useAuthStore();
  const { fetchSettings } = useSettingsStore();
  const { theme, isSeniorMode } = useThemeStore();

  React.useEffect(() => {
    // Only fetch platform settings if logged in as an admin to avoid 403 errors
    if (import.meta.env.VITE_BYPASS_AUTH !== "true") {
      if (user?.role === 'admin') {
        fetchSettings();
      }
    }
  }, [fetchSettings, user?.role]);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("high-contrast", highContrast);
    root.classList.toggle("large-text", largeText || fontSize === 'large' || fontSize === 'xlarge');
    root.classList.toggle("reduced-motion", reducedMotion);
    root.classList.toggle("senior-mode", isSeniorMode);

    // Dynamic Font Size Scaling
    const fontSizeMap: Record<string, string> = {
      small: '90%',
      medium: '100%',
      large: '115%',
      xlarge: '130%',
    };
    root.style.fontSize = fontSizeMap[fontSize] || '100%';

    if (user && import.meta.env.VITE_BYPASS_AUTH !== "true") {
      gamificationAPI.trackLogin().catch(console.error);
    }
  }, [highContrast, largeText, reducedMotion, isSeniorMode, fontSize, user]);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ErrorBoundary>
      <AnimationProvider>
        <WebSocketProvider>
          <FuturisticBackground />
          <RouterProvider router={router} />
          <InstallPrompt />
          <Toaster position="top-right" richColors />
        </WebSocketProvider>
      </AnimationProvider>
    </ErrorBoundary>
  );
}
