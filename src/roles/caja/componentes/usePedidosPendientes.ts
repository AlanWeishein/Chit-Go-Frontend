
import { useCallback, useEffect, useRef, useState } from 'react'
import { esSesionVencida } from '../../../compartido/api/http'
import {
  escucharPedidos,
  listarPendientes,
  type EventoPedido,
  type PedidoPendiente,
} from '../../../compartido/api/pedidos'

// Más viejo primero: en la cola de aprobación no hay prioridad manual (RF-19 es solo de cocina).
const ordenar = (l: PedidoPendiente[]) => [...l].sort((a, b) => Date.parse(a.enviadoEn) - Date.parse(b.enviadoEn))

// Aplica un evento a una lista. Es idempotente: repetir el mismo evento no cambia nada.
function aplicar(lista: PedidoPendiente[], e: EventoPedido): PedidoPendiente[] {
  if (e.tipo === 'NUEVO') return lista.some((p) => p.id === e.pedido.id) ? lista : [...lista, e.pedido]
  return lista.filter((p) => p.id !== e.pedidoId)
}

export function usePedidosPendientes(localId: number) {
  const [pedidos, setPedidos] = useState<PedidoPendiente[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conectado, setConectado] = useState(false)

  // Número de la última recarga pedida: si una respuesta vieja llega tarde, se descarta (gana la última pedida).
  const ultimaPedida = useRef(0)
  // Eventos que llegan mientras la lista completa está en camino: se reaplican sobre ella para no perder
  // un pedido que entró (o salió) después de que el servidor armó esa respuesta. null = no hay carga en curso.
  const eventosEnCurso = useRef<EventoPedido[] | null>(null)

  // Trae la lista completa del servidor (RNF-08: al reconectar, estado actual y no un replay de eventos).
  // Se llama solo desde alConectar: no hay carga aparte al montar ni pedidos periódicos.
  const recargar = useCallback(async () => {
    const mia = ++ultimaPedida.current
    eventosEnCurso.current = []
    try {
      const lista = await listarPendientes()
      if (mia !== ultimaPedida.current) return
      setPedidos(ordenar((eventosEnCurso.current ?? []).reduce(aplicar, lista)))
      setError(null)
    } catch (err) {
      if (mia !== ultimaPedida.current) return
      // Sesión vencida: la app ya limpió la sesión y manda al login (ver http.ts), no es un error de carga.
      if (!esSesionVencida(err)) setError('No pudimos cargar la cola. Revisá la conexión.')
    } finally {
      if (mia === ultimaPedida.current) {
        eventosEnCurso.current = null
        setCargando(false)
      }
    }
  }, [])

  const quitar = useCallback((id: number) => setPedidos((prev) => prev.filter((p) => p.id !== id)), [])

  useEffect(() => {
    return escucharPedidos(localId, {
      alEvento: (e) => {
        eventosEnCurso.current?.push(e)
        setPedidos((prev) => ordenar(aplicar(prev, e)))
      },
      alConectar: () => {
        setConectado(true)
        void recargar()
      },
      alDesconectar: () => setConectado(false),
    })
  }, [localId, recargar])

  return { pedidos, cargando, error, conectado, quitar, recargar }
}

// Reloj para los contadores de espera (solo local: no hace ningún request)
export function useAhora(intervaloMs = 1000) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), intervaloMs)
    return () => clearInterval(t)
  }, [intervaloMs])
  return ahora
}
