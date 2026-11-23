import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { cambiarInhabilitada, darDeBajaMesa, listarMesas } from '../../../compartido/api/mesas'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import type { MesaAdmin } from '../../../compartido/tipos/mesas'
import iconoInhabilitada from '../../../compartido/ui/iconos/ban-blanco-14.svg'
import iconoInfo from '../../../compartido/ui/iconos/info.svg'
import iconoEditar from '../../../compartido/ui/iconos/pencil.svg'
import iconoAgregar from '../../../compartido/ui/iconos/plus-28.svg'
import iconoNueva from '../../../compartido/ui/iconos/plus-blanco.svg'
import iconoImprimirApagado from '../../../compartido/ui/iconos/printer.svg'
import iconoImprimir from '../../../compartido/ui/iconos/printer-primario.svg'
import Paginacion from '../../../compartido/ui/Paginacion'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import DialogoDeConfirmacion from '../componentes/DialogoDeConfirmacion'
import FormularioDeMesa from '../componentes/FormularioDeMesa'
import InhabilitarMesa from '../componentes/InhabilitarMesa'
import InterruptorDeMesa from '../componentes/InterruptorDeMesa'
import QrImpreso, { direccionDeLaMesa } from '../componentes/QrImpreso'

// `vez` cambia siempre: dos avisos iguales seguidos vuelven a contar los 5 segundos.
interface Aviso {
  texto: string
  error: boolean
  vez: number
}

const POR_PAGINA = 12 // 3 filas de 4 tarjetas a 1280 px (ST-35)

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const botonContorno = `flex h-11 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario disabled:opacity-[.38] ${foco}`

// Con localhost el QR apunta a la compu de quien lo abrió y el celular no llega (ver la ST-31).
const esLocal = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)

function bajada(mesas: MesaAdmin[]): string {
  const total = mesas.length === 1 ? '1 mesa' : `${mesas.length} mesas`
  const inhabilitadas = mesas.filter((m) => m.inhabilitada).length
  const partes = [total]
  if (inhabilitadas > 0) partes.push(inhabilitadas === 1 ? '1 inhabilitada' : `${inhabilitadas} inhabilitadas`)
  partes.push('un QR imprimible por mesa (codifica un token, no el número)')
  return partes.join(' · ')
}

