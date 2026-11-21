import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  crearEmpleado,
  darDeBajaEmpleado,
  detalleEmpleado,
  editarEmpleado,
  reemplazarMesas,
  reemplazarTurnos,
  type EmpleadoDetalle,
  type RolDeEmpleado,
  type Turno,
} from '../../../compartido/api/empleados'
import { listarMesas } from '../../../compartido/api/mesas'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import type { MesaAdmin } from '../../../compartido/tipos/mesas'
import iconoAlerta from '../../../compartido/ui/iconos/alert.svg'
import iconoVolver from '../../../compartido/ui/iconos/arrow-l.svg'
import iconoBaja from '../../../compartido/ui/iconos/ban-20.svg'
import iconoCaja from '../../../compartido/ui/iconos/receipt.svg'
import iconoCocina from '../../../compartido/ui/iconos/chef.svg'
import iconoElegidaBlanco from '../../../compartido/ui/iconos/check-blanco-14.svg'
import iconoGuardar from '../../../compartido/ui/iconos/check-blanco.svg'
import iconoElegida from '../../../compartido/ui/iconos/check-16.svg'
import iconoMostrar from '../../../compartido/ui/iconos/eye.svg'
import iconoBloqueado from '../../../compartido/ui/iconos/lock.svg'
import iconoGenerar from '../../../compartido/ui/iconos/refresh.svg'
import iconoMozo from '../../../compartido/ui/iconos/user.svg'
import iconoCancelar from '../../../compartido/ui/iconos/x.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import { useGuardiaDeSalida } from '../guardiaDeSalida'
import { ROL, resumenDeTurnos } from '../turnos'
import {
  ERROR_DE_PIN,
  PIN_VALIDO,
  errorDeContrasena,
  generarPin,
} from '../datosDeEmpleado'
import AusenciasDelEmpleado from './AusenciasDelEmpleado'
import BlanquearPin from './BlanquearPin'
import CargarAusencia from './CargarAusencia'
import ConfirmarBorrado from './ConfirmarBorrado'
import ErrorDeCampo from './ErrorDeCampo'
import TurnoSemanal, {
  errorDelTurno,
  estadoDesde,
  hayTurnoCargado,
  mismosTurnos,
  turnosDe,
  type EstadoDelTurno,
} from './TurnoSemanal'

// P-23, P-23b, P-23c y P-23d (HU-14): el alta y la edición de un empleado. Rutas /admin/empleados/nuevo y
// /admin/empleados/:empleadoId. Solo el Admin.
//
// El back guarda en pedidos separados: los datos (POST o PUT /{id}), el turno (PUT /turnos) y las mesas del mozo
// (PUT /mesas). Las ausencias, el blanqueo del PIN y la baja se guardan apenas se confirman, cada uno en su diálogo.

const NOMBRE_MAX = 120 // AltaDeEmpleadoRequest
const USUARIO_MAX = 40

const ROLES: { valor: RolDeEmpleado; texto: string; detalle: string; icono: string }[] = [
  { valor: 'MOZO', texto: 'Mozo', detalle: 'Atiende sus mesas asignadas', icono: iconoMozo },
  { valor: 'CAJA', texto: 'Caja', detalle: 'Aprueba pedidos y cierra cuentas', icono: iconoCaja },
  { valor: 'COCINA', texto: 'Cocina', detalle: 'Ve la cola del KDS', icono: iconoCocina },
]

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const rotulo = 'text-[13px] leading-[normal] font-medium'
const botonContorno = `flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] font-semibold text-primario disabled:opacity-[.38] ${foco}`
const botonLleno = `flex items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] font-semibold text-texto-boton disabled:opacity-[.38] ${foco}`
const bordeDe = (conError: boolean) => (conError ? 'border-2 border-primario' : 'border-[1.25px] border-secundario')
const campo = (conError: boolean) =>
  `h-12 w-full rounded-xl bg-tarjeta px-3.5 text-[15px] leading-[normal] text-texto placeholder:text-secundario disabled:opacity-[.6] ${bordeDe(conError)} ${foco}`

// Lo que queda pendiente si el alta creó al empleado y falló el turno o las mesas (ver `guardarAlta`).
interface Pendiente {
  turnos: Turno[]
  mesaIds: number[]
}
interface EstadoDeLaNavegacion {
  aviso?: string
  pendiente?: Pendiente
}

