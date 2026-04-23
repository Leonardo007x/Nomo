
import React from 'react';
import { Store, Palette, UtensilsCrossed, Eye, ExternalLink, LogOut, Share2, Server } from 'lucide-react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { ThemeToggle, Logo } from '../ui';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { Tienda } from '../../tipos';

interface BarraLateralProps {
  tabActiva: 'info' | 'tema' | 'menu' | 'difusion' | 'docker';
  setTabActiva: (tab: 'info' | 'tema' | 'menu' | 'difusion' | 'docker') => void;
  tienda: Tienda | null;
  setVistaPreviaAbierta: (abierta: boolean) => void;
  movilAbierto?: boolean;
}

export const BarraLateral: React.FC<BarraLateralProps> = ({ 
  tabActiva, 
  setTabActiva, 
  tienda, 
  setVistaPreviaAbierta,
  movilAbierto = false
}) => {
  const { user, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
      // Navegar primero para evitar redirección por protección de rutas
      navigate('/');
      // Pequeño delay para permitir que la navegación ocurra antes de limpiar el estado
      setTimeout(async () => {
          await cerrarSesion();
      }, 100);
  };

  // Clases dinámicas: min-h-0 + overflow-hidden en la columna para que el <nav> con flex-1 pueda hacer scroll (trampa típica de flexbox).
  const baseClasses =
    "bg-surface border-r border-border flex shrink-0 flex-col fixed md:relative inset-y-0 left-0 z-40 h-full max-h-[100dvh] min-h-0 overflow-hidden transition-transform duration-300 ease-in-out";
  const mobileClasses = movilAbierto ? "translate-x-0 shadow-2xl w-[85vw]" : "-translate-x-full w-[85vw]";
  const desktopClasses = "md:translate-x-0 md:w-72 md:inset-y-auto md:m-0 md:my-0 md:block";

  return (
    <aside className={`${baseClasses} ${mobileClasses} ${desktopClasses}`}>
      <div className="px-4 py-4 flex items-center justify-between gap-2 border-b border-white/10 dark:border-white/5 shrink-0 bg-[#FFE600] dark:bg-surface">
        <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-primary flex items-center justify-center text-[#2D3277] dark:text-white shadow-md shrink-0">
              <Logo size={32} />
            </div>
            <span className="font-sans text-lg sm:text-xl font-black text-[#2D3277] dark:text-meli-yellow tracking-tighter truncate">Mercado <span className="font-light">Liebre</span></span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 dark:bg-white/10 text-[#2D3277] dark:text-white text-xs font-black uppercase tracking-wide shadow-sm border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/20 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={18} strokeWidth={2.25} />
          Salir
        </button>
      </div>

      <div className="p-6 pb-0 shrink-0">
         <div className="bg-bg p-4 rounded-xl flex items-center gap-3 mb-4 border border-border">
           <div className="w-10 h-10 rounded-full bg-secondary dark:bg-primary border border-black/5 dark:border-white/10 flex items-center justify-center text-[#2D3277] dark:text-black font-black text-sm shrink-0 shadow-sm">
              {user?.nombre?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
           </div>
           <div className="overflow-hidden min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Vendedor</p>
              <p className="font-black text-sm truncate text-text-main uppercase tracking-tight">
                 {(user?.nombre || user?.apellido) 
                   ? `${user?.nombre || ''} ${user?.apellido || ''}`.trim() 
                   : user?.email?.split('@')[0]}
              </p>
           </div>
         </div>

         <p className="px-2 text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 opacity-50">Menú Principal</p>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 pb-4 space-y-2">
        <button 
          onClick={() => setTabActiva('info')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold uppercase tracking-tight ${tabActiva === 'info' ? 'bg-primary text-white dark:text-black shadow-lg' : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-main'}`}
        >
          <Store size={18} /> Mi Tienda
        </button>
        <button 
          onClick={() => setTabActiva('menu')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold uppercase tracking-tight ${tabActiva === 'menu' ? 'bg-primary text-white dark:text-black shadow-lg' : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-main'}`}
        >
          <UtensilsCrossed size={18} /> Catálogo
        </button>
        <button 
          onClick={() => setTabActiva('tema')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold uppercase tracking-tight ${tabActiva === 'tema' ? 'bg-primary text-white dark:text-black shadow-lg' : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-main'}`}
        >
          <Palette size={18} /> Apariencia
        </button>
        <button 
          onClick={() => setTabActiva('difusion')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold uppercase tracking-tight ${tabActiva === 'difusion' ? 'bg-primary text-white dark:text-black shadow-lg' : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-main'}`}
        >
          <Share2 size={18} /> Difusión
        </button>
        <button 
          onClick={() => setTabActiva('docker')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold uppercase tracking-tight ${tabActiva === 'docker' ? 'bg-primary text-white dark:text-black shadow-lg' : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-main'}`}
        >
          <Server size={18} /> Evaluador
        </button>

         <div className="pt-6 mt-6 border-t border-white/5 pb-4">
           <p className="px-2 text-xs font-bold text-text-muted/50 uppercase tracking-wider mb-3">Acciones</p>
           <div className="px-4 mb-2 flex justify-between items-center">
              <span className="text-xs text-text-muted">Tema</span>
              <ThemeToggle />
           </div>
           <button type="button" onClick={() => setVistaPreviaAbierta(true)} className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:text-text-main hover:bg-white/5 rounded-xl transition-all text-sm">
             <Eye size={18} /> Preview
           </button>
           {tienda && (
             <a href={`/#/tienda/${tienda.id}`} target="_blank" rel="noreferrer" className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:text-text-main hover:bg-white/5 rounded-xl transition-all text-sm">
               <ExternalLink size={18} /> Ir al Sitio
             </a>
           )}
         </div>
      </nav>
    </aside>
  );
};
