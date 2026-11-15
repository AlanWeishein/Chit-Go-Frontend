import { api } from './http';
import { MesaAdmin, GuardarMesaPayload } from '../tipos/mesas';

// Listar todas las mesas del local del Admin
export const obtenerMesasAdmin = async (): Promise<MesaAdmin[]> => {
  return api<MesaAdmin[]>('/admin/mesas');
};

// Alta de mesa (genera token QR inicial)
export const crearMesaAdmin = async (payload: GuardarMesaPayload): Promise<MesaAdmin> => {
  return api<MesaAdmin>('/admin/mesas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Edición de mesa
export const actualizarMesaAdmin = async (
  id: number,
  payload: GuardarMesaPayload
): Promise<MesaAdmin> => {
  return api<MesaAdmin>(`/admin/mesas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// Habilitar / Inhabilitar mesa (impacta en P-06 y bloquea escaneo QR)
export const cambiarHabilitacionMesa = async (
  id: number,
  habilitada: boolean
): Promise<MesaAdmin> => {
  return api<MesaAdmin>(`/admin/mesas/${id}/habilitacion`, {
    method: 'PATCH',
    body: JSON.stringify({ habilitada }),
  });
};

// Regenerar token QR (invalida el anterior)
export const regenerarQrMesa = async (id: number): Promise<MesaAdmin> => {
  return api<MesaAdmin>(`/admin/mesas/${id}/regenerar-qr`, {
    method: 'POST',
  });
};