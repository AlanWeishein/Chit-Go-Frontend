import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  borrarCategoria,
  borrarEtiqueta,
  crearCategoria,
  crearEtiqueta,
  listarCategorias,
  listarEtiquetas,
  ordenarCategorias,
  renombrarCategoria,
  renombrarEtiqueta,
  type CategoriaAdmin,
  type EtiquetaAdmin,
} from '../../../compartido/api/admin'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import Paginacion from '../../../compartido/ui/Paginacion'
import iconoAlerta from '../../../compartido/ui/iconos/alert.svg'
import iconoVolver from '../../../compartido/ui/iconos/arrow-l.svg'
import iconoFlecha from '../../../compartido/ui/iconos/arrow-r.svg'
import iconoGuardar from '../../../compartido/ui/iconos/check-blanco.svg'
import iconoEditar from '../../../compartido/ui/iconos/pencil.svg'
import iconoMas from '../../../compartido/ui/iconos/plus.svg'
import iconoMasBlanco from '../../../compartido/ui/iconos/plus-blanco.svg'
import iconoBorrar from '../../../compartido/ui/iconos/trash.svg'
import iconoCancelar from '../../../compartido/ui/iconos/x.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import DialogoDeConfirmacion from '../componentes/DialogoDeConfirmacion'
import ErrorDeCampo from '../componentes/ErrorDeCampo'
import { useGuardiaDeSalida } from '../guardiaDeSalida'

// Los largos del esquema del back (CategoriaRequest y EtiquetaRequest): uno más da el 400 genérico.
const CATEGORIA_MAX = 80
const ETIQUETA_MAX = 60
const ERROR_NOMBRE = 'Poné un nombre' // el de HU-12, el mismo que da el back
// El paginado lo hace el front sobre la lista entera, como la carta (P-14). Decidido por Eze el 23/11 (ST-33).
// Etiquetas de a 7: así la tarjeta mide lo mismo que la de 8 categorías a 1280 × 800 (con 12 llegaba a ~990 px).
const CATEGORIAS_POR_PAGINA = 8
const ETIQUETAS_POR_PAGINA = 7

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const rotulo = 'text-[13px] leading-[normal] font-medium'
const botonContorno = `flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario font-semibold text-primario disabled:opacity-[.38] ${foco}`
const botonLleno = `flex items-center justify-center gap-2 rounded-[14px] bg-primario font-semibold text-texto-boton disabled:opacity-[.38] ${foco}`
const campo = (conError: boolean) =>
  `h-12 w-full rounded-xl bg-tarjeta px-3.5 text-[15px] leading-[normal] text-texto placeholder:text-secundario ${
    conError ? 'border-2 border-primario' : 'border-[1.25px] border-secundario'
  } ${foco}`

// `vez` cambia siempre: dos avisos iguales seguidos vuelven a contar los 5 segundos (como en GestionMesasPage).
interface Aviso {
  texto: string
  error: boolean
  vez: number
}
type Avisar = (texto: string, error?: boolean) => void

function porNombre(a: EtiquetaAdmin, b: EtiquetaAdmin) {
  return a.nombre.localeCompare(b.nombre, 'es')
}

// La página que corresponde y el pedazo de la lista que se ve. Si la página quedó más allá de la última (se borró
// la única que había), se acomoda sola.
function paginar<T>(lista: T[], pagina: number, porPagina: number) {
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina))
  const actual = Math.min(pagina, totalPaginas - 1)
  return { totalPaginas, actual, desde: actual * porPagina, visibles: lista.slice(actual * porPagina, (actual + 1) * porPagina) }
}

// La flecha de Subir y Bajar es arrow-r.svg, que viene en blanco para los botones llenos. Acá va en el marrón del
// botón, así que se usa como máscara (como los íconos del menú de MarcoAdmin) y se gira: -90° arriba, 90° abajo.
function Flecha({ hacia }: { hacia: 'arriba' | 'abajo' }) {
  const mascara = `url("${iconoFlecha}") center / contain no-repeat`
  return (
    <span
      aria-hidden="true"
      className={`size-[18px] shrink-0 bg-primario ${hacia === 'arriba' ? '-rotate-90' : 'rotate-90'}`}
      style={{ mask: mascara, WebkitMask: mascara }}
    />
  )
}

