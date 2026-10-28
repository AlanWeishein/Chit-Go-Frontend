import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Carta } from '../../../compartido/tipos/menu';
import { obtenerCarta, traducirError } from '../../../compartido/api/cliente';
import iconoBolsa from '../../../compartido/ui/iconos/bag.svg';
import iconoCheckBlanco from '../../../compartido/ui/iconos/check-blanco.svg';
import iconoInfo from '../../../compartido/ui/iconos/info.svg';
import BarraDeAbajo from '../componentes/BarraDeAbajo';
import EncabezadoMesa from '../componentes/EncabezadoMesa';
import FiltrosEtiquetas from '../componentes/FiltrosEtiquetas';
import PantallaDeEntrada, { botonPrincipal, PROBA_DE_NUEVO } from '../componentes/PantallaDeEntrada';
import PestanasCategorias, { ID_PANEL_CATEGORIA } from '../componentes/PestanasCategorias';
import { FilaPlato, PlatoDestacado } from '../componentes/Platos';
import SinPlatos from '../componentes/SinPlatos';
import { cantidadDePlatos, precio } from '../formato';
import { useCarrito } from '../useCarrito';
import { useEntradaMesa } from '../useEntradaMesa';
import type { EstadoVuelta } from './PaginaPedidoCliente';

// La carta no trae la lista de etiquetas: los chips salen de las que tienen los platos de la carta sin filtrar.
function etiquetasDe(carta: Carta): string[] {
  const todas = new Set(carta.categorias.flatMap((c) => c.platos.flatMap((p) => p.etiquetas)));
  return [...todas].sort((a, b) => a.localeCompare(b, 'es'));
}

