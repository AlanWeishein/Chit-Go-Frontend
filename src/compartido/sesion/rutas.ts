import type { Rol, Sesion } from '../api/auth'

export function rutaInicial(rol: Rol): string {
  switch (rol) {
    case 'MOZO': return '/mozo/mesas'
    case 'CAJA': return '/caja/pedidos'
    case 'COCINA': return '/cocina/cola'
    case 'ADMIN':
    case 'GERENTE_DUENO': return '/admin'
    default: return '/'
  }
}

export function entraConEmail(rol: Rol): boolean {
  return rol === 'ADMIN' || rol === 'GERENTE_DUENO'
}

// A dónde va alguien que ya entró: a elegir su credencial si es provisoria, o a la pantalla de su rol.
// Sin el tokenStaff no se puede armar la ruta de P-30, y va a la de su rol.
export function rutaDeEntrada(sesion: Sesion, tokenStaff: string | null): string {
  if (!sesion.debeCambiarCredencial) return rutaInicial(sesion.rol)
  if (entraConEmail(sesion.rol)) return '/admin/cambiar-contrasena'
  return tokenStaff ? `/staff/${encodeURIComponent(tokenStaff)}/elegir-pin` : rutaInicial(sesion.rol)
}

export function nombreDelRol(rol: Rol): string {
  switch (rol) {
    case 'MOZO': return 'Mozo'
    case 'CAJA': return 'Caja'
    case 'COCINA': return 'Cocina'
    case 'ADMIN': return 'Admin'
    case 'GERENTE_DUENO': return 'Gerente/Dueño'
  }
}
