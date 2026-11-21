import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { borrarEmpleado, listarEmpleados, type Empleado, type RolDeEmpleado } from '../../../compartido/api/empleados'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import { normalizar } from '../../../compartido/ui/normalizar'
import ConfirmarBorrado from '../componentes/ConfirmarBorrado'

const ROL: Record<RolDeEmpleado, string> = { MOZO: 'Mozo', CAJA: 'Caja', COCINA: 'Cocina' }

// `vez` cambia siempre: dos avisos iguales seguidos vuelven a contar los 5 segundos.
interface Aviso {
  texto: string
  error: boolean
  vez: number
}

export default function EmpleadosAdmin() {
  const location = useLocation()
  const navigate = useNavigate()

  const [empleados, setEmpleados] = useState<Empleado[] | null>(null)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [aviso, setAviso] = useState<Aviso | null>(() => {
    const texto = (location.state as { aviso?: string } | null)?.aviso
    return texto ? { texto, error: false, vez: 0 } : null
  })
  const [aBorrar, setABorrar] = useState<Empleado | null>(null)
  const [borrando, setBorrando] = useState(false)

  const ultimoPedido = useRef(0) // vale solo la última respuesta
  const hayDatos = useRef(false)
  const enviandoRef = useRef(false) // el estado llega un render tarde: la ref corta el doble toque
  const vez = useRef(0)

  function avisar(texto: string, error = false) {
    setAviso({ texto, error, vez: ++vez.current })
  }

  function recargar() {
    const numero = ++ultimoPedido.current
    listarEmpleados()
      .then((lista) => {
        if (numero !== ultimoPedido.current) return
        hayDatos.current = true
        setEmpleados(lista)
        setErrorLista(null)
      })
      .catch((err) => {
        if (numero !== ultimoPedido.current) return
        // Con la lista en pantalla, el fallo va al aviso; la pantalla de error es solo para la primera carga.
        if (hayDatos.current) avisar(textoDelError(err), true)
        else setErrorLista(textoDelError(err))
      })
  }

  // Al entrar: pide la lista y limpia el aviso que vino en el state de la navegación, para que no reaparezca al
  // recargar la página.
  useEffect(() => {
    recargar()
    if ((location.state as { aviso?: string } | null)?.aviso) {
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // El aviso se va solo a los 5 segundos.
  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(id)
  }, [aviso])

  async function confirmarBorrado() {
    if (!aBorrar || enviandoRef.current) return
    enviandoRef.current = true
    setBorrando(true)
    const { id, nombre } = aBorrar
    try {
      await borrarEmpleado(id)
      setABorrar(null)
      avisar(`Se borró a ${nombre}.`)
      recargar()
    } catch (err) {
      // Como en el resto de las pantallas: el diálogo se cierra y el texto del back va arriba.
      setABorrar(null)
      avisar(textoDelError(err), true)
      const status = statusDe(err)
      if (status === 404 || status === 409) recargar() // la lista que se ve puede estar vieja
    } finally {
      enviandoRef.current = false
      setBorrando(false)
    }
  }

  const texto = normalizar(busqueda.trim())
  const todos = empleados ?? []
  const visibles = todos.filter((e) => texto === '' || normalizar(e.nombre).includes(texto))

  return (
    <section className="min-h-dvh bg-fondo p-8 text-texto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[Fraunces] text-3xl font-semibold">Empleados y turnos</h1>
          <p className="mt-1 text-sm text-secundario">Quién entra al sistema, con qué rol y en qué turno.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar empleado"
            aria-label="Buscar empleado"
            className="min-h-11 w-64 rounded-xl border border-linea bg-tarjeta px-4"
          />
          <Link
            to="/admin/empleados/nuevo"
            className="inline-flex min-h-11 items-center rounded-xl bg-primario px-5 font-semibold whitespace-nowrap text-texto-boton"
          >
            + Nuevo empleado
          </Link>
        </div>
      </div>

      {aviso && (
        <p
          key={aviso.vez}
          role={aviso.error ? 'alert' : 'status'}
          onClick={() => setAviso(null)}
          className="mt-4 cursor-pointer rounded-xl border-2 border-primario bg-tarjeta p-3 font-semibold"
        >
          {aviso.error && '⚠ '}
          {aviso.texto}
        </p>
      )}

      {empleados === null && !errorLista ? (
        <p className="py-16 text-center text-secundario">Cargando los empleados…</p>
      ) : empleados === null ? (
        <div className="py-16 text-center">
          <p>{errorLista}</p>
          <button
            type="button"
            onClick={recargar}
            className="mt-4 min-h-11 rounded-xl border-2 border-primario px-5 font-semibold text-primario"
          >
            Probá de nuevo
          </button>
        </div>
      ) : todos.length === 0 ? (
        <p className="py-16 text-center text-secundario">Todavía no hay empleados.</p>
      ) : visibles.length === 0 ? (
        <p className="py-16 text-center text-secundario">No hay empleados con ese nombre.</p>
      ) : (
        <table className="mt-6 w-full text-left">
          <thead>
            <tr className="border-b border-linea text-xs tracking-wide text-secundario">
              <th className="py-3 font-semibold">NOMBRE</th>
              <th className="py-3 font-semibold">ROL</th>
              <th className="py-3 font-semibold">TURNO</th>
              <th className="py-3 text-right font-semibold">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((e) => (
              <tr key={e.id} className="border-b border-linea">
                <td className="py-2 font-medium">{e.nombre}</td>
                <td className="py-2">
                  <span className="rounded-md bg-suave px-2 py-1 text-xs">{ROL[e.rol] ?? e.rol}</span>
                </td>
                <td className="py-2 text-sm tabular-nums">{e.turno || '—'}</td>
                <td className="py-2 text-right">
                  <Link
                    to={`/admin/empleados/${e.id}`}
                    className="inline-flex min-h-11 items-center px-3 font-semibold text-primario underline"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => setABorrar(e)}
                    className="min-h-11 px-3 font-semibold text-secundario underline"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {aBorrar && (
        <ConfirmarBorrado
          key={aBorrar.id}
          nombre={aBorrar.nombre}
          borrando={borrando}
          alVolver={() => setABorrar(null)}
          alConfirmar={confirmarBorrado}
        />
      )}
    </section>
  )
}
