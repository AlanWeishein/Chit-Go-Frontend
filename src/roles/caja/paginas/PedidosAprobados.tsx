// Los pedidos aprobados de Caja (P-36): la lista a la izquierda, en dos grupos y en el orden de la cocina, y el
// detalle del pedido elegido a la derecha. Acá se prioriza; cancelar es de la tarea siguiente.
// Sin precios, total ni disponibilidad: el DTO de cocina no los manda.
import { useCallback, useEffect, useRef, useState } from 'react'
import { cambiarPrioridad, listarAprobados, type ListaDeAprobados } from '../../../compartido/api/caja'
import type { PedidoDeCocina } from '../../../compartido/api/cocina'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import iconoPrioridad from '../../../compartido/ui/iconos/flag-blanco-20.svg'
import iconoCancelar from '../../../compartido/ui/iconos/x.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import EtiquetaDePedido from '../componentes/EtiquetaDePedido'
import TablaDeItemsAprobados from '../componentes/TablaDeItemsAprobados'
import TarjetaDeAprobado from '../componentes/TarjetaDeAprobado'
import { useDatosCaja } from '../datosCaja'
import { horaDe } from '../espera'

const rotulo = 'text-[11px] leading-[normal] font-semibold tracking-[0.66px] text-secundario uppercase'

const boton =
  'flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] px-[18px] text-[15px] leading-[normal] font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-not-allowed disabled:opacity-38'

// Mismo interlineado que en P-08: el aviso hereda 1.5 del body y quedaría más alto que en el Mockup.
const interlineado = '[&_p:first-child]:leading-[normal]'

// El Date.now() de la tablet, que avanza solo: todas las tarjetas cambian juntas y hay un solo intervalo.
function useAhora(cadaMs = 15000): number {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cadaMs)
    return () => clearInterval(id)
  }, [cadaMs])
  return ahora
}

