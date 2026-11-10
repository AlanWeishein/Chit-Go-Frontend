// La pantalla de cocina, el KDS (P-11, HU-11): la barra de arriba y las tres columnas, En cola, En preparación y
// Listo. Pensada para una tablet apaisada o un monitor, para leerse de lejos. La barra de Avisos del Mockup no va.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { obtenerCola, type VistaDeCocina } from '../../../compartido/api/cocina'
import { textoDelError } from '../../../compartido/api/errores'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import iconoSalir from '../../../compartido/ui/iconos/logout.svg'
import iconoUsuarios from '../../../compartido/ui/iconos/users.svg'
import { useEnVivo } from '../../../compartido/ws/useEnVivo'
import TarjetaCocina, { type ColumnaDeCocina } from '../componentes/TarjetaCocina'
import { hora, useAhora } from '../tiempo'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

const COLUMNAS: { clave: ColumnaDeCocina; titulo: string; vacia: string }[] = [
  { clave: 'enCola', titulo: 'En cola', vacia: 'No hay pedidos en cola.' },
  { clave: 'enPreparacion', titulo: 'En preparación', vacia: 'Nada en preparación.' },
  { clave: 'listos', titulo: 'Listo', vacia: 'Todavía no hay pedidos listos.' },
]

export default function ColaCocina() {
  const { sesion, cerrar } = useSesion()
  const [vista, setVista] = useState<VistaDeCocina | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saliendo, setSaliendo] = useState(false)
  const ahora = useAhora()
  // Si salen dos pedidos de la cola seguidos, vale solo la respuesta del último: una vieja que llega tarde no pisa.
  const ultimoPedido = useRef(0)

  const recargar = useCallback(() => {
    const este = ++ultimoPedido.current
    obtenerCola()
      .then((cola) => {
        if (este !== ultimoPedido.current) return
        setVista(cola)
        setError(null)
      })
      .catch((err) => {
        if (este === ultimoPedido.current) setError(textoDelError(err))
      })
  }, [])

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
              {vista[c.clave].map((p) => (
                <TarjetaCocina key={p.id} pedido={p} columna={c.clave} ahora={ahora} />
              ))}
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
