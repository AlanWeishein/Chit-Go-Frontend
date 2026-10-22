import { Plato } from './menu';

export interface ItemCarrito {
  producto: Plato;
  cantidad: number;
  aclaracion?: string;
}

export interface SolicitudPedido {
  uuidMesa: string;
  uuidCliente: string; // Clave de idempotencia
  items: {
    idProducto: number;
    cantidad: number;
    aclaracion?: string;
  }[];
}

export interface RespuestaPedido {
  idPedido: number;
  estado: string;
  uuidCliente: string;
  fechaCreacion: string;
}