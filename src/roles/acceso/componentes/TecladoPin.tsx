import iconoBorrar from '../../../compartido/ui/iconos/backspace.svg'

interface Props {
  valor: string
  onCambio: (nuevo: string) => void
  max?: number
  deshabilitado?: boolean
}

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const base =
  'flex h-[60px] items-center justify-center rounded-2xl bg-linea text-2xl font-semibold text-texto transition-colors hover:bg-suave active:bg-suave disabled:opacity-50'

// El teclado de P-04: teclas de 88 × 60 con relleno `linea` y sin borde. Abajo a la izquierda va el hueco, y
// "Borrar" saca el último dígito.
export default function TecladoPin({ valor, onCambio, max = 10, deshabilitado = false }: Props) {
  const agregar = (n: string) => valor.length < max && onCambio(valor + n)

  return (
    <div className="grid w-full max-w-[288px] grid-cols-3 gap-x-3 gap-y-2.5">
      {TECLAS.map((n) => (
        <button key={n} type="button" disabled={deshabilitado} onClick={() => agregar(n)} className={base}>
          {n}
        </button>
      ))}
      <span aria-hidden="true" />
      <button type="button" disabled={deshabilitado} onClick={() => agregar('0')} className={base}>
        0
      </button>
      <button
        type="button"
        disabled={deshabilitado}
        aria-label="Borrar el último dígito"
        onClick={() => onCambio(valor.slice(0, -1))}
        className={`${base} flex-col gap-0.5 text-xs font-medium`}
      >
        <img src={iconoBorrar} alt="" width={20} height={20} />
        Borrar
      </button>
    </div>
  )
}
