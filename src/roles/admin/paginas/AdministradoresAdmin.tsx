import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  cambiarActivoDeAdmin,
  desbloquearAdmin,
  listarAdmins,
  type Admin,
} from '../../../compartido/api/gerente'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import { normalizar } from '../../../compartido/ui/normalizar'
import DialogoDeConfirmacion from '../componentes/DialogoDeConfirmacion'

// `vez` cambia siempre: dos avisos iguales seguidos vuelven a contar los 5 segundos.
interface Aviso {
  texto: string
  error: boolean
  vez: number
}

function estadoDe(a: Admin): 'Bloqueado' | 'Activo' | 'Inactivo' {
  return a.bloqueado ? 'Bloqueado' : a.activo ? 'Activo' : 'Inactivo'
}

export default function AdministradoresAdmin() {
  const location = useLocation()
  const navigate = useNavigate()

  const [admins, setAdmins] = useState<Admin[] | null>(null)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [aviso, setAviso] = useState<Aviso | null>(() => {
    const texto = (location.state as { aviso?: string } | null)?.aviso
    return texto ? { texto, error: false, vez: 0 } : null
  })
  const [aDesactivar, setADesactivar] = useState<Admin | null>(null)
  const [enviandoId, setEnviandoId] = useState<number | null>(null)

  const ultimoPedido = useRef(0) // vale solo la última respuesta
  const hayDatos = useRef(false)
  const enviandoRef = useRef(false) // el estado llega un render tarde: la ref corta el doble toque
  const vez = useRef(0)

  function avisar(texto: string, error = false) {
    setAviso({ texto, error, vez: ++vez.current })
  }

  function cargar() {
    const numero = ++ultimoPedido.current
    listarAdmins()
      .then((lista) => {
        if (numero !== ultimoPedido.current) return
        hayDatos.current = true
        setAdmins(lista)
        setErrorLista(null)
      })
      .catch((err) => {
        if (numero !== ultimoPedido.current) return
        // Con la lista en pantalla, el fallo va al aviso y la lista se queda.
        if (hayDatos.current) avisar(textoDelError(err), true)
        else setErrorLista(textoDelError(err))
      })
  }

  // Al entrar: pide la lista y limpia el aviso que vino en el state de la navegación (una sola vez).
  useEffect(() => {
    cargar()
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

  async function accionar(admin: Admin, llamada: () => Promise<void>, textoOk: string) {
    if (enviandoRef.current) return
    enviandoRef.current = true
    setEnviandoId(admin.id)
    try {
      await llamada()
      avisar(textoOk)
      cargar()
    } catch (err) {
      avisar(textoDelError(err), true)
      const status = statusDe(err)
      if (status === 404 || status === 409) cargar() // la lista que se ve puede estar vieja
    } finally {
      enviandoRef.current = false
      setEnviandoId(null)
      setADesactivar(null)
    }
  }

  const texto = normalizar(busqueda.trim())
  const todos = admins ?? []
  const visibles = todos.filter(
    (a) => texto === '' || normalizar(a.nombre).includes(texto) || normalizar(a.email).includes(texto),
  )

  return (
    <section className="min-h-dvh bg-fondo p-8 text-texto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[Fraunces] text-3xl font-semibold">Administradores</h1>
          <p className="mt-1 text-sm text-secundario">
            {admins === null
              ? 'Quiénes administran el local.'
              : `${todos.length} ${todos.length === 1 ? 'administrador' : 'administradores'}`}
          </p>
        </div>
        <Link
          to="/admin/administradores/nuevo"
          className="inline-flex min-h-11 items-center rounded-xl bg-primario px-5 font-semibold whitespace-nowrap text-texto-boton"
        >
          + Nuevo administrador
        </Link>
      </div>

      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre o email"
        aria-label="Buscar administrador"
        className="mt-6 min-h-11 w-full max-w-md rounded-xl border border-linea bg-tarjeta px-4"
      />

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

      {admins === null && !errorLista ? (
        <p className="py-16 text-center text-secundario">Cargando los administradores…</p>
      ) : admins === null ? (
        <div className="py-16 text-center">
          <p>{errorLista}</p>
          <button
            type="button"
            onClick={cargar}
            className="mt-4 min-h-11 rounded-xl border-2 border-primario px-5 font-semibold text-primario"
          >
            Probá de nuevo
          </button>
        </div>
      ) : todos.length === 0 ? (
        <p className="py-16 text-center text-secundario">Todavía no hay administradores.</p>
      ) : visibles.length === 0 ? (
        <p className="py-16 text-center text-secundario">No hay administradores con ese nombre.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-linea bg-tarjeta">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-linea text-xs tracking-wide text-secundario">
                <th className="py-3 pr-3 pl-6 font-semibold">NOMBRE</th>
                <th className="px-3 py-3 font-semibold">EMAIL</th>
                <th className="px-3 py-3 font-semibold">ESTADO</th>
                <th className="py-3 pr-6 pl-3 text-right font-semibold">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((a) => {
                const enviando = enviandoId === a.id
                return (
                  <tr key={a.id} className="border-b border-linea last:border-b-0">
                    <td className="py-2 pr-3 pl-6 font-medium">{a.nombre}</td>
                    <td className="px-3 py-2 text-secundario">{a.email}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-md bg-suave px-2 py-1 text-xs font-semibold">{estadoDe(a)}</span>
                    </td>
                    <td className="py-2 pr-6 pl-3 text-right">
                      {a.bloqueado && (
                        <button
                          type="button"
                          disabled={enviando}
                          onClick={() =>
                            accionar(a, () => desbloquearAdmin(a.id), `Se desbloqueó a ${a.nombre}.`)
                          }
                          className="min-h-11 px-3 font-semibold text-primario underline disabled:opacity-50"
                        >
                          {enviando ? 'Un momento…' : 'Desbloquear'}
                        </button>
                      )}
                      {a.activo ? (
                        <button
                          type="button"
                          disabled={enviando}
                          onClick={() => setADesactivar(a)}
                          className="min-h-11 px-3 font-semibold text-secundario underline disabled:opacity-50"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={enviando}
                          onClick={() =>
                            accionar(a, () => cambiarActivoDeAdmin(a.id, true), `Se activó a ${a.nombre}.`)
                          }
                          className="min-h-11 px-3 font-semibold text-primario underline disabled:opacity-50"
                        >
                          {enviando ? 'Un momento…' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {aDesactivar && (
        <DialogoDeConfirmacion
          key={aDesactivar.id}
          titulo={`¿Desactivar a ${aDesactivar.nombre}?`}
          texto="Ya no va a poder entrar al sistema. Después lo podés volver a activar."
          textoConfirmar="Sí, desactivar"
          enviando={enviandoId !== null}
          alVolver={() => setADesactivar(null)}
          alConfirmar={() =>
            accionar(aDesactivar, () => cambiarActivoDeAdmin(aDesactivar.id, false), `Se desactivó a ${aDesactivar.nombre}.`)
          }
        />
      )}
    </section>
  )
}
