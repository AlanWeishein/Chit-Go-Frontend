import type { Aviso } from '../../../compartido/api/mozo'
import { haceCuanto, horaDe } from '../tiempo'
import { IconoCuenta, IconoLlamar, IconoTilde } from './Iconos'

export type EstadoDeTarjeta = 'pendiente' | 'enviando' | 'ya-atendido' | 'atendido'

export function tituloDeAviso(a: Aviso): string {
  if (a.tipo === 'CUENTA_SOLICITADA') return `Mesa ${a.mesa} · Pide la cuenta`
  if (a.tipo === 'LLAMAR_MOZO') return `Mesa ${a.mesa} · Llama al mozo`
  return `Mesa ${a.mesa} · Sin mozo asignado`
}

export default function TarjetaAviso({
  aviso,
  estado,
  ahora,
  alAtender,
}: {
  aviso: Aviso
  estado: EstadoDeTarjeta
  ahora: number
  alAtender: (aviso: Aviso) => void
}) {
  const atendido = estado === 'atendido'
  return (
    <li className="flex items-center gap-3 border-b border-linea py-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-suave text-secundario">
        {aviso.tipo === 'CUENTA_SOLICITADA' ? <IconoCuenta /> : <IconoLlamar />}
      </span>

      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${atendido ? 'text-secundario' : 'text-texto'}`}>{tituloDeAviso(aviso)}</p>
        <p className="text-sm text-secundario">
          {atendido && aviso.atendidoEn ? horaDe(aviso.atendidoEn) : haceCuanto(aviso.creadoEn, ahora)}
        </p>
      </div>

      {atendido ? (
        <span className="flex items-center gap-1 rounded-md bg-suave px-2 py-1 text-xs text-secundario">
          <IconoTilde /> Atendido
        </span>
      ) : estado === 'ya-atendido' ? (
        <span className="rounded-md bg-suave px-2 py-1 text-xs text-secundario">Ya fue atendido</span>
      ) : (
        <button
          type="button"
          onClick={() => alAtender(aviso)}
          disabled={estado === 'enviando'}
          className="flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-primario px-4 font-semibold text-primario disabled:opacity-60"
        >
          <IconoTilde />
          {estado === 'enviando' ? 'Un momento…' : 'Atender'}
        </button>
      )}
    </li>
  )
}
