import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router';
import PageWrapper from "@/components/ui/PageWrapper";

export default function DemoPage() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span
            className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ background: "rgba(13,148,136,0.18)", color: "#5eead4" }}
          >
            Live Demo
          </span>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Experience Netra AI in Action
          </h1>
          <p className="text-xl text-slate-300">
            Watch our interactive demo to see how we use AI to detect Anemia, Cataracts, and Diabetic Retinopathy in seconds.
          </p>
        </motion.div>

        {/* Video Placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl overflow-hidden aspect-video relative flex items-center justify-center border border-white/10"
          style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-blue-600/10" />
          <div className="text-center z-10 p-6">
            <PlayCircle className="w-20 h-20 text-teal-400 mx-auto mb-4 opacity-80" />
            <h3 className="text-2xl font-semibold text-white">Interactive Demo Coming Soon</h3>
            <p className="mt-2 text-slate-400">We are currently preparing an interactive sandbox environment for you.</p>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
          {[
            "Instant AI Diagnostics",
            "HIPAA Compliant Security",
            "Seamless Doctor Routing"
          ].map((feature, i) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -4 }}
              className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
            >
              <CheckCircle2 className="w-6 h-6 text-teal-400 flex-shrink-0" />
              <span className="font-medium text-white">{feature}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12">
          <Link to="/signup/patient">
            <Button size="lg" className="bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] hover:opacity-90 text-white px-8 rounded-full border-0 shadow-lg shadow-teal-500/20">
              Try For Free
            </Button>
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
