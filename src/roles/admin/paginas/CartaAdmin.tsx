import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listarCategorias,
  listarPlatosAdmin,
  type CategoriaAdmin,
  type PlatoAdmin,
} from '../../../compartido/api/admin'
import { textoDelError } from '../../../compartido/api/errores'
import iconoAnterior from '../../../compartido/ui/iconos/arrow-l-primario.svg'
import iconoElegido from '../../../compartido/ui/iconos/check-16.svg'
import iconoSiguiente from '../../../compartido/ui/iconos/chevron-r-primario.svg'
import iconoCategorias from '../../../compartido/ui/iconos/list.svg'
import iconoEditar from '../../../compartido/ui/iconos/pencil.svg'
import iconoPlato from '../../../compartido/ui/iconos/plate-18.svg'
import iconoNuevo from '../../../compartido/ui/iconos/plus-blanco.svg'
import iconoBuscar from '../../../compartido/ui/iconos/search-18.svg'
import iconoDestacado from '../../../compartido/ui/iconos/star.svg'
import iconoEtiqueta from '../../../compartido/ui/iconos/tag.svg'
import InterruptorDeDisponibilidad from '../../../compartido/ui/InterruptorDeDisponibilidad'
import { normalizar } from '../../../compartido/ui/normalizar'
import { useCambioDeDisponibilidad } from '../../../compartido/ui/useCambioDeDisponibilidad'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import { cantidadDePlatos, precio } from '../../cliente/formato'

const POR_PAGINA = 7

const rotulo = 'text-[11px] leading-[normal] font-semibold tracking-[0.66px] text-secundario uppercase'
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const botonContorno = `flex h-11 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-[.38] ${foco}`

// La imagen del plato es una URL o una ruta del front que carga el Admin. Si no hay o no carga, va el ícono del Mockup.
function ImagenDelPlato({ url }: { url: string | null }) {
  const [fallo, setFallo] = useState(false)
  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-linea">
      {url && !fallo ? (
        <img src={url} alt="" width={40} height={40} className="size-full object-cover" onError={() => setFallo(true)} />
      ) : (
        <img src={iconoPlato} alt="" width={18} height={18} />
      )}
    </span>
  )
}

