import { useEffect, useRef, type ReactNode } from 'react'
import iconoCheck from '../../../compartido/ui/iconos/check-20.svg'

export default function ResultadoOperacion({ titulo, children }: { titulo: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <section ref={ref} tabIndex={-1} aria-labelledby="resultado-titulo"
      className="rounded-[14px] border border-linea bg-tarjeta p-5 focus:outline-none">
      <div role="status" className="mb-5 flex items-center gap-2">
        <img src={iconoCheck} alt="" width={20} height={20} />
        <h2 id="resultado-titulo" className="titulo text-xl">{titulo}</h2>
      </div>
      {children}
    </section>
  )
}
