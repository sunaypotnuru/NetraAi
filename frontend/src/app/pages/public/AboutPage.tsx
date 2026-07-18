import { motion } from "framer-motion";
import { Activity, Target, Shield, HeartPulse } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageWrapper from "@/components/ui/PageWrapper";
import AutoSlider from "@/components/ui/AutoSlider";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <PageWrapper>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <span
          className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4 bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300"
        >
          About Us
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
          {t("public.about.title", "About NetraAI")}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
          {t(
            "public.about.description",
            "We are revolutionizing non-invasive preventive healthcare. NetraAI was founded with a single mission: to make early diagnosis accessible, accurate, and completely painless for everyone across the globe."
          )}
        </p>
      </motion.div>

      {/* Mission / Vision AutoSlider */}
      <div className="mb-14">
        <AutoSlider
          items={[
            <div
              className="rounded-2xl p-8 border border-slate-200 dark:border-white/10 bg-teal-50/50 dark:bg-teal-950/20 backdrop-blur-md"
            >
              <Target className="w-10 h-10 text-[#0D9488] mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {t("public.about.mission_title", "Our Mission")}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                {t(
                  "public.about.mission_desc",
                  "To eradicate late-stage anemia detection by providing a ubiquitous, smartphone-based diagnostic tool accessible to clinics and patients worldwide."
                )}
              </p>
            </div>,
            <div
              className="rounded-2xl p-8 border border-slate-200 dark:border-white/10 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-md"
            >
              <Activity className="w-10 h-10 text-[#3B82F6] mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {t("public.about.vision_title", "Our Vision")}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                {t(
                  "public.about.vision_desc",
                  "A world where preventive healthcare isn't a luxury, but a standardized digital right. By bridging AI with telemedicine, we aim to augment doctors and empower patients."
                )}
              </p>
            </div>,
          ]}
          duration={4000}
        />
      </div>

      {/* Technology Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
      >
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
          {t("public.about.technology_title", "The Technology")}
        </h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8 text-lg">
          {t(
            "public.about.technology_desc",
            "Our proprietary deep learning models have been trained on tens of thousands of clinically validated conjunctival images. By observing the palpebral conjunctiva (the inner lining of the lower eyelid), our algorithm detects subtle paleness associated with low hemoglobin levels with an unprecedented 99.9% accuracy rate."
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-5">
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-emerald-50/50 dark:bg-emerald-950/20"
          >
            <Shield className="w-5 h-5 text-[#10B981]" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {t("public.about.hipaa", "HIPAA Compliant")}
            </span>
          </div>
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-rose-50/50 dark:bg-rose-950/20"
          >
            <HeartPulse className="w-5 h-5 text-[#F43F5E]" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {t("public.about.clinically_validated", "Clinically Validated")}
            </span>
          </div>
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-blue-50/50 dark:bg-blue-950/20"
          >
            <Activity className="w-5 h-5 text-[#3B82F6]" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {t(
                "public.about.proactive_nurse",
                "Proactive Voice Nurse Agent Integration"
              )}
            </span>
          </div>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
