import type { Rol } from '../api/auth'

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
