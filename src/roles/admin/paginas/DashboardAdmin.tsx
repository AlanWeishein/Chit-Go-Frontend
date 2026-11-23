import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { listarAuditoria, textoDeAccion, type RegistroDeAuditoria } from '../../../compartido/api/auditoria'
import { textoDelError } from '../../../compartido/api/errores'
import { listarMesas } from '../../../compartido/api/mesas'
import { listarVentasDelPeriodo, obtenerTiemposDePreparacion, obtenerVentas, type Venta } from '../../../compartido/api/reportes'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import iconoElegido from '../../../compartido/ui/iconos/check-14.svg'
import iconoImprimir from '../../../compartido/ui/iconos/printer-primario.svg'
import iconoBaja from '../../../compartido/ui/iconos/ban-20.svg'
import iconoFlecha from '../../../compartido/ui/iconos/arrow-r.svg'
import iconoMas from '../../../compartido/ui/iconos/plus.svg'
import iconoReportes from '../../../compartido/ui/iconos/chart.svg'
import { precio } from '../../cliente/formato'
import { fechaHoraCorta, nombreDeEntidad } from '../componentes/DetalleDeAuditoria'

// El dashboard del Admin (P-13, ST-34). Se arma en el front con lo que el back ya da: no hay un GET /admin/dashboard.
// Todo es de hoy, en la zona del navegador, como Reportes (P-17). No se actualiza en vivo: se pide al entrar.

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const botonContorno = `flex h-11 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario ${foco}`

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

// Copiadas de ReportesAdmin.tsx (no se exportan ahí y esa pantalla no se toca en esta tarea).
function aTexto(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sumarDias(d: Date, dias: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias)
}

// "15 min". Por debajo del minuto, en segundos, para no mostrar "0 min".
function duracion(segundos: number | null): string {
  if (segundos === null || !Number.isFinite(segundos) || segundos < 0) return '—'
  if (segundos < 60) return `${Math.round(segundos)} s`
  return `${Math.round(segundos / 60)} min`
}

// "Buen día" de 06:00 a 11:59, "Buenas tardes" hasta las 19:59 y "Buenas noches" el resto.
function saludoDe(hora: number): string {
  if (hora >= 6 && hora < 12) return 'Buen día'
  if (hora >= 12 && hora < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

// "hace 1 min", "hace 2 h". Desde el día en adelante, la fecha corta ("23/11 21:19"), como la tabla de P-18.
function haceCuanto(iso: string): string {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutos < 1) return 'hace un momento' // también una hora en el futuro, si el reloj está corrido
  if (minutos < 60) return `hace ${minutos} min`
  if (minutos < 24 * 60) return `hace ${Math.floor(minutos / 60)} h`
  return fechaHoraCorta(iso)
}

// Un bloque = uno o dos pedidos al back, y su propio "Probá de nuevo". Si un bloque falla, los otros se ven igual. La
// respuesta solo vale si es la del último pedido: la clave es el número de intento.
function useBloque<T>(pedir: () => Promise<T>) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<{ intento: number; datos: T | null; error: string | null } | null>(null)
  const ultimoPedido = useRef(0)

  useEffect(() => {
    const numero = ++ultimoPedido.current
    pedir()
      .then((datos) => {
        if (numero === ultimoPedido.current) setResultado({ intento, datos, error: null })
      })
      .catch((err) => {
        if (numero === ultimoPedido.current) setResultado({ intento, datos: null, error: textoDelError(err) })
      })
    // `pedir` queda fijo con las fechas de cuando se abrió la pantalla; solo "Probá de nuevo" vuelve a pedir.
  }, [intento])

  const actual = resultado !== null && resultado.intento === intento ? resultado : null
  return {
    cargando: actual === null,
    datos: actual?.datos ?? null,
    error: actual?.error ?? null,
    reintentar: () => setIntento((n) => n + 1),
  }
}

