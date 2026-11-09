import { api } from './http';
import { CuentaPorCobrar, TicketResponse } from '../tipos/caja';

/**
 * Obtiene las cuentas por cobrar para Caja (P-09).
 * GET /caja/cuentas?estado=ABIERTA,SOLICITADA
 */
export const obtenerCuentasPorCobrar = async (): Promise<CuentaPorCobrar[]> => {
  return api<CuentaPorCobrar[]>('/caja/cuentas?estado=ABIERTA,SOLICITADA', {
    method: 'GET',
  });
};

/**
 * Cierra la cuenta y genera el ticket de cobro (RF-17 / HU-10).
 * POST /caja/cuentas/{id}/cerrar
 */
export const cerrarCuentaCaja = async (
  cuentaId: number,
  datosConfirmacion?: { confirmar: boolean; pedidosACancelar?: number[] }
): Promise<TicketResponse> => {
  return api<TicketResponse>(`/caja/cuentas/${cuentaId}/cerrar`, {
    method: 'POST',
    body: JSON.stringify(datosConfirmacion || {}),
  });
};

/**
 * Reimprime el ticket de una cuenta ya cerrada (RF-18).
 * GET /caja/cuentas/{id}/ticket
 */
export const reimprimirTicket = async (cuentaId: number): Promise<TicketResponse> => {
  return api<TicketResponse>(`/caja/cuentas/${cuentaId}/ticket`, {
    method: 'GET',
  });
};