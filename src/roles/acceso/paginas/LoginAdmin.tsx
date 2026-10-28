// P-12: login con email y contraseña para Admin y Gerente/Dueño. Ruta: /admin/login
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin, traducirError, type FalloLogin } from '../../../compartido/api/auth'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { rutaDeEntrada } from '../../../compartido/sesion/rutas'
import { leerTokenStaff } from '../../../compartido/sesion/tokenStaff'
import AvisoDeFallo from '../componentes/AvisoDeFallo'
import { campo } from '../componentes/CampoContrasena'
import SesionAbierta from '../componentes/SesionAbierta'
import { textoDeFallo } from '../componentes/textoDeFallo'

const PASSWORD_MIN = 8
const PASSWORD_MAX = 64

export default function LoginAdmin() {
  const navigate = useNavigate()
  const { sesion, guardarSesion } = useSesion()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fallo, setFallo] = useState<FalloLogin | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (sesion) return <SesionAbierta sesion={sesion} destino={rutaDeEntrada(sesion, leerTokenStaff())} />


  const valido = email.trim() !== '' && password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (enviando || !valido) return
    setEnviando(true)
    setFallo(null)
    try {
      const nueva = await loginAdmin(email.trim(), password)
      guardarSesion(nueva)
      navigate(rutaDeEntrada(nueva, null), { replace: true })
    } catch (err) {
      setPassword('')
      setFallo(traducirError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fondo p-6 font-inter text-texto">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold text-primario">Chit&Go</h1>
        <p className="mt-1 text-center text-sm text-secundario">Ingreso para Admin y Dueño</p>

        <form onSubmit={enviar} className="mt-6 space-y-4 rounded-2xl border border-linea bg-tarjeta p-6">
          {fallo && <AvisoDeFallo>{textoDeFallo(fallo)}</AvisoDeFallo>}

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={campo}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              maxLength={PASSWORD_MAX}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={campo}
            />
            <p className="mt-1 text-xs text-secundario">
              De {PASSWORD_MIN} a {PASSWORD_MAX} caracteres.
            </p>
          </div>

          <button
            type="submit"
            disabled={enviando || !valido}
            className="w-full rounded-xl bg-primario py-3 text-lg font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  )
}
