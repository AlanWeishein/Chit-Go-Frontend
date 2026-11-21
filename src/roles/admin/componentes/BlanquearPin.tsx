import { useEffect, useRef, useState, type FormEvent } from 'react'
import { blanquearPin, type EmpleadoDetalle } from '../../../compartido/api/empleados'
import { textoDelError } from '../../../compartido/api/errores'
import iconoGenerar from '../../../compartido/ui/iconos/refresh.svg'
import iconoCancelar from '../../../compartido/ui/iconos/x.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import { ERROR_DE_PIN, PIN_VALIDO, generarPin } from '../datosDeEmpleado'
import ErrorDeCampo from './ErrorDeCampo'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const botonContorno = `flex h-12 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-[.38] ${foco}`

// P-23d, "Blanquear PIN" (HU-14, CP-10-06). POST /admin/empleados/{id}/pin con el PIN provisorio que escribe el Admin:
// el back vuelve los intentos a 0, levanta el bloqueo y le pide elegir uno propio al entrar. Mismo <dialog> que
// ConfirmarBorrado: Escape y el clic en el fondo cancelan, salvo mientras manda.
export default function BlanquearPin({
  empleado,
  alCancelar,
  alBlanquear,
}: {
  empleado: EmpleadoDetalle
  alCancelar: () => void
  alBlanquear: (actualizado: EmpleadoDetalle) => void
}) {
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const pinRef = useRef<HTMLInputElement>(null)
  const [pin, setPin] = useState(generarPin)
  const [intentado, setIntentado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialogo = dialogoRef.current
    const abrio = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialogo && !dialogo.open) dialogo.showModal()
    pinRef.current?.focus()
    return () => {
      dialogo?.close()
      if (abrio?.isConnected) abrio.focus()
    }
  }, [])

  const errorPin = intentado && !PIN_VALIDO.test(pin) ? ERROR_DE_PIN : null
  const primerNombre = empleado.nombre.split(' ')[0]

  async function confirmar(e: FormEvent) {
    e.preventDefault()
    if (enviando) return
    setIntentado(true)
    if (!PIN_VALIDO.test(pin)) {
      pinRef.current?.focus()
      return
    }
    setEnviando(true)
    setError(null)
    try {
      alBlanquear(await blanquearPin(empleado.id, pin))
    } catch (err) {
      setError(textoDelError(err))
      setEnviando(false)
    }
  }

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-blanqueo"
      aria-describedby="texto-blanqueo"
      onCancel={(e) => {
        e.preventDefault()
        if (!enviando) alCancelar()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !enviando) alCancelar()
      }}
      className="m-auto w-full max-w-[540px] rounded-3xl bg-tarjeta p-0 text-texto shadow-xl backdrop:bg-[rgba(0,0,0,0.42)]"
    >
      <form onSubmit={confirmar} noValidate className="flex flex-col gap-4 p-8 font-inter leading-[normal]">
        <h2 id="titulo-blanqueo" className="titulo text-[28px]">
          ¿Blanqueamos el PIN de {primerNombre}?
        </h2>
        <p id="texto-blanqueo" className="text-[15px] leading-[1.45] text-secundario">
          Le ponemos uno provisorio. Si estaba bloqueado, se destraba, y la próxima vez que entre tiene que elegir uno
          propio.
        </p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="blanqueo-pin" className="sr-only">
            PIN provisorio
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={pinRef}
              id="blanqueo-pin"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              aria-invalid={errorPin !== null}
              aria-describedby={errorPin ? 'blanqueo-pin-error blanqueo-pin-ayuda' : 'blanqueo-pin-ayuda'}
              className={`h-12 w-[150px] rounded-xl bg-fondo px-3.5 text-center text-[22px] font-semibold tracking-[0.3em] tabular-nums ${
                errorPin ? 'border-2 border-primario' : 'border-0'
              } ${foco}`}
            />
            <button type="button" onClick={() => setPin(generarPin())} disabled={enviando} className={botonContorno}>
              <img src={iconoGenerar} alt="" width={20} height={20} />
              Generar otro
            </button>
          </div>
          {errorPin && <ErrorDeCampo id="blanqueo-pin-error">{errorPin}</ErrorDeCampo>}
          <p id="blanqueo-pin-ayuda" className="text-[13px] text-secundario">
            PIN provisorio. Se lo das en persona.
          </p>
        </div>

        {error && <AvisoDeFallo>{error}</AvisoDeFallo>}

        <div className="flex gap-3">
          <button type="button" onClick={alCancelar} disabled={enviando} className={`flex-1 ${botonContorno}`}>
            <img src={iconoCancelar} alt="" width={20} height={20} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold text-texto-boton disabled:opacity-[.38] ${foco}`}
          >
            {enviando ? 'Blanqueando…' : 'Blanquear PIN'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
