import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { RespuestaMesaMenu, Plato } from '../../../compartido/tipos/menu';
import { ItemCarrito } from '../../../compartido/tipos/carrito';
import { mockRespuestaMenu } from '../../../mocks/menuMock';
import { api } from '../../../compartido/api/http';
import { CarritoCliente } from '../componentes/CarritoCliente';

export const PaginaMenuCliente: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [datosMenu, setDatosMenu] = useState<RespuestaMesaMenu | null>(null);
  const [etiquetaSeleccionada, setEtiquetaSeleccionada] = useState<number | null>(null);
  const [cargandoLlamado, setCargandoLlamado] = useState(false);

  // Estados agregados para HU-02 (Carrito)
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [uuidCliente, setUuidCliente] = useState<string>('');

  // 1. Cargar el menú de la mesa
  useEffect(() => {
    if (token) {
      api<RespuestaMesaMenu>(`/public/mesa/${token}/menu`)
        .then(setDatosMenu)
        .catch(() => setDatosMenu(mockRespuestaMenu));
    } else {
      setDatosMenu(mockRespuestaMenu);
    }
  }, [token]);

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

  // 4. Solicitud de llamar al mozo
  const llamarAlMozo = async () => {
    if (!datosMenu || cargandoLlamado) return;
    setCargandoLlamado(true);
    
    try {
      await api('/avisos', {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'LLAMAR_MOZO',
          mesaNumero: datosMenu.mesaNumero,
        }),
      });
      alert(`Se ha notificado al mozo para la Mesa #${datosMenu.mesaNumero}`);
    } catch {
      alert('No se pudo enviar la solicitud. Por favor intenta de nuevo.');
    } finally {
      setCargandoLlamado(false);
    }
  };

  if (!datosMenu) {
    return <div className="p-8 text-center text-stone-600">Cargando menú de la mesa...</div>;
  }

  const platosFiltrados = datosMenu.platos.filter((plato: Plato) => {
    if (!plato.activo) return false;
    if (etiquetaSeleccionada === null) return true;
    return plato.etiquetas.some((e) => e.id === etiquetaSeleccionada);
  });

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#2A1A17] pb-24 font-sans">
      <header className="sticky top-0 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#E8D8C8] px-4 py-3 z-10">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-xl font-bold font-serif text-[#C93B1D]">Chit&Go</h1>
            <p className="text-xs text-stone-600">Mesa #{datosMenu.mesaNumero}</p>
          </div>
          {!datosMenu.esIniciador && (
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium border border-amber-300">
              Modo lectura
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-6">
        {!datosMenu.esIniciador && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
            <strong>Atención:</strong> La cuenta de esta mesa fue abierta por otro comensal. Puedes consultar la carta, pero los pedidos se envían desde el dispositivo principal.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Menú / Carta */}
          <div className="lg:col-span-2 space-y-6">
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
                {datosMenu.etiquetasDisponibles.map((etiqueta) => (
                  <button
                    key={etiqueta.id}
                    onClick={() =>
                      setEtiquetaSeleccionada(
                        etiquetaSeleccionada === etiqueta.id ? null : etiqueta.id
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      etiquetaSeleccionada === etiqueta.id
                        ? 'bg-[#C93B1D] text-white'
                        : 'bg-[#E8D8C8] text-[#2A1A17] hover:bg-[#d8c4b0]'
                    }`}
                  >
                    {etiqueta.nombre}
                  </button>
                ))}
              </div>
            </section>

            {datosMenu.categorias.map((cat) => {
              const platosDeCat = platosFiltrados.filter((p) => p.categoriaId === cat.id);
              if (platosDeCat.length === 0) return null;

              return (
                <section key={cat.id} className="space-y-3">
                  <h2 className="text-lg font-bold font-serif border-b border-[#E8D8C8] pb-1 text-[#2A1A17]">
                    {cat.nombre}
                  </h2>
                  <div className="space-y-3">
                    {platosDeCat.map((plato) => (
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
                          <p className="text-xs text-stone-600 line-clamp-2">{plato.descripcion}</p>
                          
                          {plato.etiquetas.length > 0 && (
                            <div className="flex gap-1 pt-1">
                              {plato.etiquetas.map((e) => (
                                <span
                                  key={e.id}
                                  className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-medium border border-emerald-200"
                                >
                                  {e.nombre}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-sm font-bold text-[#C93B1D] pt-1">
                            ${plato.precio.toLocaleString('es-AR')}
                          </p>
                        </div>

                        {datosMenu.esIniciador && (
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
            })}
          </div>

          {/* Columna Derecha: Componente CarritoCliente (HU-02) */}
          {datosMenu.esIniciador && (
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <CarritoCliente
                  items={carrito}
                  uuidMesa={String(datosMenu.mesaNumero)}
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
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            onClick={llamarAlMozo}
            disabled={cargandoLlamado}
            className="flex-1 bg-[#2A1A17] hover:bg-stone-800 disabled:bg-stone-400 text-white text-xs py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            🔔 {cargandoLlamado ? 'Enviando...' : 'Llamar al mozo'}
          </button>
        </div>
      </footer>
    </div>
  );
};