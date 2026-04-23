
import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, Database, Globe, Shield, FileCheck } from 'lucide-react';
import { ThemeToggle, Logo } from '../componentes/ui';

export default function PaginaPrivacidad() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl neumorphic mb-6 text-secondary">
            <Lock size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 text-text-main">Política de Tratamiento de Datos</h1>
          <p className="text-text-muted text-lg">Cumplimiento Ley 1581 de 2012 (Habeas Data)</p>
        </header>

        <div className="space-y-12 text-text-main/90 leading-relaxed text-justify">
          <section className="neumorphic p-8 md:p-10 border border-white/5">
             <h2 className="text-2xl font-bold mb-4 text-secondary flex items-center gap-2">
                <Shield size={24} /> 1. Responsable del Tratamiento
             </h2>
             <p className="mb-4">
                <strong>Mercado Liebre Inc.</strong>, bajo la dirección de Leonardo Cerón, actúa como Responsable del Tratamiento de los datos personales recolectados a través de esta plataforma web, en cumplimiento de la Constitución Política de Colombia, la Ley 1581 de 2012 y sus decretos reglamentarios.
             </p>
          </section>

          <section className="neumorphic p-8 md:p-10 border border-white/5">
            <h2 className="text-2xl font-bold mb-4 text-secondary flex items-center gap-2">
              <FileCheck size={24} /> 2. Derechos de los Titulares (ARCO)
            </h2>
            <p className="mb-4">
              Como titular de los datos, usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-muted">
              <li><strong>Acceso:</strong> Conocer qué datos suyos estamos tratando de forma gratuita.</li>
              <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos, incompletos o fraccionados.</li>
              <li><strong>Cancelación (Supresión):</strong> Solicitar la eliminación de sus datos cuando no exista un deber legal o contractual de conservarlos.</li>
              <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos para fines específicos (ej. marketing).</li>
              <li><strong>Revocación:</strong> Revocar el consentimiento otorgado para el tratamiento.</li>
            </ul>
          </section>

          <section className="neumorphic p-8 md:p-10 border border-white/5">
            <h2 className="text-2xl font-bold mb-4 text-secondary flex items-center gap-2">
              <Database size={24} /> 3. Datos Recolectados y Finalidad
            </h2>
            <p className="mb-4">Recolectamos la siguiente información con las finalidades descritas:</p>
            <ul className="list-disc pl-6 space-y-3 text-text-muted">
              <li><strong>Datos de Registro (Tiendas):</strong> Nombre, Email, Teléfono, Dirección. <em>Finalidad:</em> Prestación del servicio SaaS, facturación y soporte técnico.</li>
              <li><strong>Datos de Clientes Finales (Pedidos):</strong> Nombre, Dirección de entrega, Teléfono. <em>Finalidad:</em> Estos datos se procesan localmente en el dispositivo del usuario para generar el mensaje de WhatsApp y no se almacenan en nuestros servidores centrales permanentemente.</li>
              <li><strong>Cookies y Navegación:</strong> Dirección IP, tipo de navegador. <em>Finalidad:</em> Analítica web, seguridad y mejora de experiencia (Google Analytics, Supabase).</li>
            </ul>
          </section>

          <section className="neumorphic p-8 md:p-10 border border-white/5">
            <h2 className="text-2xl font-bold mb-4 text-secondary flex items-center gap-2">
              <Globe size={24} /> 4. Transferencia Internacional
            </h2>
            <p>
              Para la prestación del servicio, utilizamos infraestructura de terceros confiables:
            </p>
            <ul className="list-disc pl-6 mt-2 text-text-muted text-sm">
                <li><strong>Supabase:</strong> Base de datos y Autenticación (Servidores en EE.UU./UE).</li>
                <li><strong>Cloudinary:</strong> Almacenamiento de imágenes.</li>
                <li><strong>Groq/Google Gemini:</strong> Procesamiento de Inteligencia Artificial.</li>
            </ul>
            <p className="mt-3">
                Al aceptar esta política, autoriza la transferencia de sus datos a estos países que cuentan con estándares de seguridad adecuados.
            </p>
          </section>

          <section className="neumorphic p-8 md:p-10 border border-white/5">
            <h2 className="text-2xl font-bold mb-4 text-secondary">5. Canales de Atención</h2>
            <p>
              Para ejercer sus derechos de Habeas Data, puede escribir al Oficial de Protección de Datos en:
            </p>
            <p className="mt-2 font-bold text-lg text-text-main">privacidad@mercadoliebre.app</p>
            <p className="text-sm text-text-muted mt-1">Asunto: Solicitud Habeas Data</p>
          </section>

          <section className="text-center pt-8 border-t border-white/10">
             <p className="text-xs text-text-muted">
                Esta política rige a partir del 15 de noviembre de 2025 y las bases de datos se mantendrán vigentes mientras subsista la relación contractual o el servicio.
             </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-surface py-8 text-center text-sm text-text-muted">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2025 Mercado Liebre Inc. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
