import { useEffect, useRef, useState } from 'react'
import { cancelarPedidos } from '../../../compartido/api/caja'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import {
  cambiarDisponibilidad,
  listarPlatos,
  type PedidoAfectado,
  type PlatoConDisponibilidad,
} from '../../../compartido/api/platos'
import iconoNoDisponible from '../../../compartido/ui/iconos/ban.svg'
import iconoDisponible from '../../../compartido/ui/iconos/check-14.svg'
import iconoElegido from '../../../compartido/ui/iconos/check-16.svg'
import iconoBuscar from '../../../compartido/ui/iconos/search-18.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import DialogoAfectados from '../componentes/DialogoAfectados'

interface Dialogo {
  platoId: number
  nombre: string
  afectados: PedidoAfectado[]
  enviando: boolean
  error: string | null
  fallo: boolean // el back no canceló ninguno
}

const rotulo = 'text-[11px] leading-[normal] font-semibold tracking-[0.66px] text-secundario uppercase'
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// Sin tildes ni mayúsculas, para buscar en el navegador.
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Se usa en Caja (adentro de MarcoCaja) y en el Admin (sola): no depende del marco.
export default function DisponibilidadRapida() {
  const [platos, setPlatos] = useState<PlatoConDisponibilidad[] | null>(null)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const [cambiando, setCambiando] = useState<number | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const ultimoPedido = useRef(0)
  // El estado llega un render tarde: con dos toques seguidos los dos verían `cambiando` en null. La ref corta el segundo.
  const cambiandoRef = useRef(false)
  // Al cerrar el diálogo el foco vuelve al switch del plato que lo abrió: ese botón estaba deshabilitado cuando
  // el diálogo tomó el foco, así que el navegador no lo recuerda solo.
  const switches = useRef(new Map<number, HTMLButtonElement>())
  const volverA = useRef<number | null>(null)

  useEffect(() => {
    if (dialogo !== null || volverA.current === null) return
    const platoId = volverA.current
    volverA.current = null
    // Un turno después: el <dialog> al cerrarse también devuelve el foco por su cuenta, y esto va último.
    setTimeout(() => switches.current.get(platoId)?.focus(), 0)
  }, [dialogo])

  function cerrarDialogo() {
    if (dialogo) volverA.current = dialogo.platoId
    setDialogo(null)
  }

  function recargar() {
    const numero = ++ultimoPedido.current
    return listarPlatos()
      .then((lista) => {
        if (numero !== ultimoPedido.current) return
        setPlatos(lista)
        setErrorLista(null)
      })
      .catch((err) => {
        if (numero === ultimoPedido.current) setErrorLista(textoDelError(err))
      })
  }

  useEffect(() => {
    recargar()
  }, [])

  // El "Listo: se cancelaron…" se va a los 5 segundos.
  useEffect(() => {
    if (!exito) return
    const id = setTimeout(() => setExito(null), 5000)
    return () => clearTimeout(id)
  }, [exito])

  async function alternar(plato: PlatoConDisponibilidad) {
    if (cambiandoRef.current) return
    cambiandoRef.current = true
    setCambiando(plato.id)
    setAviso(null)
    setExito(null)
    try {
      const cambio = await cambiarDisponibilidad(plato.id, !plato.disponible)
      if (!cambio.disponible && cambio.afectados.length > 0) {
        setDialogo({
          platoId: plato.id,
          nombre: plato.nombre,
          afectados: cambio.afectados,
          enviando: false,
          error: null,
          fallo: false,
        })
      }
      recargar()
    } catch (err) {
      setAviso(textoDelError(err))
      recargar() // con 404 el plato ya no existe
    } finally {
      cambiandoRef.current = false
      setCambiando(null)
    }
  }

  async function cancelarAfectados() {
    if (!dialogo) return
    setDialogo({ ...dialogo, enviando: true, error: null })
    try {
      await cancelarPedidos(dialogo.afectados.map((p) => p.id))
      const n = dialogo.afectados.length
      setExito(n === 1 ? 'Listo: se canceló 1 pedido.' : `Listo: se cancelaron ${n} pedidos.`)
      cerrarDialogo()
    } catch (err) {
      const status = statusDe(err)
      setDialogo((d) =>
        d ? { ...d, enviando: false, error: textoDelError(err), fallo: status === 409 || status === 404 } : d,
      )
    }
  }

  // El plato ya está apagado: no cambia nada, pero devuelve los afectados de ahora.
  async function verComoQuedaron() {
    if (!dialogo) return
    setDialogo({ ...dialogo, enviando: true })
    try {
      const cambio = await cambiarDisponibilidad(dialogo.platoId, false)
      if (cambio.afectados.length === 0) {
        cerrarDialogo()
      } else {
        setDialogo((d) => (d ? { ...d, afectados: cambio.afectados, enviando: false, error: null, fallo: false } : d))
      }
      recargar()
    } catch (err) {
      setDialogo((d) => (d ? { ...d, enviando: false, error: textoDelError(err) } : d))
    }
  }

  const todas = platos ?? []
  const categorias: { id: number; nombre: string }[] = []
  for (const p of todas) {
    if (!categorias.some((c) => c.id === p.categoria.id)) categorias.push(p.categoria)
  }
  const texto = normalizar(busqueda.trim())
  const visibles = todas.filter(
    (p) =>
      (categoriaId === null || p.categoria.id === categoriaId) && (texto === '' || normalizar(p.nombre).includes(texto)),
  )

  return (
    <section className="flex min-h-full flex-col gap-4 bg-fondo px-6 pt-6 pb-6 font-inter text-texto">
      <header className="flex min-h-[49px] items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 leading-[normal]">
          <h1 className="titulo text-[25px]">Disponibilidad rápida</h1>
          <p className="text-[13px] text-secundario">Apagar un plato lo saca del menú de los clientes al instante.</p>
        </div>
        <div className="relative w-[200px] shrink-0">
          <img
            src={iconoBuscar}
            alt=""
            width={18}
            height={18}
            className="pointer-events-none absolute top-1/2 left-[14px] -translate-y-1/2"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar plato"
            aria-label="Buscar plato"
            className={`h-12 w-full rounded-xl border-[1.25px] border-secundario bg-tarjeta pr-[14px] pl-[42px] text-[15px] text-texto placeholder:text-secundario ${foco}`}
          />
        </div>
      </header>

      {aviso && <AvisoDeFallo>{aviso}</AvisoDeFallo>}
      {exito && (
        <p role="status" className="rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3 text-[15px] font-semibold">
          {exito}
        </p>
      )}

      {platos === null && !errorLista ? (
        <p className="py-10 text-center text-secundario">Cargando la carta…</p>
      ) : errorLista && platos === null ? (
        <div className="py-10 text-center">
          <p role="alert">{errorLista}</p>
          <button
            type="button"
            onClick={recargar}
            className={`mt-4 h-11 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario ${foco}`}
          >
            Probá de nuevo
          </button>
        </div>
      ) : todas.length === 0 ? (
        <p className="py-10 text-center text-secundario">Todavía no hay platos en la carta.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {[{ id: null, nombre: 'Todos' }, ...categorias].map((c) => {
              const activa = categoriaId === c.id
              return (
                <button
                  key={c.id ?? 'todos'}
                  type="button"
                  onClick={() => setCategoriaId(c.id)}
                  aria-pressed={activa}
                  className={`flex h-11 items-center rounded-full text-[13px] ${foco} ${
                    activa
                      ? 'gap-1.5 bg-suave pr-3.5 pl-2.5 font-medium'
                      : 'border border-secundario px-3.5'
                  }`}
                >
                  {activa && <img src={iconoElegido} alt="" width={16} height={16} />}
                  {c.nombre}
                </button>
              )
            })}
          </div>

          {errorLista && (
            <p role="alert" className="text-[13px] text-secundario">
              {errorLista}{' '}
              <button type="button" onClick={recargar} className={`inline-flex min-h-11 items-center font-semibold underline ${foco}`}>
                Probá de nuevo
              </button>
            </p>
          )}

          {visibles.length === 0 ? (
            <p className="py-10 text-center text-secundario">No hay platos con ese filtro.</p>
          ) : (
            <table className="w-full table-fixed border-collapse text-left text-[13px] leading-[normal]">
              <thead>
                <tr className={`h-[35px] border-b border-linea ${rotulo}`}>
                  <th className="px-2.5 font-semibold">Plato</th>
                  <th className="w-[120px] px-2.5 font-semibold">Categoría</th>
                  <th className="w-[150px] px-2.5 font-semibold">Estado</th>
                  <th className="w-[190px] px-2.5 font-semibold">Disponible</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.id} className="h-[51px] last:h-[50px] not-first:border-t not-first:border-linea">
                    <td className="px-2.5">{p.nombre}</td>
                    <td className="px-2.5">{p.categoria.nombre}</td>
                    <td className="px-2.5">
                      <span className="inline-flex w-max items-center gap-1 rounded-md bg-linea py-1 pr-[9px] pl-[7px] text-xs leading-[normal] font-medium whitespace-nowrap">
                        <img src={p.disponible ? iconoDisponible : iconoNoDisponible} alt="" width={14} height={14} />
                        {p.disponible ? 'Disponible' : 'No disponible'}
                      </span>
                    </td>
                    <td className="px-2.5">
                      <button
                        ref={(el) => {
                          if (el) switches.current.set(p.id, el)
                          else switches.current.delete(p.id)
                        }}
                        type="button"
                        role="switch"
                        aria-checked={p.disponible}
                        aria-label={`${p.nombre}: ${p.disponible ? 'disponible' : 'no disponible'}`}
                        disabled={cambiando === p.id}
                        onClick={() => alternar(p)}
                        className={`flex h-11 items-center gap-2 rounded-[14px] disabled:opacity-50 ${foco}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`relative block h-7 w-[46px] shrink-0 rounded-full border-[1.25px] ${
                            p.disponible ? 'border-primario bg-primario' : 'border-secundario bg-tarjeta'
                          }`}
                        >
                          <span
                            className={`absolute top-[1.75px] size-[22px] rounded-full ${
                              p.disponible ? 'left-[19.75px] bg-tarjeta' : 'left-[3px] bg-secundario'
                            }`}
                          />
                        </span>
                        <span className={`font-medium whitespace-nowrap ${p.disponible ? 'text-texto' : 'text-secundario'}`}>
                          {p.disponible ? 'Disponible' : 'No disponible'}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <p className="text-[13px] text-secundario">Para editar precios, fotos o categorías: Admin → Menú (P-14).</p>

      {dialogo && (
        <DialogoAfectados
          nombrePlato={dialogo.nombre}
          afectados={dialogo.afectados}
          enviando={dialogo.enviando}
          error={dialogo.error}
          fallo={dialogo.fallo}
          alDejarSeguir={cerrarDialogo}
          alCancelar={cancelarAfectados}
          alVerComoQuedaron={verComoQuedaron}
        />
      )}
    </section>
  )
}
