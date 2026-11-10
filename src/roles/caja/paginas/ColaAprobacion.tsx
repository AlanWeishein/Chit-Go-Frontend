// La cola de aprobación de Caja (P-08): la lista a la izquierda y el detalle del pedido elegido a la derecha.
// Los datos los trae MarcoCaja. Acá no hay precios ni total, porque el back no los manda.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  aprobarPedido,
  rechazarPedido,
  type MotivoRechazo,
  type PedidoPorAprobar,
} from '../../../compartido/api/caja'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import iconoNoDisponible from '../../../compartido/ui/iconos/ban.svg'
import iconoDisponible from '../../../compartido/ui/iconos/check-14.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import AccionesDePedido from '../componentes/AccionesDePedido'
import ChipDeDemora from '../componentes/ChipDeDemora'
import SelectorDeCola, { type FiltroDeCola } from '../componentes/SelectorDeCola'
import TarjetaEnCola from '../componentes/TarjetaEnCola'
import { useDatosCaja } from '../datosCaja'
import { horaDe, minutosDe, useSegundosDesde } from '../espera'

const rotulo = 'text-[11px] leading-[normal] font-semibold tracking-[0.66px] text-secundario uppercase'

// Lo que el Mockup (P-08c y P-08d) escribe debajo del título. El título es el detail del back; la línea de abajo se
// busca por ese texto exacto (Pedido.java) y, si el back lo cambia, el recuadro sale solo con el título.
const EXPLICACION: Record<string, string> = {
  'El pedido ya fue resuelto':
    'Otra sesión de Caja lo aprobó o lo rechazó al mismo tiempo. Vale la primera acción, así que esta no se aplicó.',
  'El pedido ya fue cancelado': 'El cliente lo canceló mientras lo mirabas. No llega a la cocina.',
}

// El título hereda el interlineado de 1.5 del body y el recuadro queda 4 px más alto que en el Mockup, que usa el normal.
// AvisoDeFallo es de acceso y no se toca: el interlineado se pisa desde acá.
const interlineado = '[&_p:first-child]:leading-[normal]'

function AvisoDelPedido({ texto }: { texto: string }) {
  const explicacion = EXPLICACION[texto]
  return explicacion ? (
    <AvisoDeFallo titulo={texto} className={interlineado}>
      {explicacion}
    </AvisoDeFallo>
  ) : (
    <AvisoDeFallo className={interlineado}>{texto}</AvisoDeFallo>
  )
}

