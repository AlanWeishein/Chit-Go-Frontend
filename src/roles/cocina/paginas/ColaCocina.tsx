// P-11: cola de Cocina (KDS). Ruta: /cocina/cola (HU-11, RF-22, RF-23)
// Tres columnas: "En cola", "En preparación" y "Listo". El estado es del pedido entero, no de cada plato (D-01).
import { useState } from 'react'
import { ApiError, esSesionVencida } from '../../../compartido/api/http'
import {
  aplicarEventoCocina,
  empezarPedido,
  escucharCola,
  listarCola,
  marcarPedidoListo,
  ordenarCola,
  type EstadoCocina,
  type EventoCocina,
  type PedidoCocina,
} from '../../../compartido/api/cocina'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import { useAhora } from '../../../compartido/ui/useAhora'
import { useListaEnVivo } from '../../../compartido/ws/useListaEnVivo'
import TarjetaCocina from '../componentes/TarjetaCocina'

const COLUMNAS: { estado: EstadoCocina; titulo: string; vacio: string; accion?: string }[] = [
  { estado: 'APROBADO', titulo: 'En cola', vacio: 'No hay pedidos en cola.', accion: 'Empezar a preparar' },
  { estado: 'EN_PREPARACION', titulo: 'En preparación', vacio: 'No hay pedidos en preparación.', accion: 'Marcar listo' },
  { estado: 'LISTO', titulo: 'Listo', vacio: 'No hay pedidos listos.' }, // los sirve el mozo
]

export default function ColaCocina() {
  const { sesion } = useSesion()
  // Cocina siempre tiene local. Sin local (o sin sesión) no hay cola que mostrar.
  if (!sesion?.local) return null
  return <Cola localId={sesion.local.id} operador={sesion.nombre} />
}

function Cola({ localId, operador }: { localId: number; operador: string }) {
  const { cerrar } = useSesion()
  const { items, cargando, error, conectado, aplicarEvento, recargar } = useListaEnVivo<PedidoCocina, EventoCocina>({
    clave: localId,
    listar: listarCola,
    escuchar: (m) => escucharCola(localId, m),
    aplicar: aplicarEventoCocina,
    ordenar: ordenarCola,
    mensajeError: 'No pudimos cargar la cola. Revisá la conexión.',
  })
  const ahora = useAhora()

  const [procesando, setProcesando] = useState<number | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function avanzar(
    p: PedidoCocina,
    accion: (id: number, version?: number) => Promise<void>,
    siguiente: Exclude<EstadoCocina, 'APROBADO'>,
  ) {
    setProcesando(p.id)
    setAviso(null)
    try {
      await accion(p.id, p.version)
      // Confirmado por el servidor: se refleja ya en la pantalla (el evento que llegue después es idempotente).
      const marca = new Date().toISOString()
      aplicarEvento({
        tipo: 'ACTUALIZADO',
        pedido: { ...p, estado: siguiente, ...(siguiente === 'EN_PREPARACION' ? { enPreparacionEn: marca } : { listoEn: marca }) },
      })
    } catch (err) {
      // Sesión vencida: la app ya manda al login (ver http.ts), no hay nada que avisar acá.
      if (esSesionVencida(err)) return
      if (err instanceof ApiError && err.status === 409) {
        // TODO(back): qué evento llega cuando Caja cancela un pedido que todavía no empezó. Por ahora, el 409 + recargar lo cubre.
        setAviso('Ese pedido ya cambió: Caja lo canceló o lo tomó otra pantalla. Actualizamos la cola.')
        void recargar()
      } else {
        setAviso('No se pudo completar la acción. Probá de nuevo.')
      }
    } finally {
      setProcesando(null)
    }
  }

  const accionDe = (p: PedidoCocina) =>
    p.estado === 'APROBADO'
      ? () => void avanzar(p, empezarPedido, 'EN_PREPARACION')
      : p.estado === 'EN_PREPARACION'
        ? () => void avanzar(p, marcarPedidoListo, 'LISTO')
        : undefined

  return (
    <main className="min-h-screen bg-fondo p-4 text-texto md:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primario">Cola de cocina</h1>
          <p className="text-sm text-secundario">
            {items.length} {items.length === 1 ? 'pedido' : 'pedidos'} en total
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className={conectado ? 'text-primario' : 'font-semibold text-red-700'} role="status">
            {conectado ? 'En vivo' : 'Sin conexión: reconectando…'}
          </span>
          <span className="text-secundario">{operador}</span>
          {/* Al cerrar la sesión, RutaProtegida manda al login */}
          <button type="button" onClick={() => void cerrar()} className="rounded-lg border border-linea bg-tarjeta px-3 py-2">
            Salir
          </button>
        </div>
      </header>

      {aviso && (
        <div role="status" className="mb-4 rounded-xl border border-linea bg-tarjeta px-4 py-3 text-sm">
          {aviso}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => void recargar()} className="font-medium underline">
            Reintentar
          </button>
        </div>
      )}

      {cargando ? (
        <p className="text-secundario">Cargando pedidos…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNAS.map((c) => {
            const pedidos = items.filter((p) => p.estado === c.estado)
            return (
              <section key={c.estado} aria-labelledby={`col-${c.estado}`} className="rounded-2xl bg-suave/40 p-3">
                <h2 id={`col-${c.estado}`} className="mb-3 flex items-center justify-between text-lg font-semibold">
                  {c.titulo}
                  <span className="rounded-full bg-tarjeta px-2.5 py-0.5 text-sm text-secundario">{pedidos.length}</span>
                </h2>
                {pedidos.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-linea p-4 text-center text-sm text-secundario">{c.vacio}</p>
                ) : (
                  <ul className="space-y-3">
                    {pedidos.map((p) => (
                      <TarjetaCocina
                        key={p.id}
                        pedido={p}
                        ahora={ahora}
                        ocupado={procesando === p.id}
                        textoAccion={c.accion}
                        onAccion={accionDe(p)}
                      />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
