# Riesgos legales por gravedad

Asesor legal · primera corrida (antes del código) · sáb 21 nov 2026
**No reemplaza a un abogado.** Cada punto sin fuente verificable dice "confirmar con abogado" y no es certeza.
`docs/marketing/` ya se revisó (correcciones al final de `puede-y-no-puede-decir.md`). `docs/negocio/agua.md` aún no existía: se revisa en la segunda corrida, antes de congelar.

## ALTO

### A1. Afirmaciones de salud sobre el agua
**Riesgo.** Que la app, la voz o el deck den a entender que el agua se puede tomar. Si alguien se confía y se enferma, hay daño real y responsabilidad. También es información engañosa al consumidor.
**Marco.** Art. 117 de la Constitución (información adecuada y no engañosa). "Potable" lo define la Resolución SG-018-98, Normas Sanitarias de Calidad del Agua Potable (Gaceta Oficial 36.395, 13-02-1998; FAOLEX la lista como no derogada, vigencia actual sin confirmar en Gaceta). Publicidad engañosa: art. 17 de la Ley Antimonopolio (Gaceta 40.549, 26-11-2014), según fuente secundaria. Texto exacto, sanciones y Ley Orgánica de Precios Justos de 2015: **confirmar con abogado**.
**Qué hacer.**
- Aplicar `puede-y-no-puede-decir.md` completo. Aviso fijo en cada resultado.
- Verde dice "En rango", nunca "bien". Sin semáforo general tranquilizador.
- Calidad busca las palabras prohibidas antes de cada compuerta.
- Los umbrales del Especialista de agua pasan por Legal antes de llegar a la app.

### A2. Prueba de bacterias (frasco)
**Riesgo.** Falso negativo: el frasco no cambia y la familia toma agua con bacterias. Falso positivo: alarma sin base. Además, un frasco que cambió contiene bacterias cultivadas.
**Qué hacer.**
- Usar literal los textos (e) de `textos.md`. "Sigue igual" nunca en verde.
- Instrucciones del sobre: no abrir el frasco después de la prueba, no tomar el líquido, lejos de los niños, cómo desecharlo según el fabricante.
- Confirmar con el instructivo del frasco real: horas, temperatura y color. Hasta entonces el texto dice "orientativa".
- No decir "E. coli" como resultado; solo "bacterias coliformes, posible presencia".

### A3. Plomo y cobre
**Riesgo.** Un "tiene plomo" asusta sin prueba; un "no tiene plomo" tranquiliza sin base. Estudio publicado (Environmental Science & Technology, 2021): las tiras caseras pueden no detectar plomo en partículas.
**Qué hacer.** Solo "posible presencia; confirma con un laboratorio" y "la tira no marcó presencia; puede no detectar cantidades bajas". Nunca efectos en la salud atados al resultado.

### A4. Datos personales en una demo pública
**Riesgo.** La URL es pública y pide nombre, WhatsApp y dirección de casa. El panel del operador los muestra todos, detrás de un PIN simple y sobre un proyector.
**Marco.** Art. 28 de la Constitución (derecho a acceder a los datos propios, saber su uso y finalidad, y pedir actualizarlos, rectificarlos o destruirlos; habeas data) y art. 60 (honor, vida privada, intimidad; límite al uso de la informática). **No hay ley general de protección de datos ni autoridad de datos** (DLA Piper, actualizado dic. 2022; DataGuidance). Los principios los fijó la Sala Constitucional del TSJ, sentencia 1318 de agosto de 2011: consentimiento previo, libre, informado y revocable; legalidad; finalidad; conservación limitada; exactitud; seguridad y confidencialidad; responsabilidad. Que no se haya aprobado una ley entre 2023 y 2026, el procedimiento de habeas data (Ley Orgánica del TSJ) y los delitos de la Ley Especial contra los Delitos Informáticos: **confirmar con abogado**.
**Qué hacer.**
- Casilla (a) desmarcada y obligatoria; aviso (b) enlazado; guardar `consentimiento_fecha`.
- En la demo, usar datos inventados. Línea "puedes usar datos de prueba" bajo la casilla.
- **Desarrollo:** toda ruta que liste hogares o pedidos, y el canal `/api/eventos`, exigen el PIN del operador. El teléfono de un cliente nunca recibe datos de otro hogar.
- Identificadores de hogar y de resultado no adivinables (UUID), no 1, 2, 3.
- PIN largo, fuera del repo, con límite de intentos.
- A la visión se envía **solo la foto**, sin nombre, teléfono ni dirección. Quitar los metadatos de la foto (ubicación GPS) antes de guardarla o enviarla.
- Nada de datos personales en registros del servidor, en la URL ni en el repo. Semillas inventadas.
- Completar `[RESPONSABLE]`, `[CONTACTO]`, `[PROVEEDOR]` y `[FECHA]`. Borrar los datos de la demo en esa fecha.
- Vista por zonas: solo agregada. Si una zona tiene pocos hogares, no mostrar nada que permita ubicar una casa.

