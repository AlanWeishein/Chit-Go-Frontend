import { api } from './http'

// La carta del Admin (P-14, P-14b y P-14c, HU-12). Sesión de Admin: Caja recibe 403.
// Sin DELETE de platos: sacar un plato de la carta es cambiarDisponibilidad de platos.ts (decidido el 29/10).
// Sin nombre, el back responde 400 "Poné un nombre". Un nombre más largo que el esquema da el 400 genérico
// ("Los datos enviados no son válidos."), así que los largos se controlan en el campo.

// ---------- Platos ----------

export interface PlatoAdmin {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  categoria: { id: number; nombre: string }
  imagenUrl: string | null // una URL https o una ruta del front ("/img/milanesa.jpg")
  destacado: boolean // "Menú del día": sale arriba en la carta del cliente
  disponible: boolean // en false está fuera de carta
  etiquetas: { id: number; nombre: string }[] // ordenadas por nombre
}

// El cuerpo del alta y de la edición. Nombre hasta 120, descripción hasta 500 y precio con dos decimales como
// mucho. imagenUrl vacía o null se guarda como null.
// OJO: etiquetaIds vacío o sin mandar deja el plato sin etiquetas, también al editar.
export interface DatosDePlato {
  nombre: string
  descripcion: string | null
  precio: number
  categoriaId: number
  imagenUrl: string | null
  etiquetaIds: number[]
}

// Todos los platos del local, también los fuera de carta, en el orden de la carta y después por nombre.
export function listarPlatosAdmin() {
  return api<PlatoAdmin[]>('/admin/platos')
}

// 201 con el plato. Nace disponible y sin destacar.
// 400 "Poné un nombre", "El precio tiene que ser mayor a cero" o "La imagen tiene que ser un link https o una
// ruta del front". 404 "La categoría no existe" o "La etiqueta no existe".
export function crearPlato(datos: DatosDePlato) {
  return api<PlatoAdmin>('/admin/platos', { method: 'POST', body: JSON.stringify(datos) })
}

// 200 con el plato. No cambia destacado ni disponible. Mismos errores que crear, y 404 "El plato no existe".
export function editarPlato(id: number, datos: DatosDePlato) {
  return api<PlatoAdmin>(`/admin/platos/${id}`, { method: 'PUT', body: JSON.stringify(datos) })
}

// 204. 404 "El plato no existe".
export function destacarPlato(id: number, destacado: boolean) {
  return api<void>(`/admin/platos/${id}/destacado`, { method: 'PATCH', body: JSON.stringify({ destacado }) })
}

// ---------- Categorías ----------

export interface CategoriaAdmin {
  id: number
  nombre: string
  platos: number // todos los que tiene, también los fuera de carta
  fueraDeCarta: number
}

// En el orden de la carta: la posición en la lista es el orden.
export function listarCategorias() {
  return api<CategoriaAdmin[]>('/admin/categorias')
}

// 201 con la categoría, que va al final del orden. Nombre hasta 80.
export function crearCategoria(nombre: string) {
  return api<CategoriaAdmin>('/admin/categorias', { method: 'POST', body: JSON.stringify({ nombre }) })
}

// 200 con la categoría. 404 "La categoría no existe".
export function renombrarCategoria(id: number, nombre: string) {
  return api<CategoriaAdmin>(`/admin/categorias/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) })
}

// 204. Los ids de todas las categorías del local, una vez cada una, en el orden nuevo. Si falta o sobra una:
// 400 "El orden tiene que traer todas las categorías del local, una vez cada una".
export function ordenarCategorias(ids: number[]) {
  return api<void>('/admin/categorias/orden', { method: 'PUT', body: JSON.stringify({ ids }) })
}

// 204. Con platos, aunque estén fuera de carta: 409 "La categoría tiene 3 platos (1 fuera de carta). Movelos a
// otra antes de borrarla". 404 "La categoría no existe".
export function borrarCategoria(id: number) {
  return api<void>(`/admin/categorias/${id}`, { method: 'DELETE' })
}

// ---------- Etiquetas ----------

export interface EtiquetaAdmin {
  id: number
  nombre: string
}

// Por nombre.
export function listarEtiquetas() {
  return api<EtiquetaAdmin[]>('/admin/etiquetas')
}

// 201 con la etiqueta. Nombre hasta 60. Repetida (sin importar mayúsculas ni tildes): 409 "Esa etiqueta ya existe".
export function crearEtiqueta(nombre: string) {
  return api<EtiquetaAdmin>('/admin/etiquetas', { method: 'POST', body: JSON.stringify({ nombre }) })
}

// 200 con la etiqueta. 409 "Esa etiqueta ya existe"; 404 "La etiqueta no existe".
export function renombrarEtiqueta(id: number, nombre: string) {
  return api<EtiquetaAdmin>(`/admin/etiquetas/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) })
}

// 204. Se va también de los platos que la tenían. 404 "La etiqueta no existe".
export function borrarEtiqueta(id: number) {
  return api<void>(`/admin/etiquetas/${id}`, { method: 'DELETE' })
}
