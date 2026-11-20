import { useEffect, useRef, type ReactNode } from 'react'
import { botonPrincipal, botonSecundario } from '../../roles/acceso/componentes/MarcoAcceso'

// Mismo dialog nativo que HojaCancelar: foco contenido, Escape y devolución del foco al cerrar.
export default function ConfirmarOperacion({ titulo, children, confirmacion, onConfirmar, onVolver }: {
  titulo: string
  children: ReactNode
  confirmacion: string
  onConfirmar: () => void
  onVolver: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const volver = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    const origen = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogo?.showModal()
    volver.current?.focus()
    return () => {
      dialogo?.close()
      if (origen?.isConnected) origen.focus()
    }
  }, [])

  return (
    <dialog ref={ref} aria-labelledby="confirmar-titulo"
      onCancel={(e) => { e.preventDefault(); onVolver() }}
      className="m-auto max-h-[90dvh] w-[calc(100%-3rem)] max-w-lg overflow-y-auto rounded-[20px] bg-tarjeta p-6 font-inter text-texto backdrop:bg-[rgba(0,0,0,0.42)]">
      <h2 id="confirmar-titulo" className="titulo text-xl">{titulo}</h2>
      <div className="my-5 break-words text-[15px] text-secundario">{children}</div>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={onConfirmar} className={botonPrincipal}>{confirmacion}</button>
        <button type="button" ref={volver} onClick={onVolver} className={botonSecundario}>Volver a revisar</button>
      </div>
    </dialog>
  )
}
