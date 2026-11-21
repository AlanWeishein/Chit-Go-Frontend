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
