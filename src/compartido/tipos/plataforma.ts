// SuperadminController, DatosDeAltaDeLocal y LocalCreado del backend.
export interface DatosDeAltaDeLocal {
  nombreLocal: string
  direccion: string | null
  nombreGerente: string
  email: string
  password: string
}

export interface LocalCreado {
  localId: number
  nombreLocal: string
  tokenStaff: string
  gerenteId: number
  email: string
}

export interface DesbloqueoDeGerente {
  resultado: 'DESBLOQUEADO' | 'NO_ESTABA_BLOQUEADO'
}
