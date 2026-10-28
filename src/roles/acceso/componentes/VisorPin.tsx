export const PIN_MIN = 4
export const PIN_MAX = 10

// Los círculos del PIN y "N de 4 a 10 dígitos", arriba de TecladoPin. Siempre se ven al menos 4: los
// tipeados llenos y el resto vacíos, con borde secundario (el glifo en `linea` daba 1.21:1 contra el fondo).
export default function VisorPin({ pin }: { pin: string }) {
  const circulos = Math.max(PIN_MIN, pin.length)
  return (
    <>
      <div
        aria-live="polite"
        aria-label={`PIN de ${pin.length} dígitos`}
        className="flex h-16 items-center justify-center gap-3 rounded-xl border border-linea bg-fondo"
      >
        {Array.from({ length: circulos }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`size-3.5 rounded-full ${i < pin.length ? 'bg-texto' : 'border-[1.5px] border-secundario'}`}
          />
        ))}
      </div>
      <p className="mb-4 mt-1 text-center text-xs text-secundario">
        {pin.length} de {PIN_MIN} a {PIN_MAX} dígitos
      </p>
    </>
  )
}
