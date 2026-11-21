import type { DiaSemana, Turno } from '../../../compartido/api/empleados'
import iconoElegido from '../../../compartido/ui/iconos/check-16.svg'
import iconoMas from '../../../compartido/ui/iconos/plus.svg'
import iconoQuitar from '../../../compartido/ui/iconos/x.svg'
import { DIAS, ORDEN, hora } from '../turnos'
import ErrorDeCampo from './ErrorDeCampo'

// El turno de P-23 (HU-14). El back guarda una plantilla semanal: un turno por día, con su hora de entrada y de
// salida. Si sale antes de la hora en que entra, termina al día siguiente (decidido el 13/10, P-23c).
//
// Hay dos formas de cargarlo:
// - "simple", la del Mockup: se marcan los días y se ponen Entra y Sale una sola vez. Se manda un turno por día.
// - "porDia": una fila por turno, cada una con su día y sus horas. Es para el empleado que tiene días con horas
//   distintas, o dos turnos el mismo día, que la fila del Mockup no puede mostrar.

export interface FilaDeTurno {
  clave: number // solo para React: los turnos del back no tienen id
  dia: DiaSemana
  entra: string
  sale: string
}

export type EstadoDelTurno =
  | { modo: 'simple'; dias: DiaSemana[]; entra: string; sale: string }
  | { modo: 'porDia'; filas: FilaDeTurno[] }

let ultimaClave = 0
const nuevaClave = () => ++ultimaClave

const enOrden = (a: DiaSemana, b: DiaSemana) => (ORDEN.get(a) ?? 0) - (ORDEN.get(b) ?? 0)

// Entra en la fila del Mockup si todos los turnos tienen las mismas horas y no hay dos el mismo día.
function cabeEnUnaFila(turnos: { dia: DiaSemana; entra: string; sale: string }[]): boolean {
  if (turnos.length === 0) return true
  const dias = new Set(turnos.map((t) => t.dia))
  return dias.size === turnos.length && turnos.every((t) => t.entra === turnos[0].entra && t.sale === turnos[0].sale)
}

// Lo que llega del back (o lo que quedó pendiente del alta) pasa a la forma que se edita.
export function estadoDesde(turnos: Turno[]): EstadoDelTurno {
  const filas = turnos
    .map((t) => ({ dia: t.dia, entra: hora(t.horaInicio), sale: hora(t.horaFin) }))
    .sort((a, b) => enOrden(a.dia, b.dia) || a.entra.localeCompare(b.entra))
  if (cabeEnUnaFila(filas)) {
    return { modo: 'simple', dias: filas.map((f) => f.dia), entra: filas[0]?.entra ?? '', sale: filas[0]?.sale ?? '' }
  }
  return { modo: 'porDia', filas: filas.map((f) => ({ ...f, clave: nuevaClave() })) }
}

// Lo que se manda a PUT /turnos, con las horas como "19:00".
export function turnosDe(estado: EstadoDelTurno): Turno[] {
  if (estado.modo === 'simple') {
    return [...estado.dias].sort(enOrden).map((dia) => ({ dia, horaInicio: estado.entra, horaFin: estado.sale }))
  }
  return estado.filas.map((f) => ({ dia: f.dia, horaInicio: f.entra, horaFin: f.sale }))
}

// Para saber si el turno cambió: el back los manda ordenados y con segundos.
export function mismosTurnos(a: Turno[], b: Turno[]): boolean {
  const texto = (ts: Turno[]) =>
    ts
      .map((t) => `${ORDEN.get(t.dia)} ${hora(t.horaInicio)}-${hora(t.horaFin)}`)
      .sort()
      .join('|')
  return texto(a) === texto(b)
}

export function hayTurnoCargado(estado: EstadoDelTurno): boolean {
  return estado.modo === 'simple' ? estado.dias.length > 0 || !!estado.entra || !!estado.sale : estado.filas.length > 0
}

