const BASE = '/api/v1'

// Forma de los errores del back (ProblemDetail). Se compara status y codigo, nunca el texto de detail.
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

// Sesión vencida: cualquier llamada que no sea de /auth/ y dé 401 avisa acá, y la app (SesionProvider)
// limpia la sesión y manda al login. Las pantallas no repiten esta lógica: solo evitan mostrar
// "no pudimos cargar" cuando el error es de este tipo (esSesionVencida).
// Las rutas /auth/* quedan afuera: ahí un 401 es "credenciales incorrectas" o "no hay sesión".
let alSesionVencida: (() => void) | null = null

export function registrarSesionVencida(fn: (() => void) | null) {
  alSesionVencida = fn
}

export function avisarSesionVencida() {
  alSesionVencida?.()
}

export function esSesionVencida(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401
}

// CSRF de Spring para SPA: el back deja la cookie XSRF-TOKEN (legible desde JS) y exige su
// valor en el header X-XSRF-TOKEN en todo lo que modifica datos. Sin el header responde 403.
const METODOS_CON_CSRF = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// La cookie cambia en cada respuesta: se lee de document.cookie al armar cada request y
// nunca se guarda en una variable.
function leerCookie(nombre: string): string | undefined {
  const prefijo = `${nombre}=`
  const par = document.cookie.split('; ').find((c) => c.startsWith(prefijo))
  if (!par) return undefined
  const valor = par.slice(prefijo.length)
  try {
    return decodeURIComponent(valor)
  } catch {
    return valor
  }
}

export async function api<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  // Se separa `headers` para no pisarlo al esparcir el resto de las opciones.
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
    credentials: 'include', // el JWT del personal viaja en una cookie HttpOnly
  })
  if (!respuesta.ok) {
    if (respuesta.status === 401 && !ruta.startsWith('/auth/')) avisarSesionVencida()
    throw new ApiError(respuesta.status, await respuesta.json().catch(() => undefined))
  }
  return respuesta.status === 204 ? (undefined as T) : ((await respuesta.json()) as T)
}
