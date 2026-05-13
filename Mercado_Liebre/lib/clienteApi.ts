/**
 * Cliente HTTP hacia la API propia (MySQL vía servicio-api en Docker o dev con proxy Vite).
 */
export const TOKEN_KEY = 'mercadoliebre_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  try {
    const url = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
    const headers = new Headers(init.headers);
    const t = getToken();
    if (t) headers.set('Authorization', `Bearer ${t}`);
    if (init.body instanceof FormData) {
      headers.delete('Content-Type');
    } else if (
      init.body &&
      typeof init.body === 'string' &&
      !headers.has('Content-Type')
    ) {
      headers.set('Content-Type', 'application/json');
    }
    return await fetch(url, { ...init, headers });
  } catch (err) {
    console.error('[apiFetch] fallo de red o request inválido:', path, err);
    throw err instanceof Error ? err : new Error('No se pudo contactar al servidor');
  }
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    const res = await apiFetch(path, init);
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const j = await res.json();
        if (j.error) msg = j.error;
      } catch {
        /* cuerpo no JSON: dejamos msg por statusText */
      }
      throw new Error(msg);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    console.error('[apiJson]', path, err);
    if (err instanceof Error) throw err;
    throw new Error(typeof err === 'string' ? err : 'Error al procesar la respuesta del servidor');
  }
}
