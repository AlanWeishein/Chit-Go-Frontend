import type { ReactNode } from 'react'
import taza150 from '../../../compartido/ui/iconos/ilustracion-hola-150.svg'
import taza170 from '../../../compartido/ui/iconos/ilustracion-hola-170.svg'

interface Props {
  variante: 'admin' | 'caja'
  titulo: string
  bajada: string
  pie?: string
  children: ReactNode
}

// El marco de P-12, P-29, P-22 y P-31: a la izquierda, sobre `linea`, la bienvenida; a la derecha, el contenido.
// Desde 1024 de ancho van los dos paneles. Debajo, el panel de la izquierda se oculta y arriba queda la marca.
// El Admin usa la taza de 170 y el título de 42 (P-12, 1280); Caja, la de 150 y el de 30 (P-22, 1024).
// El título de cada pantalla (h1) lo pone el contenido de la derecha, que es lo que se ve en todos los anchos.
export default function MarcoDosPaneles({ variante, titulo, bajada, pie, children }: Props) {
  const caja = variante === 'caja'
  const marca = (
    <div className="flex items-center gap-2.5">
      <span className="titulo text-[25px] leading-none">Chit&Go</span>
      {caja && <span className="rounded-md bg-linea px-[9px] py-1 text-xs font-medium">Caja</span>}
    </div>
  )

  return (
    <main className="flex min-h-screen bg-fondo font-inter text-texto">
      <aside className="hidden flex-col gap-[18px] bg-linea p-12 lg:flex lg:w-[44%] xl:p-14">
        {marca}
        <div className="flex-1" />
        <img
          src={caja ? taza150 : taza170}
          alt=""
          width={caja ? 150 : 170}
          height={caja ? 150 : 170}
          className="shrink-0"
        />
        <p className={`titulo leading-[1.25] ${caja ? 'max-w-[340px] text-[30px]' : 'max-w-[440px] text-[42px]'}`}>
          {titulo}
        </p>
        <p className={`leading-[1.3] ${caja ? 'max-w-[340px] text-[15px]' : 'max-w-[420px] text-[17px]'}`}>{bajada}</p>
        <div className="flex-1" />
        <p className="text-[13px]">{pie ?? ' '}</p>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="mb-8 lg:hidden">{marca}</div>
        <div className={`w-full ${caja ? 'max-w-[380px]' : 'max-w-[400px]'}`}>{children}</div>
      </section>
    </main>
  )
}

// El título de la columna de la derecha, con su bajada opcional (P-12: "Iniciar sesión" y "Acceso para…").
export function EncabezadoDelFormulario({ titulo, bajada }: { titulo: string; bajada?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="titulo text-[25px] leading-tight">{titulo}</h1>
      {bajada && <p className="text-[13px] text-secundario">{bajada}</p>}
    </div>
  )
}
