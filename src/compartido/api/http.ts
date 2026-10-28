const BASE = '/api/v1'

export interface ProblemDetail {
  title?: string
  status?: number
  detail?: string
  codigo?: string
}

export class ApiError extends Error {
  constructor(public status: number, public detalle?: unknown) {
    super(`HTTP ${status}`)
  }
}

const METODOS_CON_CSRF = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function leerCookie(nombre: string): string | undefined {
  const prefijo = `${nombre}=`
  const par = document.cookie.split('; ').find((c) => c.startsWith(prefijo))
  if (!par) return undefined
  const valor = par.slice(prefijo.length)
  try { return decodeURIComponent(valor) } catch { return valor }
}

export async function api<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const { headers: headersExtra, ...resto } = opciones
  const metodo = (resto.method ?? 'GET').toUpperCase()

  const headers = new Headers(headersExtra)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (METODOS_CON_CSRF.has(metodo)) {
    const token = leerCookie('XSRF-TOKEN')
    if (token) headers.set('X-XSRF-TOKEN', token)
  }

  const respuesta = await fetch(`${BASE}${ruta}`, {
    ...resto,
    headers,
    credentials: 'include',
  })
  if (!respuesta.ok) throw new ApiError(respuesta.status, await respuesta.json().catch(() => undefined))
  return respuesta.status === 204 ? (undefined as T) : ((await respuesta.json()) as T)
}
