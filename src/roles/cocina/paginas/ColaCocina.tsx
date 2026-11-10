// La pantalla de cocina, el KDS (P-11, HU-11): la barra de arriba y las tres columnas, En cola, En preparación y
// Listo. Pensada para una tablet apaisada o un monitor, para leerse de lejos. La barra de Avisos del Mockup no va.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { empezarPedido, marcarListo, obtenerCola, type VistaDeCocina } from '../../../compartido/api/cocina'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import iconoAlerta from '../../../compartido/ui/iconos/alert.svg'
import iconoSalir from '../../../compartido/ui/iconos/logout.svg'
import iconoUsuarios from '../../../compartido/ui/iconos/users.svg'
import iconoCerrar from '../../../compartido/ui/iconos/x.svg'
import { useEnVivo } from '../../../compartido/ws/useEnVivo'
import TarjetaCocina, { type ColumnaDeCocina } from '../componentes/TarjetaCocina'
import { hora, useAhora } from '../tiempo'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

const COLUMNAS: { clave: ColumnaDeCocina; titulo: string; vacia: string }[] = [
  { clave: 'enCola', titulo: 'En cola', vacia: 'No hay pedidos en cola.' },
  { clave: 'enPreparacion', titulo: 'En preparación', vacia: 'Nada en preparación.' },
  { clave: 'listos', titulo: 'Listo', vacia: 'Todavía no hay pedidos listos.' },
]

// Lo que manda el botón de cada columna. "Listo" no tiene.
const LLAMADA: Partial<Record<ColumnaDeCocina, (id: number) => Promise<void>>> = {
  enCola: empezarPedido,
  enPreparacion: marcarListo,
}

const AVISO_MS = 5000

