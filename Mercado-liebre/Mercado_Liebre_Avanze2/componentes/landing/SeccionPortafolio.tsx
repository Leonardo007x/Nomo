
import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { apiJson } from '../../lib/clienteApi';
import { Tienda } from '../../tipos';
import { ExternalLink, Loader2, MapPin } from 'lucide-react';
import { ImagenInteligente } from '../ui';

export const SeccionPortafolio = () => {
  const [ejemplos, setEjemplos] = useState<Tienda[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarEjemplos = async () => {
      try {
        const data = await apiJson<Tienda[]>('/tiendas/destacadas');
        setEjemplos(data || []);
      } catch {
        setEjemplos([]);
      } finally {
        setCargando(false);
      }
    };
    cargarEjemplos();
  }, []);

  return (
    <section id="ejemplos" className="py-24 bg-surface/30 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
           <div>
              <h2 className="text-3xl md:text-5xl font-bold font-serif mb-4 text-text-main">Hecho con Mercado Liebre</h2>
              <p className="text-text-muted text-lg">Tiendas reales que han transformado su presencia digital.</p>
           </div>
        </div>

        {cargando ? (
           <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={48} /></div>
        ) : ejemplos.length === 0 ? (
           <div className="text-center py-20 neumorphic rounded-3xl">
              <p className="text-text-muted">Aún no hay tiendas públicos destacados. ¡Sé el primero!</p>
           </div>
        ) : (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ejemplos.map((rest) => (
                 <Link 
                    key={rest.id} 
                    to={`/tienda/${rest.id}`}
                    className="group bg-surface overflow-hidden rounded-3xl border border-border hover:-translate-y-2 transition-all duration-500 block shadow-sm hover:shadow-xl"
                 >
                    <div className="h-48 overflow-hidden relative">
                       <ImagenInteligente 
                          src={rest.imagen_banner_url || 'https://via.placeholder.com/800x400'} 
                          alt={rest.nombre} 
                          className="w-full h-full transition-transform duration-700 group-hover:scale-110" 
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                       <div className="absolute bottom-4 left-4 flex items-center gap-3 z-10">
                          {rest.imagen_logo_url ? (
                             <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-md">
                                <ImagenInteligente src={rest.imagen_logo_url} alt="Logo" className="w-full h-full" />
                             </div>
                          ) : (
                             <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-white shadow-md">
                                {rest.nombre.charAt(0)}
                             </div>
                          )}
                          <div className="text-white">
                             <h3 className="font-bold leading-tight drop-shadow-md">{rest.nombre}</h3>
                             <p className="text-[10px] opacity-90 flex items-center gap-1"><MapPin size={10} /> {rest.ciudad}</p>
                          </div>
                       </div>
                       <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-10">
                          <ExternalLink size={16} />
                       </div>
                    </div>
                    <div className="p-6">
                       <p className="text-sm text-text-muted line-clamp-2">{rest.eslogan || rest.descripcion || 'Sin descripción disponible.'}</p>
                       <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-primary">
                          <span>Ver Catálogo Digital</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                       </div>
                    </div>
                 </Link>
              ))}
           </div>
        )}
      </div>
    </section>
  );
};
