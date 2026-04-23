
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle, Boton, Logo } from '../componentes/ui';
import { Menu, X, LogIn, Zap, Palette, Smartphone, Sparkles, MessageCircle, QrCode, RefreshCw, MousePointerClick, ArrowRight, ShoppingBag } from 'lucide-react';
import { SeccionHero } from '../componentes/landing/SeccionHero';
import { SeccionPrecios } from '../componentes/landing/SeccionPrecios';
import { SeccionPortafolio } from '../componentes/landing/SeccionPortafolio';
import { SEO } from '../componentes/sistema-diseno/SEO';

// --- DATA ---
const TITULARES = [
  { principal: "Tu Catálogo Digital.", destacado: "En 10 minutos." },
  { principal: "Vende Más.", destacado: "Sin Comisiones." },
  { principal: "Adiós PDF Borroso.", destacado: "Hola Web Real." },
  { principal: "Tu Tienda.", destacado: "Ahora con IA." },
  { principal: "Diseño que antoja.", destacado: "Tecnología que vende." },
  { principal: "Pedidos directos.", destacado: "A tu WhatsApp." },
  { principal: "La Web de tu Marca.", destacado: "Sin programar." },
  { principal: "Catálogo Inteligente.", destacado: "Ventas Reales." },
  { principal: "Digitaliza tu Oferta.", destacado: "Sin estrés." },
  { principal: "Tu Catálogo Online.", destacado: "Siempre actualizado." },
  { principal: "Atrae más clientes.", destacado: "Fideliza con diseño." },
  { principal: "¿Bloqueo creativo?", destacado: "La IA escribe por ti." },
  { principal: "Códigos QR.", destacado: "Que sí funcionan." },
  { principal: "El fin del papel.", destacado: "El inicio de tus ventas." },
  { principal: "Experiencia Premium.", destacado: "Precio accesible." },
  { principal: "Tu Cocina es Arte.", destacado: "Tu Web también." },
  { principal: "Más que un catálogo.", destacado: "Una experiencia." },
  { principal: "Optimizado para Móvil.", destacado: "Diseñado para Vender." },
  { principal: "Haz que vuelvan.", destacado: "Con una web inolvidable." },
  { principal: "Tu identidad.", destacado: "Elevada al máximo." },
  { principal: "Sin intermediarios.", destacado: "Tú tienes el control." },
  { principal: "Gastronomía Digital.", destacado: "Al siguiente nivel." },
  { principal: "Del plato a la web.", destacado: "En segundos." },
  { principal: "Catálogos interactivos.", destacado: "Clientes felices." },
  { principal: "Moderniza tu negocio.", destacado: "Hoy mismo." },
  { principal: "Simplemente.", destacado: "Irresistible." },
  { principal: "Tu vitrina digital.", destacado: "Abierta 24/7." },
  { principal: "Seduce visualmente.", destacado: "Convence al instante." },
  { principal: "Innovación.", destacado: "Al servicio de tu mesa." },
  { principal: "Mercado Liebre.", destacado: "El socio de tu cocina." }
];

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-surface p-8 rounded-2xl hover:shadow-xl transition-all duration-300 group h-full flex flex-col border border-border">
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-primary/10 text-primary group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-black mb-3 text-text-main font-sans tracking-tight">{title}</h3>
    <p className="text-text-muted leading-relaxed text-sm flex-1 font-medium">{desc}</p>
  </div>
);

