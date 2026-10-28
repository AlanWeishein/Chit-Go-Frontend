// P-30 / P-31 (y P-32b para el mozo): primer ingreso o blanqueo de Mozo, Caja y Cocina. Ruta: /staff/:token/elegir-pin
// El mozo elige primero la contraseña y después el PIN, y las dos van juntas en un solo POST /auth/credencial.
// El back todavía no avisa si la contraseña del mozo es provisoria (contrasena_provisoria, 20/10): por ahora se
// le pide siempre que tenga la marca. Cuando el back la exponga, P-32b va solo si es provisoria.
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { elegirCredencial, obtenerSesion, traducirError, type FalloLogin } from '../../../compartido/api/auth'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { entraConEmail, rutaInicial } from '../../../compartido/sesion/rutas'
import AvisoDeFallo from '../componentes/AvisoDeFallo'
import CampoContrasena, { campoFijo, CampoConRotulo, PASSWORD_MAX, PASSWORD_MIN } from '../componentes/CampoContrasena'
import iconoFlechaDer from '../../../compartido/ui/iconos/arrow-r.svg'
import iconoUsuario from '../../../compartido/ui/iconos/user.svg'
import MarcoAcceso, { botonPrincipal, columna, enlace } from '../componentes/MarcoAcceso'
import TecladoPin from '../componentes/TecladoPin'
import { textoDeFallo } from '../componentes/textoDeFallo'
import VisorPin, { PIN_MAX, PIN_MIN } from '../componentes/VisorPin'

type Paso = 'contrasena' | 'pin' | 'repetir'

const NO_COINCIDEN = 'No coinciden'

