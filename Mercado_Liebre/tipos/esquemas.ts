
import { z } from 'zod';
import { LIMITES } from '../constantes';

// --- ESQUEMAS DE VALIDACIÓN ---

export const TiendaSchema = z.object({
  nombre: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(LIMITES.REST_NOMBRE, `Máximo ${LIMITES.REST_NOMBRE} caracteres`),
    
  eslogan: z.string()
    .max(LIMITES.REST_ESLOGAN, `Máximo ${LIMITES.REST_ESLOGAN} caracteres`)
    .optional(),
    
  descripcion: z.string()
    .max(LIMITES.REST_DESC, `Máximo ${LIMITES.REST_DESC} caracteres`)
    .optional(),
    
  telefono: z.string()
    .regex(/^\d{10}$/, "Debe ser un número válido de 10 dígitos")
    .max(LIMITES.REST_TELEFONO, "Número demasiado largo")
    .optional().or(z.literal('')),
    
  email: z.string()
    .email("Correo electrónico inválido")
    .max(LIMITES.REST_EMAIL, "Email demasiado largo")
    .optional().or(z.literal('')),
    
  direccion: z.string()
    .min(5, "Dirección muy corta")
    .max(LIMITES.REST_DIRECCION, `Máximo ${LIMITES.REST_DIRECCION} caracteres`)
    .optional(),
    
  ciudad: z.string()
    .min(2, "Ciudad inválida")
    .max(LIMITES.REST_CIUDAD, `Máximo ${LIMITES.REST_CIUDAD} caracteres`)
    .optional(),
    
  whatsapp: z.string()
    .regex(/^\d{10}$/, "Debe ser un número de 10 dígitos para WhatsApp")
    .max(LIMITES.REST_TELEFONO, "Número demasiado largo")
    .optional().or(z.literal('')),
    
  facebook: z.string()
    .url("URL inválida")
    .max(LIMITES.REST_URL, "URL demasiado larga")
    .optional().or(z.literal('')),
    
  instagram: z.string()
    .url("URL inválida")
    .max(LIMITES.REST_URL, "URL demasiado larga")
    .optional().or(z.literal('')),
    
  horario_apertura: z.string().optional(),
  horario_cierre: z.string().optional(),
  dias_abierto: z.object({
    lunes: z.boolean(),
    martes: z.boolean(),
    miercoles: z.boolean(),
    jueves: z.boolean(),
    viernes: z.boolean(),
    sabado: z.boolean(),
    domingo: z.boolean(),
  }).optional(),
  imagen_logo_url: z.string().optional(),
  imagen_banner_url: z.string().optional(),
});

export const ProductoSchema = z.object({
  nombre: z.string()
    .min(2, "El nombre es obligatorio")
    .max(LIMITES.PLATILLO_NOMBRE, `Máximo ${LIMITES.PLATILLO_NOMBRE} caracteres`)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios"),
  
  descripcion: z.string()
    .min(5, "La descripción es muy corta")
    .max(LIMITES.PLATILLO_DESC, `Máximo ${LIMITES.PLATILLO_DESC} caracteres`)
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,]+$/, "Solo se permiten letras y números"),
  
  precio: z.number()
    .min(1000, "El precio mínimo es $1.000")
    .max(200000, "El precio máximo es $200.000"),
  
  categoria: z.string()
    .min(1, "Selecciona una categoría")
    .max(LIMITES.PLATILLO_CAT, `Categoría muy larga`),
    
  imagen_url: z.string().min(1, "La imagen es obligatoria"),
  
  caracteristicas: z.array(z.string())
    .min(1, "Añade al menos un ingrediente")
    .refine(items => items.every(i => /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(i)), {
      message: "Los caracteristicas solo pueden contener letras y números"
    }),
    
  visible: z.boolean().default(true),
  disponible: z.boolean().default(true),
  destacado: z.boolean().default(false)
});

export type TiendaFormValues = z.infer<typeof TiendaSchema>;
export type ProductoFormValues = z.infer<typeof ProductoSchema>;
