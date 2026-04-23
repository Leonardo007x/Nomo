import React from 'react';
import { EstilosComunes } from '../PlantillaTienda';
import { Producto } from '../../../tipos';
import { Plus } from 'lucide-react';
import { ImagenInteligente } from '../../ui';

interface Props {
  categorias: string[];
  menuPorCategoria: Record<string, Producto[]>;
  onVerProducto: (p: Producto) => void;
  estilos: EstilosComunes;
  refs: any;
}

export const EstiloInmersivo: React.FC<Props> = ({ categorias, menuPorCategoria, onVerProducto, estilos, refs }) => {
  // Aplanar todos los productos para el grid continuo
  const todosLosProductos = categorias.flatMap(cat => menuPorCategoria[cat].map(p => ({...p, categoriaNombre: cat})));

  return (
    <div className="w-full min-h-screen animate-fadeIn pb-20">
       {/* LAYOUT UNIFICADO: Grid Editorial Responsivo */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 p-1 sm:p-2 md:p-4">
          {todosLosProductos.map((producto, idx) => {
             // Patrón visual: Cada 5 elementos, el primero es grande (2x2) en escritorio
             const isLarge = idx % 5 === 0; 
             
             // Clases dinámicas según el tamaño
             const gridClasses = isLarge 
                ? 'col-span-1 sm:col-span-2 row-span-1 sm:row-span-2 aspect-[4/5] sm:aspect-square' 
                : 'col-span-1 aspect-[4/5]';

             return (
                <div 
                    key={producto.id} 
                    onClick={() => onVerProducto(producto)}
                    className={`relative group overflow-hidden cursor-pointer bg-gray-900 rounded-xl md:rounded-none ${gridClasses}`}
                >
                    {/* Imagen de Fondo */}
                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                        <ImagenInteligente src={producto.imagen_url || undefined} alt={producto.nombre} className="w-full h-full object-cover" />
                    </div>
                    
                    {/* Overlays */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90"></div>

                    {/* Contenido */}
                    <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <span className="text-[10px] font-bold text-primary mb-1 block tracking-widest uppercase bg-black/50 w-fit px-2 py-1 rounded backdrop-blur-sm">
                            {producto.categoriaNombre}
                        </span>
                        <h3 className={`font-bold font-title text-white mb-1 leading-tight ${isLarge ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`}>
                            {producto.nombre}
                        </h3>
                        <p className="text-gray-300 text-xs line-clamp-2 mb-3 opacity-90">
                             {producto.descripcion}
                        </p>
                        
                        <div className="flex items-center justify-between border-t border-white/10 pt-3">
                            <span className="text-lg font-bold text-white">
                                ${producto.precio.toLocaleString()}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-primary hover:text-white transition-colors">
                                <Plus size={16} />
                            </div>
                        </div>
                    </div>
                </div>
             )
          })}
       </div>
    </div>
  );
};