import { createContext, useContext, useEffect, type RefObject } from 'react'

// Una pantalla del Admin con algo sin guardar (hoy, el orden de las categorías de P-14c) se lo avisa al marco.
// Antes de navegar desde el menú lateral o de cerrar la sesión, el marco le pregunta a la guardia: si devuelve
// true, la pantalla frenó la salida y dibuja su aviso; si hace falta seguir, llama a `continuar`.
// La app usa BrowserRouter, y useBlocker pide un router de datos: el botón Atrás del navegador no pasa por acá.
export type Guardia = (continuar: () => void) => boolean

export const ContextoGuardia = createContext<RefObject<Guardia | null> | null>(null)

// La guardia vale mientras la pantalla está montada. Con null, no hay nada que frenar.
export function useGuardiaDeSalida(guardia: Guardia | null) {
  const ref = useContext(ContextoGuardia)
  useEffect(() => {
    if (!ref) return
    ref.current = guardia
    return () => {
      ref.current = null
    }
  }, [ref, guardia])
}
