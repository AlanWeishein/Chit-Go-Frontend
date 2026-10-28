import type { Entrada } from '../useEntradaMesa'

export const PROBA_DE_NUEVO = 'Revisá la conexión y probá de nuevo.'

export const botonPrincipal = 'h-12 w-full rounded-[14px] bg-primario text-[15px] font-semibold text-texto-boton'

// Lo que se ve antes de la carta o del pedido. Va con los tokens de la paleta, como el login; P-35 y P-35b no tienen botones.
export default function PantallaDeEntrada({
  entrada,
  onReintentar,
}: {
  entrada: Exclude<Entrada, { estado: 'lista' }>
  onReintentar: () => void
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fondo p-6 font-inter text-texto">
      <div className="w-full max-w-sm text-center">
        <h1 className="titulo text-3xl text-primario">Chit&Go</h1>
        <div className="mt-6 rounded-2xl border border-linea bg-tarjeta p-6">
          {entrada.estado === 'cargando' && <p className="text-sm text-secundario">Cargando la mesa…</p>}

          {entrada.estado === 'mesa-inexistente' && (
            <h2 className="text-lg font-semibold">No encontramos esta mesa. Pedile ayuda al mozo.</h2>
          )}

          {entrada.estado === 'mesa-no-disponible' && (
            <>
              <h2 className="text-lg font-semibold">Esta mesa no está disponible.</h2>
              <p className="mt-1 text-secundario">Mesa {entrada.numero}</p>
              <p className="mt-4">Pedile ayuda al personal.</p>
            </>
          )}

          {entrada.estado === 'error' && (
            <div role="alert">
              <p className="font-semibold">No pudimos abrir la mesa. {PROBA_DE_NUEVO}</p>
              <button type="button" onClick={onReintentar} className={`mt-4 ${botonPrincipal}`}>
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
