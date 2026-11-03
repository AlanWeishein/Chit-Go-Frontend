import { useState } from 'react'
import { useMozo } from '../componentes/useMozo'
import TarjetaMesa from '../componentes/TarjetaMesa'
import TarjetaAviso from '../componentes/TarjetaAviso'

export default function PanelMozo() {
  const { mesas, avisos, cargando, error, recargar } = useMozo()
  const [pestana, setPestana] = useState<'MESAS' | 'AVISOS'>('MESAS')

  if (cargando) {
    return <p className="p-6 text-sm text-secundario">Cargando salón...</p>
  }

  if (error && mesas.length === 0) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center p-6 text-center">
        <p className="mb-4 text-sm text-secundario">Hubo un error al cargar el salón.</p>
        <button onClick={recargar} className="rounded-xl bg-primario px-6 py-3 font-medium text-texto-boton">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-fondo text-texto">
      <header className="px-6 py-4">
        <h1 className="font-[Fraunces] text-3xl font-semibold">Tu salón</h1>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto px-6 pb-24">
        {pestana === 'MESAS' ? (
          mesas.length === 0 ? (
            <p className="text-sm text-secundario">No tenés mesas asignadas.</p>
          ) : (
            mesas.map((mesa) => <TarjetaMesa key={mesa.id} mesa={mesa} onCambio={recargar} />)
          )
        ) : avisos.length === 0 ? (
          <p className="text-sm text-secundario">No hay avisos pendientes.</p>
        ) : (
          avisos.map((aviso) => <TarjetaAviso key={aviso.id} aviso={aviso} onAtendido={recargar} />)
        )}
      </main>

      <nav className="fixed right-0 bottom-0 left-0 border-t border-linea bg-tarjeta">
        <div className="flex h-[60px]">
          <button
            onClick={() => setPestana('MESAS')}
            className={`flex-1 border-t-[3px] text-[15px] font-semibold transition-colors ${pestana === 'MESAS' ? 'border-primario text-primario' : 'border-transparent text-secundario'}`}
          >
            Mesas
          </button>
          <button
            onClick={() => setPestana('AVISOS')}
            className={`relative flex-1 border-t-[3px] text-[15px] font-semibold transition-colors ${pestana === 'AVISOS' ? 'border-primario text-primario' : 'border-transparent text-secundario'}`}
          >
            Avisos
            {avisos.length > 0 && (
              <span className="ml-2 inline-flex h-5 items-center justify-center rounded-full bg-primario px-2 text-[11px] text-white">
                {avisos.length}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  )
}
