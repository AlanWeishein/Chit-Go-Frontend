import { useEffect, useRef, useState, type ReactNode } from 'react'
import { textoDelError } from '../../../compartido/api/errores'
import {
  listarPlatosMasPedidos,
  obtenerTiemposDePreparacion,
  obtenerVentas,
} from '../../../compartido/api/reportes'
import { precio } from '../../cliente/formato'

function aTexto(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function hoy(): string {
  return aTexto(new Date())
}

function haceTreintaDias(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return aTexto(d)
}

function duracion(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return '—'
  const total = Math.round(segundos)
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// Un reporte = un pedido al back. Cada sección tiene el suyo: si una falla, las otras siguen. La respuesta solo
// vale si es la del último pedido (contador) y si corresponde al rango que se ve (clave): así nunca se muestran
// datos de otras fechas, y "cargando" sale de comparar claves, sin un efecto que prenda banderas.
function useReporte<T>(pedir: (desde: string, hasta: string) => Promise<T>, desde: string, hasta: string, valido: boolean) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<{ clave: string; datos: T | null; error: string | null } | null>(null)
  const ultimoPedido = useRef(0)
  const clave = `${desde}|${hasta}|${intento}`

  useEffect(() => {
    const numero = ++ultimoPedido.current // también descarta lo que vuele si el rango pasó a ser inválido
    if (!valido) return
    pedir(desde, hasta)
      .then((datos) => {
        if (numero === ultimoPedido.current) setResultado({ clave, datos, error: null })
      })
      .catch((err) => {
        if (numero === ultimoPedido.current) setResultado({ clave, datos: null, error: textoDelError(err) })
      })
  }, [clave, valido, pedir, desde, hasta])

  const actual = resultado !== null && resultado.clave === clave ? resultado : null
  return {
    cargando: valido && actual === null,
    datos: actual?.datos ?? null,
    error: actual?.error ?? null,
    reintentar: () => setIntento((n) => n + 1),
  }
}

function Tarjeta({
  titulo,
  cargando,
  error,
  reintentar,
  children,
}: {
  titulo: string
  cargando: boolean
  error: string | null
  reintentar: () => void
  children: ReactNode
}) {
  return (
    <section aria-busy={cargando} className="rounded-2xl border border-linea bg-tarjeta p-6">
      <h2 className="text-sm font-semibold tracking-wide text-secundario">{titulo}</h2>
      {cargando ? (
        <p className="mt-4 text-secundario">Cargando…</p>
      ) : error ? (
        <div role="alert" className="mt-4">
          <p>{error}</p>
          <button
            type="button"
            onClick={reintentar}
            className="mt-3 min-h-11 rounded-xl border-2 border-primario px-4 font-semibold text-primario"
          >
            Probá de nuevo
          </button>
        </div>
      ) : (
        children
      )}
    </section>
  )
}

export default function ReportesAdmin() {
  const [desde, setDesde] = useState(haceTreintaDias)
  const [hasta, setHasta] = useState(hoy)

  const falta = desde === '' || hasta === ''
  const invertido = !falta && desde > hasta
  const valido = !falta && !invertido
  const errorDeRango = falta ? 'Elegí las dos fechas.' : invertido ? 'La fecha "desde" no puede ser mayor que "hasta".' : null

  const ventas = useReporte(obtenerVentas, desde, hasta, valido)
  const tiempos = useReporte(obtenerTiemposDePreparacion, desde, hasta, valido)
  const platos = useReporte(listarPlatosMasPedidos, desde, hasta, valido)

  const lista = platos.datos ?? []
  const maximo = lista.reduce((m, p) => (p.cantidad > m ? p.cantidad : m), 0)

  const campo = 'min-h-11 rounded-xl border border-linea bg-tarjeta px-3'

  return (
    <section className="min-h-dvh bg-fondo p-8 text-texto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[Fraunces] text-3xl font-semibold">Reportes</h1>
          <p className="mt-1 text-sm text-secundario">Ventas, tiempos de preparación y platos más pedidos del local.</p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label htmlFor="desde" className="block text-xs font-semibold text-secundario">
              Desde
            </label>
            <input
              id="desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              aria-invalid={errorDeRango ? true : undefined}
              aria-describedby={errorDeRango ? 'error-rango' : undefined}
              className={`${campo} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="hasta" className="block text-xs font-semibold text-secundario">
              Hasta
            </label>
            <input
              id="hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              aria-invalid={errorDeRango ? true : undefined}
              aria-describedby={errorDeRango ? 'error-rango' : undefined}
              className={`${campo} mt-1`}
            />
          </div>
        </div>
      </div>

      {errorDeRango && (
        <p id="error-rango" role="alert" className="mt-4 rounded-xl border-2 border-primario bg-tarjeta p-3 font-semibold">
          ⚠ {errorDeRango}
        </p>
      )}

      {valido && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Tarjeta titulo="VENTAS DEL PERÍODO" cargando={ventas.cargando} error={ventas.error} reintentar={ventas.reintentar}>
              {ventas.datos && (
                <>
                  <p className="mt-2 font-[Fraunces] text-4xl font-semibold tabular-nums">{precio(ventas.datos.total)}</p>
                  <dl className="mt-4 space-y-1 text-sm">
                    {ventas.datos.cantidadCuentas !== undefined && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-secundario">Cuentas cerradas</dt>
                        <dd className="font-semibold tabular-nums">{ventas.datos.cantidadCuentas}</dd>
                      </div>
                    )}
                    {ventas.datos.ticketPromedio !== undefined && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-secundario">Ticket promedio</dt>
                        <dd className="font-semibold tabular-nums">{precio(ventas.datos.ticketPromedio)}</dd>
                      </div>
                    )}
                  </dl>
                </>
              )}
            </Tarjeta>

            <Tarjeta
              titulo="TIEMPO PROMEDIO DE PREPARACIÓN"
              cargando={tiempos.cargando}
              error={tiempos.error}
              reintentar={tiempos.reintentar}
            >
              {tiempos.datos && (
                <>
                  <p className="mt-2 font-[Fraunces] text-4xl font-semibold tabular-nums">
                    {duracion(tiempos.datos.promedioSegundos)}
                  </p>
                  <p className="mt-4 text-sm text-secundario">
                    minutos y segundos
                    {tiempos.datos.cantidadPedidos !== undefined && ` · ${tiempos.datos.cantidadPedidos} pedidos`}
                  </p>
                </>
              )}
            </Tarjeta>
          </div>

          <Tarjeta titulo="PLATOS MÁS PEDIDOS" cargando={platos.cargando} error={platos.error} reintentar={platos.reintentar}>
            {lista.length === 0 ? (
              <p className="mt-4 text-secundario">No hay pedidos en este período.</p>
            ) : (
              // Una lista con el valor escrito: la barra es solo decoración, así no se depende del color ni
              // del lector de pantalla.
              <ol className="mt-4 space-y-4">
                {lista.map((p, i) => (
                  <li key={`${i}-${p.plato}`}>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="font-medium">{p.plato}</span>
                      <span className="font-semibold tabular-nums">{p.cantidad}</span>
                    </div>
                    <div className="mt-1 h-3 rounded-full bg-suave" aria-hidden="true">
                      <div
                        className="h-3 rounded-full bg-primario"
                        style={{ width: `${maximo > 0 ? Math.max((p.cantidad / maximo) * 100, 2) : 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Tarjeta>
        </div>
      )}
    </section>
  )
}
