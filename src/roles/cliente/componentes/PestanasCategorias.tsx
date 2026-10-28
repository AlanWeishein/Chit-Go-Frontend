import type { KeyboardEvent } from 'react'
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
  // Flechas, Inicio y Fin pasan de pestaña. Solo la elegida entra con Tab (tabIndex), como pide el patrón de pestañas.
  function alTeclear(e: KeyboardEvent, i: number) {
    const n = categorias.length
    const destino =
      e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null
    if (destino === null) return
    e.preventDefault()
    onElegir(categorias[destino].id)
    document.getElementById(`pestana-${categorias[destino].id}`)?.focus()
  }

  // El py-1 deja lugar al contorno de foco, que el overflow-x-auto recortaba; el -my-1 lo compensa.
  return (
    <div role="tablist" aria-label="Categorías" className="-mx-6 -my-1 flex gap-[22px] overflow-x-auto px-6 py-1">
      {categorias.map((c, i) => {
        const activa = c.id === elegida
        return (
          <button
            key={c.id}
            id={`pestana-${c.id}`}
            type="button"
            role="tab"
            aria-selected={activa}
            aria-controls={ID_PANEL_CATEGORIA}
            tabIndex={activa ? 0 : -1}
            onClick={() => onElegir(c.id)}
            onKeyDown={(e) => alTeclear(e, i)}
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
