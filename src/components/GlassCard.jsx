import React from 'react';

export default function GlassCard({ children, className = '', ...props }) {
  return (
    <div 
      className={`bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-2xl shadow-xl transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
