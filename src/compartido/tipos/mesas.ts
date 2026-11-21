// Una mesa del local como la manda el back (MesaAdminDto, HU-13). El número es texto libre de hasta 20 caracteres
// ("1", "12", "Patio 2"). El back lista solo las activas: una mesa dada de baja no vuelve a aparecer.
export interface MesaAdmin {
  id: number
  numero: string
  inhabilitada: boolean
  motivoInhabilitacion: string | null
  activa: boolean
  tokenQr: string
}
