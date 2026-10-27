// P-08: cola de aprobación de Caja. Ruta: /caja/pedidos (HU-07, RF-14, RF-15, RF-16)
import { useCallback, useState } from 'react'
import { ApiError, esSesionVencida } from '../../../compartido/api/http'
import { aprobarPedido, rechazarPedido, type MotivoRechazo, type PedidoPendiente } from '../../../compartido/api/pedidos'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import DialogoRechazo from '../componentes/DialogoRechazo'
import TarjetaPedido from '../componentes/TarjetaPedido'
import { useAhora, usePedidosPendientes } from '../componentes/usePedidosPendientes'

// TODO(back): la alerta de 3 minutos (RF-16) hoy se calcula acá con enviadoEn. Falta confirmar con Eze
// si viene en el GET o en el evento ALERTA_DEMORA.
const UMBRAL_ALERTA_SEG = 180

export default function ColaAprobacion() {
  const { sesion } = useSesion()
  // Caja siempre tiene local. Sin local (o sin sesión) no hay cola que mostrar.
  if (!sesion?.local) return null
  return <Cola localId={sesion.local.id} operador={sesion.nombre} />
}

function Cola({ localId, operador }: { localId: number; operador: string }) {
  const { cerrar } = useSesion()
  const { pedidos, cargando, error, conectado, quitar, recargar } = usePedidosPendientes(localId)
  const ahora = useAhora()

  const [procesando, setProcesando] = useState<number | null>(null)
  const [rechazando, setRechazando] = useState<PedidoPendiente | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const esperaDe = (p: PedidoPendiente) => Math.max(0, Math.floor((ahora - Date.parse(p.enviadoEn)) / 1000))
  const demorados = pedidos.filter((p) => esperaDe(p) > UMBRAL_ALERTA_SEG).length

  // Estable entre renders: el diálogo registra el Escape una sola vez (el reloj re-renderiza esta pantalla cada segundo).
  const cancelarRechazo = useCallback(() => setRechazando(null), [])

  async function resolver(pedidoId: number, accion: () => Promise<void>) {
    setProcesando(pedidoId)
    setAviso(null)
    try {
      await accion()
      quitar(pedidoId)
      setRechazando(null)
    } catch (err) {
      // Sesión vencida: la app ya manda al login (ver http.ts), no hay nada que avisar acá.
      if (esSesionVencida(err)) return
      if (err instanceof ApiError && err.status === 409) {
        // El pedido ya no está pendiente: lo resolvió otra caja o el cliente lo canceló.
        // TODO(back): qué evento llega cuando OTRA caja resolvió el pedido. Por ahora el 409 + recargar lo cubre.
        setAviso('Ese pedido ya cambió: lo resolvió otro operador o el cliente lo canceló. Actualizamos la cola.')
        setRechazando(null)
        void recargar()
      } else {
        setAviso('No se pudo completar la acción. Probá de nuevo.')
      }
    } finally {
      setProcesando(null)
    }
  }

  const aprobar = (p: PedidoPendiente) => resolver(p.id, () => aprobarPedido(p.id, p.version))
  const rechazar = (p: PedidoPendiente, motivo: MotivoRechazo) =>
    resolver(p.id, () => rechazarPedido(p.id, motivo, p.version))

  return (
    <main className="min-h-screen bg-fondo p-4 text-texto md:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primario">Cola de aprobación</h1>
          <p className="text-sm text-secundario">
            {pedidos.length} {pedidos.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className={conectado ? 'text-primario' : 'font-semibold text-red-700'} role="status">
            {conectado ? 'En vivo' : 'Sin conexión: reconectando…'}
          </span>
          <span className="text-secundario">{operador}</span>
          {/* Al cerrar la sesión, RutaProtegida manda al login */}
          <button type="button" onClick={() => void cerrar()} className="rounded-lg border border-linea bg-tarjeta px-3 py-2">
            Salir
          </button>
        </div>
      </header>

      {demorados > 0 && (
        <div role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 font-medium text-red-800">
          {demorados === 1
            ? '1 pedido lleva más de 3 minutos sin resolver.'
            : `${demorados} pedidos llevan más de 3 minutos sin resolver.`}
        </div>
      )}
      {aviso && (
        <div role="status" className="mb-4 rounded-xl border border-linea bg-tarjeta px-4 py-3 text-sm">
          {aviso}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => void recargar()} className="font-medium underline">
            Reintentar
          </button>
        </div>
      )}

      {cargando ? (
        <p className="text-secundario">Cargando pedidos…</p>
      ) : pedidos.length === 0 && !error ? (
        <p className="rounded-2xl border border-linea bg-tarjeta p-8 text-center text-secundario">
          No hay pedidos pendientes de aprobación.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pedidos.map((p) => (
            <TarjetaPedido
              key={p.id}
              pedido={p}
              esperaSeg={esperaDe(p)}
              demorado={esperaDe(p) > UMBRAL_ALERTA_SEG}
              ocupado={procesando === p.id}
              onAprobar={() => void aprobar(p)}
              onRechazar={() => setRechazando(p)}
            />
          ))}
        </ul>
      )}

      {rechazando && (
        <DialogoRechazo
          pedido={rechazando}
          enviando={procesando === rechazando.id}
          onConfirmar={(motivo) => void rechazar(rechazando, motivo)}
          onCancelar={cancelarRechazo}
        />
      )}
    </main>
  )
}
