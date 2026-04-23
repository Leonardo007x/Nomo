/**
 * Descripción: Configuración principal de enrutamiento y proveedores de contexto de la aplicación.
 */
import React, { Suspense, lazy } from 'react';
// @ts-ignore
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { ProveedorAutenticacion } from './contexto/ContextoAutenticacion';
import { ProveedorTema } from './contexto/ContextoTema';
import { RutaPrivada, RutaAuth } from './componentes/rutas/RutasProtegidas';
import { Logo } from './componentes/ui';
import { TransicionPagina } from './componentes/sistema-diseno/TransicionPagina';

// --- LAZY LOADING (Carga Diferida) ---
const PaginaInicio = lazy(() => import('./paginas/PaginaInicio'));
const PaginaAutenticacion = lazy(() => import('./paginas/PaginaAutenticacion'));
const PanelControl = lazy(() => import('./paginas/PanelControl'));
const VistaPublica = lazy(() => import('./paginas/VistaPublica'));
const PaginaTerminos = lazy(() => import('./paginas/PaginaTerminos'));
const PaginaPrivacidad = lazy(() => import('./paginas/PaginaPrivacidad'));
const PaginaDinamica = lazy(() => import('./paginas/PaginaDinamica'));
const Pagina404 = lazy(() => import('./paginas/Pagina404'));

// Componente de carga
const PantallaCarga = () => (
  <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 animate-fadeIn">
    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/30 animate-bounce">
      <Logo size={40} />
    </div>
    <div className="flex flex-col items-center gap-2">
      <div className="h-1.5 w-32 bg-surface rounded-full overflow-hidden">
        <div className="h-full bg-primary w-1/2 animate-[shimmer_1s_infinite_linear] rounded-full"></div>
      </div>
      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Cargando Mercado Liebre...</span>
    </div>
  </div>
);

// Componente interno para manejar la ubicación y las animaciones
const ContenidoAnimado = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<TransicionPagina><PaginaInicio /></TransicionPagina>} />
        <Route path="/auth" element={<RutaAuth><TransicionPagina><PaginaAutenticacion /></TransicionPagina></RutaAuth>} />
        <Route path="/panel" element={<RutaPrivada><TransicionPagina><PanelControl /></TransicionPagina></RutaPrivada>} />
        <Route path="/tienda/:id" element={<TransicionPagina><VistaPublica /></TransicionPagina>} />
        <Route path="/terminos" element={<TransicionPagina><PaginaTerminos /></TransicionPagina>} />
        <Route path="/privacidad" element={<TransicionPagina><PaginaPrivacidad /></TransicionPagina>} />
        <Route path="/dinamica" element={<TransicionPagina><PaginaDinamica /></TransicionPagina>} />
        <Route path="*" element={<Pagina404 />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <ProveedorAutenticacion>
        <ProveedorTema>
          <Router>
            <Suspense fallback={<PantallaCarga />}>
              <ContenidoAnimado />
            </Suspense>
          </Router>
        </ProveedorTema>
      </ProveedorAutenticacion>
    </HelmetProvider>
  );
}