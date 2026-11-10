// Las cuentas por cobrar de Caja (P-09): la lista a la izquierda, en "Pidieron la cuenta" y "Abiertas", el detalle de
// la cuenta elegida en el medio y, después de cerrar, el ticket a la derecha. El cierre en dos pasos es el de Victoria:
// primero sin confirmar y, si el back pide confirmación (409 CONFIRMAR_CIERRE), con el diálogo de ConfirmarCierre.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  listarCuentasPorCobrar,
  cerrarCuenta,
  reimprimirTicket,
  type CuentaPorCobrar,
  type Ticket,
  type PedidoSinServir,
  type MotivoDeConfirmacion,
  type ConfirmacionDeCierre,
} from '../../../compartido/api/caja';
import { detalleDe, statusDe, textoDelError } from '../../../compartido/api/errores';
import iconoReloj from '../../../compartido/ui/iconos/clock.svg';
import iconoImpresora from '../../../compartido/ui/iconos/printer.svg';
import iconoReciboChico from '../../../compartido/ui/iconos/receipt-blanco-14.svg';
import iconoRecibo from '../../../compartido/ui/iconos/receipt-blanco.svg';
import { precio } from '../../cliente/formato';
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo';
import ConfirmarCierre from '../componentes/ConfirmarCierre';
import TarjetaDeCuenta from '../componentes/TarjetaDeCuenta';
import { VistaTicket } from '../componentes/VistaTicket';
import { useDatosCaja } from '../datosCaja';
import { horaDe } from '../espera';

const rotulo = 'text-[11px] leading-[normal] font-semibold tracking-[0.66px] text-secundario uppercase';

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario';

