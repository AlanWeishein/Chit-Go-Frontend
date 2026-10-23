// Cola de Cocina / KDS (HU-11, RF-22, RF-23). Las pantallas usan esto, nunca fetch directo.
//
// CONTRATO SUPUESTO: German está haciendo el back de la cola de cocina en las mismas fechas que este front,
// así que todavía no hay contrato escrito. Todo lo que dice "supuesto" sigue el mismo patrón que la cola de
// Caja y vive SOLO en este archivo: cuando German publique los endpoints se ajusta acá y nada más.
import { api, ApiError, type ProblemDetail } from './http'
import { USAR_MOCKS, exigirSesionMock } from './auth'
import { suscribir } from '../ws/conexion'
import type { Escuchador } from '../ws/useListaEnVivo'

// El estado es del pedido entero, no de cada plato (D-01).
export type EstadoCocina = 'APROBADO' | 'EN_PREPARACION' | 'LISTO'
const ESTADOS: EstadoCocina[] = ['APROBADO', 'EN_PREPARACION', 'LISTO']

export interface ItemCocina {
  platoId: number
  nombre: string // lo arma el back con un JOIN al módulo menú
  cantidad: number
  nota?: string
}

export interface PedidoCocina {
  id: number
  mesa: string
  estado: EstadoCocina
  prioridadManual: boolean // la pone Caja en P-36 (HU-08)
  items: ItemCocina[]
  enviadoEn: string // ISO: es el orden de llegada de la cola (índice pedido(local_id, estado, prioridad_manual, enviado_en))
  enPreparacionEn?: string
  listoEn?: string
  // TODO(back): confirmar con German si empezar y marcar listo reciben `version` en el body. Por ahora se
  // manda (Spring ignora campos de más); si el back no la manda, queda undefined.
  version?: number
}

// Lo que la pantalla entiende, ya traducido del formato del back (ver interpretarEventoCocina).
// ACTUALIZADO = el pedido entró a la cola o cambió (estado, prioridad). SALIO = dejó de estar en la cola.
export type EventoCocina = { tipo: 'ACTUALIZADO'; pedido: PedidoCocina } | { tipo: 'SALIO'; pedidoId: number }

/* ---------------- Orden de la cola ---------------- */

// RF-22: primero los de prioridad manual, después por orden de llegada.
export function ordenarCola(lista: PedidoCocina[]): PedidoCocina[] {
  // TODO(back): confirmar si el GET ya viene ordenado. Por ahora el front ordena siempre (también los eventos).
  return [...lista].sort((a, b) => {
    if (a.prioridadManual !== b.prioridadManual) return a.prioridadManual ? -1 : 1
    return Date.parse(a.enviadoEn) - Date.parse(b.enviadoEn)
  })
}

// Idempotente. Si llega un evento viejo (version menor que la que ya tenemos) no pisa el estado nuevo.
export function aplicarEventoCocina(lista: PedidoCocina[], e: EventoCocina): PedidoCocina[] {
  if (e.tipo === 'SALIO') return lista.filter((p) => p.id !== e.pedidoId)
  const actual = lista.find((p) => p.id === e.pedido.id)
  if (!actual) return [...lista, e.pedido]
  if (actual.version !== undefined && e.pedido.version !== undefined && e.pedido.version < actual.version) return lista
  return lista.map((p) => (p.id === e.pedido.id ? e.pedido : p))
}

/* ---------------- Traducción de eventos del back ---------------- */

function esPedidoCocina(x: unknown): x is PedidoCocina {
  if (typeof x !== 'object' || x === null) return false
  const p = x as Partial<PedidoCocina>
  return (
    typeof p.id === 'number' &&
    typeof p.mesa === 'string' &&
    typeof p.enviadoEn === 'string' &&
    Array.isArray(p.items) &&
    typeof p.prioridadManual === 'boolean' &&
    ESTADOS.includes(p.estado as EstadoCocina)
  )
}

// TODO(back): los nombres de los eventos de la cola de cocina son un SUPUESTO por analogía con los de Caja
// (PEDIDO_ENVIADO, PEDIDO_CANCELADO, ALERTA_DEMORA). Confirmar con German cómo se llaman de verdad.
const EVENTOS_QUE_ACTUALIZAN = ['PEDIDO_APROBADO', 'PEDIDO_EN_PREPARACION', 'PEDIDO_LISTO', 'PRIORIDAD_CAMBIADA']
const EVENTOS_QUE_SACAN = ['PEDIDO_CANCELADO', 'PEDIDO_SERVIDO']

