import { useEffect, useState } from 'react'
import type { MotivoRechazo, PedidoPendiente } from '../../../compartido/api/pedidos'

const MOTIVOS: { valor: MotivoRechazo; texto: string }[] = [
  { valor: 'NO_DISPONIBLE', texto: 'No disponible' },
  { valor: 'PEDIDO_INVALIDO', texto: 'Pedido inválido' },
  { valor: 'MESA_NO_OCUPADA', texto: 'Mesa no ocupada' },
]

interface Props {
  pedido: PedidoPendiente
  enviando: boolean
  onConfirmar: (motivo: MotivoRechazo) => void
  onCancelar: () => void
}

export default function DialogoRechazo({ pedido, enviando, onConfirmar, onCancelar }: Props) {
  const [motivo, setMotivo] = useState<MotivoRechazo | null>(
    pedido.items.some((i) => !i.disponible) ? 'NO_DISPONIBLE' : null,
  )

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && !enviando && onCancelar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [enviando, onCancelar])

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-tarjeta p-6 text-texto">
        <h2 className="text-lg font-semibold">Rechazar pedido de {pedido.mesa}</h2>
        <p className="mt-1 text-sm text-secundario">Elegí el motivo. Se le avisará al cliente.</p>

        <fieldset className="mt-4 space-y-2">
          {MOTIVOS.map((m) => (
            <label key={m.valor} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 ${motivo === m.valor ? 'border-primario bg-suave' : 'border-linea bg-fondo'}`}>
              <input type="radio" name="motivo" checked={motivo === m.valor} onChange={() => setMotivo(m.valor)} className="h-4 w-4 accent-primario" />
              {m.texto}
            </label>
          ))}
        </fieldset>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancelar} disabled={enviando} className="rounded-xl border border-linea bg-fondo py-3 font-medium disabled:opacity-50">Volver</button>
          <button type="button" disabled={!motivo || enviando} onClick={() => motivo && onConfirmar(motivo)} className="rounded-xl bg-primario py-3 font-medium text-white disabled:opacity-50">
            {enviando ? 'Enviando…' : 'Rechazar pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
