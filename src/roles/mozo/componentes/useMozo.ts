import { useEffect, useState, useCallback, useRef } from 'react'
import { listarMesasAsignadas, listarAvisosPendientes, escucharMozo, type MesaMozo, type AvisoMozo } from '../../../compartido/api/mozo'
import { useSesion } from '../../../compartido/sesion/SesionContext'

export function useMozo() {
  const { sesion } = useSesion()
  const localId = sesion?.local?.id
  const [mesas, setMesas] = useState<MesaMozo[]>([])
  const [avisos, setAvisos] = useState<AvisoMozo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const solicitud = useRef(0)

  const cargarDatos = useCallback(async () => {
    const mia = ++solicitud.current
    try {
      const [m, a] = await Promise.all([listarMesasAsignadas(), listarAvisosPendientes()])
      if (mia !== solicitud.current) return
      setMesas(m)
      setAvisos(a)
      setError(false)
    } catch {
      if (mia === solicitud.current) setError(true)
    } finally {
      if (mia === solicitud.current) setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (!localId) return
    cargarDatos()
    const cancelar = escucharMozo(localId, () => cargarDatos(), () => cargarDatos())
    return () => cancelar()
  }, [localId, cargarDatos])

  return { mesas, avisos, cargando, error, recargar: cargarDatos }
}
