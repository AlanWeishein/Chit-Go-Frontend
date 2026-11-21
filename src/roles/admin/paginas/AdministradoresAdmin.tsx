import { useEffect, useRef, useState } from 'react'
import {
  cambiarActivoDeAdmin,
  desbloquearAdmin,
  listarAdmins,
  type Admin,
} from '../../../compartido/api/gerente'
import { statusDe, textoDelError } from '../../../compartido/api/errores'
import iconoBaja from '../../../compartido/ui/iconos/ban-20.svg'
import iconoDadoDeBaja from '../../../compartido/ui/iconos/ban.svg'
import iconoActivo from '../../../compartido/ui/iconos/check-14.svg'
import iconoInfo from '../../../compartido/ui/iconos/info.svg'
import iconoBloqueado from '../../../compartido/ui/iconos/lock.svg'
import iconoReactivar from '../../../compartido/ui/iconos/refresh.svg'
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo'
import DialogoDeConfirmacion from '../componentes/DialogoDeConfirmacion'
import FormularioDeAdmin from '../componentes/FormularioDeAdmin'

// `vez` cambia siempre: dos avisos iguales seguidos vuelven a contar los 5 segundos.
interface Aviso {
  texto: string
  error: boolean
  vez: number
}

// Lo que se confirma en el <dialog>: la baja y la reactivación. Desbloquear va directo.
interface AConfirmar {
  admin: Admin
  activo: boolean
}

const rotulo = 'text-[11px] leading-[normal] font-semibold tracking-[0.66px] text-secundario uppercase'
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'
const botonContorno = `flex h-11 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario ${foco}`
const botonDeFila = `flex h-11 items-center gap-2 rounded-[14px] text-[15px] font-semibold whitespace-nowrap underline disabled:opacity-[.38] ${foco}`

// El estado sale de AdminDto. Dado de baja va primero: un Admin dado de baja no se desbloquea (409). El back no
// manda el género, así que va "Activo" (del Admin) y no "Activa" como algunas filas del Mockup.
function Estado({ admin }: { admin: Admin }) {
  const [icono, texto] = !admin.activo
    ? [iconoDadoDeBaja, 'Dado de baja']
    : admin.bloqueado
      ? [iconoBloqueado, 'Bloqueado']
      : [iconoActivo, 'Activo']
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-linea py-1 pr-[9px] pl-[7px] text-xs leading-[normal] font-medium whitespace-nowrap">
      <img src={icono} alt="" width={14} height={14} />
      {texto}
    </span>
  )
}

