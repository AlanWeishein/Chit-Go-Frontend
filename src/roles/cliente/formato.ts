// "$ 9.800": signo, espacio, punto de miles y sin centavos (DESIGN.md, Voz y textos).
export function precio(monto: number): string {
  return `$ ${Math.round(monto).toLocaleString('es-AR')}`
}

export function cantidadDePlatos(n: number): string {
  return n === 1 ? '1 plato' : `${n} platos`
}
