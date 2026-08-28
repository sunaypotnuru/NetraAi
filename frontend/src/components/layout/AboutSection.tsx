import React from 'react';
import { Heart, Users, Award, Zap, Star, Eye, Mic, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useTranslation } from "@/lib/i18n";
import { Link } from "react-router-dom";

export function AboutSection() {
  const [activeTab, setActiveTab] = React.useState<"anemia" | "dr" | "cataract" | "parkinsons">("anemia");
  const [currentTestimonial, setCurrentTestimonial] = React.useState(0);
  const { t } = useTranslation();

  // Auto‑slide through model tabs every 4 seconds
  React.useEffect(() => {
    const tabs: Array<"anemia" | "dr" | "cataract" | "parkinsons"> = ["anemia", "dr", "cataract", "parkinsons"];
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const currentIndex = tabs.indexOf(prev);
        return tabs[(currentIndex + 1) % tabs.length];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const modelDetails = {
    anemia: {
      title: t('home.about.anemia_title', "Anemia Screening"),
      subtitle: t('home.about.anemia_subtitle', "Conjunctival Paleness Analysis"),
      description1: t('home.about.anemia_desc1', "Anemia is a major global health challenge where a lack of healthy red blood cells reduces oxygen flow to vital organs. It currently impacts over"),
      highlight: t('home.about.anemia_highlight', "1.62 billion people"),
      description2: t('home.about.anemia_desc2', "Our AI analysis system leverages computer vision to analyze conjunctiva (inner eyelid) images for pallor. This non-invasive test estimates hemoglobin concentration and categorizes severity instantly."),
      impactText: t('home.about.anemia_impact', "WHO Prevalence: 24.8% of global population"),
      statValue: "90%",
      statLabel: t('home.about.anemia_accuracy', "Model Accuracy"),
      color: "#0D9488",
      features: [
        { icon: Heart, title: t('home.about.anemia_f1_title', "Non-Invasive"), desc: t('home.about.anemia_f1_desc', "No needles or blood draws required.") },
        { icon: Zap, title: t('home.about.anemia_f2_title', "Instant Hemoglobin"), desc: t('home.about.anemia_f2_desc', "Calculates estimated Hb levels in < 5s.") }
      ]
    },
    dr: {
      title: t('home.about.dr_title', "Diabetic Retinopathy"),
      subtitle: t('home.about.dr_subtitle', "Retinal Fundus Image Assessment"),
      description1: t('home.about.dr_desc1', "Diabetic Retinopathy damages retinal blood vessels due to high blood glucose. It is the leading cause of preventable blindness in working-age adults, affecting over"),
      highlight: t('home.about.dr_highlight', "103 million people"),
      description2: t('home.about.dr_desc2', "Using deep learning, NetraAI screens fundus photographs to identify microaneurysms, hemorrhages, and exudates, classifying severity (Mild to Proliferative) to prevent permanent vision loss."),
      impactText: t('home.about.dr_impact', "Leading cause of blindness globally"),
      statValue: "95%",
      statLabel: t('home.about.dr_accuracy', "DR Specificity"),
      color: "#3B82F6",
      features: [
        { icon: Eye, title: t('home.about.dr_f1_title', "Severity Grading"), desc: t('home.about.dr_f1_desc', "Grades from normal to proliferative DR.") },
        { icon: Zap, title: t('home.about.dr_f2_title', "Early Detection"), desc: t('home.about.dr_f2_desc', "Catches micro-vessel defects before vision dims.") }
      ]
    },
    cataract: {
      title: t('home.about.cataract_title', "Cataract Detection"),
      subtitle: t('home.about.cataract_subtitle', "Lens Opacity Evaluation"),
      description1: t('home.about.cataract_desc1', "Cataracts cause a progressive clouding of the eye's natural lens. They remain the primary cause of blindness in low-and-middle-income countries, accounting for"),
      highlight: t('home.about.cataract_highlight', "51% of world blindness"),
      description2: t('home.about.cataract_desc2', "Our vision AI maps anterior-segment eye photographs to identify lens opacification. This allows health workers to screen and refer patients for timely corrective lens replacement surgery."),
      impactText: t('home.about.cataract_impact', "Affects 20M+ patients globally"),
      statValue: "95%",
      statLabel: t('home.about.cataract_accuracy', "Cataract Sensitivity"),
      color: "#8B5CF6",
      features: [
        { icon: Eye, title: t('home.about.cataract_f1_title', "Smartphone Screening"), desc: t('home.about.cataract_f1_desc', "Requires only standard frontal eye photographs.") },
        { icon: Zap, title: t('home.about.cataract_f2_title', "Opacity Scoring"), desc: t('home.about.cataract_f2_desc', "Determines maturity and lens degradation index.") }
      ]
    },
    parkinsons: {
      title: t('home.about.parkinsons_title', "Parkinson's Voice"),
      subtitle: t('home.about.parkinsons_subtitle', "Acoustic Tremor & Vocal Biomarkers"),
      description1: t('home.about.parkinsons_desc1', "Parkinson's Disease is a progressive motor system disorder. Subtle vocal changes, such as hypophonia and dysphonia, are early signs affecting"),
      highlight: t('home.about.parkinsons_highlight', "10 million patients"),
      description2: t('home.about.parkinsons_desc2', "Our audio analysis engine monitors short voice recordings (e.g. sustained vowel phonation) to capture micro-tremors, frequency fluctuation, and jitter, serving as a reliable remote screening mechanism."),
      impactText: t('home.about.parkinsons_impact', "Early screening enables neuroprotection"),
      statValue: "92%",
      statLabel: t('home.about.parkinsons_accuracy', "Acoustic F1-Score"),
      color: "#EC4899",
      features: [
        { icon: Mic, title: t('home.about.parkinsons_f1_title', "Vocal Biomarkers"), desc: t('home.about.parkinsons_f1_desc', "Analyzes pitch jitter, shimmer, and vocal tremors.") },
        { icon: Zap, title: t('home.about.parkinsons_f2_title', "Remote Monitoring"), desc: t('home.about.parkinsons_f2_desc', "Allows frequent tracking from the comfort of home.") }
      ]
    }
  };

  const testimonials = [
    { name: "Sarah J.", role: t('home.about.role_patient', "Patient"), quote: t('home.about.testimonial_1', "The AI analysis is incredibly fast and accurate. It saved me a trip to the lab and the anxiety of waiting for results.") },
    { name: "Dr. Michael Chen", role: t('home.about.role_hematologist', "Hematologist"), quote: t('home.about.testimonial_2', "I use this platform daily. The AI acts as a fantastic second pair of eyes, and the consultation scribe saves me hours of charting.") },
    { name: "Priya M.", role: t('home.about.role_patient', "Patient"), quote: t('home.about.testimonial_3', "I was amazed at how simple it was to book a consultation and get my scan results. The interface is beautiful and so easy to use.") }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section id="about" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* Section Header with Tabs */}
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-[#0D9488] uppercase tracking-widest">{t('home.about.clinical_details', "Clinical Insights")}</span>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#0F172A] mt-2 mb-8">
            {t('home.about.how_models_work', "How Our AI Models Work")}
          </h2>

          <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-4xl mx-auto p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
            {(Object.keys(modelDetails) as Array<keyof typeof modelDetails>).map((key) => {
              const isActive = activeTab === key;
              const detail = modelDetails[key];
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    isActive
                      ? "bg-white shadow-md text-[#0F172A]"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: detail.color }}
                  />
                  {detail.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[480px]">
          {/* Left - Detailed Model Explanation */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full inline-block mb-4"
                  style={{ backgroundColor: `${modelDetails[activeTab].color}12`, color: modelDetails[activeTab].color }}
                >
                  {modelDetails[activeTab].subtitle}
                </span>

                <h3 className="text-4xl font-extrabold text-[#0F172A] mb-4">
                  {modelDetails[activeTab].title}
                </h3>

                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  {modelDetails[activeTab].description1}{" "}
                  <strong style={{ color: modelDetails[activeTab].color }}>{modelDetails[activeTab].highlight}</strong>{" "}
                  {t('home.about.globally', "globally.")}
                </p>

                <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                  {modelDetails[activeTab].description2}
                </p>

                <div className="grid sm:grid-cols-2 gap-6">
                  {modelDetails[activeTab].features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 group">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: `${modelDetails[activeTab].color}12` }}
                      >
                        <feature.icon className="w-6 h-6" style={{ color: modelDetails[activeTab].color }} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0F172A] mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right - High-Fidelity Visual Block */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div
                  className="relative rounded-3xl p-12 shadow-2xl overflow-hidden text-white transition-all duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${modelDetails[activeTab].color}, ${modelDetails[activeTab].color}dd)`
                  }}
                >
                  {/* Decorative Elements */}
                  <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-2xl rotate-12" />
                  <div className="absolute bottom-12 left-8 w-20 h-20 bg-white/10 rounded-3xl -rotate-12" />

                  <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-inner">
                    <div className="text-center">
                      <div className="text-6xl font-extrabold mb-2 tracking-tight">
                        {modelDetails[activeTab].statValue}
                      </div>
                      <div className="text-lg mb-6 text-white/95 font-semibold">
                        {modelDetails[activeTab].statLabel}
                      </div>
                      <div className="h-px bg-white/20 my-6" />
                      <div className="grid grid-cols-2 gap-6 text-center">
                        <div className="hover:scale-110 transition-transform">
                          <div className="text-3xl font-bold">&lt;5s</div>
                          <div className="text-xs text-white/80 mt-1">{t('home.about.stats_speed', "Speed")}</div>
                        </div>
                        <div className="hover:scale-110 transition-transform">
                          <div className="text-3xl font-bold">24/7</div>
                          <div className="text-xs text-white/80 mt-1">{t('home.about.stats_available', "Available")}</div>
                        </div>
                      </div>
                      <div className="mt-8 text-xs text-white/90 font-medium bg-black/10 py-2.5 px-4 rounded-xl border border-white/10">
                        {modelDetails[activeTab].impactText}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Background Shadow Block */}
                <div
                  className="absolute -bottom-6 -right-6 w-full h-full rounded-3xl -z-10 opacity-20 blur-lg transition-colors duration-500"
                  style={{ backgroundColor: modelDetails[activeTab].color }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* CTA to Public Models list page */}
        <div className="mt-16 flex justify-center">
          <Link
            to="/models"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 group"
          >
            <span>{t('home.about.explore_all_models_btn', "Explore All Diagnostics & Features")}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Testimonials */}
        <div className="mt-32 border-t border-gray-100 pt-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-[#0F172A]">{t('home.about.trusted_title', "Trusted by Patients & Doctors")}</h3>
          </div>
          <div className="max-w-4xl mx-auto bg-gray-50 rounded-3xl p-8 relative shadow-sm border border-gray-100">
            <div className="text-[#0D9488] flex justify-center mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
            </div>
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <p className="text-xl italic text-gray-700 mb-6">"{testimonials[currentTestimonial].quote}"</p>
              <div>
                <div className="font-bold text-[#0F172A]">{testimonials[currentTestimonial].name}</div>
                <div className="text-sm text-gray-500">{testimonials[currentTestimonial].role}</div>
              </div>
            </motion.div>

            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentTestimonial ? 'bg-[#0D9488] w-6' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>

          {/* Partners Marquee */}
          <div className="mt-20 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
            <motion.div
              animate={{ x: [0, -1000] }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className="flex items-center gap-16 whitespace-nowrap opacity-50 grayscale"
            >
              {["Apollo Hospitals", "Fortis Healthcare", "Max Healthcare", "AIIMS", "LiveKit", "OpenAI", "Supabase", "Apollo Hospitals", "Fortis Healthcare", "Max Healthcare"].map((partner, i) => (
                <div key={i} className="text-2xl font-bold text-gray-400">{partner}</div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
