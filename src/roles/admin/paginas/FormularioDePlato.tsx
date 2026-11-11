import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  crearPlato,
  destacarPlato,
  editarPlato,
  listarCategorias,
  listarEtiquetas,
  listarPlatosAdmin,
  type CategoriaAdmin,
  type EtiquetaAdmin,
  type PlatoAdmin,
} from '../../../compartido/api/admin'
import { textoDelError } from '../../../compartido/api/errores'
import iconoVolver from '../../../compartido/ui/iconos/arrow-l.svg'
import iconoElegida from '../../../compartido/ui/iconos/check-16.svg'
import iconoGuardar from '../../../compartido/ui/iconos/check-blanco.svg'
import iconoDesplegar from '../../../compartido/ui/iconos/chevron-d.svg'
import iconoPlato from '../../../compartido/ui/iconos/plate-36.svg'
import iconoMas from '../../../compartido/ui/iconos/plus.svg'
import iconoCancelar from '../../../compartido/ui/iconos/x.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import ErrorDeCampo from '../componentes/ErrorDeCampo'
import {
  DESCRIPCION_MAX,
  IMAGEN_MAX,
  NOMBRE_MAX,
  errorDeImagen,
  errorDeNombre,
  leerPrecio,
} from '../validarPlato'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const focoDelCampo = 'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primario'
const rotulo = 'text-[13px] leading-[normal] font-medium'
const botonContorno = `flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] font-semibold text-primario disabled:opacity-[.38] ${foco}`

// El borde del campo con error pasa a 2 px, como los de Nombre y Precio en el Mockup.
const bordeDe = (conError: boolean) => (conError ? 'border-2 border-primario' : 'border-[1.25px] border-secundario')
const campo = (conError: boolean) =>
  `h-12 w-full rounded-xl bg-tarjeta px-3.5 text-[15px] leading-[normal] text-texto placeholder:text-secundario ${bordeDe(conError)} ${foco}`

// La vista previa de la imagen: la que se pegó, o el ícono si no hay o no carga. Con `key` en la URL se reinicia
// cuando cambia, para que una imagen rota no deje el ícono pegado.
function VistaPrevia({ url }: { url: string | null }) {
  const [fallo, setFallo] = useState(false)
  return (
    <div className="flex h-[130px] items-center justify-center overflow-hidden rounded-xl bg-tarjeta">
      {url && !fallo ? (
        <img src={url} alt="Vista previa de la imagen" className="size-full object-cover" onError={() => setFallo(true)} />
      ) : (
        <img src={iconoPlato} alt="" width={36} height={36} />
      )}
    </div>
  )
}

interface Datos {
  categorias: CategoriaAdmin[]
  etiquetas: EtiquetaAdmin[]
  plato: PlatoAdmin | null // null: es un alta
}

// P-14b, nuevo plato y editar plato (HU-12). Rutas: /admin/menu/nuevo y /admin/menu/:platoId. No hay un GET de un
// plato solo: al editar se pide la lista completa y se busca por id.
export default function FormularioDePlato() {
  const { platoId } = useParams()
  // Lo que no es un número no es un plato. /admin/menu/categorias cae acá hasta que la tarea 4 le ponga su ruta, y
  // se lo trata como hasta ahora: de vuelta a la carta.
  if (platoId !== undefined && !/^\d+$/.test(platoId)) return <Navigate to="/admin/menu" replace />
  // La key reinicia el formulario al pasar del alta al plato recién creado (ver `guardar`).
  return <CargaDelFormulario key={platoId ?? 'nuevo'} platoId={platoId} />
}

