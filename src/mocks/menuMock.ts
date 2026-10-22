import { RespuestaMesaMenu } from '../compartido/tipos/menu';
import { RespuestaStaffPublico } from '../compartido/tipos/auth';

export const mockRespuestaMenu: RespuestaMesaMenu = {
  mesaNumero: 4,
  esIniciador: true,
  categorias: [
    { id: 1, nombre: 'Entradas', orden: 1 },
    { id: 2, nombre: 'Platos Principales', orden: 2 },
    { id: 3, nombre: 'Bebidas', orden: 3 },
  ],
  etiquetasDisponibles: [
    { id: 1, nombre: 'Sin TACC' },
    { id: 2, nombre: 'Vegano' },
    { id: 3, nombre: 'Vegetariano' },
  ],
  platos: [
    {
      id: 101,
      nombre: 'Empanadas de Carne Salteñas',
      descripcion: 'Carne cortada a cuchillo, cebolla de verdeo y huevo.',
      precio: 2500,
      destacado: true,
      activo: true,
      categoriaId: 1,
      etiquetas: [],
    },
    {
      id: 102,
      nombre: 'Provolone a la Chapa (Sin TACC)',
      descripcion: 'Queso provolone fundido con orégano fresco y aceite de oliva.',
      precio: 4800,
      destacado: false,
      activo: true,
      categoriaId: 1,
      etiquetas: [{ id: 1, nombre: 'Sin TACC' }],
    },
  ],
};

export const mockStaffPublico: RespuestaStaffPublico = {
  nombreLocal: 'Chit&Go Baradero',
  usuarios: [
    { id: 1, nombre: 'Alan' },
    { id: 2, nombre: 'Ezequiel' },
    { id: 3, nombre: 'German' },
    { id: 4, nombre: 'Victoria' },
  ],
};