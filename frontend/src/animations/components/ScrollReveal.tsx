import React from 'react';
/**
 * ScrollReveal Component
 * 
 * Reveals content when it enters the viewport using high-performance
 * native Framer Motion whileInView features.
 */

import { motion } from 'motion/react';

import { animationTokens } from '../tokens';
import { useAnimationConfig } from '../hooks/useReducedMotion';

interface ScrollRevealProps {
  children: React.ReactNode;
  /**
   * Animation direction
   * @default 'up'
   */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /**
   * Distance to slide (in pixels)
   * @default 30
   */
  distance?: number;
  /**
   * Animation duration key
   * @default 'normal'
   */
  duration?: keyof typeof animationTokens.duration;
  /**
   * Delay before animation starts (in seconds)
   * @default 0
   */
  delay?: number;
  /**
   * Percentage of element that must be visible (0.0 to 1.0)
   * @default 0.05
   */
  threshold?: number;
  /**
   * Margin around viewport (e.g., "-100px" triggers 100px before entering)
   * @default "0px"
   */
  rootMargin?: string;
  /**
   * Only animate once — set to false so back-navigation re-triggers animations
   * @default false
   */
  once?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

export function ScrollReveal({
  children,
  direction = 'up',
  distance = 30,
  duration = 'normal',
  delay = 0,
  threshold = 0.05,
  rootMargin = '0px',
  once = false,
  className,
}: ScrollRevealProps) {
  const { getTransition } = useAnimationConfig();

  // Calculate initial position based on direction
  const getInitialPosition = () => {
    if (direction === 'none') {
      return {};
    }
    
    const positions = {
      up: { y: distance },
      down: { y: -distance },
      left: { x: distance },
      right: { x: -distance },
    };
    
    return positions[direction];
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...getInitialPosition() }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: rootMargin, amount: threshold }}
      transition={{
        ...getTransition(animationTokens.duration[duration]),
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

