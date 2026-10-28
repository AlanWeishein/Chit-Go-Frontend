export const PIN_MIN = 4
export const PIN_MAX = 10

// Los círculos del PIN y "N de 4 a 10 dígitos", arriba de TecladoPin, como P-04. Siempre se ven al menos 4: los
// tipeados llenos y el resto vacíos, con borde secundario (el glifo en `linea` daba 1.21:1 contra el fondo).
export default function VisorPin({ pin }: { pin: string }) {
  const circulos = Math.max(PIN_MIN, pin.length)
  return (
    <div aria-live="polite" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      <div aria-hidden="true" className="flex items-center gap-3">
        {Array.from({ length: circulos }, (_, i) => (
          <span
            key={i}
            className={`size-4 rounded-full border-[1.5px] border-secundario ${i < pin.length ? 'bg-primario' : ''}`}
          />
        ))}
      </div>
      <p className="text-[13px] text-secundario">
        {pin.length} de {PIN_MIN} a {PIN_MAX} dígitos
      </p>
    </div>
  )
}
