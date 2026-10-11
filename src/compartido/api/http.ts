// Las pantallas nunca llaman a fetch directo: pasan por acá.
// Así un cambio de endpoint o de manejo de errores se toca en un solo archivo.
const BASE = '/api/v1'

export class ApiError extends Error {
  constructor(
    public status: number,
    public detalle?: unknown,
  ) {
    super(`HTTP ${status}`)
  }
}

export async function api<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    credentials: 'include', // el JWT del personal viaja en una cookie HttpOnly
    headers: { 'Content-Type': 'application/json', ...opciones.headers },
    ...opciones,
  })
  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, await respuesta.json().catch(() => undefined))
  }
  return respuesta.status === 204 ? (undefined as T) : ((await respuesta.json()) as T)
}
