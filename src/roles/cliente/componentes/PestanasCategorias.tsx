import type { CategoriaMenu } from '../../../compartido/tipos/menu'

export const ID_PANEL_CATEGORIA = 'platos-de-la-categoria'

export default function PestanasCategorias({
  categorias,
  elegida,
  onElegir,
}: {
  categorias: CategoriaMenu[]
  elegida: number
  onElegir: (id: number) => void
}) {
  return (
    <div role="tablist" aria-label="Categorías" className="-mx-6 flex gap-[22px] overflow-x-auto px-6">
      {categorias.map((c) => {
        const activa = c.id === elegida
        return (
          <button
            key={c.id}
            id={`pestana-${c.id}`}
            type="button"
            role="tab"
            aria-selected={activa}
            aria-controls={ID_PANEL_CATEGORIA}
            onClick={() => onElegir(c.id)}
            className={`flex h-11 shrink-0 flex-col items-center justify-end gap-1.5 text-[15px] whitespace-nowrap ${
              activa ? 'font-semibold text-texto' : 'text-secundario'
            }`}
          >
            {c.nombre}
            <span aria-hidden="true" className={`h-[3px] w-full rounded-[2px] ${activa ? 'bg-texto' : ''}`} />
          </button>
        )
      })}
    </div>
  )
}
