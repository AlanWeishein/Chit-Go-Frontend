export type EstadoPedidoPublico = 'EN_PREPARACION' | 'LISTO';

export interface PedidoPublico {
  id: number;
  mesa: string;
  estado: EstadoPedidoPublico;
  actualizadoEn?: string;
}

export interface EstadoPantallaPublica {
  nombreLocal?: string;
  enPreparacion: PedidoPublico[];
  listos: PedidoPublico[];
}