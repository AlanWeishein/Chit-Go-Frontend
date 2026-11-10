import { useEffect, useState } from 'react'

// El Date.now() de la tablet, que avanza solo cada segundo. Lo usa la pantalla entera (la hora de la barra y los
// tiempos de las tarjetas) para que todo cambie junto y haya un solo intervalo, no uno por tarjeta.
export function useAhora(): number {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return ahora
}

// mm:ss desde `iso` hasta `ahora`. El contrato de cocina manda solo las horas (no los segundos que pasaron, como la
// cola de Caja), así que se mide con el reloj de la tablet: si está corrido, el tiempo sale corrido en lo mismo.
// Pasada la hora sigue contando en minutos ("75:10").
export function transcurrido(iso: string, ahora: number): string {
  const segundos = Math.max(0, Math.floor((ahora - Date.parse(iso)) / 1000))
  const mm = String(Math.floor(segundos / 60)).padStart(2, '0')
  const ss = String(segundos % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// HH:MM en la hora de la tablet.
export function hora(momento: string | number): string {
  return new Date(momento).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}
