import { motion } from "framer-motion";
import { Upload, Brain, CheckCircle, Video, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageWrapper from "@/components/ui/PageWrapper";

export default function HowItWorksPage() {
    const { t } = useTranslation();

    const steps = [
        {
            icon: Upload,
            title: t("public.how_it_works.step1_title", "1. Upload Eye Image"),
            description: t("public.how_it_works.step1_desc", "Take a clear, well-lit photo of your conjunctiva (the inner lining of your lower eyelid) using your smartphone camera and upload it securely to our platform."),
            color: "#0D9488",
        },
        {
            icon: Brain,
            title: t("public.how_it_works.step2_title", "2. AI Analysis & Processing"),
            description: t("public.how_it_works.step2_desc", "Our proprietary deep-learning algorithm performs an instant colorimetry check, comparing the pallor of your conjunctiva against thousands of clinically validated samples."),
            color: "#0EA5E9",
        },
        {
            icon: CheckCircle,
            title: t("public.how_it_works.step3_title", "3. Receive Instant Results"),
            description: t("public.how_it_works.step3_desc", "Within seconds, the platform displays an estimated hemoglobin range, a confidence score, and specific recommendations on your next steps."),
            color: "#F43F5E",
        },
        {
            icon: Video,
            title: t("public.how_it_works.step4_title", "4. Connect with a Specialist"),
            description: t("public.how_it_works.step4_desc", "If your results indicate anemia, or if you just want a professional opinion, book an instant video consultation right from your dashboard. Our AI scribe will safely summarize your results for the physician."),
            color: "#8B5CF6",
        },
    ];

    return (
        <PageWrapper>
            <div className="max-w-5xl mx-auto">
                {/* Badge + Header */}
                <div className="text-center mb-16">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span
                            className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4 bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300"
                        >
                            Simple Steps
                        </span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4"
                    >
                        {t("public.how_it_works.title", "How NetraAI Works")}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
                    >
                        {t("public.how_it_works.description", "From a simple smartphone snap to a comprehensive telemedicine consultation in four easy steps.")}
                    </motion.p>
                </div>

                {/* Step Cards */}
                <div className="space-y-8">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: false }}
                            whileHover={{ y: -4 }}
                            className="rounded-2xl p-8 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center bg-slate-50/50 dark:bg-white/5 backdrop-blur-md"
                        >
                            <div
                                className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center"
                                style={{ backgroundColor: `${step.color}20` }}
                            >
                                <step.icon className="w-10 h-10" style={{ color: step.color }} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{step.title}</h3>
                                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{step.description}</p>
                            </div>
                            {idx !== steps.length - 1 && (
                                <div className="hidden md:flex ml-auto pl-6 text-slate-400 dark:text-slate-500">
                                    <ArrowRight className="w-8 h-8" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </PageWrapper>
    );
}