// Lo que el front controla antes de mandar. Que dos turnos se pisan lo controla el back (400 con el texto).
export function errorDelTurno(estado: EstadoDelTurno): string | null {
  const filas =
    estado.modo === 'simple'
      ? estado.dias.map((dia) => ({ dia, entra: estado.entra, sale: estado.sale }))
      : estado.filas
  if (estado.modo === 'simple' && estado.dias.length === 0 && (estado.entra || estado.sale)) {
    return 'Marcá los días que trabaja.'
  }
  if (filas.some((f) => !f.entra || !f.sale)) return 'Poné a qué hora entra y a qué hora sale.'
  // El texto de HU-14, el mismo que responde el back.
  if (filas.some((f) => f.entra === f.sale)) return 'El turno no puede empezar y terminar a la misma hora'
  return null
}

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const rotulo = 'text-[13px] leading-[normal] font-medium'
const campoHora = (conError: boolean) =>
  `h-12 rounded-xl bg-tarjeta px-3.5 text-[15px] leading-[normal] text-texto tabular-nums disabled:opacity-[.38] ${
    conError ? 'border-2 border-primario' : 'border-[1.25px] border-secundario'
  } ${foco}`
const botonTexto = `flex h-11 items-center gap-2 self-start rounded-[14px] text-[14px] font-semibold underline disabled:opacity-[.38] ${foco}`

