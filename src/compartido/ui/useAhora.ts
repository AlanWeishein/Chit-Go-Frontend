import { useEffect, useState } from 'react'

// Reloj para los contadores de tiempo (solo local: no hace ningún request al servidor).
export function useAhora(intervaloMs = 1000) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), intervaloMs)
    return () => clearInterval(t)
  }, [intervaloMs])
  return ahora
}
