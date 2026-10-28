import type { ReactNode } from 'react'

// El marco de las pantallas de acceso: la marca, una bajada y la tarjeta, como LoginPin y LoginAdmin.
export default function MarcoAcceso({ bajada, children }: { bajada: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fondo p-6 text-texto">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold text-primario">Chit&Go</h1>
        <p className="mt-1 text-center text-sm text-secundario">{bajada}</p>
        <div className="mt-6 rounded-2xl border border-linea bg-tarjeta p-6">{children}</div>
      </div>
    </main>
  )
}

export const botonPrincipal =
  'w-full rounded-xl bg-primario py-3 text-lg font-medium text-white disabled:cursor-not-allowed disabled:opacity-50'
export const botonSecundario =
  'w-full rounded-xl border-[1.5px] border-primario py-3 text-lg font-medium text-primario disabled:cursor-not-allowed disabled:opacity-50'
export const enlace = 'min-h-11 text-sm font-semibold text-primario underline'
