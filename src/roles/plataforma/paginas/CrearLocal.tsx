import { useRef, useState, type FormEvent } from 'react'
import { crearLocal } from '../../../compartido/api/plataforma'
import type { LocalCreado } from '../../../compartido/tipos/plataforma'
import ConfirmarOperacion from '../../../compartido/ui/ConfirmarOperacion'
import iconoMail from '../../../compartido/ui/iconos/mail.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import CampoContrasena, { campo, campoConIcono, CampoConRotulo, rotulo } from '../../acceso/componentes/CampoContrasena'
import { botonPrincipal, botonSecundario } from '../../acceso/componentes/MarcoAcceso'
import NotaInformativa from '../../acceso/componentes/NotaInformativa'
import ResultadoOperacion from '../componentes/ResultadoOperacion'
import useFalloPlataforma from '../useFalloPlataforma'
import { contrasenaValida, emailValido } from '../validacion'

export default function CrearLocal() {
  const [nombreLocal, setNombreLocal] = useState('')
  const [direccion, setDireccion] = useState('')
  const [nombreGerente, setNombreGerente] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const enCurso = useRef(false)
  const [resultado, setResultado] = useState<LocalCreado | null>(null)
  const { fallo, limpiarFallo, mostrarFallo } = useFalloPlataforma()
  const valido = nombreLocal.trim() !== '' && nombreGerente.trim() !== '' && emailValido(email.trim()) && contrasenaValida(password)

  function revisar(e: FormEvent) {
    e.preventDefault()
    if (!valido || enCurso.current) return
    limpiarFallo()
    setConfirmando(true)
  }

  async function guardar() {
    if (enCurso.current || !valido) return
    enCurso.current = true
    setConfirmando(false)
    setEnviando(true)
    try {
      const nuevo = await crearLocal({ nombreLocal: nombreLocal.trim(), direccion: direccion.trim() || null,
        nombreGerente: nombreGerente.trim(), email: email.trim(), password })
      setResultado(nuevo)
      setNombreLocal(''); setDireccion(''); setNombreGerente(''); setEmail('')
    } catch (err) { mostrarFallo(err) }
    finally { setPassword(''); enCurso.current = false; setEnviando(false) }
  }

  if (resultado) return (
    <ResultadoOperacion titulo="El local ya está creado">
      <dl className="grid gap-4 text-[15px] sm:grid-cols-2">
        <div><dt className="text-[13px] text-secundario">Local</dt><dd className="mt-1 break-words font-semibold">{resultado.nombreLocal}</dd></div>
        <div><dt className="text-[13px] text-secundario">Identificador del local</dt><dd className="mt-1">{resultado.localId}</dd></div>
        <div><dt className="text-[13px] text-secundario">Email del Gerente/Dueño</dt><dd className="mt-1 break-all">{resultado.email}</dd></div>
        <div><dt className="text-[13px] text-secundario">Identificador del Gerente/Dueño</dt><dd className="mt-1">{resultado.gerenteId}</dd></div>
      </dl>
      <div className="my-5 border-t border-linea pt-5">
        <label htmlFor="enlace-staff" className={rotulo}>Enlace de acceso del personal</label>
        <input id="enlace-staff" readOnly className={campo}
          value={`${window.location.origin}/staff/${encodeURIComponent(resultado.tokenStaff)}`} onFocus={(e) => e.target.select()} />
        <p className="mt-2 text-[13px] text-secundario">Seleccioná el enlace para copiarlo y configurar el QR del local. Compartilo solo con su responsable.</p>
      </div>
      <NotaInformativa>El Gerente/Dueño ingresa por /admin/login con su email y la contraseña provisoria que elegiste. En el primer ingreso tiene que cambiarla. Este resultado se muestra solo en esta pantalla.</NotaInformativa>
      <button type="button" className={`mt-5 ${botonSecundario}`} onClick={() => setResultado(null)}>Crear otro local</button>
    </ResultadoOperacion>
  )

  return (
    <>
      <form onSubmit={revisar} className="flex flex-col gap-5" aria-busy={enviando}>
        {fallo && <AvisoDeFallo>{fallo}</AvisoDeFallo>}
        <fieldset disabled={enviando || confirmando} className="min-w-0 border-b border-linea pb-5">
          <legend className="titulo mb-4 text-xl">Datos del local</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="nombre-local" className={rotulo}>Nombre del local</label>
              <input id="nombre-local" required maxLength={120} value={nombreLocal} onChange={(e) => setNombreLocal(e.target.value)} className={campo} autoComplete="organization" /></div>
            <div><label htmlFor="direccion" className={rotulo}>Dirección (opcional)</label>
              <input id="direccion" maxLength={255} value={direccion} onChange={(e) => setDireccion(e.target.value)} className={campo} autoComplete="street-address" /></div>
          </div>
        </fieldset>
        <fieldset disabled={enviando || confirmando} className="min-w-0">
          <legend className="titulo mb-4 text-xl">Gerente/Dueño</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="nombre-gerente" className={rotulo}>Nombre y apellido</label>
              <input id="nombre-gerente" required maxLength={120} value={nombreGerente} onChange={(e) => setNombreGerente(e.target.value)} className={campo} autoComplete="name" /></div>
            <CampoConRotulo id="email-gerente" etiqueta="Email" icono={iconoMail}>
              <input id="email-gerente" type="email" required maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)} className={campoConIcono} autoComplete="email" />
            </CampoConRotulo>
            <div className="sm:col-span-2 sm:max-w-[400px]">
              <CampoContrasena id="password-gerente" rotulo="Contraseña provisoria" valor={password} onCambio={setPassword} autoComplete="new-password" deshabilitado={enviando || confirmando} />
              <p id="ayuda-password" className="mt-2 text-[13px] text-secundario">De 8 a 64 caracteres y hasta 72 bytes. Las letras con acento pueden ocupar más de un byte.</p>
            </div>
          </div>
        </fieldset>
        <NotaInformativa>Se crean el local y su Gerente/Dueño en una sola operación. Usá un email que todavía no esté registrado.</NotaInformativa>
        <div className="sm:w-fit sm:min-w-52"><button type="submit" disabled={!valido || enviando} className={botonPrincipal}>{enviando ? 'Creando el local…' : 'Revisar y crear local'}</button></div>
        {enviando && <p role="status" className="text-[13px] text-secundario">Estamos creando el local y su Gerente/Dueño…</p>}
      </form>
      {confirmando && <ConfirmarOperacion titulo="¿Creamos el local?" confirmacion="Sí, crear local" onConfirmar={guardar} onVolver={() => setConfirmando(false)}>
        <p>Vas a crear <strong className="text-texto">{nombreLocal.trim()}</strong> con <strong className="text-texto">{nombreGerente.trim()}</strong> como Gerente/Dueño.</p>
        <p className="mt-3 break-all">Su email de acceso será {email.trim()}.</p>
      </ConfirmarOperacion>}
    </>
  )
}