export default function ColaCocina() {
  const { sesion, cerrar } = useSesion()
  const [vista, setVista] = useState<VistaDeCocina | null>(null)
  const [error, setError] = useState<string | null>(null)
  // `vez` cambia con cada aviso, así uno igual al anterior vuelve a contar los 5 segundos desde cero.
  const [aviso, setAviso] = useState<{ texto: string; vez: number } | null>(null)
  const [saliendo, setSaliendo] = useState(false)
  const ahora = useAhora()
  // Si salen dos pedidos de la cola seguidos, vale solo la respuesta del último: una vieja que llega tarde no pisa.
  const ultimoPedido = useRef(0)
  const hayVista = useRef(false)
  const vecesAvisado = useRef(0)

  // Los pedidos con el botón quieto. El número es la primera recarga que puede soltarlo: mientras la llamada está en
  // vuelo es Infinity, y después, la recarga que se pide al volver. Una recarga que salió antes (un evento) trae la
  // cola vieja, con el pedido todavía en su columna, y si lo soltara un segundo toque daría 409.
  const soltarDesde = useRef(new Map<number, number>())
  const [quietos, setQuietos] = useState<ReadonlySet<number>>(new Set())

  const avisar = useCallback((texto: string) => {
    setAviso({ texto, vez: ++vecesAvisado.current })
  }, [])

  const soltar = useCallback((recarga: number) => {
    let cambio = false
    for (const [id, desde] of soltarDesde.current) {
      if (desde <= recarga) {
        soltarDesde.current.delete(id)
        cambio = true
      }
    }
    if (cambio) setQuietos(new Set(soltarDesde.current.keys()))
  }, [])

  const recargar = useCallback(() => {
    const este = ++ultimoPedido.current
    obtenerCola()
      .then((cola) => {
        if (este !== ultimoPedido.current) return
        hayVista.current = true
        setVista(cola)
        setError(null)
        soltar(este)
      })
      .catch((err) => {
        if (este !== ultimoPedido.current) return
        // Si ya hay columnas en pantalla, se quedan y el fallo va al aviso de arriba. Solo la primera carga pasa a la
        // pantalla de error, porque no hay nada que mostrar.
        if (hayVista.current) avisar(textoDelError(err))
        else setError(textoDelError(err))
        soltar(este)
      })
  }, [avisar, soltar])

  // El aviso se va solo a los 5 segundos, o antes si se toca.
  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(null), AVISO_MS)
    return () => clearTimeout(id)
  }, [aviso])

  async function accionar(id: number, llamada: (id: number) => Promise<void>) {
    // El estado llega un render tarde: con dos toques seguidos los dos verían el botón suelto. El Map corta el segundo.
    if (soltarDesde.current.has(id)) return
    soltarDesde.current.set(id, Infinity)
    setQuietos(new Set(soltarDesde.current.keys()))
    try {
      await llamada(id)
      soltarDesde.current.set(id, ultimoPedido.current + 1)
      recargar()
    } catch (err) {
      avisar(textoDelError(err))
      const status = statusDe(err)
      // 409: otro lo movió antes. 404: Caja lo canceló. En los dos casos la cola de la pantalla está vieja.
      if (status === 409 || status === 404) {
        soltarDesde.current.set(id, ultimoPedido.current + 1)
        recargar()
      } else {
        soltarDesde.current.delete(id)
        setQuietos(new Set(soltarDesde.current.keys()))
      }
    }
  }

  // useEnVivo la pide al conectar, al reconectar y con cada evento de cocina/cola (aprobado, prioridad, cancelado).
  // Se pide también al entrar, por si el WebSocket tarda o no conecta.
  useEnVivo(sesion?.local?.id, ['cocina/cola'], recargar)
  useEffect(() => {
    recargar()
  }, [recargar])

  if (!sesion) return null

  // "Cambiar de usuario" y "Cerrar turno" hacen lo mismo: cierran la sesión y RutaProtegida manda sola a la lista
  // de nombres del local, donde entra el que sigue.
  async function salir() {
    setSaliendo(true)
    await cerrar().catch(() => undefined)
  }

  const activos = vista ? vista.enCola.length + vista.enPreparacion.length : 0

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-fondo font-inter text-texto">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-linea bg-tarjeta px-6 py-3.5 leading-[normal]">
        <div className="flex items-center gap-2.5">
          <h1 className="titulo text-[25px]">Cocina</h1>
          <p className="rounded-md bg-linea px-[9px] py-1 text-xs font-medium">KDS</p>
        </div>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={salir}
            disabled={saliendo}
            className={`flex h-11 items-center gap-2 rounded-[14px] px-1 text-sm font-semibold whitespace-nowrap underline disabled:opacity-50 ${foco}`}
          >
            <img src={iconoUsuarios} alt="" />
            Cambiar de usuario
          </button>

          <div className="flex items-center gap-[18px]">
            {vista && !error && (
              <p className="text-[13px] whitespace-nowrap text-secundario">
                {activos} {activos === 1 ? 'pedido activo' : 'pedidos activos'}
              </p>
            )}
            <p className="text-[22px] font-semibold tabular-nums">{hora(ahora)}</p>
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="size-8 shrink-0 rounded-full bg-linea" />
              <div className="text-[13px] whitespace-nowrap">
                <p className="font-medium">{sesion.nombre}</p>
                <p className="text-secundario">Cocina</p>
              </div>
            </div>
            <button
              type="button"
              onClick={salir}
              disabled={saliendo}
              className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold whitespace-nowrap text-primario disabled:opacity-50 ${foco}`}
            >
              <img src={iconoSalir} alt="" />
              Cerrar turno
            </button>
          </div>
        </div>
      </header>

      {/* Siempre en el DOM, para que el lector de pantalla lea el aviso cuando aparece. */}
      <div role="alert" className="shrink-0">
        {aviso && (
          <div className="px-5 pt-4">
            <button
              type="button"
              onClick={() => setAviso(null)}
              className={`flex w-full items-center gap-3 rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3 text-left ${foco}`}
            >
              <img src={iconoAlerta} alt="" width={20} height={20} className="shrink-0" />
              <span className="min-w-0 flex-1 text-[15px] font-semibold">{aviso.texto}</span>
              <img src={iconoCerrar} alt="" width={20} height={20} className="shrink-0" />
              <span className="sr-only">Cerrar el aviso</span>
            </button>
          </div>
        )}
      </div>

      {error ? (
        <div className="py-10 text-center">
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={recargar}
            className={`mt-4 h-11 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario ${foco}`}
          >
            Probá de nuevo
          </button>
        </div>
      ) : !vista ? (
        <p className="py-10 text-center text-secundario">Cargando la cola…</p>
      ) : (
        <main className="flex min-h-0 flex-1 gap-4 px-5 pt-4 pb-4">
          {COLUMNAS.map((c) => (
            <Columna key={c.clave} titulo={c.titulo} vacia={c.vacia} cantidad={vista[c.clave].length}>
              {vista[c.clave].map((p) => {
                const llamada = LLAMADA[c.clave]
                return (
                  <TarjetaCocina
                    key={p.id}
                    pedido={p}
                    columna={c.clave}
                    ahora={ahora}
                    enviando={quietos.has(p.id)}
                    alAccionar={() => llamada && accionar(p.id, llamada)}
                  />
                )
              })}
            </Columna>
          ))}
        </main>
      )}
    </div>
  )
}

// Una columna del KDS: el título con su contador arriba y las tarjetas abajo, que scrollean solas si no entran.
function Columna({
  titulo,
  vacia,
  cantidad,
  children,
}: {
  titulo: string
  vacia: string
  cantidad: number
  children: ReactNode
}) {
  return (
    <section
      aria-label={titulo}
      className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden rounded-2xl bg-linea p-3.5 leading-[normal]"
    >
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-[17px] font-semibold">{titulo}</h2>
        <span className="rounded-full bg-primario px-[7px] py-0.5 text-[11px] font-semibold tracking-[0.66px] text-texto-boton">
          {cantidad}
          <span className="sr-only"> {cantidad === 1 ? 'pedido' : 'pedidos'}</span>
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {cantidad > 0 ? children : <p className="py-6 text-center text-[13px] text-secundario">{vacia}</p>}
      </div>
    </section>
  )
}
