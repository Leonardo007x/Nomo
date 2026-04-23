/**
 * Descripción: Dinámica de copa con bracket eliminatorio y podio final.
 */
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Grid, Shuffle, MousePointerClick, RefreshCw, CheckCircle2, XCircle, UserMinus, HelpCircle, UserCheck, UserX, ArrowRight, Zap, ShoppingBag, Dices, HandMetal, Hand, Medal, Star } from 'lucide-react';
import { Tienda } from '../../tipos';
import { Boton } from '../ui';

// --- Helper Types & Functions ---
interface Match {
  id: number;
  round: number; // 1: Octavos, 2: Cuartos, 3: Semis, 4: Final, 0: Tercer Puesto
  p1: Tienda | null;
  p2: Tienda | null;
  winner: Tienda | null;
  nextMatchId: number | null;
}

function mezclarArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

// --- Sub-components (Private) ---
// Tarjeta visual de cada partido en el bracket
const MatchCard: React.FC<{ match: Match; isActive: boolean; label?: string }> = ({ match, isActive, label }) => (
  <div className={`relative flex flex-col justify-center w-36 p-2 rounded-xl border transition-all duration-300 ${isActive ? 'scale-110 ring-2 ring-primary shadow-[0_0_15px_rgba(255,140,66,0.5)] bg-surface z-10' : 'border-white/10 bg-surface/50 opacity-80'}`}>
      {isActive && (
         <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce shadow-lg z-20 flex items-center gap-1 whitespace-nowrap">
            <Zap size={8} fill="currentColor"/> JUGAR
         </div>
      )}
      {label && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
              {label}
          </div>
      )}
      <div className={`flex items-center gap-2 mb-1 p-1 rounded ${match.winner?.id === match.p1?.id ? 'font-bold text-green-400' : (match.winner && match.p1 && match.winner.id !== match.p1.id) ? 'opacity-40 line-through decoration-red-500/50' : ''}`}>
          <div className="w-5 h-5 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border border-white/10">
            {match.p1?.imagen_logo_url ? <img src={match.p1.imagen_logo_url} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-white/5"></div>}
          </div>
          <span className="text-[10px] truncate font-medium">{match.p1?.nombre || '...'}</span>
      </div>
      <div className="h-[1px] w-full bg-white/5 my-1"></div>
      <div className={`flex items-center gap-2 p-1 rounded ${match.winner?.id === match.p2?.id ? 'font-bold text-green-400' : (match.winner && match.p2 && match.winner.id !== match.p2.id) ? 'opacity-40 line-through decoration-red-500/50' : ''}`}>
          <div className="w-5 h-5 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border border-white/10">
            {match.p2?.imagen_logo_url ? <img src={match.p2.imagen_logo_url} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-white/5"></div>}
          </div>
          <span className="text-[10px] truncate font-medium">{match.p2?.nombre || '...'}</span>
      </div>
  </div>
);

// Panel de control para decidir el ganador (Azar o Manual)
const ControlPartido = ({ match, onResolve }: { match: Match, onResolve: (id: number, w: Tienda) => void }) => {
   const [animando, setAnimando] = useState(false);
   const [tempWinner, setTempWinner] = useState<Tienda | null>(null);
   const [modoDecision, setModoDecision] = useState<'seleccion' | 'azar' | 'manual'>('seleccion');

   useEffect(() => {
      setAnimando(false);
      setTempWinner(null);
      setModoDecision('seleccion');
   }, [match.id]);

   const jugarAzar = () => {
      if (!match.p1 || !match.p2) return;
      setModoDecision('azar');
      setAnimando(true);
      let toggles = 0;
      const interval = setInterval(() => {
         toggles++;
         setTempWinner(toggles % 2 === 0 ? match.p1 : match.p2);
         if (toggles >= 20) {
            clearInterval(interval);
            const finalWinner = Math.random() > 0.5 ? match.p1! : match.p2!;
            setTempWinner(finalWinner);
            setTimeout(() => { setAnimando(false); onResolve(match.id, finalWinner); }, 800);
         }
      }, 100);
   };

   if (!match.p1 || !match.p2) return <div className="bg-surface border border-border p-8 rounded-2xl text-center text-text-muted text-sm italic">Selecciona un partido activo...</div>;

   const renderCard = (player: Tienda) => (
      <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${animando && tempWinner?.id === player.id ? 'bg-primary/20 border-primary scale-105 shadow-lg' : 'bg-surface border-white/5'}`}>
        <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-bg shadow-inner overflow-hidden flex-shrink-0">
                {player.imagen_logo_url ? <img src={player.imagen_logo_url} className="w-full h-full object-cover" alt=""/> : <ShoppingBag className="p-2"/>}
            </div>
            <span className="font-bold text-lg leading-tight truncate">{player.nombre}</span>
        </div>
        {modoDecision === 'manual' && (
            <button onClick={() => onResolve(match.id, player)} className="p-2 bg-green-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg shrink-0">
                <CheckCircle2 size={20} />
            </button>
        )}
      </div>
   );

   const tituloPartido = match.round === 4 ? "GRAN FINAL" : match.round === 0 ? "3er PUESTO" : "Encuentro";

   return (
      <div className="h-full bg-surface p-6 rounded-3xl border border-border flex flex-col justify-center items-center relative overflow-hidden shadow-sm">
         <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
            <Trophy size={14}/> {tituloPartido}
         </h3>
         <p className="text-xs text-text-muted mb-6">
            {modoDecision === 'seleccion' ? 'Selecciona método' : modoDecision === 'azar' ? 'Simulando...' : 'Elige al ganador'}
         </p>
         
         <div className="w-full flex flex-col gap-4 relative z-10">
            {renderCard(match.p1)}
            <div className="flex justify-center my-2 relative">
               <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center font-black text-text-muted text-xs shadow-inner z-10 border border-white/5">VS</div>
               {modoDecision === 'manual' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10 -z-0"></div>}
            </div>
            {renderCard(match.p2)}
         </div>

         <div className="mt-8 w-full">
            {modoDecision === 'seleccion' && (
               <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                  <button onClick={jugarAzar} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-bg border border-border hover:bg-surface hover:shadow-md transition-all group">
                     <Dices size={36} className="text-primary group-hover:rotate-12 transition-transform"/><span className="text-xs font-bold">Azar</span>
                  </button>
                  <button onClick={() => setModoDecision('manual')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-bg border border-border hover:bg-surface hover:shadow-md transition-all group">
                     <HandMetal size={24} className="text-secondary group-hover:scale-110 transition-transform"/><span className="text-xs font-bold">Manual</span>
                  </button>
               </div>
            )}
            {modoDecision === 'manual' && (
                <div className="text-center animate-fadeIn">
                    <p className="text-sm text-text-muted mb-4 flex items-center justify-center gap-2"><Hand size={16} /> Toca el botón verde del ganador</p>
                    <button onClick={() => setModoDecision('seleccion')} className="text-xs underline text-text-muted hover:text-primary">Cancelar</button>
                </div>
            )}
            {modoDecision === 'azar' && animando && <div className="flex justify-center py-4"><RefreshCw className="animate-spin text-primary" size={32} /></div>}
         </div>
      </div>
   );
};

// --- Main Component ---
interface Props {
  tiendas: Tienda[];
  onGanador: (r: Tienda) => void;
}

export const JuegoTorneo: React.FC<Props> = ({ tiendas, onGanador }) => {
  const [fase, setFase] = useState<'preliminar' | 'sorteo' | 'bracket' | 'podio'>('preliminar');
  const [participantes, setParticipantes] = useState<Tienda[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchId, setCurrentMatchId] = useState<number | null>(null);
  const [excluidosManuales, setExcluidosManuales] = useState<string[]>([]);
  const [preliminarResult, setPreliminarResult] = useState<{ qualified: Tienda[], eliminated: Tienda[] } | null>(null);
  const [animandoPreliminar, setAnimandoPreliminar] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  
  // Podio State
  const [podio, setPodio] = useState<{gold: Tienda, silver: Tienda, bronze: Tienda} | null>(null);

  useEffect(() => {
    if (tiendas.length > 16) setFase('preliminar');
    else {
      setParticipantes(tiendas);
      setFase('sorteo');
    }
  }, [tiendas]);

  // --- Logic Methods ---
  const ejecutarPreliminar = () => {
    const poolActivos: Tienda[] = tiendas.filter(r => !excluidosManuales.includes(r.id));
    if (poolActivos.length < 16) { alert(`Necesitas al menos 16 participantes.`); return; }
    
    setAnimandoPreliminar(true);
    setTimeout(() => {
       const shuffled: Tienda[] = mezclarArray(poolActivos);
       const qualified: Tienda[] = shuffled.slice(0, 16);
       const eliminated: Tienda[] = [...shuffled.slice(16), ...tiendas.filter(r => excluidosManuales.includes(r.id))];
       setPreliminarResult({ qualified, eliminated });
       setParticipantes(qualified);
       setAnimandoPreliminar(false);
    }, 2500);
  };

  const iniciarBracket = () => {
     setIsShuffling(true);
     setTimeout(() => {
        const shuffled: Tienda[] = mezclarArray(participantes);
        const matchesList: Match[] = [];
        let idCounter = 1;
        
        // --- Generación del Bracket ---
        
        // Round 1: Octavos (8 partidos)
        const r1Matches: Match[] = [];
        for(let i=0; i<8; i++) {
            const m: Match = { id: idCounter++, round: 1, p1: shuffled[i*2]||null, p2: shuffled[i*2+1]||null, winner: null, nextMatchId: null };
            if(!m.p2 && m.p1) m.winner = m.p1; // Bye automático si falta oponente
            matchesList.push(m); r1Matches.push(m);
        }
        
        // Round 2: Cuartos (4 partidos)
        const r2Matches: Match[] = [];
        for(let i=0; i<4; i++) {
            const m: Match = { id: idCounter++, round: 2, p1:null, p2:null, winner:null, nextMatchId:null };
            // Vincular ganadores de Octavos a Cuartos
            r1Matches[i*2].nextMatchId = m.id; 
            r1Matches[i*2+1].nextMatchId = m.id;
            matchesList.push(m); r2Matches.push(m);
        }

        // Round 3: Semifinales (2 partidos)
        const r3Matches: Match[] = [];
        for(let i=0; i<2; i++) {
            const m: Match = { id: idCounter++, round: 3, p1:null, p2:null, winner:null, nextMatchId:null };
            // Vincular ganadores de Cuartos a Semis
            r2Matches[i*2].nextMatchId = m.id; 
            r2Matches[i*2+1].nextMatchId = m.id;
            matchesList.push(m); r3Matches.push(m);
        }

        // Round 4: FINAL (1 partido)
        const final: Match = { id: idCounter++, round: 4, p1:null, p2:null, winner:null, nextMatchId:null };
        // Los ganadores de Semis van a la Final
        r3Matches[0].nextMatchId = final.id; 
        r3Matches[1].nextMatchId = final.id;
        
        // Round 0: 3er PUESTO (1 partido)
        // NOTA: No tiene nextMatchId directo desde los anteriores porque la lógica es "Perdedores de Round 3"
        const tercerPuesto: Match = { id: idCounter++, round: 0, p1:null, p2:null, winner:null, nextMatchId:null };
        
        matchesList.push(final);
        matchesList.push(tercerPuesto);

        setMatches(matchesList);
        
        // Determinar primer partido jugable
        const first = matchesList.find(m => !m.winner && m.p1 && m.p2);
        setCurrentMatchId(first ? first.id : null);
        
        setIsShuffling(false);
        setFase('bracket');
     }, 1500);
  };

  const resolverMatch = (matchId: number, winner: Tienda) => {
     const newMatches = [...matches];
     const matchIdx = newMatches.findIndex(m => m.id === matchId);
     if (matchIdx === -1) return;

     const match = newMatches[matchIdx];
     match.winner = winner;

     // --- Lógica de avance ---

     // Caso especial: Semifinales (Round 3)
     // El ganador va a la Final (Round 4)
     // El PERDEDOR va al 3er Puesto (Round 0)
     if (match.round === 3 && match.p1 && match.p2) {
         const loser = match.p1.id === winner.id ? match.p2 : match.p1;
         
         // Mover Perdedor al partido de 3er puesto
         const thirdPlaceMatch = newMatches.find(m => m.round === 0);
         if (thirdPlaceMatch) {
             if (!thirdPlaceMatch.p1) thirdPlaceMatch.p1 = loser;
             else thirdPlaceMatch.p2 = loser;
         }
     }

     // Lógica estándar: Avanzar ganador al siguiente partido vinculado
     if (match.nextMatchId) {
        const nextMatch = newMatches.find(m => m.id === match.nextMatchId);
        if (nextMatch) {
           if (!nextMatch.p1) nextMatch.p1 = winner;
           else nextMatch.p2 = winner;
        }
     }

     setMatches(newMatches);

     // --- Lógica de Finalización y Podio ---
     
     // Si se jugó la Final y ya tenemos 3er puesto (o ya se jugó)
     const finalMatch = newMatches.find(m => m.round === 4);
     const thirdPlaceMatch = newMatches.find(m => m.round === 0);
     
     if (finalMatch?.winner && thirdPlaceMatch?.winner) {
         // Tenemos todo para el podio
         const gold = finalMatch.winner;
         const silver = finalMatch.p1?.id === gold.id ? finalMatch.p2! : finalMatch.p1!;
         const bronze = thirdPlaceMatch.winner;
         
         setPodio({ gold, silver, bronze });
         setFase('podio');
         return;
     }

     // --- Determinar siguiente partido activo ---
     
     // PRIORIDAD: Partido de 3er Puesto (si está listo y no jugado)
     if (thirdPlaceMatch && thirdPlaceMatch.p1 && thirdPlaceMatch.p2 && !thirdPlaceMatch.winner) {
         setCurrentMatchId(thirdPlaceMatch.id);
         return;
     }
     
     // Si no, buscar el siguiente partido pendiente estándar
     // Pero si el siguiente disponible es la FINAL, esperamos a que se juegue el 3er puesto (prioridad arriba)
     const next = newMatches.find(m => !m.winner && m.p1 && m.p2);
     setCurrentMatchId(next ? next.id : null);
  };

  // --- Renders ---
  
  // PODIO VIEW
  if (fase === 'podio' && podio) {
      return (
          <div className="flex flex-col items-center justify-center h-full w-full animate-fadeIn pb-10">
              <div className="text-center mb-10">
                  <h2 className="text-4xl md:text-5xl font-bold font-serif text-text-main mb-2">¡Torneo Finalizado!</h2>
                  <p className="text-text-muted text-lg">Aquí están tus campeones</p>
              </div>
              
              <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 w-full max-w-4xl px-6 mb-12">
                  
                  {/* PLATA (2nd) */}
                  <div className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3 animate-slideIn" style={{animationDelay: '0.2s'}}>
                      <div className="w-24 h-24 rounded-full border-4 border-gray-300 overflow-hidden mb-4 shadow-xl relative">
                          <img src={podio.silver.imagen_logo_url || undefined} className="w-full h-full object-cover grayscale-[0.2]" alt="Silver" />
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-800 font-bold shadow-md border-2 border-bg">2</div>
                      </div>
                      <div className="h-32 w-full bg-gradient-to-t from-gray-400/20 to-gray-300/10 rounded-t-2xl flex flex-col justify-end p-4 text-center border-t border-gray-300/30">
                          <span className="font-bold text-lg text-text-main line-clamp-2">{podio.silver.nombre}</span>
                          <span className="text-xs uppercase font-bold text-gray-400 mt-1">Subcampeón</span>
                      </div>
                  </div>

                  {/* ORO (1st) */}
                  <div className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 z-10 animate-slideIn">
                      <div className="absolute -mt-16 text-yellow-500 animate-bounce"><Star size={32} fill="currentColor"/></div>
                      <div className="w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden mb-4 shadow-[0_0_30px_rgba(250,204,21,0.4)] relative ring-4 ring-yellow-400/20">
                          <img src={podio.gold.imagen_logo_url || undefined} className="w-full h-full object-cover" alt="Gold" />
                          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-black text-xl shadow-md border-4 border-bg">1</div>
                      </div>
                      <div className="h-48 w-full bg-gradient-to-t from-yellow-500/20 to-yellow-400/10 rounded-t-2xl flex flex-col justify-end p-6 text-center border-t border-yellow-400/30 relative overflow-hidden">
                          <div className="absolute inset-0 bg-yellow-400/5 animate-pulse"></div>
                          <span className="font-bold text-2xl text-text-main line-clamp-2 leading-tight mb-1 relative z-10">{podio.gold.nombre}</span>
                          <span className="text-xs uppercase font-black text-yellow-500 tracking-widest relative z-10">Gran Campeón</span>
                      </div>
                  </div>

                  {/* BRONCE (3rd) */}
                  <div className="order-3 flex flex-col items-center w-full md:w-1/3 animate-slideIn" style={{animationDelay: '0.4s'}}>
                      <div className="w-24 h-24 rounded-full border-4 border-orange-700 overflow-hidden mb-4 shadow-xl relative">
                          <img src={podio.bronze.imagen_logo_url || undefined} className="w-full h-full object-cover grayscale-[0.4]" alt="Bronze" />
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-700 rounded-full flex items-center justify-center text-orange-100 font-bold shadow-md border-2 border-bg">3</div>
                      </div>
                      <div className="h-24 w-full bg-gradient-to-t from-orange-800/20 to-orange-700/10 rounded-t-2xl flex flex-col justify-end p-4 text-center border-t border-orange-700/30">
                          <span className="font-bold text-lg text-text-main line-clamp-2">{podio.bronze.nombre}</span>
                          <span className="text-xs uppercase font-bold text-orange-700 mt-1">Tercer Lugar</span>
                      </div>
                  </div>
              </div>

              <Boton onClick={() => onGanador(podio.gold)} className="py-4 px-12 text-lg shadow-xl shadow-primary/20 animate-pulse">
                  Ver Detalles del Ganador
              </Boton>
          </div>
      );
  }

  // PRELIMINAR VIEW
  if (fase === 'preliminar') {
    return (
      <div className="flex flex-col h-full animate-fadeIn text-center max-w-6xl mx-auto w-full">
         <div className="mb-8">
             <h2 className="text-3xl font-bold font-serif mb-2 flex items-center justify-center gap-3"><Users size={32} className="text-secondary" /> Fase Clasificatoria</h2>
             <p className="text-text-muted">Selecciona 16 candidatos. Toca para excluir manualmente.</p>
         </div>
         <div className="flex-1 overflow-y-auto bg-bg border border-border p-6 rounded-3xl mb-8 relative shadow-inner">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tiendas.map((rest) => {
                    const isExcluded = excluidosManuales.includes(rest.id);
                    const isQualified = preliminarResult?.qualified.find(r => r.id === rest.id);
                    
                    let style = "border-white/5 cursor-pointer hover:bg-white/5";
                    let Icon = isExcluded ? UserMinus : HelpCircle;
                    let color = "text-text-muted";

                    if (isExcluded) style = "border-red-500/10 bg-black/20 opacity-50 grayscale";
                    
                    if (preliminarResult) {
                        if (isQualified) {
                            style = "border-green-500/50 bg-green-500/10 ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] opacity-100 scale-105 cursor-default";
                            Icon = UserCheck; color = "text-green-500";
                        } else {
                            style = isExcluded ? "border-gray-500/20 bg-black/40 opacity-30 grayscale" : "border-red-500/30 bg-red-500/5 opacity-40 grayscale scale-95";
                            Icon = isExcluded ? UserMinus : UserX;
                            color = isExcluded ? "text-text-muted" : "text-red-500";
                        }
                    }

                    return (
                        <div key={rest.id} onClick={() => !animandoPreliminar && !preliminarResult && setExcluidosManuales(p => p.includes(rest.id) ? p.filter(id => id !== rest.id) : [...p, rest.id])} className={`bg-surface p-3 flex items-center gap-3 transition-all duration-300 border rounded-2xl ${style}`}>
                           <div className="w-8 h-8 rounded-full bg-bg border border-white/10 overflow-hidden relative">
                              {rest.imagen_logo_url ? <img src={rest.imagen_logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-700"/>}
                              {isExcluded && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><XCircle size={16} className="text-white"/></div>}
                           </div>
                           <div className="text-left min-w-0 flex-1">
                              <p className={`text-xs font-bold truncate ${color} ${isExcluded ? 'line-through' : ''}`}>{rest.nombre}</p>
                           </div>
                           {(!preliminarResult || Icon !== HelpCircle) && <Icon size={14} className={color} />}
                        </div>
                    )
                })}
            </div>
            {animandoPreliminar && <div className="absolute inset-0 z-20 bg-bg/60 backdrop-blur-sm flex items-center justify-center"><RefreshCw size={48} className="text-primary animate-spin" /></div>}
         </div>
         <div className="flex justify-center">
            {!preliminarResult ? (
                 <Boton onClick={ejecutarPreliminar} disabled={animandoPreliminar} className="py-4 px-10 text-lg shadow-lg shadow-primary/20 w-full md:w-auto justify-center">{animandoPreliminar ? 'Sorteando...' : 'Iniciar Selección'}</Boton>
            ) : (
                 <Boton onClick={() => setFase('sorteo')} className="py-4 px-12 text-lg !bg-green-600 !text-white shadow-lg w-full md:w-auto justify-center">Continuar <ArrowRight className="ml-2" /></Boton>
            )}
         </div>
      </div>
    );
  }

  // SORTEO VIEW
  if (fase === 'sorteo') {
     return (
        <div className="flex flex-col items-center justify-center h-full animate-fadeIn text-center">
           <div className="relative w-32 h-32 mb-8">
                <div className={`absolute inset-0 bg-surface rounded-xl border border-white/10 flex items-center justify-center shadow-2xl ${isShuffling ? 'animate-bounce' : ''}`}>
                   <Shuffle size={48} className="text-text-main" />
                </div>
           </div>
           <h2 className="text-3xl font-bold font-serif mb-2">{isShuffling ? 'Sorteando Llaves...' : 'Participantes Definidos'}</h2>
           {!isShuffling && <Boton onClick={iniciarBracket} className="py-4 px-10 text-lg"><Grid className="mr-2" /> Generar Cuadrantes</Boton>}
        </div>
     );
  }

  // BRACKET VIEW
  return (
    <div className="w-full animate-fadeIn flex flex-col h-full">
       <div className="mb-8 flex justify-between items-end">
          <div><h2 className="text-3xl font-bold font-serif flex items-center gap-3"><Trophy className="text-secondary" /> Copa Mercado Liebre</h2></div>
          <div className="text-right hidden md:block"><span className="text-xs font-bold uppercase text-text-muted">Progreso</span><div className="w-32 h-2 bg-surface rounded-full mt-1 border border-white/5"><div className="h-full bg-secondary rounded-full" style={{ width: `${(matches.filter(m => m.winner).length / matches.length) * 100}%` }}></div></div></div>
       </div>
       <div className="flex flex-col lg:flex-row gap-8 h-full overflow-hidden">
          <div className="flex-1 bg-bg border border-border p-4 md:p-6 rounded-3xl overflow-auto relative shadow-inner">
             <div className="min-w-[1200px] min-h-[800px] h-full flex items-center justify-center p-8">
                
                {/* Visual Bracket */}
                <div className="flex items-stretch justify-center gap-10 h-full py-8">
                    {/* Left: Octavos -> Cuartos */}
                    {['Octavos', 'Cuartos'].map((title, idx) => (
                        <div key={'L'+idx} className="flex flex-col h-full w-36 justify-around">
                             {matches.filter(m => m.round === idx+1).slice(0, idx===0?4:2).map(m => <MatchCard key={m.id} match={m} isActive={m.id===currentMatchId}/>)}
                        </div>
                    ))}
                    
                    {/* Semis L */}
                    <div className="flex flex-col h-full w-36 justify-center"><MatchCard match={matches.filter(m => m.round===3)[0]} isActive={matches.filter(m => m.round===3)[0].id===currentMatchId}/></div>
                    
                    {/* CENTER: FINAL & 3rd PLACE */}
                    <div className="flex flex-col justify-center items-center h-full px-4 gap-12">
                        {/* Final */}
                        <div className="scale-125 relative">
                            <MatchCard match={matches.find(m => m.round===4)!} isActive={matches.find(m => m.round===4)!.id===currentMatchId} label="FINAL" />
                        </div>
                        
                        {/* 3rd Place */}
                        <div className="scale-100 opacity-90">
                             <MatchCard match={matches.find(m => m.round===0)!} isActive={matches.find(m => m.round===0)!.id===currentMatchId} label="3er Puesto" />
                        </div>
                    </div>
                    
                    {/* Semis R */}
                    <div className="flex flex-col h-full w-36 justify-center"><MatchCard match={matches.filter(m => m.round===3)[1]} isActive={matches.filter(m => m.round===3)[1].id===currentMatchId}/></div>
                    
                    {/* Right: Cuartos -> Octavos */}
                    {['Cuartos', 'Octavos'].map((title, idx) => (
                         <div key={'R'+idx} className="flex flex-col h-full w-36 justify-around">
                             {matches.filter(m => m.round === (idx===0?2:1)).slice(idx===0?2:4, idx===0?4:8).map(m => <MatchCard key={m.id} match={m} isActive={m.id===currentMatchId}/>)}
                        </div>
                    ))}
                </div>

             </div>
          </div>
          <div className="w-full lg:w-80 flex-shrink-0">
             {matches.find(m => m.id === currentMatchId) ? <ControlPartido match={matches.find(m => m.id === currentMatchId)!} onResolve={resolverMatch} /> : <div className="h-full bg-surface border border-border rounded-3xl shadow-sm flex items-center justify-center p-8"><div><Trophy size={48} className="mx-auto text-yellow-500 mb-4"/><h3 className="text-xl font-bold">¡Torneo Finalizado!</h3></div></div>}
          </div>
       </div>
    </div>
  );
};