interface Datos {
  categorias: CategoriaAdmin[]
  etiquetas: EtiquetaAdmin[]
}

// P-14c, categorías y etiquetas (HU-12). Ruta: /admin/menu/categorias. El orden de las categorías se mueve en
// pantalla y se manda de una vez con "Guardar cambios"; crear, renombrar y borrar se guardan en el momento.
export default function CategoriasYEtiquetas() {
  const [datos, setDatos] = useState<Datos | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    Promise.all([listarCategorias(), listarEtiquetas()])
      .then(([categorias, etiquetas]) => vigente && setDatos({ categorias, etiquetas }))
      .catch((err) => vigente && setError(textoDelError(err)))
    return () => {
      vigente = false
    }
  }, [intento])

  if (error) {
    return (
      <section className="flex min-h-full flex-col items-center gap-4 bg-fondo px-8 py-10 font-inter text-texto">
        <p role="alert">{error}</p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              setError(null)
              setIntento((n) => n + 1)
            }}
            className={`h-11 px-[18px] text-[15px] ${botonContorno}`}
          >
            Probá de nuevo
          </button>
          <Link to="/admin/menu" className={`h-11 px-[18px] text-[15px] ${botonContorno}`}>
            Volver al menú
          </Link>
        </div>
      </section>
    )
  }
  if (!datos) {
    return (
      <section className="min-h-full bg-fondo px-8 py-10 font-inter text-secundario">
        <p className="text-center">Cargando las categorías…</p>
      </section>
    )
  }
  return <Pantalla datos={datos} />
}

