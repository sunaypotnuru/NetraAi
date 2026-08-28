import React from 'react';

import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Loader2, ShieldCheck, UserCheck, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

type AuthStatus = "loading" | "error";

/**
 * AuthCallbackPage
 * Handles the redirect from Supabase/Google OAuth.
 *
 * Supports two OAuth flows:
 *  1. PKCE flow  — URL contains `?code=…` → we exchange it via exchangeCodeForSession()
 *  2. Implicit   — URL contains `#access_token=…` → Supabase detects it automatically
 *
 * After a valid session is established, reads the user role from user_metadata
 * and redirects to the correct portal dashboard.
 */
export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const [status, setStatus] = React.useState<AuthStatus>("loading");
    const [errorMsg, setErrorMsg] = React.useState<string>("");

    React.useEffect(() => {
        let cancelled = false;

        const handleCallback = async () => {
            try {
                const url = new URL(window.location.href);
                const code = url.searchParams.get("code");
                const errorParam = url.searchParams.get("error");
                const errorDescription = url.searchParams.get("error_description");

                // If Supabase returned an error in the redirect URL
                if (errorParam) {
                    console.error("[AuthCallback] OAuth error from provider:", errorParam, errorDescription);
                    if (!cancelled) {
                        setErrorMsg(errorDescription || errorParam);
                        setStatus("error");
                    }
                    return;
                }

                // PKCE flow: exchange the one-time code for a session
                if (code) {
                    console.log("[AuthCallback] PKCE flow detected — exchanging code for session...");
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error || !data.session) {
                        console.error("[AuthCallback] Code exchange failed:", error);
                        if (!cancelled) {
                            setErrorMsg(error?.message || "Failed to exchange authorization code.");
                            setStatus("error");
                        }
                        return;
                    }

                    if (!cancelled) redirectByRole(data.session.user);
                    return;
                }

                // Implicit flow: Supabase detects #access_token automatically via detectSessionInUrl.
                // We still call getSession() to confirm the session was stored.
                console.log("[AuthCallback] Implicit flow — waiting for Supabase to detect session from URL hash...");
                // Small delay to let Supabase process the fragment before querying
                await new Promise((r) => setTimeout(r, 300));

                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError || !session) {
                    console.error("[AuthCallback] No session found after callback:", sessionError);
                    if (!cancelled) {
                        setErrorMsg("Authentication could not be completed. Please try again.");
                        setStatus("error");
                    }
                    return;
                }

                if (!cancelled) redirectByRole(session.user);
            } catch (err: unknown) {
                console.error("[AuthCallback] Unexpected error:", err);
                if (!cancelled) {
                    setErrorMsg("An unexpected error occurred. Redirecting to login...");
                    setStatus("error");
                }
            }
        };

        const redirectByRole = (user: { user_metadata?: Record<string, unknown> }) => {
            const role = (user.user_metadata?.role as string) || "patient";
            console.log(`[AuthCallback] Session established. Role: ${role}. Redirecting...`);

            if (role === "admin") {
                navigate("/admin/dashboard", { replace: true });
            } else if (role === "doctor") {
                navigate("/doctor/dashboard", { replace: true });
            } else {
                navigate("/patient/dashboard", { replace: true });
            }
        };

        handleCallback();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    // Auto-redirect to /login after a short delay when in error state
    React.useEffect(() => {
        if (status !== "error") return;
        const timer = setTimeout(() => {
            navigate("/login", { replace: true });
        }, 4000);
        return () => clearTimeout(timer);
    }, [status, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <Card className="p-8 shadow-2xl border-white/50 bg-white/80 backdrop-blur-xl text-center">
                    {status === "loading" ? (
                        <>
                            <motion.div
                                className="w-20 h-20 bg-gradient-to-br from-[#0D9488] to-[#0F766E] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#0D9488]/20"
                                animate={{
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.05, 0.95, 1]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <ShieldCheck className="w-10 h-10 text-white" />
                            </motion.div>

                            <h1 className="text-3xl font-bold text-[#0F172A] mb-3">
                                Authenticating
                            </h1>
                            <p className="text-[#64748B] mb-8 leading-relaxed">
                                Completing your secure login to Netra AI. One moment while we prepare your workspace...
                            </p>

                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Loader2 className="w-10 h-10 text-[#0D9488]" />
                                    </motion.div>
                                </div>

                                <div className="flex items-center gap-2 text-sm font-medium text-[#94A3B8]">
                                    <UserCheck className="w-4 h-4" />
                                    <span>Verifying Identity</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <motion.div
                                className="w-20 h-20 bg-gradient-to-br from-[#EF4444] to-[#DC2626] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-500/20"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                            >
                                <AlertTriangle className="w-10 h-10 text-white" />
                            </motion.div>

                            <h1 className="text-3xl font-bold text-[#0F172A] mb-3">
                                Authentication Failed
                            </h1>
                            <p className="text-[#64748B] mb-4 leading-relaxed">
                                {errorMsg || "Something went wrong during authentication."}
                            </p>
                            <p className="text-sm text-[#94A3B8]">
                                Redirecting you to the login page in a moment...
                            </p>
                        </>
                    )}

                    <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#0D9488]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Secure</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Encrypted</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">HIPAA</span>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
                <div className="absolute top-[-10%] right-[-10%] w-1/3 h-1/3 bg-[#0D9488]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-1/2 h-1/2 bg-[#3B82F6]/5 rounded-full blur-[120px]" />
            </div>
        </div>
    );
}
