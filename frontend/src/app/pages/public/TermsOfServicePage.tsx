import { motion } from "motion/react";
import { FileText, Shield, AlertTriangle, CheckCircle, Scale } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import PageWrapper from "@/components/ui/PageWrapper";

export default function TermsOfServicePage() {
  const { t } = useTranslation();

  const sections = [
    {
      icon: FileText,
      title: t('legal.terms.acceptance.title', 'Acceptance of Terms'),
      content: t('legal.terms.acceptance.content', 'By accessing and using Netra AI healthcare platform, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.')
    },
    {
      icon: Shield,
      title: t('legal.terms.services.title', 'Description of Services'),
      content: t('legal.terms.services.content', 'Netra AI provides AI-powered healthcare screening, telemedicine consultations, health monitoring, and related services. Our platform is designed to assist healthcare professionals and patients but does not replace professional medical advice.')
    },
    {
      icon: AlertTriangle,
      title: t('legal.terms.medical_disclaimer.title', 'Medical Disclaimer'),
      content: t('legal.terms.medical_disclaimer.content', 'Netra AI is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified health provider with any questions regarding a medical condition. Never disregard professional medical advice or delay seeking it because of information provided by Netra AI.')
    },
    {
      icon: CheckCircle,
      title: t('legal.terms.user_responsibilities.title', 'User Responsibilities'),
      content: t('legal.terms.user_responsibilities.content', 'Users must provide accurate information, maintain account security, use services lawfully, respect intellectual property rights, and not misuse or attempt to compromise the platform.')
    },
    {
      icon: Scale,
      title: t('legal.terms.liability.title', 'Limitation of Liability'),
      content: t('legal.terms.liability.content', 'Netra AI and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.')
    }
  ];

  return (
    <PageWrapper>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <span
          className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ background: "rgba(13,148,136,0.18)", color: "#5eead4" }}
        >
          Legal
        </span>
        <h1 className="text-4xl font-bold text-white mb-4">
          {t('legal.terms.title', 'Terms of Service')}
        </h1>
        <p className="text-lg text-slate-400">
          {t('legal.terms.subtitle', 'Last Updated: April 12, 2026')}
        </p>
      </motion.div>

      {/* Main Sections */}
      <div className="space-y-6 mb-12">
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <div
              className="rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-lg flex-shrink-0"
                  style={{ background: "rgba(13,148,136,0.18)" }}
                >
                  <section.icon className="w-6 h-6 text-teal-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-3">
                    {section.title}
                  </h2>
                  <p className="text-slate-300 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Terms */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div
          className="rounded-2xl p-8 border border-white/10"
          style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.1), rgba(14,165,233,0.1))" }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            {t('legal.terms.additional.title', 'Additional Terms')}
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('legal.terms.privacy.title', 'Privacy & Data Protection')}
              </h3>
              <p className="text-slate-300">
                {t('legal.terms.privacy.content', 'We are committed to protecting your privacy and comply with HIPAA regulations. Your health information is encrypted and securely stored. See our Privacy Policy for details.')}
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('legal.terms.termination.title', 'Account Termination')}
              </h3>
              <p className="text-slate-300">
                {t('legal.terms.termination.content', 'We reserve the right to suspend or terminate accounts that violate these terms. Users may close their accounts at any time through account settings.')}
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('legal.terms.changes.title', 'Changes to Terms')}
              </h3>
              <p className="text-slate-300">
                {t('legal.terms.changes.content', 'We may update these terms periodically. Continued use of the service after changes constitutes acceptance of the new terms. We will notify users of significant changes.')}
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('legal.terms.governing_law.title', 'Governing Law')}
              </h3>
              <p className="text-slate-300">
                {t('legal.terms.governing_law.content', 'These terms are governed by the laws of India. Any disputes shall be resolved in the courts of Bangalore, Karnataka.')}
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('legal.terms.contact.title', 'Contact Information')}
              </h3>
              <p className="text-slate-300">
                {t('legal.terms.contact.content', 'For questions about these terms, contact us at legal@netra-ai.com or through our contact page.')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Acceptance Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8"
      >
        <div
          className="p-4 rounded-xl border border-teal-500/30"
          style={{ background: "rgba(13,148,136,0.1)" }}
        >
          <p className="text-sm text-teal-300 text-center">
            {t('legal.terms.acceptance_notice', 'By using Netra AI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.')}
          </p>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
