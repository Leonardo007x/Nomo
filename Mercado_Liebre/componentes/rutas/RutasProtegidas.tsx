import React, { PropsWithChildren } from 'react';
// @ts-ignore
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexto/ContextoAutenticacion';

export function RutaPrivada({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center bg-bg"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  return user ? <>{children}</> : <Navigate to="/auth" />;
}

export function RutaAuth({ children }: PropsWithChildren) {
   const { user, loading } = useAuth();
   if (loading) return null;
   return user ? <Navigate to="/panel" /> : <>{children}</>;
}