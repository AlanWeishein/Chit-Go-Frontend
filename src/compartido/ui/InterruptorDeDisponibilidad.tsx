import type { Ref } from 'react'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// El switch de disponible de P-10, P-10c y P-14: riel de 46 × 28, perilla de 22 y 44 px de alto en total. El texto
// de al lado cambia según la pantalla ("Disponible" o "No disponible" en P-10, "Sí" o "No" en P-14).
export default function InterruptorDeDisponibilidad({
  nombre,
  activo,
  textoActivo,
  textoInactivo,
  deshabilitado,
  alTocar,
  ref,
}: {
  nombre: string // el plato, para el lector de pantalla
  activo: boolean
  textoActivo: string
  textoInactivo: string
  deshabilitado: boolean
  alTocar: () => void
  ref?: Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={`${nombre}: ${activo ? 'disponible' : 'no disponible'}`}
      disabled={deshabilitado}
      onClick={alTocar}
      className={`flex h-11 items-center gap-2 rounded-[14px] disabled:opacity-50 ${foco}`}
    >
      <span
        aria-hidden="true"
        className={`relative block h-7 w-[46px] shrink-0 rounded-full border-[1.25px] ${
          activo ? 'border-primario bg-primario' : 'border-secundario bg-tarjeta'
        }`}
      >
        <span
          className={`absolute top-[1.75px] size-[22px] rounded-full ${
            activo ? 'left-[19.75px] bg-tarjeta' : 'left-[3px] bg-secundario'
          }`}
        />
      </span>
      <span className={`font-medium whitespace-nowrap ${activo ? 'text-texto' : 'text-secundario'}`}>
        {activo ? textoActivo : textoInactivo}
      </span>
    </button>
  )
}
