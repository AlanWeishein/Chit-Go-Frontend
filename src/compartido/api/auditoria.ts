import type { Ambito } from './reportes'
import { api } from './http'
import type { Pagina } from './paginacion'

// Una fila de la auditoría (ConsultaDeAuditoria.Fila). valorAnterior y valorNuevo son el JSON que guardó el servicio
// que hizo la acción (un objeto, o null en las altas y las bajas). Solo lectura: el back no tiene cómo editarla.
export interface RegistroDeAuditoria {
  id: number
  usuarioId: number
  usuario: string
  accion: string
  entidad: string
  entidadId: number | null
  valorAnterior: unknown
  valorNuevo: unknown
  creadoEn: string // ISO
}

// Los filtros que acepta el back. desde y hasta son AAAA-MM-DD, inclusivos; cualquiera puede faltar.
export interface FiltrosDeAuditoria {
  accion?: string
  usuarioId?: number
  desde?: string
  hasta?: string
}

// El Admin la pide a /admin/auditoria y el Gerente/Dueño a /gerente/auditoria, sin localId. De lo más nuevo a lo
// más viejo (lo ordena el back).
export function listarAuditoria(ambito: Ambito, page: number, size: number, filtros: FiltrosDeAuditoria = {}) {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  if (filtros.accion) query.set('accion', filtros.accion)
  if (filtros.usuarioId !== undefined) query.set('usuarioId', String(filtros.usuarioId))
  if (filtros.desde) query.set('desde', filtros.desde)
  if (filtros.hasta) query.set('hasta', filtros.hasta)
  return api<Pagina<RegistroDeAuditoria>>(`/${ambito}/auditoria?${query.toString()}`)
}

// Todos los códigos que el back registra hoy, sacados de cada llamada a Auditor.registrar (develop, 21/11). En el
// orden en que se ofrecen en el filtro. Si el back suma uno, se ve el código tal cual hasta que se agregue acá.
export const ACCIONES: Record<string, string> = {
  APROBAR_PEDIDO: 'Aprobó pedido',
  RECHAZAR_PEDIDO: 'Rechazó pedido',
  CANCELAR_PEDIDO: 'Canceló pedido',
  CAMBIAR_PRIORIDAD: 'Cambió prioridad',
  INICIAR_PREPARACION: 'Empezó a preparar',
  MARCAR_PEDIDO_LISTO: 'Marcó listo',
  SERVIR_PEDIDO: 'Sirvió pedido',
  ATENDER_AVISO: 'Atendió aviso',
  CERRAR_CUENTA: 'Cerró cuenta',
  CAMBIAR_DISPONIBILIDAD: 'Cambió disponibilidad',
  CREAR_PLATO: 'Creó plato',
  EDITAR_PLATO: 'Editó plato',
  DESTACAR_PLATO: 'Cambió destacado',
  CREAR_CATEGORIA: 'Creó categoría',
  EDITAR_CATEGORIA: 'Editó categoría',
  ORDENAR_CATEGORIAS: 'Ordenó categorías',
  BORRAR_CATEGORIA: 'Borró categoría',
  CREAR_ETIQUETA: 'Creó etiqueta',
  EDITAR_ETIQUETA: 'Editó etiqueta',
  BORRAR_ETIQUETA: 'Borró etiqueta',
  CREAR_MESA: 'Creó mesa',
  EDITAR_MESA: 'Editó mesa',
  INHABILITAR_MESA: 'Inhabilitó mesa',
  HABILITAR_MESA: 'Habilitó mesa',
  BAJA_MESA: 'Dio de baja mesa',
  CREAR_EMPLEADO: 'Creó empleado',
  EDITAR_EMPLEADO: 'Editó empleado',
  BAJA_EMPLEADO: 'Dio de baja empleado',
  BLANQUEAR_PIN: 'Blanqueó PIN',
  CAMBIAR_TURNOS: 'Cambió turnos',
  CAMBIAR_MESAS: 'Cambió mesas asignadas',
  CREAR_AUSENCIA: 'Cargó ausencia',
  EDITAR_AUSENCIA: 'Editó ausencia',
  CREAR_ADMIN: 'Creó Admin',
  BAJA_ADMIN: 'Dio de baja Admin',
  REACTIVAR_ADMIN: 'Reactivó Admin',
  DESBLOQUEAR_ADMIN: 'Desbloqueó Admin',
  CREAR_LOCAL: 'Creó local',
  DESBLOQUEAR_GERENTE: 'Desbloqueó Gerente/Dueño',
}

// Las entidades que se auditan. USUARIO es un Admin (HU-16); los empleados van como EMPLEADO.
export const ENTIDADES: Record<string, string> = {
  PEDIDO: 'Pedido',
  CUENTA: 'Cuenta',
  AVISO: 'Aviso',
  PLATO: 'Plato',
  CATEGORIA_MENU: 'Categoría',
  ETIQUETA: 'Etiqueta',
  MESA: 'Mesa',
  EMPLEADO: 'Empleado',
  AUSENCIA: 'Ausencia',
  USUARIO: 'Admin',
  LOCAL: 'Local',
}

export function textoDeAccion(codigo: string): string {
  return ACCIONES[codigo] ?? codigo
}

export function textoDeEntidad(codigo: string): string {
  return ENTIDADES[codigo] ?? codigo
}
