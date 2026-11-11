// Sin tildes ni mayúsculas, para buscar en el navegador. La usan la disponibilidad rápida (Caja y Admin) y la carta del Admin.
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
