import { useEffect, useId, useRef, useState } from 'react'
import type { ItemCarrito } from '../../../compartido/tipos/carrito'
import iconoNoDisponible from '../../../compartido/ui/iconos/ban.svg'
import iconoMenos from '../../../compartido/ui/iconos/minus.svg'
import iconoNota18 from '../../../compartido/ui/iconos/note-18.svg'
import iconoNota from '../../../compartido/ui/iconos/note.svg'
import iconoEditar from '../../../compartido/ui/iconos/pencil.svg'
import iconoMas18 from '../../../compartido/ui/iconos/plus-18.svg'
import iconoQuitar from '../../../compartido/ui/iconos/trash.svg'
import { CANTIDAD_MAXIMA, LARGO_NOTA } from '../useCarrito'
import { precio } from '../formato'

type PropsFila = {
  item: ItemCarrito
  noDisponible: boolean
  onCantidad: (cantidad: number) => void
  onQuitar: () => void
  onNota: (texto: string) => void
}

const tecla =
  'flex size-11 shrink-0 items-center justify-center rounded-full border-[1.25px] border-secundario disabled:opacity-[.38]'
const enlace = 'flex h-11 shrink-0 items-center gap-2 rounded-[14px] text-[15px] font-semibold text-texto underline'

// Un plato de P-02: precio por cantidad, − y + de 1 a 999, "Quitar" y la nota para cocina.
// En P-02b, el plato que ya no está lleva "No disponible".
export default function FilaPedido({ item, noDisponible, onCantidad, onQuitar, onNota }: PropsFila) {
  const { producto, cantidad, observacion } = item
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState('')
  const idNota = useId()
  const botonNota = useRef<HTMLButtonElement>(null)
  const devolverFoco = useRef(false)

  // Al cerrar con "Listo", "Listo" desaparece: el foco vuelve al botón que abrió la nota, para no quedar en el body.
  useEffect(() => {
    if (!editando && devolverFoco.current) {
      devolverFoco.current = false
      botonNota.current?.focus()
    }
  }, [editando])

  function abrirNota() {
    setBorrador(observacion ?? '')
    setEditando(true)
  }

  function guardarNota() {
    onNota(borrador)
    setEditando(false)
  }

  return (
    <li className="flex flex-col gap-1.5 py-[18px] first:pt-0">
      <div className="flex items-center justify-between gap-3 font-semibold text-texto">
        <h2 className="min-w-0 text-base">{producto.nombre}</h2>
        <p className="shrink-0 text-[15px]">{precio(producto.precio * cantidad)}</p>
      </div>

      {noDisponible && (
        <span className="inline-flex w-fit items-center gap-1 rounded-md bg-linea px-[7px] py-1 text-xs font-medium text-texto">
          <img src={iconoNoDisponible} alt="" width={14} height={14} />
          No disponible
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        <div role="group" aria-label={`Cantidad de ${producto.nombre}`} className="flex items-center gap-1.5">
          <span className="text-[13px] text-secundario">Cantidad</span>
          <button
            type="button"
            onClick={() => onCantidad(cantidad - 1)}
            disabled={cantidad <= 1}
            aria-label={`Restar uno de ${producto.nombre}`}
            className={tecla}
          >
            <img src={iconoMenos} alt="" width={18} height={18} />
          </button>
          <span className="flex h-11 w-[30px] items-center justify-center text-base font-semibold text-texto">
            {cantidad}
          </span>
          <button
            type="button"
            onClick={() => onCantidad(cantidad + 1)}
            disabled={cantidad >= CANTIDAD_MAXIMA}
            aria-label={`Sumar uno a ${producto.nombre}`}
            className={tecla}
          >
            <img src={iconoMas18} alt="" width={18} height={18} />
          </button>
        </div>
        <button type="button" onClick={onQuitar} className={enlace}>
          <img src={iconoQuitar} alt="" width={20} height={20} />
          Quitar<span className="sr-only"> {producto.nombre}</span>
        </button>
      </div>

      {editando ? (
        // Si se toca otra cosa (por ejemplo "Enviar pedido") sin "Listo", la nota se guarda igual. Pasar con Tab
        // del campo a "Listo" no cuenta: si se guardara ahí, "Listo" desaparecería antes de recibir el foco.
        <div
          className="flex flex-col gap-1.5 pt-1"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) guardarNota()
          }}
        >
          <label htmlFor={idNota} className="text-[13px] font-medium text-texto">
            Nota para cocina
          </label>
          <textarea
            id={idNota}
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            maxLength={LARGO_NOTA}
            rows={2}
            autoFocus
            className="resize-none rounded-xl border-[1.25px] border-secundario bg-tarjeta px-3 py-2.5 text-[15px] text-texto"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] text-secundario">
              {borrador.length} de {LARGO_NOTA}
            </p>
            <button
              type="button"
              onClick={() => {
                devolverFoco.current = true
                guardarNota()
              }}
              className="flex h-11 items-center justify-center rounded-[14px] border-[1.5px] border-primario px-4 text-[15px] font-semibold text-primario"
            >
              Listo
            </button>
          </div>
        </div>
      ) : observacion ? (
        <div className="flex items-center gap-2">
          <img src={iconoNota18} alt="" width={18} height={18} className="shrink-0" />
          <p className="min-w-0 flex-1 text-[13px] break-words text-texto">Nota para cocina: {observacion}</p>
          <button type="button" ref={botonNota} onClick={abrirNota} className={enlace}>
            <img src={iconoEditar} alt="" width={20} height={20} />
            Editar<span className="sr-only"> la nota de {producto.nombre}</span>
          </button>
        </div>
      ) : (
        <button type="button" ref={botonNota} onClick={abrirNota} className={`${enlace} w-fit`}>
          <img src={iconoNota} alt="" width={20} height={20} />
          Agregar nota para cocina<span className="sr-only"> de {producto.nombre}</span>
        </button>
      )}
    </li>
  )
}
