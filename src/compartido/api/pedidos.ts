// Cola de aprobación de Caja (HU-07, RF-14, RF-15). Las pantallas usan esto, nunca fetch directo.
import { api, ApiError, type ProblemDetail } from './http'
import { USAR_MOCKS, exigirSesionMock } from './auth'
import { suscribir } from '../ws/conexion'

export type MotivoRechazo = 'NO_DISPONIBLE' | 'PEDIDO_INVALIDO' | 'MESA_NO_OCUPADA'

export interface ItemPedido {
  platoId: number
  nombre: string
  cantidad: number
  nota?: string
  disponible: boolean // sin cantidades: un plato está disponible o no (RF-20)
}

export interface PedidoPendiente {
  id: number
  mesa: string
  items: ItemPedido[]
  enviadoEn: string // ISO, hora del servidor
  // TODO(back): confirmar con Eze si aprobar y rechazar reciben `version` en el body. Por ahora se
  // sigue mandando (Spring ignora los campos de más); si el back no la manda, queda undefined.
  version?: number
}

// Lo que la cola entiende, ya traducido del formato del back (ver interpretarEvento).
// SALIO = el pedido dejó de estar pendiente.
export type EventoPedido = { tipo: 'NUEVO'; pedido: PedidoPendiente } | { tipo: 'SALIO'; pedidoId: number }

export interface Manejadores {
  alEvento: (e: EventoPedido) => void
  alConectar: () => void
  alDesconectar: () => void
}

/* ---------------- Traducción de eventos del back ---------------- */

function esPedido(x: unknown): x is PedidoPendiente {
  if (typeof x !== 'object' || x === null) return false
  const p = x as Partial<PedidoPendiente>
  return typeof p.id === 'number' && typeof p.mesa === 'string' && Array.isArray(p.items) && typeof p.enviadoEn === 'string'
}

/**
 * ÚNICO lugar que conoce el formato de los eventos del topic /topic/local/{localId}/caja/pedidos.
 * Si el back cambia el payload, se toca solo esto. Devuelve null para los eventos que la cola no usa.
 * SUPUESTO (a confirmar con Eze): { tipo, pedido? , pedidoId? } con el pedido completo en PEDIDO_ENVIADO.
 */
export function interpretarEvento(dato: unknown): EventoPedido | null {
  if (typeof dato !== 'object' || dato === null) return null
  const e = dato as { tipo?: unknown; pedido?: unknown; pedidoId?: unknown }

  switch (e.tipo) {
    case 'PEDIDO_ENVIADO':
      return esPedido(e.pedido) ? { tipo: 'NUEVO', pedido: e.pedido } : null

    case 'PEDIDO_CANCELADO': {
      // El cliente canceló mientras estaba pendiente.
      // TODO(back): no sabemos qué evento llega cuando OTRA caja aprobó o rechazó el pedido. Por ahora
      // eso lo cubre el 409 + recargar al intentar resolverlo.
      const id = typeof e.pedidoId === 'number' ? e.pedidoId : esPedido(e.pedido) ? e.pedido.id : null
      return id === null ? null : { tipo: 'SALIO', pedidoId: id }
    }

    default:
      // ALERTA_DEMORA y cualquier otro evento: la cola no los usa.
      // TODO(back): la alerta de 3 minutos hoy se calcula en el front (ColaAprobacion). Falta confirmar
      // si viene en el GET o en ALERTA_DEMORA.
      return null
  }
}

function entregar(m: Manejadores, dato: unknown) {
  const evento = interpretarEvento(dato)
  if (evento) m.alEvento(evento)
}

/* ---------------- Mocks (solo en desarrollo) ----------------
   El mock emite los eventos con los nombres y la forma del back (PEDIDO_ENVIADO, PEDIDO_CANCELADO,
   ALERTA_DEMORA) y pasan por interpretarEvento, igual que los reales. */

const hace = (seg: number) => new Date(Date.now() - seg * 1000).toISOString()
let siguienteId = 104
let pedidosMock: PedidoPendiente[] = [
  {
    id: 101,
    mesa: 'Mesa 4',
    enviadoEn: hace(250),
    version: 0,
    items: [
      { platoId: 1, nombre: 'Milanesa napolitana', cantidad: 2, disponible: true },
      { platoId: 2, nombre: 'Flan con dulce de leche', cantidad: 1, nota: 'sin crema', disponible: true },
    ],
  },
  {
    id: 102,
    mesa: 'Mesa 9',
    enviadoEn: hace(70),
    version: 0,
    items: [
      { platoId: 3, nombre: 'Ravioles de verdura', cantidad: 1, disponible: false },
      { platoId: 4, nombre: 'Agua sin gas', cantidad: 2, disponible: true },
    ],
  },
  {
    id: 103,
    mesa: 'Mesa 12',
    enviadoEn: hace(20),
    version: 0,
    items: [{ platoId: 5, nombre: 'Ensalada César', cantidad: 1, nota: 'sin cebolla', disponible: true }],
  },
]
const oyentesMock = new Set<(dato: unknown) => void>()
const alertadosMock = new Set<number>()
let timerMock: ReturnType<typeof setInterval> | null = null
let ciclosMock = 0