function Estado({ cargando, error, reintentar, children }: { cargando: boolean; error: string | null; reintentar: () => void; children: ReactNode }) {
  if (cargando) return <p className="mt-2 text-[13px] text-secundario">Cargando…</p>
  if (error)
    return (
      <div role="alert" className="mt-2 text-[13px]">
        <p>{error}</p>
        <button type="button" onClick={reintentar} className={`mt-2 inline-flex min-h-11 items-center font-semibold text-primario underline ${foco}`}>
          Probá de nuevo
        </button>
      </div>
    )
  return <>{children}</>
}

function Tarjeta({ titulo, children, ocupado }: { titulo: string; children: ReactNode; ocupado: boolean }) {
  return (
    <section aria-busy={ocupado} className="flex min-h-[114px] flex-col rounded-2xl border border-linea bg-tarjeta px-[18px] py-[18px] leading-[normal]">
      <h2 className="text-[13px]">{titulo}</h2>
      {children}
    </section>
  )
}

// Los SVG traen un solo color: se usan como máscara y el color lo pone el token (como el menú de MarcoAdmin).
function Icono({ src, color = 'bg-primario' }: { src: string; color?: string }) {
  const mascara = `url("${src}") center / contain no-repeat`
  return <span aria-hidden="true" className={`size-5 shrink-0 ${color}`} style={{ mask: mascara, WebkitMask: mascara }} />
}

// "Ventas por hora" (Hoy) y por día (Semana). Las barras se arman sumando `total` por la hora o el día de `cerradaEn`,
// en la hora de la tablet.
type Vista = 'hoy' | 'semana'

interface Barra {
  clave: string
  etiqueta: string // abajo de la barra: "21h", "Lun"
  lectura: string // para el lector de pantalla: "21 h: $ 48.000"
  total: number
}

// Desde la primera hora con ventas hasta la hora actual, sin saltear las horas sin ventas. Las horas después de las
// 00 son de mañana: "hoy" es el día del calendario, como en P-17.
function barrasDeHoy(ventas: Venta[], hoy: string, horaActual: number): Barra[] {
  const porHora = new Array<number>(24).fill(0)
  let primera = 24
  let ultima = -1
  for (const v of ventas) {
    const d = new Date(v.cerradaEn)
    if (aTexto(d) !== hoy) continue
    porHora[d.getHours()] += v.total
    primera = Math.min(primera, d.getHours())
    ultima = Math.max(ultima, d.getHours())
  }
  if (ultima < 0) return []
  const barras: Barra[] = []
  for (let h = primera; h <= Math.max(horaActual, ultima); h++) {
    const hora = String(h).padStart(2, '0')
    barras.push({ clave: hora, etiqueta: `${hora}h`, lectura: `${hora} h: ${precio(porHora[h])}`, total: porHora[h] })
  }
  return barras
}

// De lunes a hoy, como "Semana" en P-17.
function barrasDeLaSemana(ventas: Venta[], lunes: Date, hoy: string): Barra[] {
  const porDia = new Map<string, number>()
  for (const v of ventas) {
    const dia = aTexto(new Date(v.cerradaEn))
    porDia.set(dia, (porDia.get(dia) ?? 0) + v.total)
  }
  const barras: Barra[] = []
  for (let d = lunes; aTexto(d) <= hoy; d = sumarDias(d, 1)) {
    const clave = aTexto(d)
    const nombre = DIAS[d.getDay()].charAt(0).toUpperCase() + DIAS[d.getDay()].slice(1)
    const total = porDia.get(clave) ?? 0
    const fecha = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    barras.push({ clave, etiqueta: nombre.slice(0, 3), lectura: `${nombre} ${fecha}: ${precio(total)}`, total })
  }
  return barras.some((b) => b.total > 0) ? barras : []
}

