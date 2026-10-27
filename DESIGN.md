# Dirección visual de Chit&Go

Esta es la dirección visual del front, pasada en limpio desde el Mockup de Figma para tenerla a mano mientras se programa. Si una pantalla no está en el Mockup, se arma con estas reglas.

- **Fuente:** [Chit&Go · Mockup](https://www.figma.com/design/DrVhidfo6A0KEWhTJyURGN), página "Wireframes · MVP 1". Es la Opción A, "Minimalismo emocional", que el grupo eligió el 30/09, con la paleta Chocolate y Menta que se eligió el 09/10.
- **Pantallas de donde salen las medidas:** P-01 (menú), P-02 (carrito), P-04, P-04b y P-04c (login con PIN), P-12 (login de Admin), P-08 (cola de Caja), la portada de la Opción A y el tablero "Paleta · Chocolate y Menta".
- **Si el Mockup choca con un requisito o con el contrato de la API, gana el requisito.** Los choques que ya se encontraron están al final, en "Para decidir".
- **Los datos del Mockup son de ejemplo** (María, Ana García, Mesa 12, $ 28.000, los platos). No van al código como si fueran reales.

Dial: ENERGY 1 / RHYTHM 2 / MOTION 1 (propuesta; falta que la confirme el grupo)

Lectura: app de pedidos para un restaurante, con dos públicos (el cliente con su celular y el personal en su puesto), en un estilo de minimalismo cálido: la personalidad está en la tipografía y en las ilustraciones, no en el color ni en el movimiento.

## Principios

Están escritos en la portada de la Opción A:

1. Jerarquía por tipografía, no por cajas: títulos en Fraunces y texto en Inter.
2. Mucho aire: márgenes de 24 px y líneas finas para separar, en vez de tarjetas.
3. Calidez sin color: ilustraciones de línea y textos en tono humano ("¿Con qué arrancamos?").
4. La acción principal es un botón oscuro; la secundaria, un botón con borde; un enlace va subrayado.
5. Lo tocable se reconoce por el borde, el relleno oscuro o el subrayado. Lo que solo informa no tiene borde.
6. Todo ícono lleva texto. La única excepción son los botones − y + de cantidad, que van al lado del rótulo "Cantidad".
7. Los estados se dicen con texto e ícono ("No disponible", "Espera +3 min"), nunca solo con un gris o una sombra.
8. El orden de lectura es el orden en pantalla: encabezado, contenido y barra de abajo.

## Color

Son ocho variables, cargadas en Figma en la colección "Chit&Go · Paleta". No se usa ningún otro color.

| Token | HEX | Para qué |
|---|---|---|
| `fondo` | `#F6F5F2` | Fondo de pantalla |
| `tarjeta` | `#FFFFFF` | Campos, barra de abajo del cliente, opción elegida de un selector, avisos |
| `linea` | `#E4E0DA` | Divisores de 1 px, teclas del PIN, etiquetas neutras, menú lateral, notas, barra de avisos, lugar de la foto del plato |
| `texto` | `#2A211D` | Texto principal e íconos |
| `secundario` | `#6E635C` | Texto de apoyo y **bordes de campos, chips y tarjetas tocables** |
| `primario` | `#4B3027` | Botón principal, borde del botón secundario, contadores, etiqueta de alerta, lo elegido |
| `texto-boton` | `#FFFFFF` | Texto e íconos sobre `primario` |
| `suave` | `#DCEDE4` | Chip de filtro elegido y etiqueta "Menú del día" |

- **No hay rojo ni verde.** Un error o una alerta se marca con `primario`, ícono y texto, como en P-04c.
- **`linea` no sirve como único borde de un campo:** contra la tarjeta da 1.3:1 y WCAG pide 3:1. Los campos, chips y tarjetas tocables llevan borde `secundario`, que da 5.8:1.
- Contraste medido (WCAG AA): `texto` sobre `fondo` 14.4:1; `secundario` sobre `fondo` 5.4:1 y sobre `tarjeta` 5.8:1; `texto-boton` sobre `primario` 12:1; `texto` sobre `suave` 13:1.
- Sobre `primario`, el texto de apoyo va en `linea` (por ejemplo "$ 28.000" debajo de "Ver mi pedido").
- El fondo oscuro detrás de un diálogo es negro con transparencia. Es lo único que no sale de las variables.

## Tipografía

**Fraunces SemiBold** para títulos, con los ejes variables `"SOFT" 0, "WONK" 1`, e **Inter** para todo lo demás. El interlineado es el normal de cada fuente.

| Uso | Fuente | Tamaño | Peso | Ejemplo |
|---|---|---|---|---|
| Título de bienvenida (escritorio) | Fraunces | 42 | SemiBold | "Tu local, en orden." (P-12) |
| Título de pantalla en el celular, marca en los logins | Fraunces | 30 | SemiBold | "¿Con qué arrancamos?" (P-01) |
| Título de pantalla en tablet y escritorio | Fraunces | 25 | SemiBold | "Cola de aprobación" (P-08) |
| Sección, plato destacado, detalle, total | Fraunces | 20 | SemiBold | "Principales", "$ 28.000" |
| Teclas del PIN | Inter | 24 | SemiBold | |
| Bajada de bienvenida (escritorio) | Inter | 17 | Regular | |
| Nombre de plato o de ítem | Inter | 16 | SemiBold | "Bife de chorizo", "Mesa 07 · #4" |
| Botones, precios, pestaña elegida | Inter | 15 | SemiBold | "Agregar", "$ 14.500" |
| Texto de campo, pestaña sin elegir, bajada del login | Inter | 15 | Regular | |
| Rótulo de campo, chip elegido, ítem activo del menú | Inter | 13 | Medium | "Email", "Todo" |
| Texto de apoyo, chips sin elegir | Inter | 13 | Regular | "Con guarnición a elección" |
| Etiquetas de estado, texto debajo de un ícono | Inter | 12 | Medium | "Menú del día", "Llamar al mozo" |
| Encabezado de tabla y grupo de la cola | Inter | 11 | SemiBold, mayúsculas, espaciado 0.66 px | "ÍTEM", "SIGUIENTE" |

Las mayúsculas con espaciado van **solo** en encabezados de tabla y en los rótulos de grupo de la cola de Caja. En títulos y rótulos de sección no se usan.

## Espacio y forma

- Márgenes laterales: 24 px en el celular. En el login con PIN, 28 px.
- Separación entre bloques: 20 px en el celular y 16 px en tablet y escritorio. Entre la foto y el texto de una fila, 12 px; entre chips, 8 px; entre el rótulo y su campo, 6 px.
- Menú lateral de Caja: 208 px de ancho.
- **Sin sombras.** Ninguna de las pantallas revisadas usa sombra: la jerarquía sale del borde, del relleno y de la tipografía.

| Radio | Dónde |
|---|---|
| 6 px | Etiquetas de estado, casilla de verificación |
| 9 a 12 px | Campos (12), selector segmentado (12 por fuera, 9 la opción), ítems del menú lateral (10) |
| 14 px | Botones, tarjetas tocables, avisos, notas, foto del plato, barra de avisos |
| 16 px | Teclas del PIN |
| Pastilla | Solo chips de filtro y contadores |

| Borde | Dónde |
|---|---|
| 1 px `secundario` | Chip sin elegir, tarjeta tocable |
| 1.25 px `secundario` | Campo de texto y desplegable |
| 1.5 px `primario` | Botón secundario, aviso de error, opción elegida de un selector, ítem activo del menú lateral |
| 2.5 px `primario` | Tarjeta elegida (el pedido abierto en la cola de Caja) |
| 1 px `linea` | Divisores y borde de arriba de la barra inferior |

## Tamaños para tocar

- Todo lo tocable mide **44 px o más**.
- Acciones principales y teclados: 48 a 60 px. Botón principal: 48 px en Caja, 52 a 56 px en los logins y 60 px en la barra de abajo del cliente.
- Teclas del PIN: 88 × 60 px. Campo: 48 px de alto. Chip: 44 px. Fila de tabla: 48 px.

## Componentes

- **Botón principal:** relleno `primario`, texto `texto-boton` Inter SemiBold 15, ícono de 20 px a la izquierda que dice qué hace (✓ para aprobar, bolsa para ver el pedido, avión para enviar, flecha para "Ingresar"). Radio 14.
- **Botón secundario:** sin relleno, borde 1.5 px `primario`, texto e ícono `primario`.
- **Enlace:** texto subrayado, Inter SemiBold. Si es un botón de texto, igual mide 44 px de alto ("No soy Juan: elegir otro nombre", "Cambiar de usuario").
- **Campo:** fondo `tarjeta`, borde 1.25 px `secundario`, radio 12, alto 48, ícono de 18 px a la izquierda si ayuda (sobre para el email, candado para la contraseña). Rótulo arriba, Inter Medium 13.
- **Chip de filtro:** pastilla de 44 px. Sin elegir: borde 1 px `secundario`. Elegido: fondo `suave`, sin borde, con ícono ✓. Se pueden elegir varios (P-01c: "todas las etiquetas que elegiste").
- **Pestañas:** texto Inter 15; la elegida en SemiBold `texto` con una barra de 3 px debajo; las otras en Regular `secundario`.
- **Selector segmentado** ("Todos / Con alerta", "Normal / Alta"): contenedor `linea` con radio 12; la opción elegida en `tarjeta` con borde 1.5 px `primario` e ícono ✓.
- **Etiqueta de estado** (informa, no se toca; por eso no lleva borde): radio 6, ícono de 14 px y texto Inter Medium 12.
  - Neutra: fondo `linea` ("Sin TACC", "Disponible", "No disponible").
  - Destacada: fondo `suave` ("Menú del día").
  - Alerta: fondo `primario` con texto blanco ("+3 min", "Espera +3 min").
- **Contador:** pastilla `primario` con el número en blanco, Inter SemiBold 11.
- **Tarjeta tocable** (cola de Caja): borde 1 px `secundario`, radio 14, padding 12. Elegida: borde 2.5 px `primario`.
- **Aviso de error** (P-04c): fondo `tarjeta`, borde 1.5 px `primario`, radio 14, padding 12, ícono de alerta de 20 px y el texto en Inter SemiBold 15 `texto`.
- **Nota informativa:** fondo `linea`, radio 14, padding 14, ícono "i" de 20 px y texto Inter 13 (P-12, P-02).
- **Mensaje breve** (P-01e, "Ya avisamos al mozo."): fondo `primario`, texto blanco y ícono ✓, apoyado sobre la barra de abajo. El botón que lo disparó cambia de estado ("✓ Mozo avisado").
- **Barra de abajo del cliente:** fondo `tarjeta` con borde superior `linea`. A la izquierda, "Llamar al mozo" (botón secundario de 108 × 60 px con ícono arriba y texto abajo). A la derecha, la acción principal de la pantalla ("Ver mi pedido (3)" con el total, "Enviar pedido").
- **Menú lateral** (Caja y Admin): fondo `linea`, ítems de 44 px con ícono y texto, el activo en `tarjeta` con borde `primario`. Abajo: nombre, rol y turno, "Cambiar de usuario" y "Cerrar turno".
- **Barra de avisos** (Caja y Cocina): fondo `linea`, 60 px de alto, abajo de todo. Lleva campanita, "Avisos", contador, el último aviso y su acción.
- **Teclado del PIN:** grilla de 3 columnas, teclas `linea` sin borde, radio 16; abajo a la izquierda, vacío; "Borrar" con ícono y texto. El avance se muestra con círculos llenos o vacíos y el texto "2 de N dígitos".
- **Foto del plato:** si no hay imagen, un rectángulo `linea` con el ícono de plato en el centro.
- **Plato no disponible:** foto al 50 %, nombre y precio en `secundario`, etiqueta "No disponible" con ícono, y sin botón "Agregar".

## Íconos e ilustraciones

- Los íconos son un set propio del archivo (capas "ícono/…": check, plus, bell, bag, alert, info, ban, search, receipt, chef, box, logout y otros). Son de línea, del mismo trazo que las ilustraciones. **Se exportan como SVG desde Figma**, no se redibujan ni se reemplazan por los de otra librería.
- Tamaños: 14 px en etiquetas, 16 a 18 px en chips, campos y menú, 20 px en botones y 22 px en "Llamar al mozo".
- Ilustraciones de línea: "ilustración/hola" (la taza humeante del login con PIN y del login de Admin). La portada nombra también las de pedido en cocina, unir mesas y pantalla pública. Se exportan de Figma igual que los íconos.
- La marca es la palabra "Chit&Go" escrita en Fraunces. No hay un logo gráfico aparte.
- Sin emojis en la interfaz.

## Pantallas por dispositivo

| Rol | Dispositivo en el Mockup | Estructura |
|---|---|---|
| Cliente | Celular, 375 × 812 | Encabezado, contenido y barra fija abajo |
| Mozo | Celular, 375 × 812 | Igual; los avisos son una pestaña de la barra de abajo |
| Caja | Tablet, 1024 × 768 | Menú lateral, contenido y barra de avisos abajo |
| Cocina (KDS) | 1280 × 800 | Una sola cola y barra de avisos |
| Admin y Gerente/Dueño | Escritorio, 1280 × 800 | Menú lateral; el login va en dos paneles (bienvenida y formulario) |
| Pantalla pública | TV | Solo lectura: nada se toca |

El Mockup dibuja un solo tamaño por rol. En los otros anchos no puede haber scroll horizontal y todo lo tocable sigue midiendo 44 px.

## Voz y textos

- Se habla de vos y en tono cálido: "La cuenta la abriste vos: podés pedir", "Hola de nuevo. Ingresá tu PIN para empezar el turno.", "¿Quién empieza el turno?".
- Los mensajes de error van tal cual los traen las historias de usuario y el contrato de la API.
- Formatos:
  - Precio: "$ 9.800" (signo, espacio, punto de miles, sin centavos).
  - Mesa: "Mesa 12", sin "#". El pedido sí lleva "#": "Pedido #2".
  - Tiempo: "21:14", "hace 6 min", "+3 min".
  - Cantidades: "3 ítems", "4 platos".
- Disponibilidad: "No disponible" (decidido el 06/10). No van "Agotado hoy" ni "Dado de baja", aunque todavía aparezcan en el Mockup.
- Mayúsculas solo al principio de la oración ("Tu pedido", "Enviar pedido"), no en cada palabra.

## Estados

Toda pantalla que muestra datos tiene estado vacío, de carga y de error. El Mockup ya dibuja varios:

- Cliente: P-01c (sin platos con esas etiquetas), P-01d (la cuenta ya se cerró), P-01e (mozo avisado), P-02b (un plato ya no está disponible), P-03b a P-03f, P-35 (mesa no disponible) y P-35b (QR inválido).
- Login: P-04c (PIN incorrecto), P-04d (usuario bloqueado), P-32 y P-32b (usuario y contraseña del mozo) y P-30 (elegir PIN).
- Mozo: P-05c (sin mesas asignadas).
- Caja: P-08b a P-08f.

Un estado vacío dice por qué está vacío y ofrece la acción que lo resuelve (P-01c: "No hay platos con esas etiquetas" + "Quitar el filtro"). **Los estados de carga no están dibujados:** falta definirlos. Mientras tanto, un texto que diga qué se está cargando, con el estilo del texto de apoyo.

## Para decidir

El Mockup no es perfecto. Estas son contradicciones dentro del propio Mockup, o entre el Mockup y lo que se decidió, que tiene que cerrar el grupo:

1. **Marca en el menú del cliente:** en los logins y en el menú lateral, "Chit&Go" va en Fraunces; en el encabezado de P-01, en Inter SemiBold 16.
2. **PIN:** el Mockup muestra 4 círculos ("2 de 4 dígitos"), pero RNF-07 dice que el PIN tiene de 4 a 10 dígitos.
3. **Rol en la lista de nombres (P-04b):** el Mockup muestra el rol de cada persona y el contrato (`GET /public/staff/{token}`) no lo manda.
4. **"Recordarme" y "¿Olvidaste tu contraseña?" (P-12):** el back no tiene endpoint para ninguno de los dos, y el email no está en el alcance (`chit-go-endpoints-api`). Hasta que lo tengan, no se ponen: serían botones que no hacen nada.
5. **"Agotado hoy" (P-01):** va "No disponible".
6. **Prioridad al aprobar (P-08):** el Mockup pone el selector Normal/Alta en la aprobación, y HU-08 dice que la prioridad se pone sobre un pedido ya aprobado (P-36). La nota `chit-go-wireframes` ya lo marca para elegir uno.

## Para pasarlo a código

- Los colores ya están en `src/compartido/estilos/index.css` como tokens de Tailwind (`bg-fondo`, `text-texto`, `border-secundario`…). Falta `texto-boton`.
- Fraunces e Inter no están cargadas todavía. Fraunces se carga como fuente variable, con `font-variation-settings: "SOFT" 0, "WONK" 1` en los títulos.
- Los íconos y las ilustraciones se exportan como SVG desde Figma.
