// Cola de aprobación de Caja (HU-07, RF-14, RF-15). Las pantallas usan esto, nunca fetch directo.
import { api, ApiError } from './http'
import { USAR_MOCKS } from './auth'
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
  version: number // control de concurrencia: si cambió, la API responde 409
}

// SALIO = ya no está pendiente (lo resolvió otro operador o lo canceló el cliente)
export type EventoPedido = { tipo: 'NUEVO'; pedido: PedidoPendiente } | { tipo: 'SALIO'; pedidoId: number }

export interface Manejadores {
  alEvento: (e: EventoPedido) => void
  alConectar: () => void
  alDesconectar: () => void
}

/* ---------------- Mocks (solo en desarrollo) ---------------- */

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
const oyentesMock = new Set<(e: EventoPedido) => void>()
let timerMock: ReturnType<typeof setInterval> | null = null

function generarPedidoMock() {
  const mesa = `Mesa ${1 + Math.floor(Math.random() * 20)}`
  const pedido: PedidoPendiente = {
    id: siguienteId++,
    mesa,
    enviadoEn: new Date().toISOString(),
    version: 0,
    items: [
      { platoId: 6, nombre: 'Hamburguesa completa', cantidad: 1 + Math.floor(Math.random() * 3), disponible: true },
    ],
  }
  pedidosMock = [...pedidosMock, pedido]
  oyentesMock.forEach((f) => f({ tipo: 'NUEVO', pedido }))
}

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms))

function resolverMock(id: number) {
  const existe = pedidosMock.some((p) => p.id === id)
  if (!existe) throw new ApiError(409)
  pedidosMock = pedidosMock.filter((p) => p.id !== id)
  oyentesMock.forEach((f) => f({ tipo: 'SALIO', pedidoId: id }))
}

/* ---------------- Funciones públicas ---------------- */

// TODO: confirmar rutas y topics con `chit-go-endpoints-api` (German/Eze). Lo de abajo es un supuesto.
export async function listarPendientes(): Promise<PedidoPendiente[]> {
  if (USAR_MOCKS) {
    await pausa(250)
    return pedidosMock.map((p) => ({ ...p, items: p.items.map((i) => ({ ...i })) }))
  }
  return api<PedidoPendiente[]>('/caja/pedidos/pendientes')
}

export async function aprobarPedido(id: number, version: number): Promise<void> {
  if (USAR_MOCKS) {
    await pausa(300)
    return resolverMock(id)
  }
  return api<void>(`/caja/pedidos/${id}/aprobar`, { method: 'POST', body: JSON.stringify({ version }) })
}

export async function rechazarPedido(id: number, motivo: MotivoRechazo, version: number): Promise<void> {
  if (USAR_MOCKS) {
    await pausa(300)
    return resolverMock(id)
  }
  return api<void>(`/caja/pedidos/${id}/rechazar`, { method: 'POST', body: JSON.stringify({ motivo, version }) })
}

/** Escucha los cambios de la cola. Devuelve la función para dejar de escuchar. */
export function escucharPedidos(localId: number, m: Manejadores): () => void {
  if (USAR_MOCKS) {
    oyentesMock.add(m.alEvento)
    const t = setTimeout(m.alConectar, 0)
    if (!timerMock) timerMock = setInterval(generarPedidoMock, 25_000) // llega un pedido nuevo cada 25 s
    return () => {
      clearTimeout(t)
      oyentesMock.delete(m.alEvento)
      if (oyentesMock.size === 0 && timerMock) {
        clearInterval(timerMock)
        timerMock = null
      }
    }
  }
  return suscribir(`/topic/locales/${localId}/caja/pedidos`, (dato) => m.alEvento(dato as EventoPedido), {
    alConectar: m.alConectar,
    alDesconectar: m.alDesconectar,
  })
}
