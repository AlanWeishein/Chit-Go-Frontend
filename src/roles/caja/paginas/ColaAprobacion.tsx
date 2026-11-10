// La cola de aprobación de Caja (P-08): la lista a la izquierda y el detalle del pedido elegido a la derecha.
// Los datos los trae MarcoCaja. Acá no hay precios ni total, porque el back no los manda.
import { useEffect, useState } from 'react'
import type { PedidoPorAprobar } from '../../../compartido/api/caja'
import iconoNoDisponible from '../../../compartido/ui/iconos/ban.svg'
import iconoDisponible from '../../../compartido/ui/iconos/check-14.svg'
import TarjetaEnCola from '../componentes/TarjetaEnCola'
import { useDatosCaja } from '../datosCaja'
import { horaDe, minutosDe, useSegundosDesde } from '../espera'

const rotulo = 'text-[11px] leading-[normal] font-semibold tracking-[0.66px] text-secundario uppercase'

export default function ColaAprobacion() {
  const { cola } = useDatosCaja()
  const { pedidos, recibidaEn, cargando, error, recargar } = cola
  const [elegidoId, setElegidoId] = useState<number | null>(null)
  const desdeLaRespuesta = useSegundosDesde(recibidaEn)

  // La cola vive en el marco y no se vuelve a pedir sola al cambiar de pantalla. Al entrar acá se pide de
  // nuevo: si un plato se apagó desde Disponibilidad, el back no avisa por caja/pedidos.
  useEffect(() => {
    recargar()
  }, [recargar])

  // Al entrar va el primero. Si el elegido ya no está en la lista, también.
  const elegido = pedidos.find((p) => p.id === elegidoId) ?? pedidos[0]
  const esperaDe = (p: PedidoPorAprobar) => p.segundosDeEspera + desdeLaRespuesta

  const hayCola = !cargando && !error && pedidos.length > 0

  return (
    <div className="flex min-h-full flex-col gap-4 px-6 pt-6 pb-4">
      <header className="flex min-h-[52px] flex-col justify-center gap-0.5 leading-[normal]">
        <h1 className="titulo text-[25px]">Cola de aprobación</h1>
        {hayCola && (
          <p className="text-[13px] text-secundario">
            {pedidos.length} {pedidos.length === 1 ? 'pendiente' : 'pendientes'} · por orden de llegada
          </p>
        )}
      </header>

      {cargando ? (
        <p className="py-10 text-center text-secundario">Cargando la cola…</p>
      ) : error ? (
        <div className="py-10 text-center">
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={recargar}
            className="mt-4 h-11 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          >
            Probá de nuevo
          </button>
        </div>
      ) : !elegido ? (
        <p className="py-10 text-center text-secundario">No hay pedidos esperando.</p>
      ) : (
        <div className="flex items-start gap-4">
          <div className="flex w-60 shrink-0 flex-col gap-2">
            {pedidos.map((p, i) => (
              <div key={p.id} className="contents">
                {i < 2 && <p className={rotulo}>{i === 0 ? 'Siguiente' : 'Después'}</p>}
                <TarjetaEnCola
                  pedido={p}
                  segundosDeEspera={esperaDe(p)}
                  seleccionada={p.id === elegido.id}
                  alElegir={() => setElegidoId(p.id)}
                />
              </div>
            ))}
          </div>

          <Detalle pedido={elegido} segundosDeEspera={esperaDe(elegido)} />
        </div>
      )}
    </div>
  )
}

function Detalle({ pedido, segundosDeEspera }: { pedido: PedidoPorAprobar; segundosDeEspera: number }) {
  const minutos = minutosDe(segundosDeEspera)

  return (
    <section aria-label="Pedido elegido" className="flex min-w-0 flex-1 flex-col gap-3 pl-4">
      <div>
        <h2 className="titulo text-xl leading-[normal]">
          Mesa {pedido.mesa} · Pedido #{pedido.id}
        </h2>
        <p className="text-[13px] leading-[normal] text-secundario">
          Recibido {horaDe(pedido.enviadoEn)} · esperando hace {minutos < 1 ? 'menos de 1 min' : `${minutos} min`}
        </p>
      </div>

      <table className="w-full table-fixed border-collapse text-left text-[13px] leading-[normal]">
        <thead>
          <tr className={`h-[34px] ${rotulo}`}>
            <th className="px-2.5 font-semibold">Ítem</th>
            <th className="w-14 px-2.5 font-semibold">Cant.</th>
            <th className="w-[124px] px-2.5 font-semibold">Disponibilidad</th>
            <th className="w-[120px] px-2.5 font-semibold">Nota</th>
          </tr>
        </thead>
        <tbody>
          {pedido.items.map((item, i) => (
            // El back no manda un id por renglón y un plato puede venir dos veces con notas distintas.
            <tr key={`${item.platoId}-${i}`} className="h-[49px] border-t border-linea">
              <td className="px-2.5 py-2">{item.plato}</td>
              <td className="px-2.5 py-2">{item.cantidad}</td>
              <td className="px-2.5 py-2">
                <span className="inline-flex w-max items-center gap-1 rounded-md bg-linea py-1 pr-[9px] pl-[7px] text-xs leading-[normal] font-medium whitespace-nowrap">
                  <img src={item.disponible ? iconoDisponible : iconoNoDisponible} alt="" />
                  {item.disponible ? 'Disponible' : 'No disponible'}
                </span>
              </td>
              <td className="px-2.5 py-2 break-words">{item.observacion || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
