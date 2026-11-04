import { IconoTilde } from './Iconos'

interface Opcion<T extends string> {
  valor: T
  texto: string
}

// El selector de dos opciones de P-05 y P-07.
export default function Selector<T extends string>({
  opciones,
  elegida,
  alElegir,
}: {
  opciones: Opcion<T>[]
  elegida: T
  alElegir: (valor: T) => void
}) {
  return (
    <div role="tablist" className="flex gap-1 rounded-2xl bg-suave p-1">
      {opciones.map((o) => {
        const activa = o.valor === elegida
        return (
          <button
            key={o.valor}
            type="button"
            role="tab"
            aria-selected={activa}
            onClick={() => alElegir(o.valor)}
            className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm ${
              activa
                ? 'border border-primario bg-tarjeta font-semibold text-texto'
                : 'text-secundario'
            }`}
          >
            {activa && <IconoTilde />}
            {o.texto}
          </button>
        )
      })}
    </div>
  )
}
