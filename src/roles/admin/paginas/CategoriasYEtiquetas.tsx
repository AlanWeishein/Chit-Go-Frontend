import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  crearCategoria,
  crearEtiqueta,
  listarCategorias,
  listarEtiquetas,
  ordenarCategorias,
  type CategoriaAdmin,
  type EtiquetaAdmin,
} from '../../../compartido/api/admin'
import { textoDelError } from '../../../compartido/api/errores'
import iconoAlerta from '../../../compartido/ui/iconos/alert.svg'
import iconoVolver from '../../../compartido/ui/iconos/arrow-l.svg'
import iconoFlecha from '../../../compartido/ui/iconos/arrow-r.svg'
import iconoGuardar from '../../../compartido/ui/iconos/check-blanco.svg'
import iconoMas from '../../../compartido/ui/iconos/plus.svg'
import iconoMasBlanco from '../../../compartido/ui/iconos/plus-blanco.svg'
import iconoCancelar from '../../../compartido/ui/iconos/x.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import ErrorDeCampo from '../componentes/ErrorDeCampo'
import { useGuardiaDeSalida } from '../guardiaDeSalida'

// Los largos del esquema del back (CategoriaRequest y EtiquetaRequest): uno más da el 400 genérico.
const CATEGORIA_MAX = 80
const ETIQUETA_MAX = 60
const ERROR_NOMBRE = 'Poné un nombre' // el de HU-12, el mismo que da el back

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const rotulo = 'text-[13px] leading-[normal] font-medium'
const botonContorno = `flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario font-semibold text-primario disabled:opacity-[.38] ${foco}`
const botonLleno = `flex items-center justify-center gap-2 rounded-[14px] bg-primario font-semibold text-texto-boton disabled:opacity-[.38] ${foco}`
const campo = (conError: boolean) =>
  `h-12 w-full rounded-xl bg-tarjeta px-3.5 text-[15px] leading-[normal] text-texto placeholder:text-secundario ${
    conError ? 'border-2 border-primario' : 'border-[1.25px] border-secundario'
  } ${foco}`

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
// pantalla y se manda de una vez con "Guardar cambios"; crear una categoría o una etiqueta se guarda en el momento.
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
  const [guardando, setGuardando] = useState(false)
  const [errorOrden, setErrorOrden] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [anuncio, setAnuncio] = useState('')
  // Se intentó salir con el orden sin guardar: guarda cómo seguir si el Admin elige salir.
  const [salida, setSalida] = useState<{ continuar: () => void } | null>(null)

  const lista = useRef<HTMLOListElement>(null)
  const refSeguirAca = useRef<HTMLButtonElement>(null)
  const refGuardar = useRef<HTMLButtonElement>(null)
  const pedirFoco = useRef<{ id: number; boton: 'subir' | 'bajar' } | null>(null)
  // Después de Cancelar o de Guardar los dos botones quedan deshabilitados: el foco pasa a la lista.
  const focoALaLista = useRef(false)

  const hayCambios = orden.some((c, i) => c.id !== base[i]?.id)

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

  // Al mover una fila, el botón que se tocó sigue con el foco. Si quedó deshabilitado (la fila llegó a un
  // extremo), el foco pasa al otro.
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
  }, [orden, base])

  useEffect(() => {
    if (salida) refSeguirAca.current?.focus()
  }, [salida])

  function mover(i: number, delta: -1 | 1) {
    const j = i + delta
    if (j < 0 || j >= orden.length) return
    const movida = orden[i]
    const copia = [...orden]
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
    pedirFoco.current = { id: movida.id, boton: delta < 0 ? 'subir' : 'bajar' }
    setOrden(copia)
    setGuardado(false)
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
      setGuardado(true)
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

  // El back la pone al final del orden: acá también, sin perder lo que se movió.
  function agregarCategoria(nueva: CategoriaAdmin) {
    setBase((b) => [...b, nueva])
    setOrden((o) => [...o, nueva])
    setAnuncio(`Se agregó la categoría ${nueva.nombre}`)
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

      <div className="flex items-start gap-6">
        <section aria-labelledby="categorias-titulo" className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-2xl bg-linea p-[18px]">
          <h2 id="categorias-titulo" className="text-[16px] leading-[normal] font-semibold">
            Categorías
          </h2>
          <p className="text-[13px] leading-[normal]">El orden es el que ve el cliente en la carta.</p>
          {orden.length === 0 ? (
            <p className="text-[13px] leading-[normal] text-secundario">Todavía no hay categorías.</p>
          ) : (
            <ol ref={lista} className="flex flex-col gap-2.5">
              {orden.map((c, i) => (
                <li
                  key={c.id}
                  data-categoria={c.id}
                  className="flex h-14 items-center justify-between gap-2 rounded-xl bg-tarjeta pr-2 pl-4"
                >
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
                  </div>
                </li>
              ))}
            </ol>
          )}
          <NuevaCategoria onCreada={agregarCategoria} />
        </section>

        <TarjetaDeEtiquetas iniciales={datos.etiquetas} onAnuncio={setAnuncio} />
      </div>

      <div className="flex items-center justify-end gap-2.5">
        <p role="status" className="mr-auto text-[13px] leading-[normal] font-medium">
          {hayCambios ? 'Cambiaste el orden y todavía no lo guardaste.' : guardado ? 'Listo: se guardó el orden.' : ''}
        </p>
        <button
          type="button"
          onClick={cancelar}
          disabled={!hayCambios || guardando}
          className={`h-12 px-[18px] text-[15px] ${botonContorno}`}
        >
          <img src={iconoCancelar} alt="" width={20} height={20} />
          Cancelar
        </button>
        <button
          type="button"
          ref={refGuardar}
          onClick={() => void guardarOrden()}
          disabled={!hayCambios || guardando}
          className={`h-12 px-[18px] text-[15px] ${botonLleno}`}
        >
          <img src={iconoGuardar} alt="" width={20} height={20} />
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

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

      <p role="status" className="sr-only">
        {anuncio}
      </p>
    </section>
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

function TarjetaDeEtiquetas({
  iniciales,
  onAnuncio,
}: {
  iniciales: EtiquetaAdmin[]
  onAnuncio: (texto: string) => void
}) {
  const [etiquetas, setEtiquetas] = useState(iniciales)
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)
  const refCampo = useRef<HTMLInputElement>(null)

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
      // El back las lista por nombre.
      setEtiquetas((lista) => [...lista, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
      setTexto('')
      onAnuncio(`Se agregó la etiqueta ${nueva.nombre}`)
      refCampo.current?.focus()
    } catch (err) {
      // Con el 409, el texto del back ("Esa etiqueta ya existe") va debajo del campo, como en el Mockup.
      setError(textoDelError(err))
    } finally {
      setAgregando(false)
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
        <ul className="flex flex-wrap gap-2">
          {etiquetas.map((et) => (
            <li
              key={et.id}
              className="flex h-11 items-center rounded-full border border-secundario px-3.5 text-[13px] leading-[normal]"
            >
              {et.nombre}
            </li>
          ))}
        </ul>
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
    </section>
  )
}
