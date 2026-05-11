
/**
 * Descripción: Definición de variables de entorno y constantes globales del sistema.
 */

// Las variables sensibles viven en backend/microservicios (no en frontend).

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