// P-14, la carta del Admin (HU-12). La lista es la completa de GET /admin/platos y el filtro y el paginado se hacen
// acá, en el navegador. El switch de disponible y el diálogo de pedidos afectados son los de la P-10.
export default function CartaAdmin() {
  const [platos, setPlatos] = useState<PlatoAdmin[] | null>(null)
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([])
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const [pagina, setPagina] = useState(0)
  const ultimoPedido = useRef(0)

  function recargar() {
    const numero = ++ultimoPedido.current
    return Promise.all([listarPlatosAdmin(), listarCategorias()])
      .then(([lista, cats]) => {
        if (numero !== ultimoPedido.current) return
        setPlatos(lista)
        setCategorias(cats)
        setErrorLista(null)
      })
      .catch((err) => {
        if (numero === ultimoPedido.current) setErrorLista(textoDelError(err))
      })
  }

  useEffect(() => {
    recargar()
  }, [])

  const { alternar, cambiando, aviso, exito, dialogo, refDelSwitch } = useCambioDeDisponibilidad(recargar)

  // Buscar o cambiar de categoría vuelve a la primera página.
  function buscar(texto: string) {
    setBusqueda(texto)
    setPagina(0)
  }
  function elegirCategoria(id: number | null) {
    setCategoriaId(id)
    setPagina(0)
  }

  const todos = platos ?? []
  const texto = normalizar(busqueda.trim())
  const filtrados = todos.filter(
    (p) =>
      (categoriaId === null || p.categoria.id === categoriaId) && (texto === '' || normalizar(p.nombre).includes(texto)),
  )
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  // Si la lista se achica al recargar, la página no se queda más allá de la última.
  const paginaActual = Math.min(pagina, totalPaginas - 1)
  const visibles = filtrados.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA)

  return (
    <section className="flex min-h-full flex-col gap-[18px] bg-fondo px-8 pt-7 pb-6 font-inter text-texto">
      <header className="flex min-h-11 items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 leading-[normal]">
          <h1 className="titulo text-[25px]">Menú</h1>
          {platos && (
            <p className="text-[13px] text-secundario">
              {cantidadDePlatos(todos.length)} · {categorias.length === 1 ? '1 categoría' : `${categorias.length} categorías`}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2.5">
          <Link to="/admin/menu/categorias" className={botonContorno}>
            <img src={iconoCategorias} alt="" width={20} height={20} />
            Categorías
          </Link>
          <Link
            to="/admin/menu/nuevo"
            className={`flex h-11 items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold text-texto-boton ${foco}`}
          >
            <img src={iconoNuevo} alt="" width={20} height={20} />
            Nuevo plato
          </Link>
        </div>
      </header>

      {aviso && <AvisoDeFallo>{aviso}</AvisoDeFallo>}
      {exito && (
        <p role="status" className="rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3 text-[15px] font-semibold">
          {exito}
        </p>
      )}

      {platos === null && !errorLista ? (
        <p className="py-10 text-center text-secundario">Cargando la carta…</p>
      ) : errorLista && platos === null ? (
        <div className="py-10 text-center">
          <p role="alert">{errorLista}</p>
          <button type="button" onClick={recargar} className={`mt-4 ${botonContorno} mx-auto`}>
            Probá de nuevo
          </button>
        </div>
      ) : todos.length === 0 ? (
        <p className="py-10 text-center text-secundario">Todavía no hay platos en la carta.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-[240px] shrink-0">
              <img
                src={iconoBuscar}
                alt=""
                width={18}
                height={18}
                className="pointer-events-none absolute top-1/2 left-[14px] -translate-y-1/2"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => buscar(e.target.value)}
                placeholder="Buscar plato"
                aria-label="Buscar plato"
                className={`h-12 w-full rounded-xl border-[1.25px] border-secundario bg-tarjeta pr-[14px] pl-[42px] text-[15px] text-texto placeholder:text-secundario ${foco}`}
              />
            </div>
            {[{ id: null, nombre: 'Todos' }, ...categorias].map((c) => {
              const activa = categoriaId === c.id
              return (
                <button
                  key={c.id ?? 'todos'}
                  type="button"
                  onClick={() => elegirCategoria(c.id)}
                  aria-pressed={activa}
                  className={`flex h-11 items-center rounded-full text-[13px] ${foco} ${
                    activa ? 'gap-1.5 bg-suave pr-3.5 pl-2.5 font-medium' : 'border border-secundario px-3.5'
                  }`}
                >
                  {activa && <img src={iconoElegido} alt="" width={16} height={16} />}
                  {c.nombre}
                </button>
              )
            })}
          </div>

          {errorLista && (
            <p role="alert" className="text-[13px] text-secundario">
              {errorLista}{' '}
              <button type="button" onClick={recargar} className={`inline-flex min-h-11 items-center font-semibold underline ${foco}`}>
                Probá de nuevo
              </button>
            </p>
          )}

          {filtrados.length === 0 ? (
            <p className="py-10 text-center text-secundario">No hay platos con ese filtro.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] table-fixed border-collapse text-left text-[13px] leading-[normal]">
                  <thead>
                    <tr className={`h-[35px] border-b border-linea ${rotulo}`}>
                      <th className="px-2.5 font-semibold">Plato</th>
                      <th className="w-[110px] px-2.5 font-semibold">Categoría</th>
                      <th className="w-[90px] px-2.5 font-semibold">Precio</th>
                      <th className="w-[130px] px-2.5 font-semibold">Etiquetas</th>
                      <th className="w-[150px] px-2.5 font-semibold">Destacado</th>
                      <th className="w-[120px] px-2.5 font-semibold">Disponible</th>
                      <th className="w-[110px] px-2.5">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((p) => (
                      <tr key={p.id} className="h-[59px] last:h-[58px] not-first:border-t not-first:border-linea">
                        <td className="px-2.5">
                          <div className="flex items-center gap-1.5">
                            <ImagenDelPlato key={p.imagenUrl ?? ''} url={p.imagenUrl} />
                            <div className="flex min-w-0 flex-col">
                              <p className="truncate font-medium">{p.nombre}</p>
                              {p.descripcion && <p className="truncate text-secundario">{p.descripcion}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-2.5">{p.categoria.nombre}</td>
                        <td className="px-2.5">{precio(p.precio)}</td>
                        <td className="px-2.5">
                          {p.etiquetas.length === 0 ? (
                            '—'
                          ) : (
                            <ul className="flex flex-wrap gap-1 py-1">
                              {p.etiquetas.map((e) => (
                                <li
                                  key={e.id}
                                  className="inline-flex items-center gap-1 rounded-md bg-linea py-1 pr-[9px] pl-[7px] text-xs leading-[normal] font-medium whitespace-nowrap"
                                >
                                  <img src={iconoEtiqueta} alt="" width={14} height={14} />
                                  {e.nombre}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="px-2.5">
                          {p.destacado ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-suave py-1 pr-[9px] pl-[7px] text-xs leading-[normal] font-medium whitespace-nowrap">
                              <img src={iconoDestacado} alt="" width={14} height={14} />
                              Menú del día
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-2.5">
                          <InterruptorDeDisponibilidad
                            ref={refDelSwitch(p.id)}
                            nombre={p.nombre}
                            activo={p.disponible}
                            textoActivo="Sí"
                            textoInactivo="No"
                            deshabilitado={cambiando === p.id}
                            alTocar={() => alternar(p)}
                          />
                        </td>
                        <td className="px-2.5">
                          <Link
                            to={`/admin/menu/${p.id}`}
                            aria-label={`Editar ${p.nombre}`}
                            className={`flex h-11 items-center justify-center gap-2 rounded-[14px] text-[15px] font-semibold underline ${foco}`}
                          >
                            <img src={iconoEditar} alt="" width={20} height={20} />
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-[13px] text-secundario">
                  Mostrando {visibles.length} de {filtrados.length}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPagina(paginaActual - 1)}
                    disabled={paginaActual === 0}
                    className={botonContorno}
                  >
                    <img src={iconoAnterior} alt="" width={20} height={20} />
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPagina(paginaActual + 1)}
                    disabled={paginaActual >= totalPaginas - 1}
                    className={botonContorno}
                  >
                    <img src={iconoSiguiente} alt="" width={20} height={20} />
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {dialogo}
    </section>
  )
}
