import type { MotivoRechazo } from '../../../compartido/api/caja'
import iconoAprobar from '../../../compartido/ui/iconos/check-blanco.svg'
import iconoRechazar from '../../../compartido/ui/iconos/x.svg'
import SelectorDeMotivo from './SelectorDeMotivo'

interface Props {
  motivo: MotivoRechazo | undefined
  alElegirMotivo: (motivo: MotivoRechazo) => void
  enviando: boolean // hay un pedido a medio mandar: los dos botones quedan deshabilitados
  bloqueado: boolean // este pedido ya se resolvió o ya no existe: no se puede volver a tocar
  alAprobar: () => void
  alRechazar: () => void
}

const base =
  'flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] px-[18px] text-[15px] leading-[normal] font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-not-allowed disabled:opacity-38'

// Lo de abajo del detalle de P-08: el motivo si se rechaza y los dos botones. "Rechazar" espera a que haya motivo.
export default function AccionesDePedido({ motivo, alElegirMotivo, enviando, bloqueado, alAprobar, alRechazar }: Props) {
  const quieto = enviando || bloqueado

  return (
    <>
      <SelectorDeMotivo valor={motivo} alCambiar={alElegirMotivo} deshabilitado={enviando} />
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={alRechazar}
          disabled={quieto || !motivo}
          className={`${base} border-[1.5px] border-primario text-primario`}
        >
          <img src={iconoRechazar} alt="" width={20} height={20} />
          Rechazar
        </button>
        <button type="button" onClick={alAprobar} disabled={quieto} className={`${base} bg-primario text-texto-boton`}>
          <img src={iconoAprobar} alt="" width={20} height={20} />
          Aprobar y enviar a cocina
        </button>
      </div>
    </>
  )
}
