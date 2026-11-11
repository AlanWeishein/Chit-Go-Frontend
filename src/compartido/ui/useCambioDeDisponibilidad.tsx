import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cancelarPedidos } from '../api/caja'
import { statusDe, textoDelError } from '../api/errores'
import { cambiarDisponibilidad, type PedidoAfectado } from '../api/platos'
import DialogoAfectados from '../../roles/caja/componentes/DialogoAfectados'

interface Dialogo {
  platoId: number
  nombre: string
  afectados: PedidoAfectado[]
  enviando: boolean
  error: string | null
  fallo: boolean // el back no canceló ninguno
}

// Prender o apagar un plato y, si al apagarlo hay pedidos afectados, el diálogo P-10b con la cancelación en bloque.
// Lo usan la disponibilidad rápida (Caja y Admin) y la carta del Admin (P-14). Cada pantalla pone su lista: `alTerminar`
// es la función que la vuelve a pedir, y el hook la llama después de cada cambio.
export function useCambioDeDisponibilidad(alTerminar: () => unknown) {
  const [cambiando, setCambiando] = useState<number | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
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

  // El "Listo: se cancelaron…" se va a los 5 segundos.
  useEffect(() => {
    if (!exito) return
    const id = setTimeout(() => setExito(null), 5000)
    return () => clearTimeout(id)
  }, [exito])

  function cerrarDialogo() {
    if (dialogo) volverA.current = dialogo.platoId
    setDialogo(null)
  }

  async function alternar(plato: { id: number; nombre: string; disponible: boolean }) {
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
      alTerminar()
    } catch (err) {
      setAviso(textoDelError(err))
      alTerminar() // con 404 el plato ya no existe
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
      alTerminar()
    } catch (err) {
      setDialogo((d) => (d ? { ...d, enviando: false, error: textoDelError(err) } : d))
    }
  }

  const elDialogo: ReactNode = dialogo && (
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
  )

  return {
    alternar,
    cambiando, // el plato que se está cambiando, para deshabilitar su switch
    aviso, // el error del cambio, si lo hubo
    exito, // "Listo: se cancelaron…", durante 5 segundos
    dialogo: elDialogo,
    // El `ref` del switch de cada plato, para devolverle el foco al cerrar el diálogo.
    refDelSwitch: (platoId: number) => (el: HTMLButtonElement | null) => {
      if (el) switches.current.set(platoId, el)
      else switches.current.delete(platoId)
    },
  }
}
