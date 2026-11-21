import { useEffect, useRef, useState } from 'react'
import { cambiarInhabilitada } from '../../../compartido/api/mesas'
import { textoDelError } from '../../../compartido/api/errores'
import type { MesaAdmin } from '../../../compartido/tipos/mesas'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import ErrorDeCampo from './ErrorDeCampo'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const MAXIMO = 255 // MesasAdminController.Disponibilidad

// Inhabilitar una mesa de P-15 (HU-13, RF-38), con el motivo. El back acepta el motivo vacío, así que es opcional.
// Con la cuenta abierta el back responde 409 "Cerrá la cuenta antes de inhabilitar o dar de baja la mesa": el
// texto queda acá, en el diálogo, tal cual.
export default function InhabilitarMesa({
  mesa,
  alInhabilitar,
  alVolver,
}: {
  mesa: MesaAdmin
  alInhabilitar: (mesa: MesaAdmin) => void
  alVolver: () => void
}) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const enviandoRef = useRef(false)
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const campoRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const dialogo = dialogoRef.current
    const abrio = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialogo && !dialogo.open) dialogo.showModal()
    campoRef.current?.focus()
    return () => {
      dialogo?.close()
      if (abrio?.isConnected) abrio.focus()
    }
  }, [])

  const largo = motivo.trim().length
  const errorMotivo = largo > MAXIMO ? `El motivo no puede pasar de ${MAXIMO} caracteres.` : null

  async function confirmar() {
    if (enviandoRef.current || errorMotivo) return
    enviandoRef.current = true
    setEnviando(true)
    setError(null)
    try {
      alInhabilitar(await cambiarInhabilitada(mesa.id, true, motivo.trim() || null))
    } catch (err) {
      setError(textoDelError(err))
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-inhabilitar"
      onCancel={(e) => {
        e.preventDefault()
        if (!enviando) alVolver()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !enviando) alVolver()
      }}
      className="m-auto w-full max-w-md rounded-3xl bg-tarjeta p-0 text-texto shadow-xl backdrop:bg-[rgba(0,0,0,0.42)]"
    >
      <div className="flex flex-col gap-[14px] p-8 leading-[normal]">
        <h2 id="titulo-inhabilitar" className="titulo text-2xl">
          ¿Inhabilitar la Mesa {mesa.numero}?
        </h2>
        <p className="leading-[1.4] text-secundario">
          No abre cuentas hasta que la vuelvas a habilitar. El QR sigue siendo el mismo.
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="mesa-motivo" className="text-[13px] font-medium">
            Motivo (opcional)
          </label>
          <textarea
            ref={campoRef}
            id="mesa-motivo"
            rows={2}
            placeholder="Ej. Rota"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            aria-invalid={errorMotivo ? true : undefined}
            aria-describedby={errorMotivo ? 'mesa-motivo-error' : undefined}
            className={`w-full resize-none rounded-xl border-[1.25px] border-secundario bg-tarjeta px-[14px] py-3 text-[15px] placeholder:text-secundario ${foco}`}
          />
          {errorMotivo && <ErrorDeCampo id="mesa-motivo-error">{errorMotivo}</ErrorDeCampo>}
        </div>

        {error && <AvisoDeFallo>{error}</AvisoDeFallo>}

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={alVolver}
            disabled={enviando}
            className={`min-h-12 flex-1 rounded-xl border-2 border-primario font-semibold text-primario disabled:opacity-60 ${foco}`}
          >
            ← No, volver
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={enviando}
            className={`min-h-12 flex-1 rounded-xl bg-primario font-semibold text-texto-boton disabled:opacity-60 ${foco}`}
          >
            {enviando ? 'Un momento…' : 'Sí, inhabilitar'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
