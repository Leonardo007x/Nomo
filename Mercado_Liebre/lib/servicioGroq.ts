
import { apiFetch } from './clienteApi';

/**
 * Servicio cliente para IA.
 * El frontend ya no llama a Groq directamente: usa /api/ia/generar vía gateway.
 */
export const generarContenidoGroq = async (
  mensajeUsuario: string, 
  mensajeSistema: string = "Eres un experto en marketing gastronómico de lujo y copywriting persuasivo."
): Promise<string> => {
  try {
    const response = await apiFetch('/ia/generar', {
      method: "POST",
      body: JSON.stringify({
        mensajeUsuario,
        mensajeSistema,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(errorData.error?.message || `Error IA: ${response.status}`);
    }

    const data = await response.json();
    return data.contenido || '';

  } catch (error: any) {
    console.error("Error en servicio IA:", error);
    // Propagar el mensaje de error limpio
    throw new Error(error.message || "Error generando contenido");
  }
};
