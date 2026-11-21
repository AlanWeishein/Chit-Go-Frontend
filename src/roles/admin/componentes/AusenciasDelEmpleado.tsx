import { useState } from 'react'
import { cambiarFinDeAusencia, type EmpleadoDetalle } from '../../../compartido/api/empleados'
import { textoDelError } from '../../../compartido/api/errores'
import iconoMas from '../../../compartido/ui/iconos/plus.svg'
import iconoTerminar from '../../../compartido/ui/iconos/x.svg'
import { comoTerminar, hoyDelLocal, periodoDe, textoDeTipo } from '../datosDeEmpleado'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// La tarjeta "Ausencias" de P-23c (HU-14). El "Quitar" del Mockup pasa a "Terminar": el back no borra ausencias,
// les pone `hasta` (ST-22). Terminar pone `hasta` en ayer, así el empleado entra desde hoy (opción A, Eze,
// 2026-11-21). Una que empieza hoy o más adelante no se puede terminar: el back no acepta un `hasta` antes de
// `desde`, y se dice en la fila.
export default function AusenciasDelEmpleado({
  empleado,
  soloLectura,
  deshabilitado,
  alPedirCarga,
  alTerminar,
  alFallar,
}: {
  empleado: EmpleadoDetalle
  soloLectura: boolean
  deshabilitado: boolean
  alPedirCarga: () => void // el diálogo va afuera del <form> del formulario
  alTerminar: () => void
  alFallar: (texto: string) => void
}) {
  const [terminando, setTerminando] = useState<number | null>(null)
  const hoy = hoyDelLocal()

  async function terminar(ausenciaId: number, hasta: string) {
    if (terminando !== null) return
    setTerminando(ausenciaId)
    try {
      await cambiarFinDeAusencia(empleado.id, ausenciaId, hasta)
      alTerminar()
    } catch (err) {
      alFallar(textoDelError(err))
    } finally {
      setTerminando(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-linea p-[18px]">
      <h2 className="text-[16px] leading-[normal] font-semibold">Ausencias</h2>
      {empleado.ausencias.length === 0 ? (
        <p className="text-[13px]">No tiene ausencias cargadas.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {empleado.ausencias.map((a) => {
            const fin = comoTerminar(a, hoy)
            return (
              <li key={a.id} className="flex items-center gap-2 rounded-xl bg-tarjeta px-3 py-2.5 leading-[normal]">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-[15px]">{textoDeTipo(a.tipo)}</p>
                  <p className="text-[13px] text-secundario">{periodoDe(a)}</p>
                  {!fin.puede && fin.motivo && !soloLectura && <p className="text-[12px]">{fin.motivo}</p>}
                </div>
                {fin.puede && !soloLectura && (
                  <button
                    type="button"
                    disabled={terminando !== null || deshabilitado}
                    onClick={() => void terminar(a.id, fin.hasta)}
                    aria-label={`Terminar ${textoDeTipo(a.tipo).toLowerCase()}, ${periodoDe(a)}`}
                    className={`flex h-11 shrink-0 items-center gap-1.5 rounded-[14px] px-2 text-[14px] font-semibold disabled:opacity-[.38] ${foco}`}
                  >
                    <img src={iconoTerminar} alt="" width={18} height={18} />
                    {terminando === a.id ? 'Terminando…' : 'Terminar'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {!soloLectura && (
        <button
          type="button"
          onClick={alPedirCarga}
          disabled={deshabilitado}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-[.38] ${foco}`}
        >
          <img src={iconoMas} alt="" width={20} height={20} />
          Cargar ausencia
        </button>
      )}
      <p className="text-[12px] leading-[1.4]">
        Vacaciones, franco o baja temporal, con vuelta opcional. Mientras dura, no aparece en el login ni cuenta como
        mozo de turno. Terminarla deja que entre desde hoy.
      </p>
    </div>
  )
}
