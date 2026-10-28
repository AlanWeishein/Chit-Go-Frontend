// P-32: usuario y contraseña del mozo, la primera vez y cada 7 días. No abre la sesión: si entra, LoginPin
// sigue con el PIN del mozo que devuelve el back. La bajada ("Cada 7 días te pedimos…") la pone LoginPin en el marco.
import { useState, type FormEvent } from 'react'
import { loginMozo, traducirError, type Dispositivo, type FalloLogin } from '../../../compartido/api/auth'
import iconoFlechaDer from '../../../compartido/ui/iconos/arrow-r.svg'
import iconoFlechaIzq from '../../../compartido/ui/iconos/arrow-l.svg'
import iconoUsuario from '../../../compartido/ui/iconos/user.svg'
import AvisoDeFallo from './AvisoDeFallo'
import CampoContrasena, { campoConIcono, CampoConRotulo, PASSWORD_MAX, PASSWORD_MIN } from './CampoContrasena'
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
    <form onSubmit={enviar} className="flex w-full flex-col gap-[18px]">
      {fallo && <AvisoDeFallo>{textoDeFallo(fallo)}</AvisoDeFallo>}

      <CampoConRotulo id="usuario" etiqueta="Usuario" icono={iconoUsuario}>
        <input
          id="usuario"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          maxLength={USUARIO_MAX}
          value={usuario}
          disabled={enviando}
          onChange={(e) => setUsuario(e.target.value)}
          className={campoConIcono}
        />
      </CampoConRotulo>

      <CampoContrasena
        id="password-mozo"
        rotulo="Contraseña"
        valor={password}
        onCambio={setPassword}
        autoComplete="current-password"
        deshabilitado={enviando}
      />

      <button type="submit" disabled={enviando || !valido} className={botonPrincipal}>
        <img src={iconoFlechaDer} alt="" width={20} height={20} />
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>

      <p className="max-w-[300px] self-center text-center text-[13px] text-secundario">
        El usuario y la contraseña te los da el Admin cuando te da de alta.
      </p>

      <button type="button" onClick={onVolver} className={`${enlace} self-center`}>
        <img src={iconoFlechaIzq} alt="" width={20} height={20} />
        Volver a la lista de nombres
      </button>
    </form>
  )
}
