import React, { useState, useEffect } from 'react';
import { Sparkles, Smartphone, Tablet, Monitor, ShoppingCart, Plus, Star, MapPin, Clock, Menu, Edit3, Lock, RefreshCw, Battery, Wifi, Signal, ChevronLeft, ChevronRight, Hand } from 'lucide-react';

type TemaNegocio = 'moderno' | 'elegante' | 'vibrante';
type Dispositivo = 'movil' | 'tablet' | 'pc';

interface InteractionHintProps {
  onClick: () => void;
}

const InteractionHint: React.FC<InteractionHintProps> = ({ onClick }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="absolute inset-0 z-[60] flex items-center justify-center w-full h-full cursor-pointer transition-all duration-500 bg-black/5 hover:bg-black/10 backdrop-blur-[1px]"
    aria-label="Activar demostración"
  >
      <div className="px-5 py-2.5 bg-black/80 backdrop-blur-md border border-white/20 text-white rounded-full text-xs font-bold flex items-center gap-3 shadow-2xl animate-pulse pointer-events-none">
          <div className="relative flex items-center justify-center w-4 h-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8C42] opacity-75"></span>
              <Hand size={16} className="relative z-10 fill-white/20" />
          </div>
          <span className="tracking-wide shadow-black drop-shadow-md">Toca para interactuar</span>
      </div>
  </button>
);