interface Datos {
  mesas: MesaAdmin[]
  empleado: EmpleadoDetalle | null // null: es un alta
}

export default function FormularioDeEmpleado() {
  const { empleadoId } = useParams()
  if (empleadoId !== undefined && !/^\d+$/.test(empleadoId)) return <Navigate to="/admin/empleados" replace />
  // La key reinicia el formulario al pasar del alta a la edición del recién creado.
  return <Carga key={empleadoId ?? 'nuevo'} empleadoId={empleadoId === undefined ? null : Number(empleadoId)} />
}

function Carga({ empleadoId }: { empleadoId: number | null }) {
  const navigate = useNavigate()
  const [datos, setDatos] = useState<Datos | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    // Las mesas solo hacen falta para el mozo, pero en el alta todavía no se sabe el rol: se piden siempre.
    Promise.all([listarMesas(), empleadoId === null ? Promise.resolve(null) : detalleEmpleado(empleadoId)])
      .then(([mesas, empleado]) => vigente && setDatos({ mesas, empleado }))
      .catch((err) => vigente && setError(textoDelError(err)))
    return () => {
      vigente = false
    }
  }, [empleadoId, intento])

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
            className={`h-11 text-[15px] ${botonContorno}`}
          >
            Probá de nuevo
          </button>
          <button type="button" onClick={() => navigate('/admin/empleados')} className={`h-11 text-[15px] ${botonContorno}`}>
            Volver a Empleados
          </button>
        </div>
      </section>
    )
  }
  if (!datos) {
    return (
      <section className="min-h-full bg-fondo px-8 py-10 font-inter text-secundario">
        <p className="text-center">{empleadoId === null ? 'Cargando…' : 'Cargando el empleado…'}</p>
      </section>
    )
  }
  return <Campos datos={datos} />
}

// "17 a 20" si son números seguidos, si no en lista: "1, 3 y Patio 2".
function textoDeMesas(numeros: string[]): string {
  if (numeros.length === 0) return '—'
  const enteros = numeros.map((n) => (/^\d+$/.test(n) ? Number(n) : NaN))
  const seguidos = enteros.every((n, i) => !Number.isNaN(n) && (i === 0 || n === enteros[i - 1] + 1))
  if (seguidos && numeros.length >= 3) return `${numeros[0]} a ${numeros[numeros.length - 1]}`
  return numeros.length === 1 ? numeros[0] : `${numeros.slice(0, -1).join(', ')} y ${numeros[numeros.length - 1]}`
}

// Los textos del back vienen sin punto final ("Los turnos del lunes se pisan").
const conPunto = (texto: string) => (/[.!?]$/.test(texto) ? texto : `${texto}.`)

const mismasMesas = (a: number[], b: number[]) => a.length === b.length && a.every((id) => b.includes(id))

type Campo = 'nombre' | 'rol' | 'pin' | 'usuario' | 'password' | 'turno'
type Dialogo = 'blanqueo' | 'ausencia' | 'baja' | null

