
import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Boton, Logo } from '../componentes/ui';
import { TransicionPagina } from '../componentes/sistema-diseno/TransicionPagina';

export default function Pagina404() {
  return (
    <TransicionPagina>
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-32 h-32 rounded-full neumorphic flex items-center justify-center mb-8 border-4 border-bg shadow-2xl relative">
          <div className="text-primary opacity-50">
             <Logo size={64} />
          </div>
          <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xl border-4 border-bg animate-bounce">
            404
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold font-serif text-text-main mb-4">
          ¡Se nos quemó el plato!
        </h1>
        
        <p className="text-xl text-text-muted mb-8 max-w-md leading-relaxed">
          Lo sentimos, la página que buscas no está en el catálogo o ha sido eliminada de la cocina.
        </p>

        <Link to="/">
          <Boton variante="primario" icono={<Home size={20} />}>
            Volver al Inicio
          </Boton>
        </Link>
        
        <div className="mt-12 opacity-20 text-[10px] font-mono">
          ERROR_CODE: DISH_NOT_FOUND
        </div>
      </div>
    </TransicionPagina>
  );
}