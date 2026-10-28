import { useEffect, useRef } from 'react'
import iconoVolver from '../../../compartido/ui/iconos/arrow-l-primario.svg'
import iconoXBlanco from '../../../compartido/ui/iconos/x-blanco.svg'

// P-03b: la confirmación de cancelar, como hoja desde abajo. Es un <dialog> modal: el foco queda adentro y
// Escape la cierra. El fondo oscuro es la única excepción a la paleta (DESIGN.md). Sin sombra.
export default function HojaCancelar({
  numero,
  cancelando,
  onConfirmar,
  onVolver,
}: {
  numero: number
  cancelando: boolean
  onConfirmar: () => void
  onVolver: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const volver = useRef<HTMLButtonElement>(null)

  // showModal deja el foco en el primer botón: se pasa a "No, volver", así un Enter apurado no cancela.
  useEffect(() => {
    const dialogo = ref.current
    if (dialogo && !dialogo.open) dialogo.showModal()
    volver.current?.focus()
    return () => dialogo?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="hoja-cancelar-titulo"
      onCancel={(e) => {
        e.preventDefault()
        if (!cancelando) onVolver()
      }}
      className="mx-auto mt-auto mb-0 w-full max-w-lg rounded-t-[28px] rounded-b-[20px] bg-tarjeta px-6 pt-7 pb-9 font-inter text-texto backdrop:bg-[rgba(0,0,0,0.42)]"
    >
      <div className="flex flex-col gap-4">
        <h2 id="hoja-cancelar-titulo" className="titulo text-2xl leading-[1.2] text-texto">
          ¿Cancelamos el pedido #{numero}?
        </h2>
        <p className="text-[15px] leading-[1.4] text-secundario">
          Todavía está en espera, así que lo podés cancelar. Una vez que Caja lo aprueba, ya no.
        </p>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={cancelando}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold text-texto-boton"
        >
          <img src={iconoXBlanco} alt="" width={20} height={20} />
          {cancelando ? 'Cancelando…' : 'Sí, cancelar el pedido'}
        </button>
        <button
          type="button"
          onClick={onVolver}
          disabled={cancelando}
          ref={volver}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario"
        >
          <img src={iconoVolver} alt="" width={20} height={20} />
          No, volver
        </button>
      </div>
    </dialog>
  )
}
