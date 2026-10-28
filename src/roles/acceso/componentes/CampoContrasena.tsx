import { useState } from 'react'

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 64

// El mismo campo que LoginAdmin, con 48 px de alto como pide el DESIGN.md.
export const campo =
  'mt-1 block h-12 w-full rounded-lg border border-linea bg-fondo px-3 focus:outline-none focus:ring-2 focus:ring-primario'

interface Props {
  id: string
  rotulo: string
  valor: string
  onCambio: (nuevo: string) => void
  autoComplete: 'current-password' | 'new-password'
  deshabilitado?: boolean
}

// Contraseña con "Mostrar" (P-12, P-32, P-32b y P-29).
export default function CampoContrasena({ id, rotulo, valor, onCambio, autoComplete, deshabilitado }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          maxLength={PASSWORD_MAX}
          value={valor}
          disabled={deshabilitado}
          onChange={(e) => onCambio(e.target.value)}
          className={`${campo} pr-24`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute right-0 top-1 h-12 px-3 text-sm font-semibold text-primario underline"
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </div>
  )
}
