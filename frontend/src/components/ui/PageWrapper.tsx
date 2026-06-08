import { motion } from "framer-motion";
import React from "react";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center min-h-screen bg-transparent text-slate-800 dark:text-slate-100 px-4 pt-24 pb-12"
    >
      <div className="glass-card max-w-5xl w-full mx-auto p-8">
        {children}
      </div>
    </motion.section>
  );
}
