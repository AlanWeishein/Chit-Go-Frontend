// El marco de todas las pantallas del Admin (escritorio, 1280 × 800): el menú lateral del Mockup (P-14, P-10c) y,
// a la derecha, la pantalla de cada ruta. El padding de la derecha lo pone cada pantalla.
import { useRef, useState, type MouseEvent } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { nombreDelRol } from '../../../compartido/sesion/rutas'
import iconoSalir from '../../../compartido/ui/iconos/logout.svg'
import { ContextoGuardia, type Guardia } from '../guardiaDeSalida'
import { seccionesAdmin } from '../secciones'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// Como en MarcoCaja: el ícono va en `texto` si la sección está abierta y en `secundario` si no. El SVG trae un solo
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

export default function MarcoAdmin() {
  const { sesion, cerrar } = useSesion()
  const navigate = useNavigate()
  const [saliendo, setSaliendo] = useState(false)
  // La pantalla abierta puede frenar la salida si tiene algo sin guardar (ver guardiaDeSalida.ts).
  const guardia = useRef<Guardia | null>(null)

  if (!sesion) return null

  // Al cerrar, la sesión queda en null y RutaProtegida manda sola a /admin/login.
  async function salir() {
    setSaliendo(true)
    await cerrar().catch(() => undefined)
  }

  // Un clic común en un ítem pasa por la guardia. Con Ctrl, Cmd, Mayús o el botón del medio se abre en otra
  // pestaña y esta pantalla no se pierde, así que no se frena.
  function irA(e: MouseEvent<HTMLAnchorElement>, destino: string) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (guardia.current?.(() => navigate(destino))) e.preventDefault()
  }

  return (
    // Al imprimir (los QR de P-38) sale solo lo que la pantalla deja: el menú se esconde y el main no recorta.
    <div className="flex h-dvh overflow-hidden bg-fondo font-inter text-texto print:block print:h-auto print:overflow-visible print:bg-transparent">
      <aside className="flex w-58 shrink-0 flex-col gap-1.5 overflow-y-auto bg-linea px-3.5 pt-[22px] pb-[18px] print:hidden">
        <div className="flex items-center gap-2 px-1">
          <p className="titulo text-xl leading-[normal]">Chit&Go</p>
          <p className="rounded-md px-[9px] py-1 text-xs leading-[normal] font-medium">Admin</p>
        </div>
        {sesion.local && <p className="truncate pl-3 text-[13px] leading-[normal]">{sesion.local.nombre}</p>}

        <nav aria-label="Secciones del Admin" className="mt-[18px] flex flex-col gap-1.5">
          {seccionesAdmin.filter((s) => s.roles.includes(sesion.rol)).map((s) => (
            <NavLink
              key={s.a}
              to={s.a}
              onClick={(e) => irA(e, s.a)}
              className={({ isActive }) =>
                // El borde del ítem abierto corre el contenido 1.5 px, como en el Mockup; los otros lo compensan
                // con el padding.
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

        <p className="truncate text-[13px] leading-[normal] font-medium">{sesion.nombre}</p>
        <p className="text-[13px] leading-[normal]">{nombreDelRol(sesion.rol)}</p>
        <button
          type="button"
          onClick={() => {
            if (!guardia.current?.(salir)) void salir()
          }}
          disabled={saliendo}
          className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-50 ${foco}`}
        >
          <img src={iconoSalir} alt="" />
          {saliendo ? 'Cerrando la sesión…' : 'Cerrar sesión'}
        </button>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto print:overflow-visible">
        <ContextoGuardia.Provider value={guardia}>
          <Outlet />
        </ContextoGuardia.Provider>
      </main>
    </div>
  )
}
