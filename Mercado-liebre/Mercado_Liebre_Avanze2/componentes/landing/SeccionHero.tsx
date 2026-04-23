
import React from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Smartphone, CheckCircle2 } from 'lucide-react';
import { DemoInteractiva } from './DemoInteractiva';
import { Logo, Boton } from '../ui';

interface Props {
  titular: { principal: string, destacado: string };
  isMobile: boolean;
  scrollToSection: (e: any, id: string) => void;
}

export const SeccionHero: React.FC<Props> = ({ titular, isMobile, scrollToSection }) => {
  const navigate = useNavigate();

  return (
    <header id="inicio" className="pt-32 pb-20 px-4 md:px-6 text-center max-w-6xl mx-auto relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-primary/10 rounded-full blur-[100px] md:blur-[128px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-secondary/10 rounded-full blur-[100px] md:blur-[128px] -z-10"></div>

        <div className="flex justify-center mb-6 animate-bounce">
            <div className="p-4 bg-white dark:bg-surface rounded-3xl shadow-2xl border border-black/5 dark:border-white/5">
                <Logo size={80} />
            </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-xs md:text-sm text-primary font-bold mb-8 border border-primary/20 shadow-sm">
          <Sparkles size={14} className="text-secondary" /> Potenciado por Inteligencia Artificial
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-8xl font-black mb-8 leading-[1.1] md:leading-none text-text-main tracking-tighter animate-fadeIn drop-shadow-sm">
          {titular.principal} <br className="hidden md:block"/>
          <span className="text-primary ml-0 md:ml-3 block md:inline mt-2 md:mt-0">
            {titular.destacado}
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-text-muted mb-12 max-w-3xl mx-auto leading-relaxed font-medium px-2">
          Diseña, gestiona y escala. La solución definitiva para emprendedores que buscan la potencia de <span className="text-secondary dark:text-primary font-bold uppercase tracking-widest text-sm">Mercado Liebre</span> con la elegancia del e-commerce moderno.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mb-16">
          <Boton 
            onClick={() => navigate('/auth?mode=register')}
            className="w-full sm:w-auto px-10 py-5 text-lg shadow-xl"
            variante="primario"
          >
            Crear Tienda <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </Boton>
          
          <Boton 
             onClick={(e) => scrollToSection(e, 'ejemplos')} 
             className="w-full sm:w-auto px-8 py-5 text-lg"
             variante="secundario"
          >
            <Smartphone size={20} /> Ver Sitios Creados
          </Boton>
        </div>

        <div className={`w-full transition-all duration-500 mb-12 flex justify-center ${isMobile ? 'hidden md:flex' : 'flex'}`}>
            <div className="w-full max-w-md md:max-w-none px-4 py-3 rounded-2xl bg-surface border border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm shadow-sm">
               {['Setup en 10 min', 'Sin comisiones', 'Soporte 24/7'].map((txt, i) => (
                 <div key={i} className="flex items-center gap-3 text-text-muted">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i===0?'bg-green-500/20 text-green-500':i===1?'bg-primary/20 text-primary':'bg-secondary/20 text-secondary'}`}>
                       <CheckCircle2 size={16} />
                    </div>
                    <span className="font-medium">{txt}</span>
                 </div>
               ))}
            </div>
        </div>
        <DemoInteractiva />
    </header>
  );
};