import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../../compartido/api/http'
import { aprobarPedido, rechazarPedido, type MotivoRechazo, type PedidoPendiente } from '../../../compartido/api/pedidos'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import DialogoRechazo from '../componentes/DialogoRechazo'
import TarjetaPedido from '../componentes/TarjetaPedido'
import { useAhora, usePedidosPendientes } from '../componentes/usePedidosPendientes'

const UMBRAL_ALERTA_SEG = 180 

export default function ColaAprobacion() {
  const { sesion } = useSesion()
  if (!sesion) return null 
  return <Cola localId={sesion.usuario.localId} operador={sesion.usuario.nombre} />
}

function Cola({ localId, operador }: { localId: number; operador: string }) {
  const navigate = useNavigate()
  const { cerrar } = useSesion()
  const { pedidos, cargando, error, conectado, quitar, recargar } = usePedidosPendientes(localId)
  const ahora = useAhora()

  const [procesando, setProcesando] = useState<number | null>(null)
  const [rechazando, setRechazando] = useState<PedidoPendiente | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const esperaDe = (p: PedidoPendiente) => Math.max(0, Math.floor((ahora - Date.parse(p.enviadoEn)) / 1000))
  const demorados = pedidos.filter((p) => esperaDe(p) > UMBRAL_ALERTA_SEG).length

  async function resolver(pedidoId: number, accion: () => Promise<void>) {
    setProcesando(pedidoId)
    setAviso(null)
    try {
      await accion()
      quitar(pedidoId)
      setRechazando(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Acá transformamos el "Error 409" en un texto claro y directo
        setAviso('Error: Ese pedido ya fue resuelto por otro compañero o el cliente lo canceló. Actualizamos la cola.')
        setRechazando(null)
        void recargar()
      } else {
        setAviso('Error: No se pudo completar la acción. Intentá de nuevo.')
      }
    } finally {
      setProcesando(null)
    }
  }

  const aprobar = (p: PedidoPendiente) => resolver(p.id, () => aprobarPedido(p.id, p.version))
  const rechazar = (p: PedidoPendiente, motivo: MotivoRechazo) => resolver(p.id, () => rechazarPedido(p.id, motivo, p.version))

  async function salir() {
    await cerrar()
    navigate('/', { replace: true })
  }

  return (
    <main className="min-h-screen bg-fondo p-4 text-texto md:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primario">Cola de aprobación</h1>
          <p className="text-sm text-secundario">{pedidos.length} {pedidos.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className={conectado ? 'text-primario' : 'font-semibold text-red-700'} role="status">
            {conectado ? '🟢 En vivo' : '🔴 Sin conexión: reconectando…'}
          </span>
          <span className="text-secundario">{operador}</span>
          <button type="button" onClick={salir} className="rounded-lg border border-linea bg-tarjeta px-3 py-2">Salir</button>
        </div>
      </header>

      {demorados > 0 && (
        <div role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 font-medium text-red-800">
          ⚠️ {demorados} pedido(s) superan los 3 minutos de demora.
        </div>
      )}
      {aviso && (
        <div role="status" className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {aviso}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => void recargar()} className="font-medium underline">Reintentar</button>
        </div>
      )}

      {cargando ? (
        <p className="text-secundario">Cargando pedidos…</p>
      ) : pedidos.length === 0 && !error ? (
        <p className="rounded-2xl border border-linea bg-tarjeta p-8 text-center text-secundario">No hay pedidos pendientes de aprobación.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pedidos.map((p) => (
            <TarjetaPedido key={p.id} pedido={p} esperaSeg={esperaDe(p)} demorado={esperaDe(p) > UMBRAL_ALERTA_SEG} ocupado={procesando === p.id} onAprobar={() => void aprobar(p)} onRechazar={() => setRechazando(p)} />
          ))}
        </ul>
      )}

      {rechazando && <DialogoRechazo pedido={rechazando} enviando={procesando === rechazando.id} onConfirmar={(motivo) => void rechazar(rechazando, motivo)} onCancelar={() => setRechazando(null)} />}
    </main>
  )
}
