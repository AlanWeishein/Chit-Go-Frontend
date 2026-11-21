import { useEffect, useRef, useState, type ReactNode } from 'react'
import { textoDelError } from '../../../compartido/api/errores'
import {
  listarPlatosMasPedidos,
  obtenerTiemposDePreparacion,
  obtenerVentas,
  type Ambito,
} from '../../../compartido/api/reportes'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import iconoElegido from '../../../compartido/ui/iconos/check-16.svg'
import { precio } from '../../cliente/formato'

// Reportes (P-17, HU-15). Solo lectura, para el Admin y el Gerente/Dueño (HU-16): cada uno pide a su ruta del back.

type TipoDePeriodo = 'hoy' | 'semana' | 'mes' | 'personalizado'

const TIPOS: { tipo: TipoDePeriodo; texto: string }[] = [
  { tipo: 'hoy', texto: 'Hoy' },
  { tipo: 'semana', texto: 'Semana' },
  { tipo: 'mes', texto: 'Mes' },
  { tipo: 'personalizado', texto: 'Personalizado' },
]

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

function aTexto(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function deTexto(s: string): Date {
  const [a, m, d] = s.split('-').map(Number)
  return new Date(a, m - 1, d)
}

function sumarDias(d: Date, dias: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias)
}

interface Rango {
  desde: string
  hasta: string
}

// El período elegido y el anterior "del mismo largo", para el "+8 % vs. …": ayer, los mismos días de la semana o
// del mes pasado, o los N días justo antes de uno personalizado. La semana arranca el lunes.
function periodos(tipo: TipoDePeriodo, desde: string, hasta: string): { actual: Rango; anterior: Rango } {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  if (tipo === 'hoy') {
    return { actual: { desde: aTexto(hoy), hasta: aTexto(hoy) }, anterior: { desde: aTexto(sumarDias(hoy, -1)), hasta: aTexto(sumarDias(hoy, -1)) } }
  }
  if (tipo === 'semana') {
    const lunes = sumarDias(hoy, -((hoy.getDay() + 6) % 7))
    return {
      actual: { desde: aTexto(lunes), hasta: aTexto(hoy) },
      anterior: { desde: aTexto(sumarDias(lunes, -7)), hasta: aTexto(sumarDias(hoy, -7)) },
    }
  }
  if (tipo === 'mes') {
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const ultimoDelAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
    const mismoDia = Math.min(hoy.getDate(), ultimoDelAnterior.getDate())
    return {
      actual: { desde: aTexto(primero), hasta: aTexto(hoy) },
      anterior: {
        desde: aTexto(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)),
        hasta: aTexto(new Date(hoy.getFullYear(), hoy.getMonth() - 1, mismoDia)),
      },
    }
  }
  const d = deTexto(desde)
  const dias = Math.round((deTexto(hasta).getTime() - d.getTime()) / 86_400_000) + 1
  return {
    actual: { desde, hasta },
    anterior: { desde: aTexto(sumarDias(d, -dias)), hasta: aTexto(sumarDias(d, -1)) },
  }
}

const TITULO_VENTAS: Record<TipoDePeriodo, string> = {
  hoy: 'Ventas de hoy',
  semana: 'Ventas de la semana',
  mes: 'Ventas del mes',
  personalizado: 'Ventas del período',
}

const CONTRA: Record<TipoDePeriodo, string> = {
  hoy: 'vs. ayer',
  semana: 'vs. la semana anterior',
  mes: 'vs. el mes anterior',
  personalizado: 'vs. el período anterior',
}

// "15 min". Por debajo del minuto, en segundos, para no mostrar "0 min".
function duracion(segundos: number | null): string {
  if (segundos === null || !Number.isFinite(segundos) || segundos < 0) return '—'
  if (segundos < 60) return `${Math.round(segundos)} s`
  return `${Math.round(segundos / 60)} min`
}