// El reloj del Mockup (P-09b) sale oscuro sobre el chip `primario` y no se lee. El SVG trae un solo color, así que se
// usa como máscara y el color lo pone el token (como los íconos del menú de MarcoCaja).
function IconoRelojBlanco() {
  const mascara = `url("${iconoReloj}") center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      className="size-3.5 shrink-0 bg-texto-boton"
      style={{ mask: mascara, WebkitMask: mascara }}
    />
  );
}

// "Solicitada" (la pidió el cliente) o "Abierta" (nadie la pidió). Informa, no se toca: sin borde.
function EtiquetaDeCuenta({ solicitada }: { solicitada: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primario py-1 pr-[9px] pl-[7px] text-xs leading-[normal] font-medium whitespace-nowrap text-texto-boton">
      {solicitada ? <img src={iconoReciboChico} alt="" /> : <IconoRelojBlanco />}
      {solicitada ? 'Solicitada' : 'Abierta'}
    </span>
  );
}

export const CierreCuentaPage: React.FC = () => {
  // La conexión en vivo es del marco (conexion.ts admite un solo useEnVivo a la vez). Cada evento de caja/pedidos
  // hace que el marco vuelva a pedir la cola y `recibidaEn` cambie: con eso se vuelven a pedir las cuentas.
  const { cola } = useDatosCaja();

  const [cuentas, setCuentas] = useState<CuentaPorCobrar[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [elegidaId, setElegidaId] = useState<number | null>(null);
  // Si salen dos pedidos de la lista seguidos, vale solo la respuesta del último: una vieja que llega tarde no pisa.
  const ultimoPedido = useRef(0);

  // Estado para el modal de confirmación en 2 pasos (409 CONFIRMAR_CIERRE)
  const [cuentaAConfirmar, setCuentaAConfirmar] = useState<CuentaPorCobrar | null>(null);
  const [pedidosAfectados, setPedidosAfectados] = useState<PedidoSinServir[]>([]);
  const [motivosConfirmacion, setMotivosConfirmacion] = useState<MotivoDeConfirmacion[]>([]);
  const [entroUnoNuevo, setEntroUnoNuevo] = useState<boolean>(false);
  const [procesandoCierre, setProcesandoCierre] = useState<boolean>(false);

  // El ticket emitido y la cuenta que se cerró, que ya no está en la lista: con su id se reimprime.
  const [ticketEmitido, setTicketEmitido] = useState<Ticket | null>(null);
  const [cuentaCerrada, setCuentaCerrada] = useState<CuentaPorCobrar | null>(null);
  const [reimprimiendo, setReimprimiendo] = useState<boolean>(false);

  // El recuadro de aviso arriba del detalle, cuando falla el cierre o reimprimir.
  const [avisoText, setAvisoText] = useState<string | null>(null);

  const cargarCuentas = useCallback(() => {
    const este = ++ultimoPedido.current;
    listarCuentasPorCobrar()
      .then((data) => {
        if (este !== ultimoPedido.current) return;
        setCuentas(data);
        setErrorText(null);
      })
      .catch((err) => {
        if (este === ultimoPedido.current) {
          setErrorText(textoDelError(err, 'Error al cargar las cuentas por cobrar.'));
        }
      })
      .finally(() => {
        // "Cargando" es solo hasta la primera respuesta: con el tiempo real, la lista no parpadea en cada evento.
        if (este === ultimoPedido.current) setCargando(false);
      });
  }, []);

  // Al entrar y cada vez que el marco recibe un evento de caja/pedidos.
  useEffect(() => {
    cargarCuentas();
  }, [cargarCuentas, cola.recibidaEn]);

  const cerrarDialogo = () => {
    setCuentaAConfirmar(null);
    setPedidosAfectados([]);
    setMotivosConfirmacion([]);
    setEntroUnoNuevo(false);
  };

  // Salió el ticket: se muestra a la derecha y la cuenta queda en el detalle, ya cerrada. La recarga de la lista
  // no lo saca, porque no depende de la lista.
  const alCerrar = (cuenta: CuentaPorCobrar, ticket: Ticket) => {
    cerrarDialogo();
    setCuentaCerrada(cuenta);
    setTicketEmitido(ticket);
    cargarCuentas();
  };

  // Un error que no es la confirmación. Con 404 o un 409 sin código (ya estaba cerrada, o chocó con otra operación),
  // la lista que se ve está vieja: se vuelve a pedir.
  const alFallarElCierre = (err: unknown) => {
    cerrarDialogo();
    setAvisoText(textoDelError(err, 'No se pudo cerrar la cuenta.'));
    const status = statusDe(err);
    if (status === 404 || (status === 409 && !detalleDe(err)?.codigo)) cargarCuentas();
  };

  const confirmacionDe = (err: unknown): ConfirmacionDeCierre | null => {
    const detalle = detalleDe(err);
    return statusDe(err) === 409 && detalle?.codigo === 'CONFIRMAR_CIERRE'
      ? (detalle as unknown as ConfirmacionDeCierre)
      : null;
  };

  // Intento de Cierre 1: Sin confirmación forzada
  const handleIntentarCerrar = async (cuenta: CuentaPorCobrar) => {
    setProcesandoCierre(true);
    setAvisoText(null);

    try {
      const ticket = await cerrarCuenta(cuenta.id);
      // Cierre directo exitoso
      alCerrar(cuenta, ticket);
    } catch (err) {
      // Manejo del Cierre en 2 Pasos (Error 409 CONFIRMAR_CIERRE).
      // El cuerpo del 409 viene en err.detalle (ApiError), no en err directo.
      const confirmacion = confirmacionDe(err);
      if (confirmacion) {
        setCuentaAConfirmar(cuenta);
        setMotivosConfirmacion(confirmacion.motivos ?? []);
        setPedidosAfectados(confirmacion.pedidosSinServir ?? []);
        setEntroUnoNuevo(false);
      } else {
        alFallarElCierre(err);
      }
    } finally {
      setProcesandoCierre(false);
    }
  };

  // Intento de Cierre 2: Confirmación del Cajero con cancelación automática
  const handleConfirmarCierreForzado = async () => {
    if (!cuentaAConfirmar) return;

    setProcesandoCierre(true);
    const idsACancelar = pedidosAfectados.map((p) => p.id);

    try {
      const ticket = await cerrarCuenta(cuentaAConfirmar.id, { pedidosACancelar: idsACancelar });
      alCerrar(cuentaAConfirmar, ticket);
    } catch (err) {
      // Si entró otro pedido en el medio, el back vuelve a pedir confirmación con la lista nueva.
      const confirmacion = confirmacionDe(err);
      if (confirmacion) {
        const nuevos = confirmacion.pedidosSinServir ?? [];
        setMotivosConfirmacion(confirmacion.motivos ?? []);
        setPedidosAfectados(nuevos);
        setEntroUnoNuevo(nuevos.some((p) => !idsACancelar.includes(p.id)));
      } else {
        alFallarElCierre(err);
      }
    } finally {
      setProcesandoCierre(false);
    }
  };

  // El mismo ticket del cierre, pedido de nuevo al back.
  const handleReimprimir = async () => {
    if (!cuentaCerrada) return;
    setReimprimiendo(true);
    setAvisoText(null);
    try {
      setTicketEmitido(await reimprimirTicket(cuentaCerrada.id));
    } catch (err) {
      setAvisoText(textoDelError(err, 'No se pudo traer el ticket.'));
    } finally {
      setReimprimiendo(false);
    }
  };

  // "Listo", o tocar otra cuenta: se deja de mostrar la cerrada y se vuelve a la lista.
  const volverALaLista = () => {
    setTicketEmitido(null);
    setCuentaCerrada(null);
    setAvisoText(null);
  };

  const elegir = (id: number) => {
    volverALaLista();
    setElegidaId(id);
  };

  // La lista que devuelve el back ya viene con las Solicitadas primero; se separa acá para dibujar los dos grupos.
  const solicitadas = cuentas.filter((c) => c.estado === 'SOLICITADA');
  const abiertas = cuentas.filter((c) => c.estado === 'ABIERTA');
  // Al entrar va la primera. Si la elegida ya no está en la lista (se cerró, o la cerró otra caja), también.
  const elegida = [...solicitadas, ...abiertas].find((c) => c.id === elegidaId) ?? solicitadas[0] ?? abiertas[0];
  const cerrada = cuentaCerrada && ticketEmitido ? { cuenta: cuentaCerrada, ticket: ticketEmitido } : null;
  const hayAlgo = elegida !== undefined || cerrada !== null;

  const tarjetas = (lista: CuentaPorCobrar[]) =>
    lista.map((c) => (
      <TarjetaDeCuenta
        key={c.id}
        cuenta={c}
        seleccionada={!cerrada && c.id === elegida?.id}
        alElegir={() => elegir(c.id)}
      />
    ));

  return (
    <div className="flex min-h-full flex-col gap-4 px-6 pt-6 pb-4">
      <header className="flex min-h-12 items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 leading-[normal]">
          <h1 className="titulo text-[25px]">Cuentas</h1>
          {!cargando && !errorText && hayAlgo && (
            <p className="text-[13px] text-secundario">
              {solicitadas.length} pidieron la cuenta · {abiertas.length} {abiertas.length === 1 ? 'abierta' : 'abiertas'}
            </p>
          )}
        </div>
      </header>

      {cargando ? (
        <p className="py-10 text-center text-secundario">Cargando las cuentas…</p>
      ) : errorText ? (
        <div className="py-10 text-center">
          <p role="alert">{errorText}</p>
          <button
            type="button"
            onClick={cargarCuentas}
            className={`mt-4 h-11 rounded-[14px] border-[1.5px] border-primario px-[18px] text-[15px] font-semibold text-primario ${foco}`}
          >
            Probá de nuevo
          </button>
        </div>
      ) : !hayAlgo ? (
        <p className="py-10 text-center text-secundario">No hay cuentas abiertas.</p>
      ) : (
        <div className="flex items-start gap-[14px]">
          <div className="flex w-[196px] shrink-0 flex-col gap-2">
            {solicitadas.length > 0 && (
              <>
                <p className={rotulo}>Pidieron la cuenta</p>
                {tarjetas(solicitadas)}
              </>
            )}
            {abiertas.length > 0 && (
              <>
                <p className={rotulo}>Abiertas</p>
                {tarjetas(abiertas)}
              </>
            )}
            {!elegida && <p className="text-[13px] leading-[normal] text-secundario">No hay cuentas abiertas.</p>}
          </div>

          <section aria-label="Cuenta elegida" className="flex min-w-0 flex-1 flex-col gap-3 pl-[14px]">
            {avisoText && <AvisoDeFallo>{avisoText}</AvisoDeFallo>}

            {cerrada ? (
              <>
                <div className="leading-[normal]">
                  <h2 className="titulo text-xl leading-[normal]">Mesa {cerrada.cuenta.mesa}</h2>
                  <p className="text-[13px] leading-[normal] text-secundario">
                    Cuenta cerrada · ticket N.º {cerrada.ticket.numero}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 leading-[normal]">
                  <p className="text-base leading-[normal] font-semibold">Total</p>
                  <p className="titulo text-[30px] leading-[normal]">{precio(cerrada.ticket.total)}</p>
                </div>

                <button
                  type="button"
                  onClick={handleReimprimir}
                  disabled={reimprimiendo}
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border-[1.25px] border-dashed border-secundario px-[18px] text-[15px] font-semibold text-secundario disabled:opacity-[.38] ${foco}`}
                >
                  <img src={iconoImpresora} alt="" width={20} height={20} />
                  {reimprimiendo ? 'Trayendo el ticket…' : 'Reimprimir ticket'}
                </button>
              </>
            ) : elegida ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="leading-[normal]">
                    <h2 className="titulo text-xl leading-[normal]">Mesa {elegida.mesa}</h2>
                    <p className="text-[13px] leading-[normal] text-secundario">
                      {elegida.solicitadaEn
                        ? `Pidió la cuenta ${horaDe(elegida.solicitadaEn)}`
                        : 'Cuenta abierta · nadie la pidió'}
                    </p>
                  </div>
                  <EtiquetaDeCuenta solicitada={elegida.estado === 'SOLICITADA'} />
                </div>

                {/* El total incluye lo que todavía no se sirvió: por eso no se llama "a cobrar". */}
                <div className="flex items-center justify-between gap-3 leading-[normal]">
                  <p className="text-base leading-[normal] font-semibold">Total</p>
                  <p className="titulo text-[30px] leading-[normal]">{precio(elegida.total)}</p>
                </div>

                {elegida.pedidosSinServir > 0 && (
                  <AvisoDeFallo
                    titulo={`Hay ${elegida.pedidosSinServir} ${elegida.pedidosSinServir === 1 ? 'pedido' : 'pedidos'} sin servir.`}
                  >
                    Si cerrás ahora, se cancelan y el ticket sale por menos de este total.
                  </AvisoDeFallo>
                )}

                <p className="text-[13px] leading-[normal] text-secundario">
                  Sin propina, descuentos ni división de cuenta. No se registra el medio de pago.
                </p>

                <button
                  type="button"
                  onClick={() => handleIntentarCerrar(elegida)}
                  disabled={procesandoCierre}
                  className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px] text-[15px] font-semibold text-texto-boton disabled:opacity-[.38] ${foco}`}
                >
                  <img src={iconoRecibo} alt="" />
                  Cerrar cuenta y emitir ticket
                </button>
              </>
            ) : null}
          </section>

          {/* La vista previa del Mockup: el ticket lo arma el back al cerrar, así que antes de cerrar no va. */}
          {cerrada && (
            <section aria-label="Ticket" className="flex w-[176px] shrink-0 flex-col gap-2">
              <p className={rotulo}>Vista previa del ticket</p>
              <VistaTicket ticket={cerrada.ticket} onCerrar={volverALaLista} />
            </section>
          )}
        </div>
      )}

      {cuentaAConfirmar && (
        <ConfirmarCierre
          mesa={cuentaAConfirmar.mesa}
          total={cuentaAConfirmar.total}
          motivos={motivosConfirmacion}
          pedidos={pedidosAfectados}
          entroUnoNuevo={entroUnoNuevo}
          cerrando={procesandoCierre}
          alConfirmar={handleConfirmarCierreForzado}
          alVolver={cerrarDialogo}
        />
      )}
    </div>
  );
};
