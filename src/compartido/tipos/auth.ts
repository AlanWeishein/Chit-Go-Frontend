import type { Rol } from '../api/auth'

export type RolUsuario = Rol;

export interface UsuarioStaff {
  id: number;
  nombre: string;
}

export interface RespuestaStaffPublico {
  nombreLocal: string;
  usuarios: UsuarioStaff[];
}

export interface CredencialesPin {
  tokenStaff: string;
  usuarioId: number;
  pin: string;
}

export interface CredencialesAdmin {
  email: string;
  password: string;
}

export interface SesionUsuario {
  id: number;
  nombre: string;
  rol: RolUsuario;
  localId: number;
}
