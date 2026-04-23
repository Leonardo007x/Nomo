
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  titulo?: string;
  descripcion?: string;
  imagen?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  titulo = 'Mercado Liebre - Crea tu catálogo digital', 
  descripcion = 'Plataforma para crear sitios web y catálogos digitales para tiendas con IA y diseño neumórfico.',
  imagen = 'https://mercadoliebre.app/og-image.jpg',
  url
}) => {
  const sitioUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Metaetiquetas Estándar */}
      <title>{titulo}</title>
      <meta name="description" content={descripcion} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={sitioUrl} />
      <meta property="og:title" content={titulo} />
      <meta property="og:description" content={descripcion} />
      <meta property="og:image" content={imagen} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={sitioUrl} />
      <meta property="twitter:title" content={titulo} />
      <meta property="twitter:description" content={descripcion} />
      <meta property="twitter:image" content={imagen} />
    </Helmet>
  );
};
