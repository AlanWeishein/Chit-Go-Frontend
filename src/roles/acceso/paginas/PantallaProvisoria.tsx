// Pantalla provisoria de cada rol después de entrar, hasta que exista la suya: quién entró y "Cerrar sesión".
// Va dentro de RutaProtegida: al cerrar, la sesión queda en null y RutaProtegida manda al login que
// corresponde (la lista de nombres con el tokenStaff de esta pestaña, o P-12 para el Admin).
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { leerTokenStaff } from '../../../compartido/sesion/tokenStaff'
import { nombreDelRol, rutaDeEntrada, rutaInicial } from '../../../compartido/sesion/rutas'
import MarcoAcceso, { botonSecundario } from '../componentes/MarcoAcceso'

export default function PantallaProvisoria() {
  const { sesion, cerrar } = useSesion()
  const [saliendo, setSaliendo] = useState(false)

  if (!sesion) return null

  // Con la credencial provisoria, primero tiene que elegir la suya.
  const destino = rutaDeEntrada(sesion, leerTokenStaff())
  if (destino !== rutaInicial(sesion.rol)) return <Navigate to={destino} replace />

  async function salir() {
    setSaliendo(true)
    await cerrar().catch(() => undefined)
  }

  return (
    <MarcoAcceso bajada={sesion.local?.nombre ?? 'Ingreso para Admin y Dueño'}>
      <p className="text-xl font-semibold">{sesion.nombre}</p>
      <p className="mt-1 text-sm text-secundario">{nombreDelRol(sesion.rol)}</p>
      <p className="mt-4 text-sm text-secundario">Esta pantalla todavía está en construcción.</p>
      <button type="button" onClick={salir} disabled={saliendo} className={`mt-5 ${botonSecundario}`}>
        {saliendo ? 'Cerrando la sesión…' : 'Cerrar sesión'}
      </button>
    </MarcoAcceso>
  )
}
