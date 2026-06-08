import { motion } from "motion/react";
import { Building, Heart, Users, Globe } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import PageWrapper from "@/components/ui/PageWrapper";

export default function PartnersPage() {
  const { t } = useTranslation();

  const partners = [
    { name: t('partners.hospitals', 'Partner Hospitals'), count: '50+', icon: Building, color: 'from-blue-500 to-cyan-600' },
    { name: t('partners.ngos', 'NGO Partners'), count: '20+', icon: Heart, color: 'from-red-500 to-pink-600' },
    { name: t('partners.doctors', 'Healthcare Professionals'), count: '500+', icon: Users, color: 'from-green-500 to-emerald-600' },
    { name: t('partners.institutions', 'Academic Institutions'), count: '15+', icon: Globe, color: 'from-purple-500 to-indigo-600' },
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
            Collaborations
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('partners.title', 'Our Partners')}
          </h1>
          <p className="text-lg text-slate-300">
            {t('partners.subtitle', 'Collaborating to improve healthcare access')}
          </p>
        </motion.div>

        {/* Partner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all text-center"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${partner.color} flex items-center justify-center mx-auto mb-4`}>
                <partner.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{partner.count}</h3>
              <p className="text-slate-400">{partner.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
