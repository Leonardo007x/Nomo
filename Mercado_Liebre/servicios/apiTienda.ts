import { apiFetch, apiJson } from '../lib/clienteApi';
import { Tienda, Tema } from '../tipos/modelos';

export const apiTienda = {
  obtenerPorUsuario: async (_userId: string) => {
    const res = await apiFetch('/tiendas/mias');
    if (res.status === 401) return { data: null, error: new Error('No autorizado') };
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: new Error(err.error || res.statusText) };
    }
    const data = await res.json();
    return { data: data === null ? null : data, error: null };
  },

  crear: async (userId: string, userData: { email?: string; nombre?: string; apellido?: string }) => {
    const res = await apiFetch('/tiendas', {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Mi Nueva Tienda',
        descripcion: 'Bienvenido a nuestro catálogo digital.',
        eslogan: 'Lo mejor para ti',
        horario_apertura: '09:00',
        horario_cierre: '22:00',
        dias_abierto: {
          lunes: true,
          martes: true,
          miercoles: true,
          jueves: true,
          viernes: true,
          sabado: true,
          domingo: true,
        },
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: new Error(err.error || res.statusText) };
    }
    const data = await res.json();
    return { data, error: null };
  },

  actualizar: async (id: string, datos: Partial<Tienda>) => {
    const res = await apiFetch(`/tiendas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: new Error(err.error || res.statusText) };
    }
    return { data: await res.json(), error: null };
  },

  obtenerTema: async (tiendaId: string) => {
    const res = await apiFetch(`/temas?tienda_id=${encodeURIComponent(tiendaId)}`);
    if (!res.ok) return { data: null, error: new Error(res.statusText) };
    const data = await res.json();
    return { data, error: null };
  },

  crearTemaDefault: async (tiendaId: string) => {
    const data = await apiJson<Tema>('/temas', {
      method: 'POST',
      body: JSON.stringify({
        tienda_id: tiendaId,
        estilo_plantilla: 'moderno',
        color_primario: '#FFE600',
        color_secundario: '#3483FA',
        color_fondo: '#EBEBEB',
        color_texto: '#333333',
        color_texto_titulos: '#333333',
        fuente_titulos: 'Playfair Display',
        fuente_cuerpo: 'Inter',
      }),
    });
    return { data, error: null };
  },

  actualizarTema: async (id: string, datos: Partial<Tema>) => {
    const res = await apiFetch(`/temas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: new Error(err.error || res.statusText) };
    }
    return { data: await res.json(), error: null };
  },
};