## MEDIO

### M1. Marca Grimuca, logo y diseño extraído de grimuca.com
**Supuesto a confirmar:** el equipo dice tener relación con la marca. No hay constancia escrita en el proyecto.
**Riesgo.** Repositorio público y demo con nombre, logo y tiendas de un tercero. El jurado revisa licencias; el titular podría objetar. Marco: Ley de Propiedad Industrial de 1955 (Gaceta 25.227), que el SAPI aplica desde 2008. Si la marca está registrada y a nombre de quién: **confirmar con abogado**.
**Qué hacer.**
- Conseguir **antes de la entrega** una autorización escrita (correo o mensaje) del titular: uso del nombre, logo y tiendas en la demo, el deck y el repositorio público. Guardarla fuera del repo.
- En `LICENCIAS.md` y el README: "El nombre y los logos de Grimuca son de su titular y no están cubiertos por la licencia del código."
- En el deck: "Proyecto de hackatón con autorización de Grimuca" (solo si la hay).
- Sin autorización: quitar logos del repo público y presentar como "piloto propuesto para Grimuca".

### M2. Venta y envío de kits de prueba de agua
**Riesgo.** No se encontró fuente que diga si las tiras y el frasco de bacterias requieren registro sanitario o permiso. La Resolución 263 del Ministerio de Salud (Gaceta 40.676, 05-06-2015) lista productos que **no** requieren registro sanitario, pero no se pudo ver si incluye estos. No son medicamentos ni pruebas sobre muestras humanas, lo que apunta a que no, **sin certeza**.
**Confirmar con abogado (o con el SACS):** registro o notificación sanitaria; permisos de importación y aduana (SENIAT) para reactivos comprados en Alibaba; rotulado en español (SENCAMER); envío de reactivos y de un medio de cultivo por mensajería; si los filtros para agua de consumo requieren registro propio.
**Qué hacer ahora.**
- En la demo no se vende ni se envía nada: pago simulado, rotulado (texto f).
- En el deck, una línea en riesgos: "Permisos sanitarios y de importación del kit: en revisión."
- No decir "aprobado", "registrado" ni "certificado" sobre el kit.

### M3. Alertas por zona y señalamientos a terceros
**Riesgo.** "El agua de Naguanagua está contaminada" es una acusación pública contra el servicio de agua, basada en tiras caseras. Posible responsabilidad por información falsa o alarmante: **confirmar con abogado**. Igual con las empresas de botellón.
**Qué hacer.**
- La vista de zonas vive solo en el panel del operador, con PIN.
- Texto: "3 o más hogares con resultados fuera de rango en 7 días", nunca "agua contaminada".
- Si se hace el aviso a vecinos: "Varios hogares de tu zona reportaron resultados fuera de rango. Te sugerimos medir tu agua." Solo a quien dio su consentimiento, sin nombrar hogares.
- No nombrar a Hidrocentro ni a marcas de botellón.

### M4. La promesa comercial
**Riesgo.** "Agua de calidad, monitoreada y permanente" promete más de lo que el producto hace hoy.
**Qué hacer.** Usar las versiones matizadas de `puede-y-no-puede-decir.md` (sección del deck).

### M5. Fotos y materiales de terceros
**Riesgo.** Fotos de Amazon, Alibaba o fabricantes (tiras, tablas de colores, filtros) y videos de instrucciones tienen dueño. Marco: Ley sobre el Derecho de Autor (Gaceta 4.638 Extraordinario, 1993). Alcance y excepciones: **confirmar con abogado**.
**Qué hacer.**
- Fotos propias (Tulio, el domingo) o marcadores dibujados. Ninguna imagen bajada de una tienda en el repo ni en el deck.
- Los valores de la tabla de colores son datos y se pueden usar; la **imagen** de la tabla del fabricante no se copia. La tabla impresa del sobre la entrega el proveedor o se rediseña.
- Marcas ajenas solo en texto, para identificar, sin logo.
- Video del QR: grabado por el equipo.

### M6. Propiedades de los filtros
**Riesgo.** Afirmar que un cartucho corrige algo sin respaldo del fabricante.
**Qué hacer.** "Pensado para reducir X (según el fabricante)". Catálogo marcado como ejemplo hasta que llegue el real. Sin ficha, sin afirmación.

## BAJO

