import type { EstadoCocina, PedidoCocina } from '../../../compartido/api/cocina'
import { formatoTiempo, segundosDesde } from '../../../compartido/ui/formatoTiempo'

interface Props {
  pedido: PedidoCocina
  ahora: number
  ocupado: boolean
  textoAccion?: string // sin acción (por ejemplo en "Listo"): el pedido lo sirve el mozo
  onAccion?: () => void
}

// Desde cuándo se cuenta el tiempo según la columna en la que está el pedido.
const TIEMPO: Record<EstadoCocina, { etiqueta: string; desde: (p: PedidoCocina) => string }> = {
  APROBADO: { etiqueta: 'Esperando', desde: (p) => p.enviadoEn },
  EN_PREPARACION: { etiqueta: 'Preparando', desde: (p) => p.enPreparacionEn ?? p.enviadoEn },
  LISTO: { etiqueta: 'Listo hace', desde: (p) => p.listoEn ?? p.enviadoEn },
}

export default function TarjetaCocina({ pedido, ahora, ocupado, textoAccion, onAccion }: Props) {
  const t = TIEMPO[pedido.estado]

  return (
    <li
      className={`flex flex-col rounded-2xl border bg-tarjeta p-4 ${
        pedido.prioridadManual ? 'border-primario ring-2 ring-primario/40' : 'border-linea'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xl font-semibold">{pedido.mesa}</h3>
          {pedido.prioridadManual && (
            <span className="mt-1 inline-block rounded-full bg-primario px-2 py-0.5 text-xs font-semibold text-white">
              Prioridad
            </span>
          )}
        </div>
        <p className="text-right text-sm text-secundario">
          {t.etiqueta}
          <span className="block font-mono text-lg text-texto">{formatoTiempo(segundosDesde(t.desde(pedido), ahora))}</span>
        </p>
      </div>

      <ul className="mt-3 flex-1 space-y-2">
        {pedido.items.map((i) => (
          <li key={i.platoId} className="text-base">
            <span className="font-medium">
              {i.cantidad} × {i.nombre}
            </span>
            {i.nota && <p className="text-sm italic text-secundario">“{i.nota}”</p>}
          </li>
        ))}
      </ul>

      {onAccion && textoAccion && (
        <button
          type="button"
          onClick={onAccion}
          disabled={ocupado}
          className="mt-4 w-full rounded-xl bg-primario py-4 text-lg font-semibold text-white disabled:opacity-50"
        >
          {ocupado ? 'Enviando…' : textoAccion}
        </button>
      )}
    </li>
  )
}
