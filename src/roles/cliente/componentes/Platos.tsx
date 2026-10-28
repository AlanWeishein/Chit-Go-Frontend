import type { ReactNode } from 'react'
import type { Plato } from '../../../compartido/tipos/menu'
import iconoPlato36 from '../../../compartido/ui/iconos/plate-36.svg'
import iconoPlato24 from '../../../compartido/ui/iconos/plate-24.svg'
import iconoMas from '../../../compartido/ui/iconos/plus.svg'
import iconoEstrella from '../../../compartido/ui/iconos/star.svg'
import iconoEtiqueta from '../../../compartido/ui/iconos/tag.svg'
import { precio } from '../formato'

// Las filas y el destacado de P-01. Sin onAgregar (modo lectura), no hay "Agregar".
type PropsPlato = { plato: Plato; onAgregar?: (plato: Plato) => void }

export function PlatoDestacado({ plato, onAgregar }: PropsPlato) {
  return (
    <article className="flex flex-col gap-2">
      <FotoPlato plato={plato} grande />
      <Etiqueta icono={iconoEstrella} fondo="bg-suave">
        Menú del día
      </Etiqueta>
      <h2 className="titulo text-xl text-texto">{plato.nombre}</h2>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-secundario">
          {[plato.descripcion, precio(plato.precio)].filter(Boolean).join(' · ')}
        </p>
        {onAgregar && <BotonAgregar plato={plato} onAgregar={onAgregar} />}
      </div>
    </article>
  )
}

export function FilaPlato({ plato, onAgregar }: PropsPlato) {
  return (
    <li className="flex items-center gap-3 py-5 first:pt-0">
      <FotoPlato plato={plato} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="text-base font-semibold text-texto">{plato.nombre}</h3>
        {plato.descripcion && <p className="text-[13px] text-secundario">{plato.descripcion}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-semibold text-texto">{precio(plato.precio)}</p>
          {plato.etiquetas.map((e) => (
            <Etiqueta key={e} icono={iconoEtiqueta} fondo="bg-linea">
              {e}
            </Etiqueta>
          ))}
        </div>
      </div>
      {onAgregar && <BotonAgregar plato={plato} onAgregar={onAgregar} />}
    </li>
  )
}

// Si la carta no trae foto, el lugar de la foto en `linea` con el ícono de plato (DESIGN.md).
function FotoPlato({ plato, grande = false }: { plato: Plato; grande?: boolean }) {
  const medida = grande ? 'h-[104px] w-full' : 'size-16 shrink-0'
  if (plato.imagenUrl) {
    return <img src={plato.imagenUrl} alt="" className={`${medida} rounded-[14px] object-cover`} />
  }
  return (
    <div className={`${medida} flex items-center justify-center rounded-[14px] bg-linea`}>
      {grande ? (
        <img src={iconoPlato36} alt="" width={36} height={36} />
      ) : (
        <img src={iconoPlato24} alt="" width={24} height={24} />
      )}
    </div>
  )
}

function Etiqueta({ icono, fondo, children }: { icono: string; fondo: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-md py-1 pr-[9px] pl-[7px] text-xs font-medium whitespace-nowrap text-texto ${fondo}`}
    >
      <img src={icono} alt="" width={14} height={14} />
      {children}
    </span>
  )
}

function BotonAgregar({ plato, onAgregar }: { plato: Plato; onAgregar: (plato: Plato) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAgregar(plato)}
      className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-3 text-[15px] font-semibold text-primario"
    >
      <img src={iconoMas} alt="" width={20} height={20} />
      Agregar<span className="sr-only"> {plato.nombre}</span>
    </button>
  )
}
