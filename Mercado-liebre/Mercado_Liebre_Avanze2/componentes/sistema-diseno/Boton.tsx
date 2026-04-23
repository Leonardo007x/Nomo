import React from 'react';
import { Loader2 } from 'lucide-react';
import { useHaptics } from '../../hooks/useHaptics';

interface BotonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'peligro';
  cargando?: boolean;
  icono?: React.ReactNode;
}

export const Boton: React.FC<BotonProps> = ({ 
  children, 
  variante = 'primario', 
  className = '', 
  cargando,
  icono,
  onClick,
  ...props 
}) => {
  const { haptics } = useHaptics();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger haptic feedback
    if (!props.disabled && !cargando) {
      if (variante === 'peligro') haptics.heavy();
      else haptics.medium();
    }
    
    if (onClick) onClick(e);
  };

  const baseClass = "px-6 py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none tracking-wide transition-all duration-300 font-bold border border-transparent";
  
  const colores = {
    primario: "btn-primary shadow-sm hover:shadow-md",
    secundario: "btn-secondary border-border shadow-sm hover:shadow-md",
    peligro: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white shadow-sm"
  };

  return (
    <button 
      className={`${baseClass} ${colores[variante]} ${className}`} 
      disabled={cargando || props.disabled} 
      onClick={handleClick}
      {...props}
    >
      {cargando && <Loader2 className="animate-spin h-5 w-5" />}
      {!cargando && icono}
      {children}
    </button>
  );
};

export const BotonIA: React.FC<{ onClick: () => void; cargando: boolean; texto?: string }> = ({ onClick, cargando, texto = "IA" }) => {
  const { haptics } = useHaptics();
  
  return (
    <button
      type="button"
      onClick={() => { haptics.light(); onClick(); }}
      disabled={cargando}
      className="absolute top-0 right-0 mt-8 mr-2 text-xs bg-primary text-white px-3 py-1 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1 z-10 shadow-lg hover:shadow-xl transition-all font-bold"
    >
      {cargando ? <Loader2 className="h-3 w-3 animate-spin" /> : "✨"}
      {texto}
    </button>
  );
};