import { useEffect, useRef } from 'react'

// Confirmación de borrado con el <dialog> nativo (mismo patrón que ConfirmarCierre): showModal() deja inerte lo
// de afuera y encierra el foco; Escape y el clic en el fondo equivalen a "No, volver", salvo mientras manda.
export default function ConfirmarBorrado({
  nombre,
  borrando,
  alVolver,
  alConfirmar,
}: {
  nombre: string
  borrando: boolean
  alVolver: () => void
  alConfirmar: () => void
}) {
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const volverRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialogo = dialogoRef.current
    const abrio = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialogo && !dialogo.open) dialogo.showModal()
    volverRef.current?.focus() // el foco arranca en el botón que no hace nada: un Enter apurado no borra
    return () => {
      dialogo?.close()
      if (abrio?.isConnected) abrio.focus() // al cerrar, el foco vuelve a quien lo abrió
    }
  }, [])

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-borrar-empleado"
      onCancel={(e) => {
        e.preventDefault()
        if (!borrando) alVolver()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !borrando) alVolver()
      }}
      className="m-auto w-full max-w-md rounded-3xl bg-tarjeta p-0 text-texto shadow-xl backdrop:bg-[rgba(0,0,0,0.42)]"
    >
      <div className="p-8">
        <h2 id="titulo-borrar-empleado" className="font-[Fraunces] text-2xl font-semibold">
          ¿Borrar a {nombre}?
        </h2>
        <p className="mt-3 text-secundario">
          Ya no va a poder entrar al sistema. Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            ref={volverRef}
            type="button"
            onClick={alVolver}
            disabled={borrando}
            className="min-h-12 flex-1 rounded-xl border-2 border-primario font-semibold text-primario disabled:opacity-60"
          >
            ← No, volver
          </button>
          <button
            type="button"
            onClick={alConfirmar}
            disabled={borrando}
            className="min-h-12 flex-1 rounded-xl bg-primario font-semibold text-texto-boton disabled:opacity-60"
          >
            {borrando ? 'Un momento…' : 'Sí, borrar'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
