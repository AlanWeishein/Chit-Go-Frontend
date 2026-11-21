import { useEffect, useRef, useState, type FormEvent } from 'react'
import { cargarAusencia, type TipoAusencia } from '../../../compartido/api/empleados'
import { textoDelError } from '../../../compartido/api/errores'
import iconoCancelar from '../../../compartido/ui/iconos/x.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import { TIPOS_DE_AUSENCIA, hoyDelLocal } from '../datosDeEmpleado'
import ErrorDeCampo from './ErrorDeCampo'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const rotulo = 'text-[13px] leading-[normal] font-medium'
const campo = (conError: boolean) =>
  `h-12 w-full rounded-xl bg-tarjeta px-3.5 text-[15px] leading-[normal] text-texto ${
    conError ? 'border-2 border-primario' : 'border-[1.25px] border-secundario'
  } ${foco}`

// "Cargar ausencia" de P-23c (HU-14). El Mockup dibuja solo el botón: el diálogo se arma con el estilo de P-23d.
// POST /admin/empleados/{id}/ausencias con {tipo, desde, hasta}; sin fecha de vuelta, `hasta` va en null y se
// termina a mano. Mientras dura, el empleado no aparece en el login ni cuenta como mozo de turno.
export default function CargarAusencia({
  empleadoId,
  nombre,
  alCancelar,
  alCargar,
}: {
  empleadoId: number
  nombre: string
  alCancelar: () => void
  alCargar: () => void
}) {
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const tipoRef = useRef<HTMLSelectElement>(null)
  const desdeRef = useRef<HTMLInputElement>(null)
  const hastaRef = useRef<HTMLInputElement>(null)
  const [tipo, setTipo] = useState<TipoAusencia>('VACACIONES')
  const [desde, setDesde] = useState(hoyDelLocal)
  const [hasta, setHasta] = useState('')
  const [intentado, setIntentado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialogo = dialogoRef.current
    const abrio = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialogo && !dialogo.open) dialogo.showModal()
    tipoRef.current?.focus()
    return () => {
      dialogo?.close()
      if (abrio?.isConnected) abrio.focus()
    }
  }, [])

  // Los textos de los 400 del back ("Falta la fecha de inicio", "La ausencia no puede terminar antes de empezar").
  const errorDesde = intentado && !desde ? 'Falta la fecha de inicio.' : null
  const errorHasta = intentado && desde && hasta && hasta < desde ? 'La ausencia no puede terminar antes de empezar.' : null

  async function confirmar(e: FormEvent) {
    e.preventDefault()
    if (enviando) return
    setIntentado(true)
    if (!desde) return desdeRef.current?.focus()
    if (hasta && hasta < desde) return hastaRef.current?.focus()
    setEnviando(true)
    setError(null)
    try {
      await cargarAusencia(empleadoId, { tipo, desde, hasta: hasta || null })
      alCargar()
    } catch (err) {
      setError(textoDelError(err))
      setEnviando(false)
    }
  }

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-ausencia"
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
        <h2 id="titulo-ausencia" className="titulo text-[28px]">
          Ausencia de {nombre}
        </h2>
        <p className="text-[15px] leading-[1.45] text-secundario">
          Mientras dura, no aparece en el login ni cuenta como mozo de turno. Sin fecha de vuelta, se termina a mano.
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ausencia-tipo" className={rotulo}>
            Tipo
          </label>
          <select
            ref={tipoRef}
            id="ausencia-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoAusencia)}
            className={campo(false)}
          >
            {TIPOS_DE_AUSENCIA.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.texto}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label htmlFor="ausencia-desde" className={rotulo}>
              Desde
            </label>
            <input
              ref={desdeRef}
              id="ausencia-desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              aria-invalid={errorDesde !== null}
              aria-describedby={errorDesde ? 'ausencia-desde-error' : undefined}
              className={campo(errorDesde !== null)}
            />
            {errorDesde && <ErrorDeCampo id="ausencia-desde-error">{errorDesde}</ErrorDeCampo>}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label htmlFor="ausencia-hasta" className={rotulo}>
              Hasta (opcional)
            </label>
            <input
              ref={hastaRef}
              id="ausencia-hasta"
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => setHasta(e.target.value)}
              aria-invalid={errorHasta !== null}
              aria-describedby={errorHasta ? 'ausencia-hasta-error ausencia-hasta-ayuda' : 'ausencia-hasta-ayuda'}
              className={campo(errorHasta !== null)}
            />
            {errorHasta && <ErrorDeCampo id="ausencia-hasta-error">{errorHasta}</ErrorDeCampo>}
          </div>
        </div>
        <p id="ausencia-hasta-ayuda" className="text-[13px] text-secundario">
          El último día que falta. Vuelve al día siguiente.
        </p>

        {error && <AvisoDeFallo>{error}</AvisoDeFallo>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={alCancelar}
            disabled={enviando}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-[.38] ${foco}`}
          >
            <img src={iconoCancelar} alt="" width={20} height={20} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold text-texto-boton disabled:opacity-[.38] ${foco}`}
          >
            {enviando ? 'Cargando…' : 'Cargar ausencia'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
