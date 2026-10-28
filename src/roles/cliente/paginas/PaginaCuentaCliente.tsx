import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { cancelarPedido, traducirError, type EstadoDeSesion } from '../../../compartido/api/cliente'
import iconoAviso from '../../../compartido/ui/iconos/alert.svg'
import iconoCheck from '../../../compartido/ui/iconos/check-14.svg'
import iconoCheck20 from '../../../compartido/ui/iconos/check-20.svg'
import iconoCheckBlanco from '../../../compartido/ui/iconos/check-blanco.svg'
import iconoReloj from '../../../compartido/ui/iconos/clock.svg'
import iconoMas from '../../../compartido/ui/iconos/plus.svg'
import BarraDeAbajo from '../componentes/BarraDeAbajo'
import HojaCancelar from '../componentes/HojaCancelar'
import PantallaDeEntrada, { botonPrincipal, PROBA_DE_NUEVO } from '../componentes/PantallaDeEntrada'
import TarjetaPedido, { EtiquetaEstado } from '../componentes/TarjetaPedido'
import { cantidadDePedidos, precio } from '../formato'
import { useEntradaMesa } from '../useEntradaMesa'
import { useSeguimiento } from '../useSeguimiento'

// El estado con el que P-02 llega acá después de mandar un pedido.
export type EstadoVuelta = { pedidoEnviado: true }

// ya-aprobado es P-03c. error, cualquier otra cosa que salió mal al cancelar.
type Aviso = { tipo: 'ya-aprobado' } | { tipo: 'error'; texto: string }

const CUENTA: Record<EstadoDeSesion['cuentaEstado'], { texto: string; icono: string }> = {
  ABIERTA: { texto: 'Cuenta abierta', icono: iconoCheck },
  SOLICITADA: { texto: 'Cuenta pedida', icono: iconoReloj },
  CERRADA: { texto: 'Cuenta cerrada', icono: iconoCheck },
}

const cuenta = (e: EstadoDeSesion['pedidos'][number]) => e.estado !== 'RECHAZADO' && e.estado !== 'CANCELADO'

