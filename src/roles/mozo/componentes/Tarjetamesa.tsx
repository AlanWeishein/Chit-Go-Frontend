import { useState } from 'react'
import { servirPedido, type MesaMozo } from '../../../compartido/api/mozo'
import { ApiError } from '../../../compartido/api/http'

export default function TarjetaMesa({ mesa, onCambio }: { mesa: MesaMozo; onCambio: () => void }) {
  const [enviando, setEnviando] = useState<number | null>(null)
  const pedidosListos = mesa.pedidos.filter((p) => p.estado === 'LISTO')

  const handleServir = async (id: number) => {
    if (enviando !== null) return
    setEnviando(id)
    try {
      await servirPedido(id)
      onCambio()
    } catch (error) {
      if (error instanceof ApiError && [403, 404, 409].includes(error.status)) {
        onCambio()
      } else {
        alert('Error al servir el pedido. Reintentá.')
      }
    } finally {
      setEnviando(null)
    }
  }

  return (
    <article className="rounded-2xl border border-secundario bg-tarjeta p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mesa {mesa.numero}</h2>
        <span className="rounded-md bg-linea px-2 py-1 text-xs font-medium">
          {mesa.estado === 'LIBRE' ? 'Libre' : mesa.estado === 'SOLICITADA' ? 'Pidiendo cuenta' : 'Abierta'}
        </span>
      </div>

      {pedidosListos.length > 0 ? (
        <ul className="space-y-3">
          {pedidosListos.map((pedido) => (
            <li key={pedido.id} className="rounded-xl border border-linea p-3">
              <p className="mb-2 text-sm font-semibold">Pedido listo para servir</p>
              <ul className="mb-3 text-sm text-secundario">
                {pedido.items.map((i, k) => (
                  <li key={k}>
                    {i.cantidad}× {i.plato}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleServir(pedido.id)}
                disabled={enviando !== null}
                className="w-full rounded-xl bg-primario py-3 font-medium text-texto-boton disabled:opacity-50"
              >
                {enviando === pedido.id ? 'Sirviendo...' : 'Marcar como servido'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-secundario">Sin pedidos listos.</p>
      )}
    </article>
  )
}
