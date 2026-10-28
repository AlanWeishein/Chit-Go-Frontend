import { useState } from 'react'
import type { ItemCarrito } from '../../compartido/tipos/carrito'
import type { Plato } from '../../compartido/tipos/menu'

export const CANTIDAD_MAXIMA = 999
export const LARGO_NOTA = 200

// El carrito vive en el celular hasta que se manda (HU-02): en localStorage, uno por mesa, así aguanta una
// recarga y el ir y venir entre P-01 y P-02. Va atado al tokenSesion: si el back devuelve otra sesión
// (se cerró la cuenta, otra mesa en el mismo QR), el carrito viejo no sirve.
// La clave del pedido (RNF-09) se guarda con él, antes de mandarlo: un reintento después de recargar sale con
// la misma. Cualquier cambio del carrito la borra, porque ya es otro pedido.
interface CarritoGuardado {
  tokenSesion: string
  items: ItemCarrito[]
  uuidCliente: string | null
}

const PREFIJO = 'chitgo-carrito:'

const vacio = (tokenSesion: string): CarritoGuardado => ({ tokenSesion, items: [], uuidCliente: null })

// null si no hay storage. Lo que no tiene la forma esperada o es de otra sesión cuenta como carrito vacío.
function leer(tokenQR: string, tokenSesion: string): CarritoGuardado | null {
  let texto: string | null
  try {
    texto = localStorage.getItem(PREFIJO + tokenQR)
  } catch {
    return null
  }
  try {
    const c = JSON.parse(texto ?? 'null') as CarritoGuardado | null
    if (c?.tokenSesion === tokenSesion && Array.isArray(c.items)) return c
  } catch {
    /* JSON roto: se empieza de cero */
  }
  return vacio(tokenSesion)
}

function guardar(tokenQR: string, carrito: CarritoGuardado) {
  try {
    if (carrito.items.length === 0) localStorage.removeItem(PREFIJO + tokenQR)
    else localStorage.setItem(PREFIJO + tokenQR, JSON.stringify(carrito))
  } catch {
    /* sin storage: el carrito queda en memoria y se pierde al recargar */
  }
}

// randomUUID existe solo en contextos seguros (HTTPS o localhost). Por http con la IP de la compu se arma
// un UUID v4 con getRandomValues, que sí está.
function nuevaClave(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

const acotar = (cantidad: number) => Math.min(CANTIDAD_MAXIMA, Math.max(1, cantidad))

// Sin tokenSesion (la mesa todavía no respondió) el carrito está vacío y no se puede tocar.
export function useCarrito(tokenQR: string, tokenSesion: string | null) {
  const id = tokenSesion === null ? null : `${tokenQR}|${tokenSesion}`
  const [cargadoDe, setCargadoDe] = useState<string | null>(null)
  const [carrito, setCarrito] = useState<CarritoGuardado | null>(null)
  if (id !== cargadoDe) {
    setCargadoDe(id)
    setCarrito(tokenSesion === null ? null : (leer(tokenQR, tokenSesion) ?? vacio(tokenSesion)))
  }

  // Se parte siempre de lo guardado, que es lo último aunque haya dos cambios seguidos o dos pestañas.
  function cambiar(f: (c: CarritoGuardado) => CarritoGuardado) {
    if (tokenSesion === null) return
    const antes = leer(tokenQR, tokenSesion) ?? carrito ?? vacio(tokenSesion)
    const despues = f(antes)
    if (despues === antes) return
    guardar(tokenQR, despues)
    setCarrito(despues)
  }

  function cambiarItems(f: (items: ItemCarrito[]) => ItemCarrito[]) {
    cambiar((c) => ({ ...c, items: f(c.items), uuidCliente: null }))
  }

  const items = (cargadoDe === id ? carrito?.items : undefined) ?? []

  return {
    items,
    platos: items.reduce((acc, i) => acc + i.cantidad, 0),
    total: items.reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0),

    agregar(plato: Plato) {
      cambiarItems((prev) =>
        prev.some((i) => i.producto.id === plato.id)
          ? prev.map((i) => (i.producto.id === plato.id ? { ...i, cantidad: acotar(i.cantidad + 1) } : i))
          : [...prev, { producto: plato, cantidad: 1 }],
      )
    },

    cambiarCantidad(platoId: number, cantidad: number) {
      cambiarItems((prev) => prev.map((i) => (i.producto.id === platoId ? { ...i, cantidad: acotar(cantidad) } : i)))
    },

    quitar(platoId: number) {
      cambiarItems((prev) => prev.filter((i) => i.producto.id !== platoId))
    },

    // Una nota vacía o con solo espacios no va: en el pedido sale como null.
    cambiarNota(platoId: number, texto: string) {
      const nota = texto.trim().slice(0, LARGO_NOTA) || undefined
      cambiar((c) => {
        const actual = c.items.find((i) => i.producto.id === platoId)
        if (actual === undefined || actual.observacion === nota) return c
        const nuevos = c.items.map((i) => (i.producto.id === platoId ? { ...i, observacion: nota } : i))
        return { ...c, items: nuevos, uuidCliente: null }
      })
    },

    // Lo que sale en el POST: los ítems guardados y la clave de este pedido, la que ya tenía si es un
    // reintento o una nueva. La clave queda guardada antes del POST.
    pedidoAEnviar(): { uuidCliente: string; items: ItemCarrito[] } {
      let pedido = { uuidCliente: '', items: [] as ItemCarrito[] }
      cambiar((c) => {
        const conClave = c.uuidCliente !== null ? c : { ...c, uuidCliente: nuevaClave() }
        pedido = { uuidCliente: conClave.uuidCliente as string, items: conClave.items }
        return conClave
      })
      return pedido
    },

    // Con 201 o 200: el pedido llegó y el carrito se vacía, con su clave.
    vaciar() {
      cambiar((c) => ({ ...c, items: [], uuidCliente: null }))
    },
  }
}
