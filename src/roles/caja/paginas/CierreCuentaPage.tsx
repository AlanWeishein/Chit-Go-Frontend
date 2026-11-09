import React, { useEffect, useState } from 'react';
import { CuentaPorCobrar, TicketResponse, PedidoSinServirDetalle } from '../../../compartido/tipos/caja';
import { obtenerCuentasPorCobrar, cerrarCuentaCaja } from '../../../compartido/api/caja';
import { VistaTicket } from '../componentes/VistaTicket';

export const CierreCuentaPage: React.FC = () => {
  const [cuentas, setCuentas] = useState<CuentaPorCobrar[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Estado para el modal de confirmación en 2 pasos (409 CONFIRMAR_CIERRE)
  const [cuentaAConfirmar, setCuentaAConfirmar] = useState<CuentaPorCobrar | null>(null);
  const [pedidosAfectados, setPedidosAfectados] = useState<PedidoSinServirDetalle[]>([]);
  const [motivosConfirmacion, setMotivosConfirmacion] = useState<string[]>([]);
  const [procesandoCierre, setProcesandoCierre] = useState<boolean>(false);

  // Estado para mostrar el Ticket emitido
  const [ticketEmitido, setTicketEmitido] = useState<TicketResponse | null>(null);

  // Cargar cuentas por cobrar al montar la pantalla
  const cargarCuentas = async () => {
    setCargando(true);
    setErrorText(null);
    try {
      const data = await obtenerCuentasPorCobrar();
      setCuentas(data);
    } catch (err: any) {
      setErrorText(err?.detail || 'Error al cargar las cuentas por cobrar.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  // Intento de Cierre 1: Sin confirmación forzada
  const handleIntentarCerrar = async (cuenta: CuentaPorCobrar) => {
    setProcesandoCierre(true);
    setErrorText(null);

    try {
      const ticket = await cerrarCuentaCaja(cuenta.id);
      // Cierre directo exitoso
      setTicketEmitido(ticket);
      cargarCuentas();
    } catch (err: any) {
      // Manejo del Cierre en 2 Pasos (Error 409 CONFIRMAR_CIERRE)
      if (err?.status === 409 && err?.codigo === 'CONFIRMAR_CIERRE') {
        setCuentaAConfirmar(cuenta);
        setMotivosConfirmacion(err?.motivos || []);
        setPedidosAfectados(err?.pedidosSinServir || []);
      } else {
        alert(err?.detail || 'No se pudo cerrar la cuenta.');
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
      const ticket = await cerrarCuentaCaja(cuentaAConfirmar.id, {
        confirmar: true,
        pedidosACancelar: idsACancelar,
      });

      setTicketEmitido(ticket);
      setCuentaAConfirmar(null);
      setPedidosAfectados([]);
      setMotivosConfirmacion([]);
      cargarCuentas();
    } catch (err: any) {
      alert(err?.detail || 'Error al confirmar el cierre de la cuenta.');
    } finally {
      setProcesandoCierre(false);
    }
  };

  // Si se generó un ticket, mostramos la Vista de Impresión
  if (ticketEmitido) {
    return (
      <div className="min-h-screen bg-fondo p-6">
        <VistaTicket
          ticket={ticketEmitido}
          onCerrar={() => setTicketEmitido(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondo p-6 font-sans text-texto">
      {/* Encabezado */}
      <div className="mx-auto max-w-5xl mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-primario">Cuentas por Cobrar (P-09)</h1>
          <p className="text-sm text-secundario">Gestión de cierres de cuenta y emisión de tickets de cobro.</p>
        </div>
        <button
          type="button"
          onClick={cargarCuentas}
          className="rounded-xl border border-linea bg-tarjeta px-4 py-2 text-sm font-semibold text-texto hover:bg-white shadow-sm transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      {errorText && (
        <div className="mx-auto max-w-5xl mb-4 rounded-xl bg-red-100 p-4 text-sm font-semibold text-red-800 border border-red-200">
          {errorText}
        </div>
      )}

      {/* Grilla / Listado de Cuentas */}
      <div className="mx-auto max-w-5xl">
        {cargando ? (
          <div className="text-center py-12 text-secundario font-medium">Cargando cuentas por cobrar...</div>
        ) : cuentas.length === 0 ? (
          <div className="rounded-2xl border border-linea bg-tarjeta p-12 text-center text-secundario shadow-sm">
            No hay cuentas abiertas ni solicitadas en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cuentas.map((cuenta) => {
              const esSolicitada = cuenta.estado === 'SOLICITADA';
              const tienePendientes = cuenta.pedidosSinServir > 0;

              return (
                <div
                  key={cuenta.id}
                  className={`rounded-2xl border p-5 bg-tarjeta shadow-sm flex flex-col justify-between transition-all ${
                    esSolicitada ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-linea'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold font-serif text-primario">
                        Mesa #{cuenta.mesa}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          esSolicitada
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {cuenta.estado}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-secundario mb-4">
                      <p>Apertura: {new Date(cuenta.abiertaEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs</p>
                      {cuenta.solicitadaEn && (
                        <p className="text-amber-800 font-medium">
                          Solicitada: {new Date(cuenta.solicitadaEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                        </p>
                      )}
                      {tienePendientes && (
                        <p className="text-red-600 font-semibold flex items-center gap-1">
                          ⚠️ Pedidos sin servir: {cuenta.pedidosSinServir}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between border-t border-linea pt-3 mb-4">
                      <span className="text-xs font-semibold text-secundario">Total a cobrar:</span>
                      <span className="text-lg font-bold text-primario">${cuenta.total.toLocaleString()}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleIntentarCerrar(cuenta)}
                      disabled={procesandoCierre}
                      className="w-full rounded-xl bg-primario hover:bg-[#38241d] disabled:bg-stone-300 text-texto-boton text-sm font-semibold py-3 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      💰 Cerrar Cuenta y Cobrar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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