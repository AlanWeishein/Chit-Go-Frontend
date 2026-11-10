import React from 'react';
import type { Ticket } from '../../../compartido/api/caja';

interface Props {
  ticket: Ticket;
  onCerrar?: () => void;
}

export const VistaTicket: React.FC<Props> = ({ ticket, onCerrar }) => {
  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Botonera de acciones (Se oculta al imprimir) */}
      <div className="mb-4 flex gap-3 print:hidden">
        <button
          type="button"
          onClick={handleImprimir}
          className="flex items-center gap-2 rounded-xl bg-primario px-5 py-2.5 text-sm font-semibold text-texto-boton shadow-sm hover:bg-[#38241d] transition-colors"
        >
          🖨️ Imprimir Ticket
        </button>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl border border-linea bg-tarjeta px-4 py-2.5 text-sm font-semibold text-texto hover:bg-fondo transition-colors"
          >
            Volver a Cuentas
          </button>
        )}
      </div>

      {/* Papel del Ticket (Formato continuo de comanda) */}
      <div className="w-full max-w-[340px] rounded-lg border border-linea bg-white p-6 shadow-md print:w-full print:max-w-full print:border-none print:p-0 print:shadow-none font-mono text-xs text-texto">
        
        {/* Encabezado del Ticket */}
        <div className="text-center border-b border-dashed border-secundario/40 pb-4 mb-4">
          <h2 className="text-base font-bold font-serif uppercase tracking-wider text-primario">
            {ticket.local}
          </h2>
          <p className="text-[11px] text-secundario mt-0.5">Comprobante de Consumo</p>
          
          {/* Letra del Comprobante (X) */}
          <div className="my-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-texto text-sm font-bold">
            {ticket.letra || 'X'}
          </div>

          <p className="text-[10px] font-bold tracking-tight text-secundario uppercase">
            {ticket.leyenda || 'DOCUMENTO NO VÁLIDO COMO FACTURA'}
          </p>
        </div>

        {/* Metadatos de la Cuenta */}
        <div className="mb-4 flex justify-between text-[11px] border-b border-dashed border-secundario/40 pb-3">
          <div>
            <p><span className="font-semibold">Mesa:</span> #{ticket.mesa}</p>
            <p><span className="font-semibold">Ticket #:</span> {ticket.numero}</p>
          </div>
          <div className="text-right">
            <p><span className="font-semibold">Fecha:</span> {new Date(ticket.emitidoEn).toLocaleDateString()}</p>
            <p><span className="font-semibold">Hora:</span> {new Date(ticket.emitidoEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Desglose de Ítems */}
        <table className="w-full mb-4 text-left border-b border-dashed border-secundario/40 pb-3">
          <thead>
            <tr className="border-b border-linea text-[10px] uppercase text-secundario">
              <th className="py-1">Cant.</th>
              <th className="py-1">Detalle</th>
              <th className="py-1 text-right">P. Unit</th>
              <th className="py-1 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linea/50">
            {ticket.items.map((item, idx) => (
              <tr key={idx} className="align-top">
                <td className="py-1.5 font-semibold">{item.cantidad}</td>
                <td className="py-1.5 pr-1 leading-tight">{item.plato}</td>
                <td className="py-1.5 text-right">${item.precioUnitario.toLocaleString()}</td>
                <td className="py-1.5 text-right font-semibold">${item.subtotal.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total Final */}
        <div className="flex items-center justify-between pt-1 pb-3 text-sm font-bold text-primario">
          <span>TOTAL COBRADO:</span>
          <span className="text-base">${ticket.total.toLocaleString()}</span>
        </div>

        {/* Pie de Página */}
        <div className="text-center pt-4 border-t border-dashed border-secundario/40 text-[10px] text-secundario">
          <p>¡Muchas gracias por su visita!</p>
          <p className="mt-0.5 text-[9px]">Chit&Go System</p>
        </div>
      </div>
    </div>
  );
};