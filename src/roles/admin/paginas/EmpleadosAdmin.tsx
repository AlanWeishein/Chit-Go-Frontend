import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  darDeBajaEmpleado,
  listarEmpleados,
  type DiaSemana,
  type EmpleadoResumen,
  type RolDeEmpleado,
  type Turno,
} from '../../../compartido/api/empleados'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import type { Pagina } from '../../../compartido/api/paginacion'
import iconoAnterior from '../../../compartido/ui/iconos/arrow-l-primario.svg'
import iconoBaja from '../../../compartido/ui/iconos/ban-20.svg'
import iconoDadoDeBaja from '../../../compartido/ui/iconos/ban.svg'
import iconoActivo from '../../../compartido/ui/iconos/check-14.svg'
import iconoSiguiente from '../../../compartido/ui/iconos/chevron-r-primario.svg'
import iconoAusente from '../../../compartido/ui/iconos/clock.svg'
import iconoBloqueado from '../../../compartido/ui/iconos/lock.svg'
import iconoEditar from '../../../compartido/ui/iconos/pencil.svg'
import iconoNuevo from '../../../compartido/ui/iconos/plus-blanco.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import ConfirmarBorrado from '../componentes/ConfirmarBorrado'

// Empleados y turnos (P-16, HU-14). Solo el Admin. El back pagina (el profe carga muchos con un INSERT) y trae solo
// Mozo, Caja y Cocina; los dados de baja salen marcados y quedan de solo lectura.

// El size que el back usa si no viene.
const POR_PAGINA = 20

const ROL: Record<RolDeEmpleado, string> = { MOZO: 'Mozo', CAJA: 'Caja', COCINA: 'Cocina' }

const DIAS: { dia: DiaSemana; corto: string; letra: string }[] = [
  { dia: 'LUN', corto: 'Lun', letra: 'L' },
  { dia: 'MAR', corto: 'Mar', letra: 'M' },
  { dia: 'MIE', corto: 'Mié', letra: 'X' },
  { dia: 'JUE', corto: 'Jue', letra: 'J' },
  { dia: 'VIE', corto: 'Vie', letra: 'V' },
  { dia: 'SAB', corto: 'Sáb', letra: 'S' },
  { dia: 'DOM', corto: 'Dom', letra: 'D' },
]
const ORDEN = new Map(DIAS.map((d, i) => [d.dia, i]))

const rotulo = 'text-[11px] leading-[normal] font-semibold tracking-[0.66px] text-secundario uppercase'
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const botonContorno = `flex h-11 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-[.38] ${foco}`
const botonDeFila = `inline-flex h-11 items-center gap-2 rounded-[14px] text-[15px] font-semibold whitespace-nowrap underline ${foco}`

// "19:00:00" → "19:00".
function hora(h: string): string {
  return h.slice(0, 5)
}

// Para la grilla, como el Mockup: "19:00:00" → "19", y con minutos "18:30".
function horaCorta(h: string): string {
  return h.slice(3, 5) === '00' ? h.slice(0, 2) : h.slice(0, 5)
}

// Tres o más días seguidos van como rango ("Lun a Vie"); si no, en lista ("Lun, Mié y Vie").
function textoDeDias(indices: number[]): string {
  if (indices.length === 7) return 'Todos los días'
  const seguidos = indices.every((d, i) => i === 0 || d === indices[i - 1] + 1)
  if (seguidos && indices.length >= 3) return `${DIAS[indices[0]].corto} a ${DIAS[indices[indices.length - 1]].corto}`
  const nombres = indices.map((i) => DIAS[i].corto)
  return nombres.length === 1 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

// Junta los días con las mismas horas: una línea por horario ("Lun a Vie · 18:00–02:00"). Un turno que cruza la
// medianoche va en el día en que empieza, como lo guarda el back.
function resumenDeTurnos(turnos: Turno[]): string[] {
  const grupos = new Map<string, { inicio: string; fin: string; dias: Set<number> }>()
  for (const t of turnos) {
    const clave = `${t.horaInicio}|${t.horaFin}`
    const grupo = grupos.get(clave) ?? { inicio: t.horaInicio, fin: t.horaFin, dias: new Set<number>() }
    grupo.dias.add(ORDEN.get(t.dia) ?? 0)
    grupos.set(clave, grupo)
  }
  return [...grupos.values()]
    .map((g) => ({ ...g, indices: [...g.dias].sort((a, b) => a - b) }))
    .sort((a, b) => a.indices[0] - b.indices[0] || a.inicio.localeCompare(b.inicio))
    .map((g) => `${textoDeDias(g.indices)} · ${hora(g.inicio)}–${hora(g.fin)}`)
}

// Dado de baja va primero, después bloqueado y después ausente. El back no manda el género: "Activo", "Ausente".
function Estado({ empleado }: { empleado: EmpleadoResumen }) {
  const [icono, texto] = !empleado.activo
    ? [iconoDadoDeBaja, 'Dado de baja']
    : empleado.bloqueado
      ? [iconoBloqueado, 'Bloqueado']
      : empleado.ausenciaVigente
        ? [iconoAusente, 'Ausente']
        : [iconoActivo, 'Activo']
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-linea py-1 pr-[9px] pl-[7px] text-xs leading-[normal] font-medium whitespace-nowrap">
      <img src={icono} alt="" width={14} height={14} />
      {texto}
    </span>
  )
}

