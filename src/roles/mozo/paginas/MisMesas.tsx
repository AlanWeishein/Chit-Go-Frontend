import { useEffect, useState } from 'react'
import { textoDelError } from '../../../compartido/api/errores'
import { listarMesas, type MesaDelMozo } from '../../../compartido/api/mozo'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import CeldaMesa from '../componentes/CeldaMesa'
import { useDatosMozo } from '../componentes/MarcoMozo'
import Selector from '../componentes/Selector'

type Vista = 'mias' | 'salon'

export default function MisMesas() {
  const { sesion } = useSesion()
  const { misMesas, avisosPendientes, cargando, error, recargar, version } = useDatosMozo()
  const [vista, setVista] = useState<Vista>('mias')
  const [salon, setSalon] = useState<MesaDelMozo[] | null>(null)
  const [errorSalon, setErrorSalon] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  // El salón completo se pide al elegir esa pestaña y cada vez que cambia version.
  useEffect(() => {
    if (vista !== 'salon') return
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
  }, [vista, version, intento])

  const llaman = new Set(
    avisosPendientes.filter((a) => a.tipo === 'LLAMAR_MOZO').map((a) => a.mesaId),
  )

  const enSalon = vista === 'salon'
  const mesas = enSalon ? salon : misMesas
  const cargandoVista = enSalon ? salon === null && !errorSalon : cargando
  const errorVista = enSalon ? errorSalon : error
  const reintentar = enSalon ? () => setIntento((n) => n + 1) : recargar

  return (
    <section>
      <h1 className="font-[Fraunces] text-3xl font-semibold">Mis mesas</h1>
      <p className="mt-1 text-sm text-secundario">{sesion?.nombre}</p>

      <div className="mt-4">
        <Selector
          opciones={[
            { valor: 'mias', texto: `Mis mesas (${misMesas.length})` },
            { valor: 'salon', texto: 'Salón completo' },
          ]}
          elegida={vista}
          alElegir={setVista}
        />
      </div>

      <div className="mt-4">
        {cargandoVista ? (
          <p className="py-10 text-center text-secundario">Cargando el salón…</p>
        ) : errorVista ? (
          <div className="py-10 text-center">
            <p className="text-texto">{errorVista}</p>
            <button
              type="button"
              onClick={reintentar}
              className="mt-4 min-h-11 rounded-xl border-2 border-primario px-5 font-semibold text-primario"
            >
              Probá de nuevo
            </button>
          </div>
        ) : !enSalon && misMesas.length === 0 ? (
          <div className="flex flex-col items-center px-2 pt-10 text-center">
            <h2 className="font-[Fraunces] text-2xl font-semibold">No tenés mesas asignadas</h2>
            <p className="mt-2 text-secundario">Mientras tanto podés mirar el salón completo.</p>
            <button
              type="button"
              onClick={() => setVista('salon')}
              className="mt-6 min-h-11 w-full rounded-xl border-2 border-primario font-semibold text-primario"
            >
              Ver el salón completo
            </button>
            <p className="mt-4 text-xs text-secundario">
              En el salón completo solo mirás: por ahora no atendés mesas de otro mozo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {mesas?.map((m) => <CeldaMesa key={m.id} mesa={m} llama={llaman.has(m.id)} />)}
          </div>
        )}
      </div>
    </section>
  )
}
