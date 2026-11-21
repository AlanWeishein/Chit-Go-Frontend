import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { PedidoPublico } from '../../../compartido/tipos/pantallaPublica'
import iconoCheck from '../../../compartido/ui/iconos/check-26.svg'
import iconoChef from '../../../compartido/ui/iconos/chef-26.svg'
import ilustracionCloche from '../../../compartido/ui/iconos/ilustracion-cloche.svg'
import { usePantallaEnVivo } from '../usePantallaEnVivo'

function horaActual(): string {
  return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// Se pone al día sola, sin que nadie toque la pantalla.
function Reloj() {
  const [hora, setHora] = useState(horaActual)
  useEffect(() => {
    const id = setInterval(() => setHora(horaActual()), 15000)
    return () => clearInterval(id)
  }, [])
  return <p className="text-[22px] leading-[normal] font-semibold">{hora}</p>
}

// "Mesa 7" y "Pedido #24": el número del pedido es el id, el mismo que ven Caja y Cocina. La mesa es el número
// tal cual lo guardó el Admin ("Mesa 07" del Mockup es un dato de ejemplo).
function TarjetaDePedido({ pedido, listo }: { pedido: PedidoPublico; listo: boolean }) {
  return (
    <li
      className={`flex w-[170px] flex-col gap-0.5 rounded-[14px] px-4 py-3.5 leading-[normal] ${
        listo ? 'bg-primario text-texto-boton' : 'bg-tarjeta text-texto'
      }`}
    >
      <p className="titulo text-[26px] break-words">Mesa {pedido.mesa}</p>
      <p className={`text-[15px] ${listo ? 'text-linea' : 'text-secundario'}`}>Pedido #{pedido.id}</p>
    </li>
  )
}

function Columna({
  titulo,
  icono,
  pedidos,
  listo,
  vacio,
}: {
  titulo: string
  icono: string
  pedidos: PedidoPublico[]
  listo: boolean
  vacio: string
}) {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-3.5 rounded-[20px] bg-linea p-[18px]">
      <div className="flex items-center gap-2.5">
        <img src={icono} alt="" width={26} height={26} />
        <h2 className="titulo text-[24px] leading-[normal]">{titulo}</h2>
      </div>
      {pedidos.length === 0 ? (
        <p className="text-[18px] leading-[normal] text-secundario">{vacio}</p>
      ) : (
        <ul className="flex flex-wrap content-start gap-3">
          {pedidos.map((p) => (
            <TarjetaDePedido key={p.id} pedido={p} listo={listo} />
          ))}
        </ul>
      )}
    </section>
  )
}

function Pantalla({ token }: { token: string }) {
  const { datos, noDisponible, reconectando } = usePantallaEnVivo(token)

  // Se lee de lejos: sin el resto de la pantalla.
  if (noDisponible) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-fondo p-12 font-inter text-texto">
        <h1 className="titulo text-center text-[56px] leading-[normal]">{noDisponible}</h1>
      </main>
    )
  }

  const pedidos = datos?.pedidos ?? []
  const enPreparacion = pedidos.filter((p) => p.estado === 'EN_PREPARACION')
  const listos = pedidos.filter((p) => p.estado === 'LISTO')

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-fondo px-12 py-9 font-inter text-texto select-none">
      <header className="flex items-center justify-between leading-[normal]">
        <p className="titulo text-[20px]">Chit&amp;Go</p>
        <div className="flex items-center gap-4">
          {reconectando && (
            <p
              role="status"
              className="rounded-[10px] border-[1.5px] border-primario bg-tarjeta px-3 py-1.5 text-[15px] font-semibold"
            >
              Reconectando…
            </p>
          )}
          <Reloj />
        </div>
      </header>

      <div className="flex items-center gap-5">
        <img src={ilustracionCloche} alt="" width={88} height={88} className="shrink-0" />
        <div className="flex flex-col gap-1 leading-[normal]">
          <h1 className="titulo text-[40px]">¿Cómo va tu pedido?</h1>
          <p className="text-[18px] text-secundario">Buscá tu mesa: cuando diga “Listo”, ya sale para vos.</p>
        </div>
      </div>

      {datos === null ? (
        <p className="py-10 text-center text-[24px] text-secundario">Cargando estado de pedidos…</p>
      ) : (
        <div className="flex flex-1 gap-6">
          <Columna
            titulo="En preparación"
            icono={iconoChef}
            pedidos={enPreparacion}
            listo={false}
            vacio="No hay pedidos en preparación"
          />
          <Columna
            titulo="Listo · ya sale a tu mesa"
            icono={iconoCheck}
            pedidos={listos}
            listo
            vacio="No hay pedidos listos"
          />
        </div>
      )}

      <p className="text-[13px] leading-[normal] text-secundario">
        Solo muestra el estado de los pedidos: sin datos de la cuenta ni del personal.
      </p>
    </main>
  )
}

// P-20, la pantalla del salón (HU-17, nodo 2009:6310): un televisor con la dirección /pantalla/{token}, sin login.
// El token cambia de local: con otro token se arma todo de nuevo (key).
export function PantallaPublicaPage() {
  const { token } = useParams<{ token: string }>()
  return token ? <Pantalla key={token} token={token} /> : null
}
