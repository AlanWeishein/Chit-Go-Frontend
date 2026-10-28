import type { ReactNode } from 'react'
import iconoAlerta from '../../../compartido/ui/iconos/alert.svg'
import iconoCandado from '../../../compartido/ui/iconos/lock.svg'

// "Aviso de error" del DESIGN.md (P-04c y P-04d): borde primario sobre tarjeta, con ícono y sin rojo.
// Con `titulo` va en dos líneas, como el aviso de usuario bloqueado: el título y debajo el resto.
export default function AvisoDeFallo({
  children,
  titulo,
  icono = 'alerta',
  className = '',
}: {
  children: ReactNode
  titulo?: string
  icono?: 'alerta' | 'candado'
  className?: string
}) {
  return (
    <div
      role="alert"
      className={`flex w-full gap-3 rounded-[14px] border-[1.5px] border-primario bg-tarjeta text-texto ${
        titulo ? 'items-start p-3.5' : 'items-center p-3'
      } ${className}`}
    >
      <img src={icono === 'candado' ? iconoCandado : iconoAlerta} alt="" width={20} height={20} className="shrink-0" />
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
