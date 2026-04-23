import React from 'react';
import { Tema, EstiloPlantilla } from '../../tipos';
import { Clock3, Layout, Grid, List, Check } from 'lucide-react';

interface SeccionDisenoProps {
    tema: Tema;
    aplicarTema: (t: Partial<Tema>) => void;
    guardando: boolean;
}

const ARQUETIPOS: { id: EstiloPlantilla; nombre: string; icono: React.ReactNode; desc: string }[] = [
    { id: 'moderno', nombre: 'Moderno (App)', icono: <Grid size={36}/>, desc: 'Tarjetas neumórficas con imágenes grandes. Ideal para todo tipo.' },
    { id: 'carta', nombre: 'Lista Elegante', icono: <List size={24}/>, desc: 'Estilo clásico elegante. Imágenes circulares y tipografía Serif.' },
];

const PALETAS_PREDEFINIDAS = [
    { nombre: 'Mercado (Recomendado)', colores: { color_primario: '#FFE600', color_secundario: '#3483FA', color_fondo: '#EBEBEB', color_texto: '#333333' } },
    { nombre: 'Minimalista', colores: { color_primario: '#000000', color_secundario: '#4B5563', color_fondo: '#E5E7EB', color_texto: '#0F172A' } },
    { nombre: 'Lujo Gold', colores: { color_primario: '#D4AF37', color_secundario: '#1F2937', color_fondo: '#FFFFFF', color_texto: '#111827' } },
    { nombre: 'Orgánico', colores: { color_primario: '#4F772D', color_secundario: '#90A955', color_fondo: '#FAFBF6', color_texto: '#132A13' } },
    { nombre: 'Fuego', colores: { color_primario: '#D90429', color_secundario: '#EF233C', color_fondo: '#FFFFFF', color_texto: '#2B2D42' } },
    { nombre: 'Océano', colores: { color_primario: '#0077B6', color_secundario: '#48CAE4', color_fondo: '#F0F9FF', color_texto: '#023E8A' } },
    { nombre: 'Café Latte', colores: { color_primario: '#6F4E37', color_secundario: '#A67B5B', color_fondo: '#FFFCF9', color_texto: '#4A3B32' } },
    { nombre: 'Vino Tinto', colores: { color_primario: '#7209B7', color_secundario: '#B5179E', color_fondo: '#FFFFFF', color_texto: '#240046' } },
    { nombre: 'Pastel', colores: { color_primario: '#FF8FAB', color_secundario: '#FFC2D1', color_fondo: '#FFF5F7', color_texto: '#590D22' } },
    { nombre: 'Mediterráneo', colores: { color_primario: '#2A9D8F', color_secundario: '#E9C46A', color_fondo: '#FFFFFF', color_texto: '#264653' } },
    { nombre: 'Lima Urbana', colores: { color_primario: '#84CC16', color_secundario: '#3F3F46', color_fondo: '#FFFFFF', color_texto: '#18181B' } }, 
    { nombre: 'Sunset', colores: { color_primario: '#FB5607', color_secundario: '#8338EC', color_fondo: '#FFFFFF', color_texto: '#3A0CA3' } },
];

export const SeccionDiseno: React.FC<SeccionDisenoProps> = ({ tema, aplicarTema, guardando }) => {
    return (
        <div className="animate-fadeIn space-y-12">
            
            {/* SECCIÓN ARQUETIPOS */}
            <section>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-serif font-bold text-text-main mb-2 flex items-center justify-center gap-2"><Layout /> Estructura del Sitio</h2>
                    <p className="text-text-muted text-lg">¿Cómo quieres que se vea tu catálogo?</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6 justify-center">
                    {ARQUETIPOS.map((arq) => {
                        const isSelected = tema.estilo_plantilla === arq.id || (!tema.estilo_plantilla && arq.id === 'moderno');
                        return (
                            <button
                                key={arq.id}
                                onClick={() => aplicarTema({ estilo_plantilla: arq.id })}
                                disabled={guardando}
                                className={`bg-surface p-6 rounded-2xl text-left transition-all duration-300 relative group border shadow-sm
                                    ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}
                                `}
                            >
                                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${isSelected ? 'bg-primary text-white shadow-lg' : 'bg-bg text-text-muted'}`}>
                                    {arq.icono}
                                </div>
                                <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-primary' : 'text-text-main'}`}>{arq.nombre}</h3>
                                <p className="text-sm text-text-muted">{arq.desc}</p>
                                {isSelected && <div className="absolute top-4 right-4 text-primary"><Check size={20}/></div>}
                            </button>
                        );
                    })}
                </div>
            </section>

            <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            {/* SECCIÓN PALETAS */}
            <section>
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-serif font-bold text-text-main mb-2">Paleta de Colores</h2>
                    <p className="text-text-muted text-lg">Define la personalidad de tu marca.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {PALETAS_PREDEFINIDAS.map((p, idx) => {
                        const isActive = tema.color_primario === p.colores.color_primario && tema.color_secundario === p.colores.color_secundario;
                        return (
                            <button 
                                key={idx}
                                onClick={() => aplicarTema(p.colores)}
                                disabled={guardando}
                                className={`relative group bg-surface rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border text-left shadow-sm
                                ${isActive ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-border dark:border-white/5 hover:border-primary/30'}
                                `}
                            >
                                <div className="h-24 w-full flex flex-col">
                                    <div className="flex-1 flex">
                                        <div className="flex-1 flex items-center justify-center relative" style={{background: p.colores.color_fondo}}>
                                            <span className="text-xs font-bold z-10" style={{color: p.colores.color_texto}}>Muestra</span>
                                        </div>
                                    </div>
                                    <div className="h-8 flex">
                                        <div className="flex-1 flex items-center justify-center" style={{background: p.colores.color_primario}}></div>
                                        <div className="w-1/3 flex items-center justify-center" style={{background: p.colores.color_secundario}}></div>
                                    </div>
                                </div>

                                <div className="p-4 bg-bg flex justify-between items-center">
                                    <span className={`font-bold text-sm ${isActive ? 'text-primary' : 'text-text-main'}`}>{p.nombre}</span>
                                    {isActive && <div className="bg-primary text-white p-1 rounded-full"><Check size={14} strokeWidth={3} /></div>}
                                </div>
                                
                                {guardando && isActive && (
                                    <div className="absolute inset-0 bg-bg/50 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>
            
            <div className="flex justify-center mt-8">
                <p className="text-xs text-text-muted flex items-center gap-2 bg-surface px-4 py-2 rounded-full border border-white/5 shadow-sm">
                    <Clock3 size={14} /> Los cambios se aplican inmediatamente.
                </p>
            </div>
        </div>
    );
};