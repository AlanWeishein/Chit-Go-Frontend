import { QRCodeSVG } from 'qrcode.react'

// La dirección que lleva el QR: solo el token de la mesa, nunca el número ni ids (HU-13, CP-26-05). El origen es la
// dirección con la que se abrió el Admin: si es localhost, el celular no llega (ver el aviso de P-15).
export function direccionDeLaMesa(tokenQr: string): string {
  return `${window.location.origin}/mesa/${tokenQr}`
}

// P-38, el QR impreso de una mesa (nodo 2009:10294), una por hoja A4. En pantalla no se ve: GestionMesasPage lo
// monta solo para imprimir. Como el ticket (VistaTicket), al imprimir va sin el fondo ni el borde del Mockup.
export default function QrImpreso({ local, numero, tokenQr }: { local: string; numero: string; tokenQr: string }) {
  return (
    <div className="flex h-[297mm] w-[210mm] break-after-page flex-col items-center justify-center gap-[14px] px-8 pt-9 pb-7 leading-[normal] text-texto last:break-after-auto">
      {local && <p className="titulo text-[22px] text-secundario">{local}</p>}
      <p className="titulo text-[44px]">Mesa {numero}</p>
      <div className="flex size-[220px] items-center justify-center overflow-hidden rounded-2xl border-2 border-primario bg-tarjeta">
        <QRCodeSVG value={direccionDeLaMesa(tokenQr)} size={176} level="M" marginSize={0} />
      </div>
      <p className="w-[356px] text-center text-base leading-[1.4]">
        Escaneá con la cámara del celular para ver la carta y pedir desde la mesa.
      </p>
      <p className="text-center text-sm text-secundario">Sin descargar nada ni registrarte.</p>
      <p className="titulo text-sm text-secundario">Chit&amp;Go</p>
    </div>
  )
}
