export interface Etiqueta {
  id: number;
  nombre: string;
}

export interface Plato {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  destacado: boolean;
  activo: boolean;
  categoriaId: number;
  etiquetas: Etiqueta[];
}

export interface CategoriaMenu {
  id: number;
  nombre: string;
  orden: number;
}

export interface RespuestaMesaMenu {
  mesaNumero: number;
  esIniciador: boolean;
  categorias: CategoriaMenu[];
  platos: Plato[];
  etiquetasDisponibles: Etiqueta[];
}