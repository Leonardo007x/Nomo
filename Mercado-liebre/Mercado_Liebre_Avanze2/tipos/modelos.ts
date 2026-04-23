/** Usuario devuelto por /api/auth (sesión JWT). */
export interface UsuarioSesion {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
}

export interface Tienda {
  id: string;
  usuario_id: string;
  nombre: string;
  descripcion: string;
  eslogan: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  pais: string;
  codigo_postal: string;
  facebook: string;
  instagram: string;
  twitter: string;
  whatsapp: string;
  horario_apertura: string;
  horario_cierre: string;
  dias_abierto: {
    lunes: boolean;
    martes: boolean;
    miercoles: boolean;
    jueves: boolean;
    viernes: boolean;
    sabado: boolean;
    domingo: boolean;
  };
  imagen_logo_url: string;
  imagen_banner_url: string;
  moneda: string;
  idioma: string;
}

export type EstiloPlantilla = 'moderno' | 'carta';

export interface Tema {
  id: string;
  tienda_id: string;
  color_primario: string;
  color_secundario: string;
  color_fondo: string;
  color_texto: string;
  color_texto_titulos: string;
  fuente_titulos: string;
  fuente_cuerpo: string;
  estilo_plantilla: EstiloPlantilla;
}

export interface Categoria {
  id: string;
  tienda_id: string;
  nombre: string;
  icono: string;
  orden: number;
}

export interface Producto {
  id: string;
  tienda_id: string;
  categoria_id?: string;
  categoria: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string;
  caracteristicas: string[];
  alergenos: string[];
  vegetariano: boolean;
  vegano: boolean;
  picante: boolean;
  disponible: boolean;
  visible: boolean;
  destacado: boolean;
  activo?: boolean; // Compatibilidad con lógica anterior
  tiempo_preparacion?: number;
}
