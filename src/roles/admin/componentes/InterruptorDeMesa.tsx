const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// El interruptor Habilitada / Inhabilitada de la tarjeta de P-15: el mismo riel de 46 × 28 que
// InterruptorDeDisponibilidad (compartido/ui), pero con el texto y el nombre accesible de una mesa.
export default function InterruptorDeMesa({
  numero,
  habilitada,
  deshabilitado,
  alTocar,
}: {
  numero: string
  habilitada: boolean
  deshabilitado: boolean
  alTocar: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={habilitada}
      aria-label={`Mesa ${numero} habilitada`}
      disabled={deshabilitado}
      onClick={alTocar}
      className={`flex h-11 items-center gap-2 rounded-[14px] disabled:opacity-50 ${foco}`}
    >
      <span
        aria-hidden="true"
        className={`relative block h-7 w-[46px] shrink-0 rounded-full border-[1.25px] ${
          habilitada ? 'border-primario bg-primario' : 'border-secundario bg-tarjeta'
        }`}
      >
        <span
          className={`absolute top-[1.75px] size-[22px] rounded-full ${
            habilitada ? 'left-[19.75px] bg-tarjeta' : 'left-[3px] bg-secundario'
          }`}
        />
      </span>
      <span className="text-[13px] font-medium whitespace-nowrap">{habilitada ? 'Habilitada' : 'Inhabilitada'}</span>
    </button>
  )
}
