import iconoAnterior from './iconos/arrow-l-primario.svg'
import iconoSiguiente from './iconos/chevron-r-primario.svg'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const botonContorno = `flex h-11 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-[.38] ${foco}`

// La paginación de P-14 (CartaAdmin): "Mostrando X de Y" a la izquierda, Anterior y Siguiente a la derecha. El corte
// lo hace cada pantalla: `pagina` ya tiene que venir acomodada a `totalPaginas`. En un lugar angosto (las etiquetas
// de P-14c, 300 px) los botones bajan a un segundo renglón.
export default function Paginacion({
  pagina,
  totalPaginas,
  mostrando,
  total,
  alCambiar,
}: {
  pagina: number
  totalPaginas: number
  mostrando: number
  total: number
  alCambiar: (pagina: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p className="text-[13px] text-secundario">
        Mostrando {mostrando} de {total}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => alCambiar(pagina - 1)} disabled={pagina === 0} className={botonContorno}>
          <img src={iconoAnterior} alt="" width={20} height={20} />
          Anterior
        </button>
        <button
          type="button"
          onClick={() => alCambiar(pagina + 1)}
          disabled={pagina >= totalPaginas - 1}
          className={botonContorno}
        >
          <img src={iconoSiguiente} alt="" width={20} height={20} />
          Siguiente
        </button>
      </div>
    </div>
  )
}
