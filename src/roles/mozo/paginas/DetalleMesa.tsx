import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import { atenderAviso, listarMesas, type MesaDelMozo } from '../../../compartido/api/mozo'
import { IconoCuenta, IconoLlamar } from '../componentes/Iconos'
import { useDatosMozo } from '../componentes/MarcoMozo'
import TarjetaMesa from '../componentes/TarjetaMesa'
import { haceCuanto, useAhora } from '../tiempo'

const ESTADO_DE_MESA = { LIBRE: 'Libre', ABIERTA: 'Abierta', SOLICITADA: 'Pidió la cuenta' }

export default function DetalleMesa() {
  const { mesaId } = useParams()
  const id = Number(mesaId)
  const { misMesas, avisosPendientes, cargando, recargar, version } = useDatosMozo()
  const ahora = useAhora()

  const propia = misMesas.find((m) => m.id === id)
  const [salon, setSalon] = useState<MesaDelMozo[] | null>(null)
  const [errorSalon, setErrorSalon] = useState<string | null>(null)
  const [enviandoAviso, setEnviandoAviso] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  // Si no es de sus mesas, se busca en el salón completo (al entrar y cuando cambia version).
  const esPropia = propia !== undefined
  useEffect(() => {
    if (esPropia) return
    let vigente = true
    listarMesas(true)
      .then((mesas) => {
        if (!vigente) return
        setSalon(mesas)
        setErrorSalon(null)
      })
      .catch((err) => {
        if (vigente) setErrorSalon(textoDelError(err))
      })
    return () => {
      vigente = false
    }
  }, [esPropia, version])

  const mesa = propia ?? salon?.find((m) => m.id === id)
  const buscando = !esPropia && salon === null && !errorSalon

  if (!mesa) {
    return (
      <section>
        <Link to="/mozo/mesas" className="font-semibold underline">
          ← Mesas
        </Link>
        <p className="mt-8 text-center text-secundario">
          {cargando || buscando ? 'Cargando la mesa…' : (errorSalon ?? 'Esta mesa no existe.')}
        </p>
      </section>
    )
  }

  const avisos = avisosPendientes.filter((a) => a.mesaId === mesa.id)
  const pedidos = [...mesa.pedidos].sort(
    (a, b) => new Date(b.enviadoEn).getTime() - new Date(a.enviadoEn).getTime() || b.id - a.id,
  )

  async function atender(avisoId: number) {
    setEnviandoAviso(avisoId)
    setMensaje(null)
    try {
      await atenderAviso(avisoId)
      recargar()
    } catch (err) {
      setMensaje(textoDelError(err))
      const status = statusDe(err)
      if (status === 403 || status === 404 || status === 409) recargar()
    } finally {
      setEnviandoAviso(null)
    }
  }

  return (
    <section>
      <Link to="/mozo/mesas" className="inline-flex min-h-11 items-center font-semibold underline">
        ← Mesas
      </Link>

      <div className="mt-1 flex items-center justify-between gap-2">
        <h1 className="font-[Fraunces] text-3xl font-semibold">Mesa {mesa.numero}</h1>
        <span className="rounded-md bg-suave px-2 py-1 text-xs font-semibold">
          {ESTADO_DE_MESA[mesa.estado]}
        </span>
      </div>

      {!mesa.asignada && (
        <p className="mt-4 rounded-xl border border-linea bg-tarjeta p-3 text-sm">
          Esta mesa es de otro mozo: solo podés mirar.
        </p>
      )}

      {mesa.asignada &&
        avisos.map((a) => (
          <div
            key={a.id}
            className="mt-4 flex items-center gap-3 rounded-2xl border border-linea bg-tarjeta p-3"
          >
            <span className="text-secundario">
              {a.tipo === 'CUENTA_SOLICITADA' ? <IconoCuenta /> : <IconoLlamar />}
            </span>
            <div className="flex-1">
              <p className="font-semibold">
                {a.tipo === 'CUENTA_SOLICITADA'
                  ? 'Pidió la cuenta'
                  : a.tipo === 'LLAMAR_MOZO'
                    ? 'Llamó al mozo'
                    : 'Sin mozo asignado'}
              </p>
              <p className="text-sm text-secundario">{haceCuanto(a.creadoEn, ahora)}</p>
            </div>
            <button
              type="button"
              onClick={() => atender(a.id)}
              disabled={enviandoAviso === a.id}
              className="min-h-11 rounded-xl border-2 border-primario px-4 font-semibold text-primario disabled:opacity-60"
            >
              {enviandoAviso === a.id ? 'Un momento…' : 'Atendido'}
            </button>
          </div>
        ))}

      {mensaje && (
        <p role="alert" className="mt-3 rounded-xl border border-primario bg-tarjeta p-3 text-sm">
          {mensaje}
        </p>
      )}

      {mesa.estado === 'LIBRE' ? (
        <p className="mt-8 text-center text-secundario">La mesa está libre.</p>
      ) : (
        <div className="mt-6">
          <h2 className="text-xs font-semibold tracking-wide text-secundario">PEDIDOS DE LA CUENTA</h2>
          {pedidos.map((p) => (
            <TarjetaMesa key={p.id} pedido={p} puedeActuar={mesa.asignada} recargar={recargar} />
          ))}
        </div>
      )}
    </section>
  )
}
