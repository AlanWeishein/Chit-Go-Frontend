import { useRef, useState } from 'react';
import { ItemCarrito } from '../../../compartido/tipos/carrito';
import { enviarPedido, traducirError, type FalloCliente } from '../../../compartido/api/cliente';

interface PropsCarrito {
  items: ItemCarrito[];
  tokenSesion: string;
  onActualizarCantidad: (idProducto: number, cambio: number) => void;
  onLimpiarCarrito: () => void;
}

type Resultado = { tipo: 'enviado' } | { tipo: 'error'; texto: string };

function textoDelFallo(fallo: FalloCliente): string {
  switch (fallo.motivo) {
    case 'pedido-sin-permiso':
      return 'Desde este celular no se pueden hacer pedidos en esta mesa. Pedile ayuda al mozo.';
    case 'pedido-en-conflicto':
      return fallo.detalle ?? 'No pudimos mandar el pedido. Pedile ayuda al mozo.';
    case 'pedido-invalido':
      return 'Hay un dato del pedido que no está bien. Revisá las cantidades y probá de nuevo.';
    default:
      return 'No pudimos mandar el pedido. Revisá la conexión y probá de nuevo.';
  }
}

export const CarritoCliente = ({
  items,
  tokenSesion,
  onActualizarCantidad,
  onLimpiarCarrito,
}: PropsCarrito) => {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  // Una clave por pedido (RNF-09): se reusa solo al reintentar este mismo carrito. Cada cambio del carrito
  // arma un arreglo nuevo, así que si `items` ya no es el mismo, es otro pedido y lleva otra clave.
  const clave = useRef<{ items: ItemCarrito[]; uuidCliente: string } | null>(null);

  const total = items.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);

  const handleConfirmarPedido = async () => {
    if (items.length === 0 || enviando) return;

    const pedido = clave.current?.items === items ? clave.current : { items, uuidCliente: crypto.randomUUID() };
    clave.current = pedido;
    setEnviando(true);
    setResultado(null);

    try {
      await enviarPedido(tokenSesion, {
        uuidCliente: pedido.uuidCliente,
        items: items.map((i) => ({
          platoId: i.producto.id,
          cantidad: i.cantidad,
          observacion: i.observacion ?? null,
        })),
      });
      clave.current = null;
      setResultado({ tipo: 'enviado' });
      onLimpiarCarrito();
    } catch (error) {
      setResultado({ tipo: 'error', texto: textoDelFallo(traducirError(error)) });
    } finally {
      setEnviando(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        {resultado?.tipo === 'enviado' && (
          <p
            role="status"
            className="mb-3 rounded-[14px] bg-primario px-3 py-2 text-left text-sm font-semibold text-white"
          >
            Mandamos tu pedido. Antes de pasar a cocina, Caja le da una mirada.
          </p>
        )}
        El carrito está vacío.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Tu Pedido</h2>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {items.map(({ producto, cantidad }) => (
          <div key={producto.id} className="flex justify-between items-center border-b pb-2">
            <div>
              <p className="font-semibold text-gray-800">{producto.nombre}</p>
              <p className="text-sm text-gray-500">${producto.precio} c/u</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onActualizarCantidad(producto.id, -1)}
                disabled={enviando}
                className="px-2 py-1 bg-gray-200 rounded text-gray-700 font-bold hover:bg-gray-300 disabled:opacity-50"
              >
                -
              </button>
              <span className="font-semibold w-6 text-center">{cantidad}</span>
              <button
                onClick={() => onActualizarCantidad(producto.id, 1)}
                disabled={enviando}
                className="px-2 py-1 bg-gray-200 rounded text-gray-700 font-bold hover:bg-gray-300 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t flex justify-between items-center">
        <span className="text-lg font-bold text-gray-800">Total:</span>
        <span className="text-xl font-extrabold text-emerald-600">${total.toFixed(2)}</span>
      </div>

      <div aria-live="polite">
        {resultado?.tipo === 'error' && (
          <p className="mt-3 rounded-[14px] border-[1.5px] border-primario bg-tarjeta px-3 py-2 text-sm font-semibold text-texto">
            {resultado.texto}
          </p>
        )}
      </div>

      <button
        onClick={handleConfirmarPedido}
        disabled={enviando}
        className="w-full mt-4 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow hover:bg-emerald-700 transition disabled:opacity-50"
      >
        {enviando ? 'Enviando tu pedido…' : 'Confirmar Pedido'}
      </button>
    </div>
  );
};
