import { useCallback, useEffect, useRef, useState } from 'react'
import { statusDe, textoDelError } from '../../compartido/api/errores'
import { pedidosEnCurso } from '../../compartido/api/pantallaPublica'
import type { PantallaPublica } from '../../compartido/tipos/pantallaPublica'
import { conectar, desconectar } from '../../compartido/ws/conexion'

// Lo que dejó cada pedido del GET: 'vieja' es una respuesta que llegó tarde y se descartó.
type Resultado = 'ok' | 'noDisponible' | 'red' | 'vieja'

// Cada cuánto se reintenta el primer GET si el back no contesta. Es el mismo tiempo en que el cliente STOMP
// reintenta la conexión. Solo corre hasta tener el localId: después todo lo dispara el WebSocket.
const REINTENTO_MS = 3000

// El estado de la pantalla del salón (P-20, HU-17). Como useEnVivo del personal, la pantalla se arma siempre con
// el GET y el evento del WebSocket solo avisa que algo cambió: así un evento perdido o repetido no rompe nada
// (RNF-08). Se distingue en dos cosas: la pantalla entra con un tokenPantalla en el CONNECT (no tiene sesión) y
// el localId sale del primer GET, no de la sesión. Por eso primero va el GET y recién después se conecta.
export function usePantallaEnVivo(token: string) {
  const [datos, setDatos] = useState<PantallaPublica | null>(null)
  const [noDisponible, setNoDisponible] = useState<string | null>(null)
  const [falloDeRed, setFalloDeRed] = useState(false)
  const [conectada, setConectada] = useState(true)
  // Si salen dos GET seguidos, vale solo la respuesta del último: una vieja que llega tarde no pisa.
  const ultimoPedido = useRef(0)

  const actualizar = useCallback(async (): Promise<Resultado> => {
    const este = ++ultimoPedido.current
    try {
      const nuevo = await pedidosEnCurso(token)
      if (este !== ultimoPedido.current) return 'vieja'
      setDatos(nuevo)
      setFalloDeRed(false)
      setNoDisponible(null)
      return 'ok'
    } catch (err) {
      if (este !== ultimoPedido.current) return 'vieja'
      if (statusDe(err) === 404) {
        setNoDisponible(textoDelError(err, 'La pantalla no está disponible'))
        return 'noDisponible'
      }
      setFalloDeRed(true)
      return 'red'
    }
  }, [token])

  const localId = datos?.localId

  // El primer GET. Con 404 no se reintenta: el token no existe y no va a existir.
  useEffect(() => {
    if (localId !== undefined) return
    let activa = true
    let temporizador: ReturnType<typeof setTimeout> | undefined
    const intentar = async () => {
      const resultado = await actualizar()
      if (activa && resultado === 'red') temporizador = setTimeout(intentar, REINTENTO_MS)
    }
    void intentar()
    return () => {
      activa = false
      clearTimeout(temporizador)
    }
  }, [localId, actualizar])

  // La conexión y la suscripción, con el localId que trajo el GET. El back solo deja a la pantalla suscribirse
  // a /topic/local/{localId}/pantalla. Al conectar (y al reconectar, cada 3 segundos) y con cada evento se pide
  // el GET de nuevo. Al salir de la pantalla se cierra la conexión.
  useEffect(() => {
    if (localId === undefined) return
    let activa = true
    conectar(
      { tokenPantalla: token },
      {
        alConectar: (cliente) => {
          if (!activa) return
          setConectada(true)
          cliente.subscribe(`/topic/local/${localId}/pantalla`, () => void actualizar())
          void actualizar()
        },
        alCortarse: () => {
          if (activa) setConectada(false)
        },
      },
    )
    return () => {
      activa = false
      desconectar()
    }
  }, [token, localId, actualizar])

  // "Reconectando…": el WebSocket está cortado o el último GET no llegó. Se va solo con el próximo GET que sale bien.
  return { datos, noDisponible, reconectando: !conectada || falloDeRed }
}
