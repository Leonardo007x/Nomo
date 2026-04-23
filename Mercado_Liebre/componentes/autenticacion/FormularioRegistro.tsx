
import React, { useState } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { apiJson } from '../../lib/clienteApi';
import type { UsuarioSesion } from '../../tipos/modelos';
import { Boton, Input } from '../ui';
import { ShieldCheck, Check, XCircle, AlertCircle, AlertTriangle, Mail } from 'lucide-react';

interface FormularioRegistroProps {
  cambiarModo: () => void;
}

export const FormularioRegistro: React.FC<FormularioRegistroProps> = ({ cambiarModo }) => {
  const { establecerSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasMinLength = password.length >= 8;
  
  const isEmailValid = emailRegex.test(email);
  const isStrongPassword = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  const passwordsMatch = password === confirmPassword && password !== '';
  
  const formValid = isEmailValid && isStrongPassword && passwordsMatch && nombre.length > 0 && apellido.length > 0 && aceptaTerminos;

  const handleNameChange = (setter: (val: string) => void, value: string) => {
     if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value) && value.length <= 50) {
        setter(value);
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    
    setLoading(true);
    setError(null);

    try {
        const { token, user } = await apiJson<{ token: string; user: UsuarioSesion }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, nombre, apellido }),
        });
        establecerSesion(token, user);
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('ya está registrado') || msg.includes('409')) {
        setError("Este correo electrónico ya está registrado. Intenta iniciar sesión.");
      } else {
        setError(msg || "Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  const ValidationIcon = ({ valid, active }: { valid: boolean, active: boolean }) => {
    if (!active) return <div className="w-4 h-4 border border-white/10 rounded-full" />;
    return valid ? <Check size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 relative z-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
            <Input 
                placeholder="Nombre" 
                value={nombre} 
                onChange={e => handleNameChange(setNombre, e.target.value)} 
                required 
                className={nombre.length > 1 ? "border-green-500/30" : ""}
                maxLength={50}
            />
            <Input 
                placeholder="Apellido" 
                value={apellido} 
                onChange={e => handleNameChange(setApellido, e.target.value)} 
                required 
                className={apellido.length > 1 ? "border-green-500/30" : ""}
                maxLength={50}
            />
        </div>

        <div className="relative">
            <Input 
            type="email" 
            placeholder="Correo electrónico" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            onBlur={() => setEmailTouched(true)}
            required 
            icon={<Mail size={18} />}
            className={email.length > 0 ? (isEmailValid ? "border-green-500/50" : (emailTouched ? "border-red-500/50" : "")) : ""}
            maxLength={100}
            />
            {email.length > 0 && !isEmailValid && emailTouched && (
            <p className="text-[10px] text-red-400 mt-1 ml-1 absolute -bottom-4">Formato inválido</p>
            )}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
            <Input 
                type="password" 
                placeholder="Contraseña" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                icon={<ShieldCheck size={18} />}
                className={password.length > 0 ? (isStrongPassword ? "border-green-500/50" : "border-orange-500/50") : ""}
                maxLength={64}
            />

            <Input 
                type="password" 
                placeholder="Confirmar" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                icon={<ShieldCheck size={18} />}
                className={confirmPassword.length > 0 ? (passwordsMatch ? "border-green-500/50" : "border-red-500/50") : ""}
                maxLength={64}
            />
        </div>

        <div className="animate-fadeIn space-y-2">
            <div className="bg-surface/50 p-3 rounded-xl border border-white/5 text-xs flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center justify-between">
                <span className="font-bold text-text-muted uppercase flex items-center gap-1 mb-1 sm:mb-0">
                    <AlertCircle size={10} /> Seguridad:
                </span>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <div className={`flex items-center gap-1 ${password.length > 0 ? (hasMinLength ? 'text-green-500' : 'text-red-400') : 'text-text-muted'}`}>
                        <ValidationIcon valid={hasMinLength} active={password.length > 0} /> 8+ chars
                    </div>
                    <div className={`flex items-center gap-1 ${password.length > 0 ? (hasUpperCase ? 'text-green-500' : 'text-red-400') : 'text-text-muted'}`}>
                        <ValidationIcon valid={hasUpperCase} active={password.length > 0} /> Mayúscula
                    </div>
                    <div className={`flex items-center gap-1 ${password.length > 0 ? (hasLowerCase ? 'text-green-500' : 'text-red-400') : 'text-text-muted'}`}>
                        <ValidationIcon valid={hasLowerCase} active={password.length > 0} /> Minúscula
                    </div>
                    <div className={`flex items-center gap-1 ${password.length > 0 ? (hasNumber ? 'text-green-500' : 'text-red-400') : 'text-text-muted'}`}>
                        <ValidationIcon valid={hasNumber} active={password.length > 0} /> Número
                    </div>
                </div>
            </div>

            <div className="flex items-start gap-3 pt-1">
                <div className="relative flex items-center pt-1">
                    <input 
                    type="checkbox" 
                    id="terms" 
                    checked={aceptaTerminos}
                    onChange={e => setAceptaTerminos(e.target.checked)}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/20 bg-surface checked:border-primary checked:bg-primary transition-all"
                    />
                    <Check size={12} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
                </div>
                <label htmlFor="terms" className="text-xs text-text-muted cursor-pointer select-none leading-snug">
                    Acepto los <Link to="/terminos" target="_blank" className="text-primary hover:underline font-bold">términos</Link> y la <Link to="/privacidad" target="_blank" className="text-primary hover:underline font-bold">política de privacidad</Link>.
                </label>
            </div>
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
                Crear Cuenta
            </Boton>
        </div>

        <div className="mt-6 text-center">
            <p className="text-sm text-text-muted relative z-10">
            ¿Ya tienes cuenta? 
            <button 
                type="button"
                onClick={cambiarModo} 
                className="text-primary font-bold hover:text-accent transition-colors ml-1"
            >
                Inicia sesión
            </button>
            </p>
        </div>
    </form>
  );
};
