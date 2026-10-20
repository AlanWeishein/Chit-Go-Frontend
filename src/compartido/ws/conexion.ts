import { Client, type StompSubscription } from '@stomp/stompjs'

let cliente: Client | null = null

interface Escucha {
  destino: string
  alRecibir: (dato: unknown) => void
  alConectar?: () => void
  alDesconectar?: () => void
  sub?: StompSubscription
}

const escuchas = new Set<Escucha>()

function abrir(c: Client, e: Escucha) {
  e.sub = c.subscribe(e.destino, (mensaje) => {
    try { e.alRecibir(JSON.parse(mensaje.body)) } catch {}
  })
  e.alConectar?.()
}

export function conectar(connectHeaders: Record<string, string> = {}): Client {
  if (cliente?.active) return cliente
  const protocolo = location.protocol === 'https:' ? 'wss' : 'ws'
  const c = new Client({
    brokerURL: `${protocolo}://${location.host}/ws`,
    connectHeaders,
    reconnectDelay: 3000,
    onConnect: () => escuchas.forEach((e) => abrir(c, e)),
    onWebSocketClose: () => escuchas.forEach((e) => { e.sub = undefined; e.alDesconectar?.() }),
  })
  cliente = c
  c.activate()
  return c
}

export function desconectar() {
  void cliente?.deactivate()
  cliente = null
}

export function suscribir(
  destino: string,
  alRecibir: (dato: unknown) => void,
  extras: { alConectar?: () => void; alDesconectar?: () => void } = {},
): () => void {
  const e: Escucha = { destino, alRecibir, ...extras }
  escuchas.add(e)
  const c = conectar()
  if (c.connected) abrir(c, e) 
  return () => {
    escuchas.delete(e)
    try { e.sub?.unsubscribe() } catch {}
    e.sub = undefined
  }
}
