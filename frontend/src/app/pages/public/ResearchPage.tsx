import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";
import PageWrapper from "@/components/ui/PageWrapper";

export default function ResearchPage() {
  const { t } = useTranslation();

  const publications = [
    { title: t('research.pub1.title', 'AI-Powered Anemia Detection Using Conjunctival Images'), journal: 'Journal of Medical AI', year: '2025', citations: 45 },
    { title: t('research.pub2.title', 'Deep Learning for Diabetic Retinopathy Screening'), journal: 'Healthcare Technology Review', year: '2025', citations: 32 },
    { title: t('research.pub3.title', 'Voice Analysis for Early Parkinson\'s Detection'), journal: 'Neurology & AI', year: '2024', citations: 28 },
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
            Publications
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('research.title', 'Research & Publications')}
          </h1>
          <p className="text-lg text-slate-300">
            {t('research.subtitle', 'Advancing healthcare through AI research')}
          </p>
        </motion.div>

        {/* Publication Cards */}
        <div className="space-y-5">
          {publications.map((pub, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
            >
              <h3 className="text-xl font-bold text-white mb-2">{pub.title}</h3>
              <p className="text-slate-400 mb-3">{pub.journal} • {pub.year}</p>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: "rgba(13,148,136,0.15)", color: "#5eead4" }}
              >
                {pub.citations} citations
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
