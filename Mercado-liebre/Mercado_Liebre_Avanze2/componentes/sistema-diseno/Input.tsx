import React, { forwardRef } from 'react';
import { Save } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  prefix?: string;
  estadoGuardado?: 'cargando' | 'exito' | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, icon, prefix, estadoGuardado, className = '', ...props }, ref) => {
  let paddingLeftClass = 'px-4';
  if (icon && prefix) paddingLeftClass = 'pl-24'; 
  else if (prefix) paddingLeftClass = 'pl-14';    
  else if (icon) paddingLeftClass = 'pl-12';      

  return (
    <div className="w-full relative group">
      {label && <label className="block text-sm font-bold text-text-muted mb-2 ml-1 tracking-wide">{label}</label>}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute top-1/2 left-4 -translate-y-1/2 text-text-muted pointer-events-none z-10 group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        {prefix && (
          <div 
            className={`absolute top-1/2 -translate-y-1/2 text-text-main font-bold pointer-events-none z-10 pr-2 border-r border-gray-500/20 flex items-center h-[24px] ${icon ? 'left-12' : 'left-4'}`}
          >
            {prefix}
          </div>
        )}
        <input 
          ref={ref}
          className={`w-full bg-bg border border-border rounded-xl py-3 outline-none text-text-main placeholder-gray-500 transition-all font-medium focus:border-primary focus:ring-1 focus:ring-primary/20
            ${paddingLeftClass} 
            pr-10
            ${className}`} 
          {...props} 
        />
        
        {estadoGuardado && (
          <div className="absolute right-3 top-0 bottom-0 my-auto h-4 w-4 flex items-center justify-center z-20 pointer-events-none">
            {estadoGuardado === 'cargando' ? (
               <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <div className="text-green-600 flex items-center justify-center animate-in zoom-in duration-300">
                 <Save size={16} />
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  estadoGuardado?: 'cargando' | 'exito' | null;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, estadoGuardado, className = '', ...props }, ref) => (
  <div className="w-full relative group">
    {label && <label className="block text-sm font-bold text-text-muted mb-2 ml-1 tracking-wide">{label}</label>}
    <div className="relative">
      <textarea 
        ref={ref}
        className={`w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none text-text-main placeholder-gray-500 transition-all min-h-[100px] font-medium pr-10 focus:border-primary focus:ring-1 focus:ring-primary/20 ${className}`} 
        {...props} 
      />
       {estadoGuardado && (
          <div className="absolute right-3 bottom-3 animate-fadeIn z-20 pointer-events-none">
            {estadoGuardado === 'cargando' ? (
               <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <div className="text-green-600 animate-in zoom-in duration-300">
                 <Save size={16} />
               </div>
            )}
          </div>
        )}
    </div>
  </div>
));

Textarea.displayName = 'Textarea';