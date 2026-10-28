// P-04 / P-04b / P-22: login con nombre y PIN para Mozo, Caja y Cocina. Ruta: /staff/:token
// El mozo con su cookie de dispositivo va directo a su PIN; sin ella, el PIN da CONTRASENA_REQUERIDA y sigue P-32.
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import iconoFlechaChevron from '../../../compartido/ui/iconos/chevron-r.svg'
import MarcoAcceso, { botonPrincipal, botonSecundario, columna, enlace } from '../componentes/MarcoAcceso'
import SesionAbierta from '../componentes/SesionAbierta'
import TecladoPin from '../componentes/TecladoPin'
import { textoDeFallo } from '../componentes/textoDeFallo'
import VisorPin, { PIN_MAX, PIN_MIN } from '../componentes/VisorPin'

// Las iniciales del círculo de la lista: la primera letra de las dos primeras palabras ("Juan Pérez" da "JP"),
// o las dos primeras letras si el nombre es una sola palabra ("Juan" da "JU").
function iniciales(nombre: string) {
  const palabras = nombre.trim().split(/\s+/)
  return (palabras.length > 1 ? palabras[0][0] + palabras[1][0] : nombre.trim().slice(0, 2)).toUpperCase()
}

export default function LoginPin() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { sesion, guardarSesion } = useSesion()

  const [staff, setStaff] = useState<DatosStaff | null>(null)
  const [elegido, setElegido] = useState<Usuario | null>(null)
  const [pidiendoContrasena, setPidiendoContrasena] = useState(false)
  const [pin, setPin] = useState('')
  const [fallo, setFallo] = useState<FalloLogin | null>(null)
  const [enviando, setEnviando] = useState(false)

  // La lista y el dispositivo juntos, así no se ve la lista y después salta al PIN.
  // El mozo del dispositivo se usa solo si está en la lista de este local.
  useEffect(() => {
    let activo = true
    Promise.all([obtenerDatosStaff(token), obtenerDispositivo()])
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
  }, [token])

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
    ? 'Cada 7 días te pedimos tu usuario y tu contraseña. El resto de los días entrás solo con tu PIN.'
    : !elegido
      ? '¿Quién empieza el turno? Tocá tu nombre y después ingresá tu PIN.'
      : bloqueado
        ? `Hola, ${elegido.nombre}.`
        : `Hola, ${elegido.nombre}. Ingresá tu PIN para empezar el turno.`
  // P-04d: el título del aviso es la primera oración del texto del back, y debajo va el resto.
  const [tituloBloqueo, ...restoBloqueo] = fallo ? textoDeFallo(fallo).split(/(?<=\.)\s/) : []

  return (
    // Con el aviso de PIN incorrecto se saca la taza, como P-04c, para que entre el teclado.
    <MarcoAcceso bajada={bajada} ilustracion={!(enPin && fallo && !bloqueado)}>
      {fallo && !enPin && <AvisoDeFallo className="mb-4">{textoDeFallo(fallo)}</AvisoDeFallo>}

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
        <section>
          {staff === null && !fallo && <p className="text-center text-[13px] text-secundario">Cargando…</p>}
          <ul className="flex flex-col gap-2.5">
            {staff?.usuarios.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => {
                    setElegido(u)
                    setFallo(null)
                  }}
                  className="flex min-h-[60px] w-full items-center gap-3 rounded-[14px] border border-secundario bg-fondo py-[11px] pl-[13px] pr-[15px] text-left hover:bg-tarjeta"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linea text-[13px] font-semibold">
                    {iniciales(u.nombre)}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-[15px] font-semibold">{u.nombre}</span>
                  <img src={iconoFlechaChevron} alt="" width={20} height={20} className="shrink-0" />
                </button>
              </li>
            ))}
          </ul>
          {staff !== null && (
            <p className="mx-auto mt-[18px] max-w-[300px] text-center text-[13px] text-secundario">
              Solo aparece el personal activo del local. El Admin entra con su email.
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
        <form onSubmit={enviar} className={columna}>
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

          {!fallo && <p className="text-[13px] text-secundario">Mismo acceso para Mozo, Caja y Cocina.</p>}
        </form>
      )}
    </MarcoAcceso>
  )
}
