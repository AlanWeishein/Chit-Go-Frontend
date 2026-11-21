// La forma de los listados paginados del back (PaginaDto): page empieza en 0, size vale 20 si no viene y va de 1 a
// 100 (fuera de eso responde 400). La usan empleados, mesas, auditoría y los reportes.
export interface Pagina<T> {
  contenido: T[]
  page: number
  size: number
  totalElementos: number
  totalPaginas: number
}
