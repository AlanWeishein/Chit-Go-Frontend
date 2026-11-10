import type { PedidoDeCocina } from '../../../compartido/api/cocina'
import iconoEmpezar from '../../../compartido/ui/iconos/chef-blanco.svg'
import iconoListo from '../../../compartido/ui/iconos/check-blanco.svg'
import iconoReloj from '../../../compartido/ui/iconos/clock-16.svg'
import iconoPrioridad from '../../../compartido/ui/iconos/flag-blanco.svg'
import iconoNota from '../../../compartido/ui/iconos/note-16.svg'
import { hora, transcurrido } from '../tiempo'

export type ColumnaDeCocina = 'enCola' | 'enPreparacion' | 'listos'

interface Props {
  pedido: PedidoDeCocina
  columna: ColumnaDeCocina
  ahora: number
  enviando: boolean // el pedido está a medio mandar o esperando la cola nueva: el botón queda quieto
  alAccionar: () => void // "Empezar" en En cola, "Marcar listo" en En preparación
}

// El botón de abajo de cada columna, como el nodo 2009:6120. "Listo" no tiene.
const ACCION: Partial<Record<ColumnaDeCocina, { texto: string; icono: string }>> = {
  enCola: { texto: 'Empezar', icono: iconoEmpezar },
  enPreparacion: { texto: 'Marcar listo', icono: iconoListo },
}

// Lo que va arriba a la derecha: en "En cola" el tiempo desde que Caja lo aprobó, en "En preparación" desde que se
// empezó (los dos en mm:ss) y en "Listo" la hora en que quedó listo.
function tiempoDe(pedido: PedidoDeCocina, columna: ColumnaDeCocina, ahora: number): string {
  if (columna === 'listos') return pedido.listoEn ? hora(pedido.listoEn) : ''
  if (columna === 'enPreparacion') return transcurrido(pedido.enPreparacionEn ?? pedido.aprobadoEn, ahora)
  return transcurrido(pedido.aprobadoEn, ahora)
}

// Una tarjeta del KDS (P-11).
export default function TarjetaCocina({ pedido, columna, ahora, enviando, alAccionar }: Props) {
  const accion = ACCION[columna]

  return (
    <article className="flex shrink-0 flex-col gap-2.5 rounded-2xl border border-linea bg-tarjeta p-3.5 leading-[normal]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 text-[17px] font-semibold">
          #{pedido.id} · Mesa {pedido.mesa}
        </h3>
        <p className="flex shrink-0 items-center gap-1 text-[15px] font-medium tabular-nums">
          <img src={iconoReloj} alt="" />
          {tiempoDe(pedido, columna, ahora)}
        </p>
      </div>

      {pedido.prioritario && (
        <p className="inline-flex w-max items-center gap-1 rounded-md bg-primario py-1 pr-[9px] pl-[7px] text-xs font-medium text-texto-boton">
          <img src={iconoPrioridad} alt="" />
          Prioridad alta
        </p>
      )}

      <div className="h-px shrink-0 bg-linea" />

      {pedido.items.map((item, i) => (
        // El back no manda un id por renglón y un plato puede venir dos veces con notas distintas.
        <div key={i} className="contents">
          <p className="text-base font-medium break-words">
            {item.cantidad}× {item.plato}
          </p>
          {item.observacion && (
            <p className="flex items-center gap-1.5 rounded-lg bg-fondo px-2.5 py-1.5 text-[13px] break-words">
              <img src={iconoNota} alt="" className="shrink-0" />
              <span className="min-w-0">Nota: {item.observacion}</span>
            </p>
          )}
        </div>
      ))}

      {columna === 'listos' && <p className="text-[13px] text-secundario">Esperando que el mozo lo sirva</p>}

      {accion && (
        <button
          type="button"
          onClick={alAccionar}
          disabled={enviando}
          className="flex h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold text-texto-boton focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-not-allowed disabled:opacity-38"
        >
          {enviando ? (
            'Un momento…'
          ) : (
            <>
              <img src={accion.icono} alt="" width={20} height={20} />
              {accion.texto}
            </>
          )}
        </button>
      )}
    </article>
  )
}