// P-03 (seguimiento), P-03b (confirmar cancelar) y P-03c (ya fue aprobado). Solo para el iniciador: en modo
// lectura vuelve a la carta, como P-02. Pedir la cuenta (P-03d a P-03f) lo suma HU-03 en el Sprint 2.
export default function PaginaCuentaCliente() {
  const { token = '' } = useParams<{ token: string }>()
  const { entrada, reintentar } = useEntradaMesa(token)
  const sesion = entrada.estado === 'lista' ? entrada.sesion : null
  const { estado, fallo, conexion, actualizar } = useSeguimiento(sesion?.esIniciador ? sesion.tokenSesion : null)
  const [aCancelar, setACancelar] = useState<{ id: number; numero: number } | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  // Al llegar desde P-02 con el pedido enviado. Se borra del historial, así al recargar no vuelve a aparecer.
  const location = useLocation()
  const navigate = useNavigate()
  const [pedidoEnviado, setPedidoEnviado] = useState(
    () => (location.state as EstadoVuelta | null)?.pedidoEnviado === true,
  )
  useEffect(() => {
    if (pedidoEnviado) navigate(location.pathname, { replace: true, state: null })
  }, [pedidoEnviado, navigate, location.pathname])

  // El router no vuelve arriba al cambiar de pantalla, y los avisos van arriba.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [aviso])

  const rutaCarta = `/mesa/${encodeURIComponent(token)}`

  if (entrada.estado !== 'lista') return <PantallaDeEntrada entrada={entrada} onReintentar={reintentar} />
  if (!entrada.sesion.esIniciador) return <Navigate to={rutaCarta} replace />

  const { numero, sesion: sesionLista } = entrada

  // Pedido #1 es el primero que se mandó en la cuenta. En la pantalla, el último va arriba, como en el Mockup.
  const enOrden = [...(estado?.pedidos ?? [])].sort((a, b) => a.enviadoEn.localeCompare(b.enviadoEn) || a.id - b.id)
  const numerados = enOrden.map((pedido, i) => ({ pedido, numero: i + 1 })).reverse()

  async function confirmarCancelar(id: number) {
    setCancelando(true)
    setAviso(null)
    // El aviso del envío ya no viene al caso: lo que pase ahora con el pedido lo dice su tarjeta o P-03c.
    setPedidoEnviado(false)
    try {
      await cancelarPedido(sesionLista.tokenSesion, id)
      await actualizar()
    } catch (err) {
      const f = traducirError(err)
      if (f.motivo === 'cancelar-en-conflicto') {
        // El 409 dice que ya no está en espera, no qué pasó: se mira el estado nuevo. Si Caja lo rechazó,
        // "ya fue aprobado" sería falso, y si ya estaba cancelado no hay nada que avisar.
        const ahora = (await actualizar())?.pedidos.find((p) => p.id === id)
        if (ahora?.estado === 'CANCELADO') setAviso(null)
        else if (ahora !== undefined && ahora.estado !== 'RECHAZADO') setAviso({ tipo: 'ya-aprobado' })
        else setAviso({ tipo: 'error', texto: f.detalle ?? 'El pedido ya cambió de estado.' })
      } else {
        setAviso({ tipo: 'error', texto: `No pudimos cancelar el pedido. ${PROBA_DE_NUEVO}` })
      }
    } finally {
      setCancelando(false)
      setACancelar(null)
    }
  }

  let contenido: ReactNode
  if (estado === null) {
    contenido =
      fallo === null ? (
        <p className="text-[13px] text-secundario">Cargando tu cuenta…</p>
      ) : (
        <div role="alert" className="rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3 text-texto">
          <p className="text-[15px] font-semibold">No pudimos cargar tu cuenta. {PROBA_DE_NUEVO}</p>
          <button type="button" onClick={() => void actualizar()} className={`mt-3 ${botonPrincipal}`}>
            Reintentar
          </button>
        </div>
      )
  } else {
    contenido = (
      <>
        <section
          aria-label="Total acumulado"
          className="flex items-center gap-3 rounded-2xl border border-linea bg-tarjeta p-[18px] text-texto"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-[13px]">Total acumulado</p>
            <p className="titulo text-[30px]">{precio(estado.total)}</p>
          </div>
          <p className="shrink-0 text-[13px]">{cantidadDePedidos(estado.pedidos.filter(cuenta).length)}</p>
        </section>

        <Link
          to={rutaCarta}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario"
        >
          <img src={iconoMas} alt="" width={20} height={20} />
          Agregar más platos
        </Link>

        {numerados.length === 0 ? (
          <p className="text-[15px] text-secundario">Todavía no mandaste pedidos.</p>
        ) : (
          numerados.map(({ pedido, numero: n }, i) => (
            <Fragment key={pedido.id}>
              {i > 0 && <hr className="border-linea" />}
              <TarjetaPedido pedido={pedido} numero={n} onCancelar={() => setACancelar({ id: pedido.id, numero: n })} />
            </Fragment>
          ))
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-fondo font-inter leading-[normal] text-texto">
      <div className="mx-auto max-w-lg pb-36">
        <header className="flex items-start justify-between gap-3 px-6 pt-4 pb-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <h1 className="titulo text-[25px] text-texto">Tu cuenta</h1>
            <p className="text-[13px] text-secundario">Mesa {numero}</p>
          </div>
          {estado !== null && <EtiquetaEstado {...CUENTA[estado.cuentaEstado]} />}
        </header>

        <main className="flex flex-col gap-[18px] px-6 pt-2">
          <div aria-live="polite" className="contents">
            {conexion === 'reconectando' && (
              <p className="text-[13px] text-secundario">Reconectando… lo que ves puede no estar al día.</p>
            )}
          </div>

          {pedidoEnviado && (
            <p
              role="status"
              className="flex items-start gap-2.5 rounded-[14px] bg-primario p-3.5 text-sm font-medium text-texto-boton"
            >
              <img src={iconoCheckBlanco} alt="" width={20} height={20} className="shrink-0" />
              Mandamos tu pedido. Antes de pasar a cocina, Caja le da una mirada.
            </p>
          )}

          {aviso?.tipo === 'ya-aprobado' && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3.5 text-texto"
            >
              <img src={iconoCheck20} alt="" width={20} height={20} className="shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="text-[15px] font-semibold">El pedido ya fue aprobado.</p>
                <p className="text-[13px] leading-[1.4]">Si necesitás cambiarlo, llamá al mozo.</p>
              </div>
            </div>
          )}
          {aviso?.tipo === 'error' && (
            <p
              role="alert"
              className="flex items-start gap-3 rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3.5 text-[13px] leading-[1.4] text-texto"
            >
              <img src={iconoAviso} alt="" width={20} height={20} className="shrink-0" />
              {aviso.texto}
            </p>
          )}

          {estado !== null && fallo !== null && (
            <p role="alert" className="text-[13px] text-secundario">
              No pudimos actualizar tu cuenta. {PROBA_DE_NUEVO}
            </p>
          )}

          {contenido}
        </main>
      </div>

      {aCancelar !== null && (
        <HojaCancelar
          numero={aCancelar.numero}
          cancelando={cancelando}
          onConfirmar={() => void confirmarCancelar(aCancelar.id)}
          onVolver={() => setACancelar(null)}
        />
      )}

      {/* "Pedir la cuenta" (HU-03, Sprint 2) va como acción de la barra, a la derecha. */}
      <BarraDeAbajo tokenSesion={sesionLista.tokenSesion} />
    </div>
  )
}
