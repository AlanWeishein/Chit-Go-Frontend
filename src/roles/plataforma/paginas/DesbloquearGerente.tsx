import { useRef, useState, type FormEvent } from 'react'
import { desbloquearGerente } from '../../../compartido/api/plataforma'
import type { DesbloqueoDeGerente } from '../../../compartido/tipos/plataforma'
import ConfirmarOperacion from '../../../compartido/ui/ConfirmarOperacion'
import iconoMail from '../../../compartido/ui/iconos/mail.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import { campoConIcono, CampoConRotulo } from '../../acceso/componentes/CampoContrasena'
import { botonPrincipal, botonSecundario } from '../../acceso/componentes/MarcoAcceso'
import NotaInformativa from '../../acceso/componentes/NotaInformativa'
import ResultadoOperacion from '../componentes/ResultadoOperacion'
import useFalloPlataforma from '../useFalloPlataforma'
import { emailValido } from '../validacion'

export default function DesbloquearGerente() {
  const [email, setEmail] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const enCurso = useRef(false)
  const [resultado, setResultado] = useState<{ email: string; estado: DesbloqueoDeGerente['resultado'] } | null>(null)
  const { fallo, limpiarFallo, mostrarFallo } = useFalloPlataforma()

  function revisar(e: FormEvent) {
    e.preventDefault()
    if (!emailValido(email.trim()) || enCurso.current) return
    limpiarFallo()
    setConfirmando(true)
  }

  async function desbloquear() {
    if (enCurso.current) return
    enCurso.current = true
    setConfirmando(false)
    setEnviando(true)
    try {
      const respuesta = await desbloquearGerente(email.trim())
      if (respuesta.resultado !== 'DESBLOQUEADO' && respuesta.resultado !== 'NO_ESTABA_BLOQUEADO') {
        throw new Error('Resultado de desbloqueo desconocido')
      }
      setResultado({ email: email.trim(), estado: respuesta.resultado })
      setEmail('')
    } catch (err) { mostrarFallo(err) }
    finally { enCurso.current = false; setEnviando(false) }
  }

  if (resultado) return (
    <ResultadoOperacion titulo={resultado.estado === 'DESBLOQUEADO' ? 'Gerente/Dueño desbloqueado' : 'El Gerente/Dueño no estaba bloqueado'}>
      <p className="break-all text-[15px]">{resultado.email}</p>
      <p className="mt-3 text-[15px] text-secundario">{resultado.estado === 'DESBLOQUEADO'
        ? 'Se levantó el bloqueo por intentos fallidos. Ya puede volver a ingresar con su contraseña.'
        : 'El backend confirmó que no había un bloqueo activo. No se realizaron cambios.'}</p>
      <button type="button" className={`mt-5 ${botonSecundario}`} onClick={() => setResultado(null)}>Consultar otro email</button>
    </ResultadoOperacion>
  )

  return (
    <>
      <form onSubmit={revisar} aria-busy={enviando} className="flex max-w-xl flex-col gap-5">
        {fallo && <AvisoDeFallo>{fallo}</AvisoDeFallo>}
        <fieldset disabled={enviando || confirmando}>
          <CampoConRotulo id="email-desbloqueo" etiqueta="Email del Gerente/Dueño" icono={iconoMail}>
            <input id="email-desbloqueo" type="email" required maxLength={160} autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} className={campoConIcono} />
          </CampoConRotulo>
        </fieldset>
        <NotaInformativa>Se levanta el bloqueo por intentos fallidos de un Gerente/Dueño con local. Su contraseña y el cambio obligatorio del primer ingreso se conservan.</NotaInformativa>
        <div className="sm:w-fit sm:min-w-52"><button type="submit" disabled={enviando || !emailValido(email.trim())} className={botonPrincipal}>{enviando ? 'Desbloqueando…' : 'Revisar y desbloquear'}</button></div>
        {enviando && <p role="status" className="text-[13px] text-secundario">Estamos comprobando el bloqueo del Gerente/Dueño…</p>}
      </form>
      {confirmando && <ConfirmarOperacion titulo="¿Desbloqueamos al Gerente/Dueño?" confirmacion="Sí, desbloquear" onConfirmar={desbloquear} onVolver={() => setConfirmando(false)}>
        <p>Se levantará el bloqueo por intentos fallidos de <strong className="break-all text-texto">{email.trim()}</strong>, si tiene uno activo.</p>
      </ConfirmarOperacion>}
    </>
  )
}
