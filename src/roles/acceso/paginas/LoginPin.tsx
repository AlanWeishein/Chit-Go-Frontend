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
import SesionAbierta from '../componentes/SesionAbierta'
import TecladoPin from '../componentes/TecladoPin'
import { textoDeFallo } from '../componentes/textoDeFallo'
import VisorPin, { PIN_MAX, PIN_MIN } from '../componentes/VisorPin'

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fondo p-6 text-texto">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold text-primario">Chit&Go</h1>
        <p className="mt-1 text-center text-sm text-secundario">{staff?.nombreLocal ?? 'Ingreso para el personal'}</p>

        <div className="mt-6 rounded-2xl border border-linea bg-tarjeta p-6">
          {fallo && <AvisoDeFallo className="mb-4">{textoDeFallo(fallo)}</AvisoDeFallo>}

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
              <h2 className="mb-3 text-sm font-medium">¿Quién sos?</h2>
              {staff === null && !fallo && <p className="text-sm text-secundario">Cargando…</p>}
              <ul className="grid grid-cols-2 gap-3">
                {staff?.usuarios.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setElegido(u)
                        setFallo(null)
                      }}
                      className="w-full rounded-xl border border-linea bg-fondo py-4 font-semibold hover:bg-suave"
                    >
                      {u.nombre}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <form onSubmit={enviar}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium">Hola, {elegido.nombre}. Ingresá tu PIN.</h2>
                <button type="button" onClick={volverALaLista} className="text-sm text-primario underline">
                  Cambiar
                </button>
              </div>

              <VisorPin pin={pin} />

              <TecladoPin valor={pin} onCambio={setPin} max={PIN_MAX} deshabilitado={enviando} />

              <button
                type="submit"
                disabled={enviando || pin.length < PIN_MIN}
                className="mt-5 w-full rounded-xl bg-primario py-3 text-lg font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
