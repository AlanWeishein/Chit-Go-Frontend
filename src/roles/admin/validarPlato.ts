// Las reglas del formulario de plato (P-14b, HU-12), las mismas que valida el back en Plato.java. Se controlan acá
// antes de mandar porque un largo o un decimal de más da el 400 genérico ("Los datos enviados no son válidos.").

export const NOMBRE_MAX = 120
export const DESCRIPCION_MAX = 500

export const ERROR_NOMBRE = 'Poné un nombre'
export const ERROR_PRECIO = 'El precio tiene que ser mayor a cero'
export const ERROR_DECIMALES = 'El precio tiene hasta dos decimales'
export const ERROR_PRECIO_ALTO = 'El precio no puede pasar de 99.999.999,99'

// La foto (ST-29): el front avisa antes de mandar, con los textos del back, pero el que valida es el back.
export const IMAGEN_MAX_BYTES = 3 * 1024 * 1024 // el mismo tope que application.yml y GestionarPlatosService
export const ERROR_IMAGEN_PESADA = 'La imagen pesa más de 3 MB'
export const ERROR_IMAGEN_FORMATO = 'La imagen tiene que ser JPEG o PNG'

export function errorDeNombre(nombre: string): string | null {
  return nombre.trim() === '' ? ERROR_NOMBRE : null
}

// Acepta "9500", "9500,50", "9500.50" y "9.500" (con punto de miles, como se escribe en Argentina). Un punto
// seguido de exactamente tres cifras, en grupos, es de miles: "9.500" es 9500 y no 9,5. Devuelve el precio o el error.
export function leerPrecio(texto: string): { precio: number; error: null } | { precio: null; error: string } {
  let t = texto.trim().replace(/^\$\s*/, '')
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.')
  else t = t.replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(t)) return { precio: null, error: ERROR_PRECIO }
  const [enteros, decimales = ''] = t.split('.')
  const precio = Number(t)
  if (!(precio > 0)) return { precio: null, error: ERROR_PRECIO }
  if (decimales.replace(/0+$/, '').length > 2) return { precio: null, error: ERROR_DECIMALES }
  if (enteros.replace(/^0+/, '').length > 8) return { precio: null, error: ERROR_PRECIO_ALTO }
  return { precio, error: null }
}

// El tipo sale de lo que dice el navegador (por la extensión); el back mira los primeros bytes.
export function errorDeArchivo(archivo: File): string | null {
  if (archivo.type !== 'image/jpeg' && archivo.type !== 'image/png') return ERROR_IMAGEN_FORMATO
  if (archivo.size > IMAGEN_MAX_BYTES) return ERROR_IMAGEN_PESADA
  return null
}
