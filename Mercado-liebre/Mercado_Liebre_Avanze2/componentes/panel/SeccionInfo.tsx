
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tienda } from '../../tipos';
import { TiendaSchema, TiendaFormValues } from '../../tipos/esquemas';
import { Tarjeta, Input, Textarea, LogoWhatsApp } from '../ui';
import { Store, Upload, MapPin, Phone, Mail, Globe, Wand2, MessageCircle, Facebook, Instagram, Clock, CalendarDays, AlertTriangle, SpellCheck, Loader2, Save, CheckCircle2, XCircle, AlertOctagon } from 'lucide-react';
import { LIMITES } from '../../constantes';

interface SeccionInfoProps {
    tienda: Tienda;
    setTienda: (r: Tienda) => void;
    guardarTienda: (datos?: Partial<Tienda>) => Promise<void>;
    handleImagenUpload: (e: React.ChangeEvent<HTMLInputElement>, campo: 'logo' | 'banner') => Promise<void>;
    sugerirIA: (prompt: string, setter: (val: string) => void) => Promise<void>;
    guardando: boolean;
    mostrarMensaje: (tipo: 'exito' | 'error', texto: string) => void;
}

const DIAS_UI = [
    { key: 'lunes', label: 'L' },
    { key: 'martes', label: 'M' },
    { key: 'miercoles', label: 'X' },
    { key: 'jueves', label: 'J' },
    { key: 'viernes', label: 'V' },
    { key: 'sabado', label: 'S' },
    { key: 'domingo', label: 'D' },
] as const;

