# Componentes de Grimuca Agua

Carpeta: `app/src/components/grimuca/`. Se importa todo desde el índice:

```tsx
import { Pantalla, Boton, Semaforo } from '../../components/grimuca';
```

- El índice ya importa `grimuca.css`. Antes debe estar cargado `tokens.css` de forma global (una sola vez, en `main.tsx`).
- Solo dependen de `react` y `react-router-dom` v6 (deben renderizarse dentro del enrutador).
- `Boton`, `Campo` y `Casilla` aceptan además los atributos nativos de su elemento (`onClick`, `type`, `disabled`, `value`, `onChange`, `required`, `name`…).
- Todos aceptan `className` para ajustes de posición.

## Tabla

| Componente | Props (las obligatorias en **negrita**) | Ejemplo |
|---|---|---|
| `Pantalla` | **children**, `ancho` ('cliente' \| 'operador'), `encabezado`, `conBarra`, `barra` (props de la barra) | `<Pantalla barra={{ cantidadLista: 2 }}>…</Pantalla>` |
| `Encabezado` | `variante` ('cliente' \| 'operador'), `rutaInicio`, `rutaAtras`, `titulo`, `acciones`, `children` | `<Encabezado variante="operador" titulo="Panel de despacho" acciones={<Insignia tono="ok" punto>En vivo</Insignia>} />` |
| `BarraInferior` | `rutaResultados`, `enlaceWhatsApp`, `cantidadLista` | `<BarraInferior cantidadLista={lista.length} />` |
| `Boton` | **children**, `variante` ('primario' \| 'secundario' \| 'sobreAzul'), `cargando`, `textoCargando`, `anchoCompleto`, `icono`, `a` (ruta interna), `href` (externo), `disabled` | `<Boton type="submit" cargando={guardando} anchoCompleto>Guardar y seguir</Boton>` |
| `BotonRecordatorio` | **texto**, **evento** (`{ titulo, descripcion, fecha: 'AAAA-MM-DD', url }`), `confirmacion` (p. ej. `WhatsAppSimulado`), `alCrear`, `anchoCompleto` | `<BotonRecordatorio texto="Recuérdame cuándo hacer mi próxima medición" evento={eventoProximaMedicion(medicion.fecha)} />` |
| `Campo` | **etiqueta**, `como` ('input' \| 'select' \| 'textarea'), `opciones` y `marcador` (solo select), `ayuda`, `error`, `opcional` | `<Campo como="select" etiqueta="Zona" marcador="Elige tu zona" opciones={zonas} value={zona} onChange={(e) => setZona(e.target.value)} error={errores.zona} />` |
| `Casilla` | **children**, `error`, `checked`, `onChange` | `<Casilla checked={acepta} onChange={(e) => setAcepta(e.target.checked)}>Acepto el <Link to="/privacidad">aviso de privacidad</Link></Casilla>` |
| `Chip` | **children**, `activo`, `a` (ruta: se vuelve pestaña), `exacto`, `onClick`, `disabled` | `<Chip activo={origen === 'chorro'} onClick={() => setOrigen('chorro')}>Chorro</Chip>` |
| `Insignia` | **children**, `tono` ('ok' \| 'error' \| 'aviso' \| 'azul' \| 'oscuro' \| 'neutro'), `punto` | `<Insignia tono="aviso">Simulación</Insignia>` |
| `Semaforo` | **nivel** ('verde' \| 'amarillo' \| 'rojo' \| 'sin_dato'), `palabra`, `tamano` ('normal' \| 'grande') | `<Semaforo nivel="amarillo" tamano="grande" />` |
| `ListaParametros` | **children** | `<ListaParametros>{filas}</ListaParametros>` |
| `FilaParametro` | **nombre**, **nivel**, `valor`, `unidad`, `frase`, `orientativo` | `<FilaParametro nombre="Cloro" valor={3} unidad="mg/L" nivel="rojo" frase="Hay mucho cloro: por eso el sabor." />` |
| `TarjetaProducto` | **nombre**, `codigo`, `marca`, `precioUsd`, `motivo`, `corrige`, `imagen`, `esEjemplo`, `destacado`, `enLista`, `cargando`, `alAgregar`, `alQuitar` | `<TarjetaProducto nombre={c.nombre} precioUsd={c.precio_usd} motivo="Para bajar el cloro" destacado esEjemplo alAgregar={() => agregar(c)} />` |
| `TarjetaTienda` | **nombre**, `horario`, `direccion`, `abierta`, `cifras`, `extra`, `acciones`, `children`, `seleccionada` | `<TarjetaTienda nombre="Mañongo" horario={t.horario} extra={<Insignia tono="azul">Más cercana</Insignia>} />` |
| `ListaPedidos` | **children**, `etiqueta` | `<ListaPedidos etiqueta="Pedidos de Mañongo">{filas}</ListaPedidos>` |
| `FilaPedido` | **tipo** ('sobre' \| 'cartucho'), **descripcion**, **zona**, **modalidad** ('retiro' \| 'envio'), **hora**, `direccion`, `estado`, `nuevo`, `despachando`, `alDespachar` | `<FilaPedido tipo="sobre" descripcion="Sobre de medición" zona="Naguanagua" modalidad="envio" hora="9:42 a. m." nuevo alDespachar={() => despachar(p.id)} />` |
| `Pasos` | **pasos** (`{ titulo, detalle?, contenido? }[]`), `actual` (índice desde 0), `etiqueta` | `<Pasos pasos={pasosMedir} actual={2} etiqueta="Cómo medir tu agua" />` |
| `Temporizador` | `espera` (s), `ventana` (s), `autoIniciar`, `alCambiarFase` | `<Temporizador espera={30} ventana={30} alCambiarFase={setFase} />` |
| `Aviso` | **children**, `titulo`, `tono` ('info' \| 'atencion' \| 'error' \| 'ok'), `rol` | `<Aviso tono="atencion">No pudimos leer la foto.</Aviso>` |
| `AvisoTira` | — | `<AvisoTira />` |
| `BandaCifras` | **cifras** (`{ valor, etiqueta, detalle? }[]`), `etiqueta` | `<BandaCifras cifras={[{ valor: 30, etiqueta: 'Hogares' }]} />` |
| `CajonLista` | **abierto**, **alCerrar**, **articulos**, `alCambiarCantidad`, `alQuitar`, `maximo`, `titulo`, `aviso`, `pie`, `vacio` | `<CajonLista abierto={abierto} alCerrar={() => setAbierto(false)} articulos={lista} pie={<Boton a="/lista" anchoCompleto>Seguir con el pedido</Boton>} />` |
| `ListaArticulos` | **articulos** (`{ id, nombre, detalle?, cantidad, precioUsd? }[]`), `alCambiarCantidad`, `alQuitar`, `maximo` | `<ListaArticulos articulos={lista} alCambiarCantidad={cambiar} alQuitar={quitar} />` |
| `Toast` | **mensaje**, **visible**, `alCerrar`, `accion` (`{ etiqueta, alPulsar }`), `duracionMs` | `<Toast visible={hayAviso} mensaje="Agregado a tu lista" alCerrar={() => setHayAviso(false)} accion={{ etiqueta: 'Ver mi lista', alPulsar: abrirCajon }} />` |
| `WhatsAppSimulado` | **de**, **mensaje** (texto o lista: una burbuja por elemento), `para`, `hora` (texto o fecha; por defecto ahora), `variante` ('tarjeta' \| 'toast'), `titulo`, `alCerrar`, `duracionMs` (toast; 6000) — no envía nada, siempre muestra "Simulación: en la demo no se envía un WhatsApp real." | `<WhatsAppSimulado variante="toast" titulo="WhatsApp simulado enviado a Ana" de="Grimuca Mañongo" para="Ana" mensaje={texto} alCerrar={() => setAviso(null)} />` |
| `Cargando` | `texto`, `variante` ('giro' \| 'esqueleto'), `lineas`, `pantalla` | `<Cargando texto="Leyendo tu tira…" pantalla />` |
| `EstadoVacio` | **titulo**, `children`, `icono`, `accion`, `tono` ('vacio' \| 'error') | `<EstadoVacio titulo="Todavía no has medido tu agua" accion={<Boton a="/medir">Medir ahora</Boton>} />` |
| `Icono` | **nombre**, `tamano`, `titulo` | `<Icono nombre="camara" tamano={20} />` |

