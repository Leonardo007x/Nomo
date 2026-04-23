/**
 * Descripción: Punto de entrada principal que renderiza la aplicación React en el DOM.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Verificación del elemento raíz en el HTML
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("No se encontró el elemento root");
}

// Inicialización y renderizado estricto
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);