export default function PaginaInicio() {
  const [menuMovilAbierto, setCatalogoMovilAbierto] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [titularActual, setTitularActual] = useState(TITULARES[0]);
  const navigate = useNavigate();

  useEffect(() => {
    setTitularActual(TITULARES[Math.floor(Math.random() * TITULARES.length)]);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setCatalogoMovilAbierto(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg font-sans text-text-main selection:bg-primary/30 transition-colors duration-300 overflow-x-hidden">
      <SEO 
        titulo="Mercado Liebre - Constructor de Catálogos Digitales con IA"
        descripcion="Crea un sitio web profesional para tu tienda en minutos. Diseño neumórfico, integración con WhatsApp y descripciones generadas por IA."
      />

      {/* NAVBAR SÓLIDO (Mercado Libre Style) */}
      <nav className="fixed top-0 w-full z-50 bg-[#FFE600] dark:bg-surface border-b border-black/10 dark:border-white/5 shadow-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 font-sans text-2xl font-black cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="group-hover:scale-110 transition-transform duration-300">
              <Logo size={46} />
            </div>
            <span className="text-[#2D3277] dark:text-meli-yellow group-hover:opacity-80 transition-opacity tracking-tight">Mercado <span className="font-light">Liebre</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-[#2D3277] dark:text-text-muted">
            <div className="flex gap-8 mr-4">
              <a href="#caracteristicas" onClick={(e) => scrollToSection(e, 'caracteristicas')} className="hover:opacity-70 transition-opacity py-2 cursor-pointer">Soluciones</a>
              <a href="#precios" onClick={(e) => scrollToSection(e, 'precios')} className="hover:opacity-70 transition-opacity py-2 cursor-pointer">Precios</a>
              <a href="#ejemplos" onClick={(e) => scrollToSection(e, 'ejemplos')} className="hover:opacity-70 transition-opacity py-2 cursor-pointer">Portafolio</a>
            </div>
            
            <div className="flex items-center gap-4">
                <Boton onClick={() => navigate('/auth')} variante="secundario" className="w-32 text-sm border-none bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 shadow-none">
                  Acceder
                </Boton>
                <Boton onClick={() => navigate('/auth?mode=register')} variante="primario" className="w-40 text-sm shadow-lg hover:brightness-110">
                  Empezar Gratis
                </Boton>
            </div>
            
            <div className="pl-4 border-l border-black/10 dark:border-white/10 h-8 flex items-center">
              <ThemeToggle />
            </div>
          </div>

          <div className="md:hidden flex items-center gap-4">
             <ThemeToggle />
             <button className="p-2 text-text-muted hover:text-primary transition-colors" onClick={() => setCatalogoMovilAbierto(!menuMovilAbierto)}>{menuMovilAbierto ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
        {menuMovilAbierto && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-bg border-b border-white/5 shadow-2xl flex flex-col p-6 gap-4 animate-fadeIn z-40">
             <a href="#caracteristicas" onClick={(e) => scrollToSection(e, 'caracteristicas')} className="p-3 font-bold text-text-muted hover:text-text-main hover:bg-white/5 rounded-xl">Soluciones</a>
             <a href="#precios" onClick={(e) => scrollToSection(e, 'precios')} className="p-3 font-bold text-text-muted hover:text-text-main hover:bg-white/5 rounded-xl">Precios</a>
             <a href="#ejemplos" onClick={(e) => scrollToSection(e, 'ejemplos')} className="p-3 font-bold text-text-muted hover:text-text-main hover:bg-white/5 rounded-xl">Portafolio</a>
             <Boton onClick={() => navigate('/auth')} variante="secundario" className="w-full justify-center gap-2"><LogIn size={18} /> Iniciar Sesión</Boton>
             <Boton onClick={() => navigate('/auth?mode=register')} variante="primario" className="w-full justify-center">Comenzar Gratis</Boton>
          </div>
        )}
      </nav>

      <SeccionHero titular={titularActual} isMobile={isMobile} scrollToSection={scrollToSection} />

      <section id="caracteristicas" className="py-20 md:py-28 relative border-t border-white/5 bg-surface/30 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-xs font-bold text-primary mb-6">
                <MousePointerClick size={14} />
                <span>¿Por qué Mercado Liebre?</span>
             </div>
             <h2 className="text-3xl md:text-5xl font-black mb-6 text-text-main leading-tight tracking-tight">Innovación Real.<br/>Ventas Garantizadas.</h2>
             <p className="text-text-muted text-lg font-medium">
                Dejamos atrás lo convencional. Creamos una plataforma digital diseñada para que tu negocio crezca hoy mismo.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Palette size={28} />} 
              title="Diseño Profesional" 
              desc="Diferénciate de la competencia con interfaces limpias y modernas. Un diseño visual pulido que genera confianza instantánea en tus clientes." 
            />
            <FeatureCard 
              icon={<Sparkles size={28} />} 
              title="Chef Digital con IA" 
              desc="¿Bloqueo creativo? Nuestra IA redacta descripciones irresistibles y persuasivas para tus platos en segundos. Vende con palabras." 
            />
            <FeatureCard 
              icon={<MessageCircle size={28} />} 
              title="Pedidos vía WhatsApp" 
              desc="Sin comisiones ocultas. Tus clientes arman el carrito y te envían el pedido directo a tu WhatsApp listo para preparar. Simple y directo." 
            />
            <FeatureCard 
              icon={<QrCode size={28} />} 
              title="QR Inteligente" 
              desc="Genera códigos QR estilizados que funcionan incluso si pones tu logo en el centro. Acceso instantáneo sin descargar aplicaciones." 
            />
            <FeatureCard 
              icon={<RefreshCw size={28} />} 
              title="Control en Tiempo Real" 
              desc="¿Se acabó el especial? Oculta platos, cambia precios o actualiza horarios desde tu celular al instante. Tu catálogo siempre al día." 
            />
            <FeatureCard 
              icon={<Zap size={28} />} 
              title="Velocidad Extrema" 
              desc="Optimizado para cargar en milisegundos, incluso con datos móviles. No pierdas clientes esperando a que descargue un PDF pesado." 
            />
          </div>
        </div>
      </section>

      <section className="py-32 bg-secondary dark:bg-surface relative overflow-hidden border-b border-border">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
         <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-black text-accent dark:text-primary mb-8 leading-tight font-sans tracking-tighter italic">
               Tus clientes <span className="text-red-600 decoration-8 underline decoration-wavy decoration-red-600/20">odian</span> descargar PDFs.
            </h2>
            <p className="text-xl md:text-2xl text-text-main dark:text-text-muted leading-relaxed max-w-3xl mx-auto font-bold uppercase tracking-tight">
               Hacer zoom, perder la señal, descargar archivos pesados... es la forma más rápida de perder una venta.
               <br/><br/>
               <span className="text-primary font-black">MERCADO LIEBRE</span> TRANSFORMA ESE ARCHIVO ESTÁTICO EN UNA EXPERIENCIA WEB FLUIDA, RÁPIDA Y DISEÑADA PARA VENDER.
            </p>
         </div>
      </section>

      <SeccionPrecios />

      <SeccionPortafolio />

      <footer className="border-t border-border bg-surface py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="flex items-center gap-3 font-sans text-xl font-black text-text-main justify-center md:justify-start">
            <Logo size={40} />
            <span className="text-accent dark:text-primary">Mercado <span className="font-light">Liebre</span></span>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm font-bold text-text-muted">
            <a href="#caracteristicas" onClick={(e) => scrollToSection(e, 'caracteristicas')} className="hover:text-primary transition-colors cursor-pointer">Soluciones</a>
            <a href="#precios" onClick={(e) => scrollToSection(e, 'precios')} className="hover:text-primary transition-colors cursor-pointer">Precios</a>
            <Link to="/dinamica" className="hover:text-primary transition-colors text-primary">Dinámica</Link>
            <Link to="/terminos" className="hover:text-primary transition-colors">Términos</Link>
            <Link to="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link>
          </nav>
          <span className="text-xs text-text-muted/70 font-medium">© 2025 Mercado Liebre Inc.</span>
        </div>
      </footer>
    </div>
  );
}