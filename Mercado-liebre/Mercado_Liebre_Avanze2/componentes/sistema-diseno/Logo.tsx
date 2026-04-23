import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
}

/**
 * MERCADO LIEBRE LOGO
 * Diseño geométrico.
 * Representa una liebre/conejo (Rabbit).
 */
export const Logo: React.FC<LogoProps> = ({ size = 24, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={`${className} drop-shadow-md`}
      aria-label="Mercado Liebre Logo"
    >
      <path d="M13 16a3 3 0 0 1 2.24 5" stroke="var(--primary-color)" />
      <path d="M18 12h.01" stroke="var(--primary-color)" />
      <path d="M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a2 2 0 0 0-2 2z" stroke="var(--primary-color)" fill="var(--secondary-color)" fillOpacity="0.4" />
      <path d="M20 8.54V4a2 2 0 1 0-4 0v3" stroke="var(--primary-color)" />
      <path d="M7.612 12.524a3 3 0 1 0-1.6 4.3" stroke="var(--primary-color)" />
    </svg>
  );
};