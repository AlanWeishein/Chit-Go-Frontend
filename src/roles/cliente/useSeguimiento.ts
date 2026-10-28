import { useCallback, useEffect, useRef, useState } from 'react'
import { obtenerEstadoDeSesion, traducirError, type EstadoDeSesion, type FalloCliente } from '../../compartido/api/cliente'
import { conectar, desconectar } from '../../compartido/ws/conexion'

// conectando: todavía no se conectó nunca. reconectando: estuvo conectado y se cortó.
export type Conexion = 'conectando' | 'conectada' | 'reconectando'

// El seguimiento de P-03. El estado sale siempre de GET /public/sesion/estado: al entrar, cada vez que el
// WebSocket se (re)conecta y con cada aviso de /user/queue/pedido. El aviso solo dice "algo cambió": así no
// hay pedidos repetidos ni faltantes después de un corte (RNF-08), y los avisos del Sprint 2 (SERVIDO,
// CANCELADO de Caja, PLATO_BAJA) andan sin tocar esto.
export function useSeguimiento(tokenSesion: string | null) {
  const [estado, setEstado] = useState<EstadoDeSesion | null>(null)
  const [fallo, setFallo] = useState<FalloCliente | null>(null)
  const [conexion, setConexion] = useState<Conexion>('conectando')
  // Si salen dos pedidos del estado seguidos, vale solo la respuesta del último: una vieja que llega tarde no pisa.
  const ultimoPedido = useRef(0)

  const actualizar = useCallback(async (): Promise<EstadoDeSesion | null> => {
    if (tokenSesion === null) return null
    const este = ++ultimoPedido.current
    try {
      const nuevo = await obtenerEstadoDeSesion(tokenSesion)
      if (este !== ultimoPedido.current) return null
      setEstado(nuevo)
      setFallo(null)
      return nuevo
    } catch (err) {
      if (este === ultimoPedido.current) setFallo(traducirError(err))
      return null
    }
  }, [tokenSesion])

  useEffect(() => {
    if (tokenSesion === null) return
    let activa = true
    void actualizar()
    conectar(
      { tokenSesion },
      {
        alConectar: (cliente) => {
          if (!activa) return
          setConexion('conectada')
          cliente.subscribe('/user/queue/pedido', () => void actualizar())
          void actualizar()
        },
        // Al salir de la pantalla también se cierra: ahí ya no tiene que cambiar nada.
        alCortarse: () => {
          if (activa) setConexion((c) => (c === 'conectando' ? c : 'reconectando'))
        },
      },
    )
    return () => {
      activa = false
      desconectar()
    }
  }, [tokenSesion, actualizar])

  return { estado, fallo, conexion, actualizar }
}
