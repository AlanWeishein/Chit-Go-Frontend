import { useCallback, useRef, useState } from 'react'
import { NavLink, Outlet, useOutletContext } from 'react-router-dom'
import { textoDelError } from '../../../compartido/api/errores'
import { listarAvisos, listarMesas, type Aviso, type MesaDelMozo } from '../../../compartido/api/mozo'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { useEnVivo } from '../../../compartido/ws/useEnVivo'
import { IconoCampana, IconoMesas, IconoPersona } from './Iconos'

export interface DatosMozo {
  misMesas: MesaDelMozo[]
  avisosPendientes: Aviso[]
  cargando: boolean
  error: string | null
  recargar: () => void
  version: number
}

// Para que las páginas del mozo lean los datos del marco.
// eslint-disable-next-line react-refresh/only-export-components
export function useDatosMozo(): DatosMozo {
  return useOutletContext<DatosMozo>()
}

export default function MarcoMozo() {
  const { sesion } = useSesion()
  const [misMesas, setMisMesas] = useState<MesaDelMozo[]>([])
  const [avisosPendientes, setAvisosPendientes] = useState<Aviso[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const ultimoPedido = useRef(0)

  // Si salen dos pedidos seguidos, vale solo el último.
  const recargar = useCallback(() => {
    const numero = ++ultimoPedido.current
    Promise.all([listarMesas(false), listarAvisos(true)])
      .then(([mesas, avisos]) => {
        if (numero !== ultimoPedido.current) return
        setMisMesas(mesas)
        setAvisosPendientes(avisos)
        setError(null)
      })
      .catch((err) => {
        if (numero !== ultimoPedido.current) return
        setError(textoDelError(err))
      })
      .finally(() => {
        if (numero === ultimoPedido.current) setCargando(false)
      })
  }, [])

  const recargarYSubirVersion = useCallback(() => {
    setVersion((v) => v + 1)
    recargar()
  }, [recargar])

  useEnVivo(sesion?.local?.id, ['mozo/avisos'], recargarYSubirVersion)

  const datos: DatosMozo = { misMesas, avisosPendientes, cargando, error, recargar, version }

  const pestanas = [
    { a: '/mozo/mesas', texto: 'Mesas', icono: <IconoMesas />, contador: 0 },
    { a: '/mozo/avisos', texto: 'Avisos', icono: <IconoCampana />, contador: avisosPendientes.length },
    { a: '/mozo/turno', texto: 'Mi turno', icono: <IconoPersona />, contador: 0 },
  ]

  return (
    <div className="min-h-dvh bg-fondo text-texto">
      <main className="mx-auto max-w-md px-4 pt-6 pb-24">
        <Outlet context={datos} />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-linea bg-tarjeta">
        <div className="mx-auto flex h-[60px] max-w-md">
          {pestanas.map((p) => (
            <NavLink
              key={p.a}
              to={p.a}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive ? 'font-semibold text-primario' : 'text-secundario'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    {p.icono}
                    {p.contador > 0 && (
                      <span className="absolute -top-1.5 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-primario px-1 text-[10px] font-semibold text-texto-boton">
                        {p.contador}
                      </span>
                    )}
                  </span>
                  {p.texto}
                  {isActive && <span className="absolute bottom-1 h-0.5 w-6 rounded bg-primario" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
