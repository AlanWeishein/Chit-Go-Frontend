import iconoBuscar from '../../../compartido/ui/iconos/search-28.svg'
import iconoQuitar from '../../../compartido/ui/iconos/x.svg'

// P-01c: ningún plato tiene todas las etiquetas elegidas.
export default function SinPlatos({ onQuitarFiltro }: { onQuitarFiltro: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-2 pt-6 pb-2 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-linea">
        <img src={iconoBuscar} alt="" width={28} height={28} />
      </div>
      <h2 className="titulo text-[22px] leading-[1.2] text-texto">No hay platos con esas etiquetas</h2>
      <p className="text-[15px] leading-[1.4] text-secundario">
        Mostramos solo los platos que cumplen todas las etiquetas que elegiste.
      </p>
      <button
        type="button"
        onClick={onQuitarFiltro}
        className="flex h-12 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario"
      >
        <img src={iconoQuitar} alt="" width={20} height={20} />
        Quitar el filtro
      </button>
    </div>
  )
}
