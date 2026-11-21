import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { EstadoPantallaPublica } from '../../../compartido/tipos/pantallaPublica';
import { obtenerEstadoPedidosPublico } from '../../../compartido/api/pantallaPublica';

const INTERVALO_POLLING_MS = 10000;

export const PantallaPublicaPage: React.FC = () => {
  const { localId } = useParams<{ localId: string }>();
  const [datos, setDatos] = useState<EstadoPantallaPublica>({
    nombreLocal: 'Chit&Go',
    enPreparacion: [],
    listos: [],
  });
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorConexion, setErrorConexion] = useState<boolean>(false);
  const [horaActual, setHoraActual] = useState<string>(() =>
    new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraActual(
        new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      );
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const cargarPedidos = useCallback(async () => {
    if (!localId) return;
    try {
      const respuesta = await obtenerEstadoPedidosPublico(localId);
      setDatos(respuesta);
      setErrorConexion(false);
    } catch {
      setErrorConexion(true);
    } finally {
      setCargando(false);
    }
  }, [localId]);

  useEffect(() => {
    cargarPedidos();
    const intervalo = setInterval(cargarPedidos, INTERVALO_POLLING_MS);
    return () => clearInterval(intervalo);
  }, [cargarPedidos]);

  return (
    <div className="min-h-screen bg-fondo text-texto flex flex-col p-6 lg:p-10 select-none overflow-hidden font-sans">
      <header className="flex items-center justify-between border-b-2 border-linea pb-5 mb-8">
        <div className="flex items-center gap-4">
          <span className="rounded-2xl bg-primario px-4 py-2 font-serif text-2xl lg:text-3xl font-bold text-texto-boton tracking-wide">
            Chit&Go
          </span>
          {datos.nombreLocal && (
            <h1 className="font-serif text-3xl lg:text-4xl font-bold text-primario">
              {datos.nombreLocal}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-6">
          {errorConexion && (
            <span className="rounded-xl border border-amber-300 bg-amber-100 px-4 py-2 text-base font-bold text-amber-900">
              Reconectando…
            </span>
          )}
          <span className="font-mono text-3xl lg:text-5xl font-bold text-texto">
            {horaActual}
          </span>
        </div>
      </header>

      {cargando ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-3xl font-semibold text-secundario">
            Cargando estado de pedidos…
          </p>
        </div>
      ) : (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* COLUMNA 1: EN PREPARACIÓN */}
          <section className="flex flex-col rounded-3xl border-2 border-linea bg-tarjeta p-6 lg:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-linea pb-4 mb-6">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-secundario uppercase tracking-wide">
                En preparación
              </h2>
              <span className="rounded-full bg-stone-200 px-4 py-1 text-2xl font-bold text-texto">
                {datos.enPreparacion.length}
              </span>
            </div>

            {datos.enPreparacion.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-2xl text-secundario">
                Sin pedidos en cocina
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 content-start">
                {datos.enPreparacion.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="rounded-2xl border border-linea bg-fondo p-5 text-center shadow-sm"
                  >
                    <span className="block text-sm font-bold uppercase tracking-widest text-secundario">
                      Mesa
                    </span>
                    <span className="mt-1 block font-serif text-4xl lg:text-5xl font-bold text-texto">
                      {pedido.mesa}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* COLUMNA 2: LISTOS */}
          <section className="flex flex-col rounded-3xl border-4 border-primario bg-tarjeta p-6 lg:p-8 shadow-md">
            <div className="flex items-center justify-between border-b-2 border-primario/20 pb-4 mb-6">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-primario uppercase tracking-wide">
                ¡Pedidos listos!
              </h2>
              <span className="rounded-full bg-primario px-4 py-1 text-2xl font-bold text-texto-boton">
                {datos.listos.length}
              </span>
            </div>

            {datos.listos.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-2xl text-secundario">
                Ningún pedido listo todavía
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 content-start">
                {datos.listos.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="rounded-2xl bg-primario p-5 text-center text-texto-boton shadow-md"
                  >
                    <span className="block text-sm font-bold uppercase tracking-widest opacity-85">
                      Mesa
                    </span>
                    <span className="mt-1 block font-serif text-5xl lg:text-6xl font-extrabold">
                      {pedido.mesa}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
};