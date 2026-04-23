
import React from 'react';
import { EstilosComunes } from '../PlantillaTienda';
import { Producto } from '../../../tipos';
import { Plus, Star } from 'lucide-react';
import { ImagenInteligente } from '../../ui';

interface Props {
  categorias: string[];
  menuPorCategoria: Record<string, Producto[]>;
  onVerProducto: (p: Producto) => void;
  estilos: EstilosComunes;
  refs: any;
}

export const EstiloModerno: React.FC<Props> = ({ categorias, menuPorCategoria, onVerProducto, estilos, refs }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
       {categorias.map(categoria => (
            <div key={categoria} ref={(el) => { refs.current[categoria] = el; }} className="mb-16 scroll-mt-32">
              {/* Header de Categoría Sticky */}
              <div className="sticky top-20 z-30 py-4 mb-6 backdrop-blur-xl bg-opacity-90 transition-colors rounded-xl px-2" style={{ backgroundColor: `${estilos.bg}AA` }}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 rounded-full" style={{background: estilos.primary}}></div>
                  <h2 className="text-2xl md:text-3xl font-bold font-title tracking-tight" style={{ color: estilos.title }}>{categoria}</h2>
                  <span className="text-xs font-bold opacity-50 ml-auto px-3 py-1 rounded-full border border-current">{menuPorCategoria[categoria].length} items</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {menuPorCategoria[categoria].map(producto => (
                  <div 
                    key={producto.id} 
                    className="group relative flex flex-col rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                    onClick={() => onVerProducto(producto)}
                    style={{ 
                        backgroundColor: estilos.bg,
                        boxShadow: `0 10px 30px -10px ${estilos.primary}20, 0 0 0 1px ${estilos.border}`
                    }}
                  >
                    {/* Imagen y Badge de Precio */}
                    <div className="relative h-64 overflow-hidden">
                      <ImagenInteligente 
                         src={producto.imagen_url || undefined} 
                         alt={producto.nombre} 
                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                      
                      <div className="absolute top-4 right-4">
                          <span className="px-4 py-2 rounded-2xl text-sm font-black bg-white/90 text-black shadow-lg backdrop-blur-md flex items-center gap-1">
                             ${producto.precio.toLocaleString()}
                          </span>
                      </div>
                      {producto.destacado && (
                          <div className="absolute top-4 left-4">
                              <span className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-lg animate-pulse">
                                  <Star size={16} fill="currentColor" />
                              </span>
                          </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="p-6 flex-1 flex flex-col relative">
                      <div className="absolute -top-6 right-6">
                         <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 active:scale-95"
                            style={{ backgroundColor: estilos.primary, color: '#fff' }}
                         >
                            <Plus size={36} />
                         </div>
                      </div>

                      <h3 className="text-xl font-bold font-title leading-tight mb-2 pr-12" style={{ color: estilos.title }}>
                          {producto.nombre}
                      </h3>
                      <p className="text-sm opacity-70 mb-4 line-clamp-2 leading-relaxed font-medium">
                          {producto.descripcion}
                      </p>
                      
                      {producto.caracteristicas && producto.caracteristicas.length > 0 && (
                          <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-dashed" style={{borderColor: estilos.border}}>
                              {producto.caracteristicas.slice(0, 3).map((ing, i) => (
                                  <span key={i} className="text-[10px] uppercase font-bold px-2 py-1 rounded-md bg-black/5 dark:bg-white/5 opacity-70">
                                      {ing}
                                  </span>
                              ))}
                          </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
    </div>
  );
};
