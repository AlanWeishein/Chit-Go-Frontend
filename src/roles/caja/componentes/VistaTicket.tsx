import React from 'react';
import type { Ticket } from '../../../compartido/api/caja';
import { precio } from '../../cliente/formato';

interface Props {
  ticket: Ticket;
  onCerrar?: () => void;
}

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario';

// DD/MM/AAAA HH:MM, la hora del local (la del navegador de Caja).
function fechaYHora(iso: string): string {
  const f = new Date(iso);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()} ${dos(f.getHours())}:${dos(f.getMinutes())}`;
}

// El ticket no fiscal como papel angosto, como la "Vista previa del ticket" de P-09 (nodo 2009:3269).
// Al imprimir sale solo este papel (el marco y la página de Caja se esconden con print:, el @page está en index.css):
// sin borde ni fondo, con todo el texto en `texto` en vez del gris, y sin partirse en dos hojas.
export const VistaTicket: React.FC<Props> = ({ ticket, onCerrar }) => {
  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full flex-col items-center gap-1 rounded-md border border-linea bg-tarjeta p-3 leading-[normal] text-texto tabular-nums print:break-inside-avoid print:border-none print:bg-transparent">
        <p className="titulo text-[25px] leading-[normal]">{ticket.letra}</p>
        <p className="w-[150px] text-center text-[11px] font-semibold tracking-[0.66px] uppercase">{ticket.leyenda}</p>
        <p className="text-center text-[13px] text-secundario print:text-texto">{ticket.local}</p>
        <p className="text-center text-[13px] text-secundario print:text-texto">
          Mesa {ticket.mesa} · Ticket N.º {ticket.numero}
        </p>
        <p className="text-center text-[13px] text-secundario print:text-texto">{fechaYHora(ticket.emitidoEn)}</p>

        {ticket.items.map((item, idx) => (
          <div key={idx} className="flex w-full items-start justify-between gap-2 text-[11px]">
            <p className="min-w-0">
              {item.cantidad}× {item.plato}
            </p>
            <p className="shrink-0">{precio(item.subtotal)}</p>
          </div>
        ))}

        <div className="flex w-full items-start justify-between gap-2 text-[11px] font-medium">
          <p>TOTAL</p>
          <p className="shrink-0">{precio(ticket.total)}</p>
        </div>
      </div>

      <div className="flex gap-2 print:hidden">
        <button
          type="button"
          onClick={handleImprimir}
          className={`h-11 min-w-0 flex-1 rounded-[14px] bg-primario px-3 text-[15px] font-semibold text-texto-boton ${foco}`}
        >
          Imprimir
        </button>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            className={`h-11 min-w-0 flex-1 rounded-[14px] border-[1.5px] border-primario px-3 text-[15px] font-semibold text-primario ${foco}`}
          >
            Listo
          </button>
        )}
      </div>
    </div>
  );
};
