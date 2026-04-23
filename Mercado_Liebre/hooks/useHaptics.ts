import { useCallback } from 'react';

export const useHaptics = () => {
  /**
   * Activa la vibración del dispositivo si es compatible.
   * @param pattern Duración en milisegundos o patrón de vibración (por defecto 10ms)
   */
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  /**
   * Patrones predefinidos
   */
  const haptics = {
    success: () => vibrate([10, 30, 10]), // Dos vibraciones cortas
    error: () => vibrate([50, 30, 50, 30, 50]), // Tres vibraciones largas
    light: () => vibrate(5), // Muy sutil, para tecleo o clicks simples
    medium: () => vibrate(15), // Botones estándar
    heavy: () => vibrate(40), // Acciones destructivas
  };

  return { vibrate, haptics };
};