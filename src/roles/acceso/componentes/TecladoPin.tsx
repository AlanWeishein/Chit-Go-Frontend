import { useEffect, useRef } from 'react'
import iconoBorrar from '../../../compartido/ui/iconos/backspace.svg'
import { foco } from './MarcoAcceso'

interface Props {
  valor: string
  onCambio: (nuevo: string) => void
  max?: number
  deshabilitado?: boolean
}

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const base = `flex h-[60px] items-center justify-center rounded-2xl bg-linea text-2xl font-semibold text-texto transition-colors hover:bg-suave active:bg-suave disabled:opacity-50 ${foco}`

// El teclado de P-04: teclas de 88 × 60 con relleno `linea` y sin borde. Abajo a la izquierda va el hueco, y
// "Borrar" saca el último dígito. También se escribe con el teclado físico: los dígitos (los de arriba y los del
// teclado numérico), Retroceso y Enter, que toca "Ingresar" si el foco no está en un botón, un enlace o un campo.
export default function TecladoPin({ valor, onCambio, max = 10, deshabilitado = false }: Props) {
  const raiz = useRef<HTMLDivElement>(null)
  const agregar = (n: string) => valor.length < max && onCambio(valor + n)

  useEffect(() => {
    if (deshabilitado) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const destino = e.target instanceof HTMLElement ? e.target : null
      if (destino?.closest('input, textarea, select, [contenteditable]')) return
      if (/^[0-9]$/.test(e.key)) {
        if (valor.length < max) onCambio(valor + e.key)
      } else if (e.key === 'Backspace') {
        onCambio(valor.slice(0, -1))
      } else if (e.key === 'Enter' && !destino?.closest('button, a')) {
        raiz.current?.closest('form')?.querySelector<HTMLButtonElement>('button[type="submit"]:not(:disabled)')?.click()
      } else {
        return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [valor, max, deshabilitado, onCambio])

  return (
    <div ref={raiz} className="grid w-full max-w-[288px] grid-cols-3 gap-x-3 gap-y-2.5">
      {TECLAS.map((n) => (
        <button key={n} type="button" disabled={deshabilitado} onClick={() => agregar(n)} className={base}>
          {n}
        </button>
      ))}
      <span aria-hidden="true" />
      <button type="button" disabled={deshabilitado} onClick={() => agregar('0')} className={base}>
        0
      </button>
      <button
        type="button"
        disabled={deshabilitado}
        aria-label="Borrar el último dígito"
        onClick={() => onCambio(valor.slice(0, -1))}
        className={`${base} flex-col gap-0.5 text-xs font-medium`}
      >
        <img src={iconoBorrar} alt="" width={20} height={20} />
        Borrar
      </button>
    </div>
  )
}