function CargaDelFormulario({ platoId }: { platoId: string | undefined }) {
  const [datos, setDatos] = useState<Datos | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    const id = platoId === undefined ? null : Number(platoId)
    Promise.all([listarCategorias(), listarEtiquetas(), id === null ? Promise.resolve(null) : listarPlatosAdmin()])
      .then(([categorias, etiquetas, platos]) => {
        if (!vigente) return
        const plato = platos?.find((p) => p.id === id) ?? null
        if (id !== null && !plato) setError('El plato no existe')
        else setDatos({ categorias, etiquetas, plato })
      })
      .catch((err) => vigente && setError(textoDelError(err)))
    return () => {
      vigente = false
    }
  }, [platoId, intento])

  if (error) {
    return (
      <section className="flex min-h-full flex-col items-center gap-4 bg-fondo px-8 py-10 font-inter text-texto">
        <p role="alert">{error}</p>
        <div className="flex gap-2.5">
          {error !== 'El plato no existe' && (
            <button
              type="button"
              onClick={() => {
                setError(null)
                setIntento((n) => n + 1)
              }}
              className={`h-11 text-[15px] ${botonContorno}`}
            >
              Probá de nuevo
            </button>
          )}
          <Link to="/admin/menu" className={`h-11 text-[15px] ${botonContorno}`}>
            Volver al menú
          </Link>
        </div>
      </section>
    )
  }
  if (!datos) {
    return (
      <section className="min-h-full bg-fondo px-8 py-10 font-inter text-secundario">
        <p className="text-center">Cargando el plato…</p>
      </section>
    )
  }
  return <CamposDelPlato datos={datos} />
}

