// Forma de GET /public/mesas/{tokenQR}/menu: los destacados arriba y después las categorías en su orden.
// Los platos no disponibles no vienen.
export interface Plato {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
  destacado: boolean;
  etiquetas: string[];
}

export interface CategoriaMenu {
  id: number;
  nombre: string;
  orden: number;
  platos: Plato[];
}

export interface Carta {
  destacados: Plato[];
  categorias: CategoriaMenu[];
}
