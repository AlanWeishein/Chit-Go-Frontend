import { api } from './http';
import { SolicitudPedido, RespuestaPedido } from '../tipos/carrito';

export const enviarPedido = async (datosPedido: SolicitudPedido): Promise<RespuestaPedido> => {
  return await api<RespuestaPedido>('/pedidos', {
    method: 'POST',
    body: JSON.stringify(datosPedido),
  });
};