import { useEffect, useRef, useState, type FormEvent } from 'react'
import { crearMesa, editarMesa } from '../../../compartido/api/mesas'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import type { MesaAdmin } from '../../../compartido/tipos/mesas'
import iconoBaja from '../../../compartido/ui/iconos/ban-20.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import ErrorDeCampo from './ErrorDeCampo'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// El límite de MesasAdminController.Numero: de 1 a 20 caracteres.
function validar(numero: string): string | null {
  const n = numero.trim()
  if (!n) return 'Falta el número de la mesa.'
  if (n.length > 20) return 'El número no puede pasar de 20 caracteres.'
  return null
}

// El alta y la edición de una mesa de P-15 (HU-13), en un <dialog>. El Mockup no los dibuja: van con el estilo de
// DialogoDeConfirmacion y los campos de FormularioDeAdmin. En la edición también está "Dar de baja la mesa".
export default function FormularioDeMesa({
  mesa,
  alGuardar,
  alPedirBaja,
  alVolver,
}: {
  mesa: MesaAdmin | null // null: alta
  alGuardar: (mesa: MesaAdmin, nueva: boolean) => void
  alPedirBaja: (mesa: MesaAdmin) => void
  alVolver: () => void
}) {
  const [numero, setNumero] = useState(mesa?.numero ?? '')
  const [intentado, setIntentado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorNumero, setErrorNumero] = useState<string | null>(null) // el 409 del número repetido
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)
  const enviandoRef = useRef(false)
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const campoRef = useRef<HTMLInputElement>(null)

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

  const mensaje = (intentado ? validar(numero) : null) ?? errorNumero

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (enviandoRef.current) return
    setIntentado(true)
    if (validar(numero)) {
      campoRef.current?.focus()
      return
    }
    enviandoRef.current = true
    setEnviando(true)
    setErrorNumero(null)
    setErrorGuardar(null)
    try {
      const guardada = mesa ? await editarMesa(mesa.id, numero.trim()) : await crearMesa(numero.trim())
      alGuardar(guardada, mesa === null)
    } catch (err) {
      if (statusDe(err) === 409) {
        setErrorNumero(textoDelError(err)) // "Ya existe la mesa N", tal cual lo manda el back
        campoRef.current?.focus()
      } else {
        setErrorGuardar(textoDelError(err))
      }
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-mesa"
      onCancel={(e) => {
        e.preventDefault()
        if (!enviando) alVolver()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !enviando) alVolver()
      }}
      className="m-auto w-full max-w-md rounded-3xl bg-tarjeta p-0 text-texto shadow-xl backdrop:bg-[rgba(0,0,0,0.42)]"
    >
      <form onSubmit={guardar} noValidate className="flex flex-col gap-[14px] p-8 leading-[normal]">
        <h2 id="titulo-mesa" className="titulo text-2xl">
          {mesa ? `Editar la Mesa ${mesa.numero}` : 'Nueva mesa'}
        </h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="mesa-numero" className="text-[13px] font-medium">
            Número de mesa
          </label>
          <input
            ref={campoRef}
            id="mesa-numero"
            type="text"
            autoComplete="off"
            placeholder="Ej. 12 o Patio 2"
            value={numero}
            onChange={(e) => {
              setNumero(e.target.value)
              setErrorNumero(null)
            }}
            aria-invalid={mensaje ? true : undefined}
            aria-describedby={mensaje ? 'mesa-numero-error' : undefined}
            className={`h-12 w-full rounded-xl border-[1.25px] border-secundario bg-tarjeta px-[14px] text-[15px] placeholder:text-secundario ${foco}`}
          />
          {mensaje && <ErrorDeCampo id="mesa-numero-error">{mensaje}</ErrorDeCampo>}
        </div>

        {!mesa && <p className="text-[13px] text-secundario">El QR se arma solo, con un código propio de la mesa.</p>}

        {errorGuardar && <AvisoDeFallo>{errorGuardar}</AvisoDeFallo>}

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={alVolver}
            disabled={enviando}
            className={`min-h-12 flex-1 rounded-xl border-2 border-primario font-semibold text-primario disabled:opacity-60 ${foco}`}
          >
            ← Volver
          </button>
          <button
            type="submit"
            disabled={enviando}
            className={`min-h-12 flex-1 rounded-xl bg-primario font-semibold text-texto-boton disabled:opacity-60 ${foco}`}
          >
            {enviando ? 'Un momento…' : mesa ? 'Guardar' : 'Crear mesa'}
          </button>
        </div>

        {mesa && (
          <button
            type="button"
            onClick={() => alPedirBaja(mesa)}
            disabled={enviando}
            className={`flex h-11 items-center gap-2 self-start rounded-[14px] text-[15px] font-semibold underline disabled:opacity-[.38] ${foco}`}
          >
            <img src={iconoBaja} alt="" width={20} height={20} />
            Dar de baja la mesa
          </button>
        )}
      </form>
    </dialog>
  )
}
