import { useState } from 'react';
import { ItemCarrito } from '../../../compartido/tipos/carrito';
import { enviarPedido } from '../../../compartido/api/pedidoApi';

interface PropsCarrito {
  items: ItemCarrito[];
  uuidMesa: string;
  uuidCliente: string;
  onActualizarCantidad: (idProducto: number, cambio: number) => void;
  onLimpiarCarrito: () => void;
}

export const CarritoCliente = ({
  items,
  uuidMesa,
  uuidCliente,
  onActualizarCantidad,
  onLimpiarCarrito,
}: PropsCarrito) => {
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const total = items.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);

  const handleConfirmarPedido = async () => {
    if (items.length === 0 || enviando) return;

    setEnviando(true);
    setMensaje(null);

    try {
      const solicitud = {
        uuidMesa,
        uuidCliente, // Clave de idempotencia
        items: items.map((i) => ({
          idProducto: i.producto.id,
          cantidad: i.cantidad,
          aclaracion: i.aclaracion,
        })),
      };

      await enviarPedido(solicitud);
      setMensaje('¡Pedido enviado a cocina con éxito!');
      onLimpiarCarrito();
    } catch (error) {
      console.error('Error enviando pedido:', error);
      setMensaje('Ocurrió un error al enviar el pedido. Reintenta.');
    } finally {
      setEnviando(false);
    }
  };

  if (items.length === 0) {
    return <div className="p-4 text-center text-gray-500">El carrito está vacío.</div>;
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
                className="px-2 py-1 bg-gray-200 rounded text-gray-700 font-bold hover:bg-gray-300"
              >
                -
              </button>
              <span className="font-semibold w-6 text-center">{cantidad}</span>
              <button
                onClick={() => onActualizarCantidad(producto.id, 1)}
                className="px-2 py-1 bg-gray-200 rounded text-gray-700 font-bold hover:bg-gray-300"
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

      {mensaje && (
        <p className={`mt-3 text-sm text-center font-medium ${mensaje.includes('éxito') ? 'text-emerald-600' : 'text-red-500'}`}>
          {mensaje}
        </p>
      )}

      <button
        onClick={handleConfirmarPedido}
        disabled={enviando}
        className="w-full mt-4 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow hover:bg-emerald-700 transition disabled:opacity-50"
      >
        {enviando ? 'Enviando a cocina...' : 'Confirmar Pedido'}
      </button>
    </div>
  );
};