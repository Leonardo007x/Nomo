
import React, { useState } from 'react';
import { Check, X, CreditCard, Zap, Star, Clock, ArrowLeft } from 'lucide-react';
import { Boton } from '../ui';
// @ts-ignore
import { useNavigate } from 'react-router-dom';

interface PlanProps {
  titulo: string;
  precio: string;
  descripcion: string;
  features: string[];
  noFeatures?: string[];
  destacado?: boolean;
  cta: string;
  link: string;
  mostrarMensaje?: boolean;
  onAction: (titulo: string) => void;
  onBack?: () => void;
}

const PlanCard = ({ titulo, precio, descripcion, features, noFeatures, destacado = false, cta, link, mostrarMensaje = false, onAction, onBack }: PlanProps) => {
  // Estilos dinámicos
  const containerClass = destacado 
    ? "relative z-20 transform md:-translate-y-6 border-2 border-primary bg-surface shadow-2xl scale-105" 
    : "bg-surface opacity-90 hover:opacity-100 transition-opacity border border-border z-10 shadow-sm";

  const titleColor = destacado ? "text-primary text-2xl" : "text-text-main";
  const buttonVariante = destacado ? "primario" : "secundario";
  const navigate = useNavigate();

  return (
    <div className={`p-8 rounded-[2rem] flex flex-col h-full transition-all duration-300 overflow-hidden relative ${containerClass}`}>
      
      {/* Overlay "Próximamente" (Inline) */}
      {mostrarMensaje ? (
        <div className="absolute inset-0 bg-bg z-50 flex flex-col items-center justify-center p-6 animate-flipIn text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary animate-pulse">
                <Clock size={32} />
            </div>
            <h3 className="text-2xl font-bold font-serif mb-2 text-text-main">¡Muy Pronto!</h3>
            <p className="text-text-muted mb-6 text-sm">
                El plan <span className="font-bold text-primary">{titulo}</span> estará disponible en breve. Estamos afinando detalles.
            </p>
            <div className="w-full space-y-3">
                <button onClick={onBack} className="w-full py-3 rounded-xl bg-surface border border-white/10 text-text-muted font-bold text-sm hover:text-text-main hover:bg-white/5 flex items-center justify-center gap-2">
                    <ArrowLeft size={16} /> Volver a planes
                </button>
                <button onClick={() => navigate('/auth?mode=register&plan=basico')} className="text-xs text-primary hover:underline font-medium">
                    Ir al Plan Gratuito
                </button>
            </div>
        </div>
      ) : (
        <>
          {destacado && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white px-6 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-primary/30 flex items-center gap-2 tracking-wider w-max">
              <Star size={12} fill="currentColor" /> RECOMENDADO
            </div>
          )}

          <div className="text-center mb-8">
            <h3 className={`text-xl font-bold mb-2 ${titleColor}`}>{titulo}</h3>
            <div className="flex justify-center items-baseline gap-1 mb-2">
                <span className="text-4xl font-black text-text-main font-serif">{precio}</span>
                {precio !== '$0' && <span className="text-xs font-bold text-text-muted">COP</span>}
            </div>
            <p className="text-xs text-text-muted h-10 flex items-center justify-center">{descripcion}</p>
          </div>
          
          <div className={`h-[1px] w-full mb-8 ${destacado ? 'bg-primary/20' : 'bg-black/5 dark:bg-white/5'}`}></div>

          <ul className="space-y-4 mb-8 flex-1">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm group">
                <div className={`mt-0.5 p-1 rounded-full flex-shrink-0 ${destacado ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-500'}`}>
                    <Check size={12} strokeWidth={3} />
                </div>
                <span className="text-text-main/80 font-medium text-left">{f}</span>
              </li>
            ))}
            {noFeatures?.map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm opacity-50">
                <div className="mt-0.5 p-1 bg-gray-500/10 rounded-full text-gray-400"><X size={12} strokeWidth={3} /></div>
                <span className="text-left">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto w-full">
            <Boton 
              variante={buttonVariante}
              onClick={() => onAction(titulo)}
              className={`w-full justify-center py-4 text-sm ${!destacado && 'bg-transparent shadow-none border border-text-muted/20 hover:bg-white/5'}`}
            >
              {cta}
            </Boton>
            
            {precio === '$0' && (
              <p className="text-[10px] text-center text-text-muted mt-4 flex items-center justify-center gap-1 opacity-70 h-4">
                  <CreditCard size={10} /> Sin tarjeta de crédito
              </p>
            )}
            {precio !== '$0' && <div className="h-8 mt-2"></div>}
          </div>
        </>
      )}
    </div>
  );
};

export const SeccionPrecios = () => {
  const [planConMensaje, setPlanConMensaje] = useState<string | null>(null);
  const navigate = useNavigate();

  const handlePlanSelection = (titulo: string) => {
      if (titulo === 'Profesional' || titulo === 'Empresa') {
          setPlanConMensaje(titulo);
      } else {
          navigate('/auth?mode=register&plan=basico');
      }
  };

  const closeMessage = () => {
      setPlanConMensaje(null);
  };

  return (
    <section id="precios" className="py-24 relative bg-bg">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-xs font-bold text-text-muted mb-6 shadow-sm">
            <Zap size={14} className="text-yellow-500" fill="currentColor" />
            <span>Potencia tu negocio</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-text-main tracking-tight">Planes Flexibles</h2>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            Todo lo que necesitas para digitalizar tu tienda, incluido en todos los planes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {/* PLAN BÁSICO */}
          <PlanCard 
            titulo="Básico" 
            precio="$0" 
            descripcion="Ideal para empezar y tener presencia online."
            cta="Empezar Gratis"
            link="/auth?mode=register&plan=basico"
            onAction={handlePlanSelection}
            mostrarMensaje={false}
            features={[
                'Página web de una sección', 
                'Catálogo online (hasta 10 productos)', 
                'Integración con WhatsApp',
                'IA Generativa (Textos)',
                'Dominio mercadoliebre.app/tu-rest'
            ]}
            noFeatures={['Estadísticas avanzadas', 'Soporte Prioritario']}
          />

          {/* PLAN PROFESIONAL */}
          <PlanCard 
            titulo="Profesional" 
            precio="$49.900" 
            descripcion="La solución completa para hacer crecer tu negocio."
            destacado={true}
            cta="Elegir Plan Profesional"
            link="/auth?mode=register&plan=profesional"
            onAction={handlePlanSelection}
            mostrarMensaje={planConMensaje === 'Profesional'}
            onBack={closeMessage}
            features={[
                'Todo lo del plan Básico',
                'Catálogo online ILIMITADO',
                'Integración con WhatsApp',
                'IA Generativa Ilimitada',
                'Galería de fotos personalizable',
                'Sin branding de Mercado Liebre',
                'Estadísticas de visitantes'
            ]}
          />

          {/* PLAN EMPRESA */}
          <PlanCard 
            titulo="Empresa" 
            precio="$99.900" 
            descripcion="Para tiendas que buscan la máxima potencia."
            cta="Elegir Plan Empresa"
            link="/auth?mode=register&plan=empresa"
            onAction={handlePlanSelection}
            mostrarMensaje={planConMensaje === 'Empresa'}
            onBack={closeMessage}
            features={[
                'Todo lo del plan Profesional',
                'Integración con WhatsApp',
                'IA Generativa Avanzada',
                'Sistema de reservas online',
                'Soporte prioritario por chat',
                'Multi-sede / Franquicias'
            ]}
          />
        </div>
      </div>
    </section>
  );
};