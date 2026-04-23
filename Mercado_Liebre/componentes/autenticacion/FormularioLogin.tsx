
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { apiJson } from '../../lib/clienteApi';
import type { UsuarioSesion } from '../../tipos/modelos';
import { Boton, Input } from '../ui';
import { ShieldCheck, AlertTriangle, Mail } from 'lucide-react';

interface FormularioLoginProps {
  cambiarModo: () => void;
}

export const FormularioLogin: React.FC<FormularioLoginProps> = ({ cambiarModo }) => {
  const { establecerSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recuerdame, setRecuerdame] = useState(false);
  
  const [emailFoco, setEmailFoco] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const formValid = isEmailValid && password.length > 0;

  useEffect(() => {
    const savedEmail = localStorage.getItem('mercadoliebre_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRecuerdame(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    
    setLoading(true);
    setError(null);

    try {
      if (recuerdame) {
        localStorage.setItem('mercadoliebre_email', email);
      } else {
        localStorage.removeItem('mercadoliebre_email');
      }

      const { token, user } = await apiJson<{ token: string; user: UsuarioSesion }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      establecerSesion(token, user);
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('Credenciales') || msg.includes('inválid')) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError(msg || "Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 relative z-10 w-full">
        <div className="relative">
            <Input 
            type="email" 
            placeholder="Correo electrónico" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            onFocus={() => setEmailFoco(true)}
            onBlur={() => setEmailFoco(false)}
            required 
            icon={<Mail size={18} />}
            className={email.length > 0 ? (isEmailValid ? "border-green-500/50" : (emailFoco ? "" : "border-red-500/50")) : ""}
            maxLength={100}
            />
            {email.length > 0 && !isEmailValid && !emailFoco && (
            <p className="text-[10px] text-red-400 mt-1 ml-1 absolute -bottom-4 animate-fadeIn">Formato inválido</p>
            )}
        </div>
        
        <Input 
            type="password" 
            placeholder="Contraseña" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            icon={<ShieldCheck size={18} />}
            maxLength={64}
        />

        <div className="flex items-center gap-2 animate-fadeIn px-1">
            <input 
            type="checkbox" 
            id="recuerdame" 
            checked={recuerdame}
            onChange={e => setRecuerdame(e.target.checked)}
            className="w-4 h-4 accent-primary bg-transparent border-gray-600 rounded cursor-pointer"
            />
            <label htmlFor="recuerdame" className="text-sm text-text-muted cursor-pointer select-none">Recuérdame</label>
        </div>

        {error && (
            <div className="animate-fadeIn p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-500 text-sm font-medium">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <span>{error}</span>
            </div>
        )}
        
        <div className="pt-2">
            <Boton 
                className={`w-full text-lg shadow-lg transition-all duration-300 py-4 ${!formValid ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-primary/20 hover:shadow-primary/40'}`} 
                type="submit" 
                cargando={loading}
                disabled={!formValid}
            >
                Ingresar al Panel
            </Boton>
        </div>

        <div className="mt-6 text-center">
            <p className="text-sm text-text-muted relative z-10">
            ¿No tienes una cuenta? 
            <button 
                type="button"
                onClick={cambiarModo} 
                className="text-primary font-bold hover:text-accent transition-colors ml-1"
            >
                Regístrate gratis
            </button>
            </p>
        </div>
    </form>
  );
};
