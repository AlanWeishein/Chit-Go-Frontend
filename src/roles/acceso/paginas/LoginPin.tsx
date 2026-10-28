// P-04 / P-04b: login con nombre y PIN para Mozo, Caja y Cocina. Ruta: /staff/:token
// El mozo con su cookie de dispositivo va directo a su PIN; sin ella, el PIN da CONTRASENA_REQUERIDA y sigue P-32.
// Con `caja` es la entrada de la tablet de Caja (P-22b, P-22 y P-22c). Ruta: /staff/:token/caja
// Es la misma pantalla con otro marco: la lista siempre se ve (no salta al PIN del mozo del dispositivo).
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  loginConPin,
  obtenerDatosStaff,
  obtenerDispositivo,
  traducirError,
  type DatosStaff,
  type FalloLogin,
  type Usuario,
} from '../../../compartido/api/auth'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { rutaDeEntrada } from '../../../compartido/sesion/rutas'
import { recordarTokenStaff } from '../../../compartido/sesion/tokenStaff'
import AvisoDeFallo from '../componentes/AvisoDeFallo'
import FormularioMozo from '../componentes/FormularioMozo'
import iconoFlechaDer from '../../../compartido/ui/iconos/arrow-r.svg'
import iconoFlechaIzq from '../../../compartido/ui/iconos/arrow-l.svg'
import iconoFlechaIzqPrimario from '../../../compartido/ui/iconos/arrow-l-primario.svg'
import ListaDeNombres from '../componentes/ListaDeNombres'
import MarcoAcceso, { botonPrincipal, botonSecundario, columna, enlace } from '../componentes/MarcoAcceso'
import MarcoDosPaneles from '../componentes/MarcoDosPaneles'
import SesionAbierta from '../componentes/SesionAbierta'
import TecladoPin from '../componentes/TecladoPin'
import { textoDeFallo } from '../componentes/textoDeFallo'
import VisorPin, { PIN_MAX, PIN_MIN } from '../componentes/VisorPin'

const BAJADA_MOZO = 'Cada 7 días te pedimos tu usuario y tu contraseña. El resto de los días entrás solo con tu PIN.'

