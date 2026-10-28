import type { ReactNode } from 'react'
import iconoCheck from '../../../compartido/ui/iconos/check-16.svg'

// Se pueden elegir varias, y el back devuelve los platos que tienen todas. "Todo" vacía la lista.
export default function FiltrosEtiquetas({
  etiquetas,
  elegidas,
  onCambiar,
}: {
  etiquetas: string[]
  elegidas: string[]
  onCambiar: (elegidas: string[]) => void
}) {
  function alternar(etiqueta: string) {
    onCambiar(elegidas.includes(etiqueta) ? elegidas.filter((e) => e !== etiqueta) : [...elegidas, etiqueta])
  }

  return (
    <div role="group" aria-label="Filtrar por etiquetas" className="-mx-6 flex gap-2 overflow-x-auto px-6">
      <Chip elegido={elegidas.length === 0} onClick={() => onCambiar([])}>
        Todo
      </Chip>
      {etiquetas.map((e) => (
        <Chip key={e} elegido={elegidas.includes(e)} onClick={() => alternar(e)}>
          {e}
        </Chip>
      ))}
    </div>
  )
}

function Chip({ elegido, onClick, children }: { elegido: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={elegido}
      onClick={onClick}
      className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full text-[13px] whitespace-nowrap text-texto ${
        elegido ? 'bg-suave pr-3.5 pl-2.5 font-medium' : 'border border-secundario px-3.5'
      }`}
    >
      {elegido && <img src={iconoCheck} alt="" width={16} height={16} />}
      {children}
    </button>
  )
}
