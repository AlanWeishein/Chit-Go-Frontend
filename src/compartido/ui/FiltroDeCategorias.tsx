import { useId } from 'react'
import iconoDesplegar from './iconos/chevron-d.svg'
import iconoElegido from './iconos/check-16.svg'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// Hasta 7 categorías van los chips del Mockup; con más, ocupan dos filas y van en un select (ST-35). Era 8, pero
// en P-14 a 1280 px la octava ya bajaba a otra fila.
const MAX_CHIPS = 7

type Categoria = { id: number; nombre: string }

// El filtro por categoría de la carta del Admin (P-14) y de la disponibilidad rápida (P-10 y P-10c). Devuelve los
// chips sueltos (sin contenedor), así quedan en la fila de quien lo usa. `elegida` tiene que ser una de `categorias`
// o null: si la que estaba elegida ya no está, la pantalla pasa null y se ve "Todas".
export default function FiltroDeCategorias({
  categorias,
  elegida,
  alElegir,
}: {
  categorias: Categoria[]
  elegida: number | null
  alElegir: (id: number | null) => void
}) {
  const id = useId()

  if (categorias.length > MAX_CHIPS) {
    // El select nativo trae el teclado y, en la tablet, el selector del sistema. El borde y el foco van en el
    // label para que "Categoría:" quede adentro del campo, con el estilo del buscador.
    return (
      <label
        htmlFor={id}
        className="relative flex h-12 max-w-full cursor-pointer items-center rounded-xl border-[1.25px] border-secundario bg-tarjeta pl-[14px] text-[15px] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primario"
      >
        <span id={`${id}-rotulo`} className="shrink-0 text-secundario">
          Categoría:
        </span>
        {/* El nombre sale solo del rótulo: si no, el label le suma el texto de todas las opciones. */}
        <select
          id={id}
          aria-labelledby={`${id}-rotulo`}
          value={elegida ?? ''}
          onChange={(e) => alElegir(e.target.value === '' ? null : Number(e.target.value))}
          className="h-full max-w-[280px] min-w-0 cursor-pointer appearance-none truncate bg-transparent pr-10 pl-1.5 text-texto outline-none"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <img
          src={iconoDesplegar}
          alt=""
          width={18}
          height={18}
          className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2"
        />
      </label>
    )
  }

  return (
    <>
      {[{ id: null, nombre: 'Todos' }, ...categorias].map((c) => {
        const activa = elegida === c.id
        return (
          <button
            key={c.id ?? 'todos'}
            type="button"
            onClick={() => alElegir(c.id)}
            aria-pressed={activa}
            className={`flex h-11 items-center rounded-full text-[13px] ${foco} ${
              activa ? 'gap-1.5 bg-suave pr-3.5 pl-2.5 font-medium' : 'border border-secundario px-3.5'
            }`}
          >
            {activa && <img src={iconoElegido} alt="" width={16} height={16} />}
            {c.nombre}
          </button>
        )
      })}
    </>
  )
}
