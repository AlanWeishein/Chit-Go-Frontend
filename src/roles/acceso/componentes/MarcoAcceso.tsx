import type { ReactNode } from 'react'
import ilustracionHola from '../../../compartido/ui/iconos/ilustracion-hola.svg'

// El marco de las pantallas de acceso, sin tarjeta como el Mockup (P-04): la taza, la marca, la bajada y el
// contenido sobre `fondo`. La taza se saca cuando hay un aviso arriba del teclado (P-04c, P-30b), para que entre todo.
export default function MarcoAcceso({
  bajada,
  ilustracion = true,
  children,
}: {
  bajada: string
  ilustracion?: boolean
  children: ReactNode
}) {
  return (
    <main className="flex min-h-screen justify-center bg-fondo px-6 pb-8 pt-10 font-inter text-texto">
      <div className="flex w-full max-w-sm flex-col items-center gap-[18px]">
        {ilustracion && <img src={ilustracionHola} alt="" width={84} height={84} />}
        <h1 className="titulo text-[30px] text-texto">Chit&Go</h1>
        <p className="max-w-[280px] text-center text-[15px] text-secundario">{bajada}</p>
        <div className="w-full">{children}</div>
      </div>
    </main>
  )
}

// Los bloques de una pantalla de acceso van en columna, separados 18 px como en el Mockup.
export const columna = 'flex w-full flex-col items-center gap-[18px]'

// El foco con el teclado: un anillo `primario` de 2 px a 2 px del borde (11:1 contra `fondo`, 9:1 contra `linea`).
// El anillo del navegador depende del sistema y en Windows puede salir naranja, a 2.2:1 del fondo.
export const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

const boton = `flex h-14 w-full items-center justify-center gap-2 rounded-[14px] px-[18px] text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-[.38] ${foco}`
export const botonPrincipal = `${boton} bg-primario text-texto-boton`
export const botonSecundario = `${boton} border-[1.5px] border-primario text-primario`
export const enlace = `inline-flex min-h-11 items-center justify-center gap-2 px-1 text-sm font-semibold text-texto underline ${foco}`
