import { useCallback, useEffect, useState } from 'react'
import { escucharPedidos, listarPendientes, type EventoPedido, type PedidoPendiente } from '../../../compartido/api/pedidos'

const ordenar = (l: PedidoPendiente[]) => [...l].sort((a, b) => Date.parse(a.enviadoEn) - Date.parse(b.enviadoEn))

export function usePedidosPendientes(localId: number) {
  const [pedidos, setPedidos] = useState<PedidoPendiente[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conectado, setConectado] = useState(false)

  const recargar = useCallback(async () => {
    try {
      setPedidos(ordenar(await listarPendientes()))
      setError(null)
    } catch {
      setError('Error: No pudimos cargar la cola. Revisá tu conexión a internet.')
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
          setPedidos((prev) => (prev.some((p) => p.id === e.pedido.id) ? prev : ordenar([...prev, e.pedido])))
        } else {
          setPedidos((prev) => prev.filter((p) => p.id !== e.pedidoId))
        }
      },
      alConectar: () => { setConectado(true); void recargar() },
      alDesconectar: () => setConectado(false),
    })
  }, [localId, recargar])

  return { pedidos, cargando, error, conectado, quitar, recargar }
}

export function useAhora(intervaloMs = 1000) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), intervaloMs)
    return () => clearInterval(t)
  }, [intervaloMs])
  return ahora
}
