import { Plato } from './menu';

export interface ItemCarrito {
  producto: Plato;
  cantidad: number;
  observacion?: string;
}
