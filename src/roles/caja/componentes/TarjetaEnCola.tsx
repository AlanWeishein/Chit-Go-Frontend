import type { PedidoPorAprobar } from '../../../compartido/api/caja'
import { minutosDe } from '../espera'
import ChipDeDemora from './ChipDeDemora'

interface Props {
  pedido: PedidoPorAprobar
  segundosDeEspera: number
  seleccionada: boolean
  alElegir: () => void
}

// Una tarjeta de la cola de P-08. Sin precio: el back no lo manda. Si el pedido pasó los 3 minutos (`demorado`, lo
// decide el back), el chip "+3 min" va en lugar de los minutos y la tarjeta queda 4 px más alta, como en el Mockup.
export default function TarjetaEnCola({ pedido, segundosDeEspera, seleccionada, alElegir }: Props) {
  const items = pedido.items.length
  const minutos = minutosDe(segundosDeEspera)

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
      <span className="flex w-full items-center justify-between gap-2">
        <span className="font-semibold">
          Mesa {pedido.mesa} · #{pedido.id}
        </span>
        {pedido.demorado ? (
          <ChipDeDemora texto="+3 min" />
        ) : (
          <span className="shrink-0 text-[13px] text-secundario">{minutos < 1 ? '< 1 min' : `${minutos} min`}</span>
        )}
      </span>
      <span className="text-[13px] text-secundario">
        {items} {items === 1 ? 'ítem' : 'ítems'}
      </span>
    </button>
  )
}
