import { motion } from "motion/react";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import PageWrapper from "@/components/ui/PageWrapper";

export default function CareersPage() {
  const { t } = useTranslation();

  const openings = [
    { title: t('careers.job1', 'Senior AI Engineer'), location: 'Bangalore', type: 'Full-time', department: 'Engineering' },
    { title: t('careers.job2', 'Product Manager'), location: 'Remote', type: 'Full-time', department: 'Product' },
    { title: t('careers.job3', 'Healthcare Data Scientist'), location: 'Bangalore', type: 'Full-time', department: 'Data Science' },
    { title: t('careers.job4', 'UX Designer'), location: 'Hybrid', type: 'Full-time', department: 'Design' },
  ];

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <span
            className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ background: "rgba(13,148,136,0.18)", color: "#5eead4" }}
          >
            Join Us
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('careers.title', 'Join Our Team')}
          </h1>
          <p className="text-lg text-slate-300">
            {t('careers.subtitle', 'Help us revolutionize healthcare with AI')}
          </p>
        </motion.div>

        {/* Job Cards */}
        <div className="space-y-5">
          {openings.map((job, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-slate-500" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-500" /> {job.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4 text-slate-500" /> {job.department}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-2 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 rounded-2xl p-12 text-center border border-white/10"
          style={{
            background: "linear-gradient(135deg, rgba(13,148,136,0.2) 0%, rgba(14,165,233,0.15) 100%)",
            backdropFilter: "blur(12px)",
          }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('careers.cta.title', "Don't see a perfect fit?")}
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            {t('careers.cta.subtitle', "Send us your resume and we'll keep you in mind for future opportunities")}
          </p>
          <a
            href="mailto:careers@netra-ai.com"
            className="inline-block px-8 py-4 bg-gradient-to-br from-[#0D9488] to-[#0EA5E9] text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
          >
            {t('careers.cta.button', 'Send Resume')}
          </a>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
