
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus, ShoppingCart, Clock, Info } from 'lucide-react';
import { Producto } from '../../tipos';
import { ImagenInteligente } from '../ui';

interface Props {
  producto: Producto;
  onClose: () => void;
  onAddToCart: (producto: Producto, cantidad: number) => void;
  estilos: any;
  isDark: boolean;
}

export const ModalDetalleProducto: React.FC<Props> = ({ 
  producto, onClose, onAddToCart, estilos, isDark 
}) => {
  const [cantidad, setCantidad] = useState(1);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleAdd = () => {
    setAnimating(true);
    onAddToCart(producto, cantidad);
    setTimeout(() => {
        setAnimating(false);
        onClose();
    }, 500);
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      
      <div 
        className="relative w-full max-w-4xl bg-bg rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:h-auto animate-in zoom-in-95 duration-300"
        style={{ backgroundColor: estilos.bg, color: estilos.text }}
      >
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md transition-colors"
        >
            <X size={36} />
        </button>

        {/* COLUMNA IMAGEN */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative shrink-0">
            <ImagenInteligente 
                src={producto.imagen_url || undefined} 
                alt={producto.nombre} 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
            {producto.destacado && (
                <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    ★ Recomendado
                </div>
            )}
        </div>

        {/* COLUMNA INFO */}
        <div className="flex-1 p-6 md:p-10 flex flex-col overflow-y-auto">
            <div className="mb-auto">
                <div className="flex items-center gap-2 mb-2 opacity-60 text-sm font-bold uppercase tracking-wider">
                    <span>{producto.categoria}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold font-title mb-4 leading-tight" style={{ color: estilos.title }}>
                    {producto.nombre}
                </h2>
                
                <div className="flex items-center gap-4 mb-6">
                    <span className="text-2xl font-bold text-primary font-serif">
                        ${producto.precio.toLocaleString()}
                    </span>
                    {producto.tiempo_preparacion && (
                        <span className="flex items-center gap-1 text-xs opacity-60">
                            <Clock size={14} /> {producto.tiempo_preparacion} min
                        </span>
                    )}
                </div>

                <p className="text-lg opacity-80 leading-relaxed mb-6 font-light">
                    {producto.descripcion}
                </p>

                {producto.caracteristicas && producto.caracteristicas.length > 0 && (
                    <div className="mb-8 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-white/5">
                        <h4 className="text-xs font-bold uppercase opacity-50 mb-3 flex items-center gap-2">
                            <Info size={14} /> Características
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {producto.caracteristicas.map((ing, i) => (
                                <span key={i} className="px-3 py-1 rounded-lg text-sm bg-bg border border-white/10 shadow-sm">
                                    {ing}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* CONTROLES FOOTER */}
            <div className="pt-6 border-t border-dashed" style={{ borderColor: estilos.border }}>
                <div className="flex items-center justify-between gap-6">
                    {/* Selector Cantidad */}
                    <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 rounded-xl p-1.5">
                        <button 
                            onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                            <Minus size={18} />
                        </button>
                        <span className="text-xl font-bold w-6 text-center">{cantidad}</span>
                        <button 
                            onClick={() => setCantidad(cantidad + 1)}
                            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Botón Agregar */}
                    <button 
                        onClick={handleAdd}
                        className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 overflow-hidden relative ${animating ? 'bg-green-500' : ''}`}
                        style={{ backgroundColor: animating ? '#22c55e' : estilos.primary }}
                    >
                        {animating ? (
                            <span className="flex items-center gap-2 animate-in zoom-in">¡Agregado!</span>
                        ) : (
                            <>
                                <ShoppingCart size={20} />
                                <span>Agregar ${ (producto.precio * cantidad).toLocaleString() }</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
