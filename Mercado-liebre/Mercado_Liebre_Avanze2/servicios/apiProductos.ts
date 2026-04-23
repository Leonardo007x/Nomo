import { apiFetch, apiJson } from '../lib/clienteApi';
import { Producto, Categoria } from '../tipos/modelos';

export const apiProductos = {
  obtenerPorTienda: async (tiendaId: string) => {
    const res = await apiFetch(
      `/productos?tienda_id=${encodeURIComponent(tiendaId)}`
    );
    if (!res.ok) {
      return { data: null, error: new Error(res.statusText) };
    }
    const data = await res.json();
    return { data, error: null };
  },

  obtenerCategorias: async (tiendaId: string) => {
    const res = await apiFetch(
      `/categorias?tienda_id=${encodeURIComponent(tiendaId)}`
    );
    if (!res.ok) {
      return { data: null, error: new Error(res.statusText) };
    }
    const data = await res.json();
    return { data: data as Categoria[], error: null };
  },

  guardar: async (producto: Partial<Producto>) => {
    const payload = {
      tienda_id: producto.tienda_id,
      nombre: producto.nombre || 'Nuevo',
      descripcion: producto.descripcion || undefined,
      precio: Number(producto.precio) || 0,
      categoria: producto.categoria || 'General',
      categoria_id: producto.categoria_id || undefined,
      imagen_url: producto.imagen_url || '',
      caracteristicas: producto.caracteristicas || [],
      disponible: producto.disponible ?? true,
      activo: producto.visible ?? true,
      destacado: producto.destacado ?? false,
    };

    if (producto.id) {
      const res = await apiFetch(`/productos/${producto.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre: payload.nombre,
          descripcion: payload.descripcion,
          precio: payload.precio,
          categoria: payload.categoria,
          categoria_id: payload.categoria_id,
          imagen_url: payload.imagen_url,
          caracteristicas: payload.caracteristicas,
          disponible: payload.disponible,
          activo: payload.activo,
          destacado: payload.destacado,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: null, error: new Error(err.error || res.statusText) };
      }
      const data = await res.json();
      return { data: [data], error: null };
    }

    const data = await apiJson<Producto>('/productos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { data: [data], error: null };
  },

  eliminar: async (id: string) => {
    const res = await apiFetch(`/productos/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      return { error: new Error(err.error || res.statusText) };
    }
    return { error: null };
  },

  actualizarEstado: async (id: string, disponible: boolean, activo: boolean) => {
    const res = await apiFetch(`/productos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ disponible, activo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: new Error(err.error || res.statusText) };
    }
    return { error: null };
  },
};