export default function PedidosAprobados() {
  // La conexión en vivo es del marco (conexion.ts admite un solo useEnVivo a la vez). Cada evento de caja/pedidos
  // hace que el marco vuelva a pedir la cola y `recibidaEn` cambie: con eso se vuelve a pedir esta lista.
  // Es lo mismo que hace CierreCuentaPage. Límite: si la cola de aprobación falla, esta lista no se entera.
  const { cola } = useDatosCaja()
  const ahora = useAhora()

  const [lista, setLista] = useState<ListaDeAprobados | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [elegidoId, setElegidoId] = useState<number | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  // Si salen dos pedidos de la lista seguidos, vale solo la respuesta del último: una vieja que llega tarde no pisa.
  const ultimoPedido = useRef(0)
  // El estado llega un render tarde: con dos toques seguidos los dos verían enviando en false. La ref corta el segundo.
  const enviandoRef = useRef(false)

  const cargar = useCallback(() => {
    const este = ++ultimoPedido.current
    listarAprobados()
      .then((datos) => {
        if (este !== ultimoPedido.current) return
        setLista(datos)
        setError(null)
      })
      .catch((err) => {
        if (este === ultimoPedido.current) setError(textoDelError(err))
      })
      .finally(() => {
        if (este === ultimoPedido.current) setCargando(false)
      })
  }, [])

  // Al entrar, y con cada evento que le llega al marco.
  useEffect(() => {
    cargar()
  }, [cargar, cola.recibidaEn])

  // Los dos grupos van en el orden en que vienen del back: no se reordena. Al entrar va el primero; si el elegido
  // ya no está (lo cancelaron o lo terminaron), también.
  const sinEmpezar = lista?.sinEmpezar ?? []
  const enPreparacion = lista?.enPreparacion ?? []
  const todos = [...sinEmpezar, ...enPreparacion]
  const elegido = todos.find((p) => p.id === elegidoId) ?? todos[0]
  const elegidoEnPreparacion = elegido !== undefined && enPreparacion.some((p) => p.id === elegido.id)

  function elegirPedido(id: number) {
    setElegidoId(id)
    setAviso(null)
  }

  // "Priorizar" pone la prioridad y "Sacar la prioridad" la quita. Con 409 (ya lo empezaron) o 404 (ya no existe)
  // se muestra el texto del back y se vuelve a pedir la lista.
  async function priorizar(pedido: PedidoDeCocina) {
    if (enviandoRef.current) return
    enviandoRef.current = true
    setEnviando(true)
    setAviso(null)
    try {
      await cambiarPrioridad(pedido.id, !pedido.prioritario)
      cargar()
    } catch (err) {
      const status = statusDe(err)
      if (status === 409 || status === 404) cargar()
      setAviso(textoDelError(err))
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  const hayPedidos = !cargando && !error && todos.length > 0

  return (
    <div className="flex min-h-full flex-col gap-4 px-6 pt-6 pb-4">
      {/* Sin selector a la derecha, como P-08: el encabezado mide 48 px, no 52. */}
      <header className="flex flex-col gap-0.5 leading-[normal]">
        <h1 className="titulo text-[25px]">Pedidos aprobados</h1>
        {hayPedidos && (
          <p className="text-[13px] text-secundario">
            {sinEmpezar.length} sin empezar · {enPreparacion.length} en preparación · en el orden de la cocina
          </p>
        )}
      </header>

      {cargando ? (
        <p className="py-10 text-center text-secundario">Cargando los pedidos…</p>
      ) : error ? (
        <div className="py-10 text-center">
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={cargar}
            className="mt-4 h-11 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          >
            Probá de nuevo
          </button>
        </div>
      ) : !elegido ? (
        <div className="flex flex-col gap-4">
          {/* Si era el último pedido y salió de la lista, el aviso de por qué no se aplicó no se pierde. */}
          {aviso && <AvisoDeFallo className={interlineado}>{aviso}</AvisoDeFallo>}
          <p className="py-10 text-center text-secundario">No hay pedidos aprobados.</p>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div className="flex w-60 shrink-0 flex-col gap-2">
            {sinEmpezar.length > 0 && <p className={rotulo}>Sin empezar</p>}
            {sinEmpezar.map((p) => (
              <TarjetaDeAprobado
                key={p.id}
                pedido={p}
                enPreparacion={false}
                ahora={ahora}
                seleccionada={p.id === elegido.id}
                alElegir={() => elegirPedido(p.id)}
              />
            ))}
            {enPreparacion.length > 0 && <p className={rotulo}>En preparación</p>}
            {enPreparacion.map((p) => (
              <TarjetaDeAprobado
                key={p.id}
                pedido={p}
                enPreparacion
                ahora={ahora}
                seleccionada={p.id === elegido.id}
                alElegir={() => elegirPedido(p.id)}
              />
            ))}
          </div>

          <section aria-label="Pedido elegido" className="flex min-w-0 flex-1 flex-col gap-3 pl-4">
            {aviso && <AvisoDeFallo className={interlineado}>{aviso}</AvisoDeFallo>}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="titulo text-xl leading-[normal]">
                  Mesa {elegido.mesa} · Pedido #{elegido.id}
                </h2>
                <p className="text-[13px] leading-[normal] text-secundario">
                  Aprobado {horaDe(elegido.aprobadoEn)} ·{' '}
                  {elegidoEnPreparacion
                    ? `la cocina lo empezó ${elegido.enPreparacionEn ? horaDe(elegido.enPreparacionEn) : ''}`.trim()
                    : 'en la cola de cocina, sin empezar'}
                </p>
              </div>
              <EtiquetaDePedido variante={elegidoEnPreparacion ? 'enPreparacionOscura' : 'aprobado'} />
            </div>

            <TablaDeItemsAprobados items={elegido.items} />

            <p className="text-[13px] leading-[1.4] text-secundario">
              Priorizar lo pasa adelante en la cola de cocina, y se puede sacar. Cuando la cocina lo empieza, ya no se
              puede priorizar ni cancelar.
            </p>

            <div className="flex items-center gap-2.5">
              {/* Cancelar es de la tarea 3: hasta entonces queda dibujado y deshabilitado, para que la pantalla
                  tenga el mismo ancho de botones que el Mockup. */}
              <button type="button" disabled className={`${boton} border-[1.5px] border-primario text-primario`}>
                <img src={iconoCancelar} alt="" width={20} height={20} />
                Cancelar pedido
              </button>
              <button
                type="button"
                onClick={() => priorizar(elegido)}
                disabled={enviando || elegidoEnPreparacion}
                className={`${boton} bg-primario text-texto-boton`}
              >
                <img src={iconoPrioridad} alt="" width={20} height={20} />
                {elegido.prioritario ? 'Sacar la prioridad' : 'Priorizar'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
