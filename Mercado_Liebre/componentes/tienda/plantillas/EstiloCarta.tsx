import React from 'react';
import { EstilosComunes } from '../PlantillaTienda';
import { Producto } from '../../../tipos';
import { ShoppingBag } from 'lucide-react';
import { ImagenInteligente } from '../../ui';

interface Props {
  categorias: string[];
  menuPorCategoria: Record<string, Producto[]>;
  onVerProducto: (p: Producto) => void;
  estilos: EstilosComunes;
  refs: any;
}

export const EstiloCarta: React.FC<Props> = ({ categorias, menuPorCategoria, onVerProducto, estilos, refs }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 animate-fadeIn relative w-full overflow-hidden">
       {/* Textura de papel sutil de fondo */}
       <div 
         className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply dark:mix-blend-screen" 
         style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='currentColor' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}
       ></div>

       {/* Marco decorativo exterior */}
       <div className="absolute inset-4 sm:inset-8 border-2 border-double pointer-events-none opacity-30" style={{borderColor: estilos.primary}}></div>

       <div className="relative z-10 py-8">
           {categorias.map(categoria => (
                <div key={categoria} ref={(el) => { refs.current[categoria] = el; }} className="mb-24 scroll-mt-32">
                  
                  {/* Título de Categoría Ornamentado */}
                  <div className="text-center mb-16 relative px-4">
                    <div className="flex items-center justify-center gap-4 mb-2 opacity-60">
                        <div className="h-[1px] w-12 bg-current"></div>
                        <span className="font-serif italic text-sm" style={{color: estilos.primary}}>Selección de</span>
                        <div className="h-[1px] w-12 bg-current"></div>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold font-title tracking-tight drop-shadow-sm" style={{ color: estilos.title }}>{categoria}</h2>
                  </div>
                  
                  <div className="space-y-10 px-2 md:px-8">
                    {menuPorCategoria[categoria].map(producto => (
                      <div 
                        key={producto.id} 
                        className="group relative cursor-pointer p-2 sm:p-4 rounded-2xl transition-all duration-500 hover:bg-black/5 dark:hover:bg-white/5 w-full" 
                        onClick={() => onVerProducto(producto)}
                      >
                        <div className="flex gap-5 md:gap-8 items-center w-full">
                           {/* Imagen Circular con Borde Decorativo */}
                           <div 
                              className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 relative overflow-hidden rounded-full border-[3px] border-double shadow-md p-1 bg-surface group-hover:scale-105 transition-transform duration-500"
                              style={{borderColor: estilos.primary}}
                           >
                               <ImagenInteligente 
                                  src={producto.imagen_url || undefined} 
                                  alt={producto.nombre} 
                                  className="w-full h-full object-cover rounded-full grayscale-[20%] group-hover:grayscale-0 transition-all"
                               />
                           </div>

                           <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                                {/* Header del item: Nombre y Precio */}
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 w-full mb-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1 relative">
                                        {producto.destacado && <ShoppingBag size={18} className="text-yellow-500 flex-shrink-0 mb-1" />}
                                        <h3 className="text-xl sm:text-2xl font-bold font-title text-text-main group-hover:text-primary transition-colors duration-300 leading-none">
                                            {producto.nombre}
                                        </h3>
                                        {/* Línea punteada (Leader) - Visible solo en desktop */}
                                        <div className="hidden sm:block flex-1 border-b-2 border-dotted mx-4 opacity-30 mb-1" style={{borderColor: estilos.text}}></div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between w-full sm:w-auto shrink-0">
                                        <span className="font-serif text-xl sm:text-2xl font-bold italic" style={{color: estilos.primary}}>
                                            ${producto.precio.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm sm:text-base opacity-70 font-serif leading-relaxed line-clamp-2 break-words pr-4">
                                    {producto.descripcion}
                                </p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
       </div>
    </div>
  );
};