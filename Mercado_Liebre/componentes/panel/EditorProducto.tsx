
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Producto } from '../../tipos';
import { ProductoSchema, ProductoFormValues } from '../../tipos/esquemas';
import { Boton, Input, Textarea, Tarjeta } from '../ui';
import { Wand2, DollarSign, Upload, EyeOff, Save, Power, AlertCircle, SpellCheck, Loader2 } from 'lucide-react';
import { LIMITES } from '../../constantes';

interface EditorProductoProps {
    producto: Partial<Producto>;
    setProducto: Dispatch<SetStateAction<Partial<Producto> | null>>;
    guardar: (p: Partial<Producto>) => void;
    cancelar: () => void;
    sugerirIA: (prompt: string, setter: (val: string) => void) => Promise<void>;
    handleImagenUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    guardando: boolean;
    tiendaNombre: string;
}

const CATEGORIAS_ESTANDAR = [
    "Electrónica", "Ropa", "Hogar y Jardín", "Salud y Belleza", "Deportes", "Juguetes", 
    "Automotriz", "Libros", "Mascotas", "Alimentos y Bebidas", "Muebles", "Herramientas", 
    "Accesorios", "Joyas", "Calzado", "Servicios", "Cuidado Personal", "Fitness", 
    "Cocina", "Oficina", "Tecnología", "Otro"
].sort();

