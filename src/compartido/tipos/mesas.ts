export type EstadoOperativoMesa = 'LIBRE' | 'ABIERTA' | 'SOLICITADA';

export interface MesaAdmin {
  id: number;
  numero: string; // En el backend de Chit&Go el identificador visible de mesa es string ("1", "2", etc.)
  capacidad?: number;
  habilitada: boolean;
  estadoCuenta?: EstadoOperativoMesa; // Derivado si tiene cuenta activa
  tokenQr: string;
}

export interface GuardarMesaPayload {
  numero: string;
  capacidad?: number;
}