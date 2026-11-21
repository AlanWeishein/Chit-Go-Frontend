// Las secciones del marco del Admin y quién ve cada una. De acá salen el menú (MarcoAdmin) y las rutas (SoloPara en
// App.tsx), así no se pueden separar. El Gerente/Dueño no opera el local (HU-16): ve solo Reportes, Auditoría y
// Administradores. La gestión de Admins es solo suya (CP-31-05). El permiso de verdad lo controla el back.
import type { Rol } from '../../compartido/api/auth'
import iconoMenu from '../../compartido/ui/iconos/book.svg'
import iconoDisponibilidad from '../../compartido/ui/iconos/box.svg'
import iconoReportes from '../../compartido/ui/iconos/chart.svg'
import iconoConfiguracion from '../../compartido/ui/iconos/clock-18.svg'
import iconoMesas from '../../compartido/ui/iconos/grid.svg'
import iconoDashboard from '../../compartido/ui/iconos/home.svg'
import iconoAdministradores from '../../compartido/ui/iconos/key.svg'
import iconoAuditoria from '../../compartido/ui/iconos/shield.svg'
import iconoEmpleados from '../../compartido/ui/iconos/users.svg'

export const SOLO_ADMIN: Rol[] = ['ADMIN']
export const SOLO_GERENTE: Rol[] = ['GERENTE_DUENO']
export const LOS_DOS: Rol[] = ['ADMIN', 'GERENTE_DUENO']

// En el orden del Mockup.
export const seccionesAdmin = [
  { a: '/admin/dashboard', texto: 'Dashboard', icono: iconoDashboard, roles: SOLO_ADMIN },
  { a: '/admin/menu', texto: 'Menú', icono: iconoMenu, roles: SOLO_ADMIN },
  { a: '/admin/mesas', texto: 'Mesas y QR', icono: iconoMesas, roles: SOLO_ADMIN },
  { a: '/admin/empleados', texto: 'Empleados y turnos', icono: iconoEmpleados, roles: SOLO_ADMIN },
  { a: '/admin/reportes', texto: 'Reportes', icono: iconoReportes, roles: LOS_DOS },
  { a: '/admin/auditoria', texto: 'Auditoría', icono: iconoAuditoria, roles: LOS_DOS },
  { a: '/admin/administradores', texto: 'Administradores', icono: iconoAdministradores, roles: SOLO_GERENTE },
  { a: '/admin/disponibilidad', texto: 'Disponibilidad rápida', icono: iconoDisponibilidad, roles: SOLO_ADMIN },
  { a: '/admin/configuracion', texto: 'Configuración', icono: iconoConfiguracion, roles: SOLO_ADMIN },
]
