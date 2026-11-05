import { useEffect, useState } from 'react'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import { atenderAviso, listarAvisos, type Aviso } from '../../../compartido/api/mozo'
import { useDatosMozo } from '../componentes/MarcoMozo'
import Selector from '../componentes/Selector'
import TarjetaAviso from '../componentes/TarjetaAviso'
import { useAhora } from '../tiempo'

type Vista = 'pendientes' | 'atendidos'

interface Recuadro {
  titulo: string
  texto: string
  yaAtendido: Aviso | null // el aviso que otro mozo atendió antes: se queda en la lista mientras dure el recuadro
}

export default function Avisos() {
  const { avisosPendientes, cargando, error, recargar, version } = useDatosMozo()
  const ahora = useAhora()
  const [vista, setVista] = useState<Vista>('pendientes')
  const [atendidos, setAtendidos] = useState<Aviso[] | null>(null)
  const [errorAtendidos, setErrorAtendidos] = useState<string | null>(null)
  const [enviando, setEnviando] = useState<number | null>(null)
  const [recuadro, setRecuadro] = useState<Recuadro | null>(null)

  // Los atendidos se piden al elegir la pestaña y cada vez que cambia version.
  useEffect(() => {
    if (vista !== 'atendidos') return
    let vigente = true
    listarAvisos(false)
      .then((avisos) => {
        if (!vigente) return
        setAtendidos(
          avisos
            .filter((a) => a.atendidoEn)
            .sort((a, b) => new Date(b.atendidoEn!).getTime() - new Date(a.atendidoEn!).getTime()),
        )
        setErrorAtendidos(null)
      })
      .catch((err) => {
        if (vigente) setErrorAtendidos(textoDelError(err))
      })
    return () => {
      vigente = false
    }
  }, [vista, version])

  // El recuadro se va solo a los 5 segundos.
  useEffect(() => {
    if (!recuadro) return
    const id = setTimeout(() => setRecuadro(null), 5000)
    return () => clearTimeout(id)
  }, [recuadro])

  async function atender(aviso: Aviso) {
    setEnviando(aviso.id)
    setRecuadro(null)
    try {
      await atenderAviso(aviso.id)
      recargar()
    } catch (err) {
      const status = statusDe(err)
      if (status === 409) {
        setRecuadro({
          titulo: 'Ya fue atendido',
          texto: `Otro mozo de la Mesa ${aviso.mesa} lo atendió antes. Ya no aparece en tus pendientes.`,
          yaAtendido: aviso,
        })
        recargar()
      } else {
        setRecuadro({ titulo: 'No se pudo atender', texto: textoDelError(err), yaAtendido: null })
        if (status === 403 || status === 404) recargar()
      }
    } finally {
      setEnviando(null)
    }
  }

  // Si el aviso ya no vino en los pendientes pero el recuadro está, se sigue mostrando con su chip.
  const fantasma = recuadro?.yaAtendido ?? null
  const pendientes =
    fantasma && !avisosPendientes.some((a) => a.id === fantasma.id)
      ? [...avisosPendientes, fantasma].sort(
          (a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime(),
        )
      : avisosPendientes

  const n = avisosPendientes.length
  const enAtendidos = vista === 'atendidos'

  return (
    <section>
      <h1 className="font-[Fraunces] text-3xl font-semibold">Avisos</h1>
      <p className="mt-1 text-sm text-secundario">
        {n} {n === 1 ? 'pendiente' : 'pendientes'}
      </p>

      <div className="mt-4">
        <Selector
          opciones={[
            { valor: 'pendientes', texto: `Pendientes (${n})` },
            { valor: 'atendidos', texto: 'Atendidos' },
          ]}
          elegida={vista}
          alElegir={setVista}
        />
      </div>

      {recuadro && (
        <div role="alert" className="mt-4 rounded-2xl border-2 border-primario bg-tarjeta p-3">
          <p className="font-semibold">{recuadro.titulo}</p>
          <p className="text-sm text-secundario">{recuadro.texto}</p>
        </div>
      )}

      <div className="mt-2">
        {!enAtendidos ? (
          cargando ? (
            <p className="py-10 text-center text-secundario">Cargando los avisos…</p>
          ) : error ? (
            <div className="py-10 text-center">
              <p>{error}</p>
              <button
                type="button"
                onClick={recargar}
                className="mt-4 min-h-11 rounded-xl border-2 border-primario px-5 font-semibold text-primario"
              >
                Probá de nuevo
              </button>
            </div>
          ) : pendientes.length === 0 ? (
            <p className="py-10 text-center text-secundario">No hay avisos pendientes.</p>
          ) : (
            <ul>
              {pendientes.map((a) => (
                <TarjetaAviso
                  key={a.id}
                  aviso={a}
                  ahora={ahora}
                  alAtender={atender}
                  estado={
                    recuadro?.yaAtendido?.id === a.id
                      ? 'ya-atendido'
                      : enviando === a.id
                        ? 'enviando'
                        : 'pendiente'
                  }
                />
              ))}
            </ul>
          )
        ) : errorAtendidos ? (
          <p className="py-10 text-center">{errorAtendidos}</p>
        ) : atendidos === null ? (
          <p className="py-10 text-center text-secundario">Cargando los avisos…</p>
        ) : atendidos.length === 0 ? (
          <p className="py-10 text-center text-secundario">No hay avisos atendidos.</p>
        ) : (
          <ul>
            {atendidos.map((a) => (
              <TarjetaAviso key={a.id} aviso={a} ahora={ahora} estado="atendido" alAtender={atender} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
