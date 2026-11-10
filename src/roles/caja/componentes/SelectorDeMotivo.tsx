import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { TEXTO_MOTIVO, type MotivoRechazo } from '../../../compartido/api/caja'
import iconoChevron from '../../../compartido/ui/iconos/chevron-d.svg'

const MOTIVOS = Object.keys(TEXTO_MOTIVO) as MotivoRechazo[]

interface Props {
  valor: MotivoRechazo | undefined
  alCambiar: (motivo: MotivoRechazo) => void
  deshabilitado?: boolean
}

// El campo "Motivo si rechazás" de P-08 y su panel desplegable (P-08b). Un <select> nativo abre el popup del
// sistema y no se parece al Mockup, así que es un listbox propio con teclado: flechas, Home y End, Enter o
// espacio para elegir, Esc para cerrar. Mientras no hay motivo la etiqueta dice "(obligatorio)".
export default function SelectorDeMotivo({ valor, alCambiar, deshabilitado = false }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const boton = useRef<HTMLButtonElement>(null)
  const lista = useRef<HTMLUListElement>(null)
  const id = useId()
  const idEtiqueta = `${id}-etiqueta`
  const idOpcion = (i: number) => `${id}-opcion-${i}`

  useEffect(() => {
    if (abierto) lista.current?.focus()
  }, [abierto])

  // Si el pedido se manda mientras el panel está abierto, el botón queda deshabilitado: se cierra.
  useEffect(() => {
    if (deshabilitado) setAbierto(false)
  }, [deshabilitado])

  // Sin motivo elegido ninguna opción arranca resaltada, como en P-08b; con uno, arranca en ese.
  function abrir() {
    setActivo(valor ? MOTIVOS.indexOf(valor) : -1)
    setAbierto(true)
  }

  function cerrar(devolverFoco: boolean) {
    setAbierto(false)
    if (devolverFoco) boton.current?.focus()
  }

  function elegir(motivo: MotivoRechazo) {
    alCambiar(motivo)
    cerrar(true)
  }

  function alTeclearEnElBoton(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      abrir()
    }
  }

  function alTeclearEnLaLista(e: KeyboardEvent<HTMLUListElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActivo((i) => Math.min(MOTIVOS.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActivo((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActivo(0)
        break
      case 'End':
        e.preventDefault()
        setActivo(MOTIVOS.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activo >= 0) elegir(MOTIVOS[activo])
        break
      case 'Escape':
        e.preventDefault()
        cerrar(true)
        break
      case 'Tab':
        setAbierto(false)
        break
    }
  }

  return (
    <div
      className="relative flex flex-col gap-1.5"
      // Un toque afuera (o salir con Tab) cierra el panel.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setAbierto(false)
      }}
    >
      <span id={idEtiqueta} className="text-[13px] leading-[normal] font-medium">
        Motivo si rechazás{valor ? '' : ' (obligatorio)'}
      </span>

      <button
        ref={boton}
        type="button"
        disabled={deshabilitado}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-labelledby={`${idEtiqueta} ${id}-valor`}
        onClick={() => (abierto ? cerrar(false) : abrir())}
        onKeyDown={alTeclearEnElBoton}
        // Abierto el borde pasa de 1.25 a 2 px y lo compensa con el padding: el texto no se corre.
        className={`flex h-12 w-full items-center gap-2.5 rounded-xl bg-tarjeta text-left text-[15px] leading-[normal] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
          abierto ? 'border-2 border-primario px-[13.25px]' : 'border-[1.25px] border-secundario px-3.5'
        }`}
      >
        <span id={`${id}-valor`} className={`flex-1 ${valor ? 'text-texto' : 'text-secundario'}`}>
          {valor ? TEXTO_MOTIVO[valor] : 'Elegí un motivo'}
        </span>
        <img src={iconoChevron} alt="" width={18} height={18} className="shrink-0" />
      </button>

      {abierto && (
        <ul
          ref={lista}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={idEtiqueta}
          aria-activedescendant={activo >= 0 ? idOpcion(activo) : undefined}
          onKeyDown={alTeclearEnLaLista}
          className="absolute top-full left-0 z-10 mt-1.5 flex w-full flex-col gap-0.5 rounded-xl border border-secundario bg-tarjeta p-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.16)] focus:outline-none"
        >
          {MOTIVOS.map((m, i) => (
            <li
              key={m}
              id={idOpcion(i)}
              role="option"
              aria-selected={m === valor}
              onMouseEnter={() => setActivo(i)}
              onClick={() => elegir(m)}
              className={`flex h-11 cursor-pointer items-center rounded-lg px-3 text-[15px] leading-[normal] ${
                i === activo ? 'bg-linea' : ''
              }`}
            >
              {TEXTO_MOTIVO[m]}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
