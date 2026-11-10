// Las cuentas por cobrar de Caja (P-09): la lista a la izquierda, en "Pidieron la cuenta" y "Abiertas", y el detalle de
// la cuenta elegida a la derecha. La lógica del cierre en dos pasos y el modal son de Victoria y siguen como estaban:
// el cierre, el ticket y reimprimir son la tarea 2 de la ST-15.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  listarCuentasPorCobrar,
  cerrarCuenta,
  type CuentaPorCobrar,
  type Ticket,
  type PedidoSinServir,
  type MotivoDeConfirmacion,
  type ConfirmacionDeCierre,
} from '../../../compartido/api/caja';
import { detalleDe, statusDe, textoDelError } from '../../../compartido/api/errores';
import iconoReloj from '../../../compartido/ui/iconos/clock.svg';
import iconoReciboChico from '../../../compartido/ui/iconos/receipt-blanco-14.svg';
import iconoRecibo from '../../../compartido/ui/iconos/receipt-blanco.svg';
import { precio } from '../../cliente/formato';
import AvisoDeFallo from '../../acceso/componentes/AvisoDeFallo';
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
  const [procesandoCierre, setProcesandoCierre] = useState<boolean>(false);

  // Estado para mostrar el Ticket emitido
  const [ticketEmitido, setTicketEmitido] = useState<Ticket | null>(null);

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

  // Intento de Cierre 1: Sin confirmación forzada
  const handleIntentarCerrar = async (cuenta: CuentaPorCobrar) => {
    setProcesandoCierre(true);
    setErrorText(null);

    try {
      const ticket = await cerrarCuenta(cuenta.id);
      // Cierre directo exitoso
      setTicketEmitido(ticket);
      cargarCuentas();
    } catch (err) {
      // Manejo del Cierre en 2 Pasos (Error 409 CONFIRMAR_CIERRE).
      // El cuerpo del 409 viene en err.detalle (ApiError), no en err directo.
      const detalle = detalleDe(err);
      if (statusDe(err) === 409 && detalle?.codigo === 'CONFIRMAR_CIERRE') {
        const confirmacion = detalle as unknown as ConfirmacionDeCierre;
        setCuentaAConfirmar(cuenta);
        setMotivosConfirmacion(confirmacion.motivos ?? []);
        setPedidosAfectados(confirmacion.pedidosSinServir ?? []);
      } else {
        alert(textoDelError(err, 'No se pudo cerrar la cuenta.'));
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

      setTicketEmitido(ticket);
      setCuentaAConfirmar(null);
      setPedidosAfectados([]);
      setMotivosConfirmacion([]);
      cargarCuentas();
    } catch (err) {
      alert(textoDelError(err, 'Error al confirmar el cierre de la cuenta.'));
    } finally {
      setProcesandoCierre(false);
    }
  };

  // Si se generó un ticket, mostramos la Vista de Impresión
  if (ticketEmitido) {
    return (
      <div className="p-6">
        <VistaTicket
          ticket={ticketEmitido}
          onCerrar={() => setTicketEmitido(null)}
        />
      </div>
    );
  }

  // La lista que devuelve el back ya viene con las Solicitadas primero; se separa acá para dibujar los dos grupos.
  const solicitadas = cuentas.filter((c) => c.estado === 'SOLICITADA');
  const abiertas = cuentas.filter((c) => c.estado === 'ABIERTA');
  // Al entrar va la primera. Si la elegida ya no está en la lista (se cerró, o la cerró otra caja), también.
  const elegida = [...solicitadas, ...abiertas].find((c) => c.id === elegidaId) ?? solicitadas[0] ?? abiertas[0];
  const hayCuentas = !cargando && !errorText && elegida !== undefined;

  const tarjetas = (lista: CuentaPorCobrar[]) =>
    lista.map((c) => (
      <TarjetaDeCuenta
        key={c.id}
        cuenta={c}
        seleccionada={c.id === elegida?.id}
        alElegir={() => setElegidaId(c.id)}
      />
    ));

  return (
    <div className="flex min-h-full flex-col gap-4 px-6 pt-6 pb-4">
      <header className="flex min-h-12 items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 leading-[normal]">
          <h1 className="titulo text-[25px]">Cuentas</h1>
          {hayCuentas && (
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
      ) : !elegida ? (
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
          </div>

          <section aria-label="Cuenta elegida" className="flex min-w-0 flex-1 flex-col gap-3 pl-[14px]">
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
          </section>
        </div>
      )}

      {/* Modal de Confirmación en 2 Pasos (Error 409 CONFIRMAR_CIERRE) */}
      {cuentaAConfirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-tarjeta p-6 shadow-xl border border-linea">
            <h3 className="text-lg font-bold font-serif text-red-700 mb-2">
              ⚠️ Confirmación de Cierre requerida
            </h3>

            <p className="text-sm text-texto mb-4 leading-relaxed">
              La <strong>Mesa #{cuentaAConfirmar.mesa}</strong> requiere confirmación del cajero antes de realizar el cobro debido a los siguientes motivos:
            </p>

            <ul className="mb-4 list-disc list-inside text-xs text-red-800 space-y-1 bg-red-50 p-3 rounded-xl border border-red-200">
              {motivosConfirmacion.includes('NADIE_PIDIO_LA_CUENTA') && (
                <li>Esta cuenta no fue solicitada por el cliente.</li>
              )}
              {motivosConfirmacion.includes('PEDIDOS_SIN_SERVIR') && (
                <li>Existen pedidos sin servir en cocina/salon que serán cancelados.</li>
              )}
            </ul>

            {pedidosAfectados.length > 0 && (
              <div className="mb-5 max-h-40 overflow-y-auto rounded-xl border border-linea p-3 text-xs bg-fondo">
                <p className="font-bold text-secundario mb-2">Pedidos no servidos que se cancelarán:</p>
                {pedidosAfectados.map((p) => (
                  <div key={p.id} className="mb-2 pb-2 border-b border-linea/60 last:border-none last:mb-0 last:pb-0">
                    <p className="font-semibold text-texto">Pedido #{p.id} - Estado: <span className="uppercase text-amber-800">{p.estado}</span></p>
                    <ul className="pl-3 text-secundario list-square">
                      {p.platos.map((item, idx) => (
                        <li key={idx}>{item.cantidad}x {item.plato}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCuentaAConfirmar(null)}
                className="flex-1 rounded-xl border border-linea bg-tarjeta py-2.5 text-sm font-semibold text-texto hover:bg-fondo transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarCierreForzado}
                disabled={procesandoCierre}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white py-2.5 text-sm font-semibold transition-colors shadow-sm"
              >
                {procesandoCierre ? 'Procesando...' : 'Confirmar y Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
