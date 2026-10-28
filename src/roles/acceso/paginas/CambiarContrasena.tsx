// P-29: el Admin y el Gerente/Dueño eligen su contraseña en el primer ingreso. Ruta: /admin/cambiar-contrasena
// La sesión no trae el email, así que en vez del "email fijo" de P-29 se muestra el nombre.
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { elegirCredencial, obtenerSesion, traducirError, type FalloLogin } from '../../../compartido/api/auth'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { leerTokenStaff } from '../../../compartido/sesion/tokenStaff'
import { entraConEmail, rutaDeEntrada, rutaInicial } from '../../../compartido/sesion/rutas'
import AvisoDeFallo from '../componentes/AvisoDeFallo'
import CampoContrasena, { PASSWORD_MAX, PASSWORD_MIN } from '../componentes/CampoContrasena'
import MarcoAcceso, { botonPrincipal, enlace } from '../componentes/MarcoAcceso'
import { textoDeFallo } from '../componentes/textoDeFallo'

export default function CambiarContrasena() {
  const navigate = useNavigate()
  const { sesion, cargando, guardarSesion, cerrar } = useSesion()

  const [password, setPassword] = useState('')
  const [passwordRepetida, setPasswordRepetida] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [fallo, setFallo] = useState<FalloLogin | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (cargando) return <p className="p-6 text-secundario">Cargando…</p>
  if (!sesion) return <Navigate to="/admin/login" replace />
  if (!entraConEmail(sesion.rol)) return <Navigate to={rutaDeEntrada(sesion, leerTokenStaff())} replace />
  if (!sesion.debeCambiarCredencial) return <Navigate to={rutaInicial(sesion.rol)} replace />

  const valido = password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX && passwordRepetida !== ''

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (enviando || !valido) return
    setAviso(null)
    setFallo(null)
    if (password !== passwordRepetida) {
      setPasswordRepetida('')
      setAviso('No coinciden')
      return
    }
    setEnviando(true)
    try {
      const nueva = await elegirCredencial({ password, passwordRepetida })
      guardarSesion(nueva)
      navigate(rutaInicial(nueva.rol), { replace: true })
    } catch (err) {
      setPassword('')
      setPasswordRepetida('')
      setFallo(traducirError(err))
    } finally {
      setEnviando(false)
    }
  }

  // 409: ya la eligió. Con la sesión al día, el guard de arriba lo manda a su pantalla.
  async function actualizarSesion() {
    const s = await obtenerSesion().catch(() => null)
    if (s) guardarSesion(s)
    else await cerrar().catch(() => undefined)
  }

  const textoDelAviso = aviso ?? (fallo ? textoDeFallo(fallo) : null)

  return (
    <MarcoAcceso bajada="Ingreso para Admin y Dueño">
      {textoDelAviso && <AvisoDeFallo className="mb-4">{textoDelAviso}</AvisoDeFallo>}

      {fallo?.motivo === 'credencial-elegida' || fallo?.motivo === 'sesion-vencida' ? (
        <button type="button" onClick={actualizarSesion} className={botonPrincipal}>
          {fallo.motivo === 'credencial-elegida' ? 'Seguir' : 'Volver a entrar'}
        </button>
      ) : (
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <h2 className="text-sm font-medium">Hola, {sesion.nombre}. Elegí tu contraseña.</h2>
            <p className="mt-1 text-xs text-secundario">
              La que te dieron era provisoria. La tuya tiene que ser distinta.
            </p>
          </div>
          <CampoContrasena
            id="password-nueva"
            rotulo="Contraseña nueva"
            valor={password}
            onCambio={setPassword}
            autoComplete="new-password"
            deshabilitado={enviando}
          />
          <div>
            <CampoContrasena
              id="password-repetida"
              rotulo="Repetí la contraseña"
              valor={passwordRepetida}
              onCambio={setPasswordRepetida}
              autoComplete="new-password"
              deshabilitado={enviando}
            />
            <p className="mt-1 text-xs text-secundario">
              De {PASSWORD_MIN} a {PASSWORD_MAX} caracteres.
            </p>
          </div>
          <button type="submit" disabled={enviando || !valido} className={botonPrincipal}>
            {enviando ? 'Guardando…' : 'Guardar y entrar'}
          </button>
        </form>
      )}

      <div className="mt-4 text-center">
        <button type="button" onClick={() => cerrar().catch(() => undefined)} className={enlace}>
          Cerrar sesión
        </button>
      </div>
    </MarcoAcceso>
  )
}
