import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, type ProblemDetail } from '../../compartido/api/http'
import { useSesion } from '../../compartido/sesion/SesionContext'

export default function useFalloPlataforma() {
  const [fallo, setFallo] = useState<string | null>(null)
  const { sesion, invalidarSesion, guardarSesion } = useSesion()
  const navigate = useNavigate()

  function mostrarFallo(err: unknown) {
    if (err instanceof ApiError) {
      const problema = err.detalle as ProblemDetail | undefined
      if (err.status === 401) {
        invalidarSesion()
        navigate('/admin/login', { replace: true, state: { sesionVencida: true } })
        return
      }
      if (err.status === 403 && problema?.codigo === 'CREDENCIAL_PROVISORIA') {
        if (sesion) guardarSesion({ ...sesion, debeCambiarCredencial: true })
        navigate('/admin/cambiar-contrasena', { replace: true })
        return
      }
      if (err.status === 403) {
        setFallo('No pudimos autorizar la operación. Volvé a iniciar sesión para renovar el acceso. Si continúa, revisá los permisos con la persona que administra la plataforma.')
        return
      }
      if ([400, 404, 409].includes(err.status)) {
        setFallo(typeof problema?.detail === 'string' && problema.detail.trim()
          ? problema.detail : 'No pudimos completar la operación. Revisá los datos e intentá de nuevo.')
        return
      }
    }
    // Las escrituras no se reintentan automáticamente: una respuesta perdida puede haber confirmado el alta.
    setFallo('No pudimos confirmar el resultado. Revisá la conexión. Antes de repetir la operación, verificá con la persona que administra la plataforma si se completó.')
  }

  return { fallo, limpiarFallo: () => setFallo(null), mostrarFallo }
}