// P-01 (iniciador), P-01b (modo lectura), P-01c (sin platos con esas etiquetas) y P-01e (mozo avisado).
export const PaginaMenuCliente: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const { entrada, reintentar, mesaInexistente } = useEntradaMesa(token);
  const [carta, setCarta] = useState<Carta | null>(null);
  const [errorCarta, setErrorCarta] = useState(false);
  const [intentoCarta, setIntentoCarta] = useState(0);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [categoriaElegida, setCategoriaElegida] = useState<number | null>(null);

  // El carrito vive en el celular (localStorage) y lo comparte con P-02: aguanta ir y venir y recargar.
  const carrito = useCarrito(token, entrada.estado === 'lista' ? entrada.sesion.tokenSesion : null);

  // Al volver de P-02 con el pedido enviado. Se borra del historial, así al recargar no vuelve a aparecer.
  const location = useLocation();
  const navigate = useNavigate();
  const [pedidoEnviado] = useState(() => (location.state as EstadoVuelta | null)?.pedidoEnviado === true);
  useEffect(() => {
    if (!pedidoEnviado) return;
    navigate(location.pathname, { replace: true, state: null });
    window.scrollTo({ top: 0 });
  }, [pedidoEnviado, navigate, location.pathname]);

  const mesaLista = entrada.estado === 'lista';

  // La carta va aparte de la entrada: si falla, "Reintentar" la vuelve a pedir sin abrir otra sesión.
  // Mientras llega la carta filtrada se sigue viendo la anterior, así la pantalla no salta.
  useEffect(() => {
    if (!mesaLista) return;
    let activo = true;
    setErrorCarta(false);
    obtenerCarta(token, elegidas)
      .then((nueva) => {
        if (!activo) return;
        setCarta(nueva);
        if (elegidas.length === 0) setEtiquetas(etiquetasDe(nueva));
      })
      .catch((err) => {
        if (!activo) return;
        if (traducirError(err).motivo === 'mesa-inexistente') mesaInexistente();
        else setErrorCarta(true);
      });
    return () => {
      activo = false;
    };
  }, [token, mesaLista, elegidas, intentoCarta]);

  if (entrada.estado !== 'lista') {
    return <PantallaDeEntrada entrada={entrada} onReintentar={reintentar} />;
  }

  const { numero, sesion } = entrada;
  const onAgregar = sesion.esIniciador ? carrito.agregar : undefined;
  const { platos: platosEnCarrito, total } = carrito;

  // Si el filtro deja sin platos a la categoría elegida, el back no la manda: se pasa a la primera.
  const categorias = carta?.categorias ?? [];
  const categoria = categorias.find((c) => c.id === categoriaElegida) ?? categorias[0];

  let contenido: React.ReactNode;
  if (errorCarta) {
    contenido = (
      <div role="alert" className="rounded-[14px] border-[1.5px] border-primario bg-tarjeta p-3 text-texto">
        <p className="text-[15px] font-semibold">No pudimos cargar la carta. {PROBA_DE_NUEVO}</p>
        <button type="button" onClick={() => setIntentoCarta((n) => n + 1)} className={`mt-3 ${botonPrincipal}`}>
          Reintentar
        </button>
      </div>
    );
  } else if (carta === null) {
    contenido = <p className="text-[13px] text-secundario">Cargando la carta…</p>;
  } else if (categoria === undefined) {
    contenido =
      elegidas.length > 0 ? (
        <SinPlatos onQuitarFiltro={() => setElegidas([])} />
      ) : (
        <p className="text-[15px] text-secundario">Todavía no hay platos en la carta. Pedile ayuda al mozo.</p>
      );
  } else {
    contenido = (
      <>
        <PestanasCategorias categorias={categorias} elegida={categoria.id} onElegir={setCategoriaElegida} />
        {carta.destacados.length > 0 && (
          <section aria-label="Menú del día" className="flex flex-col gap-5">
            {carta.destacados.map((plato) => (
              <PlatoDestacado key={plato.id} plato={plato} onAgregar={onAgregar} />
            ))}
          </section>
        )}
        <section id={ID_PANEL_CATEGORIA} role="tabpanel" aria-labelledby={`pestana-${categoria.id}`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="titulo text-xl text-texto">{categoria.nombre}</h2>
            <p className="text-[13px] text-secundario">{cantidadDePlatos(categoria.platos.length)}</p>
          </div>
          <ul className="divide-y divide-linea">
            {categoria.platos.map((plato) => (
              <FilaPlato key={plato.id} plato={plato} onAgregar={onAgregar} />
            ))}
          </ul>
        </section>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-fondo font-inter leading-[normal] text-texto">
      <div className="mx-auto max-w-lg pb-36">
        <EncabezadoMesa numero={numero} esIniciador={sesion.esIniciador} />
        <main className="flex flex-col gap-5 px-6 pt-2">
          {pedidoEnviado && (
            <p
              role="status"
              className="flex items-start gap-2.5 rounded-[14px] bg-primario p-3.5 text-sm font-medium text-texto-boton"
            >
              <img src={iconoCheckBlanco} alt="" width={20} height={20} className="shrink-0" />
              Mandamos tu pedido. Antes de pasar a cocina, Caja le da una mirada.
            </p>
          )}
          {!sesion.esIniciador && (
            <p className="flex items-start gap-3 rounded-[14px] bg-linea p-3.5 text-[13px] text-texto">
              <img src={iconoInfo} alt="" width={20} height={20} className="shrink-0" />
              Esta mesa ya tiene una cuenta abierta: el pedido lo hace quien escaneó primero. Podés mirar el menú y
              llamar al mozo cuando quieras.
            </p>
          )}
          {etiquetas.length > 0 && <FiltrosEtiquetas etiquetas={etiquetas} elegidas={elegidas} onCambiar={setElegidas} />}
          {contenido}
        </main>
      </div>

      <BarraDeAbajo tokenSesion={sesion.tokenSesion}>
        {sesion.esIniciador && platosEnCarrito > 0 && (
          <Link
            to={`/mesa/${encodeURIComponent(token)}/pedido`}
            className="flex h-[60px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] bg-primario px-[18px]"
          >
            <img src={iconoBolsa} alt="" width={20} height={20} />
            <span className="flex flex-col whitespace-nowrap">
              <span className="text-[15px] font-semibold text-texto-boton">Ver mi pedido ({platosEnCarrito})</span>
              <span className="text-[13px] text-linea">{precio(total)}</span>
            </span>
          </Link>
        )}
      </BarraDeAbajo>
    </div>
  );
};
