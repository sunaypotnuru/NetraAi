import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";
import PageWrapper from "@/components/ui/PageWrapper";

export default function PrivacyPolicyPage() {
    const { t } = useTranslation();
    return (
        <PageWrapper>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Badge */}
                <div className="text-center mb-2">
                    <span
                        className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4 bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300"
                    >
                        Legal
                    </span>
                </div>

                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8 border-b border-slate-200 dark:border-white/10 pb-6">
                    {t("public.privacy.title", "Privacy Policy & Patient Rights")}
                </h1>

                <div className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                    <p className="text-slate-500 dark:text-slate-400 italic">
                        {t("public.privacy.last_updated", "Last updated: March 2026")}
                    </p>
                    <p>
                        {t("public.privacy.intro", "At NetraAI, we are committed to protecting the privacy and security of your health information. This Privacy Policy describes how we collect, use, disclose, and safeguard your medical data when you use the NetraAI platform.")}
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">
                        {t("public.privacy.h1", "1. HIPAA Compliance")}
                    </h2>
                    <p>
                        {t("public.privacy.p1", "Our platform handles Electronic Protected Health Information (ePHI) in strict adherence to the Health Insurance Portability and Accountability Act (HIPAA) of 1996. All conjunctiva images, AI predictions, and doctor consultation notes are fully encrypted at rest (AES-256) and in transit (TLS 1.3).")}
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">
                        {t("public.privacy.h2", "2. Data Collection")}
                    </h2>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>
                            <strong className="text-slate-900 dark:text-white">{t("public.privacy.d1_title", "Medical Data:")}</strong>{" "}
                            {t("public.privacy.d1_desc", "Eye images uploaded for anemia screening, and resulting AI diagnostic predictions.")}
                        </li>
                        <li>
                            <strong className="text-slate-900 dark:text-white">{t("public.privacy.d2_title", "Personal Info:")}</strong>{" "}
                            {t("public.privacy.d2_desc", "Demographics collected during registration.")}
                        </li>
                        <li>
                            <strong className="text-slate-900 dark:text-white">{t("public.privacy.d3_title", "Communication Data:")}</strong>{" "}
                            {t("public.privacy.d3_desc", "Chat logs, video consultation meta-data, and AI Scribe audio-transcriptions (which are temporarily processed and not retained past clinical note generation).")}
                        </li>
                    </ul>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">
                        {t("public.privacy.h3", "3. How We Use Information")}
                    </h2>
                    <p>
                        {t("public.privacy.p3", "We use the information we collect to provide, maintain, and improve our services, including:")}
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>{t("public.privacy.u1", "Facilitating AI predictions for hemoglobin deficiency.")}</li>
                        <li>{t("public.privacy.u2", "Storing patient histories for assigned physicians.")}</li>
                        <li>{t("public.privacy.u3", "Anonymized aggregate training to improve future ML models (only if explicit patient consent is provided in dashboard settings).")}</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">
                        {t("public.privacy.h4", "4. Your Patient Rights")}
                    </h2>
                    <p>
                        {t("public.privacy.p4", "You reserve the right to demand complete deletion of your records from our servers, subject to local medical retention laws. To instigate a data erasure request, contact us at ")}
                        <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-teal-600 dark:text-teal-400 text-sm">privacy@netraai.com</code>.
                    </p>
                </div>
            </motion.div>
        </PageWrapper>
    );
}
