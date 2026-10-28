import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  enviarPedido,
  obtenerCarta,
  traducirError,
  type FalloCliente,
} from '../../../compartido/api/cliente'
import type { ItemCarrito } from '../../../compartido/tipos/carrito'
import iconoAviso from '../../../compartido/ui/iconos/alert.svg'
import iconoVolver from '../../../compartido/ui/iconos/arrow-l.svg'
import iconoInfo from '../../../compartido/ui/iconos/info.svg'
import iconoMas from '../../../compartido/ui/iconos/plus.svg'
import iconoEnviar from '../../../compartido/ui/iconos/send.svg'
import BarraDeAbajo from '../componentes/BarraDeAbajo'
import FilaPedido from '../componentes/FilaPedido'
import PantallaDeEntrada from '../componentes/PantallaDeEntrada'
import { cantidadDePlatos, precio } from '../formato'
import { useCarrito } from '../useCarrito'
import { useEntradaMesa } from '../useEntradaMesa'

// El aviso de arriba. Con noDisponibles es P-02b: se va solo cuando el cliente saca esos platos.
type Aviso = { texto: string; noDisponibles: number[] }

// El estado que P-01 lee al volver de un envío que salió bien.
export type EstadoVuelta = { pedidoEnviado: true }

function textoDelFallo(fallo: FalloCliente): string {
  switch (fallo.motivo) {
    case 'pedido-sin-permiso':
      return 'Desde este celular no se pueden hacer pedidos en esta mesa. Pedile ayuda al mozo.'
    case 'pedido-en-conflicto':
      return fallo.detalle ?? 'No pudimos mandar el pedido. Pedile ayuda al mozo.'
    case 'pedido-invalido':
      return 'Hay un dato del pedido que no está bien. Revisá las cantidades y probá de nuevo.'
    default:
      return 'No pudimos mandar el pedido. Revisá la conexión y probá de nuevo.'
  }
}

// El 409 del pedido es la cuenta cerrada o un plato que ya no está, y el status no los distingue. En vez de
// leer el detail, se vuelve a pedir la carta: los platos del carrito que ya no vienen son los que no están.
async function platosQueYaNoEstan(tokenQR: string, items: ItemCarrito[]): Promise<number[]> {
  try {
    const carta = await obtenerCarta(tokenQR)
    const enCarta = new Set(carta.categorias.flatMap((c) => c.platos.map((p) => p.id)))
    return items.filter((i) => !enCarta.has(i.producto.id)).map((i) => i.producto.id)
  } catch {
    return []
  }
}

