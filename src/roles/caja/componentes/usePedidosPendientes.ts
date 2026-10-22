import { useCallback, useEffect, useState } from 'react'
import { escucharPedidos, listarPendientes, type EventoPedido, type PedidoPendiente } from '../../../compartido/api/pedidos'

// Más viejo primero: en la cola de aprobación no hay prioridad manual (RF-19 es solo de cocina).
const ordenar = (l: PedidoPendiente[]) => [...l].sort((a, b) => Date.parse(a.enviadoEn) - Date.parse(b.enviadoEn))

export function usePedidosPendientes(localId: number) {
  const [pedidos, setPedidos] = useState<PedidoPendiente[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conectado, setConectado] = useState(false)

  // Trae la lista completa del servidor (RNF-08: al reconectar, estado actual y no un replay de eventos)
  const recargar = useCallback(async () => {
    try {
      setPedidos(ordenar(await listarPendientes()))
      setError(null)
    } catch {
      setError('No pudimos cargar la cola. Revisá la conexión.')
    } finally {
      setCargando(false)
    }
  }, [])

  const quitar = useCallback((id: number) => setPedidos((prev) => prev.filter((p) => p.id !== id)), [])

  useEffect(() => {
    void recargar()
    return escucharPedidos(localId, {
      alEvento: (e: EventoPedido) => {
        if (e.tipo === 'NUEVO') {
          // idempotente: si el pedido ya está (evento repetido), no se duplica
          setPedidos((prev) => (prev.some((p) => p.id === e.pedido.id) ? prev : ordenar([...prev, e.pedido])))
        } else {
          setPedidos((prev) => prev.filter((p) => p.id !== e.pedidoId))
        }
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

// Reloj para los contadores de espera
export function useAhora(intervaloMs = 1000) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), intervaloMs)
    return () => clearInterval(t)
  }, [intervaloMs])
  return ahora
}
