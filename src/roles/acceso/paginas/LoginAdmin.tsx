// P-12 / P-12b: login con email y contraseña para Admin y Gerente/Dueño. Ruta: /admin/login
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin, traducirError, type FalloLogin } from '../../../compartido/api/auth'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { rutaDeEntrada } from '../../../compartido/sesion/rutas'
import { leerTokenStaff } from '../../../compartido/sesion/tokenStaff'
import iconoFlechaDer from '../../../compartido/ui/iconos/arrow-r.svg'
import iconoMail from '../../../compartido/ui/iconos/mail.svg'
import AvisoDeFallo from '../componentes/AvisoDeFallo'
import CampoContrasena, { campoConIcono, CampoConRotulo, PASSWORD_MAX, PASSWORD_MIN } from '../componentes/CampoContrasena'
import { botonPrincipal } from '../componentes/MarcoAcceso'
import MarcoDosPaneles, { EncabezadoDelFormulario } from '../componentes/MarcoDosPaneles'
import NotaInformativa from '../componentes/NotaInformativa'
import SesionAbierta from '../componentes/SesionAbierta'
import { textoDeFallo } from '../componentes/textoDeFallo'

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
    <MarcoDosPaneles
      variante="admin"
      titulo="Tu local, en orden."
      bajada="Menú, mesas, empleados, reportes y auditoría de tu local."
    >
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <EncabezadoDelFormulario titulo="Iniciar sesión" bajada="Acceso para Admin y Gerente/Dueño" />

        {fallo && <AvisoDeFallo>{textoDeFallo(fallo)}</AvisoDeFallo>}

        <CampoConRotulo id="email" etiqueta="Email" icono={iconoMail}>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={campoConIcono}
          />
        </CampoConRotulo>

        <CampoContrasena
          id="password"
          rotulo="Contraseña"
          valor={password}
          onCambio={setPassword}
          autoComplete="current-password"
        />

        <button type="submit" disabled={enviando || !valido} className={botonPrincipal}>
          <img src={iconoFlechaDer} alt="" width={20} height={20} />
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>

        <NotaInformativa>¿Sos Mozo, Caja o Cocina? Entrás con tu PIN desde la app del salón.</NotaInformativa>
      </form>
    </MarcoDosPaneles>
  )
}