// P-02 (el carrito) y P-02b (un plato ya no está). Solo para el iniciador: en modo lectura vuelve a la carta.
export default function PaginaPedidoCliente() {
  const { token = '' } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { entrada, reintentar } = useEntradaMesa(token)
  const sesion = entrada.estado === 'lista' ? entrada.sesion : null
  const carrito = useCarrito(token, sesion?.tokenSesion ?? null)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  // El router no vuelve arriba al cambiar de pantalla: P-02 arranca desde el encabezado, no donde quedó la carta.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  // El aviso va arriba, como en P-02b: se sube para que se vea aunque el botón estuviera más abajo.
  useEffect(() => {
    if (aviso !== null) window.scrollTo({ top: 0 })
  }, [aviso])

  const rutaCarta = `/mesa/${encodeURIComponent(token)}`

  if (entrada.estado !== 'lista') return <PantallaDeEntrada entrada={entrada} onReintentar={reintentar} />
  if (!entrada.sesion.esIniciador) return <Navigate to={rutaCarta} replace />

  const { numero, sesion: sesionLista } = entrada
  const { items } = carrito
  const bloqueados = aviso === null ? [] : items.filter((i) => aviso.noDisponibles.includes(i.producto.id))
  const avisoVisible = aviso !== null && (aviso.noDisponibles.length === 0 || bloqueados.length > 0)

  async function enviar() {
    if (enviando || bloqueados.length > 0) return
    // Se lee del carrito guardado, así entra la nota que se estaba escribiendo al tocar "Enviar".
    const pedido = carrito.pedidoAEnviar()
    if (pedido.items.length === 0) return
    setEnviando(true)
    setAviso(null)
    try {
      await enviarPedido(sesionLista.tokenSesion, {
        uuidCliente: pedido.uuidCliente,
        items: pedido.items.map((i) => ({
          platoId: i.producto.id,
          cantidad: i.cantidad,
          observacion: i.observacion ?? null,
        })),
      })
      carrito.vaciar()
      // Hasta que esté P-03 (tarea 3), vuelve a la carta con el aviso de que Caja lo revisa.
      navigate(rutaCarta, { state: { pedidoEnviado: true } satisfies EstadoVuelta })
    } catch (err) {
      const fallo = traducirError(err)
      const noDisponibles =
        fallo.motivo === 'pedido-en-conflicto' ? await platosQueYaNoEstan(token, pedido.items) : []
      setAviso({ texto: textoDelFallo(fallo), noDisponibles })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-fondo font-inter leading-[normal] text-texto">
      {/* Mientras sale el pedido no se puede tocar nada de la lista: el pedido que sale es el que se ve. */}
      <div inert={enviando} className="mx-auto max-w-lg pb-36">
        <header className="flex flex-col gap-1 px-6 pt-4 pb-3.5">
          <Link to={rutaCarta} className="flex h-11 w-fit items-center gap-2 text-[15px] font-semibold underline">
            <img src={iconoVolver} alt="" width={20} height={20} />
            Menú
          </Link>
          <h1 className="titulo text-[25px] text-texto">Tu pedido</h1>
          <p className="text-[13px] text-secundario">
            Mesa {numero} · {cantidadDePlatos(carrito.platos)}
          </p>
        </header>

        <main className="flex flex-col gap-[18px] px-6 pt-2">
          {avisoVisible ? (
            <p
              role="alert"
              className="flex items-start gap-3 rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3.5 text-[13px] leading-[1.4] text-texto"
            >
              <img src={iconoAviso} alt="" width={20} height={20} className="shrink-0" />
              {aviso.texto}
            </p>
          ) : (
            items.length > 0 && (
              // Sin "Lo seguís desde «Mi cuenta»" hasta que esté P-03 (tarea 3).
              <p className="flex items-start gap-3 rounded-[14px] bg-linea p-3.5 text-[13px] text-texto">
                <img src={iconoInfo} alt="" width={20} height={20} className="shrink-0" />
                Antes de pasar a cocina, Caja le da una mirada a tu pedido.
              </p>
            )
          )}

          {items.length === 0 ? (
            <p className="text-[15px] text-secundario">Todavía no agregaste platos.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-linea">
              {items.map((item) => (
                <FilaPedido
                  key={item.producto.id}
                  item={item}
                  noDisponible={bloqueados.includes(item)}
                  onCantidad={(n) => carrito.cambiarCantidad(item.producto.id, n)}
                  onQuitar={() => carrito.quitar(item.producto.id)}
                  onNota={(texto) => carrito.cambiarNota(item.producto.id, texto)}
                />
              ))}
            </ul>
          )}

          <Link
            to={rutaCarta}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario"
          >
            <img src={iconoMas} alt="" width={20} height={20} />
            {items.length === 0 ? 'Ver el menú' : 'Agregar más platos'}
          </Link>
        </main>
      </div>

      <BarraDeAbajo tokenSesion={sesionLista.tokenSesion}>
        {items.length > 0 && (
          <button
            type="button"
            onClick={enviar}
            disabled={enviando || bloqueados.length > 0}
            className={`flex h-[60px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] ${
              bloqueados.length > 0 ? 'opacity-[.38]' : ''
            }`}
          >
            <img src={iconoEnviar} alt="" width={20} height={20} />
            <span className="flex flex-col text-left whitespace-nowrap">
              <span className="text-[15px] font-semibold text-texto-boton">
                {enviando ? 'Enviando tu pedido…' : 'Enviar pedido'}
              </span>
              <span className="text-[13px] text-linea">Total {precio(carrito.total)}</span>
            </span>
          </button>
        )}
      </BarraDeAbajo>
    </div>
  )
}
