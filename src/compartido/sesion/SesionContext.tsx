import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { cerrarSesion, obtenerSesion, type Sesion } from '../api/auth'

interface ValorSesion {
  sesion: Sesion | null
  cargando: boolean // true mientras se pregunta a /auth/sesion al abrir la app
  guardarSesion: (s: Sesion) => void
  cerrar: () => Promise<void>
}

const Contexto = createContext<ValorSesion | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [cargando, setCargando] = useState(true)

  // Esta primera llamada (GET) también deja la cookie XSRF-TOKEN que http.ts necesita para el primer POST.
  useEffect(() => {
    let activo = true
    obtenerSesion()
      .then((s) => activo && setSesion(s))
      .catch(() => activo && setSesion(null))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [])

  const cerrar = useCallback(async () => {
    try {
      await cerrarSesion()
    } finally {
      setSesion(null)
    }
  }, [])

  const valor = useMemo<ValorSesion>(
    () => ({ sesion, cargando, guardarSesion: setSesion, cerrar }),
    [sesion, cargando, cerrar],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useSesion(): ValorSesion {
  const v = useContext(Contexto)
  if (!v) throw new Error('useSesion se usa dentro de <SesionProvider>')
  return v
}
