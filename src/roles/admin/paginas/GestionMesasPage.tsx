import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MesaAdmin, GuardarMesaPayload } from '../../../compartido/tipos/mesas';
import {
  obtenerMesasAdmin,
  crearMesaAdmin,
  actualizarMesaAdmin,
  cambiarHabilitacionMesa,
  regenerarQrMesa,
} from '../../../compartido/api/mesas';

export const GestionMesasPage: React.FC = () => {
  const [mesas, setMesas] = useState<MesaAdmin[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // Estado Modal Alta / Edición de Mesa
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [mesaEditando, setMesaEditando] = useState<MesaAdmin | null>(null);
  const [formMesa, setFormMesa] = useState<GuardarMesaPayload>({
    numero: '',
    capacidad: 4,
  });
  const [guardandoMesa, setGuardandoMesa] = useState<boolean>(false);

  // Estado Modal QR / Impresión
  const [mesaQrSeleccionada, setMesaQrSeleccionada] = useState<MesaAdmin | null>(null);
  const [regenerandoQr, setRegenerandoQr] = useState<boolean>(false);

  const cargarMesas = async () => {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const data = await obtenerMesasAdmin();
      setMesas(data);
    } catch (err: any) {
      setErrorGeneral(err?.detail || 'No se pudieron cargar las mesas del local.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMesas();
  }, []);

  // Abrir modal para crear o editar
  const handleAbrirModalForm = (mesa?: MesaAdmin) => {
    if (mesa) {
      setMesaEditando(mesa);
      setFormMesa({
        numero: mesa.numero,
        capacidad: mesa.capacidad ?? 4,
      });
    } else {
      setMesaEditando(null);
      setFormMesa({
        numero: '',
        capacidad: 4,
      });
    }
    setModalFormAbierto(true);
  };

  const handleGuardarMesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMesa.numero.trim()) {
      alert('Ingresá un número o identificador para la mesa.');
      return;
    }

    setGuardandoMesa(true);
    try {
      const payload: GuardarMesaPayload = {
        numero: formMesa.numero.trim(),
        capacidad: formMesa.capacidad && formMesa.capacidad > 0 ? formMesa.capacidad : undefined,
      };

      if (mesaEditando) {
        await actualizarMesaAdmin(mesaEditando.id, payload);
      } else {
        await crearMesaAdmin(payload);
      }
      setModalFormAbierto(false);
      await cargarMesas();
    } catch (err: any) {
      alert(err?.detail || 'No se pudo guardar la mesa.');
    } finally {
      setGuardandoMesa(false);
    }
  };

  // Habilitar / Inhabilitar mesa
  const handleToggleHabilitacion = async (mesa: MesaAdmin) => {
    const nuevoEstado = !mesa.habilitada;
    const mensajeConfirm = nuevoEstado
      ? `¿Habilitar la Mesa ${mesa.numero} para recibir clientes?`
      : `¿Inhabilitar la Mesa ${mesa.numero}? Los clientes no podrán iniciar sesión escaneando su QR.`;

    if (!window.confirm(mensajeConfirm)) return;

    try {
      await cambiarHabilitacionMesa(mesa.id, nuevoEstado);
      await cargarMesas();
    } catch (err: any) {
      alert(err?.detail || 'No se pudo cambiar el estado de la mesa.');
    }
  };

  // Regenerar Token QR
  const handleRegenerarQr = async () => {
    if (!mesaQrSeleccionada) return;
    if (
      !window.confirm(
        `¿Regenerar el código QR de la Mesa ${mesaQrSeleccionada.numero}? El QR impreso actualmente dejará de funcionar de inmediato.`
      )
    ) {
      return;
    }

    setRegenerandoQr(true);
    try {
      const mesaActualizada = await regenerarQrMesa(mesaQrSeleccionada.id);
      setMesaQrSeleccionada(mesaActualizada);
      setMesas((prev) =>
        prev.map((m) => (m.id === mesaActualizada.id ? mesaActualizada : m))
      );
    } catch (err: any) {
      alert(err?.detail || 'No se pudo regenerar el token QR.');
    } finally {
      setRegenerandoQr(false);
    }
  };

  const construirUrlQr = (tokenQr: string) => {
    return `${window.location.origin}/mesa/${tokenQr}`;
  };

  const handleImprimirQr = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-fondo p-6 font-sans text-texto">
      {/* Contenido principal (se oculta al imprimir si hay un modal QR abierto) */}
      <div className={mesaQrSeleccionada ? 'print:hidden' : ''}>
        {/* Encabezado */}
        <div className="mx-auto max-w-5xl mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-serif text-primario">
              Gestión de Mesas y QR (P-15)
            </h1>
            <p className="text-sm text-secundario">
              Administración de mesas del salón, estado de habilitación y códigos QR de acceso.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleAbrirModalForm()}
            className="rounded-xl bg-primario px-4 py-2.5 text-sm font-semibold text-texto-boton shadow-sm hover:bg-[#38241d] transition-colors self-start sm:self-auto"
          >
            + Nueva Mesa
          </button>
        </div>

        {errorGeneral && (
          <div className="mx-auto max-w-5xl mb-4 rounded-xl border border-red-200 bg-red-100 p-4 text-sm font-semibold text-red-800">
            {errorGeneral}
          </div>
        )}

        {/* Grilla de Mesas */}
        <div className="mx-auto max-w-5xl">
          {cargando ? (
            <div className="py-12 text-center text-secundario font-medium">
              Cargando mesas...
            </div>
          ) : mesas.length === 0 ? (
            <div className="rounded-2xl border border-linea bg-tarjeta p-12 text-center text-secundario shadow-sm">
              Todavía no hay mesas cargadas en este local. Creá la primera desde "+ Nueva Mesa".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mesas.map((mesa) => (
                <div
                  key={mesa.id}
                  className={`rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
                    mesa.habilitada
                      ? 'border-linea bg-tarjeta'
                      : 'border-stone-300 bg-stone-100/80 opacity-85'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-lg font-bold font-serif text-primario">
                          Mesa {mesa.numero}
                        </h2>
                        {mesa.capacidad && (
                          <p className="text-xs text-secundario">
                            Capacidad: {mesa.capacidad} personas
                          </p>
                        )}
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          !mesa.habilitada
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : mesa.estadoCuenta && mesa.estadoCuenta !== 'LIBRE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {!mesa.habilitada
                          ? 'Inhabilitada'
                          : mesa.estadoCuenta || 'Libre'}
                      </span>
                    </div>

                    <div className="mb-4 rounded-xl border border-linea/70 bg-fondo/60 p-2.5 text-[11px] text-secundario font-mono truncate">
                      Token: {mesa.tokenQr}
                    </div>
                  </div>

                  {/* Acciones de la Mesa */}
                  <div className="pt-3 border-t border-linea flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setMesaQrSeleccionada(mesa)}
                      className="w-full rounded-xl bg-primario py-2 text-xs font-semibold text-texto-boton hover:bg-[#38241d] transition-colors"
                    >
                      Ver / Imprimir QR
                    </button>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAbrirModalForm(mesa)}
                        className="flex-1 rounded-lg border border-linea bg-tarjeta py-1.5 text-xs font-semibold text-texto hover:bg-fondo transition-colors"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleHabilitacion(mesa)}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                          mesa.habilitada
                            ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                            : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {mesa.habilitada ? 'Inhabilitar' : 'Habilitar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Alta / Edición de Mesa */}
      {modalFormAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm print:hidden">
          <form
            onSubmit={handleGuardarMesa}
            className="w-full max-w-md rounded-2xl border border-linea bg-tarjeta p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold font-serif text-primario mb-4">
              {mesaEditando ? `Editar Mesa ${mesaEditando.numero}` : 'Nueva Mesa'}
            </h3>

            <div className="space-y-4 text-xs font-semibold text-secundario">
              <div>
                <label className="block mb-1">Número o identificador de mesa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 1, 12, Patio 2"
                  value={formMesa.numero}
                  onChange={(e) => setFormMesa({ ...formMesa, numero: e.target.value })}
                  className="w-full rounded-xl border border-linea bg-white p-2.5 text-sm font-normal text-texto"
                />
              </div>

              <div>
                <label className="block mb-1">Capacidad (comensales)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formMesa.capacidad ?? ''}
                  onChange={(e) =>
                    setFormMesa({
                      ...formMesa,
                      capacidad: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-xl border border-linea bg-white p-2.5 text-sm font-normal text-texto"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setModalFormAbierto(false)}
                className="flex-1 rounded-xl border border-linea py-2.5 text-sm font-semibold text-texto hover:bg-fondo transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoMesa}
                className="flex-1 rounded-xl bg-primario py-2.5 text-sm font-semibold text-texto-boton hover:bg-[#38241d] disabled:opacity-50 transition-colors"
              >
                {guardandoMesa ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Vista Previa, Regeneración e Impresión de QR */}
      {mesaQrSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm print:static print:bg-transparent print:p-0">
          <div className="w-full max-w-sm rounded-2xl border border-linea bg-tarjeta p-6 shadow-xl text-center print:w-full print:max-w-xs print:border-2 print:border-primario print:shadow-none print:mx-auto">
            {/* Tarjeta imprimible */}
            <div className="py-2">
              <p className="text-xs font-bold uppercase tracking-widest text-secundario">
                Chit&Go
              </p>
              <h3 className="text-2xl font-bold font-serif text-primario mt-1 mb-4">
                Mesa {mesaQrSeleccionada.numero}
              </h3>

              <div className="inline-flex items-center justify-center rounded-2xl border border-linea bg-white p-4 shadow-inner print:border-none print:shadow-none">
                <QRCodeSVG
                  value={construirUrlQr(mesaQrSeleccionada.tokenQr)}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <p className="mt-4 text-xs font-medium text-texto">
                Escaneá el código QR para ver la carta y pedir desde tu mesa
              </p>
              <p className="mt-1 text-[10px] font-mono text-secundario break-all print:hidden">
                {construirUrlQr(mesaQrSeleccionada.tokenQr)}
              </p>
            </div>

            {/* Botones de acción (ocultos al imprimir) */}
            <div className="mt-6 flex flex-col gap-2.5 print:hidden">
              <button
                type="button"
                onClick={handleImprimirQr}
                className="w-full rounded-xl bg-primario py-2.5 text-sm font-semibold text-texto-boton hover:bg-[#38241d] transition-colors"
              >
                Imprimir Cartel QR
              </button>

              <button
                type="button"
                onClick={handleRegenerarQr}
                disabled={regenerandoQr}
                className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50 transition-colors"
              >
                {regenerandoQr ? 'Regenerando token...' : 'Regenerar Token QR'}
              </button>

              <button
                type="button"
                onClick={() => setMesaQrSeleccionada(null)}
                className="w-full rounded-xl border border-linea py-2 text-xs font-semibold text-texto hover:bg-fondo transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};