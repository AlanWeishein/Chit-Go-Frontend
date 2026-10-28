// P-29: el Admin y el Gerente/Dueño eligen su contraseña en el primer ingreso. Ruta: /admin/cambiar-contrasena
// La sesión no trae el email, así que en vez del "Email (es tu usuario)" de P-29 se muestra el nombre.
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { elegirCredencial, obtenerSesion, traducirError, type FalloLogin } from '../../../compartido/api/auth'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { leerTokenStaff } from '../../../compartido/sesion/tokenStaff'
import { entraConEmail, rutaDeEntrada, rutaInicial } from '../../../compartido/sesion/rutas'
import iconoFlechaDer from '../../../compartido/ui/iconos/arrow-r.svg'
import iconoUsuario from '../../../compartido/ui/iconos/user.svg'
import AvisoDeFallo from '../componentes/AvisoDeFallo'
import CampoContrasena, { campoFijo, CampoConRotulo, PASSWORD_MAX, PASSWORD_MIN } from '../componentes/CampoContrasena'
import { botonPrincipal, enlace } from '../componentes/MarcoAcceso'
import MarcoDosPaneles, { EncabezadoDelFormulario } from '../componentes/MarcoDosPaneles'
import NotaInformativa from '../componentes/NotaInformativa'
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
  const local = sesion.local?.nombre
  const esAdmin = sesion.rol === 'ADMIN'

  return (
    <MarcoDosPaneles
      variante="admin"
      titulo="Primero, tu contraseña"
      bajada={
        esAdmin && local
          ? `La que te dio el Gerente/Dueño es provisoria. Elegí una tuya para entrar al panel de ${local}.`
          : 'La que te dieron es provisoria. Elegí una tuya para entrar al panel.'
      }
    >
      <div className="flex flex-col gap-4">
        <EncabezadoDelFormulario
          titulo="Cambiá tu contraseña"
          bajada={`Primer ingreso · ${esAdmin && local ? `Admin de ${local}` : 'Gerente/Dueño'}`}
        />

        {textoDelAviso && <AvisoDeFallo>{textoDelAviso}</AvisoDeFallo>}

        {fallo?.motivo === 'credencial-elegida' || fallo?.motivo === 'sesion-vencida' ? (
          <button type="button" onClick={actualizarSesion} className={botonPrincipal}>
            {fallo.motivo === 'credencial-elegida' ? 'Seguir' : 'Volver a entrar'}
          </button>
        ) : (
          <form onSubmit={guardar} className="flex flex-col gap-4">
            <CampoConRotulo id="usuario-fijo" etiqueta="Usuario" icono={iconoUsuario}>
              <input
                id="usuario-fijo"
                type="text"
                readOnly
                autoComplete="username"
                value={sesion.nombre}
                className={campoFijo}
              />
            </CampoConRotulo>
            <CampoContrasena
              id="password-nueva"
              rotulo="Contraseña nueva"
              valor={password}
              onCambio={setPassword}
              autoComplete="new-password"
              deshabilitado={enviando}
            />
            <CampoContrasena
              id="password-repetida"
              rotulo="Repetir contraseña"
              valor={passwordRepetida}
              onCambio={setPasswordRepetida}
              autoComplete="new-password"
              deshabilitado={enviando}
            />
            <p className="text-[13px] text-secundario">
              De {PASSWORD_MIN} a {PASSWORD_MAX} caracteres y distinta de la provisoria.
            </p>
            <button type="submit" disabled={enviando || !valido} className={botonPrincipal}>
              <img src={iconoFlechaDer} alt="" width={20} height={20} />
              {enviando ? 'Guardando…' : 'Guardar y entrar'}
            </button>
            <NotaInformativa>Te lo pedimos una sola vez. Desde ahora entrás con tu email y esta contraseña.</NotaInformativa>
          </form>
        )}

        <div className="flex justify-center">
          <button type="button" onClick={() => cerrar().catch(() => undefined)} className={enlace}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </MarcoDosPaneles>
  )
}
