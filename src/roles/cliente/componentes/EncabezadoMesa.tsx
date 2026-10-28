// El encabezado de P-01 (iniciador) y P-01b (modo lectura). La marca va en Fraunces, como en los logins.
export default function EncabezadoMesa({ numero, esIniciador }: { numero: string; esIniciador: boolean }) {
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
        <p className="titulo shrink-0 pt-1.5 text-base text-texto">Chit&Go</p>
      </div>
    </header>
  )
}