export default function ElegirPin() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { sesion, cargando, guardarSesion, cerrar } = useSesion()

  const esMozo = sesion?.rol === 'MOZO'
  const primerPaso: Paso = esMozo ? 'contrasena' : 'pin'

  const [paso, setPaso] = useState<Paso | null>(null)
  const [password, setPassword] = useState('')
  const [passwordRepetida, setPasswordRepetida] = useState('')
  const [pin, setPin] = useState('')
  const [pinRepetido, setPinRepetido] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [fallo, setFallo] = useState<FalloLogin | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (cargando) return <p className="p-6 text-secundario">Cargando…</p>
  if (!sesion) return <Navigate to={`/staff/${encodeURIComponent(token)}`} replace />
  if (entraConEmail(sesion.rol)) return <Navigate to="/admin/cambiar-contrasena" replace />
  if (!sesion.debeCambiarCredencial) return <Navigate to={rutaInicial(sesion.rol)} replace />

  const actual = paso ?? primerPaso

  // Si algo falla, no se guarda nada (tampoco el PIN si falló la contraseña): se empieza de nuevo.
  function empezarDeNuevo(texto: string | null, nuevoFallo: FalloLogin | null) {
    setPassword('')
    setPasswordRepetida('')
    setPin('')
    setPinRepetido('')
    setAviso(texto)
    setFallo(nuevoFallo)
    setPaso(primerPaso)
  }

  function seguirConPin(e: FormEvent) {
    e.preventDefault()
    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return
    if (password !== passwordRepetida) {
      empezarDeNuevo(NO_COINCIDEN, null)
      return
    }
    setAviso(null)
    setFallo(null)
    setPaso('pin')
  }

  function seguirARepetir(e: FormEvent) {
    e.preventDefault()
    if (pin.length < PIN_MIN) return
    setAviso(null)
    setFallo(null)
    setPaso('repetir')
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (enviando || pinRepetido.length < PIN_MIN) return
    if (pin !== pinRepetido) {
      // P-30b: se vuelve a elegir el PIN; la contraseña del mozo ya está bien.
      setPin('')
      setPinRepetido('')
      setAviso(NO_COINCIDEN)
      setPaso('pin')
      return
    }
    setEnviando(true)
    setAviso(null)
    setFallo(null)
    try {
      const nueva = await elegirCredencial(
        esMozo ? { pin, pinRepetido, password, passwordRepetida } : { pin, pinRepetido },
      )
      guardarSesion(nueva)
      navigate(rutaInicial(nueva.rol), { replace: true })
    } catch (err) {
      empezarDeNuevo(null, traducirError(err))
    } finally {
      setEnviando(false)
    }
  }

  // 409: ya la eligió (en otra pestaña, por ejemplo). Con la sesión al día, el guard de arriba lo manda a su pantalla.
  async function actualizarSesion() {
    const s = await obtenerSesion().catch(() => null)
    if (s) guardarSesion(s)
    else await cerrar().catch(() => undefined)
  }

  const textoDelAviso = aviso ?? (fallo ? textoDeFallo(fallo) : null)
  const conBoton = fallo?.motivo === 'credencial-elegida' || fallo?.motivo === 'sesion-vencida'
  const enPin = !conBoton && actual !== 'contrasena'
  const avisoDelPin = enPin && textoDelAviso ? <AvisoDeFallo>{textoDelAviso}</AvisoDeFallo> : null
  // P-32b, P-30, P-30b y el paso de repetir llevan sus instrucciones en la bajada; el resto, el nombre del local.
  const bajada =
    actual === 'contrasena' && !conBoton
      ? `La contraseña que te dio el Admin era provisoria. Elegí una propia, de ${PASSWORD_MIN} a ${PASSWORD_MAX} caracteres.`
      : !enPin
        ? (sesion.local?.nombre ?? 'Ingreso para el personal')
        : actual === 'repetir'
          ? 'Repetí el PIN. Para confirmarlo.'
          : aviso === NO_COINCIDEN
            ? 'Elegí tu PIN otra vez y repetilo para confirmarlo.'
            : 'Elegí tu PIN. El que te dio el Admin era provisorio.'

  return (
    <MarcoAcceso bajada={bajada} ilustracion={!(enPin && textoDelAviso)}>
      {textoDelAviso && !enPin && <AvisoDeFallo className="mb-4">{textoDelAviso}</AvisoDeFallo>}

      {conBoton ? (
        <button type="button" onClick={actualizarSesion} className={botonPrincipal}>
          {fallo.motivo === 'credencial-elegida' ? 'Seguir' : 'Volver a entrar'}
        </button>
      ) : actual === 'contrasena' ? (
        // P-32b. La sesión no trae el nombre de usuario (juan), así que el campo fijo muestra el nombre.
        <form onSubmit={seguirConPin} className="flex w-full flex-col gap-[18px]">
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
          />
          <CampoContrasena
            id="password-repetida"
            rotulo="Repetila"
            valor={passwordRepetida}
            onCambio={setPasswordRepetida}
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={password.length < PASSWORD_MIN || passwordRepetida === ''}
            className={botonPrincipal}
          >
            <img src={iconoFlechaDer} alt="" width={20} height={20} />
            Guardar y seguir
          </button>
          <p className="text-center text-[13px] text-secundario">Desde ahora te la pedimos cada 7 días.</p>
        </form>
      ) : (
        <form onSubmit={actual === 'pin' ? seguirARepetir : guardar} className={columna}>
          <VisorPin pin={actual === 'pin' ? pin : pinRepetido} />

          {avisoDelPin}

          <TecladoPin
            valor={actual === 'pin' ? pin : pinRepetido}
            onCambio={actual === 'pin' ? setPin : setPinRepetido}
            max={PIN_MAX}
            deshabilitado={enviando}
          />

          <button
            type="submit"
            disabled={enviando || (actual === 'pin' ? pin : pinRepetido).length < PIN_MIN}
            className={botonPrincipal}
          >
            <img src={iconoFlechaDer} alt="" width={20} height={20} />
            {actual === 'pin' ? 'Seguir' : enviando ? 'Guardando…' : 'Guardar y entrar'}
          </button>

          {actual === 'pin' && (
            <p className="text-[13px] text-secundario">Después te lo pedimos otra vez para confirmarlo.</p>
          )}
        </form>
      )}

      <div className="mt-2 flex justify-center">
        <button type="button" onClick={() => cerrar().catch(() => undefined)} className={enlace}>
          Cerrar sesión
        </button>
      </div>
    </MarcoAcceso>
  )
}
