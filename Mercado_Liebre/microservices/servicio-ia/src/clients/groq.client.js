/**
 * Cliente Groq.
 *
 * - `generate(...)` empaqueta el prompt y dispara la llamada a través del breaker.
 * - El breaker corta llamadas en cascada si Groq falla repetidamente, devolviendo
 *   un resultado normalizado para que la ruta decida 502 o 503.
 */

const { classifyBreakerError } = require('@mercadoliebre/resilience');
const { GROQ_MODEL } = require('../config');
const { groqBreaker } = require('../breakers');

/**
 * @returns {Promise<
 *   { ok: true, contenido: string }
 *   | { ok: false, reason: 'circuit_open'|'timeout'|'upstream_error'|'provider_error',
 *       httpStatus: number, errorMsg: string }
 * >}
 */
async function generate({ mensajeUsuario, mensajeSistema }) {
  try {
    const result = await groqBreaker.fire({
      body: {
        messages: [
          { role: 'system', content: mensajeSistema },
          { role: 'user', content: mensajeUsuario },
        ],
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      },
    });

    if (!result.ok) {
      return {
        ok: false,
        reason: 'provider_error',
        httpStatus: 502,
        errorMsg: result.data?.error?.message || `Error Groq: ${result.status}`,
      };
    }

    const contenido = result.data?.choices?.[0]?.message?.content || '';
    return { ok: true, contenido };
  } catch (e) {
    const reason = classifyBreakerError(e);
    return {
      ok: false,
      reason,
      httpStatus: reason === 'circuit_open' ? 503 : 500,
      errorMsg: e?.message || 'Error generando contenido',
    };
  }
}

module.exports = { generate };
