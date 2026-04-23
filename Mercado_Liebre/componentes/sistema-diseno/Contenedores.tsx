
import React from 'react';

export const Tarjeta: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-surface border border-border shadow-sm rounded-xl p-6 text-text-main ${className}`}>
    {children}
  </div>
);