function CamposDelPlato({ datos: { categorias, etiquetas, plato } }: { datos: Datos }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [nombre, setNombre] = useState(plato?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(plato?.descripcion ?? '')
  // El precio se escribe como texto: con 9500,5 o 9.500 no hay un número hasta que se lee.
  const [precioTexto, setPrecioTexto] = useState(plato ? String(plato.precio) : '')
  const [categoriaId, setCategoriaId] = useState(String(plato?.categoria.id ?? categorias[0]?.id ?? ''))
  const [etiquetaIds, setEtiquetaIds] = useState<number[]>(plato?.etiquetas.map((e) => e.id) ?? [])
  const [imagen, setImagen] = useState(plato?.imagenUrl ?? '')
  // La vista previa se actualiza al salir del campo, para no pedir una imagen por cada letra que se escribe.
  const [imagenDeVista, setImagenDeVista] = useState(plato?.imagenUrl ?? '')
  const [destacado, setDestacado] = useState(plato?.destacado ?? false)

  const [intentado, setIntentado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  // Si el alta salió bien y el destacado no, se llega acá con ese aviso (ver `guardar`).
  const [aviso, setAviso] = useState<string | null>((location.state as { aviso?: string } | null)?.aviso ?? null)

  const refNombre = useRef<HTMLInputElement>(null)
  const refPrecio = useRef<HTMLInputElement>(null)
  const refImagen = useRef<HTMLInputElement>(null)

  const lectura = leerPrecio(precioTexto)
  const errores = {
    nombre: errorDeNombre(nombre),
    precio: lectura.error,
    imagen: errorDeImagen(imagen),
  }
  const mostrar = intentado ? errores : { nombre: null, precio: null, imagen: null }
  const sinCategorias = categorias.length === 0

  function alternarEtiqueta(id: number) {
    setEtiquetaIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  function volver() {
    navigate('/admin/menu')
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (guardando) return
    setIntentado(true)
    setAviso(null)
    if (errores.nombre || errores.precio || errores.imagen) {
      ;(errores.nombre ? refNombre : errores.precio ? refPrecio : refImagen).current?.focus()
      return
    }
    if (lectura.precio === null) return
    setGuardando(true)
    try {
      const cuerpo = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        precio: lectura.precio,
        categoriaId: Number(categoriaId),
        imagenUrl: imagen.trim() || null,
        etiquetaIds,
      }
      // Primero el plato y, si el destacado cambió, después el destacado: son dos llamadas del back.
      const guardado = plato ? await editarPlato(plato.id, cuerpo) : await crearPlato(cuerpo)
      if (destacado !== (plato?.destacado ?? false)) {
        try {
          await destacarPlato(guardado.id, destacado)
        } catch (err) {
          // El plato ya quedó guardado: no se deja el alta abierta, para que otro "Guardar plato" no lo cree dos veces.
          const texto = `El plato se guardó, pero no se pudo cambiar el menú del día. ${textoDelError(err)}`
          if (plato) setAviso(texto)
          else navigate(`/admin/menu/${guardado.id}`, { replace: true, state: { aviso: texto } })
          return
        }
      }
      navigate('/admin/menu')
    } catch (err) {
      setAviso(textoDelError(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form
      onSubmit={guardar}
      noValidate
      className="flex min-h-full flex-col gap-[18px] bg-fondo px-8 pt-7 pb-6 font-inter text-texto"
    >
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5 leading-[normal]">
          <h1 className="titulo truncate text-[25px]">{plato ? plato.nombre : 'Nuevo plato'}</h1>
          <p className="text-[13px] text-secundario">
            {plato
              ? 'Menú › Editar plato · los cambios quedan registrados en la auditoría'
              : 'Menú › Nuevo plato · el alta queda registrada en la auditoría'}
          </p>
        </div>
        <button
          type="button"
          onClick={volver}
          disabled={guardando}
          className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] text-[15px] font-semibold underline disabled:opacity-[.38] ${foco}`}
        >
          <img src={iconoVolver} alt="" width={20} height={20} />
          Volver al menú
        </button>
      </header>

      {aviso && <AvisoDeFallo>{aviso}</AvisoDeFallo>}
      {sinCategorias && <AvisoDeFallo>Para cargar un plato necesitás al menos una categoría.</AvisoDeFallo>}

      <div className="flex items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="plato-nombre" className={rotulo}>
              Nombre
            </label>
            <input
              ref={refNombre}
              id="plato-nombre"
              type="text"
              value={nombre}
              maxLength={NOMBRE_MAX}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej.: Milanesa napolitana con puré"
              aria-invalid={mostrar.nombre !== null}
              aria-describedby={mostrar.nombre ? 'plato-nombre-error' : undefined}
              className={campo(mostrar.nombre !== null)}
            />
            {mostrar.nombre && <ErrorDeCampo id="plato-nombre-error">{mostrar.nombre}</ErrorDeCampo>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="plato-descripcion" className={rotulo}>
              Descripción
            </label>
            <textarea
              id="plato-descripcion"
              value={descripcion}
              maxLength={DESCRIPCION_MAX}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej.: Con papas fritas o puré, a elección."
              className={`h-[88px] w-full resize-none rounded-xl bg-tarjeta px-3.5 pt-3 text-[15px] leading-[normal] text-texto placeholder:text-secundario ${bordeDe(false)} ${foco}`}
            />
          </div>

          <div className="flex items-start gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor="plato-precio" className={rotulo}>
                Precio
              </label>
              <div
                className={`flex h-12 w-full items-center gap-1 rounded-xl bg-tarjeta px-3.5 text-[15px] leading-[normal] ${bordeDe(mostrar.precio !== null)} ${focoDelCampo}`}
              >
                <span aria-hidden="true">$</span>
                <input
                  ref={refPrecio}
                  id="plato-precio"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={precioTexto}
                  onChange={(e) => setPrecioTexto(e.target.value)}
                  placeholder="0"
                  aria-invalid={mostrar.precio !== null}
                  aria-describedby={mostrar.precio ? 'plato-precio-error' : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent text-texto placeholder:text-secundario focus:outline-none"
                />
              </div>
              {mostrar.precio && <ErrorDeCampo id="plato-precio-error">{mostrar.precio}</ErrorDeCampo>}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor="plato-categoria" className={rotulo}>
                Categoría
              </label>
              <div className="relative">
                <select
                  id="plato-categoria"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  disabled={sinCategorias}
                  className={`${campo(false)} appearance-none pr-10`}
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <img
                  src={iconoDesplegar}
                  alt=""
                  width={18}
                  height={18}
                  className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2"
                />
              </div>
            </div>
          </div>

          <div role="group" aria-labelledby="plato-etiquetas" className="flex flex-col gap-3.5">
            <p id="plato-etiquetas" className={rotulo}>
              Etiquetas
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {etiquetas.map((et) => {
                const elegida = etiquetaIds.includes(et.id)
                return (
                  <button
                    key={et.id}
                    type="button"
                    aria-pressed={elegida}
                    onClick={() => alternarEtiqueta(et.id)}
                    className={`flex h-11 items-center rounded-full text-[13px] leading-[normal] ${foco} ${
                      elegida ? 'gap-1.5 bg-suave pr-3.5 pl-2.5 font-medium' : 'border border-secundario px-3.5'
                    }`}
                  >
                    {elegida && <img src={iconoElegida} alt="" width={16} height={16} />}
                    {et.nombre}
                  </button>
                )
              })}
              <Link to="/admin/menu/categorias" className={`h-11 text-[14px] ${botonContorno}`}>
                <img src={iconoMas} alt="" width={20} height={20} />
                Gestionar etiquetas
              </Link>
            </div>
          </div>
        </div>

        <div className="flex w-[300px] shrink-0 flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-2xl bg-linea p-[18px]">
            <h2 className="text-[16px] leading-[normal] font-semibold">Imagen</h2>
            <VistaPrevia key={imagenDeVista} url={errorDeImagen(imagenDeVista) === null ? imagenDeVista.trim() || null : null} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="plato-imagen" className={rotulo}>
                Link o ruta de la imagen
              </label>
              <input
                ref={refImagen}
                id="plato-imagen"
                type="text"
                inputMode="url"
                autoComplete="off"
                value={imagen}
                maxLength={IMAGEN_MAX}
                onChange={(e) => setImagen(e.target.value)}
                onBlur={() => setImagenDeVista(imagen)}
                placeholder="/img/milanesa.jpg"
                aria-invalid={mostrar.imagen !== null}
                aria-describedby={mostrar.imagen ? 'plato-imagen-error' : 'plato-imagen-ayuda'}
                className={campo(mostrar.imagen !== null)}
              />
              {mostrar.imagen ? (
                <ErrorDeCampo id="plato-imagen-error">{mostrar.imagen}</ErrorDeCampo>
              ) : (
                <p id="plato-imagen-ayuda" className="text-[13px] leading-[1.4]">
                  Un link https o una ruta del front, como /img/milanesa.jpg. Sin imagen, el plato sale con el ícono.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 rounded-2xl bg-linea p-[18px]">
            <h2 className="text-[16px] leading-[normal] font-semibold">Destacado</h2>
            <label className="flex h-11 cursor-pointer items-center gap-2.5 text-[13px] leading-[normal]">
              <input
                type="checkbox"
                checked={destacado}
                onChange={(e) => setDestacado(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex size-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primario ${
                  destacado ? 'border-primario bg-suave' : 'border-secundario bg-tarjeta'
                }`}
              >
                {destacado && <img src={iconoElegida} alt="" width={16} height={16} />}
              </span>
              Mostrarlo como menú del día
            </label>
            <p className="text-[13px] leading-[1.4]">
              Los destacados se muestran arriba en la carta del cliente. La disponibilidad del día se cambia en
              Disponibilidad rápida.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5">
        <button type="button" onClick={volver} disabled={guardando} className={`h-12 text-[15px] ${botonContorno}`}>
          <img src={iconoCancelar} alt="" width={20} height={20} />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando || sinCategorias}
          className={`flex h-12 items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold text-texto-boton disabled:opacity-[.38] ${foco}`}
        >
          <img src={iconoGuardar} alt="" width={20} height={20} />
          {guardando ? 'Guardando…' : 'Guardar plato'}
        </button>
      </div>
    </form>
  )
}
