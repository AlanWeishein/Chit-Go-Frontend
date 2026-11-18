import { api } from './http'
import type { Pagina } from './paginacion'

export interface Admin {
  id: number
  nombre: string
  email: string
  activo: boolean
  bloqueado: boolean
}

export interface AltaDeAdmin {
  nombre: string
  email: string
  password: string
}

export async function listarAdmins(): Promise<Admin[]> {
  const respuesta = await api<Admin[] | Pagina<Admin>>('/gerente/admins')
  return Array.isArray(respuesta) ? respuesta : respuesta.contenido
}

// La respuesta no se usa: la pantalla vuelve a pedir la lista. Así no depende de lo que devuelva el back.
export function crearAdmin(datos: AltaDeAdmin) {
  return api<void>('/gerente/admins', { method: 'POST', body: JSON.stringify(datos) })
}

export function cambiarActivoDeAdmin(id: number, activo: boolean) {
  return api<void>(`/gerente/admins/${id}/activo`, { method: 'PATCH', body: JSON.stringify({ activo }) })
}

export function desbloquearAdmin(id: number) {
  return api<void>(`/gerente/admins/${id}/desbloquear`, { method: 'POST' })
}

import { Navigate } from 'react-router-dom'
import { useSesion } from '../../../compartido/sesion/SesionContext'

// A dónde va quien entra a /admin (o a una ruta que no existe dentro de /admin). El Gerente/Dueño no tiene carta:
// su única pantalla es Administradores. El resto va a Menú, como hasta ahora. Rutas absolutas a propósito, para
// que funcione igual desde el índice y desde la ruta comodín.
export default function InicioDelAdmin() {
  const { sesion } = useSesion()
  return <Navigate to={sesion?.rol === 'GERENTE_DUENO' ? '/admin/administradores' : '/admin/menu'} replace />
}

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

import { useEffect, useRef } from 'react'

// Confirmación genérica con el <dialog> nativo (mismo patrón que ConfirmarCierre y ConfirmarBorrado). Se monta
// solo cuando hace falta: nunca dejarlo dentro de un contenedor fijo que cubra la pantalla.
export default function DialogoDeConfirmacion({
  titulo,
  texto,
  textoConfirmar,
  enviando,
  alVolver,
  alConfirmar,
}: {
  titulo: string
  texto: string
  textoConfirmar: string
  enviando: boolean
  alVolver: () => void
  alConfirmar: () => void
}) {
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const volverRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialogo = dialogoRef.current
    const abrio = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialogo && !dialogo.open) dialogo.showModal()
    volverRef.current?.focus() // el foco arranca en el botón que no hace nada
    return () => {
      dialogo?.close()
      if (abrio?.isConnected) abrio.focus() // al cerrar, vuelve a quien lo abrió
    }
  }, [])

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-confirmacion"
      onCancel={(e) => {
        e.preventDefault()
        if (!enviando) alVolver()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !enviando) alVolver()
      }}
      className="m-auto w-full max-w-md rounded-3xl bg-tarjeta p-0 text-texto shadow-xl backdrop:bg-[rgba(0,0,0,0.42)]"
    >
      <div className="p-8">
        <h2 id="titulo-confirmacion" className="font-[Fraunces] text-2xl font-semibold">
          {titulo}
        </h2>
        <p className="mt-3 text-secundario">{texto}</p>
        <div className="mt-6 flex gap-3">
          <button
            ref={volverRef}
            type="button"
            onClick={alVolver}
            disabled={enviando}
            className="min-h-12 flex-1 rounded-xl border-2 border-primario font-semibold text-primario disabled:opacity-60"
          >
            ← No, volver
          </button>
          <button
            type="button"
            onClick={alConfirmar}
            disabled={enviando}
            className="min-h-12 flex-1 rounded-xl bg-primario font-semibold text-texto-boton disabled:opacity-60"
          >
            {enviando ? 'Un momento…' : textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  )
}

import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { crearAdmin } from '../../../compartido/api/gerente'
import { statusDe, textoDelError } from '../../../compartido/api/errores'

type Campo = 'nombre' | 'email' | 'password'

