import { useEffect, useRef } from 'react'

// Confirmación genérica con el <dialog> nativo (mismo patrón que ConfirmarCierre y ConfirmarBorrado). Se monta
// solo cuando hace falta: nunca dejarlo dentro de un contenedor fijo que cubra la pantalla.
export default function DialogoDeConfirmacion({
  titulo,
  texto,
  textoConfirmar,
  enviando,
  alVolver,
  alConfirmar,
}: {
  titulo: string
  texto: string
  textoConfirmar: string
  enviando: boolean
  alVolver: () => void
  alConfirmar: () => void
}) {
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const volverRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialogo = dialogoRef.current
    const abrio = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialogo && !dialogo.open) dialogo.showModal()
    volverRef.current?.focus() // el foco arranca en el botón que no hace nada
    return () => {
      dialogo?.close()
      if (abrio?.isConnected) abrio.focus() // al cerrar, vuelve a quien lo abrió
    }
  }, [])

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-confirmacion"
      onCancel={(e) => {
        e.preventDefault()
        if (!enviando) alVolver()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !enviando) alVolver()
      }}
      className="m-auto w-full max-w-md rounded-3xl bg-tarjeta p-0 text-texto shadow-xl backdrop:bg-[rgba(0,0,0,0.42)]"
    >
      <div className="p-8">
        <h2 id="titulo-confirmacion" className="font-[Fraunces] text-2xl font-semibold">
          {titulo}
        </h2>
        <p className="mt-3 text-secundario">{texto}</p>
        <div className="mt-6 flex gap-3">
          <button
            ref={volverRef}
            type="button"
            onClick={alVolver}
            disabled={enviando}
            className="min-h-12 flex-1 rounded-xl border-2 border-primario font-semibold text-primario disabled:opacity-60"
          >
            ← No, volver
          </button>
          <button
            type="button"
            onClick={alConfirmar}
            disabled={enviando}
            className="min-h-12 flex-1 rounded-xl bg-primario font-semibold text-texto-boton disabled:opacity-60"
          >
            {enviando ? 'Un momento…' : textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  )
}
