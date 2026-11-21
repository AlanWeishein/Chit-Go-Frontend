import { useEffect, useRef, useState } from 'react'
import { ACCIONES, listarAuditoria, textoDeAccion, type RegistroDeAuditoria } from '../../../compartido/api/auditoria'
import { textoDelError } from '../../../compartido/api/errores'
import type { Pagina } from '../../../compartido/api/paginacion'
import type { Ambito } from '../../../compartido/api/reportes'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import iconoAnterior from '../../../compartido/ui/iconos/arrow-l-primario.svg'
import iconoDesplegar from '../../../compartido/ui/iconos/chevron-d.svg'
import iconoSiguiente from '../../../compartido/ui/iconos/chevron-r-primario.svg'
import iconoQuitar from '../../../compartido/ui/iconos/x.svg'
import DetalleDeAuditoria, { cambioLegible, fechaHoraCorta, nombreDeEntidad } from '../componentes/DetalleDeAuditoria'

// Auditoría (P-18, HU-15). Solo lectura, para el Admin y el Gerente/Dueño (HU-16): cada uno pide a su ruta del back.
// La paginación y los filtros los hace el back; nada se filtra en el navegador.

// Las filas que entran en 1280 × 800 con los filtros y la paginación a la vista, como el nodo.
const POR_PAGINA = 8

type Fecha = 'hoy' | '7' | '30' | 'todas'

const FECHAS: { valor: Fecha; texto: string }[] = [
  { valor: 'hoy', texto: 'Hoy' },
  { valor: '7', texto: 'Últimos 7 días' },
  { valor: '30', texto: 'Últimos 30 días' },
  { valor: 'todas', texto: 'Todas' },
]

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const botonContorno = `flex h-11 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-[.38] ${foco}`
const rotulo = 'text-[11px] leading-[normal] font-semibold tracking-[0.66px] text-secundario uppercase'
const caja = `h-12 rounded-[14px] border-[1.25px] border-secundario bg-tarjeta text-[15px] text-texto ${foco}`

function aTexto(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// "Últimos 7 días" es hoy y los 6 anteriores. "Todas" no manda fechas.
function rangoDe(fecha: Fecha): { desde?: string; hasta?: string } {
  if (fecha === 'todas') return {}
  const hoy = new Date()
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (fecha === 'hoy' ? 0 : Number(fecha) - 1))
  return { desde: aTexto(desde), hasta: aTexto(hoy) }
}

