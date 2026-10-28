import { useEffect, useState, type ReactNode } from 'react'
import { llamarAlMozo, traducirError } from '../../../compartido/api/cliente'
import iconoCampana22 from '../../../compartido/ui/iconos/bell.svg'
import iconoCampana20 from '../../../compartido/ui/iconos/bell-20.svg'
import iconoCheck from '../../../compartido/ui/iconos/check-22.svg'
import iconoCheckBlanco from '../../../compartido/ui/iconos/check-blanco.svg'

type Llamado = 'libre' | 'llamando' | 'avisado' | 'no-se-pudo'

const DURACION_AVISO_MS = 5000

// La barra fija de abajo del cliente: "Llamar al mozo" a la izquierda y, si la pantalla tiene una,
// su acción principal a la derecha (children). Sin acción, "Llamar al mozo" ocupa todo el ancho (P-01b).
export default function BarraDeAbajo({ tokenSesion, children }: { tokenSesion: string; children?: ReactNode }) {
  const [llamado, setLlamado] = useState<Llamado>('libre')

  // P-01e: el mensaje y "Mozo avisado" se van solos. El error queda hasta el próximo intento.
  useEffect(() => {
    if (llamado !== 'avisado') return
    const t = setTimeout(() => setLlamado('libre'), DURACION_AVISO_MS)
    return () => clearTimeout(t)
  }, [llamado])

  // Lo puede usar también el modo lectura (13/10). Un 409 es un llamado que el mozo todavía no atendió.
  async function llamar() {
    if (llamado === 'llamando') return
    setLlamado('llamando')
    try {
      await llamarAlMozo(tokenSesion)
      setLlamado('avisado')
    } catch (err) {
      setLlamado(traducirError(err).motivo === 'mozo-ya-avisado' ? 'avisado' : 'no-se-pudo')
    }
  }

  const avisado = llamado === 'avisado'
  const conAccion = children !== undefined && children !== null && children !== false
  const texto = avisado ? 'Mozo avisado' : llamado === 'llamando' ? 'Avisando…' : 'Llamar al mozo'

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-linea bg-tarjeta">
      <div className="relative mx-auto flex max-w-lg items-center gap-2.5 px-6 pt-3 pb-[max(22px,env(safe-area-inset-bottom))]">
        <div aria-live="polite" className="absolute inset-x-4 bottom-full mb-4">
          {avisado && (
            <p className="flex h-[52px] items-center gap-2.5 rounded-[14px] bg-primario px-4 text-sm font-medium text-texto-boton">
              <img src={iconoCheckBlanco} alt="" width={20} height={20} />
              Ya avisamos al mozo.
            </p>
          )}
          {llamado === 'no-se-pudo' && (
            <p className="rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3 text-[15px] font-semibold text-texto">
              No pudimos avisar al mozo. Probá de nuevo.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={llamar}
          disabled={llamado === 'llamando'}
          className={`flex items-center justify-center rounded-[14px] ${
            avisado ? 'bg-fondo text-texto' : 'border-[1.5px] border-primario text-primario'
          } ${
            conAccion
              ? 'h-[60px] w-[108px] shrink-0 flex-col gap-[3px] p-1.5 text-xs font-medium'
              : 'h-14 min-w-0 flex-1 gap-2 px-[18px] text-[15px] font-semibold'
          }`}
        >
          {avisado ? (
            <img src={iconoCheck} alt="" width={22} height={22} />
          ) : conAccion ? (
            <img src={iconoCampana22} alt="" width={22} height={22} />
          ) : (
            <img src={iconoCampana20} alt="" width={20} height={20} />
          )}
          {texto}
        </button>

        {children}
      </div>
    </div>
  )
}
