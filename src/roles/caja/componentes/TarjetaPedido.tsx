import type { PedidoPendiente } from '../../../compartido/api/pedidos'

interface Props {
  pedido: PedidoPendiente
  esperaSeg: number
  demorado: boolean // más de 3 minutos sin resolver (RF-16)
  ocupado: boolean
  onAprobar: () => void
  onRechazar: () => void
}

export function formatoEspera(seg: number) {
  return `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`
}

export default function TarjetaPedido({ pedido, esperaSeg, demorado, ocupado, onAprobar, onRechazar }: Props) {
  const hayNoDisponibles = pedido.items.some((i) => !i.disponible)

  return (
    <li
      className={`flex flex-col rounded-2xl border bg-tarjeta p-4 ${demorado ? 'border-red-400 ring-2 ring-red-200' : 'border-linea'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{pedido.mesa}</h2>
        <div className="text-right">
          <p className={`font-mono text-lg ${demorado ? 'font-bold text-red-700' : 'text-secundario'}`}>
            {formatoEspera(esperaSeg)}
          </p>
          {demorado && <p className="text-xs font-semibold text-red-700">Más de 3 minutos esperando</p>}
        </div>
      </div>

      <ul className="mt-3 flex-1 space-y-2">
        {pedido.items.map((i) => (
          <li key={i.platoId} className="flex items-start justify-between gap-2 text-sm">
            <div>
              <span className="font-medium">
                {i.cantidad} × {i.nombre}
              </span>
              {i.nota && <p className="text-xs italic text-secundario">“{i.nota}”</p>}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                i.disponible ? 'bg-suave text-primario' : 'bg-red-100 text-red-700'
              }`}
            >
              {i.disponible ? 'Disponible' : 'No disponible'}
            </span>
          </li>
        ))}
      </ul>

      {hayNoDisponibles && (
        <p className="mt-3 text-xs text-red-700">Este pedido tiene platos no disponibles. Revisalo antes de aprobar.</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onRechazar}
          disabled={ocupado}
          className="rounded-xl border border-linea bg-fondo py-3 font-medium text-texto hover:bg-linea disabled:opacity-50"
        >
          Rechazar
        </button>
        <button
          type="button"
          onClick={onAprobar}
          disabled={ocupado}
          className="rounded-xl bg-primario py-3 font-medium text-white disabled:opacity-50"
        >
          {ocupado ? 'Enviando…' : 'Aprobar'}
        </button>
      </div>
    </li>
  )
}
