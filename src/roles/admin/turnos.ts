import type { DiaSemana, RolDeEmpleado, Turno } from '../../compartido/api/empleados'

// Lo que comparten la lista de empleados (P-16) y su formulario (P-23): los nombres de los roles y de los días, y
// cómo se resume un turno. Salió de EmpleadosAdmin.tsx en la tarea 7 de la ST-31, para que el Resumen de P-23 diga
// lo mismo que la lista.

export const ROL: Record<RolDeEmpleado, string> = { MOZO: 'Mozo', CAJA: 'Caja', COCINA: 'Cocina' }

export const DIAS: { dia: DiaSemana; corto: string; letra: string; largo: string }[] = [
  { dia: 'LUN', corto: 'Lun', letra: 'L', largo: 'lunes' },
  { dia: 'MAR', corto: 'Mar', letra: 'M', largo: 'martes' },
  { dia: 'MIE', corto: 'Mié', letra: 'X', largo: 'miércoles' },
  { dia: 'JUE', corto: 'Jue', letra: 'J', largo: 'jueves' },
  { dia: 'VIE', corto: 'Vie', letra: 'V', largo: 'viernes' },
  { dia: 'SAB', corto: 'Sáb', letra: 'S', largo: 'sábado' },
  { dia: 'DOM', corto: 'Dom', letra: 'D', largo: 'domingo' },
]
export const ORDEN = new Map(DIAS.map((d, i) => [d.dia, i]))

// "19:00:00" → "19:00".
export function hora(h: string): string {
  return h.slice(0, 5)
}

// Para la grilla, como el Mockup: "19:00:00" → "19", y con minutos "18:30".
export function horaCorta(h: string): string {
  return h.slice(3, 5) === '00' ? h.slice(0, 2) : h.slice(0, 5)
}

// Tres o más días seguidos van como rango ("Lun a Vie"); si no, en lista ("Lun, Mié y Vie").
export function textoDeDias(indices: number[]): string {
  if (indices.length === 7) return 'Todos los días'
  const seguidos = indices.every((d, i) => i === 0 || d === indices[i - 1] + 1)
  if (seguidos && indices.length >= 3) return `${DIAS[indices[0]].corto} a ${DIAS[indices[indices.length - 1]].corto}`
  const nombres = indices.map((i) => DIAS[i].corto)
  return nombres.length === 1 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

// Junta los días con las mismas horas: una línea por horario ("Lun a Vie · 18:00–02:00"). Un turno que cruza la
// medianoche va en el día en que empieza, como lo guarda el back.
export function resumenDeTurnos(turnos: Turno[]): string[] {
  const grupos = new Map<string, { inicio: string; fin: string; dias: Set<number> }>()
  for (const t of turnos) {
    const clave = `${hora(t.horaInicio)}|${hora(t.horaFin)}`
    const grupo = grupos.get(clave) ?? { inicio: t.horaInicio, fin: t.horaFin, dias: new Set<number>() }
    grupo.dias.add(ORDEN.get(t.dia) ?? 0)
    grupos.set(clave, grupo)
  }
  return [...grupos.values()]
    .map((g) => ({ ...g, indices: [...g.dias].sort((a, b) => a - b) }))
    .sort((a, b) => a.indices[0] - b.indices[0] || a.inicio.localeCompare(b.inicio))
    .map((g) => `${textoDeDias(g.indices)} · ${hora(g.inicio)}–${hora(g.fin)}`)
}
