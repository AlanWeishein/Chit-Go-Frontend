import type { FalloLogin } from '../../../compartido/api/auth'

export function textoDeFallo(f: FalloLogin): string {
  switch (f.motivo) {
    case 'qr-invalido':
      return 'El QR de staff no es válido.'
    case 'bloqueado':
      return 'Tu usuario está bloqueado. Pedile al Admin que te blanquee el PIN.'
    case 'contrasena-requerida':
      return 'Ingresá tu usuario y contraseña.'
    case 'pin-incorrecto':
      return 'PIN incorrecto.'
    case 'pin-invalido':
      return 'Datos inválidos: el PIN tiene de 4 a 10 dígitos.'
    case 'admin-incorrecto':
      return 'Email o contraseña incorrectos.'
    case 'credencial-provisoria':
      return 'Tenés que elegir tu credencial antes de ingresar.'
    case 'red':
      return 'No pudimos completar la operación. Revisá la conexión y probá de nuevo.'
  }
}