// P-19, los Admins del local (HU-16). Solo la ve el Gerente/Dueño (SoloPara en App.tsx); el back responde 403 a
// cualquier otro rol (CP-31-05). La lista y el alta van en la misma pantalla, como el Mockup.
export default function AdministradoresAdmin() {
  const [admins, setAdmins] = useState<Admin[] | null>(null)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [aConfirmar, setAConfirmar] = useState<AConfirmar | null>(null)
  const [enviandoId, setEnviandoId] = useState<number | null>(null)

  const ultimoPedido = useRef(0) // vale solo la última respuesta
  const hayDatos = useRef(false)
  const enviandoRef = useRef(false) // el estado llega un render tarde: la ref corta el doble toque
  const vez = useRef(0)

  function avisar(texto: string, error = false) {
    setAviso({ texto, error, vez: ++vez.current })
  }

  function cargar() {
    const numero = ++ultimoPedido.current
    listarAdmins()
      .then((lista) => {
        if (numero !== ultimoPedido.current) return
        hayDatos.current = true
        setAdmins(lista)
        setErrorLista(null)
      })
      .catch((err) => {
        if (numero !== ultimoPedido.current) return
        // Con la lista en pantalla, el fallo va al aviso y la lista se queda.
        if (hayDatos.current) avisar(textoDelError(err), true)
        else setErrorLista(textoDelError(err))
      })
  }

  useEffect(() => {
    cargar()
  }, [])

  // El aviso se va solo a los 5 segundos.
  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(id)
  }, [aviso])

  async function accionar(admin: Admin, llamada: () => Promise<unknown>, textoOk: string) {
    if (enviandoRef.current) return
    enviandoRef.current = true
    setEnviandoId(admin.id)
    try {
      await llamada()
      avisar(textoOk)
      cargar()
    } catch (err) {
      avisar(textoDelError(err), true)
      const status = statusDe(err)
      if (status === 404 || status === 409) cargar() // la lista que se ve puede estar vieja
    } finally {
      enviandoRef.current = false
      setEnviandoId(null)
      setAConfirmar(null)
    }
  }

  function alCrear(nombre: string) {
    avisar(`Se creó el Admin ${nombre}.`)
    cargar()
  }

  const todos = admins ?? []

  return (
    <section className="flex min-h-full flex-col gap-[18px] bg-fondo px-8 pt-7 pb-6 font-inter text-texto">
      <header className="flex flex-col gap-0.5 leading-[normal]">
        <h1 className="titulo text-[25px]">Administradores</h1>
        <p className="text-[13px] text-secundario">Solo el Gerente/Dueño puede crear o dar de baja Admins</p>
      </header>

      <div className="flex items-start gap-3 rounded-[14px] bg-linea p-[14px]">
        <img src={iconoInfo} alt="" width={20} height={20} className="shrink-0" />
        <p className="text-[13px] leading-[normal]">
          Chit&Go (el proveedor) da de alta al Gerente/Dueño del local. Desde acá, el Gerente crea los Admins que lo
          ayudan. Todos entran con email y contraseña.
        </p>
      </div>

      {aviso &&
        (aviso.error ? (
          <AvisoDeFallo key={aviso.vez}>{aviso.texto}</AvisoDeFallo>
        ) : (
          <p
            key={aviso.vez}
            role="status"
            className="rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3 text-[15px] font-semibold"
          >
            {aviso.texto}
          </p>
        ))}

      <div className="flex items-start gap-5">
        <div className="min-w-0 flex-1">
          {admins === null && !errorLista ? (
            <p className="py-10 text-center text-secundario">Cargando los Admins…</p>
          ) : admins === null ? (
            <div className="py-10 text-center">
              <p role="alert">{errorLista}</p>
              <button type="button" onClick={cargar} className={`mx-auto mt-4 ${botonContorno}`}>
                Probá de nuevo
              </button>
            </div>
          ) : todos.length === 0 ? (
            <p className="py-10 text-center text-secundario">Todavía no hay Admins. Creá el primero con el formulario.</p>
          ) : (
            <table className="w-full table-fixed border-collapse text-left text-[13px] leading-[normal]">
              <thead>
                <tr className={`h-[34px] border-b border-linea ${rotulo}`}>
                  <th className="px-2.5 font-semibold">Nombre</th>
                  <th className="w-[124px] px-2.5 font-semibold">Estado</th>
                  <th className="w-[136px] px-2.5">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {todos.map((a) => {
                  const enviando = enviandoId === a.id
                  return (
                    <tr key={a.id} className="h-[60px] not-first:border-t not-first:border-linea">
                      <td className="px-2.5">
                        <p className="truncate font-medium">{a.nombre}</p>
                        <p className="truncate text-secundario">{a.email}</p>
                      </td>
                      <td className="px-2.5">
                        <Estado admin={a} />
                      </td>
                      <td className="px-2.5 py-2">
                        <div className="flex flex-col items-start">
                          {a.activo && a.bloqueado && (
                            <button
                              type="button"
                              disabled={enviandoId !== null}
                              onClick={() => accionar(a, () => desbloquearAdmin(a.id), `Se desbloqueó a ${a.nombre}.`)}
                              aria-label={`Desbloquear a ${a.nombre}`}
                              className={botonDeFila}
                            >
                              <img src={iconoBloqueado} alt="" width={20} height={20} />
                              {enviando ? 'Un momento…' : 'Desbloquear'}
                            </button>
                          )}
                          {a.activo ? (
                            <button
                              type="button"
                              disabled={enviandoId !== null}
                              onClick={() => setAConfirmar({ admin: a, activo: false })}
                              aria-label={`Dar de baja a ${a.nombre}`}
                              className={botonDeFila}
                            >
                              <img src={iconoBaja} alt="" width={20} height={20} />
                              Dar de baja
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={enviandoId !== null}
                              onClick={() => setAConfirmar({ admin: a, activo: true })}
                              aria-label={`Reactivar a ${a.nombre}`}
                              className={botonDeFila}
                            >
                              <img src={iconoReactivar} alt="" width={20} height={20} />
                              Reactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <FormularioDeAdmin alCrear={alCrear} />
      </div>

      {aConfirmar && (
        <DialogoDeConfirmacion
          key={`${aConfirmar.admin.id}-${aConfirmar.activo}`}
          titulo={
            aConfirmar.activo ? `¿Reactivar a ${aConfirmar.admin.nombre}?` : `¿Dar de baja a ${aConfirmar.admin.nombre}?`
          }
          texto={
            aConfirmar.activo
              ? 'Vuelve a entrar con su email y su contraseña.'
              : 'Ya no va a poder entrar. Su historial queda, y lo podés reactivar cuando quieras.'
          }
          textoConfirmar={aConfirmar.activo ? 'Sí, reactivar' : 'Sí, dar de baja'}
          enviando={enviandoId !== null}
          alVolver={() => setAConfirmar(null)}
          alConfirmar={() => {
            const { admin, activo } = aConfirmar
            accionar(
              admin,
              () => cambiarActivoDeAdmin(admin.id, activo),
              activo ? `Se reactivó a ${admin.nombre}.` : `Se dio de baja a ${admin.nombre}.`,
            )
          }}
        />
      )}
    </section>
  )
}
