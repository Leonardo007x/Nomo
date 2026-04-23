import React, { createContext, useContext, useEffect, useState } from 'react';

type Tema = 'light' | 'dark';

interface TemaContextType {
  tema: Tema;
  toggleTema: () => void;
}

const TemaContext = createContext<TemaContextType>({
  tema: 'dark',
  toggleTema: () => {},
});

export const useTema = () => useContext(TemaContext);

export const ProveedorTema: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializar tema desde localStorage o preferencia del sistema
  const [tema, setTema] = useState<Tema>(() => {
    const guardado = localStorage.getItem('tema');
    if (guardado === 'light' || guardado === 'dark') return guardado;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Listener para cambios en el SO
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Solo cambiar automáticamente si el usuario NO ha guardado una preferencia manual explícita recientemente
      // O si decidimos que la preferencia manual manda, entonces no hacemos nada aqui si hay algo en localStorage.
      // En este caso, vamos a priorizar el cambio manual, pero si no hay nada en storage, seguimos al sistema.
      const guardado = localStorage.getItem('tema');
      if (!guardado) {
        setTema(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(tema);
    localStorage.setItem('tema', tema);
  }, [tema]);

  const toggleTema = () => {
    setTema((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <TemaContext.Provider value={{ tema, toggleTema }}>
      {children}
    </TemaContext.Provider>
  );
};