function Campos({ datos }: { datos: Datos }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { mesas } = datos
  const navegacion = (location.state as EstadoDeLaNavegacion | null) ?? {}

  // `empleado` es lo que tiene el back; los campos, lo que se ve. Se actualiza con cada respuesta.
  const [empleado, setEmpleado] = useState(datos.empleado)
  const esAlta = empleado === null
  const soloLectura = empleado !== null && !empleado.activo

  const [nombre, setNombre] = useState(empleado?.nombre ?? '')
  const [rol, setRol] = useState<RolDeEmpleado | ''>(empleado?.rol ?? '')
  const [pin, setPin] = useState(generarPin)
  const [usuario, setUsuario] = useState(empleado?.nombreUsuario ?? '')
  const [password, setPassword] = useState('')
  const [mostrar, setMostrar] = useState(false)
  // Si se llega desde un alta a medias, el turno y las mesas que se habían elegido quedan como cambios sin guardar.
  const [turno, setTurno] = useState<EstadoDelTurno>(() =>
    estadoDesde(navegacion.pendiente?.turnos ?? empleado?.turnos ?? []),
  )
  const [mesaIds, setMesaIds] = useState<number[]>(navegacion.pendiente?.mesaIds ?? empleado?.mesaIds ?? [])

  const [intentado, setIntentado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorUsuario, setErrorUsuario] = useState<string | null>(null) // el 409 del usuario repetido
  const [errorTurnoDelBack, setErrorTurnoDelBack] = useState<string | null>(null) // el 400 de turnos que se pisan
  const [aviso, setAviso] = useState<string | null>(navegacion.aviso ?? null)
  const [exito, setExito] = useState<string | null>(null)
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [dandoDeBaja, setDandoDeBaja] = useState(false)
  const [salida, setSalida] = useState<{ continuar: () => void } | null>(null)
  const guardandoRef = useRef(false) // el estado llega un render tarde: la ref corta el doble toque
  const refSeguirAca = useRef<HTMLButtonElement>(null)

  const refs = {
    nombre: useRef<HTMLInputElement>(null),
    rol: useRef<HTMLButtonElement>(null),
    pin: useRef<HTMLInputElement>(null),
    usuario: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    turno: useRef<HTMLDivElement>(null),
  }

  // El aviso que vino en la navegación se limpia, para que no vuelva al recargar. El pendiente ya se usó arriba.
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  const esMozo = rol === 'MOZO'
  const turnos = turnosDe(turno)

  const hayCambios = soloLectura
    ? false
    : esAlta
      ? !!nombre.trim() || rol !== '' || !!usuario.trim() || !!password || hayTurnoCargado(turno) || mesaIds.length > 0
      : nombre !== empleado.nombre ||
        (esMozo && usuario !== (empleado.nombreUsuario ?? '')) ||
        !mismosTurnos(turnos, empleado.turnos) ||
        (esMozo && !mismasMesas(mesaIds, empleado.mesaIds))

  function validar(): Partial<Record<Campo, string>> {
    const errores: Partial<Record<Campo, string>> = {}
    const nom = nombre.trim()
    if (!nom) errores.nombre = 'Falta el nombre.'
    else if (nom.length > NOMBRE_MAX) errores.nombre = `El nombre no puede pasar de ${NOMBRE_MAX} caracteres.`
    if (!rol) errores.rol = 'Elegí el rol.'
    if (esAlta && !PIN_VALIDO.test(pin)) errores.pin = ERROR_DE_PIN
    if (esMozo) {
      const usu = usuario.trim()
      if (!usu) errores.usuario = 'Falta el usuario.'
      else if (usu.length > USUARIO_MAX) errores.usuario = `El usuario no puede pasar de ${USUARIO_MAX} caracteres.`
      if (esAlta) {
        const errorPass = errorDeContrasena(password)
        if (errorPass) errores.password = errorPass
      }
    }
    const errorTurno = errorDelTurno(turno)
    if (errorTurno) errores.turno = errorTurno
    return errores
  }

  const errores = intentado ? validar() : {}
  const mensajeUsuario = errores.usuario ?? errorUsuario
  const mensajeTurno = errores.turno ?? errorTurnoDelBack

  // El marco consulta esta guardia antes de navegar desde su menú o de cerrar la sesión (como P-14c).
  const pedirSalida = useCallback((continuar: () => void) => {
    setSalida({ continuar })
    return true
  }, [])
  useGuardiaDeSalida(hayCambios && !guardando ? pedirSalida : null)

  // Recargar o cerrar la pestaña: el aviso es el del navegador.
  useEffect(() => {
    if (!hayCambios) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [hayCambios])

  useEffect(() => {
    if (salida) refSeguirAca.current?.focus()
  }, [salida])

  function irA(destino: string, state?: EstadoDeLaNavegacion) {
    if (hayCambios) pedirSalida(() => navigate(destino, { state }))
    else navigate(destino, { state })
  }

  function volverALaLista(texto?: string) {
    navigate('/admin/empleados', { state: texto ? { aviso: texto } : undefined })
  }

  async function recargar(): Promise<EmpleadoDetalle | null> {
    if (!empleado) return null
    try {
      const actualizado = await detalleEmpleado(empleado.id)
      setEmpleado(actualizado)
      return actualizado
    } catch (err) {
      setAviso(textoDelError(err))
      return null
    }
  }

  function alternarMesa(id: number) {
    setMesaIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (guardandoRef.current || soloLectura) return
    setIntentado(true)
    setAviso(null)
    setExito(null)
    setSalida(null)
    setErrorUsuario(null)
    setErrorTurnoDelBack(null)
    const malos = validar()
    const primero = (['nombre', 'rol', 'pin', 'usuario', 'password', 'turno'] as Campo[]).find((c) => malos[c])
    if (primero) {
      const ref = refs[primero].current
      if (ref instanceof HTMLDivElement) ref.querySelector<HTMLElement>('input, button')?.focus()
      else ref?.focus()
      return
    }
    guardandoRef.current = true
    setGuardando(true)
    try {
      if (empleado) await guardarEdicion(empleado)
      else await guardarAlta()
    } finally {
      guardandoRef.current = false
      setGuardando(false)
    }
  }

  // El 409 del usuario va debajo del campo (P-23b); el 400 del turno, debajo del turno. El resto, arriba.
  function mostrarError(err: unknown, paso: 'datos' | 'turno' | 'mesas', prefijo = '') {
    const texto = textoDelError(err)
    if (paso === 'datos' && statusDe(err) === 409 && texto.toLowerCase().includes('usuario')) {
      setErrorUsuario(texto)
      refs.usuario.current?.focus()
      if (prefijo) setAviso(prefijo.trim())
    } else if (paso === 'turno' && statusDe(err) === 400) {
      setErrorTurnoDelBack(texto)
      if (prefijo) setAviso(prefijo.trim())
    } else {
      setAviso(`${prefijo}${texto}`)
    }
  }

  // Primero el POST, que crea al empleado; después el turno y, si es mozo, las mesas. Si falla uno de los de después,
  // el empleado ya existe: se pasa a su edición con lo que faltó como cambios sin guardar, para que otro "Guardar"
  // no lo cree dos veces.
  async function guardarAlta() {
    const nom = nombre.trim()
    let creado: EmpleadoDetalle
    try {
      creado = await crearEmpleado({
        nombre: nom,
        rol: rol as RolDeEmpleado,
        pin,
        ...(esMozo ? { nombreUsuario: usuario.trim(), password } : {}),
      })
    } catch (err) {
      // La contraseña no queda en pantalla después de un fallo. Sin `intentado`, el campo vacío no sale marcado:
      // el error que importa es el del back (como en FormularioDeAdmin).
      setPassword('')
      setMostrar(false)
      setIntentado(false)
      mostrarError(err, 'datos')
      return
    }
    const elegidas = esMozo ? mesaIds : []
    let paso: 'turno' | 'mesas' = 'turno'
    try {
      if (turnos.length > 0) await reemplazarTurnos(creado.id, turnos)
      paso = 'mesas'
      if (elegidas.length > 0) await reemplazarMesas(creado.id, elegidas)
    } catch (err) {
      const falta = paso === 'turno' ? (elegidas.length > 0 ? 'el turno y las mesas' : 'el turno') : 'las mesas'
      navigate(`/admin/empleados/${creado.id}`, {
        replace: true, // "Atrás" no vuelve al alta
        state: {
          aviso: `Se dio de alta a ${nom}, pero falta guardar ${falta}: ${conPunto(textoDelError(err))} Revisalo y guardá de nuevo.`,
          pendiente: { turnos, mesaIds: elegidas },
        },
      })
      return
    }
    volverALaLista(`Se dio de alta a ${nom}.`)
  }

  // Cada parte se manda solo si cambió. Si una falla, lo anterior ya quedó guardado y se dice.
  async function guardarEdicion(actual: EmpleadoDetalle) {
    const nom = nombre.trim()
    const guardado: string[] = []
    let paso: 'datos' | 'turno' | 'mesas' = 'datos'
    try {
      if (nom !== actual.nombre || (esMozo && usuario.trim() !== (actual.nombreUsuario ?? ''))) {
        actual = await editarEmpleado(actual.id, { nombre: nom, ...(esMozo ? { nombreUsuario: usuario.trim() } : {}) })
        guardado.push('los datos')
      }
      paso = 'turno'
      if (!mismosTurnos(turnos, actual.turnos)) {
        actual = await reemplazarTurnos(actual.id, turnos)
        guardado.push('el turno')
      }
      paso = 'mesas'
      if (esMozo && !mismasMesas(mesaIds, actual.mesaIds)) {
        actual = await reemplazarMesas(actual.id, mesaIds)
      }
    } catch (err) {
      setEmpleado(actual)
      const verbo = guardado.length === 1 && guardado[0] === 'el turno' ? 'Se guardó' : 'Se guardaron'
      const prefijo =
        guardado.length > 0 ? `${verbo} ${guardado.join(' y ')}, pero no ${paso === 'turno' ? 'el turno' : 'las mesas'}. ` : ''
      mostrarError(err, paso, prefijo)
      // Si lo dieron de baja en otra pestaña, la pantalla pasa a solo lectura.
      if (statusDe(err) === 409 && !textoDelError(err).toLowerCase().includes('usuario')) void recargar()
      return
    }
    volverALaLista(`Se guardaron los cambios de ${nom}.`)
  }

  async function darDeBaja() {
    if (!empleado || dandoDeBaja) return
    setDandoDeBaja(true)
    try {
      await darDeBajaEmpleado(empleado.id)
      setDialogo(null)
      setExito(`Se dio de baja a ${empleado.nombre}.`)
      await recargar()
    } catch (err) {
      setDialogo(null)
      setAviso(textoDelError(err))
    } finally {
      setDandoDeBaja(false)
    }
  }

  const numerosElegidos = mesas.filter((m) => mesaIds.includes(m.id)).map((m) => m.numero)
  const deshabilitado = guardando || soloLectura

  // Los diálogos van afuera del <form>: BlanquearPin y CargarAusencia tienen el suyo, y un form adentro de otro no vale.
  return (
    <>
      <form
        onSubmit={guardar}
        noValidate
        className="flex min-h-full flex-col gap-[18px] bg-fondo px-8 pt-7 pb-6 font-inter text-texto"
      >
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5 leading-[normal]">
            <h1 className="titulo truncate text-[25px]">{empleado ? empleado.nombre : 'Nuevo empleado'}</h1>
            <p className="text-[13px] text-secundario">
              {empleado
                ? `Empleados y turnos › ${empleado.nombre} · ${ROL[empleado.rol]} · los cambios quedan en la auditoría`
                : 'Empleados y turnos › Nuevo empleado · queda registrado en Auditoría quién lo dio de alta y cuándo'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => irA('/admin/empleados')}
            disabled={guardando}
            className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] text-[15px] font-semibold underline disabled:opacity-[.38] ${foco}`}
          >
            <img src={iconoVolver} alt="" width={20} height={20} />
            Volver a Empleados
          </button>
        </header>

        {soloLectura && (
          <AvisoDeFallo icono="candado" titulo="Está dado de baja">
            No puede entrar al sistema y sus datos no se pueden cambiar. Sus pedidos y su auditoría se conservan.
          </AvisoDeFallo>
        )}
        {aviso && <AvisoDeFallo>{aviso}</AvisoDeFallo>}
        {exito && (
          <p role="status" className="rounded-[14px] bg-suave p-3 text-[15px] font-semibold">
            {exito}
          </p>
        )}
        {salida && hayCambios && (
          <div role="alert" className="flex flex-col gap-3 rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3.5">
            <div className="flex items-start gap-3">
              <img src={iconoAlerta} alt="" width={20} height={20} className="shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-[15px] font-semibold">Tenés cambios sin guardar</p>
                <p className="text-[13px] leading-[1.4]">Si salís ahora, se pierden.</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2.5">
              <button type="button" onClick={() => salida.continuar()} className={`h-11 text-[15px] ${botonContorno}`}>
                Salir sin guardar
              </button>
              <button ref={refSeguirAca} type="button" onClick={() => setSalida(null)} className={`h-11 text-[15px] ${botonLleno}`}>
                Seguir acá
              </button>
            </div>
          </div>
        )}

        <div className="flex items-start gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="empleado-nombre" className={rotulo}>
                Nombre y apellido
              </label>
              <input
                ref={refs.nombre}
                id="empleado-nombre"
                type="text"
                autoComplete="off"
                value={nombre}
                maxLength={NOMBRE_MAX}
                disabled={deshabilitado}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Pablo Díaz"
                aria-invalid={errores.nombre ? true : undefined}
                aria-describedby={errores.nombre ? 'empleado-nombre-error' : undefined}
                className={campo(!!errores.nombre)}
              />
              {errores.nombre && <ErrorDeCampo id="empleado-nombre-error">{errores.nombre}</ErrorDeCampo>}
            </div>

            <div className="flex flex-col gap-1.5">
              <p id="empleado-rol" className={rotulo}>
                Rol
              </p>
              <div
                role="radiogroup"
                aria-labelledby="empleado-rol"
                aria-describedby={errores.rol ? 'empleado-rol-error' : esAlta ? undefined : 'empleado-rol-ayuda'}
                className="grid grid-cols-3 gap-3"
              >
                {ROLES.map((r, i) => {
                  const elegido = rol === r.valor
                  return (
                    <button
                      key={r.valor}
                      ref={i === 0 ? refs.rol : undefined}
                      type="button"
                      role="radio"
                      aria-checked={elegido}
                      aria-label={`${r.texto}: ${r.detalle}`}
                      // El rol no cambia en la edición: para eso, baja y alta (ST-22).
                      disabled={deshabilitado || !esAlta}
                      onClick={() => setRol(r.valor)}
                      className={`flex min-h-[72px] flex-col gap-1.5 rounded-2xl bg-tarjeta p-3.5 text-left leading-[normal] disabled:cursor-default ${foco} ${
                        elegido ? 'border-2 border-primario' : `border-[1.25px] border-secundario ${esAlta ? '' : 'opacity-[.5]'}`
                      } ${errores.rol ? 'border-2 border-primario' : ''}`}
                    >
                      <span className="flex items-center gap-2">
                        <img src={r.icono} alt="" width={20} height={20} />
                        <span className="flex-1 text-[17px] font-semibold">{r.texto}</span>
                        {elegido && (
                          <span className="flex items-center gap-1 rounded-md bg-primario px-2 py-0.5 text-[12px] font-medium text-texto-boton">
                            <img src={iconoElegidaBlanco} alt="" width={14} height={14} />
                            Elegido
                          </span>
                        )}
                      </span>
                      <span className="text-[13px] text-secundario">{r.detalle}</span>
                    </button>
                  )
                })}
              </div>
              {errores.rol && <ErrorDeCampo id="empleado-rol-error">{errores.rol}</ErrorDeCampo>}
              {!esAlta && (
                <p id="empleado-rol-ayuda" className="text-[13px] text-secundario">
                  El rol no se cambia: para otro rol, se da de baja y se da de alta de nuevo.
                </p>
              )}
            </div>

            {esAlta ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="empleado-pin" className={rotulo}>
                  PIN inicial
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={refs.pin}
                    id="empleado-pin"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={10}
                    value={pin}
                    disabled={deshabilitado}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    aria-invalid={errores.pin ? true : undefined}
                    aria-describedby={errores.pin ? 'empleado-pin-error empleado-pin-ayuda' : 'empleado-pin-ayuda'}
                    className={`h-12 w-[150px] rounded-xl bg-linea px-3.5 text-center text-[22px] font-semibold tracking-[0.3em] tabular-nums ${
                      errores.pin ? 'border-2 border-primario' : 'border-0'
                    } ${foco}`}
                  />
                  <button type="button" onClick={() => setPin(generarPin())} disabled={deshabilitado} className={`h-12 text-[15px] ${botonContorno}`}>
                    <img src={iconoGenerar} alt="" width={20} height={20} />
                    Generar otro
                  </button>
                  <p id="empleado-pin-ayuda" className="text-[13px] text-secundario">
                    Se lo das en persona. Lo cambia en su primer ingreso.
                  </p>
                </div>
                {errores.pin && <ErrorDeCampo id="empleado-pin-error">{errores.pin}</ErrorDeCampo>}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <p className={rotulo}>PIN</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDialogo('blanqueo')}
                    disabled={deshabilitado}
                    className={`h-12 text-[15px] ${botonContorno}`}
                  >
                    <img src={iconoGenerar} alt="" width={20} height={20} />
                    Blanquear PIN
                  </button>
                  <p className="max-w-[340px] text-[13px] leading-[1.4] text-secundario">
                    Pone uno provisorio y le destraba el usuario si estaba bloqueado.
                  </p>
                </div>
                {empleado.activo && empleado.bloqueado && (
                  <p className="flex items-center gap-2 text-[13px] font-semibold">
                    <img src={iconoBloqueado} alt="" width={16} height={16} />
                    Está bloqueado por intentos fallidos: blanqueale el PIN para que pueda entrar.
                  </p>
                )}
                {empleado.activo && !empleado.bloqueado && empleado.debeCambiarCredencial && (
                  <p className="text-[13px]">Tiene un PIN provisorio: elige uno propio la próxima vez que entra.</p>
                )}
              </div>
            )}

            {esMozo && (
              <div role="group" aria-labelledby="empleado-acceso" className="flex flex-col gap-1.5">
                <p id="empleado-acceso" className={rotulo}>
                  Usuario y contraseña (solo Mozo)
                </p>
                <div className="flex gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <label htmlFor="empleado-usuario" className={rotulo}>
                      Usuario
                    </label>
                    <input
                      ref={refs.usuario}
                      id="empleado-usuario"
                      type="text"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={USUARIO_MAX}
                      value={usuario}
                      disabled={deshabilitado}
                      onChange={(e) => {
                        setUsuario(e.target.value)
                        setErrorUsuario(null)
                      }}
                      aria-invalid={mensajeUsuario ? true : undefined}
                      aria-describedby={mensajeUsuario ? 'empleado-usuario-error' : undefined}
                      className={campo(!!mensajeUsuario)}
                    />
                    {mensajeUsuario && <ErrorDeCampo id="empleado-usuario-error">{mensajeUsuario}</ErrorDeCampo>}
                  </div>
                  {esAlta && (
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <label htmlFor="empleado-password" className={rotulo}>
                        Contraseña provisoria
                      </label>
                      <div
                        className={`flex h-12 w-full items-center gap-1 rounded-xl bg-tarjeta pr-0.5 pl-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primario ${bordeDe(!!errores.password)}`}
                      >
                        <input
                          ref={refs.password}
                          id="empleado-password"
                          type={mostrar ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={password}
                          disabled={deshabilitado}
                          onChange={(e) => setPassword(e.target.value)}
                          aria-invalid={errores.password ? true : undefined}
                          aria-describedby={errores.password ? 'empleado-password-error' : 'empleado-acceso-ayuda'}
                          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-texto outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrar((m) => !m)}
                          aria-pressed={mostrar}
                          aria-label={mostrar ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
                          className={`flex h-11 shrink-0 items-center gap-1.5 rounded-[10px] px-2 text-[13px] font-medium underline ${foco}`}
                        >
                          <img src={iconoMostrar} alt="" width={18} height={18} />
                          {mostrar ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                      {errores.password && <ErrorDeCampo id="empleado-password-error">{errores.password}</ErrorDeCampo>}
                    </div>
                  )}
                </div>
                <p id="empleado-acceso-ayuda" className="text-[13px] text-secundario">
                  {esAlta
                    ? 'La primera vez que entra elige una contraseña propia.'
                    : empleado.contrasenaProvisoria
                      ? 'Todavía no eligió su contraseña: la elige la próxima vez que entra.'
                      : 'Ya eligió su contraseña: no se ve ni se cambia desde acá.'}
                </p>
              </div>
            )}

            <div ref={refs.turno}>
              <TurnoSemanal
                estado={turno}
                alCambiar={(t) => {
                  setTurno(t)
                  setErrorTurnoDelBack(null)
                }}
                error={mensajeTurno ?? null}
                deshabilitado={deshabilitado}
              />
            </div>
          </div>

          <div className="flex w-[300px] shrink-0 flex-col gap-4">
            {esMozo && (
              <div role="group" aria-labelledby="mesas-titulo" className="flex flex-col gap-3 rounded-2xl border border-linea bg-tarjeta p-[18px]">
                <div className="flex flex-col gap-1 leading-[normal]">
                  <h2 id="mesas-titulo" className="text-[16px] font-semibold">
                    Mesas asignadas
                  </h2>
                  <p className="text-[13px] text-secundario">Solo para Mozo. Una mesa puede tener varios mozos.</p>
                </div>
                {mesas.length === 0 ? (
                  <p className="text-[13px]">No hay mesas cargadas. Se cargan en Mesas y QR.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {mesas.map((m) => {
                      const elegida = mesaIds.includes(m.id)
                      return (
                        <button
                          key={m.id}
                          type="button"
                          aria-pressed={elegida}
                          aria-label={`Mesa ${m.numero}${m.inhabilitada ? ', inhabilitada' : ''}`}
                          disabled={deshabilitado}
                          onClick={() => alternarMesa(m.id)}
                          className={`flex h-11 min-w-11 items-center justify-center rounded-full text-[14px] leading-[normal] disabled:opacity-[.6] ${foco} ${
                            elegida ? 'gap-1 bg-suave px-3 font-medium' : 'border-[1.25px] border-secundario px-3'
                          } ${m.inhabilitada ? 'border-dashed' : ''}`}
                        >
                          {elegida && <img src={iconoElegida} alt="" width={16} height={16} />}
                          {m.numero}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {esAlta && (
              <div className="flex flex-col gap-2 rounded-2xl border border-linea bg-tarjeta p-[18px] text-[13px] leading-[normal]">
                <h2 className="mb-1 text-[16px] font-semibold">Resumen</h2>
                <dl className="flex flex-col gap-2">
                  {(
                    [
                      ['Nombre', nombre.trim() || '—'],
                      ['Rol', rol ? ROL[rol] : '—'],
                      ['Turno', errorDelTurno(turno) || turnos.length === 0 ? '—' : resumenDeTurnos(turnos).join(' · ')],
                      ...(esMozo ? [['Mesas', textoDeMesas(numerosElegidos)]] : []),
                      ['PIN inicial', pin || '—'],
                      ...(esMozo ? [['Usuario', usuario.trim() || '—']] : []),
                    ] as [string, string][]
                  ).map(([clave, valor]) => (
                    <div key={clave} className="flex justify-between gap-3">
                      <dt className="text-secundario">{clave}</dt>
                      <dd className="text-right font-medium">{valor}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {empleado && (
              <AusenciasDelEmpleado
                empleado={empleado}
                soloLectura={soloLectura}
                deshabilitado={guardando}
                alPedirCarga={() => setDialogo('ausencia')}
                alTerminar={() => {
                  setAviso(null)
                  // Si otra ausencia también cubre hoy, sigue sin entrar: lo dice el detalle que manda el back.
                  void recargar().then((actualizado) =>
                    setExito(
                      actualizado?.ausenciaVigente
                        ? 'Se terminó la ausencia, pero hoy tiene otra: sigue sin poder entrar.'
                        : 'Se terminó la ausencia: desde hoy puede entrar.',
                    ),
                  )
                }}
                alFallar={(texto) => {
                  setExito(null)
                  setAviso(texto)
                }}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          {soloLectura ? (
            <button type="button" onClick={() => navigate('/admin/empleados')} className={`h-12 text-[15px] ${botonContorno}`}>
              <img src={iconoVolver} alt="" width={20} height={20} />
              Volver a Empleados
            </button>
          ) : (
            <>
              {empleado && (
                <button
                  type="button"
                  onClick={() => setDialogo('baja')}
                  disabled={guardando}
                  className={`h-12 text-[15px] ${botonContorno}`}
                >
                  <img src={iconoBaja} alt="" width={20} height={20} />
                  Dar de baja
                </button>
              )}
              <button type="button" onClick={() => irA('/admin/empleados')} disabled={guardando} className={`h-12 text-[15px] ${botonContorno}`}>
                <img src={iconoCancelar} alt="" width={20} height={20} />
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className={`h-12 text-[15px] ${botonLleno}`}>
                <img src={iconoGuardar} alt="" width={20} height={20} />
                {guardando ? 'Guardando…' : esAlta ? 'Guardar empleado' : 'Guardar cambios'}
              </button>
            </>
          )}
        </div>
      </form>

      {empleado && dialogo === 'blanqueo' && (
        <BlanquearPin
          empleado={empleado}
          alCancelar={() => setDialogo(null)}
          alBlanquear={(actualizado) => {
            setEmpleado(actualizado)
            setDialogo(null)
            setAviso(null)
            setExito(`Se blanqueó el PIN de ${actualizado.nombre}. Dáselo en persona.`)
          }}
        />
      )}
      {empleado && dialogo === 'ausencia' && (
        <CargarAusencia
          empleadoId={empleado.id}
          nombre={empleado.nombre}
          alCancelar={() => setDialogo(null)}
          alCargar={() => {
            setDialogo(null)
            setAviso(null)
            setExito('Se cargó la ausencia.')
            void recargar()
          }}
        />
      )}
      {empleado && dialogo === 'baja' && (
        <ConfirmarBorrado
          nombre={empleado.nombre}
          borrando={dandoDeBaja}
          alVolver={() => setDialogo(null)}
          alConfirmar={() => void darDeBaja()}
        />
      )}
    </>
  )
}
