import { useEffect, useRef } from 'react'
import type { PedidoAfectado } from '../../../compartido/api/platos'

const ESTADOS: Record<PedidoAfectado['estado'], string> = {
  PENDIENTE_APROBACION: '⏱ En espera',
  APROBADO: '✓ Aprobado',
}

// P-10b: al apagar un plato, los pedidos que todavía no empezaron en cocina y lo tienen.
export default function DialogoAfectados({
  nombrePlato,
  afectados,
  enviando,
  error,
  fallo,
  alDejarSeguir,
  alCancelar,
  alVerComoQuedaron,
}: {
  nombrePlato: string
  afectados: PedidoAfectado[]
  enviando: boolean
  error: string | null // texto del back si algo salió mal
  fallo: boolean // 409 o 404: el back no canceló ninguno
  alDejarSeguir: () => void
  alCancelar: () => void
  alVerComoQuedaron: () => void
}) {
  const botonNo = useRef<HTMLButtonElement>(null)
  const n = afectados.length

  useEffect(() => {
    botonNo.current?.focus()
  }, [])

  // Escape es lo mismo que "No, que sigan" (salvo mientras manda).
  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape' && !enviando) alDejarSeguir()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [enviando, alDejarSeguir])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-texto/50 p-6"
      onClick={() => {
        if (!enviando) alDejarSeguir()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-afectados"
        className="w-full max-w-xl rounded-3xl bg-tarjeta p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="titulo-afectados" className="font-[Fraunces] text-2xl font-semibold text-texto">
          {n === 1 ? 'Hay 1 pedido' : `Hay ${n} pedidos`} con {nombrePlato}. ¿Los cancelamos?
        </h2>

        <ul className="mt-4 divide-y divide-linea rounded-2xl border border-linea">
          {afectados.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>
                Mesa {p.mesa} · #{p.id}
              </span>
              <span className="rounded-md bg-suave px-2 py-1 text-xs">{ESTADOS[p.estado]}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm text-secundario">
          Si los cancelás, se cancela cada pedido entero y cada cliente recibe el aviso. Si no, el plato queda no
          disponible y esos pedidos siguen.
        </p>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border-2 border-primario p-3 text-sm text-texto">
            <p>{error}</p>
            {fallo && <p className="mt-1 font-semibold">No se canceló ninguno.</p>}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            ref={botonNo}
            type="button"
            onClick={alDejarSeguir}
            disabled={enviando}
            className="min-h-12 flex-1 rounded-xl border-2 border-primario font-semibold text-primario disabled:opacity-60"
          >
            ← No, que sigan
          </button>
          {fallo ? (
            <button
              type="button"
              onClick={alVerComoQuedaron}
              disabled={enviando}
              className="min-h-12 flex-1 rounded-xl bg-primario font-semibold text-texto-boton disabled:opacity-60"
            >
              {enviando ? 'Un momento…' : 'Ver cómo quedaron'}
            </button>
          ) : (
            <button
              type="button"
              onClick={alCancelar}
              disabled={enviando}
              className="min-h-12 flex-1 rounded-xl bg-primario font-semibold text-texto-boton disabled:opacity-60"
            >
              {enviando ? 'Un momento…' : `✕ Sí, cancelar ${n === 1 ? 'el 1' : `los ${n}`}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
