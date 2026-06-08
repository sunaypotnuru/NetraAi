import { motion } from "motion/react";
import { Activity } from "lucide-react";

interface HeartbeatLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export function HeartbeatLoader({ text = "Loading Netra AI...", fullScreen = true }: HeartbeatLoaderProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
    : "flex flex-col items-center justify-center w-full h-full min-h-[300px] bg-white rounded-3xl border border-gray-100 shadow-sm";

  return (
    <div className={containerClasses}>
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Outer glowing pulse */}
        <motion.div
          className="absolute inset-0 rounded-full bg-[#0EA5E9]/20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Inner solid pulse */}
        <motion.div
          className="absolute inset-4 rounded-full bg-[#0EA5E9]/10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 0.2, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />

        {/* Heartbeat / ECG Line animation */}
        <div className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-[#0EA5E9]/20 overflow-hidden">
            <svg 
              width="60" 
              height="60" 
              viewBox="0 0 60 60" 
              fill="none" 
              stroke="#0EA5E9" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="absolute drop-shadow-md"
            >
              <motion.path
                d="M 5 30 L 15 30 L 22 15 L 30 45 L 38 15 L 45 30 L 55 30"
                initial={{ pathLength: 0, opacity: 0.5 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </svg>
        </div>
      </div>
      
      {text && (
        <motion.div 
          className="mt-6 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-[#0EA5E9] font-bold text-lg tracking-wider uppercase">{text}</p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[#0EA5E9]/50"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
