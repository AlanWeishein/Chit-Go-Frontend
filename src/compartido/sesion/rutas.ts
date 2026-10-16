import type { Rol } from '../api/auth'

export function rutaInicial(rol: Rol): string {
  switch (rol) {
    case 'Mozo': return '/mozo/mesas'
    case 'Caja': return '/caja/pedidos'
    case 'Cocina': return '/cocina/cola'
    case 'Admin':
    case 'Gerente': return '/admin'
  }
}
