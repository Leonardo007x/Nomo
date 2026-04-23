import React, { useState } from 'react';
import { Boton, Input } from '../ui';
import { Leaf, Server, Database, Plus, RefreshCw } from 'lucide-react';

export const DemoMicroservicios: React.FC = () => {
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');

  // EJEMPLO DE CONSUMO HTTP GET AL MICROSERVICIO INTERNO
  const consultarProductos = async () => {
    setCargando(true);
    setError('');
    try {
      // El NGINX del frontend hace proxy a "/api/productos" y responde el contenedor "api-service"
      const res = await fetch('/api/productos');
      if (!res.ok) throw new Error('Error conectando al backend dockerizado');
      const data = await res.json();
      setProductos(data);
    } catch (err: any) {
      setError(err.message || 'Falló la consulta');
    } finally {
      setCargando(false);
    }
  };

  // EJEMPLO DE CONSUMO HTTP POST AL MICROSERVICIO INTERNO
  const crearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre, descripcion: 'Descripción autogenerada', precio: Number(nuevoPrecio) })
      });
      if (!res.ok) throw new Error('Error al insertar');
      
      setNuevoNombre('');
      setNuevoPrecio('');
      await consultarProductos(); // Refrescar vista
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-800 animate-fadeIn mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Server className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-text-main">Test de Sistemas Distribuidos</h2>
          <p className="text-sm text-text-muted">Prueba la integración Frontend ↔ Backend ↔ Base de Datos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Formulario POST */}
        <div className="bg-bg/50 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-secondary" />
            1. Insertar (Método POST)
          </h3>
          <form onSubmit={crearProducto} className="space-y-4">
            <Input 
              label="Nombre del Producto" 
              placeholder="Ej. Tacos de Pastor" 
              value={nuevoNombre} 
              onChange={(e) => setNuevoNombre(e.target.value)} 
              required 
            />
            <Input 
              label="Precio" 
              type="number" 
              step="0.01" 
              placeholder="Ej. 12.50" 
              value={nuevoPrecio} 
              onChange={(e) => setNuevoPrecio(e.target.value)} 
              required 
            />
            <Boton type="submit" variante="primario" className="w-full" disabled={cargando}>
              Insertar en DB
            </Boton>
          </form>
        </div>

        {/* Listado GET */}
        <div className="bg-bg/50 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              2. Consultar (Método GET)
            </h3>
            <Boton variante="secundario" tamano="pequeno" onClick={consultarProductos} disabled={cargando}>
              <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
              Refrescar
            </Boton>
          </div>
          
          {error && <div className="text-red-500 text-sm mb-4 bg-red-100 p-2 rounded">{error}</div>}
          
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {productos.length === 0 && !cargando && !error && (
              <p className="text-sm text-text-muted text-center py-4">Haz clic en refrescar para ver la DB</p>
            )}
            {productos.map((p) => (
              <div key={p.id} className="bg-surface p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex justify-between items-center shadow-sm">
                <div>
                  <h4 className="font-medium text-sm">{p.nombre}</h4>
                  <p className="text-xs text-text-muted">ID: {p.id}</p>
                </div>
                <span className="font-bold text-primary">${Number(p.precio).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
