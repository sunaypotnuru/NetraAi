import React from 'react';

import { motion, useSpring, useTransform } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 2, 
  formatter = (val) => Math.floor(val).toString(),
  className = "" 
}: AnimatedCounterProps) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (latest) => formatter(latest));
  const [displayText, setDisplayText] = React.useState("0");

  React.useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  React.useEffect(() => {
    return display.on("change", (latest) => setDisplayText(latest));
  }, [display]);

  return (
    <motion.span className={className}>
      {displayText}
    </motion.span>
  );
}
