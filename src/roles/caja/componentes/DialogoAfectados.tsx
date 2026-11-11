import { useEffect, useRef } from 'react'
import type { PedidoAfectado } from '../../../compartido/api/platos'
import iconoVolver from '../../../compartido/ui/iconos/arrow-l-primario.svg'
import iconoAprobado from '../../../compartido/ui/iconos/check-14.svg'
import iconoEspera from '../../../compartido/ui/iconos/clock.svg'
import iconoCancelar from '../../../compartido/ui/iconos/x-blanco.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'

const ESTADOS: Record<PedidoAfectado['estado'], { texto: string; icono: string }> = {
  PENDIENTE_APROBACION: { texto: 'En espera', icono: iconoEspera },
  APROBADO: { texto: 'Aprobado', icono: iconoAprobado },
}

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// P-10b: al apagar un plato, los pedidos que todavía no empezaron en cocina y lo tienen. Es un <dialog> modal,
// como ConfirmarCierre: el foco queda adentro, arranca en "No, que sigan" y Escape o tocar afuera es lo mismo que
// "No, que sigan". El fondo oscuro es la única excepción a la paleta (DESIGN.md). Sin sombra, aunque Figma dibuja una.
export default function DialogoAfectados({
  nombrePlato,
  afectados,
  enviando,
  error,
  fallo,
  alDejarSeguir,
  alCancelar,
  alVerComoQuedaron,
}: {
  nombrePlato: string
  afectados: PedidoAfectado[]
  enviando: boolean
  error: string | null // texto del back si algo salió mal
  fallo: boolean // 409 o 404: el back no canceló ninguno
  alDejarSeguir: () => void
  alCancelar: () => void
  alVerComoQuedaron: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const botonNo = useRef<HTMLButtonElement>(null)
  const n = afectados.length

  useEffect(() => {
    const dialogo = ref.current
    const abrio = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialogo && !dialogo.open) dialogo.showModal()
    botonNo.current?.focus()
    return () => {
      dialogo?.close()
      if (abrio?.isConnected) abrio.focus()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="titulo-afectados"
      onCancel={(e) => {
        e.preventDefault()
        if (!enviando) alDejarSeguir()
      }}
      // El <dialog> no tiene padding: un clic que le llega directo es un clic en el fondo oscuro.
      onClick={(e) => {
        if (e.target === e.currentTarget && !enviando) alDejarSeguir()
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[580px] rounded-[20px] bg-tarjeta p-0 font-inter text-texto backdrop:bg-[rgba(0,0,0,0.42)]"
    >
      <div className="flex flex-col gap-3.5 p-8">
        <h2 id="titulo-afectados" className="titulo text-[26px] leading-[1.2] text-texto">
          {n === 1 ? 'Hay 1 pedido' : `Hay ${n} pedidos`} con {nombrePlato}. ¿Los cancelamos?
        </h2>

        {/* Figma dibuja tres filas; con más, la lista tiene su propio scroll y el diálogo no se pasa de la pantalla. */}
        <ul className="max-h-60 overflow-y-auto rounded-xl border border-linea">
          {afectados.map((p) => {
            const estado = ESTADOS[p.estado]
            return (
              <li key={p.id} className="flex h-12 items-center justify-between gap-2 px-3.5 text-[15px] font-medium">
                <span>
                  Mesa {p.mesa} · #{p.id}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-linea px-[7px] py-1 text-xs leading-[normal] font-medium whitespace-nowrap">
                  <img src={estado.icono} alt="" width={14} height={14} />
                  {estado.texto}
                </span>
              </li>
            )
          })}
        </ul>

        <p className="text-sm leading-[1.4] text-secundario">
          Si los cancelás, se cancela cada pedido entero y cada cliente recibe el aviso. Si no, el plato queda no
          disponible y esos pedidos siguen.
        </p>

        {error &&
          (fallo ? (
            <AvisoDeFallo titulo={error}>No se canceló ninguno.</AvisoDeFallo>
          ) : (
            <AvisoDeFallo>{error}</AvisoDeFallo>
          ))}

        <div className="flex gap-3">
          <button
            ref={botonNo}
            type="button"
            onClick={alDejarSeguir}
            disabled={enviando}
            className={`flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-[.38] ${foco}`}
          >
            <img src={iconoVolver} alt="" width={20} height={20} />
            No, que sigan
          </button>
          {fallo ? (
            <button
              type="button"
              onClick={alVerComoQuedaron}
              disabled={enviando}
              className={`flex h-[52px] min-w-0 flex-1 items-center justify-center rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold whitespace-nowrap text-texto-boton disabled:opacity-[.38] ${foco}`}
            >
              {enviando ? 'Un momento…' : 'Ver cómo quedaron'}
            </button>
          ) : (
            <button
              type="button"
              onClick={alCancelar}
              disabled={enviando}
              className={`flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold whitespace-nowrap text-texto-boton disabled:opacity-[.38] ${foco}`}
            >
              <img src={iconoCancelar} alt="" width={20} height={20} />
              {enviando ? 'Un momento…' : `Sí, cancelar ${n === 1 ? 'el 1' : `los ${n}`}`}
            </button>
          )}
        </div>
      </div>
    </dialog>
  )
}
