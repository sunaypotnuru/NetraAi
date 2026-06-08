import React from 'react';

interface GradientBoxProps {
  children: React.ReactNode;
  className?: string;
}

const GradientBox: React.FC<GradientBoxProps> = ({ children, className = '' }) => (
  <div className={`bg-gradient-to-br from-[var(--color-bg-gradient-start)] to-[var(--color-bg-gradient-end)] ${className}`}> 
    {children}
  </div>
);

export default GradientBox;
