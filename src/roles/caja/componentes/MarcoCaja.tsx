// El marco de todas las pantallas de Caja (tablet, 1024 × 768): el menú lateral de P-08 y, a la derecha, la
// pantalla de cada ruta. El padding de la derecha lo pone cada pantalla.
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import iconoDisponibilidad from '../../../compartido/ui/iconos/box.svg'
import iconoAprobacion from '../../../compartido/ui/iconos/check-18.svg'
import iconoAprobados from '../../../compartido/ui/iconos/chef-18.svg'
import iconoSalir from '../../../compartido/ui/iconos/logout.svg'
import iconoCuentas from '../../../compartido/ui/iconos/receipt.svg'
import iconoUsuarios from '../../../compartido/ui/iconos/users.svg'

const secciones = [
  { a: '/caja/pedidos', texto: 'Aprobación', icono: iconoAprobacion },
  { a: '/caja/cuentas', texto: 'Cuentas', icono: iconoCuentas },
  { a: '/caja/disponibilidad', texto: 'Disponibilidad rápida', icono: iconoDisponibilidad },
  { a: '/caja/aprobados', texto: 'Pedidos aprobados', icono: iconoAprobados },
]

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// En el Mockup el ícono va en `texto` si la sección está abierta y en `secundario` si no. El SVG trae un solo
// color, así que se usa como máscara y el color lo pone el token.
function IconoDeSeccion({ src, activo }: { src: string; activo: boolean }) {
  const mascara = `url("${src}") center / contain no-repeat`
  return (
    <span
      aria-hidden="true"
      className={`size-[18px] shrink-0 ${activo ? 'bg-texto' : 'bg-secundario'}`}
      style={{ mask: mascara, WebkitMask: mascara }}
    />
  )
}

export default function MarcoCaja() {
  const { sesion, cerrar } = useSesion()
  const [saliendo, setSaliendo] = useState(false)

  if (!sesion) return null

  // Al cerrar, la sesión queda en null y RutaProtegida manda sola a la lista de nombres de Caja.
  async function salir() {
    setSaliendo(true)
    await cerrar().catch(() => undefined)
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-fondo font-inter text-texto">
      <aside className="flex w-52 shrink-0 flex-col gap-1.5 overflow-y-auto bg-linea px-3.5 pt-[22px] pb-[18px]">
        <div className="mb-[18px] flex items-center gap-2 px-1">
          <p className="titulo text-xl leading-[normal]">Chit&Go</p>
          <p className="rounded-md px-[9px] py-1 text-xs leading-[normal] font-medium">Caja</p>
        </div>

        <nav aria-label="Secciones de Caja" className="flex flex-col gap-1.5">
          {secciones.map((s) => (
            <NavLink
              key={s.a}
              to={s.a}
              className={({ isActive }) =>
                // El borde del ítem abierto corre el contenido 1.5 px, como en el Mockup; los otros lo compensan
                // con el padding para que "Disponibilidad rápida" entre en un renglón.
                `flex h-11 items-center gap-2.5 rounded-[10px] border-[1.5px] text-[13px] whitespace-nowrap ${foco} ${
                  isActive ? 'border-primario bg-tarjeta px-3 font-medium' : 'border-transparent px-[10.5px]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <IconoDeSeccion src={s.icono} activo={isActive} />
                  {s.texto}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="min-h-4 flex-1" />

        <button
          type="button"
          onClick={salir}
          disabled={saliendo}
          className={`mb-2 -ml-1 flex h-11 items-center gap-2 self-start rounded-[14px] px-1 text-sm font-semibold underline disabled:opacity-50 ${foco}`}
        >
          <img src={iconoUsuarios} alt="" />
          Cambiar de usuario
        </button>
        <p className="truncate text-[13px] leading-[normal] font-medium">{sesion.nombre}</p>
        <p className="text-[13px] leading-[normal]">Caja</p>
        <button
          type="button"
          onClick={salir}
          disabled={saliendo}
          className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-50 ${foco}`}
        >
          <img src={iconoSalir} alt="" />
          Cerrar turno
        </button>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
