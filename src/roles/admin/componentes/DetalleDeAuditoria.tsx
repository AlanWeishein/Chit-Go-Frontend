import { useEffect, useRef } from 'react'
import type { RegistroDeAuditoria } from '../../../compartido/api/auditoria'

export function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Los valores pueden ser texto, JSON o un objeto: se muestran tal cual, sin interpretarlos.
export function valorComoTexto(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  return typeof valor === 'string' ? valor : JSON.stringify(valor, null, 2)
}

// Detalle de solo lectura con el <dialog> nativo: showModal() deja inerte lo de afuera, Escape y el clic en el
// fondo cierran, y el foco vuelve a la fila que lo abrió.
export default function DetalleDeAuditoria({
  registro,
  alCerrar,
}: {
  registro: RegistroDeAuditoria
  alCerrar: () => void
}) {
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const cerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialogo = dialogoRef.current
    const abrio = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialogo && !dialogo.open) dialogo.showModal()
    cerrarRef.current?.focus()
    return () => {
      dialogo?.close()
      if (abrio?.isConnected) abrio.focus()
    }
  }, [])

  const bloque = 'mt-1 max-h-56 overflow-auto rounded-xl border border-linea bg-fondo p-3 font-mono text-xs break-words whitespace-pre-wrap'

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-detalle-auditoria"
      onCancel={(e) => {
        e.preventDefault()
        alCerrar()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) alCerrar()
      }}
      className="m-auto w-full max-w-2xl rounded-3xl bg-tarjeta p-0 text-texto shadow-xl backdrop:bg-[rgba(0,0,0,0.42)]"
    >
      <div className="p-8">
        <h2 id="titulo-detalle-auditoria" className="font-[Fraunces] text-2xl font-semibold">
          Detalle del movimiento
        </h2>

        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-secundario">Fecha</dt>
            <dd className="tabular-nums">{fechaHora(registro.fecha)}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-secundario">Usuario</dt>
            <dd>{registro.usuario}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-secundario">Entidad</dt>
            <dd>{registro.entidad}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-secundario">Acción</dt>
            <dd>{registro.accion}</dd>
          </div>
        </dl>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-secundario">VALOR ANTERIOR</h3>
            <pre className={bloque}>{valorComoTexto(registro.valorAnterior)}</pre>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-secundario">VALOR NUEVO</h3>
            <pre className={bloque}>{valorComoTexto(registro.valorNuevo)}</pre>
          </div>
        </div>

        <button
          ref={cerrarRef}
          type="button"
          onClick={alCerrar}
          className="mt-6 min-h-12 w-full rounded-xl border-2 border-primario font-semibold text-primario"
        >
          Cerrar
        </button>
      </div>
    </dialog>
  )
}
