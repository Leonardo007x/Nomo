/**
 * Configuración del servicio de operaciones (panel + API Docker).
 * El token debe coincidir con lo que pegás en el panel (header Authorization).
 */

function trimEnvToken(v) {
  let t = (v || '').trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

const OPS_PANEL_TOKEN = trimEnvToken(process.env.OPS_PANEL_TOKEN || 'ml_ops_panel_dev_token');

module.exports = {
  PORT: Number(process.env.PORT || 3007),
  OPS_PANEL_TOKEN,
  OPS_LAB_TOKEN: trimEnvToken(process.env.OPS_LAB_TOKEN || process.env.OPS_PANEL_TOKEN || OPS_PANEL_TOKEN),

  GATEWAY_HOST_PORT: Number(process.env.GATEWAY_HOST_PORT || 3000),

  /** Host interno del API Gateway (para agregar health/breakers sin CORS). */
  GATEWAY_INTERNAL_URL: (process.env.GATEWAY_INTERNAL_URL || 'http://gateway:80').replace(/\/$/, ''),

  /** URLs directas a cada microservicio (control de breakers en Opossum). */
  SERVICE_URLS: {
    usuarios: (process.env.USUARIOS_SERVICE_URL || 'http://usuarios-service:3001').replace(/\/$/, ''),
    tiendas: (process.env.TIENDAS_SERVICE_URL || 'http://tiendas-service:3002').replace(/\/$/, ''),
    catalogo: (process.env.CATALOGO_SERVICE_URL || 'http://catalogo-service:3003').replace(/\/$/, ''),
    media: (process.env.MEDIA_SERVICE_URL || 'http://media-service:3004').replace(/\/$/, ''),
    categorias: (process.env.CATEGORIAS_SERVICE_URL || 'http://categorias-service:3005').replace(/\/$/, ''),
    ia: (process.env.IA_SERVICE_URL || 'http://ia-service:3006').replace(/\/$/, ''),
  },

  /**
   * Mapa id lógico → nombre real del contenedor (docker-compose container_name).
   * Solo estos objetivos pueden start/stop y leer logs desde la API.
   */
  CONTAINER_MAP: {
    'db-usuarios': 'mercadoliebre_db_usuarios',
    'db-tiendas': 'mercadoliebre_db_tiendas',
    'db-catalogo': 'mercadoliebre_db_catalogo',
    'db-media': 'mercadoliebre_db_media',
    'db-categorias': 'mercadoliebre_db_categorias',
    'db-ia': 'mercadoliebre_db_ia',
    'usuarios-service': 'mercadoliebre_usuarios',
    'usuarios-service-2': 'mercadoliebre_usuarios_2',
    'tiendas-service': 'mercadoliebre_tiendas',
    'catalogo-service': 'mercadoliebre_catalogo',
    'media-service': 'mercadoliebre_media',
    'categorias-service': 'mercadoliebre_categorias',
    'ia-service': 'mercadoliebre_ia',
    gateway: 'mercadoliebre_gateway',
    frontend: 'mercadoliebre_frontend',
  },
};
