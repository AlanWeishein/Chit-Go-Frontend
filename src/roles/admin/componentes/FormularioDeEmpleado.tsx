import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  crearEmpleado,
  editarEmpleado,
  listarEmpleados,
  type EmpleadoResumen as Empleado,
  type RolDeEmpleado,
} from '../../../compartido/api/empleados'
import { textoDelError } from '../../../compartido/api/errores'

type Campo = 'nombre' | 'rol' | 'pin'

const ROLES: { valor: RolDeEmpleado; texto: string }[] = [
  { valor: 'MOZO', texto: 'Mozo' },
  { valor: 'CAJA', texto: 'Caja' },
  { valor: 'COCINA', texto: 'Cocina' },
]

function validar(nombre: string, rol: string, pin: string, esAlta: boolean): Partial<Record<Campo, string>> {
  const errores: Partial<Record<Campo, string>> = {}
  if (!nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!rol) errores.rol = 'Elegí un rol.'
  // Deducido: los PIN de prueba del kit son de 4 cifras. El back valida igual.
  if (esAlta && !/^\d{4}$/.test(pin)) errores.pin = 'El PIN tiene que ser de 4 números.'
  return errores
}

// Una sola pantalla para crear y editar. La key reinicia el formulario al pasar de uno a otro, para que no
// herede lo escrito en el anterior.
export default function FormularioDeEmpleado() {
  const { empleadoId } = useParams()
  return <Formulario key={empleadoId ?? 'nuevo'} empleadoId={empleadoId} />
}

function Formulario({ empleadoId }: { empleadoId: string | undefined }) {
  const esEdicion = empleadoId !== undefined
  const navigate = useNavigate()

  const [empleado, setEmpleado] = useState<Empleado | null>(null)
  const [cargando, setCargando] = useState(esEdicion)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<RolDeEmpleado | ''>('')
  const [turno, setTurno] = useState('')
  const [pin, setPin] = useState('')

  const [intentado, setIntentado] = useState(false) // los errores de campo salen después del primer intento
  const [enviando, setEnviando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)
  const enviandoRef = useRef(false)

  const refs = {
    nombre: useRef<HTMLInputElement>(null),
    rol: useRef<HTMLSelectElement>(null),
    pin: useRef<HTMLInputElement>(null),
  }

  // No hay GET por id: para editar se pide la lista y se busca el empleado (como la carta del Admin).
  useEffect(() => {
    if (!esEdicion) return
    let vigente = true
    listarEmpleados(0, 100) // provisorio hasta la tarea 7 de la ST-31, que pide GET /admin/empleados/{id}
      .then((pagina) => {
        if (!vigente) return
        const e = pagina.contenido.find((x) => x.id === Number(empleadoId))
        if (!e) {
          setErrorCarga('El empleado no existe.')
          return
        }
        setEmpleado(e)
        setNombre(e.nombre)
        setRol(e.rol)
      })
      .catch((err) => {
        if (vigente) setErrorCarga(textoDelError(err))
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [esEdicion, empleadoId])

  const errores = intentado ? validar(nombre, rol, pin, !esEdicion) : {}

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (enviandoRef.current) return
    setIntentado(true)
    const malos = validar(nombre, rol, pin, !esEdicion)
    const primero = (['nombre', 'rol', 'pin'] as Campo[]).find((c) => malos[c])
    if (primero) {
      refs[primero].current?.focus()
      return
    }

    enviandoRef.current = true
    setEnviando(true)
    setErrorGuardar(null)
    try {
      const datos = { nombre: nombre.trim(), rol: rol as RolDeEmpleado, turno: turno.trim() || null }
      if (empleado) await editarEmpleado(empleado.id, datos)
      else await crearEmpleado({ ...datos, pin })
      navigate('/admin/empleados', {
        replace: true, // "Atrás" no vuelve al formulario
        state: { aviso: empleado ? 'Se guardaron los cambios.' : `Se dio de alta a ${datos.nombre}.` },
      })
    } catch (err) {
      setErrorGuardar(textoDelError(err))
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  if (cargando) return <p className="p-8 text-secundario">Cargando el empleado…</p>
  if (errorCarga) {
    return (
      <div className="p-8 text-texto">
        <Link to="/admin/empleados" className="inline-flex min-h-11 items-center font-semibold underline">
          ← Empleados
        </Link>
        <p className="mt-6">{errorCarga}</p>
      </div>
    )
  }

  const campo = 'mt-2 min-h-11 w-full rounded-xl border border-linea bg-fondo px-4'

  return (
    <section className="min-h-dvh bg-fondo p-8 text-texto">
      <Link to="/admin/empleados" className="inline-flex min-h-11 items-center font-semibold text-secundario underline">
        ← Empleados
      </Link>

      <h1 className="mt-2 font-[Fraunces] text-3xl font-semibold">
        {esEdicion ? 'Editar empleado' : 'Nuevo empleado'}
      </h1>

      <form onSubmit={guardar} noValidate className="mt-6 max-w-md space-y-5 rounded-3xl border border-linea bg-tarjeta p-6">
        <div>
          <label htmlFor="nombre" className="block text-sm font-semibold text-secundario">
            Nombre
          </label>
          <input
            ref={refs.nombre}
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-invalid={errores.nombre ? true : undefined}
            aria-describedby={errores.nombre ? 'error-nombre' : undefined}
            className={campo}
          />
          {errores.nombre && (
            <p id="error-nombre" className="mt-1 text-sm font-semibold">
              {errores.nombre}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="rol" className="block text-sm font-semibold text-secundario">
            Rol
          </label>
          <select
            ref={refs.rol}
            id="rol"
            value={rol}
            onChange={(e) => setRol(e.target.value as RolDeEmpleado | '')}
            aria-invalid={errores.rol ? true : undefined}
            aria-describedby={errores.rol ? 'error-rol' : undefined}
            className={campo}
          >
            <option value="">Elegí un rol</option>
            {ROLES.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.texto}
              </option>
            ))}
          </select>
          {errores.rol && (
            <p id="error-rol" className="mt-1 text-sm font-semibold">
              {errores.rol}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="turno" className="block text-sm font-semibold text-secundario">
            Turno (opcional)
          </label>
          <input
            id="turno"
            type="text"
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
            placeholder="18:00–02:00"
            className={campo}
          />
        </div>

        {/* El PIN es una credencial: se carga al dar de alta y nunca se vuelve a mostrar. */}
        {!esEdicion && (
          <div>
            <label htmlFor="pin" className="block text-sm font-semibold text-secundario">
              PIN (4 números)
            </label>
            <input
              ref={refs.pin}
              id="pin"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              aria-invalid={errores.pin ? true : undefined}
              aria-describedby={errores.pin ? 'error-pin' : undefined}
              className={`${campo} tabular-nums`}
            />
            {errores.pin && (
              <p id="error-pin" className="mt-1 text-sm font-semibold">
                {errores.pin}
              </p>
            )}
          </div>
        )}

        {errorGuardar && (
          <p role="alert" className="rounded-xl border-2 border-primario p-3 text-sm font-semibold">
            ⚠ {errorGuardar}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="min-h-12 w-full rounded-xl bg-primario font-semibold text-texto-boton disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : 'Guardar empleado'}
        </button>
      </form>
    </section>
  )
}