export const DemoInteractiva = () => {
  const [temaActivo, setTemaActivo] = useState<TemaNegocio>('moderno');
  const [dispositivo, setDispositivo] = useState<Dispositivo>('pc');
  const [nombrePersonalizado, setNombrePersonalizado] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [interactuando, setInteractuando] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      if (isMobile) setDispositivo('movil');
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setInteractuando(false);
  }, [dispositivo, temaActivo]);

  // Datos Actualizados
  const dataActual = {
    nombreDefault: "Vanguardia Digital",
    eslogan: "Innovación a tu alcance",
    banner: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000&auto=format&fit=crop", 
    logo: "https://cdn-icons-png.flaticon.com/512/3067/3067269.png", 
    productos: [
      { 
        nombre: "Auriculares Noise Cancelling", 
        precio: "$250.000", 
        desc: "Auriculares inalámbricos con cancelación de ruido activa y batería de 40 horas.", 
        img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop" 
      },
      { 
        nombre: "Smartwatch Deportivo", 
        precio: "$350.000", 
        desc: "Reloj inteligente con monitor de ritmo cardíaco, GPS y resistencia al agua.", 
        img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop" 
      },
      { 
        nombre: "Teclado Mecánico RGB", 
        precio: "$180.000", 
        desc: "Teclado mecánico switches rojos, retroiluminación RGB personalizable.", 
        img: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1000&auto=format&fit=crop" 
      },
      {
        nombre: "Ratón Inalámbrico Gamer",
        precio: "$120.000",
        desc: "Ratón ergonómico ultraligero con sensor óptico de alta precisión.", 
        img: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=1000&auto=format&fit=crop"
      }
    ]
  };

  // Estilos de Tema
  const temas = {
    moderno: { 
        bg: '#F8FAFC', text: '#0F172A', primary: '#2563EB', secondary: '#38BDF8', 
        fontTitle: 'Inter', fontBody: 'Inter',
        cardBg: '#FFFFFF', shadow: 'rgba(37, 99, 235, 0.1)'
    },
    mercado: { 
        bg: '#F5F5F5', text: '#333333', primary: '#3483FA', secondary: '#FFE600', 
        fontTitle: 'Inter', fontBody: 'Inter',
        cardBg: '#FFFFFF', shadow: 'rgba(52, 131, 250, 0.1)'
    },
    vibrante: { 
        bg: '#F0FDF4', text: '#14532D', primary: '#16A34A', secondary: '#Facc15', 
        fontTitle: 'Inter', fontBody: 'Inter',
        cardBg: '#FFFFFF', shadow: 'rgba(22, 163, 74, 0.1)'
    }
  };

  const temaActual = temas[temaActivo];
  const nombreTienda = nombrePersonalizado || dataActual.nombreDefault;
  const urlSlug = nombreTienda.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // --- Marcos de Dispositivo Ultra-Realistas (v2) ---
  
  const DeviceFrame = ({ children }: { children?: React.ReactNode }) => {
     
     // MÓVIL (Titanium Finish)
     if (dispositivo === 'movil') {
         return (
            <div className="relative mx-auto transition-all duration-500 transform hover:scale-[1.02]">
                {/* Chasis Externo */}
                <div className="relative h-[600px] w-[300px] bg-[#1c1c1e] rounded-[3.5rem] shadow-[0_0_0_4px_#444,0_25px_50px_-12px_rgba(0,0,0,0.5)] border-[6px] border-[#333] z-10 overflow-hidden ring-1 ring-white/10">
                    {/* Reflejo Metálico Borde */}
                    <div className="absolute inset-0 rounded-[3rem] border-[2px] border-white/5 pointer-events-none z-50"></div>

                    {/* Botones Físicos */}
                    <div className="absolute -left-[9px] top-24 w-[4px] h-8 bg-[#2a2a2a] rounded-l-md shadow-sm border-r border-white/10"></div> 
                    <div className="absolute -left-[9px] top-36 w-[4px] h-14 bg-[#2a2a2a] rounded-l-md shadow-sm border-r border-white/10"></div> 
                    <div className="absolute -left-[9px] top-52 w-[4px] h-14 bg-[#2a2a2a] rounded-l-md shadow-sm border-r border-white/10"></div> 
                    <div className="absolute -right-[9px] top-40 w-[4px] h-20 bg-[#2a2a2a] rounded-r-md shadow-sm border-l border-white/10"></div> 

                    {/* Pantalla Interna */}
                    <div className="relative w-full h-full bg-black rounded-[3rem] overflow-hidden border-[6px] border-black">
                        {/* Dynamic Island */}
                        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 h-[28px] w-[96px] bg-black rounded-full z-50 flex items-center justify-center gap-3 pointer-events-none shadow-sm">
                            <div className="w-3 h-3 rounded-full bg-[#0a0a0a] shadow-[inset_0_0_3px_rgba(255,255,255,0.1)]"></div> {/* Camara */}
                        </div>
                        
                        {/* Barra Estado */}
                        <div className="absolute top-1 left-0 w-full px-7 pt-2 flex justify-between text-white text-[10px] font-bold z-40 mix-blend-difference opacity-80">
                            <span>11:11</span>
                            <div className="flex gap-1">
                                <Signal size={10} fill="currentColor"/>
                                <Wifi size={10} />
                                <Battery size={10} fill="currentColor"/>
                            </div>
                        </div>

                        {/* Contenido */}
                        <div className="h-full w-full overflow-hidden bg-white pt-12 relative group">
                           {!interactuando && <InteractionHint onClick={() => setInteractuando(true)} />}
                           <div className={`w-full h-full ${!interactuando ? 'pointer-events-none' : ''}`}>
                              {children}
                           </div>
                        </div>

                        {/* Home Bar */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/80 rounded-full z-50 backdrop-blur-md shadow-sm"></div>
                    </div>
                </div>
            </div>
         )
     }

     // TABLET (Aluminium Unibody)
     if (dispositivo === 'tablet') {
         return (
             <div className="relative mx-auto transition-all duration-500">
                 {/* Chasis */}
                 <div className="relative h-[550px] w-[800px] bg-[#d1d5db] dark:bg-[#374151] rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] p-[2px] ring-1 ring-black/5">
                     {/* Borde Interno Negro (Bezel) */}
                     <div className="h-full w-full bg-black rounded-[22px] p-[12px] relative">
                         {/* Cámara Frontal en Bezel */}
                         <div className="absolute top-1/2 -left-[2px] -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#222] ring-1 ring-white/10 z-20"></div>

                         {/* Pantalla */}
                         <div className="relative w-full h-full bg-white rounded-[14px] overflow-hidden shadow-inner group">
                            {!interactuando && <InteractionHint onClick={() => setInteractuando(true)} />}
                            <div className={`w-full h-full ${!interactuando ? 'pointer-events-none' : ''}`}>
                                {children}
                            </div>
                         </div>
                     </div>

                     {/* Botón Power (Top Right) */}
                     <div className="absolute -top-[2px] right-10 w-12 h-[3px] bg-[#9ca3af] dark:bg-[#4b5563] rounded-t-sm"></div>
                     {/* Botones Volumen (Right Side) */}
                     <div className="absolute top-16 -right-[2px] w-[3px] h-20 bg-[#9ca3af] dark:bg-[#4b5563] rounded-r-sm flex flex-col gap-1 py-2 justify-center">
                        <div className="w-full h-8 bg-black/10"></div>
                        <div className="w-full h-8 bg-black/10"></div>
                     </div>
                 </div>
             </div>
         )
     }

     // PC (Laptop Pro - No Notch, Dark Base)
     return (
         <div className="relative mx-auto perspective-[2000px] transition-all duration-500 group">
             {/* TAPA / PANTALLA - Ajustado padding bottom para el marco inferior */}
             <div className="relative mx-auto bg-[#1a1a1a] rounded-[18px] pt-[12px] px-[12px] pb-[36px] shadow-2xl flex flex-col items-center w-[850px] h-[520px] border border-[#333] ring-1 ring-white/5 z-20 transform-gpu transition-transform duration-500 group-hover:rotate-x-1">
                 
                 {/* Cámara en Bezel Superior (Sin Notch) */}
                 <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0f0f0f] ring-1 ring-white/10 shadow-sm z-30">
                     <div className="absolute top-[0.5px] left-[0.5px] w-0.5 h-0.5 bg-blue-900/50 rounded-full opacity-60"></div>
                 </div>

                 {/* Panel LCD */}
                 <div className="relative w-full h-full bg-black rounded-[6px] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border border-white/5">
                     
                     {/* Barra Browser (Estilo macOS Sonoma) */}
                     <div className="h-9 bg-[#f3f4f6] dark:bg-[#2a2a2b] border-b border-black/5 dark:border-white/5 flex items-center px-4 gap-4 w-full absolute top-0 left-0 z-[50] select-none backdrop-blur-xl">
                        <div className="flex gap-2 group/btns">
                           <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]/50 shadow-sm hover:brightness-90 transition-all"></div>
                           <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24]/50 shadow-sm hover:brightness-90 transition-all"></div>
                           <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29]/50 shadow-sm hover:brightness-90 transition-all"></div>
                        </div>
                        <div className="flex gap-3 text-gray-400">
                           <ChevronLeft size={14} />
                           <ChevronRight size={14} />
                        </div>
                        <div className="flex-1 flex justify-center px-4">
                           <div className="bg-white dark:bg-[#1a1a1a] rounded-[6px] px-3 py-1 text-xs text-center flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)] w-full max-w-md text-gray-600 dark:text-gray-400 transition-all ring-1 ring-black/5 dark:ring-white/10 group-hover/url:shadow-md">
                              <Lock size={10} className="text-green-600 dark:text-green-500 fill-current"/>
                              <span className="truncate select-text selection:bg-blue-100 dark:selection:bg-blue-900">mercadoliebre.app/{urlSlug}</span>
                              <RefreshCw size={10} className="ml-auto opacity-50 hover:opacity-100 cursor-pointer"/>
                           </div>
                        </div>
                     </div>
                     
                     {/* Contenido Web */}
                     <div className="h-full w-full pt-9 overflow-hidden bg-white relative group">
                        {!interactuando && <InteractionHint onClick={() => setInteractuando(true)} />}
                        <div className={`w-full h-full ${!interactuando ? 'pointer-events-none' : ''}`}>
                           {children}
                        </div>
                     </div>
                 </div>
                 
                 {/* Logo Marca en Bezel Inferior */}
                 <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 text-[11px] font-bold text-white/30 tracking-widest pointer-events-none">MacBook Pro</div>
             </div>

             {/* BASE / TECLADO (High Contrast) */}
             {/* Diseño unibody con gradiente fuerte para visibilidad */}
             <div className="relative mx-auto -mt-1 h-[16px] w-[920px] z-30">
                 <div className="w-full h-full rounded-b-[16px] bg-gradient-to-b from-[#3f3f46] to-[#27272a] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] border-t border-black/40 relative">
                    
                    {/* Hendidura para abrir (Groove) */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-[6px] bg-[#18181b] rounded-b-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border-b border-white/5"></div>

                    {/* Patas de Goma */}
                    <div className="absolute bottom-1 left-6 w-8 h-1.5 bg-[#18181b] rounded-full shadow-sm"></div>
                    <div className="absolute bottom-1 right-6 w-8 h-1.5 bg-[#18181b] rounded-full shadow-sm"></div>
                 </div>
             </div>
         </div>
     )
  }

  return (
    <div className="mt-24 w-full max-w-[1400px] mx-auto px-4 mb-20">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div className="text-center mb-12 animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface text-sm text-primary font-bold mb-4 border border-border shadow-sm">
           <Sparkles size={16} /> Pruébalo tú mismo
        </div>
        <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 text-text-main">Diseña tu Futuro Digital</h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          Interactúa con el simulador. Cambia el estilo, edita el nombre y mira cómo se adapta a dispositivos reales.
        </p>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap justify-center gap-6 mb-16 animate-fadeIn relative z-20">
        
        {/* Input Nombre */}
        <div className="bg-bg border border-border p-2 rounded-xl flex items-center gap-2 px-4 w-full md:w-auto shadow-sm hover:shadow-md transition-shadow">
            <Edit3 size={16} className="text-text-muted" />
            <input 
               type="text" 
               placeholder="Nombre de tu tienda..." 
               value={nombrePersonalizado}
               onChange={(e) => setNombrePersonalizado(e.target.value)}
               className="bg-transparent outline-none text-sm font-bold text-text-main placeholder-text-muted w-full md:w-48"
               maxLength={25}
            />
        </div>

        {/* Selector Tema */}
        <div className="neumorphic p-1.5 rounded-xl flex gap-1 bg-surface shadow-sm">
          {([['moderno', '#2563EB'], ['mercado', '#FFE600'], ['vibrante', '#16A34A']] as const).map(([key, color]) => (
            <button
              key={key}
              onClick={() => setTemaActivo(key as TemaNegocio)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${temaActivo === key ? 'bg-white/10 text-text-main border border-white/10 shadow-inner' : 'text-text-muted hover:text-text-main'}`}
            >
               <div className="w-3 h-3 rounded-full shadow-sm" style={{background: color}}></div>
               <span className="capitalize hidden sm:inline">{key}</span>
            </button>
          ))}
        </div>

        {/* Selector Dispositivo */}
        {!isMobileView && (
            <div className="neumorphic p-1.5 rounded-xl flex gap-1 bg-surface shadow-sm">
            <button onClick={() => setDispositivo('movil')} className={`p-2 rounded-lg transition-all ${dispositivo === 'movil' ? 'text-primary bg-primary/10 shadow-inner' : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'}`} title="Móvil"><Smartphone size={20}/></button>
            <button onClick={() => setDispositivo('tablet')} className={`p-2 rounded-lg transition-all ${dispositivo === 'tablet' ? 'text-primary bg-primary/10 shadow-inner' : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'}`} title="Tablet"><Tablet size={20}/></button>
            <button onClick={() => setDispositivo('pc')} className={`p-2 rounded-lg transition-all ${dispositivo === 'pc' ? 'text-primary bg-primary/10 shadow-inner' : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'}`} title="Escritorio"><Monitor size={20}/></button>
            </div>
        )}
      </div>

      {/* PREVIEW AREA */}
      <div className="flex justify-center items-start pb-10 overflow-visible">
        <DeviceFrame>
           {/* --- CONTENIDO INTERNO DEL SITIO WEB --- */}
           <div 
              className="w-full h-full overflow-y-auto overflow-x-hidden relative transition-colors duration-300 scroll-smooth no-scrollbar"
              style={{
                 backgroundColor: temaActual.bg,
                 color: temaActual.text,
                 fontFamily: temaActual.fontBody
              }}
           >
              {/* Navbar Simulated */}
              <nav 
                 className={`sticky top-0 z-40 backdrop-blur-md border-b flex items-center justify-between px-4 transition-all ${dispositivo === 'movil' ? 'h-16' : 'h-16'}`}
                 style={{
                     borderColor: `${temaActual.primary}20`, 
                     background: temaActivo === 'mercado' ? '#FFE600' : 'rgba(255, 255, 255, 0.9)'
                 }}
              >
                 <div className="flex items-center gap-2 font-bold truncate max-w-[60%]" style={{fontFamily: temaActual.fontTitle, fontSize: dispositivo === 'pc' ? '1.2rem' : '1rem'}}>
                    <span>{nombreTienda}</span>
                 </div>
                 <div className="flex items-center gap-3">
                    {dispositivo === 'pc' && (
                       <div className="hidden md:flex gap-4 text-xs font-medium opacity-60">
                          <span className="hover:text-primary cursor-pointer">Catálogo</span>
                          <span className="hover:text-primary cursor-pointer">Ubicación</span>
                          <span className="hover:text-primary cursor-pointer">Contacto</span>
                       </div>
                    )}
                    <div className="relative p-2 rounded-full hover:bg-black/5 cursor-pointer transition-colors">
                       <ShoppingCart size={dispositivo === 'movil' ? 18 : 20} />
                       <span className="absolute top-0 right-0 w-2 h-2 rounded-full" style={{background: temaActual.primary}}></span>
                    </div>
                    {dispositivo === 'movil' && <Menu size={20} className="cursor-pointer" />}
                 </div>
              </nav>

              {/* Hero Section */}
              <header className={`relative m-3 rounded-2xl overflow-hidden shadow-md group ${dispositivo === 'movil' ? 'h-48' : 'h-64 md:h-80'}`}>
                 <img src={dataActual.banner} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 filter brightness-[0.8]" alt="Interior Tienda" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                 
                 <div className={`absolute bottom-0 left-0 p-4 text-white w-full flex items-end gap-3 ${dispositivo === 'pc' ? 'md:p-8' : ''}`}>
                    <div className={`rounded-full border-4 border-white/20 bg-white shadow-xl overflow-hidden flex-shrink-0 ${dispositivo === 'movil' ? 'w-16 h-16' : 'w-24 h-24'}`}>
                        <img 
                            src={dataActual.logo} 
                            className="w-full h-full object-cover" 
                            alt="Logo Abuela" 
                        />
                    </div>
                    <div className="mb-1">
                       <h1 className="font-bold leading-none drop-shadow-md mb-1" style={{fontFamily: temaActual.fontTitle, fontSize: dispositivo === 'movil' ? '1.2rem' : '2rem'}}>
                           {nombreTienda}
                       </h1>
                       <p className="opacity-90 drop-shadow-sm font-medium text-white/90" style={{fontSize: dispositivo === 'movil' ? '0.7rem' : '1rem'}}>
                           {dataActual.eslogan}
                       </p>
                    </div>
                 </div>
              </header>

              {/* Info Chips */}
              <div className="px-4 mb-6 flex gap-2 justify-center">
                  <div className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-bold flex items-center gap-1" style={{color: temaActual.text}}>
                      <Clock size={10} /> Abierto ahora
                  </div>
                  <div className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-bold flex items-center gap-1" style={{color: temaActual.text}}>
                      <MapPin size={10} /> Colombia
                  </div>
                  <div className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-bold flex items-center gap-1" style={{color: temaActual.text}}>
                      <Star size={10} fill="currentColor" className="text-yellow-500" /> 4.9
                  </div>
              </div>

              {/* Categorías */}
              <div className={`px-4 mb-6 ${dispositivo === 'pc' ? 'max-w-4xl mx-auto' : ''}`}>
                 <div className="flex items-center gap-2 mb-4">
                    <div className="h-6 w-1 rounded-full" style={{background: temaActual.primary}}></div>
                    <h3 className="text-xl font-bold" style={{fontFamily: temaActual.fontTitle}}>Catálogo</h3>
                 </div>
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                    {['Destacados', 'Electrónica', 'Periféricos', 'Audio', 'Sillas'].map((cat, i) => (
                        <span 
                        key={i} 
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer ${i === 0 ? 'text-white shadow-md' : 'opacity-70 hover:opacity-100'}`}
                        style={{
                            background: i === 0 ? temaActual.primary : 'transparent',
                            borderColor: i === 0 ? 'transparent' : `${temaActual.primary}40`,
                            color: i === 0 ? '#fff' : temaActual.text
                        }}
                        >
                        {cat}
                        </span>
                    ))}
                 </div>
              </div>

              {/* Grid de Productos */}
              <div className={`px-4 pb-20 grid gap-4 ${dispositivo === 'pc' ? 'grid-cols-2 max-w-3xl mx-auto' : dispositivo === 'tablet' ? 'grid-cols-2 px-8' : 'grid-cols-1'}`}>
                 {dataActual.productos.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="rounded-2xl p-3 shadow-sm border hover:-translate-y-1 transition-transform duration-300 flex flex-col h-full relative overflow-hidden group bg-opacity-60 backdrop-blur-sm hover:shadow-md"
                      style={{
                         background: temaActual.cardBg,
                         borderColor: `${temaActual.primary}15`,
                      }}
                    >
                       <div className={`rounded-xl overflow-hidden mb-3 relative shadow-inner ${dispositivo === 'pc' ? 'h-48' : 'h-32'}`}>
                          <img src={item.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.nombre} />
                          <span className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-white/90 text-black text-xs font-bold shadow-sm backdrop-blur-md">
                             {item.precio}
                          </span>
                       </div>
                       
                       <h3 className="font-bold mb-1 leading-tight" style={{fontFamily: temaActual.fontTitle, fontSize: dispositivo === 'pc' ? '1rem' : '0.9rem'}}>{item.nombre}</h3>
                       <p className="opacity-70 leading-relaxed mb-3 flex-1 line-clamp-2 text-xs" style={{fontSize: '0.75rem'}}>{item.desc}</p>
                       
                       <button 
                         className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1 mt-auto shadow-md hover:brightness-110 transition-all active:scale-95"
                         style={{background: `linear-gradient(135deg, ${temaActual.primary}, ${temaActual.secondary})`}}
                       >
                          <Plus size={14} /> Añadir al pedido
                       </button>
                    </div>
                 ))}
              </div>

           </div>
        </DeviceFrame>
      </div>
    </div>
  );
};