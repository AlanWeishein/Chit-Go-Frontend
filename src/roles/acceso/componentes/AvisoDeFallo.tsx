import type { ReactNode } from 'react'

// "Aviso de error" del DESIGN.md (P-04c): borde primario sobre tarjeta, sin rojo.
export default function AvisoDeFallo({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={`rounded-[14px] border-[1.5px] border-primario bg-tarjeta px-3 py-2 text-sm font-semibold text-texto ${className}`}
    >
      {children}
    </div>
  )
}