function Pantalla({ datos }: { datos: Datos }) {
  const navigate = useNavigate()
  // `base` es el orden que tiene el back; `orden`, el que se ve. Subir y Bajar solo tocan `orden`.
  const [base, setBase] = useState(datos.categorias)
  const [orden, setOrden] = useState(datos.categorias)
  const [pagina, setPagina] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [errorOrden, setErrorOrden] = useState<string | null>(null)
  const [editando, setEditando] = useState<number | null>(null)
  const [aBorrar, setABorrar] = useState<CategoriaAdmin | null>(null)
  const [borrando, setBorrando] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  // Solo para Subir, Bajar y Cancelar: los demás cambios los anuncia el aviso, que es un role="status".
  const [anuncio, setAnuncio] = useState('')
  // Se intentó salir con el orden sin guardar: guarda cómo seguir si el Admin elige salir.
  const [salida, setSalida] = useState<{ continuar: () => void } | null>(null)

  const lista = useRef<HTMLOListElement>(null)
  const refSeguirAca = useRef<HTMLButtonElement>(null)
  const refGuardar = useRef<HTMLButtonElement>(null)
  const vez = useRef(0)
  const pedirFoco = useRef<{ id: number; boton: 'subir' | 'bajar' | 'editar' } | null>(null)
  // Después de Cancelar o de Guardar, el botón que se tocó ya no está: el foco pasa a la lista.
  const focoALaLista = useRef(false)
  // Lo mismo después de borrar, pero recién cuando el <dialog> se cerró: al cerrarse, el navegador le devuelve el
  // foco a quien lo abrió (el Borrar que ya no está) y pisaría el de un useLayoutEffect.
  const focoTrasBorrar = useRef(false)

  const hayCambios = orden.some((c, i) => c.id !== base[i]?.id)
  const { totalPaginas, actual, desde, visibles } = paginar(orden, pagina, CATEGORIAS_POR_PAGINA)

  const avisar = useCallback<Avisar>((texto, error = false) => {
    setAviso({ texto, error, vez: ++vez.current })
  }, [])

  // El aviso se va solo a los 5 segundos.
  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(id)
  }, [aviso])

  // El marco consulta esta guardia antes de navegar desde su menú o de cerrar la sesión.
  const pedirSalida = useCallback((continuar: () => void) => {
    setSalida({ continuar })
    return true
  }, [])
  useGuardiaDeSalida(hayCambios ? pedirSalida : null)

  // Recargar o cerrar la pestaña: el aviso es el del navegador.
  useEffect(() => {
    if (!hayCambios) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [hayCambios])

  // Al mover una fila, el botón que se tocó sigue con el foco, también si la fila pasó a otra página. Si quedó
  // deshabilitado (la fila llegó a un extremo), el foco pasa al otro. Al cerrar la edición vuelve a Editar.
  useLayoutEffect(() => {
    if (focoALaLista.current) {
      focoALaLista.current = false
      lista.current?.querySelector<HTMLButtonElement>('[data-accion]:not(:disabled)')?.focus()
      return
    }
    const pedido = pedirFoco.current
    if (!pedido) return
    pedirFoco.current = null
    const fila = lista.current?.querySelector(`[data-categoria="${pedido.id}"]`)
    const elegido = fila?.querySelector<HTMLButtonElement>(`[data-accion="${pedido.boton}"]`)
    const otro = fila?.querySelector<HTMLButtonElement>(`[data-accion="${pedido.boton === 'subir' ? 'bajar' : 'subir'}"]`)
    ;(elegido && !elegido.disabled ? elegido : otro)?.focus()
  }, [orden, base, editando])

  useEffect(() => {
    if (!focoTrasBorrar.current) return
    focoTrasBorrar.current = false
    lista.current?.querySelector<HTMLButtonElement>('[data-accion]:not(:disabled)')?.focus()
  }, [orden])

  useEffect(() => {
    if (salida) refSeguirAca.current?.focus()
  }, [salida])

  // `i` es el lugar en la lista entera. La página pasa a la del lugar nuevo: así sigue a la categoría que se movió.
  function mover(i: number, delta: -1 | 1) {
    const j = i + delta
    if (j < 0 || j >= orden.length) return
    const movida = orden[i]
    const copia = [...orden]
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
    pedirFoco.current = { id: movida.id, boton: delta < 0 ? 'subir' : 'bajar' }
    setOrden(copia)
    setPagina(Math.floor(j / CATEGORIAS_POR_PAGINA))
    setErrorOrden(null)
    setSalida(null)
    setAnuncio(`${movida.nombre}: lugar ${j + 1} de ${orden.length}`)
  }

  function cancelar() {
    focoALaLista.current = true
    setOrden(base)
    setErrorOrden(null)
    setSalida(null)
    setAnuncio('Se descartó el orden nuevo')
  }

  // Una sola llamada con todos los ids, en el orden que se ve.
  async function guardarOrden(): Promise<boolean> {
    if (guardando) return false
    setGuardando(true)
    setErrorOrden(null)
    try {
      await ordenarCategorias(orden.map((c) => c.id))
      focoALaLista.current = true
      setBase(orden)
      avisar('Listo: se guardó el orden.')
      return true
    } catch (err) {
      setErrorOrden(textoDelError(err))
      return false
    } finally {
      setGuardando(false)
    }
  }

  async function guardarYSalir() {
    if (salida && (await guardarOrden())) salida.continuar()
  }

  function irA(destino: string) {
    if (hayCambios) pedirSalida(() => navigate(destino))
    else navigate(destino)
  }

  // El back la pone al final del orden: acá también, sin perder lo que se movió, y la lista pasa a la última
  // página para que se vea.
  function agregarCategoria(nueva: CategoriaAdmin) {
    setBase((b) => [...b, nueva])
    setOrden((o) => [...o, nueva])
    setPagina(Math.floor(orden.length / CATEGORIAS_POR_PAGINA))
    avisar(`Se agregó la categoría ${nueva.nombre}`)
  }

  function cerrarEdicion(id: number) {
    pedirFoco.current = { id, boton: 'editar' }
    setEditando(null)
  }

  // El nombre cambia en `base` y en `orden` sin tocar el lugar de nadie: un orden sin guardar se mantiene.
  async function renombrar(c: CategoriaAdmin, nombre: string) {
    const nueva = await renombrarCategoria(c.id, nombre)
    const cambiar = (l: CategoriaAdmin[]) => l.map((x) => (x.id === c.id ? { ...x, nombre: nueva.nombre } : x))
    setBase(cambiar)
    setOrden(cambiar)
    cerrarEdicion(c.id)
    avisar(`Se guardó la categoría ${nueva.nombre}`)
  }

  // Sale de `base` y de `orden`: el próximo "Guardar cambios" manda todas las que existen, como pide el back.
  function sacar(id: number) {
    const sin = (l: CategoriaAdmin[]) => l.filter((x) => x.id !== id)
    focoTrasBorrar.current = true
    setBase(sin)
    setOrden(sin)
  }

  async function confirmarBorrado() {
    if (!aBorrar || borrando) return
    const c = aBorrar
    setBorrando(true)
    try {
      await borrarCategoria(c.id)
      sacar(c.id)
      avisar(`Se borró la categoría ${c.nombre}`)
    } catch (err) {
      // 409: tiene platos y se queda. 404: ya no existe, así que también se saca de la lista.
      if (statusDe(err) === 404) sacar(c.id)
      avisar(textoDelError(err), true)
    } finally {
      setBorrando(false)
      setABorrar(null)
    }
  }

  return (
    <section className="flex min-h-full flex-col gap-[18px] bg-fondo px-8 pt-7 pb-6 font-inter text-texto">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5 leading-[normal]">
          <h1 className="titulo truncate text-[25px]">Categorías y etiquetas</h1>
          <p className="text-[13px] text-secundario">Menú › Categorías y etiquetas · cada cambio queda en la auditoría</p>
        </div>
        <button
          type="button"
          onClick={() => irA('/admin/menu')}
          disabled={guardando}
          className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] text-[15px] font-semibold underline disabled:opacity-[.38] ${foco}`}
        >
          <img src={iconoVolver} alt="" width={20} height={20} />
          Volver al menú
        </button>
      </header>

      {/* Pegado arriba de la zona que scrollea: se ve aunque se haya tocado un botón de abajo de todo. */}
      {aviso && (
        <div className="sticky top-3 z-10">
          {aviso.error ? (
            <AvisoDeFallo key={aviso.vez}>{aviso.texto}</AvisoDeFallo>
          ) : (
            <p
              key={aviso.vez}
              role="status"
              className="rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3 text-[15px] font-semibold"
            >
              {aviso.texto}
            </p>
          )}
        </div>
      )}

      <div className="flex items-start gap-6">
        <section aria-labelledby="categorias-titulo" className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-2xl bg-linea p-[18px]">
          <h2 id="categorias-titulo" className="text-[16px] leading-[normal] font-semibold">
            Categorías
          </h2>
          <p className="text-[13px] leading-[normal]">El orden es el que ve el cliente en la carta.</p>
          {orden.length === 0 ? (
            <p className="text-[13px] leading-[normal] text-secundario">Todavía no hay categorías.</p>
          ) : (
            <>
              <ol ref={lista} start={desde + 1} className="flex flex-col gap-2.5">
                {visibles.map((c, k) => {
                  const i = desde + k
                  return (
                    <li
                      key={c.id}
                      data-categoria={c.id}
                      className="flex min-h-14 items-center justify-between gap-2 rounded-xl bg-tarjeta py-1.5 pr-2 pl-4"
                    >
                      {editando === c.id ? (
                        <EdicionDeNombre
                          id={`categoria-${c.id}`}
                          rotulo={`Nombre de la categoría ${c.nombre}`}
                          inicial={c.nombre}
                          max={CATEGORIA_MAX}
                          alGuardar={(nombre) => renombrar(c, nombre)}
                          alCancelar={() => cerrarEdicion(c.id)}
                        />
                      ) : (
                        <>
                          <span className="min-w-0 truncate text-[15px] leading-[normal] font-medium">{c.nombre}</span>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              data-accion="subir"
                              aria-label={`Subir ${c.nombre}`}
                              disabled={i === 0 || guardando}
                              onClick={() => mover(i, -1)}
                              className={`h-11 px-3 text-[14px] ${botonContorno}`}
                            >
                              <Flecha hacia="arriba" />
                              Subir
                            </button>
                            <button
                              type="button"
                              data-accion="bajar"
                              aria-label={`Bajar ${c.nombre}`}
                              disabled={i === orden.length - 1 || guardando}
                              onClick={() => mover(i, 1)}
                              className={`h-11 px-3 text-[14px] ${botonContorno}`}
                            >
                              <Flecha hacia="abajo" />
                              Bajar
                            </button>
                            <button
                              type="button"
                              data-accion="editar"
                              aria-label={`Editar ${c.nombre}`}
                              disabled={guardando}
                              onClick={() => setEditando(c.id)}
                              className={`h-11 px-3 text-[14px] ${botonContorno}`}
                            >
                              <img src={iconoEditar} alt="" width={18} height={18} />
                              Editar
                            </button>
                            <button
                              type="button"
                              data-accion="borrar"
                              aria-label={`Borrar ${c.nombre}`}
                              disabled={guardando}
                              onClick={() => setABorrar(c)}
                              className={`h-11 px-3 text-[14px] ${botonContorno}`}
                            >
                              <img src={iconoBorrar} alt="" width={18} height={18} />
                              Borrar
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  )
                })}
              </ol>
              <Paginacion
                pagina={actual}
                totalPaginas={totalPaginas}
                mostrando={visibles.length}
                total={orden.length}
                alCambiar={setPagina}
              />
            </>
          )}
          <NuevaCategoria onCreada={agregarCategoria} />
        </section>

        <TarjetaDeEtiquetas iniciales={datos.etiquetas} avisar={avisar} />
      </div>

      {/* La barra del orden solo está mientras hay un orden sin guardar. Propuesto por Claude Code y confirmado
          por Eze el 23/11 (ST-33): siempre a la vista, deshabilitada, parecía rota. */}
      {hayCambios && (
        <div className="flex items-center justify-end gap-2.5">
          <p className="mr-auto text-[13px] leading-[normal] font-medium">Cambiaste el orden y todavía no lo guardaste.</p>
          <button
            type="button"
            onClick={cancelar}
            disabled={guardando}
            className={`h-12 px-[18px] text-[15px] ${botonContorno}`}
          >
            <img src={iconoCancelar} alt="" width={20} height={20} />
            Cancelar
          </button>
          <button
            type="button"
            ref={refGuardar}
            onClick={() => void guardarOrden()}
            disabled={guardando}
            className={`h-12 px-[18px] text-[15px] ${botonLleno}`}
          >
            <img src={iconoGuardar} alt="" width={20} height={20} />
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      )}

      {errorOrden && <AvisoDeFallo>{errorOrden}</AvisoDeFallo>}
      {salida && hayCambios && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3.5 text-texto"
        >
          <div className="flex items-start gap-3">
            <img src={iconoAlerta} alt="" width={20} height={20} className="shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[15px] font-semibold">Tenés un orden sin guardar</p>
              <p className="text-[13px] leading-[1.4]">Si salís ahora, las categorías vuelven al orden de antes.</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2.5">
            <button
              type="button"
              onClick={() => salida.continuar()}
              disabled={guardando}
              className={`h-11 px-[18px] text-[15px] ${botonContorno}`}
            >
              Salir sin guardar
            </button>
            <button
              type="button"
              onClick={() => void guardarYSalir()}
              disabled={guardando}
              className={`h-11 px-[18px] text-[15px] ${botonLleno}`}
            >
              {guardando ? 'Guardando…' : 'Guardar y salir'}
            </button>
            <button
              ref={refSeguirAca}
              type="button"
              onClick={() => {
                setSalida(null)
                refGuardar.current?.focus()
              }}
              disabled={guardando}
              className={`h-11 px-[18px] text-[15px] ${botonContorno}`}
            >
              Seguir acá
            </button>
          </div>
        </div>
      )}

      {aBorrar && (
        <DialogoDeConfirmacion
          key={aBorrar.id}
          titulo={`¿Borrar la categoría ${aBorrar.nombre}?`}
          texto="Solo se puede borrar si no tiene platos. Si tiene, primero hay que moverlos a otra categoría."
          textoConfirmar="Sí, borrar"
          enviando={borrando}
          alVolver={() => setABorrar(null)}
          alConfirmar={() => void confirmarBorrado()}
        />
      )}

      <p role="status" className="sr-only">
        {anuncio}
      </p>
    </section>
  )
}

// El nombre de una fila pasa a ser un campo con el nombre que tenía, con Guardar y Cancelar. Escape es Cancelar.
// `alGuardar` lanza el error del back, que va debajo del campo (el 409 de la etiqueta repetida, el 404).
function EdicionDeNombre({
  id,
  rotulo: textoRotulo,
  inicial,
  max,
  apilado = false,
  alGuardar,
  alCancelar,
}: {
  id: string
  rotulo: string
  inicial: string
  max: number
  apilado?: boolean
  alGuardar: (nombre: string) => Promise<void>
  alCancelar: () => void
}) {
  const [texto, setTexto] = useState(inicial)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const refCampo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    refCampo.current?.select()
  }, [])

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (enviando) return
    const nombre = texto.trim()
    if (nombre === '') {
      setError(ERROR_NOMBRE)
      refCampo.current?.focus()
      return
    }
    setEnviando(true)
    setError(null)
    try {
      await alGuardar(nombre)
    } catch (err) {
      setError(textoDelError(err))
      setEnviando(false)
      refCampo.current?.focus()
    }
  }

  const idError = `${id}-error`
  return (
    <form
      onSubmit={guardar}
      noValidate
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !enviando) {
          e.stopPropagation()
          alCancelar()
        }
      }}
      className={`flex min-w-0 flex-1 gap-2 ${apilado ? 'flex-col' : 'items-start'}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <input
          ref={refCampo}
          id={id}
          type="text"
          autoComplete="off"
          aria-label={textoRotulo}
          value={texto}
          maxLength={max}
          onChange={(e) => {
            setTexto(e.target.value)
            setError(null)
          }}
          aria-invalid={error !== null}
          aria-describedby={error ? idError : undefined}
          className={campo(error !== null)}
        />
        {error && <ErrorDeCampo id={idError}>{error}</ErrorDeCampo>}
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="submit" disabled={enviando} className={`h-12 px-3.5 text-[14px] ${botonLleno}`}>
          <img src={iconoGuardar} alt="" width={18} height={18} />
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={alCancelar} disabled={enviando} className={`h-12 px-3.5 text-[14px] ${botonContorno}`}>
          <img src={iconoCancelar} alt="" width={18} height={18} />
          Cancelar
        </button>
      </div>
    </form>
  )
}

