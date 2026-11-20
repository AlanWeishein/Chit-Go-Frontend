import { api } from './http'
import type { DatosDeAltaDeLocal, DesbloqueoDeGerente, LocalCreado } from '../tipos/plataforma'

export function crearLocal(datos: DatosDeAltaDeLocal): Promise<LocalCreado> {
  return api<LocalCreado>('/superadmin/locales', { method: 'POST', body: JSON.stringify(datos) })
}

export function desbloquearGerente(email: string): Promise<DesbloqueoDeGerente> {
  return api<DesbloqueoDeGerente>('/superadmin/gerentes/desbloquear', {
    method: 'POST', body: JSON.stringify({ email }),
  })
}
