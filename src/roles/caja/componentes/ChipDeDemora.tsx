import iconoAlerta from '../../../compartido/ui/iconos/alert-blanco.svg'

// El chip oscuro de un pedido que pasó los 3 minutos (HU-08): "+3 min" en la tarjeta y "Espera +3 min" en el
// detalle. Quién está demorado lo decide el back (`demorado`); acá solo se dibuja.
export default function ChipDeDemora({ texto }: { texto: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primario py-1 pr-[9px] pl-[7px] text-xs leading-[normal] font-medium whitespace-nowrap text-texto-boton">
      <img src={iconoAlerta} alt="" />
      {texto}
    </span>
  )
}
