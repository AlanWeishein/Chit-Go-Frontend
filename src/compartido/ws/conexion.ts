import { Client, type StompSubscription } from '@stomp/stompjs'

// Una única conexión STOMP para toda la app.
// El personal se autentica con la cookie del handshake; el cliente anónimo manda su
// tokenSesion en el frame CONNECT (connectHeaders).
let cliente: Client | null = null

interface Escucha {
  destino: string
  alRecibir: (dato: unknown) => void
  alConectar?: () => void
  alDesconectar?: () => void
  sub?: StompSubscription
}

// Todas las suscripciones vivas. Al reconectar, STOMP abre una sesión nueva y las
// suscripciones viejas se pierden: por eso las guardamos y las rearmamos en onConnect.
const escuchas = new Set<Escucha>()

function abrir(c: Client, e: Escucha) {
  e.sub = c.subscribe(e.destino, (mensaje) => {
    try {
      e.alRecibir(JSON.parse(mensaje.body))
    } catch {
      /* mensaje que no es JSON: se ignora */
    }
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
    onWebSocketClose: () =>
      escuchas.forEach((e) => {
        e.sub = undefined
        e.alDesconectar?.()
      }),
  })
  cliente = c
  c.activate()
  return c
}

export function desconectar() {
  void cliente?.deactivate()
  cliente = null
}

/**
 * Se suscribe a un destino (por ejemplo `/topic/...`). Devuelve la función para cancelar.
 * `alConectar` corre en la conexión inicial y en cada reconexión: ahí la pantalla debe traer
 * el estado completo del servidor (RNF-08), no confiar en haberse perdido o no eventos.
 */
export function suscribir(
  destino: string,
  alRecibir: (dato: unknown) => void,
  extras: { alConectar?: () => void; alDesconectar?: () => void } = {},
): () => void {
  const e: Escucha = { destino, alRecibir, ...extras }
  escuchas.add(e)
  const c = conectar()
  if (c.connected) abrir(c, e) // si ya estaba conectado, onConnect no va a volver a correr
  return () => {
    escuchas.delete(e)
    try {
      e.sub?.unsubscribe()
    } catch {
      /* ya estaba desconectado */
    }
    e.sub = undefined
  }
}
