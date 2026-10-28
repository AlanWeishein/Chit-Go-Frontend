import { Client } from '@stomp/stompjs'

// Una única conexión STOMP para toda la app.
// El personal se autentica con la cookie del handshake; el cliente anónimo manda su
// tokenSesion en el frame CONNECT (connectHeaders).
let cliente: Client | null = null

// alConectar corre en cada conexión, también en las que reintenta solo cada 3 segundos: ahí van las
// suscripciones y el pedido del estado completo (RNF-08). alCortarse avisa que se perdió la conexión.
export interface AvisosDeConexion {
  alConectar?: (cliente: Client) => void
  alCortarse?: () => void
}

export function conectar(connectHeaders: Record<string, string> = {}, avisos: AvisosDeConexion = {}): Client {
  if (cliente?.active) return cliente
  const protocolo = location.protocol === 'https:' ? 'wss' : 'ws'
  const nuevo = new Client({
    brokerURL: `${protocolo}://${location.host}/ws`,
    connectHeaders,
    reconnectDelay: 3000,
  })
  if (avisos.alConectar) nuevo.onConnect = () => avisos.alConectar?.(nuevo)
  if (avisos.alCortarse) nuevo.onWebSocketClose = () => avisos.alCortarse?.()
  cliente = nuevo
  nuevo.activate()
  return nuevo
}

export function desconectar() {
  void cliente?.deactivate()
  cliente = null
}
