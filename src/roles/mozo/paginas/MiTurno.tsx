import { useState } from 'react'
import { useSesion } from '../../../compartido/sesion/SesionContext'

export default function MiTurno() {
  const { sesion, cerrar } = useSesion()
  const [cerrando, setCerrando] = useState(false)

  async function salir() {
    setCerrando(true)
    try {
      await cerrar()
    } finally {
      setCerrando(false)
    }
  }

  return (
    <section>
      <h1 className="font-[Fraunces] text-3xl font-semibold">Mi turno</h1>
      <p className="mt-2 text-texto">{sesion?.nombre}</p>
      <p className="text-sm text-secundario">{sesion?.local?.nombre}</p>
      <button
        type="button"
        onClick={salir}
        disabled={cerrando}
        className="mt-8 flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-primario font-semibold text-primario disabled:opacity-60"
      >
        {cerrando ? 'Cerrando…' : 'Cerrar sesión'}
      </button>
    </section>
  )
}
