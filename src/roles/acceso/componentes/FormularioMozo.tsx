// P-32: usuario y contraseña del mozo, la primera vez y cada 7 días. No abre la sesión: si entra, LoginPin
// sigue con el PIN del mozo que devuelve el back.
import { useState, type FormEvent } from 'react'
import { loginMozo, traducirError, type Dispositivo, type FalloLogin } from '../../../compartido/api/auth'
import AvisoDeFallo from './AvisoDeFallo'
import CampoContrasena, { campo, PASSWORD_MAX, PASSWORD_MIN } from './CampoContrasena'
import { botonPrincipal, enlace } from './MarcoAcceso'
import { textoDeFallo } from './textoDeFallo'

const USUARIO_MAX = 40

interface Props {
  tokenStaff: string
  onHabilitado: (mozo: Dispositivo) => void
  onVolver: () => void
}

export default function FormularioMozo({ tokenStaff, onHabilitado, onVolver }: Props) {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [fallo, setFallo] = useState<FalloLogin | null>(null)
  const [enviando, setEnviando] = useState(false)

  const valido = usuario.trim() !== '' && password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (enviando || !valido) return
    setEnviando(true)
    setFallo(null)
    try {
      onHabilitado(await loginMozo(tokenStaff, usuario.trim(), password))
    } catch (err) {
      setPassword('')
      setFallo(traducirError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <h2 className="text-sm font-medium">Ingresá tu usuario y contraseña.</h2>
        <p className="mt-1 text-xs text-secundario">Te los pedimos la primera vez y cada 7 días. Después va tu PIN.</p>
      </div>

      {fallo && <AvisoDeFallo>{textoDeFallo(fallo)}</AvisoDeFallo>}

      <div>
        <label htmlFor="usuario" className="block text-sm font-medium">
          Usuario
        </label>
        <input
          id="usuario"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          maxLength={USUARIO_MAX}
          value={usuario}
          disabled={enviando}
          onChange={(e) => setUsuario(e.target.value)}
          className={campo}
        />
      </div>

      <div>
        <CampoContrasena
          id="password-mozo"
          rotulo="Contraseña"
          valor={password}
          onCambio={setPassword}
          autoComplete="current-password"
          deshabilitado={enviando}
        />
        <p className="mt-1 text-xs text-secundario">
          De {PASSWORD_MIN} a {PASSWORD_MAX} caracteres.
        </p>
      </div>

      <button type="submit" disabled={enviando || !valido} className={botonPrincipal}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>

      <div className="text-center">
        <button type="button" onClick={onVolver} className={enlace}>
          Volver a la lista de nombres
        </button>
      </div>
    </form>
  )
}
