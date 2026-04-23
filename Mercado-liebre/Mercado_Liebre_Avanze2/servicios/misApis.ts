
import { Producto } from '../tipos/modelos';

// --- API PROPIA 1: SERVICIO DE ANALÍTICA DE NEGOCIO ---
// (Deshabilitada temporalmente por solicitud)
export const apiAnalitica = {
  obtenerMetricasGenerales: async (productos: Producto[]) => {
    return null;
  },
  calcularSaludDelCatalogo: async (productos: Producto[]) => {
    return null;
  }
};

// --- API PROPIA 2: MOTOR DE MARKETING Y RECOMENDACIONES ---
// (Deshabilitada temporalmente por solicitud)
export const apiMarketing = {
  generarComboSugerido: async (productos: Producto[]) => {
    return null;
  },
  obtenerProductoEstrella: async (productos: Producto[]) => {
    return null;
  }
};

// --- API PROPIA 3: SERVICIO DE SALUDO DINÁMICO (Cumplimiento Requisito Técnico) ---
export const apiSaludo = {
  /**
   * Genera un mensaje de bienvenida contextual basado en la hora del "servidor".
   * Simula una latencia de red y procesamiento backend.
   */
  obtenerMensajeBienvenida: async (nombreTienda: string) => {
    // Simular latencia de red (Processing...)
    await new Promise(resolve => setTimeout(resolve, 600));

    const hora = new Date().getHours();
    let momento = "";
    let icono = "";

    // Lógica de negocio "Backend"
    if (hora >= 5 && hora < 12) {
      momento = "Buenos días";
      icono = "☀️";
    } else if (hora >= 12 && hora < 19) {
      momento = "Buenas tardes";
      icono = "🌤️";
    } else {
      momento = "Buenas noches";
      icono = "🌙";
    }

    return {
      mensaje: `¡${momento}! ${icono} En ${nombreTienda} estamos listos para atenderte.`,
      color_sugerido: hora >= 18 ? "indigo" : "orange",
      timestamp: new Date().toISOString()
    };
  }
};
