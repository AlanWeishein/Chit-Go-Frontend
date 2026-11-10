import { useEffect, useRef, useState } from 'react'
import { conectar, desconectar } from './conexion'

export type EstadoEnVivo = 'conectando' | 'conectada' | 'reconectando'

// Para las pantallas del personal (Caja, Cocina y Mozo). Se suscribe a los topics del local y llama a
// recargar() al conectar, al reconectar y con cada evento que llega. La pantalla se arma siempre con el GET,
// nunca con el evento: así un evento perdido o repetido no rompe nada (RNF-08). Es el mismo criterio que
// useSeguimiento del cliente. topics va sin el prefijo: por ejemplo ['caja/pedidos'].
// Una sola pantalla por vez usa la conexión: al salir de la pantalla se cierra.
export function useEnVivo(localId: number | undefined, topics: string[], recargar: () => void): EstadoEnVivo {
  const [estado, setEstado] = useState<EstadoEnVivo>('conectando')
  const recargarRef = useRef(recargar)
  useEffect(() => {
    recargarRef.current = recargar
  }, [recargar])

  const clave = topics.join('|')

  useEffect(() => {
    if (localId === undefined) return
    let activa = true
    conectar(
      {},
      {
        alConectar: (cliente) => {
          if (!activa) return
          setEstado('conectada')
          for (const topic of clave.split('|')) {
            cliente.subscribe(`/topic/local/${localId}/${topic}`, () => recargarRef.current())
          }
          recargarRef.current()
        },
        alCortarse: () => {
          if (activa) setEstado((e) => (e === 'conectando' ? e : 'reconectando'))
        },
      },
    )
    return () => {
      activa = false
      desconectar()
    }
  }, [localId, clave])

  return estado
}
