import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { listarUsuariosPin, loginConPin, traducirError, type FalloLogin, type Usuario } from '../../../compartido/api/auth'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { rutaInicial } from '../../../compartido/sesion/rutas'
import TecladoPin from '../componentes/TecladoPin'
import { textoDeFallo } from '../componentes/textoDeFallo'

const PIN_MIN = 4
const PIN_MAX = 10

export default function LoginPin() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { sesion, guardarSesion } = useSesion()

  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null)
  const [elegido, setElegido] = useState<Usuario | null>(null)
  const [pin, setPin] = useState('')
  const [fallo, setFallo] = useState<FalloLogin | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let activo = true
    listarUsuariosPin(token)
      .then((lista) => activo && setUsuarios(lista))
      .catch((err) => activo && setFallo(traducirError(err)))
    return () => { activo = false }
  }, [token])

  if (sesion && !sesion.debeCambiarCredencial) {
    return <Navigate to={rutaInicial(sesion.usuario.rol)} replace />
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!elegido || enviando || pin.length < PIN_MIN) return
    setEnviando(true)
    setFallo(null)
    try {
      const nueva = await loginConPin(token, elegido.id, pin)
      guardarSesion(nueva)
      navigate(nueva.debeCambiarCredencial ? `/staff/${token}/elegir-pin` : rutaInicial(nueva.usuario.rol), { replace: true })
    } catch (err) {
      setPin('')
      setFallo(traducirError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fondo p-6 text-texto">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold text-primario">Chit&Go</h1>
        <p className="mt-1 text-center text-sm text-secundario">Ingreso para el personal</p>
        <div className="mt-6 rounded-2xl border border-linea bg-tarjeta p-6">
          {fallo && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {textoDeFallo(fallo)}
            </div>
          )}
          {!elegido ? (
            <section>
              <h2 className="mb-3 text-sm font-medium">¿Quién sos?</h2>
              {usuarios === null && !fallo && <p className="text-sm text-secundario">Cargando…</p>}
              <ul className="grid grid-cols-2 gap-3">
                {usuarios?.map((u) => (
                  <li key={u.id}>
                    <button type="button" onClick={() => { setElegido(u); setFallo(null) }} className="w-full rounded-xl border border-linea bg-fondo py-4 font-semibold hover:bg-suave">
                      {u.nombre}
                      <span className="block text-xs font-normal text-secundario">{u.rol}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <form onSubmit={enviar}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium">Hola, {elegido.nombre}. Ingresá tu PIN.</h2>
                <button type="button" onClick={() => { setElegido(null); setPin(''); setFallo(null) }} className="text-sm text-primario underline">Cambiar</button>
              </div>
              <div aria-live="polite" aria-label={`PIN de ${pin.length} dígitos`} className="flex h-16 items-center justify-center rounded-xl border border-linea bg-fondo text-4xl tracking-[0.3em]">
                {pin ? '•'.repeat(pin.length) : <span className="text-linea">••••</span>}
              </div>
              <p className="mb-4 mt-1 text-center text-xs text-secundario">{pin.length} de {PIN_MIN} a {PIN_MAX} dígitos</p>
              <TecladoPin valor={pin} onCambio={setPin} max={PIN_MAX} deshabilitado={enviando} />
              <button type="submit" disabled={enviando || pin.length < PIN_MIN} className="mt-5 w-full rounded-xl bg-primario py-3 text-lg font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
                {enviando ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