export default function TurnoSemanal({
  estado,
  alCambiar,
  error,
  deshabilitado,
}: {
  estado: EstadoDelTurno
  alCambiar: (estado: EstadoDelTurno) => void
  error: string | null
  deshabilitado: boolean
}) {
  const conError = error !== null
  const descripcion = conError ? 'turno-error turno-ayuda' : 'turno-ayuda'

  function pasarAPorDia() {
    if (estado.modo !== 'simple') return
    const dias = estado.dias.length > 0 ? [...estado.dias].sort(enOrden) : (['LUN'] as DiaSemana[])
    alCambiar({
      modo: 'porDia',
      filas: dias.map((dia) => ({ clave: nuevaClave(), dia, entra: estado.entra, sale: estado.sale })),
    })
  }

  function pasarASimple() {
    if (estado.modo !== 'porDia') return
    const filas = [...estado.filas].sort((a, b) => enOrden(a.dia, b.dia))
    alCambiar({ modo: 'simple', dias: filas.map((f) => f.dia), entra: filas[0]?.entra ?? '', sale: filas[0]?.sale ?? '' })
  }

  return (
    <div role="group" aria-labelledby="turno-titulo" className="flex flex-col gap-2.5">
      <p id="turno-titulo" className={rotulo}>
        Turno
      </p>

      {estado.modo === 'simple' ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Días que trabaja">
            {DIAS.map((d) => {
              const elegido = estado.dias.includes(d.dia)
              return (
                <button
                  key={d.dia}
                  type="button"
                  aria-pressed={elegido}
                  aria-label={d.largo}
                  disabled={deshabilitado}
                  onClick={() =>
                    alCambiar({
                      ...estado,
                      dias: elegido ? estado.dias.filter((x) => x !== d.dia) : [...estado.dias, d.dia],
                    })
                  }
                  className={`flex h-11 items-center justify-center rounded-full text-[14px] leading-[normal] disabled:opacity-[.38] ${foco} ${
                    elegido ? 'gap-1 bg-suave px-3 font-medium' : 'w-11 border-[1.25px] border-secundario'
                  }`}
                >
                  {elegido && <img src={iconoElegido} alt="" width={16} height={16} />}
                  {d.letra}
                </button>
              )
            })}
          </div>
          <div className="flex items-end gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="turno-entra" className={rotulo}>
                Entra
              </label>
              <input
                id="turno-entra"
                type="time"
                value={estado.entra}
                disabled={deshabilitado}
                onChange={(e) => alCambiar({ ...estado, entra: e.target.value })}
                aria-invalid={conError}
                aria-describedby={descripcion}
                className={`w-[120px] ${campoHora(conError)}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="turno-sale" className={rotulo}>
                Sale
              </label>
              <input
                id="turno-sale"
                type="time"
                value={estado.sale}
                disabled={deshabilitado}
                onChange={(e) => alCambiar({ ...estado, sale: e.target.value })}
                aria-invalid={conError}
                aria-describedby={descripcion}
                className={`w-[120px] ${campoHora(conError)}`}
              />
            </div>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {estado.filas.map((f, i) => {
            const cambiar = (cambio: Partial<FilaDeTurno>) =>
              alCambiar({ modo: 'porDia', filas: estado.filas.map((x) => (x.clave === f.clave ? { ...x, ...cambio } : x)) })
            return (
              <li key={f.clave} className="flex flex-wrap items-center gap-2.5">
                <select
                  aria-label={`Día del turno ${i + 1}`}
                  value={f.dia}
                  disabled={deshabilitado}
                  onChange={(e) => cambiar({ dia: e.target.value as DiaSemana })}
                  className={`w-[150px] ${campoHora(false)}`}
                >
                  {DIAS.map((d) => (
                    <option key={d.dia} value={d.dia}>
                      {d.largo[0].toUpperCase() + d.largo.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  aria-label={`Entra, turno ${i + 1}`}
                  value={f.entra}
                  disabled={deshabilitado}
                  onChange={(e) => cambiar({ entra: e.target.value })}
                  aria-invalid={conError}
                  aria-describedby={descripcion}
                  className={`w-[120px] ${campoHora(conError)}`}
                />
                <span aria-hidden="true">a</span>
                <input
                  type="time"
                  aria-label={`Sale, turno ${i + 1}`}
                  value={f.sale}
                  disabled={deshabilitado}
                  onChange={(e) => cambiar({ sale: e.target.value })}
                  aria-invalid={conError}
                  aria-describedby={descripcion}
                  className={`w-[120px] ${campoHora(conError)}`}
                />
                <button
                  type="button"
                  disabled={deshabilitado}
                  onClick={() => alCambiar({ modo: 'porDia', filas: estado.filas.filter((x) => x.clave !== f.clave) })}
                  aria-label={`Quitar el turno ${i + 1}`}
                  className={`flex size-11 items-center justify-center rounded-[14px] disabled:opacity-[.38] ${foco}`}
                >
                  <img src={iconoQuitar} alt="" width={20} height={20} />
                </button>
              </li>
            )
          })}
          {estado.filas.length === 0 && <li className="text-[13px] text-secundario">Sin turnos cargados.</li>}
          <li>
            <button
              type="button"
              disabled={deshabilitado}
              onClick={() => {
                const ultima = estado.filas[estado.filas.length - 1]
                alCambiar({
                  modo: 'porDia',
                  filas: [
                    ...estado.filas,
                    { clave: nuevaClave(), dia: ultima?.dia ?? 'LUN', entra: ultima?.entra ?? '', sale: ultima?.sale ?? '' },
                  ],
                })
              }}
              className={botonTexto}
            >
              <img src={iconoMas} alt="" width={20} height={20} />
              Agregar turno
            </button>
          </li>
        </ul>
      )}

      {error && <ErrorDeCampo id="turno-error">{error}</ErrorDeCampo>}
      <p id="turno-ayuda" className="text-[13px] leading-[1.4] text-secundario">
        Si sale antes de la hora de entrada, el turno termina al día siguiente (por ejemplo, de 19:00 a 01:00).
      </p>

      {!deshabilitado &&
        (estado.modo === 'simple' ? (
          <button type="button" onClick={pasarAPorDia} className={botonTexto}>
            Cargar horarios distintos según el día
          </button>
        ) : (
          cabeEnUnaFila(estado.filas) && (
            <button type="button" onClick={pasarASimple} className={botonTexto}>
              Usar el mismo horario todos los días
            </button>
          )
        ))}
    </div>
  )
}
