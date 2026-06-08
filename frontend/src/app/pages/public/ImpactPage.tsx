import { motion } from "motion/react";
import { Users, Heart, Globe, TrendingUp, Award } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import PageWrapper from "@/components/ui/PageWrapper";

export default function ImpactPage() {
  const { t } = useTranslation();

  const stats = [
    { icon: Users, value: "50,000+", label: t('impact.stats.users', 'Active Users'), color: 'from-blue-500 to-cyan-600' },
    { icon: Heart, value: "200,000+", label: t('impact.stats.screenings', 'Screenings Completed'), color: 'from-red-500 to-pink-600' },
    { icon: Globe, value: "500+", label: t('impact.stats.locations', 'Rural Locations'), color: 'from-green-500 to-emerald-600' },
    { icon: TrendingUp, value: "85%", label: t('impact.stats.early_detection', 'Early Detection Rate'), color: 'from-purple-500 to-indigo-600' },
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
            Making A Difference
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('impact.title', 'Our Impact')}
          </h1>
          <p className="text-lg text-slate-300">
            {t('impact.subtitle', 'Making healthcare accessible to everyone, everywhere')}
          </p>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all text-center"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
              <p className="text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Mission Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-12 text-center border border-white/10"
          style={{
            background: "linear-gradient(135deg, rgba(13,148,136,0.15) 0%, rgba(14,165,233,0.12) 100%)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Award className="w-14 h-14 text-teal-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('impact.mission.title', 'Our Mission')}
          </h2>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            {t('impact.mission.desc', 'To democratize healthcare access through AI technology, making quality medical screening and consultations available to underserved communities across India.')}
          </p>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
