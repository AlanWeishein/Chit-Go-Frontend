// Lo que muestra un login abierto con una sesión activa: seguir a la pantalla del rol o salir desde ahí.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Sesion } from '../../../compartido/api/auth'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { nombreDelRol } from '../../../compartido/sesion/rutas'
import MarcoAcceso, { botonPrincipal, botonSecundario } from './MarcoAcceso'

export default function SesionAbierta({ sesion, destino }: { sesion: Sesion; destino: string }) {
  const navigate = useNavigate()
  const { cerrar } = useSesion()
  const [saliendo, setSaliendo] = useState(false)

  // Si el logout falla, cerrar() igual limpia la sesión del front y se vuelve al login.
  async function salir() {
    setSaliendo(true)
    await cerrar().catch(() => undefined)
  }

  return (
    <MarcoAcceso bajada={sesion.local?.nombre ?? 'Ingreso para el personal'}>
      <h2 className="text-sm font-medium">
        Ya entraste como {sesion.nombre} ({nombreDelRol(sesion.rol)}).
      </h2>
      <div className="mt-5 space-y-3">
        <button type="button" onClick={() => navigate(destino, { replace: true })} className={botonPrincipal}>
          Seguir
        </button>
        <button type="button" onClick={salir} disabled={saliendo} className={botonSecundario}>
          {saliendo ? 'Cerrando la sesión…' : 'Cerrar sesión'}
        </button>
      </div>
    </MarcoAcceso>
  )
}
