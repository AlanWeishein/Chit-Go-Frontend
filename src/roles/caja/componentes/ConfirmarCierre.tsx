import { useEffect, useRef } from 'react'
import type { MotivoDeConfirmacion, PedidoSinServir } from '../../../compartido/api/caja'
import iconoVolver from '../../../compartido/ui/iconos/arrow-l-primario.svg'
import iconoRecibo from '../../../compartido/ui/iconos/receipt-blanco.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import { precio } from '../../cliente/formato'

// Los estados que puede tener un pedido sin servir, como los dice el resto de la app (mozo y cliente).
const ESTADOS: Record<string, string> = {
  PENDIENTE_APROBACION: 'En espera',
  APROBADO: 'Aprobado',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
}

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// P-09b y P-09c: la confirmación que pide el back antes de cerrar (409 CONFIRMAR_CIERRE). Es un <dialog> modal,
// como HojaCancelar: el foco queda adentro, arranca en "No, volver" y Escape o tocar afuera es lo mismo que volver.
// El fondo oscuro es la única excepción a la paleta (DESIGN.md). Sin sombra, aunque Figma dibuja una.
export default function ConfirmarCierre({
  mesa,
  total,
  motivos,
  pedidos,
  entroUnoNuevo,
  cerrando,
  alConfirmar,
  alVolver,
}: {
  mesa: string
  total: number
  motivos: MotivoDeConfirmacion[]
  pedidos: PedidoSinServir[]
  entroUnoNuevo: boolean // al confirmar volvió el 409 con otra lista: entró un pedido en el medio
  cerrando: boolean
  alConfirmar: () => void
  alVolver: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const volver = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    const abrio = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialogo && !dialogo.open) dialogo.showModal()
    volver.current?.focus()
    return () => {
      dialogo?.close()
      if (abrio?.isConnected) abrio.focus()
    }
  }, [])

  const sinServir = motivos.includes('PEDIDOS_SIN_SERVIR')
  const nadieLaPidio = motivos.includes('NADIE_PIDIO_LA_CUENTA')

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirmar-cierre-titulo"
      onCancel={(e) => {
        e.preventDefault()
        if (!cerrando) alVolver()
      }}
      // El <dialog> no tiene padding: un clic que le llega directo es un clic en el fondo oscuro.
      onClick={(e) => {
        if (e.target === e.currentTarget && !cerrando) alVolver()
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[560px] rounded-[20px] bg-tarjeta p-0 font-inter text-texto backdrop:bg-[rgba(0,0,0,0.42)]"
    >
      <div className="flex flex-col gap-4 p-8">
        <h2 id="confirmar-cierre-titulo" className="titulo text-[26px] leading-[1.2] text-texto">
          {sinServir
            ? 'Hay pedidos sin servir. ¿Estás seguro de que querés cerrar la cuenta?'
            : 'Esta cuenta no la pidió nadie. ¿La cerramos igual?'}
        </h2>

        {entroUnoNuevo && (
          <AvisoDeFallo>Entró un pedido nuevo mientras confirmabas. Revisalo antes de cerrar.</AvisoDeFallo>
        )}

        {sinServir ? (
          <div className="flex flex-col gap-2 text-[15px] leading-[1.4] text-secundario">
            <ul className="flex flex-col gap-1 text-texto">
              {pedidos.map((p) => (
                <li key={p.id}>
                  #{p.id} · {ESTADOS[p.estado] ?? p.estado} ·{' '}
                  {p.platos.map((item) => `${item.cantidad}× ${item.plato}`).join(', ')}
                </li>
              ))}
            </ul>
            <p>Al cerrar, estos pedidos se cancelan y no entran en el total.</p>
            {nadieLaPidio && <p>Además, nadie pidió la cuenta.</p>}
          </div>
        ) : (
          <p className="text-[15px] leading-[1.4] text-secundario">
            Mesa {mesa} · total {precio(total)}. Al cerrarla se emite el ticket y la mesa queda libre.
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            ref={volver}
            onClick={alVolver}
            disabled={cerrando}
            className={`flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-[.38] ${foco}`}
          >
            <img src={iconoVolver} alt="" width={20} height={20} />
            No, volver
          </button>
          <button
            type="button"
            onClick={alConfirmar}
            disabled={cerrando}
            className={`flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold whitespace-nowrap text-texto-boton disabled:opacity-[.38] ${foco}`}
          >
            <img src={iconoRecibo} alt="" width={20} height={20} />
            {cerrando ? 'Cerrando…' : 'Sí, cerrar y emitir ticket'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