// La más alta va oscura, como la de las 00h del nodo (si hay empate, todas las más altas). Cada barra mide como mucho
// 72 px, como en el nodo: si son pocas, no se estiran. Con más de 12 (Hoy, de mañana a la noche) se juntan y la
// etiqueta sale una sí y una no, porque "18h" no entra abajo de una barra de 20 px.
function Barras({ barras }: { barras: Barra[] }) {
  const maximo = Math.max(...barras.map((b) => b.total))
  const muchas = barras.length > 12
  const fila = `flex ${muchas ? 'gap-1' : 'gap-2.5'}`
  const columna = 'min-w-0 max-w-[72px] flex-1'
  return (
    <div className="flex flex-col gap-1.5">
      <ul className={`${fila} h-[170px] items-end`}>
        {barras.map((b) => {
          const alto = (b.total / maximo) * 100
          return (
            <li key={b.clave} tabIndex={0} aria-label={b.lectura} className={`group relative flex h-full items-end rounded-[4px] ${columna} ${foco}`}>
              <span
                aria-hidden="true"
                className={`w-full rounded-[4px] ${b.total === maximo ? 'bg-primario' : 'bg-linea'}`}
                style={{ height: b.total > 0 ? `max(${alto}%, 2px)` : 0 }}
              />
              {/* El monto, arriba de la barra, al pasar el mouse o con Tab. El lector de pantalla lee el aria-label. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 z-10 hidden -translate-x-1/2 rounded-md bg-texto px-2 py-1 text-[13px] font-medium whitespace-nowrap text-texto-boton group-hover:block group-focus-visible:block"
                style={{ bottom: `calc(${alto}% + 6px)` }}
              >
                {precio(b.total)}
              </span>
            </li>
          )
        })}
      </ul>
      <div aria-hidden="true" className={fila}>
        {barras.map((b, i) => (
          <span key={b.clave} className={`${columna} h-4 text-center text-[13px] whitespace-nowrap text-secundario`}>
            {muchas && i % 2 === 1 ? '' : b.etiqueta}
          </span>
        ))}
      </div>
    </div>
  )
}

const ACCESOS = [
  { a: '/admin/menu/nuevo', texto: 'Nuevo plato', icono: iconoMas },
  { a: '/admin/disponibilidad', texto: 'Plato no disponible', icono: iconoBaja },
  { a: '/admin/mesas', texto: 'Nueva mesa', icono: iconoMas },
  { a: '/admin/mesas', texto: 'Imprimir QR', icono: iconoImprimir },
  { a: '/admin/empleados/nuevo', texto: 'Nuevo empleado', icono: iconoMas },
]

export default function DashboardAdmin() {
  const { sesion } = useSesion()
  const [{ ahora, hoy, mismoDia, lunes }] = useState(() => {
    const ahora = new Date()
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    // La semana arranca el lunes, como en ReportesAdmin.tsx.
    return { ahora, hoy: aTexto(hoy), mismoDia: aTexto(sumarDias(hoy, -7)), lunes: sumarDias(hoy, -((hoy.getDay() + 6) % 7)) }
  })
  const [vista, setVista] = useState<Vista>('hoy')

  const ventas = useBloque(() => obtenerVentas('admin', hoy, hoy))
  const ventasAntes = useBloque(() => obtenerVentas('admin', mismoDia, mismoDia))
  const tiempos = useBloque(() => obtenerTiemposDePreparacion('admin', hoy, hoy))
  const mesas = useBloque(listarMesas)
  const actividad = useBloque(() => listarAuditoria('admin', 0, 4))
  // Un solo pedido, de lunes a hoy: Hoy sale de filtrar esas cuentas, y cambiar de vista no vuelve a pedir.
  const ventasDeLaSemana = useBloque(() => listarVentasDelPeriodo('admin', aTexto(lunes), hoy))

  const nombreDeDia = DIAS[ahora.getDay()]
  const dosDigitos = (n: number) => String(n).padStart(2, '0')
  const primerNombre = sesion?.nombre.trim().split(/\s+/)[0]

  const v = ventas.datos
  const sinVentas = v !== null && v.cantidadCuentas === 0
  const antes = ventasAntes.datos?.totalVentas ?? 0
  // Con el mismo día de la semana pasada en 0 no hay contra qué comparar: no se muestra, como en P-17.
  const variacion = v !== null && !sinVentas && antes > 0 ? Math.round(((v.totalVentas - antes) / antes) * 100) : null

  const t = tiempos.datos
  const totalMesas = mesas.datos?.length ?? 0
  const inhabilitadas = mesas.datos?.filter((m) => m.inhabilitada).length ?? 0
  const filas: RegistroDeAuditoria[] = actividad.datos?.contenido ?? []
  const cuentas = ventasDeLaSemana.datos
  const barras = cuentas === null ? [] : vista === 'hoy' ? barrasDeHoy(cuentas, hoy, ahora.getHours()) : barrasDeLaSemana(cuentas, lunes, hoy)

  // 4 px entre el título, el número y la línea de abajo, como el nodo (en Reportes son 6).
  const valor = 'titulo mt-1 text-[30px] tabular-nums'
  const pie = 'mt-1 min-h-4 text-[13px]'

  return (
    <section className="flex min-h-full flex-col gap-[18px] bg-fondo px-8 pt-7 pb-6 font-inter text-texto">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5 leading-[normal]">
          <h1 className="titulo text-[25px]">
            {saludoDe(ahora.getHours())}
            {primerNombre ? `, ${primerNombre}` : ''}
          </h1>
          <p className="text-[13px] text-secundario">
            {nombreDeDia.charAt(0).toUpperCase() + nombreDeDia.slice(1)} {dosDigitos(ahora.getDate())}/{dosDigitos(ahora.getMonth() + 1)} · resumen de hoy
          </p>
        </div>
        <Link to="/admin/reportes" className={botonContorno}>
          <Icono src={iconoReportes} />
          Ver reportes
        </Link>
      </header>

      <div className="grid grid-cols-4 gap-4">
        <Tarjeta titulo="Ventas de hoy" ocupado={ventas.cargando}>
          {/* "Probá de nuevo" pide también el día de la semana pasada: si falló, la línea de comparación vuelve. */}
          <Estado
            cargando={ventas.cargando}
            error={ventas.error}
            reintentar={() => {
              ventas.reintentar()
              ventasAntes.reintentar()
            }}
          >
            {v && (
              <>
                <p className={valor}>{precio(v.totalVentas)}</p>
                <p className={pie}>
                  {sinVentas
                    ? 'Sin ventas todavía'
                    : variacion !== null
                      ? `${variacion > 0 ? '+' : ''}${variacion} % vs. el ${DIAS[ahora.getDay()]} pasado`
                      : null}
                </p>
              </>
            )}
          </Estado>
        </Tarjeta>

        <Tarjeta titulo="Pedidos preparados hoy" ocupado={tiempos.cargando}>
          <Estado cargando={tiempos.cargando} error={tiempos.error} reintentar={tiempos.reintentar}>
            {t && (
              <>
                <p className={valor}>{t.cantidadPedidos}</p>
                <p className={pie} />
              </>
            )}
          </Estado>
        </Tarjeta>

        <Tarjeta titulo="Tiempo de preparación" ocupado={tiempos.cargando}>
          <Estado cargando={tiempos.cargando} error={tiempos.error} reintentar={tiempos.reintentar}>
            {t && (
              <>
                <p className={valor}>{duracion(t.cantidadPedidos === 0 ? null : t.promedioSegundos)}</p>
                <p className={pie}>de en preparación a listo</p>
              </>
            )}
          </Estado>
        </Tarjeta>

        <Tarjeta titulo="Mesas habilitadas" ocupado={mesas.cargando}>
          <Estado cargando={mesas.cargando} error={mesas.error} reintentar={mesas.reintentar}>
            {mesas.datos && (
              <>
                <p className={valor}>
                  {totalMesas - inhabilitadas} / {totalMesas}
                </p>
                <p className={pie}>
                  {totalMesas === 0
                    ? 'Sin mesas cargadas'
                    : inhabilitadas === 0
                      ? 'Todas habilitadas'
                      : inhabilitadas === 1
                        ? '1 inhabilitada'
                        : `${inhabilitadas} inhabilitadas`}
                </p>
              </>
            )}
          </Estado>
        </Tarjeta>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-4">
        {/* 646 × 258, como el nodo: la fila del título con el selector (52) y el gráfico (192). */}
        <section aria-busy={ventasDeLaSemana.cargando} className="flex flex-col gap-3.5 leading-[normal]">
          <div className="flex min-h-[52px] items-center justify-between gap-4">
            <h2 className="text-[17px] font-semibold">Ventas por hora</h2>
            <div role="group" aria-label="Período del gráfico" className="flex gap-1 rounded-xl bg-linea p-1">
              {(
                [
                  { vista: 'hoy', texto: 'Hoy' },
                  { vista: 'semana', texto: 'Semana' },
                ] as const
              ).map((o) => {
                const elegida = o.vista === vista
                return (
                  <button
                    key={o.vista}
                    type="button"
                    aria-pressed={elegida}
                    onClick={() => setVista(o.vista)}
                    className={`flex h-11 items-center gap-1.5 rounded-[9px] px-3.5 text-[13px] ${foco} ${
                      elegida ? 'border-[1.5px] border-primario bg-tarjeta font-medium' : ''
                    }`}
                  >
                    {elegida && <img src={iconoElegido} alt="" width={14} height={14} />}
                    {o.texto}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="min-h-[192px]">
            <Estado cargando={ventasDeLaSemana.cargando} error={ventasDeLaSemana.error} reintentar={ventasDeLaSemana.reintentar}>
              {cuentas && (barras.length === 0 ? <p className="text-[13px] text-secundario">Sin ventas todavía</p> : <Barras barras={barras} />)}
            </Estado>
          </div>
        </section>

        <section aria-busy={actividad.cargando} className="flex flex-col gap-2.5 leading-[normal]">
          <h2 className="text-[17px] font-semibold">Actividad reciente</h2>
          <Estado cargando={actividad.cargando} error={actividad.error} reintentar={actividad.reintentar}>
            {actividad.datos && filas.length === 0 ? (
              <p className="text-[13px] text-secundario">Todavía no hay actividad hoy</p>
            ) : (
              <ol>
                {filas.map((r) => (
                  <li key={r.id} className="py-2.5 text-[13px] not-first:border-t not-first:border-linea first:pt-0 last:pb-0">
                    <p className="truncate" title={`${r.usuario} · ${textoDeAccion(r.accion)} · ${nombreDeEntidad(r)}`}>
                      {r.usuario} · {textoDeAccion(r.accion)} · {nombreDeEntidad(r)}
                    </p>
                    <p className="text-secundario">
                      <time dateTime={r.creadoEn}>{haceCuanto(r.creadoEn)}</time>
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Estado>
          <Link to="/admin/auditoria" className={`flex min-h-11 items-center gap-2 self-start text-[15px] font-semibold text-texto underline ${foco}`}>
            <Icono src={iconoFlecha} color="bg-texto" />
            Ver auditoría completa
          </Link>
        </section>
      </div>

      <section className="flex flex-col gap-[18px] leading-[normal]">
        <h2 className="text-[17px] font-semibold">Accesos rápidos</h2>
        <ul className="flex flex-wrap gap-2.5">
          {ACCESOS.map((a) => (
            <li key={a.texto}>
              <Link to={a.a} className={botonContorno}>
                <Icono src={a.icono} />
                {a.texto}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