// P-15, las mesas del local y sus QR (HU-13, nodo 2009:6968). La lista es la completa (todas las páginas de
// GET /admin/mesas) y el back manda solo las activas: una mesa dada de baja sale de la lista al recargar.
// Imprimir monta P-38 (QrImpreso) fuera de la pantalla y llama a window.print(): al imprimir sale solo eso.
export default function GestionMesasPage() {
  const { sesion } = useSesion()
  const [mesas, setMesas] = useState<MesaAdmin[] | null>(null)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [formulario, setFormulario] = useState<{ mesa: MesaAdmin | null } | null>(null)
  const [aInhabilitar, setAInhabilitar] = useState<MesaAdmin | null>(null)
  const [aDarDeBaja, setADarDeBaja] = useState<MesaAdmin | null>(null)
  const [enviandoId, setEnviandoId] = useState<number | null>(null)
  const [aImprimir, setAImprimir] = useState<MesaAdmin[] | null>(null)
  const [pagina, setPagina] = useState(0)

  const ultimoPedido = useRef(0) // vale solo la última respuesta
  const hayDatos = useRef(false)
  const enviandoRef = useRef(false) // el estado llega un render tarde: la ref corta el doble toque
  const vez = useRef(0)

  function avisar(texto: string, error = false) {
    setAviso({ texto, error, vez: ++vez.current })
  }

  // Con `irA`, la lista pasa a la página donde cae esa mesa (la que se creó o se editó), así se ve al lado del aviso.
  function cargar(irA?: number) {
    const numero = ++ultimoPedido.current
    listarMesas()
      .then((lista) => {
        if (numero !== ultimoPedido.current) return
        hayDatos.current = true
        setMesas(lista)
        const indice = irA === undefined ? -1 : lista.findIndex((m) => m.id === irA)
        if (indice >= 0) setPagina(Math.floor(indice / POR_PAGINA))
        setErrorLista(null)
      })
      .catch((err) => {
        if (numero !== ultimoPedido.current) return
        // Con la lista en pantalla, el fallo va al aviso y la lista se queda.
        if (hayDatos.current) avisar(textoDelError(err), true)
        else setErrorLista(textoDelError(err))
      })
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

  // Con las hojas ya montadas, se imprime. Al cerrar la vista de impresión se desmontan.
  useEffect(() => {
    if (!aImprimir) return
    const terminar = () => setAImprimir(null)
    window.addEventListener('afterprint', terminar, { once: true })
    window.print()
    return () => window.removeEventListener('afterprint', terminar)
  }, [aImprimir])

  async function accionar(mesa: MesaAdmin, llamada: () => Promise<unknown>, textoOk: string) {
    if (enviandoRef.current) return
    enviandoRef.current = true
    setEnviandoId(mesa.id)
    try {
      await llamada()
      avisar(textoOk)
      cargar()
    } catch (err) {
      avisar(textoDelError(err), true)
      const status = statusDe(err)
      if (status === 404 || status === 409) cargar() // la lista que se ve puede estar vieja
    } finally {
      enviandoRef.current = false
      setEnviandoId(null)
      setADarDeBaja(null)
    }
  }

  function alTocarInterruptor(mesa: MesaAdmin) {
    if (mesa.inhabilitada) {
      accionar(mesa, () => cambiarInhabilitada(mesa.id, false, null), `Se habilitó la Mesa ${mesa.numero}.`)
    } else {
      setAInhabilitar(mesa)
    }
  }

  // `todas` es la lista completa: la bajada e "Imprimir todos" la usan entera. La grilla muestra `visibles`.
  const todas = mesas ?? []
  const totalPaginas = Math.max(1, Math.ceil(todas.length / POR_PAGINA))
  // Si la lista se achica al recargar (una baja), la página no se queda más allá de la última.
  const paginaActual = Math.min(pagina, totalPaginas - 1)
  const visibles = todas.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA)
  const esLaUltima = paginaActual === totalPaginas - 1

  return (
    <>
      <section className="flex min-h-full flex-col gap-[18px] bg-fondo px-8 pt-7 pb-6 font-inter text-texto print:hidden">
        <header className="flex min-h-11 items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5 leading-[normal]">
            <h1 className="titulo text-[25px]">Mesas y QR</h1>
            {mesas && <p className="text-[13px] text-secundario">{bajada(todas)}</p>}
          </div>
          <div className="flex shrink-0 gap-2.5">
            <button
              type="button"
              onClick={() => setAImprimir(todas)}
              disabled={todas.length === 0}
              className={botonContorno}
            >
              <img src={iconoImprimir} alt="" width={20} height={20} />
              Imprimir todos
            </button>
            <button
              type="button"
              onClick={() => setFormulario({ mesa: null })}
              className={`flex h-11 items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold text-texto-boton ${foco}`}
            >
              <img src={iconoNueva} alt="" width={20} height={20} />
              Nueva mesa
            </button>
          </div>
        </header>

        {esLocal && (
          <div className="flex items-start gap-3 rounded-[14px] bg-linea p-[14px]">
            <img src={iconoInfo} alt="" width={20} height={20} className="shrink-0" />
            <p className="text-[13px] leading-[normal]">
              Abriste el panel por localhost, así que los QR apuntan a esta compu y el celular no llega. Para imprimir
              los de verdad, entrá por la IP de la compu o por el dominio del local.
            </p>
          </div>
        )}

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

        {mesas === null && !errorLista ? (
          <p className="py-10 text-center text-secundario">Cargando las mesas…</p>
        ) : mesas === null ? (
          <div className="py-10 text-center">
            <p role="alert">{errorLista}</p>
            <button type="button" onClick={() => cargar()} className={`mx-auto mt-4 ${botonContorno}`}>
              Probá de nuevo
            </button>
          </div>
        ) : (
          <>
            {todas.length === 0 && <p className="text-secundario">Todavía no hay mesas. Creá la primera.</p>}
            <ul className="flex flex-wrap items-start gap-4">
              {visibles.map((m) => (
                <li
                  key={m.id}
                  className="flex w-[228px] flex-col items-start gap-2.5 rounded-2xl bg-linea p-[14px] leading-[normal]"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <h2 className="min-w-0 text-base font-semibold break-words">Mesa {m.numero}</h2>
                    {m.inhabilitada && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primario py-1 pr-[9px] pl-[7px] text-xs font-medium whitespace-nowrap text-texto-boton">
                        <img src={iconoInhabilitada} alt="" width={14} height={14} />
                        Inhabilitada
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex size-[84px] items-center justify-center rounded-[10px] bg-tarjeta ${
                      m.inhabilitada ? 'opacity-35' : ''
                    }`}
                  >
                    <QRCodeSVG
                      value={direccionDeLaMesa(m.tokenQr)}
                      size={64}
                      level="M"
                      marginSize={0}
                      title={`QR de la Mesa ${m.numero}`}
                    />
                  </div>

                  {m.inhabilitada && m.motivoInhabilitacion && (
                    <p className="w-full text-[13px] break-words">Motivo: {m.motivoInhabilitacion}</p>
                  )}

                  <InterruptorDeMesa
                    numero={m.numero}
                    habilitada={!m.inhabilitada}
                    deshabilitado={enviandoId !== null}
                    alTocar={() => alTocarInterruptor(m)}
                  />

                  <button
                    type="button"
                    onClick={() => setAImprimir([m])}
                    aria-label={`Imprimir el QR de la Mesa ${m.numero}`}
                    className={
                      m.inhabilitada
                        ? `flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border-[1.25px] border-dashed border-secundario px-[18px] text-[15px] font-semibold ${foco}`
                        : `${botonContorno} w-full`
                    }
                  >
                    <img src={m.inhabilitada ? iconoImprimirApagado : iconoImprimir} alt="" width={20} height={20} />
                    Imprimir QR
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormulario({ mesa: m })}
                    aria-label={`Editar la Mesa ${m.numero}`}
                    className={`flex h-11 items-center gap-2 rounded-[14px] text-[15px] font-semibold underline ${foco}`}
                  >
                    <img src={iconoEditar} alt="" width={20} height={20} />
                    Editar
                  </button>
                </li>
              ))}
              {/* Solo en la última página: en las llenas bajaría a una cuarta fila. "Nueva mesa" está siempre. */}
              {esLaUltima && (
                <li className="flex min-h-[200px] w-[228px] self-stretch">
                  <button
                    type="button"
                    onClick={() => setFormulario({ mesa: null })}
                    className={`flex w-full flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-secundario p-3 text-base font-semibold ${foco}`}
                  >
                    <img src={iconoAgregar} alt="" width={28} height={28} />
                    Agregar mesa
                  </button>
                </li>
              )}
            </ul>
            {todas.length > 0 && (
              <Paginacion
                pagina={paginaActual}
                totalPaginas={totalPaginas}
                mostrando={visibles.length}
                total={todas.length}
                alCambiar={setPagina}
              />
            )}
          </>
        )}

        <p className="text-[13px] text-secundario">Inhabilitar desde acá es fijo, hasta que la vuelvas a habilitar.</p>

        {formulario && (
          <FormularioDeMesa
            key={formulario.mesa?.id ?? 'nueva'}
            mesa={formulario.mesa}
            alVolver={() => setFormulario(null)}
            alGuardar={(mesa, nueva) => {
              setFormulario(null)
              avisar(nueva ? `Se creó la Mesa ${mesa.numero}.` : `Se guardó la Mesa ${mesa.numero}.`)
              cargar(mesa.id) // la lista sigue a la mesa, también si al editarla cambió de número y de página
            }}
            alPedirBaja={(mesa) => {
              setFormulario(null)
              setADarDeBaja(mesa)
            }}
          />
        )}

        {aInhabilitar && (
          <InhabilitarMesa
            key={aInhabilitar.id}
            mesa={aInhabilitar}
            alVolver={() => setAInhabilitar(null)}
            alInhabilitar={(mesa) => {
              setAInhabilitar(null)
              avisar(`Se inhabilitó la Mesa ${mesa.numero}.`)
              cargar()
            }}
          />
        )}

        {aDarDeBaja && (
          <DialogoDeConfirmacion
            key={aDarDeBaja.id}
            titulo={`¿Dar de baja la Mesa ${aDarDeBaja.numero}?`}
            texto="Deja de aparecer en la lista y su QR ya no abre la mesa. Lo que ya pasó en ella queda en la auditoría."
            textoConfirmar="Sí, dar de baja"
            enviando={enviandoId !== null}
            alVolver={() => setADarDeBaja(null)}
            alConfirmar={() => {
              const mesa = aDarDeBaja
              accionar(mesa, () => darDeBajaMesa(mesa.id), `Se dio de baja la Mesa ${mesa.numero}.`)
            }}
          />
        )}
      </section>

      {/* P-38: solo existe mientras se imprime, una mesa por hoja. */}
      {aImprimir && (
        <div className="hidden print:block">
          {aImprimir.map((m) => (
            <QrImpreso key={m.id} local={sesion?.local?.nombre ?? ''} numero={m.numero} tokenQr={m.tokenQr} />
          ))}
        </div>
      )}
    </>
  )
}
