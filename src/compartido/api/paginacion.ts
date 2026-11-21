// La forma de los listados paginados del back (contrato, sección 1): page empieza en 0, size vale 20 si no viene
// y el máximo es 100. La forma de la respuesta la propuso la ST-22 para empleados y falta acordarla con German
// para auditoría y reportes: si cambia, se corrige acá.
export interface Pagina<T> {
  contenido: T[]
  page: number
  size: number
  totalElementos: number
  totalPaginas: number
}
