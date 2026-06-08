import { motion } from "motion/react";
import { Check, Star, Building, Users, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import PageWrapper from "@/components/ui/PageWrapper";
import React from "react";

export default function PricingPage() {
  const { t } = useTranslation();

  const plans = [
    {
      name: t('pricing.free.name', 'Free'),
      icon: Users,
      price: t('pricing.free.price', '₹0'),
      period: t('pricing.free.period', '/month'),
      description: t('pricing.free.desc', 'Perfect for individuals'),
      features: [
        t('pricing.free.f1', 'AI disease screening (unlimited)'),
        t('pricing.free.f2', 'Health monitoring dashboard'),
        t('pricing.free.f3', 'Medical records storage'),
        t('pricing.free.f4', 'AI health chatbot'),
        t('pricing.free.f5', 'Emergency services locator'),
        t('pricing.free.f6', 'Multi-language support')
      ],
      limitations: [
        t('pricing.free.l1', 'Pay per consultation'),
        t('pricing.free.l2', 'Basic support')
      ],
      cta: t('pricing.free.cta', 'Get Started'),
      popular: false,
      color: 'from-slate-500 to-gray-600'
    },
    {
      name: t('pricing.pro.name', 'Professional'),
      icon: Star,
      price: t('pricing.pro.price', '₹999'),
      period: t('pricing.pro.period', '/month'),
      description: t('pricing.pro.desc', 'For healthcare professionals'),
      features: [
        t('pricing.pro.f1', 'All Free features'),
        t('pricing.pro.f2', 'Unlimited consultations'),
        t('pricing.pro.f3', 'Digital prescription builder'),
        t('pricing.pro.f4', 'Patient management system'),
        t('pricing.pro.f5', 'Revenue analytics'),
        t('pricing.pro.f6', 'Appointment scheduling'),
        t('pricing.pro.f7', 'Video consultation tools'),
        t('pricing.pro.f8', 'Priority support')
      ],
      limitations: [],
      cta: t('pricing.pro.cta', 'Start Free Trial'),
      popular: true,
      color: 'from-[#0D9488] to-[#0EA5E9]'
    },
    {
      name: t('pricing.enterprise.name', 'Enterprise'),
      icon: Building,
      price: t('pricing.enterprise.price', 'Custom'),
      period: '',
      description: t('pricing.enterprise.desc', 'For hospitals & clinics'),
      features: [
        t('pricing.enterprise.f1', 'All Professional features'),
        t('pricing.enterprise.f2', 'Multi-location support'),
        t('pricing.enterprise.f3', 'Custom branding'),
        t('pricing.enterprise.f4', 'Advanced analytics'),
        t('pricing.enterprise.f5', 'API access'),
        t('pricing.enterprise.f6', 'Dedicated account manager'),
        t('pricing.enterprise.f7', 'Custom integrations'),
        t('pricing.enterprise.f8', '24/7 premium support'),
        t('pricing.enterprise.f9', 'SLA guarantee')
      ],
      limitations: [],
      cta: t('pricing.enterprise.cta', 'Contact Sales'),
      popular: false,
      color: 'from-purple-500 to-pink-600'
    }
  ];

  const features = [
    {
      category: t('pricing.features.screening.title', 'AI Screening'),
      items: [
        { name: t('pricing.features.screening.anemia', 'Anemia Detection'), free: true, pro: true, enterprise: true },
        { name: t('pricing.features.screening.cataract', 'Cataract Screening'), free: true, pro: true, enterprise: true },
        { name: t('pricing.features.screening.retinopathy', 'Diabetic Retinopathy'), free: true, pro: true, enterprise: true },
        { name: t('pricing.features.screening.parkinsons', 'Parkinson\'s Analysis'), free: true, pro: true, enterprise: true },
        { name: t('pricing.features.screening.mental', 'Mental Health'), free: true, pro: true, enterprise: true }
      ]
    },
    {
      category: t('pricing.features.telemedicine.title', 'Telemedicine'),
      items: [
        { name: t('pricing.features.telemedicine.video', 'Video Consultations'), free: 'Pay per use' as string | boolean, pro: true, enterprise: true },
        { name: t('pricing.features.telemedicine.prescriptions', 'Digital Prescriptions'), free: false, pro: true, enterprise: true },
        { name: t('pricing.features.telemedicine.records', 'Medical Records'), free: true, pro: true, enterprise: true },
        { name: t('pricing.features.telemedicine.followup', 'Follow-up Management'), free: false, pro: true, enterprise: true }
      ]
    },
    {
      category: t('pricing.features.support.title', 'Support'),
      items: [
        { name: t('pricing.features.support.email', 'Email Support'), free: true, pro: true, enterprise: true },
        { name: t('pricing.features.support.priority', 'Priority Support'), free: false, pro: true, enterprise: true },
        { name: t('pricing.features.support.dedicated', 'Dedicated Manager'), free: false, pro: false, enterprise: true },
        { name: t('pricing.features.support.sla', 'SLA Guarantee'), free: false, pro: false, enterprise: true }
      ]
    }
  ];

  return (
    <PageWrapper>
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
          Pricing
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {t('pricing.title', 'Simple, Transparent Pricing')}
        </h1>
        <p className="text-lg text-slate-300 max-w-3xl mx-auto">
          {t('pricing.subtitle', 'Choose the plan that fits your needs. All plans include core AI screening features.')}
        </p>
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -6 }}
            className={plan.popular ? 'md:-mt-4' : ''}
          >
            <div
              className={`h-full p-8 rounded-2xl relative border transition-all ${
                plan.popular
                  ? 'border-[#0D9488] shadow-[0_0_30px_rgba(13,148,136,0.2)]'
                  : 'border-white/10 hover:border-white/20'
              }`}
              style={{
                background: plan.popular
                  ? "rgba(13,148,136,0.08)"
                  : "rgba(255,255,255,0.05)",
                backdropFilter: "blur(12px)",
              }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] text-white px-4 py-1 rounded-full text-sm font-bold">
                    {t('pricing.popular', 'Most Popular')}
                  </span>
                </div>
              )}

              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                <plan.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-slate-400 mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-5xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-400">{plan.period}</span>
              </div>

              <button
                className={`w-full py-3 rounded-xl font-bold text-lg mb-6 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] text-white hover:shadow-lg hover:shadow-teal-500/25'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                {plan.cta}
              </button>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.limitations.length > 0 && (
                <div className="pt-6 border-t border-white/10">
                  {plan.limitations.map((limitation, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-500 text-sm">
                      <span>•</span>
                      <span>{limitation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Feature Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          {t('pricing.comparison.title', 'Feature Comparison')}
        </h2>
        <div
          className="rounded-2xl overflow-hidden border border-white/10"
          style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                  <th className="px-6 py-4 text-left text-white font-bold">
                    {t('pricing.comparison.feature', 'Feature')}
                  </th>
                  <th className="px-6 py-4 text-center text-white font-bold">
                    {t('pricing.free.name', 'Free')}
                  </th>
                  <th className="px-6 py-4 text-center text-white font-bold">
                    {t('pricing.pro.name', 'Professional')}
                  </th>
                  <th className="px-6 py-4 text-center text-white font-bold">
                    {t('pricing.enterprise.name', 'Enterprise')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((category, catIdx) => (
                  <React.Fragment key={`cat-${catIdx}`}>
                    <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                      <td colSpan={4} className="px-6 py-3 font-bold text-[#5eead4]">
                        {category.category}
                      </td>
                    </tr>
                    {category.items.map((item, itemIdx) => (
                      <tr key={`item-${catIdx}-${itemIdx}`} className="border-t border-white/5">
                        <td className="px-6 py-4 text-slate-300">{item.name}</td>
                        <td className="px-6 py-4 text-center">
                          {typeof item.free === 'boolean' ? (
                            item.free ? (
                              <Check className="w-5 h-5 text-[#10B981] mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )
                          ) : (
                            <span className="text-sm text-slate-400">{item.free}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.pro ? (
                            <Check className="w-5 h-5 text-[#10B981] mx-auto" />
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.enterprise ? (
                            <Check className="w-5 h-5 text-[#10B981] mx-auto" />
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div
          className="p-12 rounded-2xl text-center bg-gradient-to-br from-[#0D9488] to-[#0EA5E9]"
        >
          <Zap className="w-16 h-16 mx-auto mb-4 text-white/90" />
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('pricing.questions.title', 'Have Questions?')}
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            {t('pricing.questions.subtitle', 'Our team is here to help you choose the right plan for your needs')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/contact"
              className="px-8 py-4 bg-white text-[#0D9488] rounded-xl font-bold text-lg hover:bg-white/90 transition-colors"
            >
              {t('pricing.questions.contact', 'Contact Sales')}
            </a>
            <a
              href="/faq"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
            >
              {t('pricing.questions.faq', 'View FAQ')}
            </a>
          </div>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
