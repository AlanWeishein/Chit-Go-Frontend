import type { EstadoPedido, MotivoRechazo, PedidoDeLaCuenta } from '../../../compartido/api/cliente'
import iconoNo from '../../../compartido/ui/iconos/ban.svg'
import iconoCocina from '../../../compartido/ui/iconos/chef-56.svg'
import iconoChef from '../../../compartido/ui/iconos/chef.svg'
import iconoCheck from '../../../compartido/ui/iconos/check-14.svg'
import iconoReloj from '../../../compartido/ui/iconos/clock.svg'
import iconoX from '../../../compartido/ui/iconos/x.svg'
import { precio } from '../formato'

// Cada estado se dice con texto e ícono, nunca solo con color. Los cinco pasos son el camino feliz del pedido;
// rechazado y cancelado no tienen paso.
const ESTADOS: Record<EstadoPedido, { texto: string; icono: string; paso: number | null; detalle: string }> = {
  PENDIENTE_APROBACION: {
    texto: 'En espera',
    icono: iconoReloj,
    paso: 1,
    detalle: 'Está en la fila de Caja; enseguida pasa a cocina.',
  },
  APROBADO: { texto: 'Aprobado', icono: iconoCheck, paso: 2, detalle: 'Caja lo aprobó y lo mandó a la cocina.' },
  EN_PREPARACION: { texto: 'En preparación', icono: iconoChef, paso: 3, detalle: 'Lo están cocinando.' },
  LISTO: { texto: 'Listo', icono: iconoCheck, paso: 4, detalle: 'Está listo: el mozo te lo trae.' },
  SERVIDO: { texto: 'Servido', icono: iconoCheck, paso: 5, detalle: 'Ya está en la mesa.' },
  RECHAZADO: { texto: 'Rechazado', icono: iconoNo, paso: null, detalle: 'Caja no lo aprobó. No se cobra.' },
  CANCELADO: { texto: 'Cancelado', icono: iconoNo, paso: null, detalle: 'Se canceló. No se cobra.' },
}

const PASOS = 5

const MOTIVOS: Record<MotivoRechazo, string> = {
  NO_DISPONIBLE: 'Un plato no está disponible.',
  PEDIDO_INVALIDO: 'El pedido tenía un error.',
  MESA_NO_OCUPADA: 'Caja no ve a nadie en la mesa.',
}

const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })

export function EtiquetaEstado({ texto, icono }: { texto: string; icono: string }) {
  return (
    <p className="flex shrink-0 items-center gap-1 rounded-[6px] bg-linea py-1 pr-[9px] pl-[7px] text-xs font-medium text-texto">
      <img src={icono} alt="" width={14} height={14} />
      {texto}
    </p>
  )
}

// Un pedido de P-03. numero es su orden en la cuenta (Pedido #1, #2…), no el id de la base.
export default function TarjetaPedido({
  pedido,
  numero,
  onCancelar,
}: {
  pedido: PedidoDeLaCuenta
  numero: number
  onCancelar?: () => void
}) {
  const estado = ESTADOS[pedido.estado]
  const cancelable = pedido.estado === 'PENDIENTE_APROBACION' && onCancelar !== undefined

  return (
    <article aria-labelledby={`pedido-${pedido.id}`} className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        {/* Como en el Mockup, la ilustración de la cocina va solo mientras lo cocinan. */}
        {pedido.estado === 'EN_PREPARACION' && <img src={iconoCocina} alt="" width={56} height={56} className="shrink-0" />}
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 id={`pedido-${pedido.id}`} className="text-base font-semibold text-texto">
            Pedido #{numero}
          </h2>
          <p className="text-[13px] text-secundario">Enviado {hora(pedido.enviadoEn)}</p>
        </div>
        <EtiquetaEstado texto={estado.texto} icono={estado.icono} />
      </div>

      <div className="flex flex-col gap-1.5">
        {estado.paso !== null && (
          <div aria-hidden className="flex gap-1">
            {Array.from({ length: PASOS }, (_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-[3px] ${i < estado.paso! ? 'bg-primario' : 'bg-linea'}`} />
            ))}
          </div>
        )}
        <p className="text-[13px] text-secundario">
          {estado.paso !== null && `Paso ${estado.paso} de ${PASOS} · `}
          {estado.detalle}
          {pedido.estado === 'RECHAZADO' && pedido.motivoRechazo !== null && ` Motivo: ${MOTIVOS[pedido.motivoRechazo]}`}
        </p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {pedido.items.map((item, i) => (
          <li key={i} className="flex flex-col text-[13px] text-texto">
            <span className="flex items-start justify-between gap-3">
              <span>
                {item.cantidad}× {item.plato}
              </span>
              <span className="shrink-0 font-medium">{precio(item.precioUnitario * item.cantidad)}</span>
            </span>
            {item.observacion !== null && <span className="text-secundario">Nota: {item.observacion}</span>}
          </li>
        ))}
      </ul>

      {cancelable && (
        <>
          <button
            type="button"
            onClick={onCancelar}
            aria-label={`Cancelar el pedido #${numero}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario"
          >
            <img src={iconoX} alt="" width={20} height={20} />
            Cancelar
          </button>
          <p className="text-[13px] text-secundario">Podés cancelarlo mientras esté en espera.</p>
        </>
      )}
    </article>
  )
}