Constantes: `TEXTO_AVISO_TIRA`, `PALABRA_SEMAFORO`, `WHATSAPP_MARCADOR`, `LOGO_BLANCO`, `LOGO_AZUL`. Utilidades: `formatoUsd(9)` → `$9,00`, `unir(...)`.

## Clases de apoyo (en `grimuca.css`)

| Clase | Para qué |
|---|---|
| `g-h1`, `g-h2`, `g-h3`, `g-h4` | Títulos en Archivo y azul. Tailwind borra el estilo de los `h1`–`h4`: hay que ponerlas. |
| `g-kicker`, `g-apagado`, `g-enlace`, `g-cifra` | Antetítulo, texto secundario, enlace subrayado, cifras tabulares. |
| `g-pila`, `g-pila--amplia` | Columna con separación de 16px o 24px entre hijos. |
| `g-grupo` + `g-chips` | `fieldset` sin borde con su `legend`, y fila de chips que salta de línea. |
| `g-pestanas` | Franja gris de pestañas del operador (dentro de `Encabezado`, con `Chip a="…"`). |
| `g-rejilla-tiendas` | 3 columnas de tarjetas de tienda en escritorio, 1 en teléfono. |
| `g-tabla`, `g-tabla__numero` | Tablas del operador; la segunda alinea números a la derecha. |
| `g-sobre-azul` | Sobre fondo azul: cambia el color del foco a amarillo. |
| `g-solo-lector` | Texto solo para lectores de pantalla. |

