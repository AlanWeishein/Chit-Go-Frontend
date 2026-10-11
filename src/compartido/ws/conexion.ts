import { Client } from '@stomp/stompjs'

// Una única conexión STOMP para toda la app.
// El personal se autentica con la cookie del handshake; el cliente anónimo manda su
// tokenSesion en el frame CONNECT (connectHeaders).
let cliente: Client | null = null

export function conectar(connectHeaders: Record<string, string> = {}): Client {
  if (cliente?.active) return cliente
  const protocolo = location.protocol === 'https:' ? 'wss' : 'ws'
  cliente = new Client({
    brokerURL: `${protocolo}://${location.host}/ws`,
    connectHeaders,
    reconnectDelay: 3000,
  })
  cliente.activate()
  return cliente
}

export function desconectar() {
  void cliente?.deactivate()
  cliente = null
}
