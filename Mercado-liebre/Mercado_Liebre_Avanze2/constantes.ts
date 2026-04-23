
/**
 * Descripción: Definición de variables de entorno y constantes globales del sistema.
 */

// Función segura para leer variables de entorno con fallback
const getEnv = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    console.warn(`Error leyendo variable ${key}`, e);
  }
  return fallback;
};

// Configuración de claves API y servicios externos (datos vía servicio-api + MySQL en Docker).
// Las imágenes se suben con POST /api/media/upload usando CLOUDINARY_* en el servidor (docker-compose / .env).
export const ENV = {
  GROQ_API_KEY: getEnv("VITE_GROQ_API_KEY", "")
};

// Opciones de configuración visual
export const FUENTES = [
  { nombre: 'Playfair Display', valor: 'Playfair Display' },
  { nombre: 'Inter', valor: 'Inter' },
  { nombre: 'Roboto', valor: 'Roboto' },
  { nombre: 'Open Sans', valor: 'Open Sans' },
  { nombre: 'Lato', valor: 'Lato' },
  { nombre: 'Montserrat', valor: 'Montserrat' },
];

export const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lun' },
  { key: 'martes', label: 'Mar' },
  { key: 'miercoles', label: 'Mié' },
  { key: 'jueves', label: 'Jue' },
  { key: 'viernes', label: 'Vie' },
  { key: 'sabado', label: 'Sáb' },
  { key: 'domingo', label: 'Dom' },
];

// Límites de caracteres estandarizados para todos los formularios
export const LIMITES = { 
  REST_NOMBRE: 50, 
  REST_ESLOGAN: 100, 
  REST_DESC: 500, 
  REST_EMAIL: 100,
  REST_TELEFONO: 10, // Actualizado a 10 dígitos exactos
  REST_DIRECCION: 120,
  REST_CIUDAD: 50,
  REST_URL: 200, // Facebook, Instagram
  
  PLATILLO_NOMBRE: 60, 
  PLATILLO_DESC: 250, 
  PLATILLO_CAT: 50, 
  INGREDIENTES: 300,
  
  ADDR_NUM: 10, 
  ADDR_TEXT: 50 
};
