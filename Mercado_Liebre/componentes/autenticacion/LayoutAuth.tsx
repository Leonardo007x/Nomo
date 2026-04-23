
import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle, Logo } from '../ui';

interface LayoutAuthProps {
  children: React.ReactNode;
  titulo: string;
  subtitulo: string;
}

export const LayoutAuth: React.FC<LayoutAuthProps> = ({ children, titulo, subtitulo }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-24 md:p-8 bg-bg transition-colors duration-300 relative">
      
      {/* Botón Regresar Absoluto */}
      <div className="absolute top-6 left-6 z-50">
        <Link to="/">
          <button className="bg-surface border border-border p-3 rounded-full text-text-muted hover:text-primary transition-all shadow-sm hover:shadow-md flex items-center gap-2">
             <ArrowLeft size={20} />
             <span className="hidden md:inline font-medium">Regresar al Inicio</span>
          </button>
        </Link>
      </div>

      {/* Toggle Tema Absoluto */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Contenedor Principal tipo Split en Desktop */}
      <div className="bg-surface w-full max-w-5xl relative overflow-hidden flex flex-col md:flex-row shadow-2xl border border-border animate-fadeIn rounded-3xl">
        
        {/* Panel Izquierdo: Branding e Info */}
        <div className="md:w-5/12 p-8 md:p-12 flex flex-col justify-center relative bg-surface/50 md:border-r border-white/5">
           {/* Decoración de fondo */}
           <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>
           </div>

           <div className="relative z-10 text-center md:text-left">
              <div className="bg-bg w-20 h-20 rounded-2xl flex items-center justify-center mb-8 text-primary border border-primary/10 shadow-sm mx-auto md:mx-0">
                <Logo size={40} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-main font-serif mb-4 leading-tight">
                {titulo}
              </h1>
              <p className="text-text-muted text-lg leading-relaxed">
                {subtitulo}
              </p>
           </div>
        </div>

        {/* Panel Derecho: Formulario */}
        <div className="md:w-7/12 p-8 md:p-12 bg-bg flex flex-col justify-center relative">
           {children}
        </div>
      </div>
    </div>
  );
};