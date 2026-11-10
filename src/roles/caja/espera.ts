import { useEffect, useState } from 'react'

// Los segundos que pasaron desde `momento` (un Date.now() anterior). Avanza solo cada `cadaMs`.
// El reloj del navegador se usa nada más que para medir entre dos lecturas propias: la espera de un pedido es
// el segundosDeEspera que calculó el back más esto, nunca la hora de la tablet contra enviadoEn.
export function useSegundosDesde(momento: number, cadaMs = 15000): number {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cadaMs)
    return () => clearInterval(id)
  }, [cadaMs])
  // Recién llegada una respuesta, `ahora` puede haber quedado atrás de `momento`: ahí pasaron 0 segundos.
  return Math.max(0, Math.floor((ahora - momento) / 1000))
}

export function minutosDe(segundos: number): number {
  return Math.floor(segundos / 60)
}

export function horaDe(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}
