// Lista que se arma con "foto completa al conectar + eventos en vivo por WebSocket".
// Reglas (las mismas de la cola de Caja):
//  - La lista completa se pide SOLO al conectar y al reconectar (RNF-08). No hay carga aparte al montar ni polling:
//    en Caja y Cocina, quedarse mirando sin tocar cuenta como inactividad.
//  - Si dos respuestas llegan fuera de orden, gana la última pedida.
//  - Los eventos que llegan mientras la lista viaja se reaplican sobre ella, para no perder un cambio justo ahí.
//  - Un 401 (sesión vencida) no es un error de carga: la app ya manda al login (ver http.ts).
import { useCallback, useEffect, useRef, useState } from 'react'
import { esSesionVencida } from '../api/http'

export interface Escuchador<E> {
  alEvento: (e: E) => void
  alConectar: () => void
  alDesconectar: () => void
}

export interface OpcionesListaEnVivo<T, E> {
  clave: unknown // si cambia (por ejemplo, el local), se vuelve a suscribir
  listar: () => Promise<T[]>
  escuchar: (m: Escuchador<E>) => () => void
  aplicar: (lista: T[], e: E) => T[] // idempotente: repetir un evento no cambia nada
  ordenar: (lista: T[]) => T[]
  mensajeError: string
}

export function useListaEnVivo<T, E>(opciones: OpcionesListaEnVivo<T, E>) {
  const [items, setItems] = useState<T[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conectado, setConectado] = useState(false)

  // Siempre se usa la versión más reciente de las funciones sin re-suscribir en cada render.
  const op = useRef(opciones)
  useEffect(() => {
    op.current = opciones
  })

  const ultimaPedida = useRef(0) // número de la última recarga pedida
  const eventosEnCurso = useRef<E[] | null>(null) // eventos llegados mientras viaja la lista; null = no hay carga en curso

  // Aplica un evento (del WebSocket o de una acción propia ya confirmada por el servidor).
  const aplicarEvento = useCallback((e: E) => {
    eventosEnCurso.current?.push(e)
    setItems((prev) => op.current.ordenar(op.current.aplicar(prev, e)))
  }, [])

  const recargar = useCallback(async () => {
    const mia = ++ultimaPedida.current
    eventosEnCurso.current = []
    try {
      const lista = await op.current.listar()
      if (mia !== ultimaPedida.current) return // llegó otra más nueva: esta se descarta
      const { aplicar, ordenar } = op.current
      setItems(ordenar((eventosEnCurso.current ?? []).reduce((acc, e) => aplicar(acc, e), lista)))
      setError(null)
    } catch (err) {
      if (mia !== ultimaPedida.current) return
      if (!esSesionVencida(err)) setError(op.current.mensajeError)
    } finally {
      if (mia === ultimaPedida.current) {
        eventosEnCurso.current = null
        setCargando(false)
      }
    }
  }, [])

  useEffect(() => {
    return op.current.escuchar({
      alEvento: aplicarEvento,
      alConectar: () => {
        setConectado(true)
        void recargar()
      },
      alDesconectar: () => setConectado(false),
    })
  }, [opciones.clave, aplicarEvento, recargar])

  return { items, cargando, error, conectado, aplicarEvento, recargar }
}
