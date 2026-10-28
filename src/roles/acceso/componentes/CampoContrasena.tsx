import { useState, type ReactNode } from 'react'
import iconoCandado from '../../../compartido/ui/iconos/lock.svg'
import iconoOjo from '../../../compartido/ui/iconos/eye.svg'
import { foco } from './MarcoAcceso'

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 64

// El campo de todo el acceso, como pide el DESIGN.md: 48 px de alto, borde de 1.25 px `secundario` (3:1 contra
// la tarjeta), radio 12 y fondo `tarjeta`. Con ícono a la izquierda, el texto empieza a los 43 px, como el Mockup.
const campoBase =
  'block h-12 w-full rounded-xl border-[1.25px] border-secundario px-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primario'
export const campo = `mt-1.5 bg-tarjeta ${campoBase}`
export const campoConIcono = `bg-tarjeta pl-[43px] ${campoBase}`
export const campoFijo = `bg-linea pl-[43px] ${campoBase}`
export const rotulo = 'block text-[13px] font-medium'

interface CampoConIconoProps {
  id: string
  etiqueta: string
  icono: string
  children: ReactNode
}

// Rótulo arriba (6 px), el campo con su ícono de 18 px adentro y, si hace falta, un botón a la derecha.
export function CampoConRotulo({ id, etiqueta, icono, children }: CampoConIconoProps) {
  return (
    <div>
      <label htmlFor={id} className={rotulo}>
        {etiqueta}
      </label>
      <div className="relative mt-1.5">
        <img src={icono} alt="" width={18} height={18} className="pointer-events-none absolute left-[15px] top-[15px]" />
        {children}
      </div>
    </div>
  )
}

interface Props {
  id: string
  rotulo: string
  valor: string
  onCambio: (nuevo: string) => void
  autoComplete: 'current-password' | 'new-password'
  deshabilitado?: boolean
}

// Contraseña con candado y "Mostrar" (P-12, P-32, P-32b y P-29).
export default function CampoContrasena({ id, rotulo: etiqueta, valor, onCambio, autoComplete, deshabilitado }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <CampoConRotulo id={id} etiqueta={etiqueta} icono={iconoCandado}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        maxLength={PASSWORD_MAX}
        value={valor}
        disabled={deshabilitado}
        onChange={(e) => onCambio(e.target.value)}
        className={`${campoConIcono} pr-28`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-controls={id}
        className={`absolute right-[15px] top-0.5 flex h-11 items-center gap-1.5 px-2 text-[13px] font-medium text-texto underline ${foco}`}
      >
        <img src={iconoOjo} alt="" width={18} height={18} />
        {visible ? 'Ocultar' : 'Mostrar'}
      </button>
    </CampoConRotulo>
  )
}
