export function segundosDesde(iso: string, ahora: number): number {
  return Math.max(0, Math.floor((ahora - Date.parse(iso)) / 1000))
}

// 135 → "2:15"
export function formatoTiempo(seg: number): string {
  return `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`
}
