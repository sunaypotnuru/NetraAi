// src/components/ui/AutoSlider.tsx
import React from 'react';
import { motion, AnimatePresence } from "framer-motion";

interface AutoSliderProps {
  /** Elements to display. Each will be shown for `duration` ms */
  items: React.ReactNode[];
  /** Duration each slide is visible in milliseconds */
  duration?: number;
}

const AutoSlider: React.FC<AutoSliderProps> = ({ items, duration = 4000 }) => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, duration);
    return () => clearInterval(timer);
  }, [items.length, duration]);

  return (
    <div className="relative overflow-hidden" style={{ minHeight: "200px" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {items[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AutoSlider;
