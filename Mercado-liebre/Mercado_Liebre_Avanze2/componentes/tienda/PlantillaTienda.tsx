
/**
 * Descripción: Componente principal que orquesta la visualización del tienda según el tema seleccionado.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Tienda, Tema, Producto } from '../../tipos';
import { ShoppingCart, X, Facebook, Instagram, Phone, Clock, MapPin, Sun, Moon, Mail, Sparkles } from 'lucide-react';
import { ImagenInteligente, LogoWhatsApp } from '../ui';
import { useTema } from '../../contexto/ContextoTema';
import { useStoreCarrito } from '../../store/storeCarrito';
import { ModalCarrito } from './ModalCarrito';
import { ModalDetalleProducto } from './ModalDetalleProducto';
import { apiSaludo } from '../../servicios/misApis';

// Importación de las sub-plantillas (Modularidad)
import { EstiloModerno } from './plantillas/EstiloModerno';
import { EstiloCarta } from './plantillas/EstiloCarta';

// Helper para convertir HEX a RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
}

const DIAS_LABEL = [
    { key: 'lunes', label: 'L' }, { key: 'martes', label: 'M' }, { key: 'miercoles', label: 'X' },
    { key: 'jueves', label: 'J' }, { key: 'viernes', label: 'V' }, { key: 'sabado', label: 'S' }, { key: 'domingo', label: 'D' },
] as const;

export type EstilosComunes = {
    bg: string;
    text: string;
    title: string;
    primary: string;
    secondary: string;
    border: string;
}

interface PlantillaProps {
  tienda: Tienda;
  tema: Tema;
  productos: Producto[];
  modoPreview?: boolean;
  onClosePreview?: () => void;
}

// Helper para formatear hora (quitar segundos)
const formatTime = (time?: string) => {
    if (!time) return '--:--';
    return time.slice(0, 5);
};

export const PlantillaTienda: React.FC<PlantillaProps> = ({ tienda, tema, productos, modoPreview, onClosePreview }) => {
  const { tema: temaGlobal, toggleTema } = useTema(); 
  const { carrito, modalAbierto, setModalAbierto, agregarItem, eliminarItem, actualizarCantidad, vaciarCarrito } = useStoreCarrito();
  const [categoriaActiva, setCategoriaActiva] = useState<string>("");
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Estado para el modal de detalle
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  
  // Estado para API de Saludo
  const [saludoDinamico, setSaludoDinamico] = useState<string>("");

  const isDark = temaGlobal === 'dark';
  
  // --- CONSUMO API PROPIA (Saludo) ---
  useEffect(() => {
    const fetchSaludo = async () => {
        try {
            const data = await apiSaludo.obtenerMensajeBienvenida(tienda.nombre);
            setSaludoDinamico(data.mensaje);
        } catch (error) {
            console.error("Error obteniendo saludo:", error);
        }
    };
    fetchSaludo();
  }, [tienda.nombre]);
  
  // --- MOTOR DE COLOR DINÁMICO (AMBIENT ACCENTUATION) ---
  const isDefaultLight = ['#FFFFFF', '#F9FAFB', '#F0F9FF', '#F3F4F6', '#FAFBF6'].includes(tema.color_fondo);
  const bgBase = isDark ? '#1A1D21' : (isDefaultLight ? '#B8BEC5' : tema.color_fondo);
  
  const rgbPrimario = hexToRgb(tema.color_primario);
  const rgbFondo = hexToRgb(bgBase);
  
  const shadowLightColor = isDark 
     ? `rgba(${rgbPrimario}, 0.08)` 
     : `rgba(255, 255, 255, 0.8)`; 
  
  const shadowDarkColor = isDark 
     ? `rgba(0, 0, 0, 0.8)` 
     : `rgba(${rgbPrimario}, 0.15)`;

  const borderHighlight = isDark ? `rgba(${rgbPrimario}, 0.1)` : 'rgba(255, 255, 255, 0.4)';
  const borderShadow = isDark ? 'rgba(0, 0, 0, 0.6)' : `rgba(${rgbPrimario}, 0.1)`;

  const estilos: EstilosComunes = {
    bg: bgBase, 
    text: isDark ? '#F3F4F6' : '#0F172A', 
    title: isDark ? '#FFFFFF' : '#0F172A',
    primary: tema.color_primario, 
    secondary: tema.color_secundario, 
    border: isDark ? `rgba(${rgbPrimario}, 0.2)` : 'rgba(0,0,0,0.05)', 
  };

  const menuPorCategoria = productos.reduce((acc, p) => {
    const cat = p.categoria || 'Especialidades';
    if (!acc[cat]) acc[cat] = []; acc[cat].push(p); return acc;
  }, {} as Record<string, Producto[]>);
  const categorias = Object.keys(menuPorCategoria);

  const scrollToCategory = (cat: string) => {
    setCategoriaActiva(cat);
    categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Handler para abrir el modal de detalles
  const handleVerProducto = (p: Producto) => {
      setProductoSeleccionado(p);
  };

  // Handler para añadir desde el modal
  const handleAddToCartFromModal = (p: Producto, cantidad: number) => {
      for(let i = 0; i < cantidad; i++) {
          agregarItem(p);
      }
  };

  return (
    <div style={{ backgroundColor: estilos.bg, color: estilos.text, minHeight: '100vh', fontFamily: tema.fuente_cuerpo }} className="transition-colors duration-500 selection:bg-primary/30 relative overflow-hidden">
      
      {/* BLOBS DE FONDO (GLASSMORPHISM) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-10 md:opacity-20 mix-blend-screen" style={{background: estilos.primary}}></div>
          <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-10 md:opacity-15 mix-blend-screen" style={{background: estilos.secondary}}></div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${tema.fuente_titulos.replace(' ', '+')}:wght@400;700&family=${tema.fuente_cuerpo.replace(' ', '+')}:wght@300;400;600&display=swap');
        .font-title { font-family: '${tema.fuente_titulos}', serif; }
        
        /* Estilos base reutilizables */
        .neumorphic-navbar { 
            background: ${isDark ? `rgba(${rgbFondo}, 0.85)` : `rgba(${rgbFondo}, 0.9)`}; 
            border-bottom: 1px solid ${borderShadow}; 
            backdrop-filter: blur(16px); 
        }
        
        .neumorphic-btn-public { 
          background: ${isDark ? `rgba(${rgbFondo}, 0.8)` : `rgba(${rgbFondo}, 0.9)`};
          box-shadow: 5px 5px 10px ${shadowDarkColor}, -5px -5px 10px ${shadowLightColor}; 
          border-radius: 0.75rem; 
          border: 1px solid ${borderHighlight};
          transition: all 0.2s ease;
          color: ${estilos.text}; /* Color explícito del tema */
        }
        
        .neumorphic-btn-public:hover {
          transform: translateY(-2px);
          box-shadow: 6px 6px 12px ${shadowDarkColor}, -6px -6px 12px ${shadowLightColor};
        }

        .neumorphic-active { 
          background: ${estilos.bg};
          box-shadow: inset 3px 3px 6px ${shadowDarkColor}, inset -3px -3px 6px ${shadowLightColor}; 
          color: ${estilos.primary}; 
          border-radius: 0.75rem; 
          border: 1px solid transparent;
        }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      {/* NAVBAR COMÚN */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 neumorphic-navbar`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-24">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
               <span className="text-lg md:text-2xl font-bold font-title truncate max-w-[150px] md:max-w-xs leading-none" style={{color: estilos.title}}>{tienda.nombre}</span>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              
              {/* Custom Theme Toggle Button */}
              <button 
                onClick={toggleTema}
                className="neumorphic-btn-public p-3 rounded-full group relative overflow-hidden"
                aria-label="Alternar Tema"
              >
                 <div className={`transition-transform duration-500 ${isDark ? 'rotate-0' : '-rotate-180'}`}>
                    {isDark ? <Moon size={20} fill="currentColor" className="text-primary" /> : <Sun size={20} fill="currentColor" className="text-yellow-600" />}
                 </div>
              </button>

              <button onClick={() => setModalAbierto(true)} className="relative neumorphic-btn-public p-3 rounded-full group">
                <ShoppingCart size={22} style={{color: estilos.text}} className="group-hover:text-primary transition-colors"/>
                {carrito.length > 0 && <span className="absolute -top-1 -right-1 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full shadow-sm" style={{backgroundColor: estilos.primary}}>{carrito.reduce((acc, item) => acc + item.cantidad, 0)}</span>}
              </button>
              {modoPreview && onClosePreview && <button onClick={onClosePreview} className="flex items-center gap-2 neumorphic-btn-public px-3 md:px-4 py-2 text-sm text-red-500 hover:text-red-600 font-bold"><X size={16} /> <span className="hidden md:inline">Cerrar</span></button>}
            </div>
          </div>
        </div>
        {/* Submenu Categorias */}
        <div className="w-full overflow-x-auto scrollbar-hide py-4 border-t" style={{ borderColor: borderShadow }}>
        <div className="flex whitespace-nowrap px-4 md:justify-center min-w-max gap-3 md:gap-4">
            {categorias.map(cat => (
                <button key={cat} onClick={() => scrollToCategory(cat)} className={`px-6 py-2.5 text-sm font-bold transition-all ${categoriaActiva === cat ? 'neumorphic-active' : 'neumorphic-btn-public'}`}>{cat}</button>
            ))}
        </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden mb-12 mx-4 mt-6 rounded-3xl p-0 shadow-2xl transition-all border border-white/10">
        <div className="absolute inset-0 z-0">
        <ImagenInteligente src={tienda.imagen_banner_url || undefined} className="w-full h-full" alt="Banner Tienda" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fadeIn flex flex-col items-center">
        {tienda.imagen_logo_url && (
            <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-full overflow-hidden border-4 shadow-2xl mb-6 backdrop-blur-md" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
                <ImagenInteligente src={tienda.imagen_logo_url} alt="Logo" className="w-full h-full" />
            </div>
        )}
        
        {/* Saludo Dinámico API */}
        {saludoDinamico && (
            <div className="mb-4 animate-fadeIn">
                <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs md:text-sm font-bold border border-white/10 shadow-sm flex items-center gap-2 select-none hover:bg-white/30 transition-colors cursor-default">
                    <Sparkles size={12} className="text-yellow-300 fill-yellow-300 animate-pulse"/>
                    {saludoDinamico}
                </span>
            </div>
        )}

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-title drop-shadow-lg tracking-tight">{tienda.nombre}</h1>
        <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-8 drop-shadow-md font-light italic">{tienda.eslogan}</p>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL (SELECTOR DE ESTRATEGIA) */}
      <main className="relative z-10 min-h-[50vh]">
          {tema.estilo_plantilla === 'carta' ? (
              <EstiloCarta 
                 categorias={categorias} 
                 menuPorCategoria={menuPorCategoria} 
                 onVerProducto={handleVerProducto} 
                 estilos={estilos} 
                 refs={categoryRefs} 
              />
          ) : (
              // Default: Moderno
              <EstiloModerno 
                 categorias={categorias} 
                 menuPorCategoria={menuPorCategoria} 
                 onVerProducto={handleVerProducto} 
                 estilos={estilos} 
                 refs={categoryRefs} 
              />
          )}
      </main>

      {/* FOOTER REDISEÑADO */}
      <footer className="py-16 mt-20 border-t relative z-10" style={{ borderColor: estilos.border }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 md:p-12 relative overflow-hidden rounded-[2.5rem] border border-white/5 shadow-lg backdrop-blur-sm" style={{background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}}>
            
            <div className="grid md:grid-cols-3 gap-10 md:gap-16 relative z-10 items-start">
              
              {/* COLUMNA 1: IDENTIDAD */}
              <div className="space-y-6 text-center md:text-left">
                 <div>
                     <h3 className="text-3xl md:text-4xl font-bold font-title mb-3" style={{color: estilos.title}}>
                         {tienda.nombre}
                     </h3>
                     <div className="h-1 w-20 bg-primary rounded-full mx-auto md:mx-0 mb-4" style={{backgroundColor: estilos.primary}}></div>
                 </div>
                 <p className="opacity-80 leading-relaxed text-sm md:text-base font-light">
                     {tienda.descripcion || "Descubre sabores únicos elaborados con pasión y dedicación."}
                 </p>
                 <div className="flex gap-4 justify-center md:justify-start pt-2">
                    {tienda.facebook && <a href={tienda.facebook} className="neumorphic-btn-public p-3 rounded-full hover:text-blue-500 transition-colors"><Facebook size={20}/></a>}
                    {tienda.instagram && <a href={tienda.instagram} className="neumorphic-btn-public p-3 rounded-full hover:text-pink-500 transition-colors"><Instagram size={20}/></a>}
                    {tienda.whatsapp && <a href={`https://wa.me/57${tienda.whatsapp.replace(/\D/g,'')}`} className="neumorphic-btn-public p-3 rounded-full hover:text-green-500 transition-colors"><LogoWhatsApp className="w-5 h-5" /></a>}
                 </div>
              </div>

              {/* COLUMNA 2: UBICACIÓN Y CONTACTO */}
              <div className="space-y-6">
                 <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{backgroundColor: `${estilos.primary}20`, color: estilos.primary}}>
                        <MapPin size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider mb-1 opacity-60">Ubicación</h4>
                        <p className="font-medium leading-snug text-lg">{tienda.direccion}</p>
                        <p className="opacity-70 mt-1">{tienda.ciudad}</p>
                    </div>
                 </div>

                 <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{backgroundColor: `${estilos.secondary}20`, color: estilos.secondary}}>
                        <Phone size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider mb-1 opacity-60">Reservas</h4>
                        <p className="font-medium font-mono text-lg tracking-tight">{tienda.telefono}</p>
                        {tienda.email && <p className="text-xs opacity-60 mt-1 flex items-center gap-1"><Mail size={10}/> {tienda.email}</p>}
                    </div>
                 </div>
              </div>

              {/* COLUMNA 3: HORARIOS */}
              <div className="flex flex-col rounded-3xl p-6 md:p-8 text-center border border-white/5 shadow-inner bg-black/5 dark:bg-white/5">
                 <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white shadow-lg animate-pulse" style={{backgroundColor: estilos.primary}}>
                     <Clock size={36} />
                 </div>
                 
                 <h4 className="font-bold font-title text-xl mb-2" style={{color: estilos.title}}>Horario de Atención</h4>
                 
                 <div className="text-2xl font-light mb-6 font-mono opacity-90">
                    {formatTime(tienda.horario_apertura)} <span className="opacity-40 mx-1">-</span> {formatTime(tienda.horario_cierre)}
                 </div>

                 <div className="flex justify-center gap-2 flex-wrap">
                    {DIAS_LABEL.map(d => {
                        const isOpen = tienda.dias_abierto?.[d.key];
                        return (
                            <div 
                                key={d.key} 
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                ${isOpen 
                                    ? 'text-white shadow-md scale-110' 
                                    : 'bg-transparent opacity-20 border border-current scale-90'
                                }`}
                                style={isOpen ? { backgroundColor: estilos.primary } : {}}
                                title={isOpen ? 'Abierto' : 'Cerrado'}
                            >
                                {d.label}
                            </div>
                        )
                    })}
                 </div>
              </div>

            </div>
          </div>
          
          <div className="text-center mt-12 opacity-40 text-xs font-medium">
             © {new Date().getFullYear()} {tienda.nombre}. Creado con Mercado Liebre.
          </div>
        </div>
      </footer>

      {/* MODAL DETALLES DEL PRODUCTO */}
      {productoSeleccionado && (
          <ModalDetalleProducto 
              producto={productoSeleccionado}
              onClose={() => setProductoSeleccionado(null)}
              onAddToCart={handleAddToCartFromModal}
              estilos={estilos}
              isDark={isDark}
          />
      )}

      {/* MODAL CARRITO */}
      {modalAbierto && <ModalCarrito 
        carrito={carrito} 
        onClose={() => setModalAbierto(false)} 
        onRemove={eliminarItem} 
        onUpdate={actualizarCantidad} 
        tienda={{nombre: tienda.nombre, whatsapp: tienda.whatsapp}} 
        estilos={estilos} 
        isDark={isDark}
        vaciarCarrito={vaciarCarrito}
      />}
    </div>
  );
};
