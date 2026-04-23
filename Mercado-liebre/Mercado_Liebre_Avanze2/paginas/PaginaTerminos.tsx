
import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Scale, AlertCircle, FileText, Book, CreditCard, Globe } from 'lucide-react';
import { ThemeToggle, Logo } from '../componentes/ui';

export default function PaginaTerminos() {
  return (
    <div className="min-h-screen bg-bg font-sans text-text-main transition-colors duration-300">
      <nav className="fixed top-0 w-full z-50 bg-bg/80 backdrop-blur-lg border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 font-serif text-2xl font-bold group">
            <div className="neumorphic p-2 rounded-lg text-primary group-hover:text-secondary transition-colors">
              <Logo size={36} />
            </div>
            <span className="text-text-main group-hover:text-primary transition-colors">Mercado Liebre</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/">
              <button className="neumorphic p-2 rounded-full text-text-muted hover:text-primary transition-colors">
                <ArrowLeft size={20} />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl neumorphic mb-6 text-primary">
            <Scale size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 text-text-main">Términos y Condiciones de Uso</h1>
          <p className="text-text-muted text-lg">Vigente desde: Noviembre 2025 | Colombia</p>
        </header>

        <div className="space-y-12 text-text-main/90 leading-relaxed text-justify">
          <section className="neumorphic p-8 md:p-10 border border-white/5">
            <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-2">
              <FileText size={24} /> 1. Introducción y Aceptación
            </h2>
            <p className="mb-4">
              Bienvenido a <strong>Mercado Liebre</strong>. Este documento constituye un acuerdo legal vinculante entre usted ("El Usuario" o "El Tienda") y Mercado Liebre Inc. ("La Plataforma", "Nosotros"), bajo la dirección de Leonardo Cerón.
            </p>
            <p>
              Al registrarse, acceder o utilizar nuestros servicios SaaS (Software as a Service), usted confirma que ha leído, entendido y aceptado estos términos en su totalidad. Si no está de acuerdo, debe abstenerse de utilizar la plataforma.
            </p>
          </section>

          <section className="neumorphic p-8 md:p-10 border border-white/5">
            <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-2">
               <Book size={24} /> 2. Marco Legal Aplicable
            </h2>
            <p className="mb-4">
               Estos términos se rigen por la legislación de la República de Colombia, específicamente:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-text-muted marker:text-primary">
               <li><strong>Ley 1480 de 2011 (Estatuto del Consumidor):</strong> Regula la calidad, idoneidad y seguridad de los servicios prestados, así como la responsabilidad por la información suministrada.</li>
               <li><strong>Ley 527 de 1999:</strong> Sobre comercio electrónico y mensajes de datos.</li>
               <li><strong>Código de Comercio y Código Civil Colombiano:</strong> Para la regulación de contratos comerciales y obligaciones.</li>
            </ul>
          </section>

          <section className="neumorphic p-8 md:p-10 border border-white/5">
            <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-2">
              <ShieldCheck size={24} /> 3. Descripción del Servicio y Responsabilidades
            </h2>
            <p className="mb-3">
              Mercado Liebre provee herramientas tecnológicas para la creación de catálogos digitales y sitios web para tiendas, incluyendo funcionalidades de Inteligencia Artificial (IA) para generación de textos.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-muted marker:text-primary">
              <li><strong>Responsabilidad del Contenido:</strong> El Usuario es el único responsable de la veracidad, exactitud y legalidad de la información (precios, caracteristicas, imágenes) publicada en su sitio web generado. Mercado Liebre actúa como mero intermediario tecnológico.</li>
              <li><strong>Disponibilidad:</strong> Nos esforzamos por mantener un uptime del 99.9%, pero no garantizamos que el servicio sea ininterrumpido o libre de errores.</li>
              <li><strong>Inteligencia Artificial:</strong> El contenido generado por IA (descripciones, eslóganes) es una sugerencia. El Usuario debe revisarlo antes de su publicación. Mercado Liebre no se hace responsable por alucinaciones o inexactitudes de la IA.</li>
            </ul>
          </section>

          <section className="neumorphic p-8 md:p-10 border border-white/5">
            <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-2">
              <AlertCircle size={24} /> 4. Derecho de Retracto y Cancelación
            </h2>
            <p className="mb-4">
              Conforme al <strong>Artículo 47 de la Ley 1480 de 2011</strong>, para los servicios de suscripción pagados adquiridos en línea:
            </p>
            <p className="mb-2">
              El Usuario tiene derecho a retractarse de la compra dentro de los cinco (5) días hábiles siguientes a la activación del plan, siempre y cuando no haya hecho uso sustancial del servicio (ej. publicar un sitio web y recibir pedidos). En tal caso, se reintegrará el dinero sin descuentos.
            </p>
            <p className="text-sm text-text-muted">
              Para cancelar una suscripción recurrente, debe hacerlo desde su panel de control al menos 24 horas antes del siguiente ciclo de facturación.
            </p>
          </section>

          <section className="neumorphic p-8 md:p-10 border border-white/5">
            <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-2">
               <CreditCard size={24} /> 5. Tarifas y Facturación
            </h2>
            <p className="mb-4">
              Las tarifas son expresadas en Pesos Colombianos (COP). Mercado Liebre se reserva el derecho de modificar las tarifas con un aviso previo de 30 días calendario. El impago de la suscripción resultará en la suspensión temporal del servicio y la invisibilidad del sitio web del tienda.
            </p>
          </section>

          <section className="neumorphic p-8 md:p-10 border border-white/5">
            <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-2">
               <Globe size={24} /> 6. Propiedad Intelectual
            </h2>
            <p>
              <strong>De la Plataforma:</strong> El código fuente, diseño neumórfico, logotipos (Smart Cloche) y algoritmos son propiedad exclusiva de Mercado Liebre Inc.
            </p>
            <p className="mt-2">
              <strong>Del Usuario:</strong> Usted conserva todos los derechos sobre las imágenes, marcas y textos que suba a la plataforma. Nos otorga una licencia mundial, no exclusiva y gratuita para alojar y mostrar dicho contenido con el fin de prestar el servicio.
            </p>
          </section>

          <section className="text-center pt-8 border-t border-white/10">
            <p className="text-text-muted mb-4">Para notificaciones legales o PQRS:</p>
            <a href="mailto:legal@mercadoliebre.app" className="text-primary hover:text-secondary font-bold transition-colors">
              legal@mercadoliebre.app
            </a>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-surface py-8 text-center text-sm text-text-muted">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2025 Mercado Liebre Inc. Todos los derechos reservados. Colombia.</p>
        </div>
      </footer>
    </div>
  );
}
