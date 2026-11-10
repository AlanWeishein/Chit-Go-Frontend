import { useCallback, useRef, useState } from 'react'
import { listarPorAprobar, type PedidoPorAprobar } from '../../compartido/api/caja'
import { textoDelError } from '../../compartido/api/errores'
import { useEnVivo } from '../../compartido/ws/useEnVivo'

export interface ColaDeAprobacion {
  pedidos: PedidoPorAprobar[] // del más viejo al más nuevo
  recibidaEn: number // Date.now() de cuando llegó la última respuesta: desde ahí se cuenta la espera
  cargando: boolean // solo hasta la primera respuesta
  error: string | null
  recargar: () => void
}

// La cola de aprobación de Caja (P-08). La pide MarcoCaja y no la página: el contador del menú la necesita en
// todas las pantallas de Caja, y conexion.ts admite un solo useEnVivo a la vez.
export function useColaDeAprobacion(localId: number | undefined): ColaDeAprobacion {
  const [pedidos, setPedidos] = useState<PedidoPorAprobar[]>([])
  const [recibidaEn, setRecibidaEn] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Si salen dos pedidos de la lista seguidos, vale solo la respuesta del último: una vieja que llega tarde no pisa.
  const ultimoPedido = useRef(0)

  const recargar = useCallback(() => {
    const este = ++ultimoPedido.current
    listarPorAprobar()
      .then((lista) => {
        if (este !== ultimoPedido.current) return
        setPedidos(lista)
        setRecibidaEn(Date.now())
        setError(null)
      })
      .catch((err) => {
        if (este === ultimoPedido.current) setError(textoDelError(err))
      })
      .finally(() => {
        if (este === ultimoPedido.current) setCargando(false)
      })
  }, [])

  // useEnVivo la pide al conectar, al reconectar y con cada evento de caja/pedidos. La pantalla de Aprobación
  // la vuelve a pedir cada vez que se entra.
  useEnVivo(localId, ['caja/pedidos'], recargar)

  return { pedidos, recibidaEn, cargando, error, recargar }
}
