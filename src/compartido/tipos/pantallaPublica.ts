export type EstadoPedidoPublico = 'EN_PREPARACION' | 'LISTO'

// GET /pantalla/{token}/pedidos-en-curso (PantallaDto). Solo mesa y estado: el back no manda precios, totales,
// nombres del personal, PIN ni hashes (RF-31). `mesa` es el número de la mesa, que es texto ("7", "Patio 2").
export interface PedidoPublico {
  id: number
  mesa: string
  estado: EstadoPedidoPublico
}

export interface PantallaPublica {
  localId: number
  pedidos: PedidoPublico[]
}

// GET /admin/pantalla (AccesoPantalla): el token que arma la dirección de la pantalla del salón.
export interface AccesoPantalla {
  localId: number
  tokenPantalla: string
}
