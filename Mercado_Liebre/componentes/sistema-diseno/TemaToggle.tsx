
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTema } from '../../contexto/ContextoTema';

export const ThemeToggle: React.FC = () => {
  const { tema, toggleTema } = useTema();
  const isDark = tema === 'dark';

  return (
    <button
      onClick={toggleTema}
      aria-label="Alternar tema"
      className="relative outline-none group flex items-center"
    >
      <div 
        className="w-14 h-7 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5 shadow-inner transition-colors duration-300"
      ></div>

      <div
        className={`
          absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center
          transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
          shadow-md
          ${isDark ? 'translate-x-7 bg-primary text-black' : 'translate-x-0 bg-white text-yellow-600'}
        `}
      >
          <div className={`transition-transform duration-500 ${isDark ? 'rotate-0 scale-100' : '-rotate-180 scale-100'}`}>
             {isDark ? <Moon size={12} fill="currentColor" /> : <Sun size={12} fill="currentColor" />}
          </div>
      </div>
    </button>
  );
};