// Un reporte = un pedido al back. Cada tarjeta tiene el suyo: si una falla, las otras siguen. La respuesta solo
// vale si es la del último pedido (contador) y si corresponde al rango que se ve (clave): así nunca se muestran
// datos de otras fechas, y "cargando" sale de comparar claves, sin un efecto que prenda banderas.
function useReporte<T>(
  pedir: (ambito: Ambito, desde: string, hasta: string) => Promise<T>,
  ambito: Ambito,
  desde: string,
  hasta: string,
  valido: boolean,
) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<{ clave: string; datos: T | null; error: string | null } | null>(null)
  const ultimoPedido = useRef(0)
  const clave = `${ambito}|${desde}|${hasta}|${intento}`

  useEffect(() => {
    const numero = ++ultimoPedido.current // también descarta lo que vuele si el rango pasó a ser inválido
    if (!valido) return
    pedir(ambito, desde, hasta)
      .then((datos) => {
        if (numero === ultimoPedido.current) setResultado({ clave, datos, error: null })
      })
      .catch((err) => {
        if (numero === ultimoPedido.current) setResultado({ clave, datos: null, error: textoDelError(err) })
      })
  }, [clave, valido, pedir, ambito, desde, hasta])

  const actual = resultado !== null && resultado.clave === clave ? resultado : null
  return {
    cargando: valido && actual === null,
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

export default function ReportesAdmin() {
  const { sesion } = useSesion()
  const ambito: Ambito = sesion?.rol === 'GERENTE_DUENO' ? 'gerente' : 'admin'

  const [tipo, setTipo] = useState<TipoDePeriodo>('semana')
  const [desdeElegido, setDesdeElegido] = useState(() => aTexto(sumarDias(new Date(), -6)))
  const [hastaElegido, setHastaElegido] = useState(() => aTexto(new Date()))

  const personalizado = tipo === 'personalizado'
  const falta = personalizado && (desdeElegido === '' || hastaElegido === '')
  const invertido = personalizado && !falta && desdeElegido > hastaElegido
  const valido = !falta && !invertido
  const errorDeRango = falta ? 'Elegí las dos fechas.' : invertido ? 'La fecha "desde" no puede ser posterior a "hasta".' : null

  const { actual, anterior } = valido
    ? periodos(tipo, desdeElegido, hastaElegido)
    : { actual: { desde: '', hasta: '' }, anterior: { desde: '', hasta: '' } }

  const ventas = useReporte(obtenerVentas, ambito, actual.desde, actual.hasta, valido)
  const ventasAntes = useReporte(obtenerVentas, ambito, anterior.desde, anterior.hasta, valido)
  const tiempos = useReporte(obtenerTiemposDePreparacion, ambito, actual.desde, actual.hasta, valido)
  const platos = useReporte(listarPlatosMasPedidos, ambito, actual.desde, actual.hasta, valido)

  const v = ventas.datos
  const sinVentas = v !== null && v.cantidadCuentas === 0
  const antes = ventasAntes.datos?.totalVentas ?? 0
  // Con el período anterior en 0 no hay contra qué comparar: no se muestra (nota de la ST-31).
  const variacion = v !== null && antes > 0 ? Math.round(((v.totalVentas - antes) / antes) * 100) : null

  const lista = platos.datos ?? []
  const maximo = lista.reduce((m, p) => (p.cantidad > m ? p.cantidad : m), 0)

  const campo = `mt-1 h-11 rounded-xl border-[1.25px] border-secundario bg-tarjeta px-3 text-[15px] ${foco}`
  const valor = 'titulo mt-1.5 text-[30px] tabular-nums'
  const pie = 'mt-1.5 min-h-4 text-[13px]'

  return (
    <section className="flex min-h-full flex-col gap-[18px] bg-fondo px-8 pt-7 pb-6 font-inter text-texto">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5 leading-[normal]">
          <h1 className="titulo text-[25px]">Reportes</h1>
          <p className="text-[13px] text-secundario">Ventas y tiempos de preparación</p>
        </div>
        <div role="group" aria-label="Período" className="flex gap-1 rounded-[14px] bg-linea p-1">
          {TIPOS.map((t) => {
            const elegido = t.tipo === tipo
            return (
              <button
                key={t.tipo}
                type="button"
                aria-pressed={elegido}
                onClick={() => setTipo(t.tipo)}
                className={`flex h-11 items-center gap-1.5 rounded-xl px-4 text-[13px] ${foco} ${
                  elegido ? 'border-[1.5px] border-primario bg-tarjeta font-medium' : ''
                }`}
              >
                {elegido && <img src={iconoElegido} alt="" width={16} height={16} />}
                {t.texto}
              </button>
            )
          })}
        </div>
      </header>

      {personalizado && (
        <div className="flex flex-wrap items-end justify-end gap-3">
          <div>
            <label htmlFor="desde" className="block text-[13px] text-secundario">
              Desde
            </label>
            <input
              id="desde"
              type="date"
              value={desdeElegido}
              onChange={(e) => setDesdeElegido(e.target.value)}
              aria-invalid={errorDeRango ? true : undefined}
              aria-describedby={errorDeRango ? 'error-rango' : undefined}
              className={campo}
            />
          </div>
          <div>
            <label htmlFor="hasta" className="block text-[13px] text-secundario">
              Hasta
            </label>
            <input
              id="hasta"
              type="date"
              value={hastaElegido}
              onChange={(e) => setHastaElegido(e.target.value)}
              aria-invalid={errorDeRango ? true : undefined}
              aria-describedby={errorDeRango ? 'error-rango' : undefined}
              className={campo}
            />
          </div>
        </div>
      )}

      {errorDeRango ? (
        <p id="error-rango" role="alert" className="rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3 text-[15px] font-semibold">
          {errorDeRango}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-[17px]">
            <Tarjeta titulo={TITULO_VENTAS[tipo]} ocupado={ventas.cargando}>
              <Estado cargando={ventas.cargando} error={ventas.error} reintentar={ventas.reintentar}>
                {v && (
                  <>
                    <p className={valor}>{sinVentas ? '—' : precio(v.totalVentas)}</p>
                    <p className={pie}>
                      {sinVentas
                        ? 'Sin datos para el período'
                        : variacion !== null
                          ? `${variacion > 0 ? '+' : ''}${variacion} % ${CONTRA[tipo]}`
                          : null}
                    </p>
                  </>
                )}
              </Estado>
            </Tarjeta>

            <Tarjeta titulo="Ticket promedio" ocupado={ventas.cargando}>
              <Estado cargando={ventas.cargando} error={ventas.error} reintentar={ventas.reintentar}>
                {v && (
                  <>
                    <p className={valor}>{sinVentas ? '—' : precio(v.totalVentas / v.cantidadCuentas)}</p>
                    <p className={pie}>
                      por cuenta cerrada
                      {!sinVentas && ` · ${v.cantidadCuentas} ${v.cantidadCuentas === 1 ? 'cuenta' : 'cuentas'}`}
                    </p>
                  </>
                )}
              </Estado>
            </Tarjeta>

            <Tarjeta titulo="Tiempo promedio de preparación" ocupado={tiempos.cargando}>
              <Estado cargando={tiempos.cargando} error={tiempos.error} reintentar={tiempos.reintentar}>
                {tiempos.datos && (
                  <>
                    <p className={valor}>{duracion(tiempos.datos.cantidadPedidos === 0 ? null : tiempos.datos.promedioSegundos)}</p>
                    <p className={pie}>de en preparación a listo</p>
                  </>
                )}
              </Estado>
            </Tarjeta>
          </div>

          <section aria-busy={platos.cargando} className="flex max-w-[656px] flex-col gap-3 leading-[normal]">
            <h2 className="text-[17px] font-semibold">Platos más vendidos</h2>
            <Estado cargando={platos.cargando} error={platos.error} reintentar={platos.reintentar}>
              {lista.length === 0 ? (
                <p className="text-[13px] text-secundario">Sin datos para el período</p>
              ) : (
                // Una lista con el valor escrito: la barra es solo decoración, así no se depende del color ni
                // del lector de pantalla.
                <ol className="flex flex-col gap-3">
                  {lista.map((p) => (
                    <li key={p.platoId} className="flex flex-col gap-1.5">
                      <div className="flex justify-between gap-4 text-[13px]">
                        <span>{p.nombre}</span>
                        <span className="font-medium tabular-nums">{p.cantidad} u.</span>
                      </div>
                      <div className="h-2 rounded-full bg-linea" aria-hidden="true">
                        <div
                          className="h-2 rounded-full bg-texto"
                          style={{ width: `${maximo > 0 ? Math.max((p.cantidad / maximo) * 100, 2) : 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Estado>
          </section>
        </>
      )}

    </section>
  )
}
