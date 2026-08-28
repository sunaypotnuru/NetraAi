import React from 'react';

import { motion } from "motion/react";
import { Search, Book, Video, MessageCircle, FileText, HelpCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import PageWrapper from "@/components/ui/PageWrapper";

export default function HelpCenterPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState("");

  const categories = [
    {
      icon: Book,
      title: t('help.getting_started.title', 'Getting Started'),
      description: t('help.getting_started.desc', 'Learn the basics of Netra AI'),
      articles: 12,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Video,
      title: t('help.video_tutorials.title', 'Video Tutorials'),
      description: t('help.video_tutorials.desc', 'Watch step-by-step guides'),
      articles: 8,
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: FileText,
      title: t('help.user_guides.title', 'User Guides'),
      description: t('help.user_guides.desc', 'Detailed documentation'),
      articles: 24,
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: HelpCircle,
      title: t('help.troubleshooting.title', 'Troubleshooting'),
      description: t('help.troubleshooting.desc', 'Fix common issues'),
      articles: 16,
      color: 'from-red-500 to-orange-600'
    }
  ];

  const popularArticles = [
    t('help.articles.1', 'How to book a doctor appointment'),
    t('help.articles.2', 'Understanding your AI screening results'),
    t('help.articles.3', 'Setting up video consultations'),
    t('help.articles.4', 'Managing your medical records'),
    t('help.articles.5', 'Using the AI health chatbot'),
    t('help.articles.6', 'Medication reminders setup')
  ];

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto">
        {/* Badge + Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span
            className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ background: "rgba(13,148,136,0.18)", color: "#5eead4" }}
          >
            Support
          </span>
          <h1 className="text-5xl font-bold text-white mb-4">
            {t('help.title', 'Help Center')}
          </h1>
          <p className="text-xl text-slate-300">
            {t('help.subtitle', 'Find answers, guides, and support')}
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-500" />
            <input
              type="text"
              placeholder={t('help.search_placeholder', 'Search for help...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-xl text-white placeholder-slate-500 outline-none border border-white/20 focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all text-lg"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
          </div>
        </motion.div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card
                className="p-6 cursor-pointer group border border-white/10 hover:border-white/20 transition-all rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {category.title}
                </h3>
                <p className="text-slate-400 text-sm mb-3">
                  {category.description}
                </p>
                <p className="text-teal-400 text-sm font-medium">
                  {category.articles} {t('help.articles', 'articles')}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Popular Articles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            {t('help.popular_articles', 'Popular Articles')}
          </h2>
          <div
            className="rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
          >
            {popularArticles.map((article, index) => (
              <div
                key={index}
                className="p-4 hover:bg-white/5 cursor-pointer flex items-center justify-between group transition-colors"
              >
                <span className="text-slate-300 group-hover:text-teal-400 transition-colors">
                  {article}
                </span>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="p-12 rounded-2xl bg-gradient-to-br from-[#0D9488] to-[#0EA5E9] text-white text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl font-bold mb-4">
              {t('help.cant_find', 'Can\'t find what you\'re looking for?')}
            </h2>
            <p className="text-xl text-white/80 mb-8">
              {t('help.contact_support', 'Our support team is available 24/7 to help you')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="/contact"
                className="px-8 py-4 bg-white text-teal-700 rounded-xl font-bold text-lg hover:bg-white/90 transition-colors"
              >
                {t('help.contact_us', 'Contact Us')}
              </a>
              <a
                href="/faq"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
              >
                {t('help.view_faq', 'View FAQ')}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