export default function ColaAprobacion() {
  const { cola } = useDatosCaja()
  const { pedidos, recibidaEn, cargando, error, recargar } = cola
  const [elegidoId, setElegidoId] = useState<number | null>(null)
  const [filtro, setFiltro] = useState<FiltroDeCola>('todos')
  const desdeLaRespuesta = useSegundosDesde(recibidaEn)

  // El motivo y el bloqueo se guardan con el id del pedido al que pertenecen: valen solo para ese, y al pasar a
  // otro se ven vacíos sin tener que limpiarlos con un efecto.
  const [motivoElegido, setMotivoElegido] = useState<{ pedidoId: number; motivo: MotivoRechazo } | null>(null)
  const [bloqueadoId, setBloqueadoId] = useState<number | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  // El estado llega un render tarde: con dos toques seguidos los dos verían enviando en false. La ref corta el segundo.
  const enviandoRef = useRef(false)

  // La cola vive en el marco y no se vuelve a pedir sola al cambiar de pantalla. Al entrar acá se pide de
  // nuevo: si un plato se apagó desde Disponibilidad, el back no avisa por caja/pedidos.
  useEffect(() => {
    recargar()
  }, [recargar])

  // `demorado` lo decide el back (a los 181 segundos): no se calcula con la espera local. Con "Con alerta" la lista
  // muestra solo esos. Como la cola va del más viejo al más nuevo, los demorados son siempre los primeros.
  const conAlerta = pedidos.filter((p) => p.demorado).length
  const visibles = filtro === 'alerta' ? pedidos.filter((p) => p.demorado) : pedidos

  // Al entrar va el primero. Si el elegido ya no está en la lista que se ve, también.
  const elegido = visibles.find((p) => p.id === elegidoId) ?? visibles[0]
  const esperaDe = (p: PedidoPorAprobar) => p.segundosDeEspera + desdeLaRespuesta
  const motivo = elegido && motivoElegido?.pedidoId === elegido.id ? motivoElegido.motivo : undefined

  function elegirPedido(id: number) {
    setElegidoId(id)
    setMotivoElegido(null)
    setAviso(null)
  }

  async function resolver(id: number, llamada: () => Promise<void>) {
    if (enviandoRef.current) return
    enviandoRef.current = true
    setEnviando(true)
    setAviso(null)
    try {
      await llamada()
      // Hasta que la lista nueva lo saque, el pedido queda quieto: otro toque daría "ya fue resuelto".
      setBloqueadoId(id)
      setMotivoElegido(null)
      recargar()
    } catch (err) {
      const status = statusDe(err)
      if (status === 409 || status === 404) {
        setBloqueadoId(id)
        recargar()
      }
      setAviso(textoDelError(err))
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  const hayCola = !cargando && !error && pedidos.length > 0

  return (
    <div className="flex min-h-full flex-col gap-4 px-6 pt-6 pb-4">
      <header className="flex min-h-[52px] items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 leading-[normal]">
          <h1 className="titulo text-[25px]">Cola de aprobación</h1>
          {hayCola && (
            <p className="text-[13px] text-secundario">
              {pedidos.length} {pedidos.length === 1 ? 'pendiente' : 'pendientes'} · por orden de llegada
            </p>
          )}
        </div>
        {!cargando && !error && <SelectorDeCola filtro={filtro} conAlerta={conAlerta} alCambiar={setFiltro} />}
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
        <div className="flex flex-col gap-4">
          {/* Si era el último pedido y salió de la lista, el aviso de por qué no se aplicó no se pierde. */}
          {aviso && <AvisoDelPedido texto={aviso} />}
          <p className="py-10 text-center text-secundario">
            {filtro === 'alerta' ? 'Ningún pedido pasó los 3 minutos.' : 'No hay pedidos esperando.'}
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div className="flex w-60 shrink-0 flex-col gap-2">
            {visibles.map((p, i) => (
              <div key={p.id} className="contents">
                {i < 2 && <p className={rotulo}>{i === 0 ? 'Siguiente' : 'Después'}</p>}
                <TarjetaEnCola
                  pedido={p}
                  segundosDeEspera={esperaDe(p)}
                  seleccionada={p.id === elegido.id}
                  alElegir={() => elegirPedido(p.id)}
                />
              </div>
            ))}
          </div>

          <Detalle
            pedido={elegido}
            segundosDeEspera={esperaDe(elegido)}
            aviso={aviso && <AvisoDelPedido texto={aviso} />}
          >
            <AccionesDePedido
              motivo={motivo}
              alElegirMotivo={(m) => setMotivoElegido({ pedidoId: elegido.id, motivo: m })}
              enviando={enviando}
              bloqueado={bloqueadoId === elegido.id}
              alAprobar={() => resolver(elegido.id, () => aprobarPedido(elegido.id))}
              alRechazar={() => motivo && resolver(elegido.id, () => rechazarPedido(elegido.id, motivo))}
            />
          </Detalle>
        </div>
      )}
    </div>
  )
}

function Detalle({
  pedido,
  segundosDeEspera,
  aviso,
  children,
}: {
  pedido: PedidoPorAprobar
  segundosDeEspera: number
  aviso: ReactNode // el recuadro de arriba, si la última acción falló
  children: ReactNode // el motivo y los botones de abajo
}) {
  const minutos = minutosDe(segundosDeEspera)

  return (
    <section aria-label="Pedido elegido" className="flex min-w-0 flex-1 flex-col gap-3 pl-4">
      {aviso}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="titulo text-xl leading-[normal]">
            Mesa {pedido.mesa} · Pedido #{pedido.id}
          </h2>
          <p className="text-[13px] leading-[normal] text-secundario">
            Recibido {horaDe(pedido.enviadoEn)} · esperando hace {minutos < 1 ? 'menos de 1 min' : `${minutos} min`}
          </p>
        </div>
        {pedido.demorado && <ChipDeDemora texto="Espera +3 min" />}
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

      {children}
    </section>
  )
}