### B1. Licencias open source
**Estado.** Archivo (Omnibus-Type) y Source Sans 3 (Adobe): SIL Open Font License 1.1, verificado en sus repositorios y en Font Squirrel. Dependencias previstas (React, Vite, Tailwind, Fastify, zod, Vitest: MIT; Playwright: Apache 2.0; PostgreSQL: licencia propia permisiva): a confirmar con el inventario real.
**Qué hacer (con Calidad).**
- Copiar el texto de la OFL y el aviso de derechos junto a cada fuente (`OFL.txt`).
- Usar los archivos de fuente originales, sin modificar. Ambas tienen nombre reservado ("Archivo", "Source"): una versión recortada o alterada no puede conservar el nombre. Si las fuentes de `grimuca-design/` vienen recortadas del sitio, reemplazarlas por las oficiales.
- `LICENCIAS.md` generado desde las dependencias reales, con nombre, versión y licencia. Conservar avisos de derechos; en Apache 2.0, también el archivo NOTICE si existe.
- Ninguna dependencia GPL o AGPL en lo que se despliega. Si aparece una, avisar antes de integrarla.
- Elegir licencia para el código propio (sugerida: MIT) y poner el archivo en la raíz. Decisión de Leonardo.
- ElevenLabs: revisar si el plan usado permite uso comercial y si exige atribución (no verificado).

### B2. Reglas del hackatón
**Estado.** No se encontraron bases públicas de ValenValley 2026. Se trabaja con lo que dice el encargo: open source permitido; el jurado revisa repositorio y licencias; cierre el domingo a las 5:00 p.m.
**Confirmar con los organizadores:** si el código o diseño hecho antes del evento debe declararse; si hay que declarar herramientas y servicios externos usados; quién queda con los derechos del proyecto. Si las bases piden una declaración, se responde con la verdad.
**Qué hacer.** Repositorio sin secretos, con licencia, `LICENCIAS.md` y README honesto: qué es simulado (pago, envío, catálogo) y qué funciona.

### B3. Venta real, después del hackatón
Fuera de la demo. Para vender de verdad: facturación y IVA (SENIAT), precios en bolívares y divisas, garantías y devoluciones, condiciones de envío. Todo **confirmar con abogado** antes del primer cobro.

## Antes de entregar (lista corta)

1. Autorización escrita de Grimuca (M1).
2. Marcadores `[RESPONSABLE]`, `[CONTACTO]`, `[PROVEEDOR]`, `[FECHA]` completos (A4).
3. Rutas del operador y `/api/eventos` con PIN; identificadores no adivinables (A4).
4. Búsqueda de palabras prohibidas en cero (A1).
5. Textos (d), (e) y (f) literales en pantalla (A1, A2).
6. `OFL.txt`, `LICENCIAS.md` y licencia del código en el repo (B1).
7. Ninguna foto de terceros en repo ni deck (M5).

## Fuentes consultadas (21 nov 2026)

- Normas Sanitarias de Calidad del Agua Potable, ficha FAOLEX: https://leap.unep.org/en/countries/ve/national-legislation/resolucion-ndeg-sg-01898-normas-sanitarias-de-calidad-del-agua
- Protección de datos en Venezuela, DLA Piper (dic. 2022): https://www.dlapiperdataprotection.com/?c=VE&t=law
- DataGuidance, Venezuela: https://www.dataguidance.com/taxonomy/term/176
- Resolución 263, Gaceta 40.676 (texto parcial): https://www.legiscomex.com/BancoMedios/Documentos%20PDF/res_263.pdf
- Ley Antimonopolio, Decreto 1.415: https://alertas.directoriolegislativo.org/wp-content/uploads/2021/05/VEN.-Ley-Antimonopolio.pdf
- Comentario sobre publicidad engañosa y art. 17: https://ojs.urbe.edu/index.php/boletin_juridico/article/download/2912/4540/5769
- Ley de Precios Justos 2015 (nota de Norton Rose): https://www.nortonrosefulbright.com/-/media/files/nrf/nrfweb/imported/nueva-ley-orgnica-de-precios-justos-pdf-111kb.pdf?la=es-es
- Perfil de Venezuela en OMPI (propiedad industrial y derecho de autor): https://www.wipo.int/wipolex/es/members/profile/VE
- Plomo en pruebas caseras, Environmental Science & Technology: https://pubmed.ncbi.nlm.nih.gov/33428401/
- Pruebas caseras frente a laboratorio, SFPUC: https://www.sfpuc.gov/accounts-services/water-quality/understanding-your-tap-water/home-test-kits
- Archivo, licencia: https://www.fontsquirrel.com/license/archivo
- Source Sans, repositorio de Adobe: https://github.com/adobe-fonts/source-sans

No verificado en fuente primaria: texto de la sentencia 1318, texto del art. 17 de la Ley Antimonopolio, anexo de la Resolución 263, vigencia actual de la Resolución SG-018-98, nombre reservado exacto de Source Sans 3, bases del hackatón.
