import { useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { rutaDeEntrada } from '../../../compartido/sesion/rutas'
import iconoLocal from '../../../compartido/ui/iconos/plate-24.svg'
import iconoUsuario from '../../../compartido/ui/iconos/user.svg'
import { botonSecundario, enlace, foco } from '../../acceso/componentes/MarcoAcceso'
import CrearLocal from './CrearLocal'
import DesbloquearGerente from './DesbloquearGerente'

const secciones = [
  { ruta: '/plataforma/locales/nuevo', titulo: 'Crear local', icono: iconoLocal },
  { ruta: '/plataforma/gerentes/desbloquear', titulo: 'Desbloquear gerente', icono: iconoUsuario },
]

export default function PanelPlataforma() {
  const { sesion, cerrar } = useSesion()
  const { pathname } = useLocation()
  const [saliendo, setSaliendo] = useState(false)
  if (!sesion) return null
  if (sesion.debeCambiarCredencial) return <Navigate to={rutaDeEntrada(sesion, null)} replace />
  const esDesbloqueo = pathname === '/plataforma/gerentes/desbloquear'

  async function salir() {
    setSaliendo(true)
    await cerrar().catch(() => undefined)
  }

  return (
    <div className="min-h-screen bg-fondo font-inter text-texto md:flex">
      <a href="#contenido-plataforma" className={`sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-4 focus:z-10 focus:rounded-xl focus:bg-tarjeta focus:p-3 ${foco}`}>Ir al contenido</a>
      <aside aria-label="Panel de plataforma" className="flex flex-col bg-linea px-6 py-6 md:sticky md:top-0 md:h-dvh md:w-52 md:shrink-0 md:px-4">
        <div className="mb-6 md:px-2"><p className="titulo text-[25px]">Chit&Go</p><p className="mt-1 text-[13px] text-secundario">SuperAdmin</p></div>
        <nav aria-label="SuperAdmin" className="flex flex-col gap-2">
          {secciones.map(({ ruta, titulo, icono }) => (
            <NavLink key={ruta} to={ruta} className={({ isActive }) => `flex min-h-11 items-center gap-2 rounded-[10px] border-[1.5px] px-3 py-2 text-[13px] ${foco} ${isActive ? 'border-primario bg-tarjeta font-medium' : 'border-transparent hover:bg-suave'}`}>
              <img src={icono} alt="" width={18} height={18} className="shrink-0" />{titulo}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 border-t border-secundario pt-4 md:mt-auto">
          <p className="break-words text-[13px] font-medium">{sesion.nombre}</p>
          <p className="mt-1 text-xs text-secundario">SuperAdmin · Plataforma</p>
          <button type="button" onClick={salir} disabled={saliendo} className={`mt-3 ${enlace}`}>{saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
        </div>
      </aside>
      <main id="contenido-plataforma" tabIndex={-1} className="min-w-0 flex-1 px-6 py-7 outline-none lg:p-8">
        <div className="mx-auto max-w-4xl">
          <header className="mb-6 border-b border-linea pb-5">
            <p className="mb-2 text-[13px] text-secundario">Administración de plataforma</p>
            <h1 className="titulo text-[30px] leading-tight md:text-[25px]">{esDesbloqueo ? 'Desbloquear Gerente/Dueño' : 'Crear local'}</h1>
            <p className="mt-3 max-w-2xl text-[15px] text-secundario">{esDesbloqueo ? 'Ayudá a un Gerente/Dueño a recuperar el acceso después de un bloqueo por intentos fallidos.' : 'Dá de alta un local y la cuenta de su Gerente/Dueño.'}</p>
          </header>
          <Routes>
            <Route path="locales/nuevo" element={<CrearLocal />} />
            <Route path="gerentes/desbloquear" element={<DesbloquearGerente />} />
            <Route index element={<Navigate to="/plataforma/locales/nuevo" replace />} />
            <Route path="*" element={<div className="space-y-5"><p>Esta sección de plataforma no existe.</p><NavLink to="/plataforma/locales/nuevo" className={botonSecundario}>Volver a crear local</NavLink></div>} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
