import type { ReactNode } from 'react'
import iconoAlerta from '../../../compartido/ui/iconos/alert.svg'
import iconoCandado from '../../../compartido/ui/iconos/lock.svg'
import iconoReloj from '../../../compartido/ui/iconos/clock-20.svg'

const ICONOS = { alerta: iconoAlerta, candado: iconoCandado, reloj: iconoReloj }

// "Aviso de error" del DESIGN.md (P-04c y P-04d): borde primario sobre tarjeta, con ícono y sin rojo.
// Con `titulo` va en dos líneas, como el aviso de usuario bloqueado: el título y debajo el resto.
// El reloj es el de P-22c, la sesión de Caja cerrada por inactividad.
export default function AvisoDeFallo({
  children,
  titulo,
  icono = 'alerta',
  className = '',
}: {
  children: ReactNode
  titulo?: string
  icono?: 'alerta' | 'candado' | 'reloj'
  className?: string
}) {
  return (
    <div
      role="alert"
      className={`flex w-full gap-3 rounded-[14px] border-[1.5px] border-primario bg-tarjeta text-texto ${
        titulo ? 'items-start p-3.5' : 'items-center p-3'
      } ${className}`}
    >
      <img src={ICONOS[icono]} alt="" width={20} height={20} className="shrink-0" />
      {titulo ? (
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-[15px] font-semibold">{titulo}</p>
          <p className="text-[13px] leading-[1.4]">{children}</p>
        </div>
      ) : (
        <p className="min-w-0 flex-1 text-[15px] font-semibold">{children}</p>
      )}
    </div>
  )
}