// "Nueva categoría" abre un campo, la crea en el momento y la suma al final de la lista. El Mockup no dibuja el campo
// abierto: sigue el de "Nueva etiqueta".
function NuevaCategoria({ onCreada }: { onCreada: (c: CategoriaAdmin) => void }) {
  const [abierta, setAbierta] = useState(false)
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const refCampo = useRef<HTMLInputElement>(null)
  const refBoton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (abierta) refCampo.current?.focus()
  }, [abierta])

  function cerrar() {
    setAbierta(false)
    setTexto('')
    setError(null)
    // El campo se desmonta: el foco vuelve al botón que lo abrió.
    requestAnimationFrame(() => refBoton.current?.focus())
  }

  async function crear(e: FormEvent) {
    e.preventDefault()
    if (creando) return
    const nombre = texto.trim()
    if (nombre === '') {
      setError(ERROR_NOMBRE)
      refCampo.current?.focus()
      return
    }
    setCreando(true)
    setError(null)
    try {
      onCreada(await crearCategoria(nombre))
      setTexto('')
      refCampo.current?.focus()
    } catch (err) {
      setError(textoDelError(err))
    } finally {
      setCreando(false)
    }
  }

  if (!abierta) {
    return (
      <button
        ref={refBoton}
        type="button"
        onClick={() => setAbierta(true)}
        className={`h-11 self-start px-[18px] text-[14px] ${botonContorno}`}
      >
        <img src={iconoMas} alt="" width={20} height={20} />
        Nueva categoría
      </button>
    )
  }
  return (
    <form
      onSubmit={crear}
      noValidate
      onKeyDown={(e) => e.key === 'Escape' && cerrar()}
      className="flex flex-col gap-1.5"
    >
      <label htmlFor="categoria-nueva" className={rotulo}>
        Nueva categoría
      </label>
      <div className="flex items-start gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <input
            ref={refCampo}
            id="categoria-nueva"
            type="text"
            autoComplete="off"
            value={texto}
            maxLength={CATEGORIA_MAX}
            onChange={(e) => {
              setTexto(e.target.value)
              setError(null)
            }}
            placeholder="Ej.: Entradas"
            aria-invalid={error !== null}
            aria-describedby={error ? 'categoria-nueva-error' : undefined}
            className={campo(error !== null)}
          />
          {error && <ErrorDeCampo id="categoria-nueva-error">{error}</ErrorDeCampo>}
        </div>
        <button type="submit" disabled={creando} className={`h-12 px-[18px] text-[15px] ${botonLleno}`}>
          <img src={iconoMasBlanco} alt="" width={20} height={20} />
          {creando ? 'Agregando…' : 'Agregar'}
        </button>
        <button type="button" onClick={cerrar} disabled={creando} className={`h-12 px-[18px] text-[15px] ${botonContorno}`}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

// Cada etiqueta es una fila con Editar y Borrar solo con ícono: la tarjeta mide 300 px y el chip no alcanzaba.
function TarjetaDeEtiquetas({ iniciales, avisar }: { iniciales: EtiquetaAdmin[]; avisar: Avisar }) {
  const [etiquetas, setEtiquetas] = useState(iniciales)
  const [pagina, setPagina] = useState(0)
  const [editando, setEditando] = useState<number | null>(null)
  const [aBorrar, setABorrar] = useState<EtiquetaAdmin | null>(null)
  const [borrando, setBorrando] = useState(false)
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)
  const refCampo = useRef<HTMLInputElement>(null)
  const refLista = useRef<HTMLUListElement>(null)
  // A dónde va el foco cuando cambia la lista: al Editar de una etiqueta, o a la lista si se borró. Es un useEffect
  // y no un useLayoutEffect para que corra después de que el <dialog> de borrar se cerró y devolvió su foco.
  const pedirFoco = useRef<number | 'lista' | null>(null)

  const { totalPaginas, actual, visibles } = paginar(etiquetas, pagina, ETIQUETAS_POR_PAGINA)

  useEffect(() => {
    const pedido = pedirFoco.current
    if (pedido === null) return
    pedirFoco.current = null
    const boton =
      pedido === 'lista'
        ? refLista.current?.querySelector<HTMLButtonElement>('button')
        : refLista.current?.querySelector<HTMLButtonElement>(`[data-etiqueta="${pedido}"] [data-accion="editar"]`)
    if (boton) boton.focus()
    else refCampo.current?.focus()
  }, [etiquetas, editando])

  // El back las lista por nombre: la lista se reordena y pasa a la página donde quedó la etiqueta.
  function poner(lista: EtiquetaAdmin[], etiqueta: EtiquetaAdmin) {
    const ordenada = [...lista, etiqueta].sort(porNombre)
    setEtiquetas(ordenada)
    setPagina(Math.floor(ordenada.findIndex((e) => e.id === etiqueta.id) / ETIQUETAS_POR_PAGINA))
  }

  async function agregar(e: FormEvent) {
    e.preventDefault()
    if (agregando) return
    const nombre = texto.trim()
    if (nombre === '') {
      setError(ERROR_NOMBRE)
      refCampo.current?.focus()
      return
    }
    setAgregando(true)
    setError(null)
    try {
      const nueva = await crearEtiqueta(nombre)
      poner(etiquetas, nueva)
      setTexto('')
      avisar(`Se agregó la etiqueta ${nueva.nombre}`)
      refCampo.current?.focus()
    } catch (err) {
      // Con el 409, el texto del back ("Esa etiqueta ya existe") va debajo del campo, como en el Mockup.
      setError(textoDelError(err))
    } finally {
      setAgregando(false)
    }
  }

  function cerrarEdicion(id: number) {
    pedirFoco.current = id
    setEditando(null)
  }

  async function renombrar(et: EtiquetaAdmin, nombre: string) {
    const nueva = await renombrarEtiqueta(et.id, nombre)
    poner(
      etiquetas.filter((x) => x.id !== et.id),
      nueva,
    )
    cerrarEdicion(et.id)
    avisar(`Se guardó la etiqueta ${nueva.nombre}`)
  }

  function sacar(id: number) {
    pedirFoco.current = 'lista'
    setEtiquetas((l) => l.filter((x) => x.id !== id))
  }

  async function confirmarBorrado() {
    if (!aBorrar || borrando) return
    const et = aBorrar
    setBorrando(true)
    try {
      await borrarEtiqueta(et.id)
      sacar(et.id)
      avisar(`Se borró la etiqueta ${et.nombre}`)
    } catch (err) {
      // 404: ya no existe, así que también se saca de la lista.
      if (statusDe(err) === 404) sacar(et.id)
      avisar(textoDelError(err), true)
    } finally {
      setBorrando(false)
      setABorrar(null)
    }
  }

  return (
    <section
      aria-labelledby="etiquetas-titulo"
      className="flex w-[300px] shrink-0 flex-col gap-2.5 rounded-2xl bg-linea p-[18px]"
    >
      <h2 id="etiquetas-titulo" className="text-[16px] leading-[normal] font-semibold">
        Etiquetas del local
      </h2>
      <p className="text-[13px] leading-[18px]">
        Son los filtros de la carta, como los alérgenos. No se repiten dentro del local.
      </p>
      {etiquetas.length === 0 ? (
        <p className="text-[13px] leading-[normal] text-secundario">Todavía no hay etiquetas.</p>
      ) : (
        <>
          <ul ref={refLista} className="flex flex-col gap-2">
            {visibles.map((et) => (
              <li
                key={et.id}
                data-etiqueta={et.id}
                className={`flex min-h-12 items-center justify-between gap-2 rounded-xl bg-tarjeta ${
                  editando === et.id ? 'p-2' : 'py-0.5 pr-0.5 pl-3.5'
                }`}
              >
                {editando === et.id ? (
                  <EdicionDeNombre
                    id={`etiqueta-${et.id}`}
                    rotulo={`Nombre de la etiqueta ${et.nombre}`}
                    inicial={et.nombre}
                    max={ETIQUETA_MAX}
                    apilado
                    alGuardar={(nombre) => renombrar(et, nombre)}
                    alCancelar={() => cerrarEdicion(et.id)}
                  />
                ) : (
                  <>
                    <span className="min-w-0 truncate text-[13px] leading-[normal]">{et.nombre}</span>
                    <div className="flex shrink-0">
                      <button
                        type="button"
                        data-accion="editar"
                        aria-label={`Editar ${et.nombre}`}
                        title="Editar"
                        onClick={() => setEditando(et.id)}
                        className={`size-11 rounded-[14px] ${foco} flex items-center justify-center`}
                      >
                        <img src={iconoEditar} alt="" width={20} height={20} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Borrar ${et.nombre}`}
                        title="Borrar"
                        onClick={() => setABorrar(et)}
                        className={`size-11 rounded-[14px] ${foco} flex items-center justify-center`}
                      >
                        <img src={iconoBorrar} alt="" width={20} height={20} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          <Paginacion
            pagina={actual}
            totalPaginas={totalPaginas}
            mostrando={visibles.length}
            total={etiquetas.length}
            alCambiar={setPagina}
          />
        </>
      )}
      <form onSubmit={agregar} noValidate className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="etiqueta-nueva" className={rotulo}>
            Nueva etiqueta
          </label>
          <input
            ref={refCampo}
            id="etiqueta-nueva"
            type="text"
            autoComplete="off"
            value={texto}
            maxLength={ETIQUETA_MAX}
            onChange={(e) => {
              setTexto(e.target.value)
              setError(null)
            }}
            placeholder="Ej.: Sin TACC"
            aria-invalid={error !== null}
            aria-describedby={error ? 'etiqueta-nueva-error' : undefined}
            className={campo(error !== null)}
          />
          {error && <ErrorDeCampo id="etiqueta-nueva-error">{error}</ErrorDeCampo>}
        </div>
        {/* Con el error a la vista queda deshabilitado, como en el Mockup, hasta que se cambia el texto. */}
        <button
          type="submit"
          disabled={agregando || error !== null}
          className={`h-11 self-start px-[18px] text-[14px] ${botonContorno}`}
        >
          <img src={iconoMas} alt="" width={20} height={20} />
          {agregando ? 'Agregando…' : 'Agregar etiqueta'}
        </button>
      </form>

      {aBorrar && (
        <DialogoDeConfirmacion
          key={aBorrar.id}
          titulo={`¿Borrar la etiqueta ${aBorrar.nombre}?`}
          texto="También se saca de los platos que la tienen."
          textoConfirmar="Sí, borrar"
          enviando={borrando}
          alVolver={() => setABorrar(null)}
          alConfirmar={() => void confirmarBorrado()}
        />
      )}
    </section>
  )
}
