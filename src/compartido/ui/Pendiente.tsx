// Pantalla provisoria para las rutas que todavía no tienen página. Se borra al terminar el MVP.
export default function Pendiente({ titulo }: { titulo: string }) {
  return (
    <main className="min-h-screen bg-fondo text-texto flex items-center justify-center p-6">
      <div className="rounded-2xl border border-linea bg-tarjeta p-8 text-center">
        <h1 className="text-xl font-semibold">{titulo}</h1>
        <p className="mt-2 text-secundario">En construcción</p>
      </div>
    </main>
  )
}
