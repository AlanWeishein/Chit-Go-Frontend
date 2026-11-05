import { useNavigate } from 'react-router-dom'
import type { MesaDelMozo } from '../../../compartido/api/mozo'

export default function CeldaMesa({
  mesa,
  llama,
}: {
  mesa: MesaDelMozo
  llama: boolean // hay un aviso pendiente LLAMAR_MOZO
}) {
  const navegar = useNavigate()
  const solicitada = mesa.estado === 'SOLICITADA' && !mesa.inhabilitada
  const hayListo = mesa.pedidos.some((p) => p.estado === 'LISTO')

  let texto = 'Libre'
  if (mesa.inhabilitada) texto = 'Inhabilitada'
  else if (mesa.estado === 'ABIERTA') texto = 'Cuenta abierta'
  else if (mesa.estado === 'SOLICITADA') texto = 'Pidió la cuenta'

  let clases = 'border-linea bg-tarjeta text-texto'
  if (mesa.inhabilitada) clases = 'border-dashed border-linea bg-transparent text-secundario'
  else if (solicitada) clases = 'border-primario bg-primario text-texto-boton'

  const chip = solicitada ? 'bg-tarjeta text-texto' : 'bg-primario text-texto-boton'

  return (
    <button
      type="button"
      onClick={() => navegar(`/mozo/mesas/${mesa.id}`)}
      className={`flex min-h-28 flex-col items-start justify-between rounded-2xl border p-3 text-left ${clases} ${
        mesa.asignada ? '' : 'opacity-60'
      }`}
    >
      <span className="font-[Fraunces] text-2xl font-semibold">{mesa.numero.padStart(2, '0')}</span>
      <span className="flex flex-col items-start gap-1">
        {mesa.asignada && llama && (
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${chip}`}>Llama</span>
        )}
        {mesa.asignada && hayListo && (
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${chip}`}>Listo para servir</span>
        )}
        <span className="text-sm">{texto}</span>
      </span>
    </button>
  )
}
