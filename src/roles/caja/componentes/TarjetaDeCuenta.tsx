import type { CuentaPorCobrar } from '../../../compartido/api/caja'
import { precio } from '../../cliente/formato'

interface Props {
  cuenta: CuentaPorCobrar
  seleccionada: boolean
  alElegir: () => void
}

// Una tarjeta de la lista de P-09: la mesa y lo que va de la cuenta. Sin los "1 min" ni los "2 pedidos" del Mockup:
// el back no manda cuántos pedidos tiene la cuenta, y el tiempo ya está en el detalle.
export default function TarjetaDeCuenta({ cuenta, seleccionada, alElegir }: Props) {
  return (
    <button
      type="button"
      onClick={alElegir}
      aria-current={seleccionada ? 'true' : undefined}
      // El borde de la seleccionada es más grueso y lo compensa con el padding: todas miden lo mismo y la lista
      // no salta al elegir (igual que la cola de aprobación).
      className={`flex w-full flex-col gap-1 rounded-[14px] text-left leading-[normal] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
        seleccionada ? 'border-[2.5px] border-primario p-[10.5px]' : 'border border-secundario p-3'
      }`}
    >
      <span className="font-semibold">Mesa {cuenta.mesa}</span>
      <span className="text-[13px] text-secundario">{precio(cuenta.total)}</span>
    </button>
  )
}
