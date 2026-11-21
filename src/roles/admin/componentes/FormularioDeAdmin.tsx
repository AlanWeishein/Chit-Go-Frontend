import { useRef, useState, type FormEvent } from 'react'
import { crearAdmin } from '../../../compartido/api/gerente'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import iconoMostrar from '../../../compartido/ui/iconos/eye.svg'
import iconoCandado from '../../../compartido/ui/iconos/lock-18.svg'
import iconoEmail from '../../../compartido/ui/iconos/mail.svg'
import iconoNuevo from '../../../compartido/ui/iconos/plus-blanco.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import ErrorDeCampo from './ErrorDeCampo'

type Campo = 'nombre' | 'email' | 'password'

// Los límites de AltaDeAdminRequest: nombre hasta 120, email hasta 160, y contraseña de 8 a 64 caracteres y hasta
// 72 bytes (BCrypt usa solo los primeros 72). El formato del email lo vuelve a controlar el back con @Email.
const EMAIL_SIMPLE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validar(nombre: string, email: string, password: string): Partial<Record<Campo, string>> {
  const errores: Partial<Record<Campo, string>> = {}
  const nom = nombre.trim()
  if (!nom) errores.nombre = 'Falta el nombre.'
  else if (nom.length > 120) errores.nombre = 'El nombre no puede pasar de 120 caracteres.'
  const mail = email.trim()
  if (!mail) errores.email = 'Falta el email.'
  else if (mail.length > 160) errores.email = 'El email no puede pasar de 160 caracteres.'
  else if (!EMAIL_SIMPLE.test(mail)) errores.email = 'Escribí un email válido.'
  // Por caracteres de verdad (un emoji cuenta uno) y por bytes (una "ñ" pesa 2).
  const caracteres = [...password].length
  if (caracteres < 8 || caracteres > 64) errores.password = 'La contraseña tiene que tener de 8 a 64 caracteres.'
  else if (new TextEncoder().encode(password).length > 72)
    errores.password = 'La contraseña es muy larga: pasa de 72 bytes (los acentos y los símbolos pesan más).'
  return errores
}

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const rotulo = 'text-[13px] leading-[normal] font-medium'
// La caja del campo lleva el borde; el input de adentro no, así el ícono y "Mostrar" quedan dentro del borde.
const caja =
  'flex h-12 w-full items-center gap-2.5 rounded-xl border-[1.25px] border-secundario bg-tarjeta px-[14px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primario'
const entrada = 'h-full min-w-0 flex-1 bg-transparent text-[15px] text-texto outline-none placeholder:text-secundario'

// La tarjeta "Nuevo admin" de P-19 (HU-16), a la derecha de la lista. Crea el Admin con la contraseña provisoria:
// el back le pone la marca de cambio obligatorio y al entrar pasa por P-29 (CP-31-01).
export default function FormularioDeAdmin({ alCrear }: { alCrear: (nombre: string) => void }) {
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
      // Queda vacío para el próximo. El aviso usa lo que se escribió, nunca la contraseña.
      setNombre('')
      setEmail('')
      setPassword('')
      setMostrar(false)
      setIntentado(false)
      alCrear(nombreFinal)
    } catch (err) {
      // La contraseña no queda en pantalla después de un fallo.
      setPassword('')
      setMostrar(false)
      setIntentado(false)
      if (statusDe(err) === 409) {
        // El único conflicto del alta es el email repetido, de cualquier local. El texto sale del back.
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

  return (
    <form
      onSubmit={guardar}
      noValidate
      aria-labelledby="titulo-nuevo-admin"
      className="flex w-80 shrink-0 flex-col gap-[14px] rounded-2xl bg-linea p-[18px] leading-[normal]"
    >
      <h2 id="titulo-nuevo-admin" className="text-base font-semibold">
        Nuevo admin
      </h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-nombre" className={rotulo}>
          Nombre y apellido
        </label>
        <div className={caja}>
          <input
            ref={refs.nombre}
            id="admin-nombre"
            type="text"
            autoComplete="off"
            placeholder="Ej. Martín Gómez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-invalid={errores.nombre ? true : undefined}
            aria-describedby={errores.nombre ? 'admin-nombre-error' : undefined}
            className={entrada}
          />
        </div>
        {errores.nombre && <ErrorDeCampo id="admin-nombre-error">{errores.nombre}</ErrorDeCampo>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-email" className={rotulo}>
          Email (es su usuario)
        </label>
        <div className={caja}>
          <img src={iconoEmail} alt="" width={18} height={18} className="shrink-0" />
          <input
            ref={refs.email}
            id="admin-email"
            type="email"
            autoComplete="off" // que el navegador no complete el email de quien da el alta
            placeholder="usuario@ejemplo.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrorEmail(null)
            }}
            aria-invalid={mensajeEmail ? true : undefined}
            aria-describedby={mensajeEmail ? 'admin-email-error' : undefined}
            className={entrada}
          />
        </div>
        {mensajeEmail && <ErrorDeCampo id="admin-email-error">{mensajeEmail}</ErrorDeCampo>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-password" className={rotulo}>
          Contraseña inicial
        </label>
        <div className={`${caja} pr-0.5`}>
          <img src={iconoCandado} alt="" width={18} height={18} className="shrink-0" />
          <input
            ref={refs.password}
            id="admin-password"
            type={mostrar ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={errores.password ? true : undefined}
            aria-describedby={errores.password ? 'admin-password-error' : 'admin-password-ayuda'}
            className={entrada}
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
        {errores.password && <ErrorDeCampo id="admin-password-error">{errores.password}</ErrorDeCampo>}
      </div>

      <p id="admin-password-ayuda" className="text-[13px]">
        La cambia en su primer ingreso.
      </p>

      {errorGuardar && <AvisoDeFallo>{errorGuardar}</AvisoDeFallo>}

      <button
        type="submit"
        disabled={enviando}
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold text-texto-boton disabled:opacity-60 ${foco}`}
      >
        <img src={iconoNuevo} alt="" width={20} height={20} />
        {enviando ? 'Creando…' : 'Crear admin'}
      </button>
    </form>
  )
}