## Recetas

```tsx
// Opciones de una sola elección (perfil)
<fieldset className="g-grupo">
  <legend>¿De dónde viene el agua que toman?</legend>
  <div className="g-chips">
    {origenes.map((o) => (
      <Chip key={o.valor} activo={origen === o.valor} onClick={() => setOrigen(o.valor)}>{o.etiqueta}</Chip>
    ))}
  </div>
</fieldset>

// Marco del operador con pestañas
<Pantalla
  ancho="operador"
  encabezado={
    <Encabezado variante="operador" rutaInicio="/operador/resumen" titulo="Panel de despacho" acciones={conexion}>
      <nav className="g-pestanas" aria-label="Secciones">
        <Chip a="/operador/resumen">Resumen</Chip>
        <Chip a="/operador/despacho">Despacho</Chip>
        <Chip a="/operador/inventario">Inventario</Chip>
        <Chip a="/operador/zonas">Zonas</Chip>
      </nav>
    </Encabezado>
  }
>
  …
</Pantalla>

// Paso 3 de /medir con el temporizador
<Pasos actual={paso} pasos={[
  { titulo: 'Llena un vaso', detalle: 'Con el agua que toman en la casa.' },
  { titulo: 'Moja la tira', detalle: 'Una gota en cada casilla.' },
  { titulo: 'Espera 30 segundos', contenido: <Temporizador /> },
  { titulo: 'Toma la foto', detalle: 'Con la tira al lado de la tabla de colores.' },
]} />
```

## Notas

- **Un solo `Boton` primario por pantalla.** En listas de tarjetas, solo la que lleva `destacado`.
- `Boton` con `cargando` queda bloqueado (no se puede enviar dos veces).
- `Boton` con `href` y el acceso de WhatsApp abren pestaña nueva.
- `Temporizador` llama a `alCambiarFase` también al montarse (con `'detenido'`).
- `Toast`: montarlo dentro de `Pantalla` (toma de ahí la altura de la barra inferior). No se ve por encima de un `CajonLista` abierto.
- `CajonLista` usa `dialog.showModal()`: atrapa el foco y cierra con Escape sin código extra.
- `Pasos` usa los títulos como clave: no repetir títulos dentro de una misma lista.
- Las animaciones solo corren si el sistema no pide reducir movimiento.