// Límites del back (contrato, sección 2): email hasta 160 caracteres; contraseña de 8 a 64 caracteres y hasta
// 72 BYTES. El back no valida el formato del email a propósito en los logins: acá solo se pide un formato simple.
const EMAIL_SIMPLE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validar(nombre: string, email: string, password: string): Partial<Record<Campo, string>> {
  const errores: Partial<Record<Campo, string>> = {}
  if (!nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  const mail = email.trim()
  if (!mail) errores.email = 'El email es obligatorio.'
  else if (mail.length > 160) errores.email = 'El email no puede pasar de 160 caracteres.'
  else if (!EMAIL_SIMPLE.test(mail)) errores.email = 'Escribí un email válido.'
  // Por caracteres de verdad (un emoji cuenta uno) y por bytes (una "ñ" pesa 2).
  const caracteres = [...password].length
  if (caracteres < 8 || caracteres > 64) errores.password = 'La contraseña tiene que tener entre 8 y 64 caracteres.'
  else if (new TextEncoder().encode(password).length > 72)
    errores.password = 'La contraseña es muy larga: pasa de 72 bytes (los acentos y los símbolos pesan más).'
  return errores
}

export default function FormularioDeAdmin() {
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrar, setMostrar] = useState(false)

  const [intentado, setIntentado] = useState(false) // los errores de campo salen después del primer intento
  const [enviando, setEnviando] = useState(false)
  const [errorEmail, setErrorEmail] = useState<string | null>(null) // el 409 del alta
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)
  const enviandoRef = useRef(false) // el estado llega un render tarde: la ref corta el doble toque

  const refs = {
    nombre: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
  }

  const errores = intentado ? validar(nombre, email, password) : {}
  const mensajeEmail = errores.email ?? errorEmail

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (enviandoRef.current) return
    setIntentado(true)
    const malos = validar(nombre, email, password)
    const primero = (['nombre', 'email', 'password'] as Campo[]).find((c) => malos[c])
    if (primero) {
      refs[primero].current?.focus()
      return
    }

    enviandoRef.current = true
    setEnviando(true)
    setErrorEmail(null)
    setErrorGuardar(null)
    const nombreFinal = nombre.trim()
    try {
      await crearAdmin({ nombre: nombreFinal, email: email.trim(), password })
      // El aviso usa lo que escribió quien da el alta, no la respuesta del back; y nunca la contraseña.
      navigate('/admin/administradores', {
        replace: true,
        state: { aviso: `Se dio de alta a ${nombreFinal}.` },
      })
    } catch (err) {
      // La contraseña no queda en pantalla después de un fallo del back.
      setPassword('')
      setMostrar(false)
      if (statusDe(err) === 409) {
        // Único conflicto del alta según la ST-24: el email repetido. El texto sale del back, tal cual.
        setErrorEmail(textoDelError(err))
        refs.email.current?.focus()
      } else {
        setErrorGuardar(textoDelError(err))
      }
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  const campo = 'mt-2 min-h-11 w-full rounded-xl border border-linea bg-fondo px-4'

  return (
    <section className="min-h-dvh bg-fondo p-8 text-texto">
      <Link to="/admin/administradores" className="inline-flex min-h-11 items-center font-semibold text-secundario underline">
        ← Administradores
      </Link>
      <h1 className="mt-2 font-[Fraunces] text-3xl font-semibold">Nuevo administrador</h1>
      <p className="mt-1 text-sm text-secundario">La contraseña inicial es provisoria: la cambia al entrar.</p>

      <form onSubmit={guardar} noValidate className="mt-6 max-w-md space-y-5 rounded-3xl border border-linea bg-tarjeta p-6">
        <div>
          <label htmlFor="nombre" className="block text-sm font-semibold text-secundario">
            Nombre
          </label>
          <input
            ref={refs.nombre}
            id="nombre"
            type="text"
            autoComplete="off"
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
          <label htmlFor="email" className="block text-sm font-semibold text-secundario">
            Email
          </label>
          <input
            ref={refs.email}
            id="email"
            type="email"
            autoComplete="off" // el navegador no tiene que autocompletar el email de quien está dando el alta
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrorEmail(null)
            }}
            aria-invalid={mensajeEmail ? true : undefined}
            aria-describedby={mensajeEmail ? 'error-email' : undefined}
            className={campo}
          />
          {mensajeEmail && (
            <p id="error-email" className="mt-1 text-sm font-semibold">
              {mensajeEmail}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-secundario">
            Contraseña inicial
          </label>
          <div className="mt-2 flex gap-2">
            <input
              ref={refs.password}
              id="password"
              type={mostrar ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={errores.password ? true : undefined}
              aria-describedby={errores.password ? 'error-password' : undefined}
              className="min-h-11 w-full rounded-xl border border-linea bg-fondo px-4"
            />
            <button
              type="button"
              onClick={() => setMostrar((m) => !m)}
              aria-pressed={mostrar}
              className="min-h-11 shrink-0 rounded-xl border border-linea px-4 text-sm font-semibold"
            >
              {mostrar ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {errores.password && (
            <p id="error-password" className="mt-1 text-sm font-semibold">
              {errores.password}
            </p>
          )}
        </div>

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
          {enviando ? 'Guardando…' : 'Dar de alta'}
        </button>
      </form>
    </section>
  )
}
