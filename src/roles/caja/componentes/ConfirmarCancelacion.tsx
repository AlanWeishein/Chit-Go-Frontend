import { useEffect, useRef } from 'react'
import iconoVolver from '../../../compartido/ui/iconos/arrow-l-primario.svg'
import iconoCancelar from '../../../compartido/ui/iconos/x-blanco.svg'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// P-36b: la confirmación antes de cancelar un pedido aprobado que la cocina todavía no empezó. Es un <dialog> modal,
// como ConfirmarCierre: el foco queda adentro, arranca en "No, volver" y Escape o tocar afuera es lo mismo que volver.
// El fondo oscuro es la única excepción a la paleta (DESIGN.md). Sin sombra, aunque Figma dibuja una.
export default function ConfirmarCancelacion({
  pedidoId,
  mesa,
  enviando,
  alConfirmar,
  alVolver,
}: {
  pedidoId: number
  mesa: string
  enviando: boolean
  alConfirmar: () => void
  alVolver: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const volver = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    const abrio = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialogo && !dialogo.open) dialogo.showModal()
    volver.current?.focus()
    return () => {
      dialogo?.close()
      if (abrio?.isConnected) abrio.focus()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirmar-cancelacion-titulo"
      onCancel={(e) => {
        e.preventDefault()
        if (!enviando) alVolver()
      }}
      // El <dialog> no tiene padding: un clic que le llega directo es un clic en el fondo oscuro.
      onClick={(e) => {
        if (e.target === e.currentTarget && !enviando) alVolver()
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[520px] rounded-[20px] bg-tarjeta p-0 font-inter text-texto backdrop:bg-[rgba(0,0,0,0.42)]"
    >
      <div className="flex flex-col gap-4 p-8">
        <h2 id="confirmar-cancelacion-titulo" className="titulo text-[26px] leading-[1.2] text-texto">
          ¿Cancelamos el pedido #{pedidoId} de la Mesa {mesa}?
        </h2>

        <p className="text-[15px] leading-[1.4] text-secundario">
          Ya está aprobado, pero la cocina todavía no lo empezó. Sale de la cola de cocina y el cliente recibe el aviso.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            ref={volver}
            onClick={alVolver}
            disabled={enviando}
            className={`flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-[.38] ${foco}`}
          >
            <img src={iconoVolver} alt="" width={20} height={20} />
            No, volver
          </button>
          <button
            type="button"
            onClick={alConfirmar}
            disabled={enviando}
            className={`flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold whitespace-nowrap text-texto-boton disabled:opacity-[.38] ${foco}`}
          >
            <img src={iconoCancelar} alt="" width={20} height={20} />
            {enviando ? 'Un momento…' : 'Sí, cancelar pedido'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
