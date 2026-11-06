import type { ReactNode } from 'react'
import iconoInfo from '../../../compartido/ui/iconos/info.svg'

// "Nota informativa" del DESIGN.md (P-12, P-29): fondo `linea`, radio 14, padding 14, ícono "i" y texto de 13.
export default function NotaInformativa({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] bg-linea p-3.5">
      <img src={iconoInfo} alt="" width={20} height={20} className="shrink-0" />
      <p className="min-w-0 flex-1 text-[13px]">{children}</p>
    </div>
  )
}
