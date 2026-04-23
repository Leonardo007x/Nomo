
import React, { useState, useEffect } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';

interface ImagenInteligenteProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined; // Permitir null/undefined explícitamente
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto' | string;
  fallbackSrc?: string;
}

export const ImagenInteligente: React.FC<ImagenInteligenteProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'auto',
  fallbackSrc = 'https://via.placeholder.com/400x300?text=Sin+Imagen',
  ...props
}) => {
  const [estado, setEstado] = useState<'cargando' | 'completo' | 'error'>('cargando');
  const [srcActual, setSrcActual] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Si la URL no existe, es vacía o nula, marcar error inmediatamente para mostrar fallback
    if (!src || src.trim() === '') {
      setEstado('error');
      setSrcActual(fallbackSrc || undefined);
      return;
    }

    setEstado('cargando');
    setSrcActual(src);
  }, [src, fallbackSrc]);

  const handleLoad = () => {
    setEstado('completo');
  };

  const handleError = () => {
    if (estado !== 'error') {
        setEstado('error');
        setSrcActual(fallbackSrc || undefined);
    }
  };

  // Determinar clases de aspecto
  let ratioClass = '';
  if (aspectRatio === 'square') ratioClass = 'aspect-square';
  else if (aspectRatio === 'video') ratioClass = 'aspect-video';

  return (
    <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 ${ratioClass} ${className}`}>
      {/* Skeleton Loader / Error State */}
      <div 
        className={`absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 transition-opacity duration-500 ${estado === 'completo' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {estado === 'cargando' && (
           <div className="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin opacity-20" />
           </div>
        )}
        {estado === 'error' && (
           <div className="flex flex-col items-center text-gray-400">
              <ImageOff size={36} opacity={0.5} />
           </div>
        )}
      </div>

      {/* Imagen Real */}
      <img
        src={srcActual}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${estado === 'completo' ? 'scale-100 blur-0 opacity-100' : 'scale-105 blur-lg opacity-0'}`}
        {...props}
      />
    </div>
  );
};
