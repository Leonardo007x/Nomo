
import { useState } from 'react';
import { Producto } from '../tipos';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export const useCarrito = () => {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);

  const agregarItem = (producto: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(p => p.producto.id === producto.id);
      if (existe) {
        return prev.map(p => p.producto.id === producto.id ? {...p, cantidad: p.cantidad + 1} : p);
      }
      return [...prev, { producto, cantidad: 1 }];
    });
    setModalAbierto(true);
  };

  const actualizarCantidad = (id: string, delta: number) => {
    setCarrito(prev => prev.map(item => {
      if (item.producto.id === id) {
        const nuevaCant = item.cantidad + delta;
        return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : item;
      }
      return item;
    }));
  };

  const eliminarItem = (id: string) => {
    setCarrito(prev => prev.filter(item => item.producto.id !== id));
  };

  const calcularTotal = () => {
    return carrito.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
  };

  const vaciarCarrito = () => setCarrito([]);

  return {
    carrito,
    modalAbierto,
    setModalAbierto,
    agregarItem,
    actualizarCantidad,
    eliminarItem,
    calcularTotal,
    vaciarCarrito
  };
};