/**
 * ÚNICO lugar que conoce el formato de los eventos del topic /topic/local/{localId}/cocina/pedidos.
 * Si el back cambia el payload o los nombres, se toca solo esto. Devuelve null para lo que la cola no usa.
 * SUPUESTO: { tipo, pedido?, pedidoId? } con el pedido completo (con su estado) cuando algo entra o cambia.
 */
export function interpretarEventoCocina(dato: unknown): EventoCocina | null {
  if (typeof dato !== 'object' || dato === null) return null
  const e = dato as { tipo?: unknown; pedido?: unknown; pedidoId?: unknown }
  if (typeof e.tipo !== 'string') return null

  if (EVENTOS_QUE_ACTUALIZAN.includes(e.tipo)) {
    return esPedidoCocina(e.pedido) ? { tipo: 'ACTUALIZADO', pedido: e.pedido } : null
  }
  if (EVENTOS_QUE_SACAN.includes(e.tipo)) {
    const idDelPedido = (e.pedido as { id?: unknown } | null | undefined)?.id
    const id = typeof e.pedidoId === 'number' ? e.pedidoId : typeof idDelPedido === 'number' ? idDelPedido : null
    return id === null ? null : { tipo: 'SALIO', pedidoId: id }
  }
  return null
}

function entregar(m: Escuchador<EventoCocina>, dato: unknown) {
  const evento = interpretarEventoCocina(dato)
  if (evento) m.alEvento(evento)
}

/* ---------------- Mocks (solo en desarrollo) ----------------
   El mock emite los eventos con la forma supuesta del back y pasan por interpretarEventoCocina, igual que
   los reales. Entrá como Marcos (Cocina), PIN 1357. */

const hace = (seg: number) => new Date(Date.now() - seg * 1000).toISOString()
let siguienteId = 205
let colaMock: PedidoCocina[] = [
  {
    id: 201, mesa: 'Mesa 4', estado: 'APROBADO', prioridadManual: true, enviadoEn: hace(300), version: 1,
    items: [
      { platoId: 1, nombre: 'Milanesa napolitana', cantidad: 2 },
      { platoId: 2, nombre: 'Flan con dulce de leche', cantidad: 1, nota: 'sin crema' },
    ],
  },
  {
    id: 202, mesa: 'Mesa 9', estado: 'APROBADO', prioridadManual: false, enviadoEn: hace(120), version: 1,
    items: [
      { platoId: 3, nombre: 'Ravioles de verdura', cantidad: 1 },
      { platoId: 4, nombre: 'Agua sin gas', cantidad: 2 },
    ],
  },
  {
    id: 203, mesa: 'Mesa 2', estado: 'EN_PREPARACION', prioridadManual: false, enviadoEn: hace(600), enPreparacionEn: hace(240), version: 2,
    items: [{ platoId: 5, nombre: 'Ensalada César', cantidad: 1, nota: 'sin cebolla' }],
  },
  {
    id: 204, mesa: 'Mesa 7', estado: 'LISTO', prioridadManual: false, enviadoEn: hace(900), enPreparacionEn: hace(500), listoEn: hace(60), version: 3,
    items: [{ platoId: 6, nombre: 'Hamburguesa completa', cantidad: 2 }],
  },
]
const oyentesMock = new Set<(dato: unknown) => void>()
let timerMock: ReturnType<typeof setInterval> | null = null
let ciclosMock = 0
const emitirMock = (dato: unknown) => oyentesMock.forEach((f) => f(dato))
const reemplazarMock = (p: PedidoCocina) => (colaMock = colaMock.map((x) => (x.id === p.id ? p : x)))

