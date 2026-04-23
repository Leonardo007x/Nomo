
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Link, useNavigate } from 'react-router-dom';
import { apiJson } from '../lib/clienteApi';
import { Tienda } from '../tipos';
import { Boton, ThemeToggle, Logo } from '../componentes/ui';
import { ArrowLeft, Trophy, Dices, Crown, Frown } from 'lucide-react';
import { JuegoRuleta } from '../componentes/dinamica/JuegoRuleta';
import { JuegoTorneo } from '../componentes/dinamica/JuegoTorneo';

export default function PaginaDinamica() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modoJuego, setModoJuego] = useState<'menu' | 'ruleta' | 'torneo'>('menu');
  const [ganador, setGanador] = useState<Tienda | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await apiJson<Tienda[]>('/tiendas');
        setTiendas(data || []);
      } catch {
        setTiendas([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const reiniciar = () => {
    setModoJuego('menu');
    setGanador(null);
  };

  const handleBack = () => {
    if (modoJuego === 'menu') navigate('/');
    else reiniciar();
  }

  if (cargando) {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-bg font-sans text-text-main transition-colors duration-300">
      <nav className="fixed top-0 w-full z-50 bg-bg/80 backdrop-blur-lg border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 font-serif text-2xl font-bold group">
            <div className="neumorphic p-2 rounded-lg text-primary group-hover:text-secondary transition-colors">
              <Logo size={36} />
            </div>
            <span className="text-text-main group-hover:text-primary transition-colors">Mercado Liebre</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={handleBack} className="neumorphic p-2 rounded-full text-text-muted hover:text-primary transition-colors"><ArrowLeft size={20} /></button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-[90rem] mx-auto min-h-[80vh] flex flex-col">
        {modoJuego === 'menu' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold font-serif mb-4 text-text-main">¿Dónde comemos hoy?</h1>
              <p className="text-text-muted text-xl">Deja que el destino (y Mercado Liebre) decidan por ti.</p>
            </div>

            {tiendas.length < 2 ? (
               <div className="neumorphic p-8 text-center text-red-400 border border-red-500/20">
                  <Frown className="mx-auto mb-2" size={32}/> Necesitas al menos 2 tiendas para jugar.
               </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                <button onClick={() => setModoJuego('ruleta')} className="neumorphic p-10 rounded-3xl border border-white/5 hover:border-primary/50 hover:translate-y-1 transition-all group flex flex-col items-center text-center gap-6 relative overflow-hidden">
                  <div className="w-24 h-24 rounded-full neumorphic-inset flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Dices size={48} /></div>
                  <div className="relative z-10"><h2 className="text-2xl font-bold mb-2">Ruleta Eliminatoria</h2><p className="text-text-muted">Gira la rueda. El seleccionado será eliminado.</p></div>
                </button>

                <button onClick={() => setModoJuego('torneo')} className="neumorphic p-10 rounded-3xl border border-white/5 hover:border-secondary/50 hover:translate-y-1 transition-all group flex flex-col items-center text-center gap-6 relative overflow-hidden">
                  <div className="w-24 h-24 rounded-full neumorphic-inset flex items-center justify-center text-secondary group-hover:scale-110 transition-transform"><Trophy size={48} /></div>
                  <div className="relative z-10"><h2 className="text-2xl font-bold mb-2">Copa Mercado Liebre</h2><p className="text-text-muted">Cuadrantes y llaves. Eliminación directa hasta la final.</p></div>
                </button>
              </div>
            )}
          </div>
        )}

        {modoJuego === 'ruleta' && <JuegoRuleta tiendas={tiendas} onGanador={setGanador} />}
        {modoJuego === 'torneo' && <JuegoTorneo tiendas={tiendas} onGanador={setGanador} />}

        {ganador && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
             <div className="neumorphic max-w-lg w-full p-12 rounded-3xl text-center relative border-2 border-primary/50 shadow-[0_0_50px_rgba(255,140,66,0.3)] bg-bg">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center text-white shadow-xl animate-bounce border-4 border-bg">
                   <Crown size={48} />
                </div>
                <h3 className="text-primary font-bold tracking-widest uppercase mt-10 mb-2 text-sm">¡Tenemos un campeón!</h3>
                <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6 text-text-main">{ganador.nombre}</h2>
                <div className="neumorphic-inset p-2 rounded-2xl mb-6 inline-block shadow-inner w-full">
                  <img src={ganador.imagen_banner_url || undefined} className="w-full h-40 object-cover rounded-xl" alt="Ganador" />
                </div>
                <div className="flex flex-col gap-4">
                   <Link to={`/tienda/${ganador.id}`}><Boton className="w-full py-4 text-lg shadow-lg shadow-primary/20 !bg-primary !text-white">Ver Catálogo y Ordenar</Boton></Link>
                   <button onClick={reiniciar} className="text-text-muted hover:text-text-main font-medium py-2">Jugar de nuevo</button>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
