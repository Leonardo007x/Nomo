/**
 * Descripción: Proveedor de contexto para manejar la sesión y el estado de autenticación (API propia + JWT).
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UsuarioSesion } from '../tipos/modelos';
import { getToken, setToken, apiJson } from '../lib/clienteApi';

interface AuthContextType {
  user: UsuarioSesion | null;
  loading: boolean;
  cerrarSesion: () => Promise<void>;
  establecerSesion: (token: string, user: UsuarioSesion) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  cerrarSesion: async () => {},
  establecerSesion: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const ProveedorAutenticacion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UsuarioSesion | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarSesion = async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await apiJson<UsuarioSesion>('/auth/me');
      setUser(u);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSesion();
  }, []);

  const establecerSesion = (token: string, u: UsuarioSesion) => {
    setToken(token);
    setUser(u);
  };

  const cerrarSesion = async () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, cerrarSesion, establecerSesion }}>
      {children}
    </AuthContext.Provider>
  );
};