export default function AuditoriaAdmin() {
  const { sesion } = useSesion()
  const ambito: Ambito = sesion?.rol === 'GERENTE_DUENO' ? 'gerente' : 'admin'

  const [accion, setAccion] = useState('') // '' = todas
  const [fecha, setFecha] = useState<Fecha>('hoy')
  // El back filtra por usuarioId y no hay un listado de todos los usuarios del local: se elige desde una fila.
  const [usuario, setUsuario] = useState<{ id: number; nombre: string } | null>(null)
  const [page, setPage] = useState(0)

  const [datos, setDatos] = useState<Pagina<RegistroDeAuditoria> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [claveListo, setClaveListo] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [elegido, setElegido] = useState<RegistroDeAuditoria | null>(null)

  const ultimoPedido = useRef(0)

  const clave = `${ambito}|${page}|${accion}|${fecha}|${usuario?.id ?? ''}|${intento}`
  const cargando = claveListo !== clave

  useEffect(() => {
    const numero = ++ultimoPedido.current // vale solo la última respuesta
    listarAuditoria(ambito, page, POR_PAGINA, { accion: accion || undefined, usuarioId: usuario?.id, ...rangoDe(fecha) })
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
  }, [clave, ambito, page, accion, fecha, usuario])

  // Cambiar un filtro vuelve a la página 1 en el mismo evento: así sale un solo pedido, no dos.
  function cambiarFiltro(poner: () => void) {
    poner()
    setPage(0)
  }

  const filas = datos?.contenido ?? []
  const primero = datos && filas.length > 0 ? datos.page * datos.size + 1 : 0
  const ultimo = datos ? datos.page * datos.size + filas.length : 0

  return (
    <section className="flex min-h-full flex-col gap-[18px] bg-fondo px-8 pt-7 pb-6 font-inter text-texto">
      <header className="flex flex-col gap-0.5 leading-[normal]">
        <h1 className="titulo text-[25px]">Auditoría</h1>
        <p className="text-[13px] text-secundario">Quién hizo cada acción, cuándo y qué cambió</p>
      </header>

      <div className="flex flex-wrap items-center gap-2.5">
        {usuario ? (
          <button
            type="button"
            onClick={() => cambiarFiltro(() => setUsuario(null))}
            aria-label={`Quitar el filtro de usuario: ${usuario.nombre}`}
            className={`${caja} flex items-center gap-2 px-[15px]`}
          >
            Usuario: {usuario.nombre}
            <img src={iconoQuitar} alt="" width={18} height={18} />
          </button>
        ) : (
          <p className={`${caja} flex items-center border-dashed px-[15px] text-secundario`}>
            Usuario: Todos · tocá un nombre para filtrar
          </p>
        )}

        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-[15px] -translate-y-1/2 text-[15px]">
            Acción:
          </span>
          <select
            aria-label="Acción"
            value={accion}
            onChange={(e) => cambiarFiltro(() => setAccion(e.target.value))}
            className={`${caja} w-[260px] appearance-none pr-10 pl-[72px]`}
          >
            <option value="">Todas</option>
            {Object.entries(ACCIONES).map(([codigo, texto]) => (
              <option key={codigo} value={codigo}>
                {texto}
              </option>
            ))}
          </select>
          <img src={iconoDesplegar} alt="" width={18} height={18} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2" />
        </div>

        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-[15px] -translate-y-1/2 text-[15px]">
            Fecha:
          </span>
          <select
            aria-label="Fecha"
            value={fecha}
            onChange={(e) => cambiarFiltro(() => setFecha(e.target.value as Fecha))}
            className={`${caja} w-[230px] appearance-none pr-10 pl-[66px]`}
          >
            {FECHAS.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.texto}
              </option>
            ))}
          </select>
          <img src={iconoDesplegar} alt="" width={18} height={18} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2" />
        </div>
      </div>

      {error && datos !== null && (
        <p role="alert" className="text-[13px] text-secundario">
          No se pudo actualizar la lista. {error}{' '}
          <button type="button" onClick={() => setIntento((n) => n + 1)} className={`inline-flex min-h-11 items-center font-semibold underline ${foco}`}>
            Probá de nuevo
          </button>
        </p>
      )}

      {datos === null && error ? (
        <div className="py-10 text-center">
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setIntento((n) => n + 1)} className={`mt-4 ${botonContorno} mx-auto`}>
            Probá de nuevo
          </button>
        </div>
      ) : datos === null ? (
        <p className="py-10 text-center text-secundario">Cargando la auditoría…</p>
      ) : filas.length === 0 ? (
        <p aria-busy={cargando} className="py-10 text-center text-secundario">
          No hay acciones con ese filtro
        </p>
      ) : (
        <>
          <div aria-busy={cargando} className={`overflow-x-auto ${cargando ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[900px] table-fixed border-collapse text-left text-[13px] leading-[normal]">
              <thead>
                <tr className={`h-[35px] border-b border-linea ${rotulo}`}>
                  <th className="w-[120px] px-2.5 font-semibold">Fecha y hora</th>
                  <th className="w-[170px] px-2.5 font-semibold">Usuario</th>
                  <th className="w-[150px] px-2.5 font-semibold">Acción</th>
                  <th className="w-[130px] px-2.5 font-semibold">Entidad</th>
                  <th className="w-[150px] px-2.5 font-semibold">Antes</th>
                  <th className="px-2.5 font-semibold">Después</th>
                  <th className="w-[56px] px-2.5">
                    <span className="sr-only">Detalle</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((r) => {
                  const { antes, despues } = cambioLegible(r)
                  const entidad = nombreDeEntidad(r)
                  return (
                    <tr key={r.id} className="h-[49px] not-first:border-t not-first:border-linea">
                      <td className="px-2.5 tabular-nums">{fechaHoraCorta(r.creadoEn)}</td>
                      <td className="px-2.5">
                        <button
                          type="button"
                          onClick={() => cambiarFiltro(() => setUsuario({ id: r.usuarioId, nombre: r.usuario }))}
                          title={`Ver solo las acciones de ${r.usuario}`}
                          className={`inline-flex min-h-11 max-w-full items-center truncate text-left hover:underline ${foco}`}
                        >
                          {r.usuario}
                        </button>
                      </td>
                      <td className="truncate px-2.5" title={textoDeAccion(r.accion)}>
                        {textoDeAccion(r.accion)}
                      </td>
                      <td className="truncate px-2.5" title={entidad}>
                        {entidad}
                      </td>
                      <td className="truncate px-2.5 text-secundario" title={antes}>
                        {antes}
                      </td>
                      <td className="truncate px-2.5" title={despues}>
                        {despues}
                      </td>
                      <td className="px-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setElegido(r)}
                          aria-label={`Ver el detalle: ${textoDeAccion(r.accion)}, ${entidad}`}
                          className={`inline-flex min-h-11 items-center font-semibold text-primario underline ${foco}`}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-[13px] text-secundario tabular-nums">
              Mostrando {primero} a {ultimo} de {datos.totalElementos}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || cargando} className={botonContorno}>
                <img src={iconoAnterior} alt="" width={20} height={20} />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= datos.totalPaginas - 1 || cargando}
                className={botonContorno}
              >
                <img src={iconoSiguiente} alt="" width={20} height={20} />
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
