// El token del QR de staff no es un secreto de autenticación (sin PIN no entra nadie). Se guarda por
// pestaña para poder volver al login correcto cuando la sesión vence.
const CLAVE = 'chitgo-token-staff'

export function recordarTokenStaff(token: string) {
  try {
    sessionStorage.setItem(CLAVE, token)
  } catch {
    /* sin storage: se vuelve a '/' */
  }
}

export function leerTokenStaff(): string | null {
  try {
    return sessionStorage.getItem(CLAVE)
  } catch {
    return null
  }
}
