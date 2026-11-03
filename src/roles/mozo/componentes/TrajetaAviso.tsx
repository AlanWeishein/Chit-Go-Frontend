import { useState } from 'react'
import { atenderAviso, type AvisoMozo } from '../../../compartido/api/mozo'
import { ApiError } from '../../../compartido/api/http'

const TEXTOS_AVISO = {
  LLAMAR_MOZO: 'La mesa está llamando al mozo.',
  CUENTA_SOLICITADA: 'Solicitaron la cuenta.',
  MESA_SIN_MOZO: 'Mesa abierta sin asignación.',
}

export default function TarjetaAviso({ aviso, onAtendido }: { aviso: AvisoMozo; onAtendido: () => void }) {
  const [enviando, setEnviando] = useState(false)

  const handleAtender = async () => {
    if (enviando) return
    setEnviando(true)
    try {
      await atenderAviso(aviso.id)
      onAtendido()
    } catch (error) {
      if (error instanceof ApiError && [404, 409].includes(error.status)) {
        onAtendido()
      } else {
        alert('Error al atender el aviso. Reintentá.')
      }
    } finally {
      setEnviando(false)
    }
  }

  const nombreMesa = isNaN(Number(aviso.mesa)) ? aviso.mesa : `Mesa ${aviso.mesa}`

  return (
    <article className="flex items-center justify-between rounded-2xl border border-secundario bg-tarjeta p-4">
      <div>
        <h3 className="text-[16px] font-semibold">{nombreMesa}</h3>
        <p className="text-[13px] text-secundario">{TEXTOS_AVISO[aviso.tipo] || aviso.tipo}</p>
      </div>
      <button
        onClick={handleAtender}
        disabled={enviando}
        className="rounded-xl border-[1.5px] border-primario px-4 py-2 text-[15px] font-semibold text-primario disabled:opacity-50"
      >
        {enviando ? 'Enviando...' : 'Atendido'}
      </button>
    </article>
  )
}