export const SeccionInfo: React.FC<SeccionInfoProps> = ({ 
    tienda, setTienda, guardarTienda, handleImagenUpload, sugerirIA, guardando, mostrarMensaje 
}) => {
    
    // --- REACT HOOK FORM SETUP ---
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TiendaFormValues>({
        resolver: zodResolver(TiendaSchema),
        defaultValues: {
            ...tienda,
            dias_abierto: tienda.dias_abierto || {
                lunes: true, martes: true, miercoles: true, jueves: true, viernes: true, sabado: true, domingo: false
            }
        },
        mode: 'onBlur'
    });

    // Sincronizar form si el tienda cambia externamente (ej. carga inicial)
    useEffect(() => {
        if (tienda) {
            Object.keys(tienda).forEach((key) => {
                setValue(key as any, (tienda as any)[key]);
            });
        }
    }, [tienda, setValue]);

    const [direccionParts, setDireccionParts] = useState({
        tipo: 'Calle', n1: '', n2: '', n3: '', barrio: ''
    });
    const [estadosGuardado, setEstadosGuardado] = useState<Record<string, 'cargando' | 'exito' | null>>({});
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [imgLoading, setImgLoading] = useState<{ logo: boolean, banner: boolean }>({ logo: false, banner: false });

    // Parsear dirección inicial
    useEffect(() => {
        if (tienda?.direccion) {
           const parts = tienda.direccion.match(/^(\w+)\s+([A-Za-z0-9]+)\s+#\s+([A-Za-z0-9]+)\s+-\s+([A-Za-z0-9]+)(?:,\s*(.+))?$/);
           if (parts) {
             setDireccionParts({
               tipo: parts[1], n1: parts[2], n2: parts[3], n3: parts[4], barrio: parts[5] || ''
             });
           }
        }
    }, [tienda.id]);

    // Función genérica para guardar campo individual
    const guardarCampo = async (campo: keyof TiendaFormValues, valor: any) => {
        setEstadosGuardado(prev => ({ ...prev, [campo]: 'cargando' } as Record<string, 'cargando' | 'exito' | null>));
        try {
            await guardarTienda({ [campo]: valor });
            setTienda({ ...tienda, [campo]: valor }); // Actualizar estado padre
            setEstadosGuardado(prev => ({ ...prev, [campo]: 'exito' } as Record<string, 'cargando' | 'exito' | null>));
            setTimeout(() => setEstadosGuardado(prev => ({ ...prev, [campo]: null } as Record<string, 'cargando' | 'exito' | null>)), 2000);
        } catch (error) {
            setEstadosGuardado(prev => ({ ...prev, [campo]: null } as Record<string, 'cargando' | 'exito' | null>));
            mostrarMensaje('error', 'Error al guardar campo');
        }
    };

    // Enmascarar entrada numérica (solo números, max 10)
    const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: keyof TiendaFormValues) => {
        // Remover todo lo que no sea número
        const val = e.target.value.replace(/\D/g, '');
        // Limitar a 10 caracteres
        const finalVal = val.slice(0, 10);
        // Actualizar valor en el formulario y disparar render
        setValue(field, finalVal, { shouldDirty: true, shouldValidate: true });
    };

    // Lógica especial para el nombre (retraso 6s)
    const handleNombreBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val !== tienda.nombre) {
            setEstadosGuardado(prev => ({ ...prev, nombre: 'cargando' } as Record<string, 'cargando' | 'exito' | null>)); // Feedback visual inmediato de espera
            setTimeout(() => {
                guardarCampo('nombre', val);
            }, 6000);
        }
    };

    const handleDireccionChange = (field: 'tipo' | 'n1' | 'n2' | 'n3' | 'barrio', value: string) => {
        if ((field === 'n1' || field === 'n2' || field === 'n3') && !/^\d{0,4}[a-zA-Z]?$/.test(value)) return;
        const finalValue = field === 'barrio' ? value.charAt(0).toUpperCase() + value.slice(1) : value;
        const newParts = { ...direccionParts, [field]: finalValue };
        setDireccionParts(newParts);
        
        const barrioSuffix = newParts.barrio ? `, ${newParts.barrio}` : '';
        const fullDireccion = `${newParts.tipo} ${newParts.n1} # ${newParts.n2} - ${newParts.n3}${barrioSuffix}`;
        
        setValue('direccion', fullDireccion); // Actualizar form interno
    };

    const confirmarDireccion = () => {
        const fullDireccion = watch('direccion');
        if (fullDireccion) guardarCampo('direccion', fullDireccion);
    };

    const toggleDia = (key: string) => {
        const currentDias = watch('dias_abierto') || {
            lunes: true, martes: true, miercoles: true, jueves: true, viernes: true, sabado: true, domingo: false
        };
        const nuevosDias = { ...currentDias, [key]: !((currentDias as any)[key]) };
        setValue('dias_abierto', nuevosDias as any);
        guardarCampo('dias_abierto', nuevosDias);
    };

    const wrapImagenUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'logo' | 'banner') => {
        setImgLoading(prev => ({ ...prev, [tipo]: true }));
        try {
            await handleImagenUpload(e, tipo);
        } finally {
            setImgLoading(prev => ({ ...prev, [tipo]: false }));
        }
    };

    // --- IA FUNCTIONS ---
    const runIA = async (actionName: string, logic: () => Promise<void>) => {
        setLoadingAction(actionName);
        await logic();
        setLoadingAction(null);
    };

    const iaOrtografiaNombre = () => runIA('ortografia_nombre', () => sugerirIA(
        `Actúa como un corrector ortográfico. Tu ÚNICA tarea es revisar el nombre del tienda: "${watch('nombre')}".
        Reglas CRÍTICAS:
        1. Nombres como "Fogonzo", "Rappi" son MARCAS VÁLIDAS. NO LOS CORRIJAS.
        2. Solo corrige errores ortográficos obvios.
        3. NO agregues explicaciones.`,
        (val) => { 
            const nombreLimpio = val.trim();
            if (nombreLimpio && nombreLimpio !== watch('nombre')) {
                 setValue('nombre', nombreLimpio);
                 guardarCampo('nombre', nombreLimpio);
            }
        }
    ));

    const sugerirEslogan = () => runIA('eslogan', () => sugerirIA(
        `Eslogan corto, memorable y lujoso para "${watch('nombre')}". Máximo 6 palabras.`,
        (val) => { setValue('eslogan', val); guardarCampo('eslogan', val); }
    ));

    const sugerirDescripcion = () => runIA('descripcion', () => sugerirIA(
        `Descripción acogedora para "${watch('nombre')}". Máximo 300 caracteres.`,
        (val) => { setValue('descripcion', val); guardarCampo('descripcion', val); }
    ));

    // --- CÁLCULO DE ESTADO DE PUBLICACIÓN ---
    const camposObligatorios = [
        { k: 'nombre', l: 'Nombre' },
        { k: 'eslogan', l: 'Eslogan' },
        { k: 'descripcion', l: 'Descripción' },
        { k: 'imagen_logo_url', l: 'Logo' },
        { k: 'imagen_banner_url', l: 'Banner' },
        { k: 'telefono', l: 'Teléfono' },
        { k: 'email', l: 'Email' },
        { k: 'direccion', l: 'Dirección' },
        { k: 'ciudad', l: 'Ciudad' },
        { k: 'whatsapp', l: 'WhatsApp' },
        { k: 'horario_apertura', l: 'Horario Apertura' },
        { k: 'horario_cierre', l: 'Horario Cierre' },
        { k: 'dias_abierto', l: 'Días de Servicio' }
    ];

    const faltantes = camposObligatorios.filter(c => {
        const val = tienda[c.k as keyof Tienda];
        
        // Validación especial para días abierto: debe tener al menos un día en true
        if (c.k === 'dias_abierto') {
            if (!val) return true;
            const dias = val as Record<string, boolean>;
            // Retorna true (es faltante) si NO hay ningún día seleccionado
            return !Object.values(dias).some(v => v === true);
        }

        // Validación estándar
        return !val || val.toString().trim() === '';
    });

    const estaPublicado = faltantes.length === 0;

    return (
        <div className="animate-fadeIn space-y-8 pb-10">
            {/* Panel de Estado de Publicación */}
            <div className={`p-4 md:p-6 border-l-4 rounded-xl transition-all duration-500 shadow-sm ${estaPublicado ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'}`}>
                <div className="flex flex-col md:flex-row items-start gap-4">
                    <div className={`p-3 rounded-full shadow-sm shrink-0 ${estaPublicado ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {estaPublicado ? <CheckCircle2 size={36} /> : <AlertOctagon size={24} />}
                    </div>
                    <div className="w-full">
                        <h3 className={`text-lg font-bold mb-1 ${estaPublicado ? 'text-green-600' : 'text-red-600'}`}>
                            {estaPublicado ? 'Sitio Publicado y Visible' : 'Sitio NO Publicado'}
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                            {estaPublicado 
                                ? '¡Excelente! Tu tienda cumple con todos los requisitos y está visible para tus clientes.'
                                : 'Para que tu sitio sea visible al público, debes completar todos los campos marcados con (*) y seleccionar al menos un día de servicio.'
                            }
                        </p>
                        {!estaPublicado && (
                            <div className="mt-3 p-3 bg-surface/50 rounded-xl border border-red-500/10 w-full">
                                <p className="text-xs font-bold text-red-500 mb-2 uppercase tracking-wider">Falta completar:</p>
                                <div className="flex flex-wrap gap-2">
                                    {faltantes.map(f => (
                                        <span key={f.k} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-md font-bold border border-red-500/20">
                                            {f.l}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Alerta de Errores de Validación del Formulario */}
            {Object.keys(errors).length > 0 && (
                <div className="p-4 border-l-4 border-orange-500 bg-orange-500/5 rounded-xl flex items-start gap-3 animate-fadeIn shadow-sm">
                    <AlertTriangle className="text-orange-500 flex-shrink-0" size={24} />
                    <div>
                        <h3 className="font-bold text-orange-600">Datos inválidos</h3>
                        <ul className="text-sm text-text-muted list-disc pl-4">
                            {Object.values(errors).map((e: any, i) => <li key={i}>{e.message}</li>)}
                        </ul>
                    </div>
                </div>
            )}

            <form onSubmit={(e) => e.preventDefault()}>
                <section>
                    <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><Store size={20}/> Información Básica</h2>
                    <Tarjeta className="space-y-6 border border-white/5">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2 ml-1 flex justify-between items-center">
                                    <span>Nombre <span className="text-red-500">*</span></span>
                                    <button type="button" onClick={iaOrtografiaNombre} className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-lg border border-blue-500/20 flex gap-1">
                                        {loadingAction === 'ortografia_nombre' ? <Loader2 size={12} className="animate-spin"/> : <SpellCheck size={12}/>} Ortografía
                                    </button>
                                </label>
                                <Input 
                                    {...register('nombre')}
                                    onBlur={handleNombreBlur}
                                    placeholder="Ej. La Sazón de la Abuela"
                                    maxLength={LIMITES.REST_NOMBRE}
                                    estadoGuardado={estadosGuardado['nombre']}
                                    className={errors.nombre ? "border-red-500/50" : ""}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2 ml-1 flex justify-between items-center">
                                    <span>Eslogan <span className="text-red-500">*</span></span>
                                    <button type="button" onClick={sugerirEslogan} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg border border-primary/20 flex gap-1">
                                        {loadingAction === 'eslogan' ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} IA
                                    </button>
                                </label>
                                <Input 
                                    {...register('eslogan', { onBlur: (e) => guardarCampo('eslogan', e.target.value) })}
                                    placeholder="Ej. Tradición en cada bocado"
                                    maxLength={LIMITES.REST_ESLOGAN}
                                    estadoGuardado={estadosGuardado['eslogan']}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2 ml-1 flex justify-between items-center">
                                 <span>Descripción <span className="text-red-500">*</span></span>
                                 <button type="button" onClick={sugerirDescripcion} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg border border-primary/20 flex gap-1">
                                    {loadingAction === 'descripcion' ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} IA
                                 </button>
                            </label>
                            <Textarea 
                                {...register('descripcion', { onBlur: (e) => guardarCampo('descripcion', e.target.value) })}
                                placeholder="Describe tu tienda..."
                                maxLength={LIMITES.REST_DESC}
                                estadoGuardado={estadosGuardado['descripcion']}
                            />
                        </div>
                    </Tarjeta>
                </section>

                <section className="mt-8">
                    <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><Upload size={20}/> Imágenes Obligatorias</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Tarjeta className={`flex flex-col items-center gap-4 border transition-colors ${!tienda.imagen_logo_url ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'}`}>
                            <span className="text-sm font-medium text-text-muted flex items-center gap-1">
                                Logo <span className="text-red-500">*</span>
                            </span>
                            <div className="relative">
                                {tienda.imagen_logo_url ? (
                                    <img src={tienda.imagen_logo_url || undefined} className="w-32 h-32 rounded-full object-cover shadow-xl border-4 border-surface" alt="Logo" />
                                ) : <div className="w-32 h-32 rounded-full bg-surface border-2 border-dashed border-gray-500/20 flex items-center justify-center text-xs text-center p-2">Sin Logo</div>}
                                {imgLoading.logo && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"><Loader2 size={32} className="text-white animate-spin" /></div>}
                            </div>
                            <label className="cursor-pointer bg-bg border border-border px-4 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-surface transition-all shadow-sm group">
                                <Upload size={14} className="group-hover:scale-110 transition-transform" /> Subir Logo
                                <input type="file" className="hidden" accept="image/*" onChange={e => wrapImagenUpload(e, 'logo')} />
                            </label>
                        </Tarjeta>
                        <Tarjeta className={`flex flex-col items-center gap-4 border transition-colors ${!tienda.imagen_banner_url ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'}`}>
                            <span className="text-sm font-medium text-text-muted flex items-center gap-1">
                                Banner <span className="text-red-500">*</span>
                            </span>
                            <div className="relative w-full">
                                {tienda.imagen_banner_url ? (
                                    <img src={tienda.imagen_banner_url || undefined} className="w-full h-32 rounded-xl object-cover shadow-xl border-2 border-surface" alt="Banner" />
                                ) : <div className="w-full h-32 rounded-xl bg-surface border-2 border-dashed border-gray-500/20 flex items-center justify-center text-xs">Sin Banner</div>}
                                {imgLoading.banner && <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center"><Loader2 size={32} className="text-white animate-spin" /></div>}
                            </div>
                            <label className="cursor-pointer bg-bg border border-border px-4 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-surface transition-all shadow-sm group">
                                <Upload size={14} className="group-hover:scale-110 transition-transform" /> Subir Banner
                                <input type="file" className="hidden" accept="image/*" onChange={e => wrapImagenUpload(e, 'banner')} />
                            </label>
                        </Tarjeta>
                    </div>
                </section>

                <section className="mt-8">
                    <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><MapPin size={20}/> Ubicación y Contacto</h2>
                    <Tarjeta className="border border-white/5 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2 ml-1">Teléfono <span className="text-red-500">*</span> <span className="text-xs opacity-70">(10 dígitos)</span></label>
                                <Input 
                                    {...register('telefono')}
                                    onChange={(e) => handleNumericInput(e, 'telefono')}
                                    onBlur={(e) => guardarCampo('telefono', e.target.value)}
                                    value={watch('telefono') || ''}
                                    icon={<Phone/>} 
                                    type="tel" 
                                    prefix="+57"
                                    maxLength={LIMITES.REST_TELEFONO}
                                    estadoGuardado={estadosGuardado['telefono']}
                                    className={errors.telefono ? "border-red-500/50" : ""}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2 ml-1">Email <span className="text-red-500">*</span></label>
                                <Input 
                                    {...register('email', { onBlur: (e) => guardarCampo('email', e.target.value) })}
                                    type="email"
                                    icon={<Mail/>} 
                                    maxLength={LIMITES.REST_EMAIL}
                                    estadoGuardado={estadosGuardado['email']}
                                    className={errors.email ? "border-red-500/50" : ""}
                                />
                            </div>
                        </div>
                        
                        <div>
                           <label className="block text-sm font-medium text-text-muted mb-2 ml-1">Dirección <span className="text-red-500">*</span></label>
                           <div className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-bg border border-border p-2 rounded-xl mb-3" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) confirmarDireccion(); }}>
                              <select value={direccionParts.tipo} onChange={(e) => handleDireccionChange('tipo', e.target.value)} className="bg-transparent text-text-main font-bold outline-none p-2 cursor-pointer w-24">
                                 {['Calle', 'Carrera', 'Avenida', 'Transversal'].map(t => <option key={t} className="bg-surface text-text-main" value={t}>{t}</option>)}
                              </select>
                              <input type="text" value={direccionParts.n1} onChange={(e) => handleDireccionChange('n1', e.target.value)} placeholder="Num" maxLength={LIMITES.ADDR_NUM} className="bg-transparent w-16 text-center border-b border-white/10 focus:border-primary outline-none"/>
                              <span className="font-bold text-primary">#</span>
                              <input type="text" value={direccionParts.n2} onChange={(e) => handleDireccionChange('n2', e.target.value)} placeholder="Num" maxLength={LIMITES.ADDR_NUM} className="bg-transparent w-16 text-center border-b border-white/10 focus:border-primary outline-none"/>
                              <span className="font-bold text-text-muted">-</span>
                              <input type="text" value={direccionParts.n3} onChange={(e) => handleDireccionChange('n3', e.target.value)} placeholder="Num" maxLength={LIMITES.ADDR_NUM} className="bg-transparent w-16 text-center border-b border-white/10 focus:border-primary outline-none"/>
                              <input type="text" value={direccionParts.barrio} onChange={(e) => handleDireccionChange('barrio', e.target.value)} placeholder="Barrio" maxLength={LIMITES.ADDR_TEXT} className="bg-transparent flex-1 min-w-[120px] text-left border-b border-white/10 focus:border-primary outline-none px-2"/>
                           </div>
                           {estadosGuardado['direccion'] === 'exito' && <span className="text-green-500 text-xs font-bold ml-2">Dirección guardada</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2 ml-1">Ciudad <span className="text-red-500">*</span></label>
                            <Input 
                                {...register('ciudad', { onBlur: (e) => guardarCampo('ciudad', e.target.value) })}
                                placeholder="Ej. Bogotá"
                                maxLength={LIMITES.REST_CIUDAD}
                                estadoGuardado={estadosGuardado['ciudad']}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2 ml-1">WhatsApp Business <span className="text-red-500">*</span> <span className="text-xs opacity-70">(10 dígitos)</span></label>
                            <Input 
                                {...register('whatsapp')}
                                onChange={(e) => handleNumericInput(e, 'whatsapp')}
                                onBlur={(e) => guardarCampo('whatsapp', e.target.value)}
                                value={watch('whatsapp') || ''}
                                icon={<LogoWhatsApp className="w-6 h-6 text-text-muted" />} 
                                type="tel"
                                prefix="+57"
                                maxLength={LIMITES.REST_TELEFONO}
                                className={errors.whatsapp ? 'border-red-500/50' : ''}
                                estadoGuardado={estadosGuardado['whatsapp']}
                            />
                        </div>
                    </Tarjeta>
                </section>

                <section className="mt-8">
                    <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><Clock size={20}/> Horarios</h2>
                    <Tarjeta className="space-y-6 border border-white/5">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2 ml-1">Apertura <span className="text-red-500">*</span></label>
                                <Input 
                                    type="time"
                                    {...register('horario_apertura', { onBlur: (e) => guardarCampo('horario_apertura', e.target.value) })}
                                    icon={<Clock size={16} />}
                                    estadoGuardado={estadosGuardado['horario_apertura']}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2 ml-1">Cierre <span className="text-red-500">*</span></label>
                                <Input 
                                    type="time"
                                    {...register('horario_cierre', { onBlur: (e) => guardarCampo('horario_cierre', e.target.value) })}
                                    icon={<Clock size={16} />}
                                    estadoGuardado={estadosGuardado['horario_cierre']}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-3 ml-1 flex items-center gap-2">
                                <CalendarDays size={16} /> Días de Servicio <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {DIAS_UI.map((dia) => {
                                    const isOpen = watch(`dias_abierto.${dia.key}`);
                                    return (
                                        <button
                                            key={dia.key}
                                            type="button"
                                            onClick={() => toggleDia(dia.key as any)}
                                            className={`
                                                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm
                                                ${isOpen 
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' 
                                                    : 'bg-surface border border-white/10 text-text-muted hover:bg-white/5'
                                                }
                                            `}
                                        >
                                            {dia.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </Tarjeta>
                </section>
            </form>
        </div>
    );
};