// Cada 25 s: Caja aprueba un pedido nuevo; cada 3.er ciclo Caja le pone prioridad a uno;
// cada 4.º Caja cancela uno que no empezó; cada 5.º el mozo sirve uno que estaba listo.
function cicloMock() {
  ciclosMock++
  const nuevo: PedidoCocina = {
    id: siguienteId++, mesa: `Mesa ${1 + Math.floor(Math.random() * 20)}`, estado: 'APROBADO', prioridadManual: false,
    enviadoEn: new Date().toISOString(), version: 1,
    items: [{ platoId: 7, nombre: 'Pizza muzzarella', cantidad: 1 + Math.floor(Math.random() * 3) }],
  }
  colaMock = [...colaMock, nuevo]
  emitirMock({ tipo: 'PEDIDO_APROBADO', pedido: nuevo })

  if (ciclosMock % 3 === 0) {
    const objetivo = colaMock.find((p) => p.estado === 'APROBADO' && !p.prioridadManual && p.id !== nuevo.id)
    if (objetivo) {
      const act = { ...objetivo, prioridadManual: true, version: (objetivo.version ?? 0) + 1 }
      reemplazarMock(act)
      emitirMock({ tipo: 'PRIORIDAD_CAMBIADA', pedido: act })
    }
  }
  if (ciclosMock % 4 === 0) {
    const objetivo = [...colaMock].reverse().find((p) => p.estado === 'APROBADO' && !p.prioridadManual && p.id !== nuevo.id)
    if (objetivo) {
      colaMock = colaMock.filter((p) => p.id !== objetivo.id)
      emitirMock({ tipo: 'PEDIDO_CANCELADO', pedidoId: objetivo.id })
    }
  }
  if (ciclosMock % 5 === 0) {
    const listo = colaMock.find((p) => p.estado === 'LISTO')
    if (listo) {
      colaMock = colaMock.filter((p) => p.id !== listo.id)
      emitirMock({ tipo: 'PEDIDO_SERVIDO', pedidoId: listo.id })
    }
  }
}

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Solo se puede avanzar desde el estado anterior; si no, 409 como el back real.
function avanzarMock(id: number, desde: EstadoCocina, hasta: EstadoCocina) {
  const p = colaMock.find((x) => x.id === id)
  if (!p || p.estado !== desde) {
    const cuerpo: ProblemDetail = { title: 'Conflict', status: 409, detail: 'El pedido ya no está en ese estado' }
    throw new ApiError(409, cuerpo)
  }
  const ahora = new Date().toISOString()
  reemplazarMock({
    ...p, estado: hasta, version: (p.version ?? 0) + 1,
    ...(hasta === 'EN_PREPARACION' ? { enPreparacionEn: ahora } : { listoEn: ahora }),
  })
}

/* ---------------- Funciones públicas (base /api/v1) ---------------- */

export async function listarCola(): Promise<PedidoCocina[]> {
  if (USAR_MOCKS) {
    await pausa(250)
    exigirSesionMock()
    return colaMock.map((p) => ({ ...p, items: p.items.map((i) => ({ ...i })) }))
  }
  // TODO(back): confirmar la ruta y si el GET trae los tres estados (APROBADO, EN_PREPARACION y LISTO sin servir)
  // o hay que pedirlos con un parámetro, por ejemplo ?estado=...
  return api<PedidoCocina[]>('/cocina/pedidos')
}

// APROBADO → EN_PREPARACION. Si el pedido ya cambió (lo canceló Caja, otra pantalla lo tomó), el back responde 409.
export async function empezarPedido(id: number, version?: number): Promise<void> {
  if (USAR_MOCKS) {
    await pausa(300)
    exigirSesionMock()
    return avanzarMock(id, 'APROBADO', 'EN_PREPARACION')
  }
  // TODO(back): confirmar la ruta del endpoint y si `version` va en el body.
  return api<void>(`/cocina/pedidos/${id}/preparar`, { method: 'POST', body: JSON.stringify({ version }) })
}

// EN_PREPARACION → LISTO
export async function marcarPedidoListo(id: number, version?: number): Promise<void> {
  if (USAR_MOCKS) {
    await pausa(300)
    exigirSesionMock()
    return avanzarMock(id, 'EN_PREPARACION', 'LISTO')
  }
  // TODO(back): confirmar la ruta del endpoint y si `version` va en el body.
  return api<void>(`/cocina/pedidos/${id}/listo`, { method: 'POST', body: JSON.stringify({ version }) })
}

/** Escucha los cambios de la cola. Devuelve la función para dejar de escuchar. */
export function escucharCola(localId: number, m: Escuchador<EventoCocina>): () => void {
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
  // TODO(back): confirmar el topic. Por analogía con Caja: /topic/local/{localId}/cocina/pedidos (singular).
  return suscribir(`/topic/local/${localId}/cocina/pedidos`, (dato) => entregar(m, dato), {
    alConectar: m.alConectar,
    alDesconectar: m.alDesconectar,
  })
}
