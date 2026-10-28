import { useEffect, useState } from 'react'
import { consultarMesa, entrarALaMesa, traducirError, type SesionMesa } from '../../compartido/api/cliente'

export type Entrada =
  | { estado: 'cargando' }
  | { estado: 'mesa-inexistente' } // P-35b
  | { estado: 'mesa-no-disponible'; numero: string } // P-35
  | { estado: 'error' }
  | { estado: 'lista'; numero: string; sesion: SesionMesa }

// La entrada a la mesa, que usan la carta (P-01) y el pedido (P-02). Entrar directo a P-02 o recargarla
// no abre otra sesión: el back reconoce el token que este celular guardó para esa mesa.
export function useEntradaMesa(token: string) {
  const [entrada, setEntrada] = useState<Entrada>({ estado: 'cargando' })
  const [intento, setIntento] = useState(0)

  // Primero se mira la mesa, así una inhabilitada (P-35) o un QR que no existe (P-35b) no abren nada.
  // Después va la sesión: si el celular ya tenía una en esa cuenta, el back le devuelve la misma.
  useEffect(() => {
    let activo = true
    setEntrada({ estado: 'cargando' })
    ;(async () => {
      let numero: string | null = null
      try {
        const mesa = await consultarMesa(token)
        numero = mesa.numero
        if (!mesa.disponible) {
          if (activo) setEntrada({ estado: 'mesa-no-disponible', numero })
          return
        }
        const sesion = await entrarALaMesa(token)
        if (activo) setEntrada({ estado: 'lista', numero, sesion })
      } catch (err) {
        if (!activo) return
        const { motivo } = traducirError(err)
        if (motivo === 'mesa-inexistente') setEntrada({ estado: 'mesa-inexistente' })
        else if (motivo === 'mesa-no-disponible' && numero !== null) setEntrada({ estado: 'mesa-no-disponible', numero })
        else setEntrada({ estado: 'error' })
      }
    })()
    return () => {
      activo = false
    }
  }, [token, intento])

  return {
    entrada,
    reintentar: () => setIntento((n) => n + 1),
    mesaInexistente: () => setEntrada({ estado: 'mesa-inexistente' }),
  }
}
