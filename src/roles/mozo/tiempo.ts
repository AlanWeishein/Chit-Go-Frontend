import { useEffect, useState } from 'react'

// Devuelve la hora actual y se actualiza sola, para que los "hace 3 min" avancen sin recargar.
export function useAhora(cadaMs = 15000): number {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cadaMs)
    return () => clearInterval(id)
  }, [cadaMs])
  return ahora
}

export function haceCuanto(iso: string, ahora: number): string {
  const segundos = Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 1000))
  if (segundos < 60) return `hace ${segundos} s`
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return `hace ${Math.floor(horas / 24)} d`
}

export function horaDe(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}
