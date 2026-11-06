import { ApiError, type ProblemDetail } from './http'

// El cuerpo del error (ProblemDetail) si el back lo mandó.
export function detalleDe(err: unknown): (ProblemDetail & Record<string, unknown>) | undefined {
  if (err instanceof ApiError && err.detalle && typeof err.detalle === 'object') {
    return err.detalle as ProblemDetail & Record<string, unknown>
  }
  return undefined
}

export function statusDe(err: unknown): number | undefined {
  return err instanceof ApiError ? err.status : undefined
}

// El texto para mostrar: el detail del back tal cual (el back lo escribe para mostrarse), o uno genérico.
export function textoDelError(err: unknown, porDefecto = 'Algo salió mal. Probá de nuevo.'): string {
  if (!(err instanceof ApiError)) return 'No hay conexión con el servidor. Probá de nuevo.'
  return detalleDe(err)?.detail ?? porDefecto
}
