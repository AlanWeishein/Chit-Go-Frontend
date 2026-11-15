import { api } from './http';
import { EstadoPantallaPublica } from '../tipos/pantallaPublica';

export const obtenerEstadoPedidosPublico = async (
  identificadorLocal: string
): Promise<EstadoPantallaPublica> => {
  return api<EstadoPantallaPublica>(`/public/locales/${identificadorLocal}/pantalla`);
};