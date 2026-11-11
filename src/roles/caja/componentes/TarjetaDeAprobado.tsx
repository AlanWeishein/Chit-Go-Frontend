import type { PedidoDeCocina } from '../../../compartido/api/cocina'
import EtiquetaDePedido from './EtiquetaDePedido'

interface Props {
  pedido: PedidoDeCocina
  enPreparacion: boolean // está en el grupo "En preparación": Cocina ya lo empezó
  ahora: number // Date.now() de la pantalla, que avanza sola: así todas las tarjetas cambian juntas
  seleccionada: boolean
  alElegir: () => void
}

// El back no manda los segundos que pasaron, solo la hora de aprobación: se mide con el reloj de la tablet, como
// hace la pantalla de cocina. Si la tablet está corrida, "hace X min" sale corrido en lo mismo.
function haceCuanto(iso: string, ahora: number): string {
  const minutos = Math.max(0, Math.floor((ahora - Date.parse(iso)) / 60000))
  return minutos < 1 ? 'hace < 1 min' : `hace ${minutos} min`
}

// Una tarjeta de la lista de P-36. Sin precio: el DTO de cocina no lo trae.
// Sin empezar y sin prioridad: los minutos a la derecha. Con prioridad: el chip a la derecha y los minutos abajo.
export default function TarjetaDeAprobado({ pedido, enPreparacion, ahora, seleccionada, alElegir }: Props) {
  const items = pedido.items.length
  const cantidad = `${items} ${items === 1 ? 'ítem' : 'ítems'}`
  const hace = haceCuanto(pedido.aprobadoEn, ahora)
  const chip = enPreparacion ? 'enPreparacion' : pedido.prioritario ? 'prioridad' : null

  return (
    <button
      type="button"
      onClick={alElegir}
      aria-current={seleccionada ? 'true' : undefined}
      // El borde de la seleccionada es más grueso y lo compensa con el padding: todas miden lo mismo y la lista
      // no salta al elegir.
      className={`flex w-full flex-col gap-1 rounded-[14px] text-left leading-[normal] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
        seleccionada ? 'border-[2.5px] border-primario p-[10.5px]' : 'border border-secundario p-3'
      }`}
    >
      <span className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <span className="font-semibold">
          Mesa {pedido.mesa} · #{pedido.id}
        </span>
        {chip ? (
          <EtiquetaDePedido variante={chip} />
        ) : (
          <span className="shrink-0 text-[13px] text-secundario">{hace}</span>
        )}
      </span>
      <span className="text-[13px] text-secundario">
        {cantidad}
        {enPreparacion ? ' · la cocina ya lo empezó' : pedido.prioritario ? ` · aprobado ${hace}` : ''}
      </span>
    </button>
  )
}
