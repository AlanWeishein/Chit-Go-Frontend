import type { ItemDeCocina } from '../../../compartido/api/cocina'

const rotulo = 'text-[11px] leading-[normal] font-semibold tracking-[0.66px] text-secundario uppercase'

// La tabla de ítems de P-36: la de P-08 sin la columna Disponibilidad, porque el DTO de cocina no la trae.
// La Nota toma el ancho que dejó libre (120 + 124 px), así el Ítem queda igual de ancho que en el Mockup.
export default function TablaDeItemsAprobados({ items }: { items: ItemDeCocina[] }) {
  return (
    <table className="w-full table-fixed border-collapse text-left text-[13px] leading-[normal]">
      <thead>
        <tr className={`h-[34px] ${rotulo}`}>
          <th className="px-2.5 font-semibold">Ítem</th>
          <th className="w-14 px-2.5 font-semibold">Cant.</th>
          <th className="w-[244px] px-2.5 font-semibold">Nota</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          // El back no manda un id por renglón y un plato puede venir dos veces con notas distintas.
          <tr key={`${item.plato}-${i}`} className="h-[49px] border-t border-linea">
            <td className="px-2.5 py-2">{item.plato}</td>
            <td className="px-2.5 py-2">{item.cantidad}</td>
            <td className="px-2.5 py-2 break-words">{item.observacion || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
