import { useEffect, useRef, useState } from 'react'
import { textoDelError } from '../../../compartido/api/errores'
import { accesoDePantalla } from '../../../compartido/api/pantallaPublica'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import iconoInfo from '../../../compartido/ui/iconos/info.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const botonContorno = `flex h-12 shrink-0 items-center justify-center rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario ${foco}`

// Con localhost la dirección apunta a la compu de quien abrió el panel y el televisor no llega (ver la ST-31).
const esLocal = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)

// El origen es la dirección con la que se abrió el Admin: igual que el QR de la mesa (P-15).
function direccionDeLaPantalla(token: string): string {
  return `${window.location.origin}/pantalla/${token}`
}

// `vez` cambia siempre: dos avisos iguales seguidos vuelven a contar los 5 segundos.
interface Aviso {
  texto: string
  error: boolean
  vez: number
}

// P-34, la configuración del local (nodo 2009:8559). Hoy tiene solo la dirección de la pantalla del salón (HU-17):
// el back no tiene PUT /admin/local/config, así que el cierre por inactividad que dibuja el Mockup no va.
export default function ConfiguracionAdmin() {
  const { sesion } = useSesion()
  const [token, setToken] = useState<string | null>(null)
  const [errorDeCarga, setErrorDeCarga] = useState<string | null>(null)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const campo = useRef<HTMLInputElement>(null)
  const vez = useRef(0)

  function cargar() {
    setErrorDeCarga(null)
    accesoDePantalla()
      .then((acceso) => setToken(acceso.tokenPantalla))
      .catch((err) => setErrorDeCarga(textoDelError(err)))
  }

  useEffect(() => {
    cargar()
  }, [])

  // El aviso se va solo a los 5 segundos.
  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(id)
  }, [aviso])

  function avisar(texto: string, error = false) {
    setAviso({ texto, error, vez: ++vez.current })
  }

  // navigator.clipboard solo existe en un contexto seguro (HTTPS o localhost), y aun ahí el navegador puede
  // negar el permiso. Entrando por la IP de la compu, que es como se abre en la demo, no está: en los dos casos
  // se selecciona el campo y se copia con execCommand.
  async function copiar(direccion: string) {
    let copiada = false
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(direccion)
        copiada = true
      }
    } catch {
      // sigue con el respaldo
    }
    if (!copiada) {
      campo.current?.select()
      copiada = document.execCommand('copy')
    }
    if (copiada) avisar('Se copió la dirección.')
    else avisar('No se pudo copiar. Copiá la dirección del campo.', true)
  }

  const direccion = token ? direccionDeLaPantalla(token) : ''

  return (
    <section className="flex min-h-full flex-col gap-[18px] bg-fondo px-8 pt-7 pb-6 font-inter text-texto">
      <header className="flex flex-col gap-0.5 leading-[normal]">
        <h1 className="titulo text-[25px]">Configuración del local</h1>
        {sesion?.local && <p className="text-[13px] text-secundario">{sesion.local.nombre}</p>}
      </header>

      {aviso &&
        (aviso.error ? (
          <AvisoDeFallo key={aviso.vez}>{aviso.texto}</AvisoDeFallo>
        ) : (
          <p
            key={aviso.vez}
            role="status"
            className="rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3 text-[15px] font-semibold"
          >
            {aviso.texto}
          </p>
        ))}

      <div className="flex flex-col gap-3.5 rounded-2xl bg-linea p-6">
        <h2 className="text-[18px] leading-[normal] font-semibold">Pantalla del salón</h2>
        <p className="text-sm leading-[1.4]">
          Es la dirección que se abre en el televisor del salón: muestra qué pedidos están en preparación y cuáles
          están listos, y se actualiza sola. No pide ingresar, así que cualquiera que tenga la dirección la ve. Solo
          muestra la mesa y el estado de cada pedido.
        </p>

        {errorDeCarga ? (
          <div className="flex flex-col items-start gap-3">
            <AvisoDeFallo>{errorDeCarga}</AvisoDeFallo>
            <button type="button" onClick={cargar} className={botonContorno}>
              Probá de nuevo
            </button>
          </div>
        ) : token === null ? (
          <p className="text-sm text-secundario">Cargando la dirección…</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="direccion-de-la-pantalla" className="text-[13px] leading-[normal] font-medium">
              Dirección de la pantalla
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={campo}
                id="direccion-de-la-pantalla"
                type="text"
                readOnly
                value={direccion}
                onFocus={(e) => e.currentTarget.select()}
                className={`h-12 min-w-[280px] flex-1 rounded-xl border-[1.25px] border-secundario bg-tarjeta px-[14px] text-[15px] text-texto ${foco}`}
              />
              <button type="button" onClick={() => void copiar(direccion)} className={botonContorno}>
                Copiar
              </button>
              <a href={direccion} target="_blank" rel="noopener noreferrer" className={botonContorno}>
                Abrir en otra pestaña
              </a>
            </div>
          </div>
        )}

        {esLocal && (
          <div className="flex items-start gap-3 rounded-[14px] bg-fondo p-[14px]">
            <img src={iconoInfo} alt="" width={20} height={20} className="shrink-0" />
            <p className="text-[13px] leading-[1.4]">
              Abriste el panel por localhost, así que esta dirección apunta a esta compu y el televisor no llega. Para
              usarla en el salón, entrá al panel por la IP de la compu o por el dominio del local.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
