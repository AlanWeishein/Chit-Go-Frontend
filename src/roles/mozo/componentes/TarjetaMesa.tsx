import { useState } from 'react'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import { marcarServido, type PedidoDeMesa } from '../../../compartido/api/mozo'
import { precio } from '../../cliente/formato'

const ESTADOS: Record<string, string> = {
  PENDIENTE_APROBACION: 'En espera',
  APROBADO: 'Aprobado',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  SERVIDO: 'Servido',
  RECHAZADO: 'Rechazado',
  CANCELADO: 'Cancelado',
}

// Un pedido de la cuenta, con su botón de servir.
export default function TarjetaMesa({
  pedido,
  puedeActuar,
  recargar,
}: {
  pedido: PedidoDeMesa
  puedeActuar: boolean // false: la mesa es de otro mozo
  recargar: () => void
}) {
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const listo = pedido.estado === 'LISTO'
  const enCocina =
    pedido.estado === 'PENDIENTE_APROBACION' ||
    pedido.estado === 'APROBADO' ||
    pedido.estado === 'EN_PREPARACION'

  async function servir() {
    setEnviando(true)
    setMensaje(null)
    try {
      await marcarServido(pedido.id)
      recargar()
    } catch (err) {
      setMensaje(textoDelError(err))
      const status = statusDe(err)
      if (status === 403 || status === 404 || status === 409) recargar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <article className="border-b border-linea py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Pedido #{pedido.id}</h3>
        <span className="rounded-md bg-suave px-2 py-0.5 text-xs font-semibold text-texto">
          {ESTADOS[pedido.estado] ?? pedido.estado}
        </span>
      </div>

      <ul className="mt-2 space-y-1">
        {pedido.items.map((item, i) => (
          <li key={`${item.platoId}-${i}`} className="text-sm">
            <div className="flex justify-between gap-3">
              <span>
                {item.cantidad}× {item.plato}
              </span>
              <span>{precio(item.cantidad * item.precioUnitario)}</span>
            </div>
            {item.observacion && <p className="text-xs text-secundario">{item.observacion}</p>}
          </li>
        ))}
      </ul>

      {pedido.estado === 'RECHAZADO' && pedido.motivoRechazo && (
        <p className="mt-2 text-xs text-secundario">Motivo: {pedido.motivoRechazo}</p>
      )}

      {puedeActuar && listo && (
        <button
          type="button"
          onClick={servir}
          disabled={enviando}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-primario font-semibold text-texto-boton disabled:opacity-60"
        >
          {enviando ? 'Un momento…' : 'Marcar como servido'}
        </button>
      )}

      {puedeActuar && enCocina && (
        <>
          <button
            type="button"
            disabled
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-dashed border-linea font-semibold text-secundario"
          >
            Marcar como servido
          </button>
          <p className="mt-2 text-xs text-secundario">Se habilita cuando Cocina lo marca listo.</p>
        </>
      )}

      {mensaje && (
        <p role="alert" className="mt-3 rounded-xl border border-primario bg-tarjeta p-3 text-sm">
          {mensaje}
        </p>
      )}
    </article>
  )
}
