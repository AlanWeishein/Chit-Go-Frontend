interface Props {
  valor: string
  onCambio: (nuevo: string) => void
  max?: number
  deshabilitado?: boolean
}

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const base =
  'rounded-xl border border-linea bg-fondo py-4 text-2xl font-semibold text-texto transition-colors hover:bg-suave active:bg-suave disabled:opacity-50'

export default function TecladoPin({ valor, onCambio, max = 10, deshabilitado = false }: Props) {
  const agregar = (n: string) => valor.length < max && onCambio(valor + n)

  return (
    <div className="grid grid-cols-3 gap-3">
      {TECLAS.map((n) => (
        <button key={n} type="button" disabled={deshabilitado} onClick={() => agregar(n)} className={base}>
          {n}
        </button>
      ))}
      <button type="button" disabled={deshabilitado} onClick={() => onCambio('')} className={`${base} text-lg text-secundario`}>
        Limpiar
      </button>
      <button type="button" disabled={deshabilitado} onClick={() => agregar('0')} className={base}>
        0
      </button>
      <button type="button" disabled={deshabilitado} aria-label="Borrar el último dígito" onClick={() => onCambio(valor.slice(0, -1))} className={base}>
        ⌫
      </button>
    </div>
  )
}
