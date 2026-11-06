import { useEffect, useRef, useState } from 'react'
import { cancelarPedidos } from '../../../compartido/api/caja'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import {
  cambiarDisponibilidad,
  listarPlatos,
  type PedidoAfectado,
  type PlatoConDisponibilidad,
} from '../../../compartido/api/platos'
import DialogoAfectados from '../componentes/DialogoAfectados'

interface Dialogo {
  platoId: number
  nombre: string
  afectados: PedidoAfectado[]
  enviando: boolean
  error: string | null
  fallo: boolean // el back no canceló ninguno
}

// Sin tildes ni mayúsculas, para buscar en el navegador.
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
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
      setDialogo(null)
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
        setDialogo(null)
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
    <section className="min-h-dvh bg-fondo p-8 text-texto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[Fraunces] text-3xl font-semibold">Disponibilidad rápida</h1>
          <p className="mt-1 text-sm text-secundario">Apagar un plato lo saca del menú de los clientes al instante.</p>
        </div>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar plato"
          aria-label="Buscar plato"
          className="min-h-11 w-64 rounded-xl border border-linea bg-tarjeta px-4"
        />
      </div>

      {aviso && (
        <p role="alert" className="mt-4 rounded-xl border-2 border-primario bg-tarjeta p-3">
          ⚠ {aviso}
        </p>
      )}
      {exito && (
        <p role="status" className="mt-4 rounded-xl border-2 border-primario bg-tarjeta p-3 font-semibold">
          {exito}
        </p>
      )}

      {platos === null && !errorLista ? (
        <p className="py-16 text-center text-secundario">Cargando la carta…</p>
      ) : errorLista && platos === null ? (
        <div className="py-16 text-center">
          <p>{errorLista}</p>
          <button
            type="button"
            onClick={recargar}
            className="mt-4 min-h-11 rounded-xl border-2 border-primario px-5 font-semibold text-primario"
          >
            Probá de nuevo
          </button>
        </div>
      ) : todas.length === 0 ? (
        <p className="py-16 text-center text-secundario">Todavía no hay platos en la carta.</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {[{ id: null, nombre: 'Todos' }, ...categorias].map((c) => {
              const activa = categoriaId === c.id
              return (
                <button
                  key={c.id ?? 'todos'}
                  type="button"
                  onClick={() => setCategoriaId(c.id)}
                  aria-pressed={activa}
                  className={`min-h-11 rounded-full border px-4 text-sm ${
                    activa ? 'border-primario bg-suave font-semibold' : 'border-linea bg-tarjeta'
                  }`}
                >
                  {activa && '✓ '}
                  {c.nombre}
                </button>
              )
            })}
          </div>

          {errorLista && (
            <p role="alert" className="mt-4 text-sm text-secundario">
              {errorLista}{' '}
              <button type="button" onClick={recargar} className="font-semibold underline">
                Probá de nuevo
              </button>
            </p>
          )}

          {visibles.length === 0 ? (
            <p className="py-12 text-center text-secundario">No hay platos con ese filtro.</p>
          ) : (
            <table className="mt-4 w-full text-left">
              <thead>
                <tr className="border-b border-linea text-xs tracking-wide text-secundario">
                  <th className="py-3 font-semibold">PLATO</th>
                  <th className="py-3 font-semibold">CATEGORÍA</th>
                  <th className="py-3 font-semibold">ESTADO</th>
                  <th className="py-3 font-semibold">DISPONIBLE</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.id} className="border-b border-linea">
                    <td className="py-2">{p.nombre}</td>
                    <td className="py-2">{p.categoria.nombre}</td>
                    <td className="py-2">
                      <span className="rounded-md bg-suave px-2 py-1 text-xs">
                        {p.disponible ? '✓ Disponible' : '⊘ No disponible'}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={p.disponible}
                          aria-label={`${p.nombre}: ${p.disponible ? 'disponible' : 'no disponible'}`}
                          disabled={cambiando === p.id}
                          onClick={() => alternar(p)}
                          className="flex min-h-11 min-w-14 items-center disabled:opacity-50"
                        >
                          <span
                            className={`flex h-7 w-12 items-center rounded-full border border-linea px-0.5 transition-colors ${
                              p.disponible ? 'justify-end bg-primario' : 'justify-start bg-suave'
                            }`}
                          >
                            <span className={`h-6 w-6 rounded-full ${p.disponible ? 'bg-tarjeta' : 'bg-secundario'}`} />
                          </span>
                        </button>
                        <span className={p.disponible ? 'text-texto' : 'text-secundario'}>
                          {p.disponible ? 'Disponible' : 'No disponible'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <p className="mt-6 text-sm text-secundario">Para editar precios, fotos o categorías: Admin → Menú (P-14).</p>

      {dialogo && (
        <DialogoAfectados
          nombrePlato={dialogo.nombre}
          afectados={dialogo.afectados}
          enviando={dialogo.enviando}
          error={dialogo.error}
          fallo={dialogo.fallo}
          alDejarSeguir={() => setDialogo(null)}
          alCancelar={cancelarAfectados}
          alVerComoQuedaron={verComoQuedaron}
        />
      )}
    </section>
  )
}