export const EditorProducto: React.FC<EditorProductoProps> = ({ 
    producto, setProducto, guardar, cancelar, sugerirIA, handleImagenUpload, guardando, tiendaNombre 
}) => {
    
    // --- SETUP REACT HOOK FORM ---
    const { register, handleSubmit, setValue, watch, formState: { errors }, trigger } = useForm<ProductoFormValues>({
        resolver: zodResolver(ProductoSchema),
        defaultValues: {
            nombre: producto.nombre || '',
            descripcion: producto.descripcion || '',
            precio: producto.precio || 0,
            categoria: producto.categoria || '',
            imagen_url: producto.imagen_url || '',
            caracteristicas: producto.caracteristicas || [],
            visible: producto.visible !== false,
            disponible: producto.disponible !== false,
            destacado: producto.destacado || false
        }
    });

    const [caracteristicasTemp, setCaracterísticasTemp] = useState(producto.caracteristicas?.join(', ') || '');
    const [precioDisplay, setPrecioDisplay] = useState(producto.precio ? producto.precio.toLocaleString('es-CO') : '');
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState(false);

    const formValues = watch();

    const onSubmit = (data: ProductoFormValues) => {
        // Limpiar caracteristicas finales antes de guardar
        const rawIng = caracteristicasTemp.split(',').map(i => i.trim()).filter(Boolean);
        // Filtrar caracteres no permitidos en caracteristicas una última vez
        const cleanIng = rawIng.map(i => i.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, ''));
        
        const finalData = { ...data, caracteristicas: cleanIng };
        guardar({ ...producto, ...finalData });
    };

    // --- VALIDACIÓN EN TIEMPO REAL (INPUT MASKING) ---

    // Nombre: Solo letras y espacios
    const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(val)) {
            setValue('nombre', val);
            trigger('nombre');
        }
    };

    // Descripción: Letras, números, espacios, puntos y comas
    const handleDescripcionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        if (/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,]*$/.test(val)) {
            setValue('descripcion', val);
            trigger('descripcion');
        }
    };

    // Características: Letras, números y comas (para separar)
    const handleCaracterísticasInput = (val: string) => {
        // Permitimos comas para separar visualmente, pero el regex interno valida cada item
        if (/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s,]*$/.test(val)) {
            const valCap = val.charAt(0).toUpperCase() + val.slice(1);
            setCaracterísticasTemp(valCap);
            // Actualizar el array en el formulario para validación de esquema
            const arrayIng = valCap.split(',').map(i => i.trim()).filter(Boolean);
            setValue('caracteristicas', arrayIng);
            trigger('caracteristicas');
        }
    };

    // Precio: Solo números, formato con puntos
    const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Eliminar todo lo que no sea número
        const rawVal = e.target.value.replace(/\D/g, '');
        
        if (rawVal === '') {
            setPrecioDisplay('');
            setValue('precio', 0);
            return;
        }

        const numVal = parseInt(rawVal, 10);
        
        // Limite duro de UI para no romper formato (opcional, esquema ya valida 200k)
        if (numVal > 9999999) return; 

        // Formatear con puntos
        const formatted = numVal.toLocaleString('es-CO');
        setPrecioDisplay(formatted);
        setValue('precio', numVal);
        trigger('precio'); // Disparar validación (min 1000, max 200000)
    };

    const onImageWrapperChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoadingImage(true);
        try {
            await handleImagenUpload(e);
        } finally {
            setLoadingImage(false);
        }
    };

    useEffect(() => {
        if (producto.imagen_url) {
            setValue('imagen_url', producto.imagen_url);
            trigger('imagen_url');
        }
    }, [producto.imagen_url, setValue, trigger]);


    // --- IA ---
    const runIA = async (actionName: string, logic: () => Promise<void>) => {
        setLoadingAction(actionName);
        await logic();
        setLoadingAction(null);
    };

    const iaOrtografia = () => runIA('ortografia', () => sugerirIA(
        `Corrige ortografía del producto: "${watch('nombre')}". Devuelve SOLO texto, sin números ni símbolos raros.`,
        (val) => {
            const clean = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            setValue('nombre', clean);
        }
    ));

    const iaDesc = () => runIA('descripcion', () => sugerirIA(
        `Descripción corta para "${watch('nombre')}" con caracteristicas: "${caracteristicasTemp}". Max ${LIMITES.PLATILLO_DESC} chars. Solo letras y números.`,
        (val) => {
            const clean = val.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,]/g, '');
            setValue('descripcion', clean);
        }
    ));

    const iaIng = () => runIA('caracteristicas', () => sugerirIA(
        `5 caracteristicas para "${watch('nombre')}". Separados por coma. Solo letras y números.`,
        (val) => {
            const clean = val.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s,]/g, '');
            handleCaracterísticasInput(clean);
        }
    ));

    return (
        <div className="animate-fadeIn grid lg:grid-cols-2 gap-8 mb-12">
            <div className="space-y-8">
                <section>
                    <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                        {producto.id ? 'Editar Información' : 'Nuevo Producto'}
                    </h3>
                    <Tarjeta className="space-y-6">
                        {/* NOMBRE */}
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2 ml-1 flex justify-between items-center">
                                <span>Nombre del Producto <span className="text-red-500">*</span> <span className="text-[10px] text-text-muted ml-2">(Solo letras)</span></span>
                                {watch('nombre')?.length > 2 && (
                                    <button type="button" onClick={iaOrtografia} disabled={guardando} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg border border-primary/20 flex gap-1">
                                        {loadingAction === 'ortografia' ? <Loader2 size={12} className="animate-spin"/> : <SpellCheck size={12}/>} Ortografía
                                    </button>
                                )}
                            </label>
                            <Input 
                                value={watch('nombre')}
                                onChange={handleNombreChange}
                                placeholder="Ej: Camiseta Básica, Auriculares Inalámbricos..."
                                maxLength={LIMITES.PLATILLO_NOMBRE}
                                className={errors.nombre ? "!border-red-500 border-opacity-100" : ""}
                            />
                            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
                        </div>

                        {/* ESTADO */}
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2 ml-1">Estado</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button type="button" onClick={() => { setValue('visible', true); setValue('disponible', true); }} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${watch('visible') && watch('disponible') ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-surface border-white/10 text-text-muted'}`}><Power size={20} /><span className="text-xs font-bold">Disponible</span></button>
                                <button type="button" onClick={() => { setValue('visible', true); setValue('disponible', false); }} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${watch('visible') && !watch('disponible') ? 'bg-red-600/20 border-red-600 text-red-600' : 'bg-surface border-white/10 text-text-muted'}`}><Power size={20} /><span className="text-xs font-bold">Agotado</span></button>
                                <button type="button" onClick={() => { setValue('visible', false); }} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${!watch('visible') ? 'bg-gray-500/20 border-gray-500 text-gray-400' : 'bg-surface border-white/10 text-text-muted'}`}><EyeOff size={20} /><span className="text-xs font-bold">Oculto</span></button>
                            </div>
                        </div>

                        {/* INGREDIENTES */}
                        <div>
                             <label className="block text-sm font-medium text-text-muted mb-2 ml-1 flex justify-between items-center">
                                <span>Características <span className="text-red-500">*</span> <span className="text-[10px] text-text-muted ml-2">(Letras y números)</span></span>
                                <button type="button" onClick={iaIng} disabled={guardando} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg flex gap-1 border border-primary/20">
                                    {loadingAction === 'caracteristicas' ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} IA
                                </button>
                            </label>
                            <Textarea 
                                value={caracteristicasTemp}
                                onChange={(e) => handleCaracterísticasInput(e.target.value)}
                                placeholder="Ingrediente 1, Ingrediente 2..."
                                maxLength={LIMITES.INGREDIENTES}
                                className={errors.caracteristicas ? "!border-red-500" : ""}
                            />
                            {errors.caracteristicas && <p className="text-red-500 text-xs mt-1">{errors.caracteristicas.message}</p>}
                        </div>

                        {/* DESCRIPCIÓN */}
                        <div>
                             <label className="block text-sm font-medium text-text-muted mb-2 ml-1 flex justify-between items-center">
                                <span>Descripción <span className="text-red-500">*</span> <span className="text-[10px] text-text-muted ml-2">(Letras y números)</span></span>
                                <button type="button" onClick={iaDesc} disabled={guardando} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg flex gap-1 border border-primary/20">
                                    {loadingAction === 'descripcion' ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} IA
                                </button>
                            </label>
                            <Textarea 
                                value={watch('descripcion')}
                                onChange={handleDescripcionChange}
                                maxLength={LIMITES.PLATILLO_DESC} 
                                placeholder="Descripción irresistible..."
                                className={errors.descripcion ? "!border-red-500" : ""}
                            />
                            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion.message}</p>}
                        </div>

                        {/* CATEGORÍA */}
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2 ml-1 flex justify-between items-center">
                                <span>Categoría <span className="text-red-500">*</span></span>
                            </label>
                            <div className="relative">
                                <select
                                    {...register('categoria')}
                                    className={`w-full bg-bg border border-border px-4 py-3 outline-none text-text-main focus:ring-1 focus:ring-primary/30 rounded-xl appearance-none ${errors.categoria ? "!border-red-500" : ""}`}
                                >
                                    <option value="" disabled className="bg-surface">Selecciona...</option>
                                    {CATEGORIAS_ESTANDAR.map((cat, i) => (
                                        <option key={i} value={cat} className="bg-surface text-text-main">{cat}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.categoria && <p className="text-red-500 text-xs mt-1">{errors.categoria.message}</p>}
                        </div>
                    </Tarjeta>
                </section>
            </div>

            <div className="space-y-8">
                <section>
                    <h3 className="text-lg font-bold text-primary mb-4">Precio e Imagen</h3>
                    <Tarjeta className="space-y-6">
                        {/* PRECIO */}
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2 ml-1">Precio (COP) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Input 
                                    type="text"
                                    value={precioDisplay}
                                    onChange={handlePrecioChange}
                                    icon={<DollarSign size={16}/>} 
                                    placeholder="0" 
                                    className={`font-mono font-bold ${errors.precio ? "!border-red-500" : ""}`}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-text-muted mt-1 px-1">
                                <span>Mín: 1.000</span>
                                {errors.precio ? <span className="text-red-500 font-bold">{errors.precio.message}</span> : <span>Máx: 200.000</span>}
                            </div>
                        </div>

                        {/* IMAGEN */}
                        <div className={`p-4 rounded-xl border flex flex-col items-center gap-4 relative ${errors.imagen_url ? "!border-red-500 bg-red-500/5" : "bg-bg border-border"}`}>
                            {watch('imagen_url') ? (
                                <img src={watch('imagen_url') || undefined} className="w-full h-48 object-cover rounded-xl shadow-lg" alt="Preview" />
                            ) : (
                                <div className="w-full h-48 rounded-xl bg-surface flex flex-col items-center justify-center text-text-muted border-2 border-dashed border-border">
                                    <EyeOff size={32} className="opacity-50 mb-2"/>
                                    <span className="text-xs">Sin imagen</span>
                                </div>
                            )}
                            {loadingImage && <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10"><Loader2 size={48} className="text-white animate-spin" /></div>}
                            <label className="cursor-pointer bg-surface border border-border shadow-sm px-6 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2 w-full justify-center font-bold">
                                <Upload size={16} /> {loadingImage ? 'Subiendo...' : 'Subir Imagen'}
                                <input type="file" accept="image/*" className="hidden" onChange={onImageWrapperChange} disabled={loadingImage} />
                            </label>
                        </div>
                        {errors.imagen_url && <p className="text-red-500 text-xs text-center">La imagen es obligatoria para publicar.</p>}
                    </Tarjeta>
                </section>
            </div>

            <div className="lg:col-span-2 flex justify-end gap-4 pt-6 border-t border-white/10">
                <Boton type="button" variante="secundario" onClick={cancelar} className="!bg-transparent border border-white/10">Cancelar</Boton>
                <Boton type="button" onClick={handleSubmit(onSubmit)} cargando={guardando} icono={<Save size={18} />}>
                    {producto.id ? 'Guardar Cambios' : 'Crear Producto'}
                </Boton>
            </div>
        </div>
    );
};
