import React from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, Users } from 'lucide-react';
import PageWrapper from "@/components/ui/PageWrapper";

export default function GlobalReachPage() {
  const stats = [
    { icon: Users, stat: "50,000+", label: "Patients Reached", color: "from-teal-500 to-cyan-600" },
    { icon: MapPin, stat: "15+", label: "Countries Active", color: "from-blue-500 to-indigo-600" },
    { icon: Globe, stat: "30+", label: "Rural Clinics Equipped", color: "from-emerald-500 to-green-600" },
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
            Worldwide
          </span>
          <Globe className="w-14 h-14 text-teal-400 mx-auto mb-5" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Global Reach
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Breaking down geographical barriers to deliver AI-powered diagnostics to the most remote areas of the world.
          </p>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid md:grid-cols-3 gap-7">
          {stats.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all text-center"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-5`}>
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-4xl font-bold text-white mb-2">{item.stat}</div>
              <div className="text-slate-400">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
