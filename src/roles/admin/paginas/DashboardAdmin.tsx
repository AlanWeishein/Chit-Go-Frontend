import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { listarAuditoria, textoDeAccion, type RegistroDeAuditoria } from '../../../compartido/api/auditoria'
import { textoDelError } from '../../../compartido/api/errores'
import { listarMesas } from '../../../compartido/api/mesas'
import { obtenerTiemposDePreparacion, obtenerVentas } from '../../../compartido/api/reportes'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import iconoImprimir from '../../../compartido/ui/iconos/printer-primario.svg'
import iconoBaja from '../../../compartido/ui/iconos/ban-20.svg'
import iconoFlecha from '../../../compartido/ui/iconos/arrow-r.svg'
import iconoMas from '../../../compartido/ui/iconos/plus.svg'
import iconoReportes from '../../../compartido/ui/iconos/chart.svg'
import { precio } from '../../cliente/formato'
import { fechaHoraCorta, nombreDeEntidad } from '../componentes/DetalleDeAuditoria'

// El dashboard del Admin (P-13, ST-34). Se arma en el front con lo que el back ya da: no hay un GET /admin/dashboard.
// Todo es de hoy, en la zona del navegador, como Reportes (P-17). No se actualiza en vivo: se pide al entrar.
// El gráfico "Ventas por hora" es de la tarea 2: acá queda solo el lugar con el título.

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

const ACCESOS = [
  { a: '/admin/menu/nuevo', texto: 'Nuevo plato', icono: iconoMas },
  { a: '/admin/disponibilidad', texto: 'Plato no disponible', icono: iconoBaja },
  { a: '/admin/mesas', texto: 'Nueva mesa', icono: iconoMas },
  { a: '/admin/mesas', texto: 'Imprimir QR', icono: iconoImprimir },
  { a: '/admin/empleados/nuevo', texto: 'Nuevo empleado', icono: iconoMas },
]

export default function DashboardAdmin() {
  const { sesion } = useSesion()
  const [{ ahora, hoy, mismoDia }] = useState(() => {
    const ahora = new Date()
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    return { ahora, hoy: aTexto(hoy), mismoDia: aTexto(sumarDias(hoy, -7)) }
  })

  const ventas = useBloque(() => obtenerVentas('admin', hoy, hoy))
  const ventasAntes = useBloque(() => obtenerVentas('admin', mismoDia, mismoDia))
  const tiempos = useBloque(() => obtenerTiemposDePreparacion('admin', hoy, hoy))
  const mesas = useBloque(listarMesas)
  const actividad = useBloque(() => listarAuditoria('admin', 0, 4))

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
        {/* El gráfico va en la tarea 2. Este es su lugar, con el tamaño del nodo (646 × 258). */}
        <section className="flex flex-col gap-3.5 leading-[normal]">
          <div className="flex min-h-[52px] items-center">
            <h2 className="text-[17px] font-semibold">Ventas por hora</h2>
          </div>
          <div className="h-[192px]" />
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
