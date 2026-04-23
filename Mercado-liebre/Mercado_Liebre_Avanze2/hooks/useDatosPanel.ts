import { useState, useEffect } from 'react';
import type { UsuarioSesion } from '../tipos/modelos';
import { Tienda, Tema, Categoria, Producto } from '../tipos';
import { apiTienda } from '../servicios/apiTienda';
import { apiProductos } from '../servicios/apiProductos';

export const useDatosPanel = (user: UsuarioSesion | null) => {
  const [cargando, setCargando] = useState(true);
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [tema, setTema] = useState<Tema | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  const mostrarMensaje = (tipo: 'exito' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3000);
  };

  const cargarDatos = async () => {
    if (!user) return;
    setCargando(true);
    try {
      let { data: restData, error: restError } = await apiTienda.obtenerPorUsuario(user.id);
      if (restError) throw restError;

      if (!restData) {
         const { data: newRest, error: createError } = await apiTienda.crear(user.id, {
             email: user.email,
             nombre: user.nombre,
             apellido: user.apellido
         });
         if (createError) throw createError;
         restData = newRest;
      }
      setTienda(restData);

      let { data: temaData } = await apiTienda.obtenerTema(restData.id);
      if (!temaData) {
          const { data: newTema } = await apiTienda.crearTemaDefault(restData.id);
          temaData = newTema;
      }
      setTema(temaData);

      const { data: catData } = await apiProductos.obtenerCategorias(restData.id);
      setCategorias(catData || []);

      const { data: platData } = await apiProductos.obtenerPorTienda(restData.id);
      const productosMapeados = (platData || []).map(p => ({ ...p, visible: p.activo !== false }));
      setProductos(productosMapeados);

    } catch (error: any) {
      console.error("Error cargando datos:", error);
      mostrarMensaje('error', typeof error === 'string' ? error : error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (user) cargarDatos();
  }, [user]);

  return {
    cargando,
    tienda,
    setTienda,
    tema,
    setTema,
    categorias,
    productos,
    setProductos,
    mensaje,
    mostrarMensaje,
    cargarDatos
  };
};
