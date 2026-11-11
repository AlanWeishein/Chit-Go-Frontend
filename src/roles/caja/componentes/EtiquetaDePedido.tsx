import iconoAprobado from '../../../compartido/ui/iconos/check-blanco-14.svg'
import iconoCocinaClaro from '../../../compartido/ui/iconos/chef.svg'
import iconoCocinaOscuro from '../../../compartido/ui/iconos/chef-blanco-14.svg'
import iconoPrioridad from '../../../compartido/ui/iconos/flag-blanco.svg'

type Variante = 'prioridad' | 'aprobado' | 'enPreparacion' | 'enPreparacionOscura'

// Los chips de P-36. Informan, no se tocan. "En preparación" va clara en la tarjeta de la lista y oscura en el
// detalle, como en el Mockup; el relleno cambia con el fondo (la clara no tiene el 2 px de más a la derecha).
const VARIANTES: Record<Variante, { icono: string; texto: string; clases: string }> = {
  prioridad: { icono: iconoPrioridad, texto: 'Prioridad alta', clases: 'bg-primario pr-[9px] pl-[7px] text-texto-boton' },
  aprobado: { icono: iconoAprobado, texto: 'Aprobado', clases: 'bg-primario pr-[9px] pl-[7px] text-texto-boton' },
  enPreparacion: { icono: iconoCocinaClaro, texto: 'En preparación', clases: 'bg-linea px-[7px]' },
  enPreparacionOscura: {
    icono: iconoCocinaOscuro,
    texto: 'En preparación',
    clases: 'bg-primario pr-[9px] pl-[7px] text-texto-boton',
  },
}

export default function EtiquetaDePedido({ variante }: { variante: Variante }) {
  const { icono, texto, clases } = VARIANTES[variante]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md py-1 text-xs leading-[normal] font-medium whitespace-nowrap ${clases}`}
    >
      <img src={icono} alt="" />
      {texto}
    </span>
  )
}
