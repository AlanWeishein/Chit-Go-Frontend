import { useEffect, useRef, useState } from 'react'
import { listarAuditoria, type RegistroDeAuditoria } from '../../../compartido/api/auditoria'
import { textoDelError } from '../../../compartido/api/errores'
import type { Pagina } from '../../../compartido/api/paginacion'
import DetalleDeAuditoria, { fechaHora } from '../componentes/DetalleDeAuditoria'

// Solo lectura. La paginación y los filtros los hace el back (desde, hasta y entidad del contrato): nada de
// filtrar en el navegador lo que el back ya filtra, y el texto de "entidad" va tal cual, sin normalizar.
export default function AuditoriaAdmin() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [entidadTexto, setEntidadTexto] = useState('') // lo que se escribe
  const [entidad, setEntidad] = useState('') // lo que se manda, 400 ms después de dejar de escribir
  const [page, setPage] = useState(0)

  const [datos, setDatos] = useState<Pagina<RegistroDeAuditoria> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [claveListo, setClaveListo] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [elegido, setElegido] = useState<RegistroDeAuditoria | null>(null)

  const ultimoPedido = useRef(0)

  const invertido = desde !== '' && hasta !== '' && desde > hasta
  const clave = `${page}|${desde}|${hasta}|${entidad}|${intento}`
  const cargando = !invertido && claveListo !== clave

  // Cambiar un filtro vuelve a la página 1 en el mismo evento: así sale un solo pedido, no dos.
  function cambiarFiltro(poner: () => void) {
    poner()
    setPage(0)
  }

  useEffect(() => {
    const id = setTimeout(() => {
      setEntidad(entidadTexto.trim())
      setPage(0)
    }, 400)
    return () => clearTimeout(id)
  }, [entidadTexto])

  useEffect(() => {
    const numero = ++ultimoPedido.current // vale solo la última respuesta; también descarta si el rango es inválido
    if (invertido) return
    listarAuditoria(page, { desde, hasta, entidad })
      .then((pagina) => {
        if (numero !== ultimoPedido.current) return
        setDatos(pagina)
        setError(null)
        setClaveListo(clave)
      })
      .catch((err) => {
        if (numero !== ultimoPedido.current) return
        setError(textoDelError(err))
        setClaveListo(clave)
      })
  }, [clave, invertido, page, desde, hasta, entidad])

  const hayFiltros = desde !== '' || hasta !== '' || entidadTexto !== ''
  const filas = datos?.contenido ?? []
  const primero = datos ? datos.page * datos.size + 1 : 0
  const ultimo = datos ? datos.page * datos.size + filas.length : 0

  const campo = 'mt-1 min-h-11 rounded-xl border border-linea bg-tarjeta px-3'

  return (
    <section className="min-h-dvh bg-fondo p-8 text-texto">
      <h1 className="font-[Fraunces] text-3xl font-semibold">Auditoría</h1>
      <p className="mt-1 text-sm text-secundario">Quién hizo qué en el local, y cuándo. Solo se puede mirar.</p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="desde" className="block text-xs font-semibold text-secundario">
            Desde
          </label>
          <input
            id="desde"
            type="date"
            value={desde}
            onChange={(e) => cambiarFiltro(() => setDesde(e.target.value))}
            aria-invalid={invertido ? true : undefined}
            aria-describedby={invertido ? 'error-rango' : undefined}
            className={campo}
          />
        </div>
        <div>
          <label htmlFor="hasta" className="block text-xs font-semibold text-secundario">
            Hasta
          </label>
          <input
            id="hasta"
            type="date"
            value={hasta}
            onChange={(e) => cambiarFiltro(() => setHasta(e.target.value))}
            aria-invalid={invertido ? true : undefined}
            aria-describedby={invertido ? 'error-rango' : undefined}
            className={campo}
          />
        </div>
        <div>
          <label htmlFor="entidad" className="block text-xs font-semibold text-secundario">
            Entidad
          </label>
          <input
            id="entidad"
            type="search"
            value={entidadTexto}
            onChange={(e) => setEntidadTexto(e.target.value)}
            className={`${campo} w-56`}
          />
        </div>
        {hayFiltros && (
          <button
            type="button"
            onClick={() => {
              setDesde('')
              setHasta('')
              setEntidadTexto('')
              setEntidad('')
              setPage(0)
            }}
            className="min-h-11 px-3 font-semibold text-primario underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {invertido && (
        <p id="error-rango" role="alert" className="mt-4 rounded-xl border-2 border-primario bg-tarjeta p-3 font-semibold">
          ⚠ La fecha "desde" no puede ser mayor que "hasta".
        </p>
      )}

      {!invertido && error && datos !== null && (
        <p role="alert" className="mt-4 rounded-xl border-2 border-primario bg-tarjeta p-3 text-sm">
          ⚠ No se pudo actualizar la lista. {error}{' '}
          <button type="button" onClick={() => setIntento((n) => n + 1)} className="min-h-11 font-semibold underline">
            Probá de nuevo
          </button>
        </p>
      )}

      {invertido ? null : datos === null && error ? (
        <div className="py-16 text-center">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setIntento((n) => n + 1)}
            className="mt-4 min-h-11 rounded-xl border-2 border-primario px-5 font-semibold text-primario"
          >
            Probá de nuevo
          </button>
        </div>
      ) : datos === null ? (
        <p className="py-16 text-center text-secundario">Cargando los movimientos…</p>
      ) : filas.length === 0 ? (
        <p className="py-16 text-center text-secundario">No hay movimientos para esos filtros.</p>
      ) : (
        <>
          <div aria-busy={cargando} className={`mt-6 overflow-x-auto rounded-2xl border border-linea bg-tarjeta ${cargando ? 'opacity-60' : ''}`}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-linea text-xs tracking-wide text-secundario">
                  <th className="py-3 pr-3 pl-5 font-semibold">FECHA</th>
                  <th className="px-3 py-3 font-semibold">USUARIO</th>
                  <th className="px-3 py-3 font-semibold">ENTIDAD</th>
                  <th className="px-3 py-3 font-semibold">ACCIÓN</th>
                  <th className="py-3 pr-5 pl-3 text-right font-semibold">CAMBIO</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((r) => (
                  <tr key={r.id} className="border-b border-linea last:border-b-0">
                    <td className="py-2 pr-3 pl-5 tabular-nums">{fechaHora(r.fecha)}</td>
                    <td className="px-3 py-2">{r.usuario}</td>
                    <td className="px-3 py-2">{r.entidad}</td>
                    <td className="px-3 py-2">{r.accion}</td>
                    <td className="py-2 pr-5 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => setElegido(r)}
                        className="min-h-11 px-2 font-semibold text-primario underline"
                      >
                        Ver cambio
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-secundario">
            <p className="tabular-nums">
              Mostrando {primero}–{ultimo} de {datos.totalElementos}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || cargando}
                className="min-h-11 rounded-xl border border-linea bg-tarjeta px-4 font-semibold text-texto disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= datos.totalPaginas - 1 || cargando}
                className="min-h-11 rounded-xl border border-linea bg-tarjeta px-4 font-semibold text-texto disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}

      {elegido && <DetalleDeAuditoria key={elegido.id} registro={elegido} alCerrar={() => setElegido(null)} />}
    </section>
  )
}
