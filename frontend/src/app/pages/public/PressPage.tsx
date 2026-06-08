import { motion } from "motion/react";
import { Newspaper } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import PageWrapper from "@/components/ui/PageWrapper";

export default function PressPage() {
  const { t } = useTranslation();

  const pressReleases = [
    { title: t('press.release1', 'Netra AI Launches Mental Health Chatbot'), date: 'April 2026', outlet: 'TechCrunch India' },
    { title: t('press.release2', 'AI Healthcare Platform Reaches 50,000 Users'), date: 'March 2026', outlet: 'Healthcare IT News' },
    { title: t('press.release3', 'Netra AI Wins Best Healthcare Innovation Award'), date: 'February 2026', outlet: 'Indian Express' },
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
            In The News
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('press.title', 'Press & Media')}
          </h1>
          <p className="text-lg text-slate-300">
            {t('press.subtitle', 'Latest news and press releases')}
          </p>
        </motion.div>

        {/* Press Cards */}
        <div className="space-y-5">
          {pressReleases.map((release, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-xl flex-shrink-0"
                  style={{ background: "rgba(59,130,246,0.15)" }}
                >
                  <Newspaper className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{release.title}</h3>
                  <p className="text-slate-400">{release.outlet} • {release.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
