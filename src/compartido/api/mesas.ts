import { api } from './http'
import type { Pagina } from './paginacion'
import type { MesaAdmin } from '../tipos/mesas'

// Las mesas del Admin (MesasAdminController, HU-13). Todo es del local de la sesión: el back no recibe localId.

const POR_PAGINA = 100 // el máximo que acepta el back

// Todas las mesas del local. GET /admin/mesas pagina, y P-15 las muestra todas, así que se piden de a 100 hasta la
// última. Si una página falla, falla todo, para no mostrar una lista a medias. El back ordena el número como texto
// ("1", "21", "3"): acá se reordena con los números como números ("1", "3", "21").
export async function listarMesas(): Promise<MesaAdmin[]> {
  const todas: MesaAdmin[] = []
  for (let page = 0; ; page++) {
    const pagina = await api<Pagina<MesaAdmin>>(`/admin/mesas?page=${page}&size=${POR_PAGINA}`)
    todas.push(...pagina.contenido)
    if (page + 1 >= pagina.totalPaginas) break
  }
  return todas.sort((a, b) => a.numero.localeCompare(b.numero, 'es', { numeric: true }))
}

// El número va de 1 a 20 caracteres. Repetido en el local, 409 "Ya existe la mesa N".
export function crearMesa(numero: string): Promise<MesaAdmin> {
  return api<MesaAdmin>('/admin/mesas', { method: 'POST', body: JSON.stringify({ numero }) })
}

export function editarMesa(id: number, numero: string): Promise<MesaAdmin> {
  return api<MesaAdmin>(`/admin/mesas/${id}`, { method: 'PUT', body: JSON.stringify({ numero }) })
}

// Inhabilitar con la cuenta abierta da 409 "Cerrá la cuenta antes de inhabilitar o dar de baja la mesa". El motivo
// va hasta 255 caracteres; al habilitar no se manda.
export function cambiarInhabilitada(id: number, inhabilitada: boolean, motivo: string | null): Promise<MesaAdmin> {
  return api<MesaAdmin>(`/admin/mesas/${id}/inhabilitada`, {
    method: 'PATCH',
    body: JSON.stringify({ inhabilitada, motivo }),
  })
}

// Baja lógica (204). Con la cuenta abierta, el mismo 409 que al inhabilitar.
export function darDeBajaMesa(id: number): Promise<void> {
  return api<void>(`/admin/mesas/${id}`, { method: 'DELETE' })
}
