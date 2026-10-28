export const PIN_MIN = 4
export const PIN_MAX = 10

// Los puntos del PIN y "N de 4 a 10 dígitos", arriba de TecladoPin.
export default function VisorPin({ pin }: { pin: string }) {
  return (
    <>
      <div
        aria-live="polite"
        aria-label={`PIN de ${pin.length} dígitos`}
        className="flex h-16 items-center justify-center rounded-xl border border-linea bg-fondo text-4xl tracking-[0.3em]"
      >
        {pin ? '•'.repeat(pin.length) : <span className="text-linea">••••</span>}
      </div>
      <p className="mb-4 mt-1 text-center text-xs text-secundario">
        {pin.length} de {PIN_MIN} a {PIN_MAX} dígitos
      </p>
    </>
  )
}
