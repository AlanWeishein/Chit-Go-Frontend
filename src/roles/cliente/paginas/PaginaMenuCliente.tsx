import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Carta, Plato } from '../../../compartido/tipos/menu';
import { ItemCarrito } from '../../../compartido/tipos/carrito';
import {
  consultarMesa,
  entrarALaMesa,
  llamarAlMozo,
  obtenerCarta,
  traducirError,
  type SesionMesa,
} from '../../../compartido/api/cliente';
import { CarritoCliente } from '../componentes/CarritoCliente';

type Entrada =
  | { estado: 'cargando' }
  | { estado: 'mesa-inexistente' } // P-35b
  | { estado: 'mesa-no-disponible'; numero: string } // P-35
  | { estado: 'error' }
  | { estado: 'lista'; numero: string; sesion: SesionMesa };

const PROBA_DE_NUEVO = 'Revisá la conexión y probá de nuevo.';

// La carta no trae la lista de etiquetas: los chips salen de las que tienen los platos de la carta sin filtrar.
function etiquetasDe(carta: Carta): string[] {
  const todas = new Set(carta.categorias.flatMap((c) => c.platos.flatMap((p) => p.etiquetas)));
  return [...todas].sort((a, b) => a.localeCompare(b, 'es'));
}

export const PaginaMenuCliente: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const [entrada, setEntrada] = useState<Entrada>({ estado: 'cargando' });
  const [intentoEntrada, setIntentoEntrada] = useState(0);
  const [carta, setCarta] = useState<Carta | null>(null);
  const [errorCarta, setErrorCarta] = useState(false);
  const [intentoCarta, setIntentoCarta] = useState(0);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [etiquetaSeleccionada, setEtiquetaSeleccionada] = useState<string | null>(null);
  const [cargandoLlamado, setCargandoLlamado] = useState(false);
  const [avisoMozo, setAvisoMozo] = useState<'avisado' | 'no-se-pudo' | null>(null);

  // Estados agregados para HU-02 (Carrito)
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [uuidCliente, setUuidCliente] = useState<string>('');

  // Primero se mira la mesa, así una inhabilitada (P-35) o un QR que no existe (P-35b) no abren nada.
  // Después va la sesión: si el celular ya tenía una en esa cuenta, el back le devuelve la misma.
  useEffect(() => {
    let activo = true;
    setEntrada({ estado: 'cargando' });
    (async () => {
      let numero: string | null = null;
      try {
        const mesa = await consultarMesa(token);
        numero = mesa.numero;
        if (!mesa.disponible) {
          if (activo) setEntrada({ estado: 'mesa-no-disponible', numero });
          return;
        }
        const sesion = await entrarALaMesa(token);
        if (activo) setEntrada({ estado: 'lista', numero, sesion });
      } catch (err) {
        if (!activo) return;
        const { motivo } = traducirError(err);
        if (motivo === 'mesa-inexistente') setEntrada({ estado: 'mesa-inexistente' });
        else if (motivo === 'mesa-no-disponible' && numero !== null) setEntrada({ estado: 'mesa-no-disponible', numero });
        else setEntrada({ estado: 'error' });
      }
    })();
    return () => {
      activo = false;
    };
  }, [token, intentoEntrada]);

  const mesaLista = entrada.estado === 'lista';

  // La carta va aparte de la entrada: si falla, "Reintentar" la vuelve a pedir sin abrir otra sesión.
  useEffect(() => {
    if (!mesaLista) return;
    let activo = true;
    setCarta(null);
    setErrorCarta(false);
    obtenerCarta(token, etiquetaSeleccionada ?? undefined)
      .then((nueva) => {
        if (!activo) return;
        setCarta(nueva);
        if (etiquetaSeleccionada === null) setEtiquetas(etiquetasDe(nueva));
      })
      .catch((err) => {
        if (!activo) return;
        if (traducirError(err).motivo === 'mesa-inexistente') setEntrada({ estado: 'mesa-inexistente' });
        else setErrorCarta(true);
      });
    return () => {
      activo = false;
    };
  }, [token, mesaLista, etiquetaSeleccionada, intentoCarta]);

  // 2. Generar o recuperar clave de idempotencia (uuidCliente)
  useEffect(() => {
    let clienteId = localStorage.getItem('uuidCliente');
    if (!clienteId) {
      clienteId = crypto.randomUUID();
      localStorage.setItem('uuidCliente', clienteId);
    }
    setUuidCliente(clienteId);
  }, []);

  // 3. Funciones de manipulación del carrito (HU-02)
  const handleAgregarAlCarrito = (producto: Plato) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.producto.id === producto.id);
      if (existe) {
        return prev.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const handleActualizarCantidad = (idProducto: number, cambio: number) => {
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (item.producto.id === idProducto) {
            const nuevaCantidad = item.cantidad + cambio;
            return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
          }
          return item;
        })
        .filter((item): item is ItemCarrito => item !== null)
    );
  };

  const handleLimpiarCarrito = () => {
    setCarrito([]);
  };

  // Lo puede usar también el modo lectura (13/10). Un 409 es un llamado que el mozo todavía no atendió.
  const handleLlamarAlMozo = async () => {
    if (entrada.estado !== 'lista' || cargandoLlamado) return;
    setCargandoLlamado(true);
    setAvisoMozo(null);
    try {
      await llamarAlMozo(entrada.sesion.tokenSesion);
      setAvisoMozo('avisado');
    } catch (err) {
      setAvisoMozo(traducirError(err).motivo === 'mozo-ya-avisado' ? 'avisado' : 'no-se-pudo');
    } finally {
      setCargandoLlamado(false);
    }
  };

  if (entrada.estado !== 'lista') {
    return <PantallaDeEntrada entrada={entrada} onReintentar={() => setIntentoEntrada((n) => n + 1)} />;
  }

  const { numero, sesion } = entrada;

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#2A1A17] pb-24 font-sans">
      <header className="sticky top-0 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#E8D8C8] px-4 py-3 z-10">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-xl font-bold font-serif text-[#C93B1D]">Chit&Go</h1>
            <p className="text-xs text-stone-600">Mesa #{numero}</p>
          </div>
          {!sesion.esIniciador && (
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium border border-amber-300">
              Modo lectura
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-6">
        {!sesion.esIniciador && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
            <strong>Atención:</strong> La cuenta de esta mesa fue abierta por otro comensal. Puedes consultar la carta, pero los pedidos se envían desde el dispositivo principal.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Menú / Carta */}
          <div className="lg:col-span-2 space-y-6">
            {etiquetas.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Filtrar por dieta / alérgenos
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setEtiquetaSeleccionada(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      etiquetaSeleccionada === null
                        ? 'bg-[#C93B1D] text-white'
                        : 'bg-[#E8D8C8] text-[#2A1A17] hover:bg-[#d8c4b0]'
                    }`}
                  >
                    Todos
                  </button>
                  {etiquetas.map((etiqueta) => (
                    <button
                      key={etiqueta}
                      onClick={() =>
                        setEtiquetaSeleccionada(
                          etiquetaSeleccionada === etiqueta ? null : etiqueta
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        etiquetaSeleccionada === etiqueta
                          ? 'bg-[#C93B1D] text-white'
                          : 'bg-[#E8D8C8] text-[#2A1A17] hover:bg-[#d8c4b0]'
                      }`}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {errorCarta ? (
              <div role="alert" className="rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-4 text-texto">
                <p className="font-semibold">No pudimos cargar la carta. {PROBA_DE_NUEVO}</p>
                <button
                  type="button"
                  onClick={() => setIntentoCarta((n) => n + 1)}
                  className="mt-4 w-full rounded-xl bg-primario py-3 font-medium text-white"
                >
                  Reintentar
                </button>
              </div>
            ) : carta === null ? (
              <p className="text-sm text-secundario">Cargando la carta…</p>
            ) : (
              carta.categorias.map((cat) => {
                if (cat.platos.length === 0) return null;

                return (
                  <section key={cat.id} className="space-y-3">
                    <h2 className="text-lg font-bold font-serif border-b border-[#E8D8C8] pb-1 text-[#2A1A17]">
                      {cat.nombre}
                    </h2>
                    <div className="space-y-3">
                      {cat.platos.map((plato) => (
                        <article
                          key={plato.id}
                          className="bg-white rounded-xl p-4 shadow-sm border border-[#E8D8C8]/60 flex justify-between gap-3"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm text-[#2A1A17]">{plato.nombre}</h3>
                              {plato.destacado && (
                                <span className="bg-orange-100 text-[#C93B1D] text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  Menú del día
                                </span>
                              )}
                            </div>
                            {plato.descripcion && (
                              <p className="text-xs text-stone-600 line-clamp-2">{plato.descripcion}</p>
                            )}

                            {plato.etiquetas.length > 0 && (
                              <div className="flex gap-1 pt-1">
                                {plato.etiquetas.map((e) => (
                                  <span
                                    key={e}
                                    className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-medium border border-emerald-200"
                                  >
                                    {e}
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="text-sm font-bold text-[#C93B1D] pt-1">
                              ${plato.precio.toLocaleString('es-AR')}
                            </p>
                          </div>

                          {sesion.esIniciador && (
                            <button
                              type="button"
                              onClick={() => handleAgregarAlCarrito(plato)}
                              className="self-end bg-[#C93B1D] hover:bg-[#A82F16] text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors"
                            >
                              + Agregar
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>

          {/* Columna Derecha: Componente CarritoCliente (HU-02) */}
          {sesion.esIniciador && (
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <CarritoCliente
                  items={carrito}
                  uuidMesa={token}
                  uuidCliente={uuidCliente}
                  onActualizarCantidad={handleActualizarCantidad}
                  onLimpiarCarrito={handleLimpiarCarrito}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#E8D8C8] p-3 z-20">
        <div className="max-w-4xl mx-auto">
          <div aria-live="polite">
            {avisoMozo === 'avisado' && (
              <p className="mb-2 rounded-[14px] bg-primario px-3 py-2 text-sm font-semibold text-white">
                Ya avisamos al mozo.
              </p>
            )}
            {avisoMozo === 'no-se-pudo' && (
              <p className="mb-2 rounded-[14px] border-[1.5px] border-primario bg-tarjeta px-3 py-2 text-sm font-semibold text-texto">
                No pudimos avisar al mozo. Probá de nuevo.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleLlamarAlMozo}
              disabled={cargandoLlamado}
              className="flex-1 bg-[#2A1A17] hover:bg-stone-800 disabled:bg-stone-400 text-white text-xs py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              🔔 {cargandoLlamado ? 'Enviando...' : 'Llamar al mozo'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Lo que se ve antes de la carta. Va con los tokens de la paleta, como el login; P-35 y P-35b no tienen botones.
function PantallaDeEntrada({
  entrada,
  onReintentar,
}: {
  entrada: Exclude<Entrada, { estado: 'lista' }>;
  onReintentar: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fondo p-6 text-texto">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-primario">Chit&Go</h1>
        <div className="mt-6 rounded-2xl border border-linea bg-tarjeta p-6">
          {entrada.estado === 'cargando' && <p className="text-sm text-secundario">Cargando la mesa…</p>}

          {entrada.estado === 'mesa-inexistente' && (
            <h2 className="text-lg font-semibold">No encontramos esta mesa. Pedile ayuda al mozo.</h2>
          )}

          {entrada.estado === 'mesa-no-disponible' && (
            <>
              <h2 className="text-lg font-semibold">Esta mesa no está disponible.</h2>
              <p className="mt-1 text-secundario">Mesa {entrada.numero}</p>
              <p className="mt-4">Pedile ayuda al personal.</p>
            </>
          )}

          {entrada.estado === 'error' && (
            <div role="alert">
              <p className="font-semibold">No pudimos abrir la mesa. {PROBA_DE_NUEVO}</p>
              <button
                type="button"
                onClick={onReintentar}
                className="mt-4 w-full rounded-xl bg-primario py-3 font-medium text-white"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
