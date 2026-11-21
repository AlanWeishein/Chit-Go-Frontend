import type { Ausencia, TipoAusencia } from '../../compartido/api/empleados'

// Lo que usan P-23 y sus diálogos (P-23d y la carga de ausencias), aparte para que el formulario no crezca.

// El PIN provisorio que propone "Generar otro": 4 cifras al azar con crypto, no con Math.random. El Admin lo puede
// cambiar: el back acepta de 4 a 10 dígitos.
export function generarPin(): string {
  const [n] = crypto.getRandomValues(new Uint32Array(1))
  return String(n % 10000).padStart(4, '0')
}

export const PIN_VALIDO = /^\d{4,10}$/
export const ERROR_DE_PIN = 'El PIN tiene que tener de 4 a 10 números.'

// Las ausencias son días del local: el back las compara en America/Argentina/Buenos_Aires.
export function hoyDelLocal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
}

// "2026-11-21" → "2026-11-20", sin pasar por la zona horaria del navegador.
export function diaAnterior(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d - 1)).toISOString().slice(0, 10)
}

function diaSiguiente(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10)
}

// "2026-10-20" → "20/10".
export function fechaCorta(fecha: string): string {
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`
}

export const TIPOS_DE_AUSENCIA: { valor: TipoAusencia; texto: string }[] = [
  { valor: 'VACACIONES', texto: 'Vacaciones' },
  { valor: 'FRANCO', texto: 'Franco' },
  { valor: 'BAJA_TEMPORAL', texto: 'Baja temporal' },
]

export function textoDeTipo(tipo: TipoAusencia): string {
  return TIPOS_DE_AUSENCIA.find((t) => t.valor === tipo)?.texto ?? tipo
}

// Como el Mockup: "del 20/10 al 27/10", y la de un día "15/10 · vuelve el 16/10".
export function periodoDe(a: Ausencia): string {
  if (a.hasta === null) return `desde el ${fechaCorta(a.desde)} · sin fecha de vuelta`
  if (a.hasta === a.desde) return `${fechaCorta(a.desde)} · vuelve el ${fechaCorta(diaSiguiente(a.hasta))}`
  return `del ${fechaCorta(a.desde)} al ${fechaCorta(a.hasta)}`
}

// Terminar es poner `hasta` en ayer, así vuelve hoy (opción A de Eze, 2026-11-21). El back no deja un `hasta`
// anterior a `desde` y no tiene DELETE: una ausencia que empieza hoy o más adelante no se puede terminar.
export type FinDeAusencia =
  | { puede: true; hasta: string }
  | { puede: false; motivo: string | null } // null: ya terminó y no hace falta decir nada

export function comoTerminar(a: Ausencia, hoy: string): FinDeAusencia {
  if (a.hasta !== null && a.hasta < hoy) return { puede: false, motivo: null }
  if (a.desde < hoy) return { puede: true, hasta: diaAnterior(hoy) }
  if (a.desde === hoy) return { puede: false, motivo: 'Empezó hoy: se puede terminar desde mañana.' }
  return { puede: false, motivo: 'Todavía no empezó, y por ahora no se puede sacar.' }
}

// Las de la contraseña del mozo, como en /auth/credencial: de 8 a 64 caracteres y hasta 72 bytes (BCrypt usa solo
// los primeros 72).
export function errorDeContrasena(password: string): string | null {
  const caracteres = [...password].length
  if (caracteres < 8 || caracteres > 64) return 'La contraseña tiene que tener de 8 a 64 caracteres.'
  if (new TextEncoder().encode(password).length > 72)
    return 'La contraseña es muy larga: pasa de 72 bytes (los acentos y los símbolos pesan más).'
  return null
}
