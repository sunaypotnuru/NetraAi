import React from "react";
import { motion } from "framer-motion";

const PageTemplate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen pt-24 bg-gray-50 pb-16 flex justify-center items-start">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl p-10 md:p-16 shadow-sm border border-gray-100 glass-card"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default PageTemplate;
