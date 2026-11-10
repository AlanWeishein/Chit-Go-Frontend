import type { ReactNode } from 'react'
import iconoCheck from '../../../compartido/ui/iconos/check-14.svg'

export type FiltroDeCola = 'todos' | 'alerta'

interface Props {
  filtro: FiltroDeCola
  conAlerta: number // cuántos pedidos pasaron los 3 minutos
  alCambiar: (filtro: FiltroDeCola) => void
}

// El selector "Todos" / "Con alerta (n)" de P-08. Es un filtro de la lista y no cambia nada del pedido.
export default function SelectorDeCola({ filtro, conAlerta, alCambiar }: Props) {
  return (
    <div role="group" aria-label="Qué pedidos ver" className="flex shrink-0 gap-1 rounded-xl bg-linea p-1">
      <Opcion elegida={filtro === 'todos'} alElegir={() => alCambiar('todos')}>
        Todos
      </Opcion>
      <Opcion elegida={filtro === 'alerta'} alElegir={() => alCambiar('alerta')}>
        Con alerta ({conAlerta})
      </Opcion>
    </div>
  )
}

function Opcion({ elegida, alElegir, children }: { elegida: boolean; alElegir: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={alElegir}
      aria-pressed={elegida}
      className={`flex h-11 items-center justify-center gap-1.5 rounded-[9px] text-[13px] leading-[normal] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
        elegida ? 'border-[1.5px] border-primario bg-tarjeta px-3.5 font-medium' : 'px-3.5'
      }`}
    >
      {elegida && <img src={iconoCheck} alt="" />}
      {children}
    </button>
  )
}
