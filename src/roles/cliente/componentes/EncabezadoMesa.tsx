import { Link } from 'react-router-dom'

// El encabezado de P-01 (iniciador) y P-01b (modo lectura). La marca va en Fraunces, como en los logins.
// Con rutaCuenta (el iniciador ya mandó pedidos), debajo de la marca va "Mi cuenta", que lleva a P-03
// también cuando el carrito tiene platos y la barra muestra "Ver mi pedido".
export default function EncabezadoMesa({
  numero,
  esIniciador,
  rutaCuenta,
}: {
  numero: string
  esIniciador: boolean
  rutaCuenta?: string
}) {
  return (
    <header className="flex flex-col gap-1 px-6 pt-4 pb-3.5">
      <p className="text-[13px] font-medium text-secundario">Mesa {numero}</p>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <h1 className="titulo text-[30px] text-texto">
            {esIniciador ? '¿Con qué arrancamos?' : 'Mirá el menú con calma'}
          </h1>
          <p className="text-[13px] text-secundario">
            {esIniciador
              ? 'La cuenta la abriste vos: podés pedir'
              : 'Solo lectura · esta mesa ya tiene una cuenta abierta'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <p className="titulo pt-1.5 text-base text-texto">Chit&Go</p>
          {rutaCuenta !== undefined && (
            <Link to={rutaCuenta} className="flex h-11 items-center text-[13px] font-semibold text-primario underline">
              Mi cuenta
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