// El saludo de Caja cambia con la hora. El Mockup solo dibuja "Buenas noches".
function saludoDeLaHora() {
  const hora = new Date().getHours()
  if (hora >= 5 && hora < 12) return 'Buenos días'
  if (hora >= 12 && hora < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function LoginPin({ caja = false }: { caja?: boolean }) {
  const { token = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { sesion, guardarSesion } = useSesion()

  const [staff, setStaff] = useState<DatosStaff | null>(null)
  const [elegido, setElegido] = useState<Usuario | null>(null)
  const [pidiendoContrasena, setPidiendoContrasena] = useState(false)
  const [pin, setPin] = useState('')
  const [fallo, setFallo] = useState<FalloLogin | null>(null)
  const [enviando, setEnviando] = useState(false)
  // P-22c: la sesión de Caja se cortó por inactividad. Hoy nada manda acá con ese motivo (ver Abierto de la ST-08).
  const [cerrada, setCerrada] = useState(caja && params.get('cerrada') === 'inactividad')

  // La lista y el dispositivo juntos, así no se ve la lista y después salta al PIN.
  // El mozo del dispositivo se usa solo si está en la lista de este local.
  useEffect(() => {
    let activo = true
    Promise.all([obtenerDatosStaff(token), caja ? Promise.resolve(null) : obtenerDispositivo()])
      .then(([datos, dispositivo]) => {
        if (!activo) return
        recordarTokenStaff(token)
        setStaff(datos)
        const mozo = dispositivo && datos.usuarios.find((u) => u.id === dispositivo.id)
        if (mozo) setElegido(mozo)
      })
      .catch((err) => activo && setFallo(traducirError(err)))
    return () => {
      activo = false
    }
  }, [token, caja])

  if (sesion) return <SesionAbierta sesion={sesion} destino={rutaDeEntrada(sesion, token)} />

  function volverALaLista() {
    setElegido(null)
    setPidiendoContrasena(false)
    setPin('')
    setFallo(null)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!elegido || enviando || pin.length < PIN_MIN) return
    setEnviando(true)
    setFallo(null)
    try {
      const nueva = await loginConPin(token, elegido.id, pin)
      guardarSesion(nueva)
      navigate(rutaDeEntrada(nueva, token), { replace: true })
    } catch (err) {
      setPin('')
      const f = traducirError(err)
      // Mozo sin cookie de dispositivo: P-32. Se compara el codigo, no el texto.
      if (f.motivo === 'contrasena-requerida') setPidiendoContrasena(true)
      else setFallo(f)
    } finally {
      setEnviando(false)
    }
  }

  const enPin = elegido !== null && !pidiendoContrasena
  const bloqueado = enPin && fallo?.motivo === 'bloqueado'
  const bajada = pidiendoContrasena
    ? BAJADA_MOZO
    : !elegido
      ? '¿Quién empieza el turno? Tocá tu nombre y después ingresá tu PIN.'
      : bloqueado
        ? `Hola, ${elegido.nombre}.`
        : `Hola, ${elegido.nombre}. Ingresá tu PIN para empezar el turno.`
  // P-04d: el título del aviso es la primera oración del texto del back, y debajo va el resto.
  const [tituloBloqueo, ...restoBloqueo] = fallo ? textoDeFallo(fallo).split(/(?<=\.)\s/) : []

  const saludo = saludoDeLaHora()
  const sinElegir = !elegido && !pidiendoContrasena
  const tituloCaja = pidiendoContrasena
    ? 'Ingresá con tu usuario y contraseña.'
    : sinElegir
      ? cerrada
        ? 'La caja se cerró por inactividad.'
        : `${saludo}. ¿Quién abre la caja?`
      : `${saludo}. Ingresá tu PIN para abrir la caja.`
  const bajadaCaja = pidiendoContrasena
    ? BAJADA_MOZO
    : sinElegir && cerrada
      ? 'Pasó una hora sin uso. Elegí tu nombre e ingresá tu PIN para volver a entrar.'
      : 'El PIN identifica quién aprueba pedidos y cierra cuentas (queda en la auditoría).'

  const cuerpo = (
    <>
      {fallo && !enPin && <AvisoDeFallo className={caja ? 'mb-5' : 'mb-4'}>{textoDeFallo(fallo)}</AvisoDeFallo>}

      {pidiendoContrasena ? (
        <FormularioMozo
          tokenStaff={token}
          onHabilitado={(mozo) => {
            setElegido({ id: mozo.id, nombre: mozo.nombre })
            setPidiendoContrasena(false)
            setFallo(null)
          }}
          onVolver={volverALaLista}
        />
      ) : !elegido ? (
        <section className={caja ? 'flex flex-col gap-5' : undefined}>
          {caja && cerrada && (
            <AvisoDeFallo icono="reloj" titulo="Cerramos la sesión">
              La sesión de Caja se corta a la hora sin actividad.
            </AvisoDeFallo>
          )}
          {caja && <h1 className="titulo text-center text-2xl">Elegí tu nombre</h1>}
          {staff === null && !fallo && <p className="text-center text-[13px] text-secundario">Cargando…</p>}
          <ListaDeNombres
            usuarios={staff?.usuarios ?? []}
            grande={caja}
            onElegir={(u) => {
              setElegido(u)
              setFallo(null)
              setCerrada(false)
            }}
          />
          {staff !== null && (
            <p
              className={
                caja
                  ? 'text-[13px] leading-[1.4] text-secundario'
                  : 'mx-auto mt-[18px] max-w-[300px] text-center text-[13px] text-secundario'
              }
            >
              {caja
                ? 'Solo aparece el personal activo del local. El Admin entra con su email desde la compu.'
                : 'Solo aparece el personal activo del local. El Admin entra con su email.'}
            </p>
          )}
        </section>
      ) : bloqueado ? (
        <div className={columna}>
          <AvisoDeFallo icono="candado" titulo={tituloBloqueo}>
            {restoBloqueo.join(' ')}
          </AvisoDeFallo>
          <button type="button" onClick={volverALaLista} className={botonSecundario}>
            <img src={iconoFlechaIzqPrimario} alt="" width={20} height={20} />
            Elegir otro nombre
          </button>
          <p className="max-w-[300px] text-center text-[13px] text-secundario">
            Se bloquea a los 5 intentos fallidos seguidos. El Admin lo destraba con un blanqueo de PIN.
          </p>
        </div>
      ) : (
        <form onSubmit={enviar} className={`${columna} ${caja ? 'mx-auto max-w-[288px]' : ''}`}>
          {caja && (
            <div className="text-center">
              <h1 className="titulo text-xl">Ingresá tu PIN</h1>
              <p className="mt-1 text-[13px] text-secundario">Hola, {elegido.nombre}.</p>
            </div>
          )}

          <VisorPin pin={pin} />

          {fallo && <AvisoDeFallo>{textoDeFallo(fallo)}</AvisoDeFallo>}

          <TecladoPin valor={pin} onCambio={setPin} max={PIN_MAX} deshabilitado={enviando} />

          <button type="submit" disabled={enviando || pin.length < PIN_MIN} className={botonPrincipal}>
            <img src={iconoFlechaDer} alt="" width={20} height={20} />
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>

          <button type="button" onClick={volverALaLista} className={enlace}>
            <img src={iconoFlechaIzq} alt="" width={20} height={20} />
            Cambiar
          </button>

          {caja ? (
            <p className="text-center text-[13px] text-secundario">¿Te olvidaste el PIN? Pedíselo al Admin del local.</p>
          ) : (
            !fallo && <p className="text-[13px] text-secundario">Mismo acceso para Mozo, Caja y Cocina.</p>
          )}
        </form>
      )}
    </>
  )

  if (caja) {
    return (
      <MarcoDosPaneles
        variante="caja"
        titulo={tituloCaja}
        bajada={bajadaCaja}
        pie={staff ? `Tablet del mostrador · ${staff.nombreLocal}` : undefined}
      >
        {cuerpo}
      </MarcoDosPaneles>
    )
  }

  // Con el aviso de PIN incorrecto se saca la taza, como P-04c, para que entre el teclado.
  return (
    <MarcoAcceso bajada={bajada} ilustracion={!(enPin && fallo && !bloqueado)}>
      {cuerpo}
    </MarcoAcceso>
  )
}
