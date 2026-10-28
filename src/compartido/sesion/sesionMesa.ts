// El tokenSesion de cada mesa, para que el back reconozca al celular cuando recarga o vuelve a escanear el QR.
// Va en localStorage y no en sessionStorage porque escanear otra vez abre otra pestaña. Una clave por mesa.
const PREFIJO = 'chitgo-mesa:'

export function leerTokenSesion(tokenQR: string): string | null {
  try {
    return localStorage.getItem(PREFIJO + tokenQR)
  } catch {
    return null
  }
}

export function guardarTokenSesion(tokenQR: string, tokenSesion: string) {
  try {
    localStorage.setItem(PREFIJO + tokenQR, tokenSesion)
  } catch {
    /* sin storage: al recargar, el back lo trata como un celular nuevo */
  }
}
