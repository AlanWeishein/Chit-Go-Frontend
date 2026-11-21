import { useEffect, useRef } from 'react'
import { textoDeAccion, textoDeEntidad, type RegistroDeAuditoria } from '../../../compartido/api/auditoria'
import { precio } from '../../cliente/formato'

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

// "23/09 21:19", como la tabla de P-18.
export function fechaHoraCorta(iso: string): string {
  const d = new Date(iso)
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)} ${dos(d.getHours())}:${dos(d.getMinutes())}`
}

// Los valores pueden ser texto, JSON o un objeto: en el detalle se muestran tal cual, sin interpretarlos.
export function valorComoTexto(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  return typeof valor === 'string' ? valor : JSON.stringify(valor, null, 2)
}

const ESTADOS: Record<string, string> = {
  PENDIENTE_APROBACION: 'En espera',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  CANCELADO: 'Cancelado',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  SERVIDO: 'Servido',
  ABIERTA: 'Abierta',
  SOLICITADA: 'Cuenta pedida',
  CERRADA: 'Cerrada',
}

function siNo(valor: unknown, si: string, no: string): string {
  return valor === true ? si : valor === false ? no : String(valor)
}

// Una clave de los valores que guardan los servicios del back, en palabras. Lo que no se conoce va "clave: valor".
// null sale de la lista: no dice nada en la tabla, y el detalle muestra todo.
function parte(clave: string, valor: unknown): string | null {
  if (valor === null || valor === undefined) return null
  switch (clave) {
    case 'id':
    case 'imagenUrl':
      return null
    case 'estado':
      return typeof valor === 'string' ? (ESTADOS[valor] ?? valor) : String(valor)
    case 'prioridadManual':
      return siNo(valor, 'Alta', 'Normal')
    case 'disponible':
      return siNo(valor, 'Disponible', 'No disponible')
    case 'destacado':
      return siNo(valor, 'Destacado', 'No destacado')
    case 'activo':
      return siNo(valor, 'Activo', 'Dado de baja')
    case 'activa':
      return siNo(valor, 'Activa', 'Dada de baja')
    case 'inhabilitada':
      return siNo(valor, 'Inhabilitada', 'Habilitada')
    case 'bloqueado':
      return siNo(valor, 'Bloqueado', 'Sin bloqueo')
    case 'atendido':
      return siNo(valor, 'Atendido', 'Sin atender')
    case 'precio':
    case 'total':
      return typeof valor === 'number' ? precio(valor) : String(valor)
    case 'nombre':
    case 'tipo':
      return String(valor)
    case 'numero':
      return `Mesa ${String(valor)}`
    case 'motivo':
    case 'motivoInhabilitacion':
      return `Motivo: ${String(valor)}`
    case 'ticketId':
      return `Ticket #${String(valor)}`
    case 'pedidosCancelados':
      return Array.isArray(valor) && valor.length > 0 ? `Canceló ${valor.map((id) => `#${String(id)}`).join(', ')}` : null
    default:
      return `${clave}: ${typeof valor === 'object' ? JSON.stringify(valor) : String(valor)}`
  }
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function legible(valor: unknown, claves: string[]): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (!esObjeto(valor)) return typeof valor === 'string' ? valor : JSON.stringify(valor)
  const partes = claves.map((c) => parte(c, valor[c])).filter((p): p is string => p !== null)
  return partes.length > 0 ? partes.join(' · ') : '—'
}

// Antes y Después de la tabla. Si los dos son objetos, solo las claves que cambiaron (una mesa guarda la fila
// entera, y lo que importa es "Habilitada → Inhabilitada"). En un alta o una baja, todo lo que hay.
export function cambioLegible(registro: RegistroDeAuditoria): { antes: string; despues: string } {
  const { valorAnterior: antes, valorNuevo: despues } = registro
  let claves: string[] | null = null
  if (esObjeto(antes) && esObjeto(despues)) {
    const todas = [...new Set([...Object.keys(antes), ...Object.keys(despues)])]
    const cambiaron = todas.filter((c) => JSON.stringify(antes[c]) !== JSON.stringify(despues[c]))
    claves = cambiaron.length > 0 ? cambiaron : todas
  }
  return {
    antes: legible(antes, claves ?? (esObjeto(antes) ? Object.keys(antes) : [])),
    despues: legible(despues, claves ?? (esObjeto(despues) ? Object.keys(despues) : [])),
  }
}

// "Pedido #24", "Mesa 5" o "Flan casero": el nombre o el número si los valores los traen, y si no, el id.
export function nombreDeEntidad(registro: RegistroDeAuditoria): string {
  const valores = [registro.valorNuevo, registro.valorAnterior].filter(esObjeto)
  const nombre = valores.map((v) => v.nombre).find((n) => typeof n === 'string' && n !== '')
  if (typeof nombre === 'string') return nombre
  const numero = valores.map((v) => v.numero).find((n) => n !== undefined && n !== null)
  if (registro.entidad === 'MESA' && numero !== undefined) return `Mesa ${String(numero)}`
  const entidad = textoDeEntidad(registro.entidad)
  return registro.entidadId === null ? entidad : `${entidad} #${registro.entidadId}`
}

// Detalle de solo lectura con el <dialog> nativo: showModal() deja inerte lo de afuera, Escape y el clic en el
// fondo cierran, y el foco vuelve a la fila que lo abrió. Muestra los valores completos, como los guardó el back.
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
            <dd className="tabular-nums">{fechaHora(registro.creadoEn)}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-secundario">Usuario</dt>
            <dd>{registro.usuario}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-secundario">Acción</dt>
            <dd>{textoDeAccion(registro.accion)}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-secundario">Entidad</dt>
            <dd>{nombreDeEntidad(registro)}</dd>
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
