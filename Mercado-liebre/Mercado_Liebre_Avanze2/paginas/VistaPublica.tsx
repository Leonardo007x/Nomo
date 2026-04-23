
import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useParams } from 'react-router-dom';
import { apiJson } from '../lib/clienteApi';
import { Tienda, Tema, Producto } from '../tipos';
import { PlantillaTienda } from '../componentes/tienda/PlantillaTienda';
import { SEO } from '../componentes/sistema-diseno/SEO';

const VistaPublica = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ tienda: Tienda | null; tema: Tema | null; productos: Producto[]; }>({ tienda: null, tema: null, productos: [] });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const json = await apiJson<{ tienda: Tienda; tema: Tema; productos: Producto[] }>(
          `/tiendas/${encodeURIComponent(id)}/vista-publica`
        );
        setData({
          tienda: json.tienda,
          tema: json.tema,
          productos: json.productos || [],
        });
      } catch (err: any) {
        setError(err.message || 'Error al cargar el tienda');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>;
  
  if (error || !data.tienda || !data.tema) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center"><h1 className="text-4xl font-bold mb-4 text-gray-800">404</h1><p className="text-xl text-gray-600 mb-8">{error || 'Tienda no encontrado'}</p><a href="/" className="px-6 py-3 bg-black text-white rounded-xl hover:opacity-80 font-bold transition-all">Volver al Inicio</a></div>;

  return (
    <>
      <SEO 
        titulo={`${data.tienda.nombre} | Catálogo Digital`}
        descripcion={data.tienda.descripcion || `Descubre el catálogo de ${data.tienda.nombre}. Pide en línea.`}
        imagen={data.tienda.imagen_banner_url}
      />
      <PlantillaTienda tienda={data.tienda} tema={data.tema} productos={data.productos} />
    </>
  );
};

export default VistaPublica;
export { PlantillaTienda };
