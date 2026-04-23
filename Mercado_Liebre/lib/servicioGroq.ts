
import { ENV } from '../constantes';

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
  };
}

/**
 * Servicio para generar contenido utilizando la API de Groq.
 * Utilizamos el modelo Llama-3.3-70b para obtener respuestas de alta calidad.
 */
export const generarContenidoGroq = async (
  mensajeUsuario: string, 
  mensajeSistema: string = "Eres un experto en marketing gastronómico de lujo y copywriting persuasivo."
): Promise<string> => {
  
  const apiKey = ENV.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("La API Key de Groq no está configurada.");
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: mensajeSistema
          },
          {
            role: "user",
            content: mensajeUsuario
          }
        ],
        model: "llama-3.3-70b-versatile", // Modelo actualizado y soportado
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
        stop: null
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(errorData.error?.message || `Error Groq: ${response.status}`);
    }

    const data: GroqResponse = await response.json();
    return data.choices[0]?.message?.content || "";

  } catch (error: any) {
    console.error("Error en servicio Groq:", error);
    // Propagar el mensaje de error limpio
    throw new Error(error.message || "Error generando contenido");
  }
};
