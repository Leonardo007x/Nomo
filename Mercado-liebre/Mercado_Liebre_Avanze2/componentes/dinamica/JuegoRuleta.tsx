
import React, { useState } from 'react';
import { RefreshCw, Ghost, XCircle } from 'lucide-react';
import { Tienda } from '../../tipos';
import { Boton } from '../ui';

const COLORES_RULETA = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
  '#F7DC6F', '#BB8FCE', '#F1948A', '#82E0AA', '#85C1E9'
];

const FRASES_ELIMINACION = [
  "Hoy no es tu día de suerte.", "¡Gracias por participar!", "A la próxima será.",
  "El destino ha hablado.", "Has sido eliminado.", "Lo sentimos, te vas a casa.",
  "¡Ups! La ruleta no perdona.", "Mala racha, buen apetito."
];

interface Props {
  tiendas: Tienda[];
  onGanador: (r: Tienda) => void;
}

export const JuegoRuleta: React.FC<Props> = ({ tiendas, onGanador }) => {
  const [candidatos, setCandidatos] = useState<Tienda[]>(tiendas);
  const [eliminados, setEliminados] = useState<Tienda[]>([]);
  const [girando, setGirando] = useState(false);
  const [rotacion, setRotacion] = useState(0);
  const [eliminadoActual, setEliminadoActual] = useState<Tienda | null>(null);
  const [mensajeDespedida, setMensajeDespedida] = useState("");

  const girar = () => {
    if (candidatos.length === 1) {
       onGanador(candidatos[0]);
       return;
    }
    if (girando) return;
    setGirando(true);
    
    const indicePerdedor = Math.floor(Math.random() * candidatos.length);
    const perdedor = candidatos[indicePerdedor];
    const sliceAngle = 360 / candidatos.length;
    const itemCenterAngle = (indicePerdedor * sliceAngle) + (sliceAngle / 2);
    const targetRotationBase = 360 - itemCenterAngle;
    const spins = 360 * 5;
    const currentMod = rotacion % 360;
    let distanceToTarget = targetRotationBase - currentMod;
    if (distanceToTarget < 0) distanceToTarget += 360;

    const nuevaRotacion = rotacion + spins + distanceToTarget;
    setRotacion(nuevaRotacion);

    setTimeout(() => {
      setGirando(false);
      setMensajeDespedida(FRASES_ELIMINACION[Math.floor(Math.random() * FRASES_ELIMINACION.length)]);
      setEliminadoActual(perdedor);
    }, 6000);
  };

  const cerrarModalEliminado = () => {
      if (eliminadoActual) {
          const nuevosCandidatos = candidatos.filter(c => c.id !== eliminadoActual.id);
          setCandidatos(nuevosCandidatos);
          setEliminados([...eliminados, eliminadoActual]);
          setEliminadoActual(null);
          
          if (nuevosCandidatos.length === 1) {
             setTimeout(() => onGanador(nuevosCandidatos[0]), 500);
          }
      }
  };

  const generarConicGradient = () => `conic-gradient(${candidatos.map((_, i) => {
      const start = (i / candidatos.length) * 100;
      const end = ((i + 1) / candidatos.length) * 100;
      return `${COLORES_RULETA[i % COLORES_RULETA.length]} ${start}% ${end}%`;
    }).join(', ')})`;

  return (
    <div className="flex flex-col lg:flex-row gap-12 items-center justify-center h-full animate-fadeIn w-full relative">
      {/* Estilos locales para clip-path */}
      <style>{`.clip-path-triangle { clip-path: polygon(0% 0%, 100% 0%, 50% 100%); }`}</style>

      <div className="relative order-1 lg:order-2 py-10">
        {/* Marcador triangular */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-40 filter drop-shadow-xl">
           <div className="w-12 h-14 bg-text-main clip-path-triangle flex items-start justify-center pt-1 shadow-xl">
               <div className="w-2 h-2 bg-white rounded-full"></div>
           </div>
        </div>
        
        <div className="rounded-full p-6 bg-surface shadow-2xl border-[8px] border-surface">
          <div 
            className="w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full overflow-hidden relative shadow-2xl border-4 border-white/10"
            style={{ 
              transform: `rotate(${rotacion}deg)`,
              transition: girando ? 'transform 6s cubic-bezier(0.15, 0.80, 0.15, 1.0)' : 'none',
              background: generarConicGradient()
            }}
          >
             {candidatos.map((r, i) => {
                const rotation = (360 / candidatos.length) * i + (360 / candidatos.length) / 2; 
                return (
                   <div key={r.id} className="absolute top-0 left-1/2 w-1 h-1/2 origin-bottom flex flex-col justify-start items-center pt-6 md:pt-10" style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}>
                      <span className="text-white font-bold uppercase drop-shadow-md whitespace-nowrap text-xs md:text-base tracking-wide px-2 py-1 bg-black/10 rounded-full backdrop-blur-sm" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', maxHeight: '180px' }}>
                         {r.nombre.length > 20 ? r.nombre.substring(0, 20) + '..' : r.nombre}
                      </span>
                   </div>
                )
             })}
          </div>
        </div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
           <button onClick={girar} disabled={girando} className="w-24 h-24 rounded-full bg-surface flex items-center justify-center border-4 border-surface shadow-xl hover:scale-105 active:scale-95 transition-all group">
             <span className="font-black text-lg text-text-main group-hover:text-primary transition-colors">
               {girando ? <RefreshCw className="animate-spin"/> : 'GIRAR'}
             </span>
           </button>
        </div>
      </div>

      {/* Panel Lateral */}
      <div className="w-full max-w-sm space-y-6 order-2 lg:order-1">
         <div className="text-center lg:text-left mb-6">
            <h2 className="text-3xl font-bold font-serif text-text-main">La Rueda Decide</h2>
            <p className="text-text-muted">Modo Eliminatoria</p>
         </div>

         <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <h3 className="font-bold text-text-main">En Juego</h3>
              <span className="text-2xl font-bold text-primary">{candidatos.length}</span>
            </div>
            <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
               <div className="bg-primary h-full transition-all duration-500" style={{width: `${(candidatos.length / (candidatos.length + eliminados.length)) * 100}%`}}></div>
            </div>
         </div>

         <div className="bg-bg border border-border p-6 rounded-2xl max-h-60 overflow-y-auto shadow-inner">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-red-400 text-sm uppercase tracking-wider">
               <Ghost size={16} /> Cementerio ({eliminados.length})
            </h3>
            <div className="flex flex-wrap gap-2">
               {eliminados.length === 0 && <p className="text-text-muted text-xs italic w-full text-center">Nadie ha caído aún...</p>}
               {eliminados.map(e => <span key={e.id} className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs line-through opacity-70">{e.nombre}</span>)}
            </div>
         </div>
      </div>

      {eliminadoActual && (
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
             <div className="bg-surface max-w-sm w-full p-8 rounded-3xl text-center relative border border-border shadow-2xl">
                 <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-4 animate-bounce">
                     <XCircle size={40} />
                 </div>
                 <h3 className="text-2xl font-bold text-text-main mb-2">¡Eliminado!</h3>
                 <h4 className="text-xl font-serif text-red-500 mb-4">{eliminadoActual.nombre}</h4>
                 <p className="text-text-muted mb-8 italic">"{mensajeDespedida}"</p>
                 <Boton onClick={cerrarModalEliminado} className="w-full justify-center !bg-red-500 !text-white shadow-lg">Continuar Juego</Boton>
             </div>
          </div>
      )}
    </div>
  );
};
