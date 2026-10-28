import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Carta, Plato } from '../../../compartido/tipos/menu';
import { ItemCarrito } from '../../../compartido/tipos/carrito';
import {
  consultarMesa,
  entrarALaMesa,
  obtenerCarta,
  traducirError,
  type SesionMesa,
} from '../../../compartido/api/cliente';
import iconoBolsa from '../../../compartido/ui/iconos/bag.svg';
import iconoInfo from '../../../compartido/ui/iconos/info.svg';
import BarraDeAbajo from '../componentes/BarraDeAbajo';
import EncabezadoMesa from '../componentes/EncabezadoMesa';
import FiltrosEtiquetas from '../componentes/FiltrosEtiquetas';
import PestanasCategorias, { ID_PANEL_CATEGORIA } from '../componentes/PestanasCategorias';
import { FilaPlato, PlatoDestacado } from '../componentes/Platos';
import SinPlatos from '../componentes/SinPlatos';
import { cantidadDePlatos, precio } from '../formato';

type Entrada =
  | { estado: 'cargando' }
  | { estado: 'mesa-inexistente' } // P-35b
  | { estado: 'mesa-no-disponible'; numero: string } // P-35
  | { estado: 'error' }
  | { estado: 'lista'; numero: string; sesion: SesionMesa };

const PROBA_DE_NUEVO = 'Revisá la conexión y probá de nuevo.';

const botonPrincipal = 'h-12 w-full rounded-[14px] bg-primario text-[15px] font-semibold text-texto-boton';

// La carta no trae la lista de etiquetas: los chips salen de las que tienen los platos de la carta sin filtrar.
function etiquetasDe(carta: Carta): string[] {
  const todas = new Set(carta.categorias.flatMap((c) => c.platos.flatMap((p) => p.etiquetas)));
  return [...todas].sort((a, b) => a.localeCompare(b, 'es'));
}

// P-01 (iniciador), P-01b (modo lectura), P-01c (sin platos con esas etiquetas) y P-01e (mozo avisado).
export const PaginaMenuCliente: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const [entrada, setEntrada] = useState<Entrada>({ estado: 'cargando' });
  const [intentoEntrada, setIntentoEntrada] = useState(0);
  const [carta, setCarta] = useState<Carta | null>(null);
  const [errorCarta, setErrorCarta] = useState(false);
  const [intentoCarta, setIntentoCarta] = useState(0);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [categoriaElegida, setCategoriaElegida] = useState<number | null>(null);

  // Hasta la tarea 2 de la ST-07 el carrito vive en memoria: se pierde al ir a "Ver mi pedido" y volver.
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

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
        if (traducirError(err).motivo === 'mesa-inexistente') setEntrada({ estado: 'mesa-inexistente' });
        else setErrorCarta(true);
      });
    return () => {
      activo = false;
    };
  }, [token, mesaLista, elegidas, intentoCarta]);

  const handleAgregarAlCarrito = (producto: Plato) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.producto.id === producto.id);
      if (existe) {
        return prev.map((item) =>
          item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  if (entrada.estado !== 'lista') {
    return <PantallaDeEntrada entrada={entrada} onReintentar={() => setIntentoEntrada((n) => n + 1)} />;
  }

  const { numero, sesion } = entrada;
  const onAgregar = sesion.esIniciador ? handleAgregarAlCarrito : undefined;

  const platosEnCarrito = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const total = carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);

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

// Lo que se ve antes de la carta. Va con los tokens de la paleta, como el login; P-35 y P-35b no tienen botones.
function PantallaDeEntrada({
  entrada,
  onReintentar,
}: {
  entrada: Exclude<Entrada, { estado: 'lista' }>;
  onReintentar: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fondo p-6 font-inter text-texto">
      <div className="w-full max-w-sm text-center">
        <h1 className="titulo text-3xl text-primario">Chit&Go</h1>
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
              <button type="button" onClick={onReintentar} className={`mt-4 ${botonPrincipal}`}>
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
