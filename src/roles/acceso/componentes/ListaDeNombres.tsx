import type { Usuario } from '../../../compartido/api/auth'
import iconoChevron from '../../../compartido/ui/iconos/chevron-r.svg'
import { foco } from './MarcoAcceso'

// Las iniciales del círculo de la lista: la primera letra de las dos primeras palabras ("Juan Pérez" da "JP"),
// o las dos primeras letras si el nombre es una sola palabra ("Juan" da "JU").
function iniciales(nombre: string) {
  const palabras = nombre.trim().split(/\s+/)
  return (palabras.length > 1 ? palabras[0][0] + palabras[1][0] : nombre.trim().slice(0, 2)).toUpperCase()
}

// La lista de nombres de P-04b y P-22b, sin rol. `grande` es la de Caja: filas de 64 px, como P-22b.
export default function ListaDeNombres({
  usuarios,
  grande = false,
  onElegir,
}: {
  usuarios: Usuario[]
  grande?: boolean
  onElegir: (u: Usuario) => void
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {usuarios.map((u) => (
        <li key={u.id}>
          <button
            type="button"
            onClick={() => onElegir(u)}
            className={`flex w-full items-center rounded-[14px] border border-secundario bg-fondo py-[11px] text-left hover:bg-tarjeta ${foco} ${
              grande ? 'min-h-16 gap-3.5 pl-3.5 pr-4' : 'min-h-[60px] gap-3 pl-[13px] pr-[15px]'
            }`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-full bg-linea font-semibold ${
                grande ? 'h-10 w-10 text-sm' : 'h-9 w-9 text-[13px]'
              }`}
            >
              {iniciales(u.nombre)}
            </span>
            <span className={`min-w-0 flex-1 break-words font-semibold ${grande ? 'text-base' : 'text-[15px]'}`}>
              {u.nombre}
            </span>
            <img src={iconoChevron} alt="" width={20} height={20} className="shrink-0" />
          </button>
        </li>
      ))}
    </ul>
  )
}