// La grilla de la semana con los turnos de los empleados de la página que se ve (sin los dados de baja ni los que no
// tienen turnos). Es la plantilla: vale igual para todas las semanas.
function GrillaDeTurnos({ empleados }: { empleados: EmpleadoResumen[] }) {
  const conTurnos = empleados.filter((e) => e.activo && e.turnos.length > 0)
  return (
    <section aria-labelledby="titulo-grilla" className="flex flex-col gap-3">
      <h2 id="titulo-grilla" className="text-base leading-[normal] font-semibold">
        Turnos de la semana
      </h2>
      {conTurnos.length === 0 ? (
        <p className="text-[13px] text-secundario">Nadie de esta página tiene turnos cargados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-[13px] leading-[normal]">
            <thead>
              <tr className={`h-[34px] border-b border-linea ${rotulo}`}>
                <th className="w-[150px] px-2.5 font-semibold">Empleado</th>
                {DIAS.map((d) => (
                  <th key={d.dia} className="px-2.5 font-semibold">
                    <abbr title={d.corto} className="no-underline">
                      {d.letra}
                    </abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conTurnos.map((e) => (
                <tr key={e.id} className="h-[42px] not-first:border-t not-first:border-linea">
                  <td className="truncate px-2.5" title={e.nombre}>
                    {e.nombre}
                  </td>
                  {DIAS.map((d) => {
                    const delDia = e.turnos
                      .filter((t) => t.dia === d.dia)
                      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                    return (
                      <td key={d.dia} className="px-2.5 py-1.5">
                        {delDia.length === 0 ? (
                          <span className="text-secundario">—</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {delDia.map((t) => (
                              <span
                                key={t.horaInicio}
                                className="flex h-[30px] items-center justify-center rounded-lg bg-linea text-xs font-medium whitespace-nowrap tabular-nums"
                              >
                                {horaCorta(t.horaInicio)}–{horaCorta(t.horaFin)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// `vez` cambia siempre: dos avisos iguales seguidos vuelven a contar los 5 segundos.
interface Aviso {
  texto: string
  error: boolean
  vez: number
}

export default function EmpleadosAdmin() {
  const location = useLocation()
  const navigate = useNavigate()

  const [page, setPage] = useState(0)
  const [intento, setIntento] = useState(0) // sube para volver a pedir la misma página
  const [datos, setDatos] = useState<Pagina<EmpleadoResumen> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [claveListo, setClaveListo] = useState<string | null>(null)
  const [aviso, setAviso] = useState<Aviso | null>(() => {
    const texto = (location.state as { aviso?: string } | null)?.aviso
    return texto ? { texto, error: false, vez: 0 } : null
  })
  const [aDarDeBaja, setADarDeBaja] = useState<EmpleadoResumen | null>(null)
  const [enviando, setEnviando] = useState(false)

  const ultimoPedido = useRef(0) // vale solo la última respuesta
  const enviandoRef = useRef(false) // el estado llega un render tarde: la ref corta el doble toque
  const vez = useRef(0)

  const clave = `${page}|${intento}`
  const cargando = claveListo !== clave

  function avisar(texto: string, error = false) {
    setAviso({ texto, error, vez: ++vez.current })
  }

  useEffect(() => {
    const numero = ++ultimoPedido.current
    listarEmpleados(page, POR_PAGINA)
      .then((pagina) => {
        if (numero !== ultimoPedido.current) return
        setDatos(pagina)
        setError(null)
        setClaveListo(clave)
      })
      .catch((err) => {
        if (numero !== ultimoPedido.current) return
        setError(textoDelError(err))
        setClaveListo(clave)
      })
  }, [clave, page])

  // El aviso que vino en el state de la navegación (del alta o la edición) se limpia, para que no vuelva al recargar.
  useEffect(() => {
    if ((location.state as { aviso?: string } | null)?.aviso) {
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // El aviso se va solo a los 5 segundos.
  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(id)
  }, [aviso])

  async function confirmarBaja() {
    if (!aDarDeBaja || enviandoRef.current) return
    enviandoRef.current = true
    setEnviando(true)
    const { id, nombre } = aDarDeBaja
    try {
      await darDeBajaEmpleado(id)
      avisar(`Se dio de baja a ${nombre}.`)
      setIntento((n) => n + 1) // sigue en la misma página, ahora como dado de baja
    } catch (err) {
      avisar(textoDelError(err), true)
      const status = statusDe(err)
      if (status === 404 || status === 409) setIntento((n) => n + 1) // la lista que se ve puede estar vieja
    } finally {
      setADarDeBaja(null)
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  const filas = datos?.contenido ?? []
  const total = datos?.totalElementos ?? 0
  const primero = datos && filas.length > 0 ? datos.page * datos.size + 1 : 0
  const ultimo = datos ? datos.page * datos.size + filas.length : 0

  return (
    <section className="flex min-h-full flex-col gap-[18px] bg-fondo px-8 pt-7 pb-6 font-inter text-texto">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 leading-[normal]">
          <h1 className="titulo text-[25px]">Empleados y turnos</h1>
          <p className="text-[13px] text-secundario">
            {datos ? `${total} ${total === 1 ? 'empleado' : 'empleados'} · ` : ''}el PIN identifica a cada uno en la
            auditoría
          </p>
        </div>
        <Link
          to="/admin/empleados/nuevo"
          className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold whitespace-nowrap text-texto-boton ${foco}`}
        >
          <img src={iconoNuevo} alt="" width={20} height={20} />
          Nuevo empleado
        </Link>
      </header>

      {aviso &&
        (aviso.error ? (
          <AvisoDeFallo key={aviso.vez}>{aviso.texto}</AvisoDeFallo>
        ) : (
          <p
            key={aviso.vez}
            role="status"
            className="rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3 text-[15px] font-semibold"
          >
            {aviso.texto}
          </p>
        ))}

      {error && datos !== null && (
        <p role="alert" className="text-[13px] text-secundario">
          No se pudo actualizar la lista. {error}{' '}
          <button type="button" onClick={() => setIntento((n) => n + 1)} className={`inline-flex min-h-11 items-center font-semibold underline ${foco}`}>
            Probá de nuevo
          </button>
        </p>
      )}

      {datos === null && error ? (
        <div className="py-10 text-center">
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setIntento((n) => n + 1)} className={`mt-4 ${botonContorno} mx-auto`}>
            Probá de nuevo
          </button>
        </div>
      ) : datos === null ? (
        <p className="py-10 text-center text-secundario">Cargando los empleados…</p>
      ) : filas.length === 0 ? (
        <p className="py-10 text-center text-secundario">Todavía no hay empleados.</p>
      ) : (
        <>
          <div aria-busy={cargando} className={`overflow-x-auto ${cargando ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[860px] table-fixed border-collapse text-left text-[13px] leading-[normal]">
              <thead>
                <tr className={`h-[34px] border-b border-linea ${rotulo}`}>
                  <th className="px-2.5 font-semibold">Empleado</th>
                  <th className="w-[100px] px-2.5 font-semibold">Rol</th>
                  <th className="w-[230px] px-2.5 font-semibold">Turno</th>
                  <th className="w-[150px] px-2.5 font-semibold">Estado</th>
                  <th className="w-[230px] px-2.5">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((e) => {
                  const turno = resumenDeTurnos(e.turnos)
                  return (
                    <tr key={e.id} className="h-[52px] not-first:border-t not-first:border-linea">
                      <td className={`truncate px-2.5 ${e.activo ? '' : 'text-secundario'}`} title={e.nombre}>
                        {e.nombre}
                      </td>
                      <td className="px-2.5">
                        <span className="rounded-md bg-linea px-[9px] py-1 text-xs font-medium">{ROL[e.rol] ?? e.rol}</span>
                      </td>
                      <td className={`px-2.5 py-2 tabular-nums ${e.activo ? '' : 'text-secundario'}`}>
                        {turno.length === 0 ? (
                          <span className="text-secundario">—</span>
                        ) : (
                          turno.map((linea) => (
                            <span key={linea} className="block whitespace-nowrap">
                              {linea}
                            </span>
                          ))
                        )}
                      </td>
                      <td className="px-2.5">
                        <Estado empleado={e} />
                      </td>
                      <td className="px-2.5">
                        {e.activo && (
                          <div className="flex items-center justify-end gap-5">
                            <Link to={`/admin/empleados/${e.id}`} aria-label={`Editar a ${e.nombre}`} className={botonDeFila}>
                              <img src={iconoEditar} alt="" width={20} height={20} />
                              Editar
                            </Link>
                            <button
                              type="button"
                              onClick={() => setADarDeBaja(e)}
                              aria-label={`Dar de baja a ${e.nombre}`}
                              className={botonDeFila}
                            >
                              <img src={iconoBaja} alt="" width={20} height={20} />
                              Dar de baja
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-[13px] text-secundario tabular-nums">
              Mostrando {primero} a {ultimo} de {total}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || cargando} className={botonContorno}>
                <img src={iconoAnterior} alt="" width={20} height={20} />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= datos.totalPaginas - 1 || cargando}
                className={botonContorno}
              >
                <img src={iconoSiguiente} alt="" width={20} height={20} />
                Siguiente
              </button>
            </div>
          </div>

          <GrillaDeTurnos empleados={filas} />
        </>
      )}

      {aDarDeBaja && (
        <ConfirmarBorrado
          key={aDarDeBaja.id}
          nombre={aDarDeBaja.nombre}
          borrando={enviando}
          alVolver={() => setADarDeBaja(null)}
          alConfirmar={confirmarBaja}
        />
      )}
    </section>
  )
}