const emitirMock = (dato: unknown) => oyentesMock.forEach((f) => f(dato))

// Cada 25 s: llega un pedido; cada 4.º ciclo el cliente cancela el anterior; los que pasan de 3 min reciben alerta.
function cicloMock() {
  ciclosMock++
  const pedido: PedidoPendiente = {
    id: siguienteId++,
    mesa: `Mesa ${1 + Math.floor(Math.random() * 20)}`,
    enviadoEn: new Date().toISOString(),
    version: 0,
    items: [
      { platoId: 6, nombre: 'Hamburguesa completa', cantidad: 1 + Math.floor(Math.random() * 3), disponible: true },
    ],
  }
  const anterior = pedidosMock[pedidosMock.length - 1]
  pedidosMock = [...pedidosMock, pedido]
  emitirMock({ tipo: 'PEDIDO_ENVIADO', pedido })

  if (ciclosMock % 4 === 0 && anterior) {
    pedidosMock = pedidosMock.filter((p) => p.id !== anterior.id)
    emitirMock({ tipo: 'PEDIDO_CANCELADO', pedidoId: anterior.id })
  }
  for (const p of pedidosMock) {
    if (Date.now() - Date.parse(p.enviadoEn) > 180_000 && !alertadosMock.has(p.id)) {
      alertadosMock.add(p.id)
      emitirMock({ tipo: 'ALERTA_DEMORA', pedidoId: p.id })
    }
  }
}

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms))

function resolverMock(id: number) {
  if (!pedidosMock.some((p) => p.id === id)) {
    const cuerpo: ProblemDetail = { title: 'Conflict', status: 409, detail: 'El pedido ya no está pendiente' }
    throw new ApiError(409, cuerpo)
  }
  pedidosMock = pedidosMock.filter((p) => p.id !== id)
}

/* ---------------- Funciones públicas (base /api/v1) ---------------- */

export async function listarPendientes(): Promise<PedidoPendiente[]> {
  if (USAR_MOCKS) {
    await pausa(250)
    exigirSesionMock()
    return pedidosMock.map((p) => ({ ...p, items: p.items.map((i) => ({ ...i })) }))
  }
  return api<PedidoPendiente[]>('/caja/pedidos?estado=PENDIENTE_APROBACION')
}

// Si el pedido ya no está pendiente, el back responde 409.
export async function aprobarPedido(id: number, version?: number): Promise<void> {
  if (USAR_MOCKS) {
    await pausa(300)
    exigirSesionMock()
    return resolverMock(id)
  }
  // TODO(back): confirmar si `version` va en el body (ver PedidoPendiente.version).
  return api<void>(`/caja/pedidos/${id}/aprobar`, { method: 'POST', body: JSON.stringify({ version }) })
}

export async function rechazarPedido(id: number, motivo: MotivoRechazo, version?: number): Promise<void> {
  if (USAR_MOCKS) {
    await pausa(300)
    exigirSesionMock()
    return resolverMock(id)
  }
  // TODO(back): confirmar si `version` va en el body (ver PedidoPendiente.version).
  return api<void>(`/caja/pedidos/${id}/rechazar`, { method: 'POST', body: JSON.stringify({ motivo, version }) })
}

/** Escucha los cambios de la cola. Devuelve la función para dejar de escuchar. */
export function escucharPedidos(localId: number, m: Manejadores): () => void {
  if (USAR_MOCKS) {
    const oyente = (dato: unknown) => entregar(m, dato)
    oyentesMock.add(oyente)
    const t = setTimeout(m.alConectar, 0)
    if (!timerMock) timerMock = setInterval(cicloMock, 25_000)
    return () => {
      clearTimeout(t)
      oyentesMock.delete(oyente)
      if (oyentesMock.size === 0 && timerMock) {
        clearInterval(timerMock)
        timerMock = null
      }
    }
  }
  return suscribir(`/topic/local/${localId}/caja/pedidos`, (dato) => entregar(m, dato), {
    alConectar: m.alConectar,
    alDesconectar: m.alDesconectar,
  })
}
