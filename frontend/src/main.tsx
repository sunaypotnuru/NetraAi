import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "@/app/App";
import "./styles/index.css";
import { AuthProvider } from "@/app/contexts/AuthContext";
import "./lib/i18n";
import * as Sentry from "@sentry/react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { debugEnvironment } from "./utils/envValidator";

// Validate environment variables on startup
debugEnvironment();

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://dummy@o0.ingest.sentry.io/0",
  tracesSampleRate: 1.0,
});

// Enable axe-core accessibility testing in development
if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, createRoot, 1000);
  }).catch(console.error);
}

// Global error handler for unhandled promise rejections and CDN resource failures
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection (likely CDN/external resource):', event.reason);
  // Don't prevent default to allow other handlers to run
});

// Handle resource loading errors (CDN failures, CORS issues)
window.addEventListener('error', (event) => {
  if (event.target && event.target !== window) {
    const target = event.target as HTMLScriptElement | HTMLLinkElement | HTMLImageElement;
    if (target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'IMG') {
      console.warn('External resource failed to load:', (target as HTMLScriptElement | HTMLImageElement).src || (target as HTMLLinkElement).href);
      // Don't break the app for external resource failures
      event.preventDefault();
    }
  }
}, true);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Sentry.ErrorBoundary fallback={<div className="p-4 text-red-500">A fatal application error occurred. Sentry has been notified.</div>}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </ErrorBoundary>
);

