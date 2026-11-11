import { useEffect, useRef } from 'react'
import iconoVolver from '../../../compartido/ui/iconos/arrow-l-primario.svg'
import iconoCuenta from '../../../compartido/ui/iconos/receipt-blanco.svg'
import { precio } from '../formato'

// P-03d: la confirmación de pedir la cuenta, como hoja desde abajo. Es el mismo <dialog> modal que HojaCancelar:
// el foco queda adentro, Escape la cierra y el fondo oscuro es la única excepción a la paleta (DESIGN.md). Sin sombra.
export default function HojaPedirCuenta({
  total,
  pidiendo,
  onConfirmar,
  onVolver,
}: {
  total: number
  pidiendo: boolean
  onConfirmar: () => void
  onVolver: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const volver = useRef<HTMLButtonElement>(null)

  // showModal deja el foco en el primer botón: se pasa a "Volver", que no hace nada, así un Enter apurado no pide
  // la cuenta. Al cerrar, el foco vuelve al botón que abrió la hoja (si sigue en pantalla) y no queda en el body.
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
      aria-labelledby="hoja-cuenta-titulo"
      onCancel={(e) => {
        e.preventDefault()
        if (!pidiendo) onVolver()
      }}
      className="mx-auto mt-auto mb-0 w-full max-w-lg rounded-t-[28px] rounded-b-[20px] bg-tarjeta px-6 pt-7 pb-9 font-inter text-texto backdrop:bg-[rgba(0,0,0,0.42)]"
    >
      <div className="flex flex-col gap-4">
        <h2 id="hoja-cuenta-titulo" className="titulo text-2xl leading-[1.2] text-texto">
          ¿Pedimos la cuenta?
        </h2>
        <div className="flex flex-col gap-0.5 rounded-2xl bg-fondo px-[18px] py-4 text-texto">
          <p className="text-[13px] text-secundario">Total</p>
          <p className="titulo text-[30px]">{precio(total)}</p>
        </div>
        <p className="text-[15px] leading-[1.4] text-secundario">
          Le avisamos al mozo y Caja la ve para cerrarla. Hasta que emitan el ticket, podés seguir pidiendo.
        </p>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={pidiendo}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold text-texto-boton"
        >
          <img src={iconoCuenta} alt="" width={20} height={20} />
          {pidiendo ? 'Pidiendo la cuenta…' : 'Pedir la cuenta'}
        </button>
        <button
          type="button"
          onClick={onVolver}
          disabled={pidiendo}
          ref={volver}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario"
        >
          <img src={iconoVolver} alt="" width={20} height={20} />
          Volver
        </button>
      </div>
    </dialog>
  )
}
