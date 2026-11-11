import iconoAlerta from '../../../compartido/ui/iconos/alert.svg'

// El error de un campo, debajo de él y con el ícono, como en el Mockup de P-14b: 16 px, sin rojo. El campo lo
// enlaza con aria-describedby. alert.svg es de 20 px y se dibuja a 16 igual que los demás íconos de dos tamaños.
export default function ErrorDeCampo({ id, children }: { id: string; children: string }) {
  return (
    <div id={id} role="alert" className="flex items-center gap-1.5">
      <img src={iconoAlerta} alt="" width={16} height={16} className="shrink-0" />
      <p className="text-[13px] leading-[normal] font-semibold">{children}</p>
    </div>
  )
}
