export interface CuentaPorCobrar {
  id: number;
  mesa: number;
  estado: 'ABIERTA' | 'SOLICITADA';
  abiertaEn: string;
  solicitadaEn?: string;
  total: number;
  pedidosSinServir: number;
}

export interface ItemTicket {
  plato: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface TicketResponse {
  numero: number;
  local: string;
  mesa: number;
  emitidoEn: string;
  items: ItemTicket[];
  total: number;
  letra: string; // "X"
  leyenda: string; // "DOCUMENTO NO VÁLIDO COMO FACTURA"
}

export interface PedidoSinServirDetalle {
  id: number;
  estado: string;
  platos: Array<{ plato: string; cantidad: number }>;
}

export interface ErrorConfirmarCierre {
  status: 409;
  codigo: 'CONFIRMAR_CIERRE';
  detail: string;
  motivos: Array<'NADIE_PIDIO_LA_CUENTA' | 'PEDIDOS_SIN_SERVIR'>;
  pedidosSinServir?: PedidoSinServirDetalle[];
}