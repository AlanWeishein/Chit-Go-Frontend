import { useEffect, useRef, useState } from 'react'
import { textoDelError } from '../../../compartido/api/errores'
import { listarPlatos, type PlatoConDisponibilidad } from '../../../compartido/api/platos'
import iconoNoDisponible from '../../../compartido/ui/iconos/ban.svg'
import iconoDisponible from '../../../compartido/ui/iconos/check-14.svg'
import iconoElegido from '../../../compartido/ui/iconos/check-16.svg'
import iconoBuscar from '../../../compartido/ui/iconos/search-18.svg'
import InterruptorDeDisponibilidad from '../../../compartido/ui/InterruptorDeDisponibilidad'
import { normalizar } from '../../../compartido/ui/normalizar'
import { useCambioDeDisponibilidad } from '../../../compartido/ui/useCambioDeDisponibilidad'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'

const rotulo = 'text-[11px] leading-[normal] font-semibold tracking-[0.66px] text-secundario uppercase'
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// Se usa en Caja (adentro de MarcoCaja) y en el Admin (adentro de MarcoAdmin, P-10c): no depende del marco.
// El Admin le pasa su propio subtítulo. El switch y el diálogo de pedidos afectados son los de compartido/ui,
// que usa también la carta del Admin (P-14).
export default function DisponibilidadRapida({
  subtitulo = 'Apagar un plato lo saca del menú de los clientes al instante.',
}: {
  subtitulo?: string
}) {
  const [platos, setPlatos] = useState<PlatoConDisponibilidad[] | null>(null)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
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

  const { alternar, cambiando, aviso, exito, dialogo, refDelSwitch } = useCambioDeDisponibilidad(recargar)

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
          <p className="text-[13px] text-secundario">{subtitulo}</p>
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
                      <InterruptorDeDisponibilidad
                        ref={refDelSwitch(p.id)}
                        nombre={p.nombre}
                        activo={p.disponible}
                        textoActivo="Disponible"
                        textoInactivo="No disponible"
                        deshabilitado={cambiando === p.id}
                        alTocar={() => alternar(p)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <p className="text-[13px] text-secundario">Para editar precios, fotos o categorías: Admin → Menú (P-14).</p>

      {dialogo}
    </section>
  )
}
