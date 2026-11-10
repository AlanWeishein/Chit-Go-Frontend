import { useOutletContext } from 'react-router-dom'
import type { ColaDeAprobacion } from './useColaDeAprobacion'

// Lo que MarcoCaja les pasa a sus pantallas por el contexto del Outlet.
export interface DatosCaja {
  cola: ColaDeAprobacion
}

export function useDatosCaja(): DatosCaja {
  return useOutletContext<DatosCaja>()
}
