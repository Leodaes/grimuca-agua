# Agua: umbrales, frases, cartuchos y límites de lo que decimos

Autor: Especialista de agua · sáb 21 nov 2026 · una sola corrida, antes del código.
Uso: `api/src/medicion/config/umbrales.ts`, textos de la pantalla de resultado, reglas de producto sugerido.
**Pendiente:** el Asesor legal revisa las secciones 2, 4 y 5 antes de que lleguen a la app.

Estado de cada dato:
- **confirmado** = lo contrasté hoy con la fuente o con una tabla que la cita.
- **verificar** = valor razonable pero sin contrastar hoy, o depende del empaque de la tira real.

---

## 1. Tabla de umbrales (semáforo por casilla)

Niveles de casilla: tira de referencia Qteeyou W-8 (insumo de Tulio, sáb 8:12 p.m.).
Tipo **salud** = hay valor guía sanitario. Tipo **operativo** = no hay valor sanitario; afecta sabor, tuberías y equipos.

| Clave | Unidad | Tipo | Casilla → color | Regla por valor (para cualquier tira) | Referencia | Estado |
|---|---|---|---|---|---|---|
| `alcalinidad` | mg/L (como CaCO3) | operativo | 0 amarillo · 40 verde · 80 verde · 120 verde · 180 verde · 240 amarillo | <40 amarillo; 40 a 180 verde; >180 amarillo. **Nunca rojo.** | Ni OMS ni EPA fijan valor. Rango operativo usual de tablas de tiras y control de corrosión (alcalinidad baja = agua agresiva con la tubería). | verificar |
| `dureza` | mg/L (como CaCO3) | operativo | 0 verde · 25 verde · 50 verde · 120 verde · 250 amarillo · 425 rojo | ≤180 verde; >180 a 300 amarillo; >300 rojo | OMS no propone valor sanitario. OMS: sabor del calcio entre 100 y 300 mg/L; sobre ~200 mg/L hay incrustación (sarro). Australia usa 200 mg/L como límite por sarro. | confirmado (cita indirecta de la OMS); corte de 300 para rojo: verificar |
| `cobre` | mg/L | salud | 0 verde · 0.2 verde · 0.5 verde · 1 amarillo · 2 rojo · 5 rojo | <1 verde; 1 a 1.3 amarillo; >1.3 rojo | OMS: 2 mg/L. EPA: nivel de acción 1.3 mg/L; estándar secundario 1.0 mg/L (sabor metálico, manchas verde azuladas). | confirmado |
| `nitrato` | mg/L (como NO3-) | salud | 0 verde · 10 verde · 25 amarillo · 50 rojo · 100 rojo · 250 rojo | <25 verde; 25 a <50 amarillo; ≥50 rojo | OMS: 50 mg/L como nitrato. EPA: 10 mg/L como nitrógeno (≈ 44 mg/L como nitrato). | confirmado. Verificar en el empaque si la tira lee "como NO3" o "como N" (si es como N, multiplicar por 4.43) |
| `cloro_libre` | mg/L | salud | 0 verde (ver nota) · 0.5 verde · 1 verde · 3 amarillo · 5 rojo · 10 rojo | <3 verde; 3 a 4 amarillo; >4 rojo | OMS: 5 mg/L para cloro libre; lo normal en agua de red es 0.2 a 1 mg/L. EPA: máximo residual 4 mg/L. | confirmado. Corte de amarillo en 3: verificar |
| `plomo` | ppb (µg/L) | salud | 0 verde · 5 amarillo · 15 rojo · 30 rojo · 50 rojo | 0 verde; >0 a 10 amarillo; >10 rojo | OMS: 10 µg/L (provisional). EPA: nivel de acción 15 µg/L y meta de salud cero. | confirmado |
| `ph` | unidades de pH | operativo | 6.2 amarillo · 6.8 verde · 7.2 verde · 7.6 a 8.4 verde · 8.8 amarillo | <6.5 amarillo; 6.5 a 8.5 verde; >8.5 amarillo. **Sin rojo en el rango de la tira.** | EPA estándar secundario: 6.5 a 8.5. OMS no propone valor sanitario. | confirmado. Casillas altas de la tira: verificar con el empaque |
| `nitrito` | mg/L (como NO2-) | salud | 0 verde · 1 amarillo · 5 rojo · 10 rojo · 20 rojo · 40 rojo | <1 verde; 1 a 3 amarillo; >3 rojo | OMS: 3 mg/L como nitrito. EPA: 1 mg/L como nitrógeno (≈ 3.3 mg/L como nitrito). | valor guía confirmado. Casillas de la tira: verificar (Tulio las marcó "por confirmar") |
| `hierro` | mg/L | operativo | Casillas de la HORYZON: **verificar con el empaque** (varían mucho entre marcas). Aplicar la regla por valor. | ≤0.3 verde; >0.3 a <3 amarillo; ≥3 rojo | OMS no propone valor sanitario. EPA estándar secundario: 0.3 mg/L (agua color óxido, manchas, sabor metálico). | 0.3 confirmado. Corte de 3 para rojo: verificar |

Reglas de lectura para Desarrollo:
1. Si la lectura cae entre dos casillas, se toma la **más alta** (prudencia).
2. Casilla ausente o `no_legible` = **sin dato**, nunca verde.
3. Nota de `cloro_libre` = 0: es verde por defecto. Regla opcional de perfil: si el origen es chorro, tanque o pozo **y** no hay filtro, pasa a amarillo ("sin cloro de protección"). Con filtro o botellón, 0 es lo esperado.
4. Sugerencia para el operador: la alerta de zona ("3 o más hogares en rojo") debería contar solo rojos de tipo **salud**. Los rojos operativos (`dureza`, `hierro`) son demanda de equipos, no alerta sanitaria. Lo decide el orquestador.
5. Norma venezolana (Resolución SG-018-98, Gaceta Oficial 36.395 del 13 feb 1998): existe y aplica, pero **no pude leer sus cuadros de valores** (PDF sin texto extraíble). No citar cifras de esa norma hasta verificarlas. Queda como pendiente.

---

## 2. Frase simple por hallazgo

Para verde, una sola frase genérica: **"Esta medida salió dentro de lo esperado."** (siempre acompañada del aviso fijo de Tulio).

| Clave | Amarillo | Rojo |
|---|---|---|
| `alcalinidad` | Baja: "Tu agua tiene poca defensa y puede ponerse agresiva con las tuberías." · Alta: "Tu agua viene cargada de minerales. Puede dejar sabor y sarro." | No aplica. |
| `dureza` | "Tu agua es dura. Deja sarro en la ducha, las ollas y el calentador. No es un tema de salud, pero le acorta la vida a tus equipos." | "Tu agua es muy dura. Vas a ver sarro por todos lados y tus equipos van a sufrir. Aquí conviene un ablandador." |
| `cobre` | "La tira marca posible presencia de cobre. Puede venir de las tuberías. Confirma con un laboratorio." | "La tira marca posible presencia alta de cobre. No es un diagnóstico: confirma con un laboratorio. Mientras tanto, usa otra agua para tomar y cocinar." |
| `nitrato` | "Aparecen nitratos en nivel medio. Pasa mucho con pozos y tanques. Repite la prueba y no lo pierdas de vista." | "Los nitratos salieron altos. Ojo: hervir el agua no los quita. Si en casa hay bebés o embarazadas, usa otra agua para tomar y preparar teteros, y confirma con un laboratorio." |
| `cloro_libre` | "Tu agua trae bastante cloro. Se nota en el olor y el sabor. Un filtro de carbón lo resuelve." | "El cloro salió muy alto. Si acabas de clorar el tanque, espera unas horas y repite la prueba. Si sigue igual, no la tomes así: pásala por un filtro de carbón." |
| `cloro_libre` = 0 (regla opcional) | "Tu agua no trae cloro. Si viene de tanque o pozo, no tiene protección contra microbios. Haz la prueba de bacterias del sobre." | No aplica. |
| `plomo` | "La tira marca posible presencia de plomo. Una tira casera no alcanza para asegurarlo: confirma con un laboratorio." | "La tira marca posible presencia de plomo en nivel alto. No es un diagnóstico. Confirma con un laboratorio y, mientras tanto, usa otra agua para tomar y cocinar, sobre todo si hay niños o embarazadas. Hervirla no quita el plomo." |
| `ph` | Bajo: "Tu agua salió algo ácida. Puede desgastar tuberías y griferías." · Alto: "Tu agua salió algo alcalina. Puede saber raro, sentirse jabonosa y dejar sarro." | No aplica en esta tira. |
| `nitrito` | "Aparecen nitritos. Puede ser señal de contaminación reciente. Repite la prueba y haz la de bacterias." | "Los nitritos salieron altos. No uses esta agua para bebés ni teteros, no intentes arreglarla hirviéndola y confirma con un laboratorio." |
| `hierro` | "Tu agua trae hierro. Mancha de marrón la ropa, la poceta y el lavamanos, y da sabor a metal." | "Tu agua trae mucho hierro. Vas a ver manchas marrones y sabor fuerte a metal. Hace falta un filtro para hierro antes que cualquier otro." |

Reglas de redacción: plomo y cobre siempre "posible presencia, confirma con un laboratorio". Nunca "potable", "segura", "apta", "limpia", "contaminada" ni "tóxica". Ninguna frase promete que un cartucho resuelve un tema de salud.

---

## 3. Parámetro → tipo de cartucho que lo corrige

| Clave | Tipo de cartucho o equipo | Qué tan bien | No sirve para esto | Referencia |
|---|---|---|---|---|
| `cloro_libre` | Carbón activado en bloque; carbón granular; KDF como apoyo | Bloque: muy bien. Granular: bien. | Sedimentos, ablandador | NSF/ANSI 42 (cloro, sabor y olor) |
| `plomo` | Ósmosis inversa; carbón en bloque **que declare reducción de plomo**; KDF como apoyo | Ósmosis: muy bien. Bloque: bien solo si el cartucho lo declara. KDF: parcial. | Carbón granular común, sedimentos, hervir | NSF/ANSI 58 (ósmosis), NSF/ANSI 53 (plomo) |
| `cobre` | Ósmosis inversa; carbón en bloque para metales o KDF. Si el pH es bajo, corregir primero el pH (ahí está la causa) | Ósmosis: muy bien. Bloque y KDF: parcial. | Sedimentos, carbón granular común | NSF/ANSI 58 y 53 |
| `nitrato` y `nitrito` | Ósmosis inversa; resina aniónica selectiva de nitrato | Ósmosis: bien (reducción alta, no total). Resina: bien. | Carbón (bloque o granular), sedimentos, ablandador, hervir | NSF/ANSI 58 |
| `dureza` | Ablandador de resina catiónica (toda la casa); ósmosis inversa (solo el punto de consumo) | Ablandador: muy bien. Ósmosis: bien, pero la dureza alta le acorta la membrana (mejor ablandar antes). Polifosfato: no quita dureza, solo frena el sarro. | Carbón, sedimentos | NSF/ANSI 44 (ablandadores) |
| `alcalinidad` baja y `ph` bajo | Cartucho neutralizador de calcita o remineralizador | Bien con acidez leve | Carbón, sedimentos, ósmosis (la ósmosis baja aún más el pH) | Práctica de tratamiento; **verificar** |
| `alcalinidad` alta y `ph` alto | Ósmosis inversa | Bien | Carbón, sedimentos | NSF/ANSI 58 (sólidos disueltos) |
| `hierro` | Disuelto y bajo: ablandador de resina catiónica o KDF. Alto: filtro de hierro de lecho oxidante. Ya oxidado (partículas marrones): sedimentos | Según el caso; el hierro alto necesita equipo propio antes del resto | Carbón solo | Práctica de tratamiento; **verificar** |
| Bacterias (prueba de frasco, no la tira) | Lámpara UV después de sedimentos; cloración y lavado del tanque; ultrafiltración; hervir | UV: muy bien con agua clara | Sedimentos y carbón **no desinfectan** | NSF/ANSI 55 (UV) |

Los alcances de las normas NSF/ANSI están citados de memoria: **verificar** en nsf.org antes de usarlos en el pitch. Al llegar el catálogo real, solo se puede decir "reduce plomo" o "reduce nitratos" de un producto si su ficha lo declara.

### Cómo influye el perfil del hogar

| Dato del perfil | Efecto en la recomendación |
|---|---|
| Agua turbia o amarilla | Primero un cartucho de **sedimentos**: protege todo lo que va después. Si además `hierro` sale amarillo o rojo, filtro de hierro. |
| Origen pozo o tanque | Sugerir **desinfección**: lavado y cloración del tanque, y lámpara UV después de sedimentos (la UV necesita agua clara). Insistir en la prueba de bacterias. Nitrato y nitrito son más probables aquí. |
| Origen chorro | El cloro es normal: carbón en bloque para olor y sabor. Si pasa por tanque, tratar como tanque. |
| Origen botellón | Se mide igual que cualquier agua. No asumir nada por ser botellón. |
| Sin filtro | Base de 2 etapas: sedimentos + carbón en bloque. Subir de nivel solo si hay hallazgos que esa base no corrige. |
| Filtro de 1 a 3 etapas (sedimentos y carbón) | Corrige turbidez, cloro, olor y sabor. **No** corrige nitrato, nitrito ni dureza, y metales solo si el cartucho lo declara. Rojo en esos → subir a ósmosis inversa (5 etapas o más). |
| Filtro con ósmosis (5 etapas o más) | Si aun así sale amarillo o rojo en nitrato, plomo, cobre o dureza: cartuchos o membrana vencidos → **recambio**, no equipo nuevo. Cruzar con `fecha_ultimo_cambio`. |
| Cuántos viven | Más personas = más litros = recambio antes (ver sección 6). |
| Qué agua se mide | Medir el agua que se toma (después del filtro). Un hallazgo después del filtro es mantenimiento pendiente. |

---

## 4. Lo que la app NO puede afirmar

- **Nunca "potable"**, ni "segura", "apta para tomar", "limpia" o "sin riesgo". Tampoco "contaminada" o "tóxica" como diagnóstico.
- La tira casera es **orientativa**: da rangos por color, no cifras exactas, y cambia con la luz, el tiempo de lectura y la tira usada.
- **Plomo y cobre son orientativos.** Solo "posible presencia, confirma con un laboratorio". Un cero en la tira no descarta plomo.
- **La tira no mide bacterias, virus ni parásitos.** Tampoco arsénico, flúor, pesticidas ni otros químicos.
- La prueba de bacterias del frasco es de **presencia o ausencia**: no dice cuántas bacterias hay, ni cuáles, ni si alguien se va a enfermar.
- **Un frasco sin cambio no certifica el agua.** Es una muestra, de un día, de un solo punto.
- Todo verde **no** significa que el agua esté bien. Aviso fijo en cada resultado: "Esta tira no mide todo. Un buen resultado no significa que el agua sea apta para tomar."
- La app no diagnostica enfermedades ni atribuye síntomas al agua.
- La app no promete que un cartucho deja el agua lista para tomar: dice qué tipo de cartucho **reduce** qué cosa.
- Ningún resultado reemplaza un análisis de laboratorio.

---

## 5. Prueba de bacterias (E. coli y coliformes, frasco a 48 horas)

Cómo funciona, en simple: el frasco trae un polvo que alimenta a las bacterias coliformes. Si hay alguna en la muestra, crece y le cambia el color al líquido. Si no hay, el líquido queda como estaba.

| Punto | Interpretación |
|---|---|
| Qué son los coliformes | Bacterias "señal": avisan que el agua pudo tener contacto con suciedad. E. coli, en particular, apunta a contaminación con heces. |
| Cambió de color | Hay coliformes en esa muestra. No dice cuántos, ni si son E. coli, ni si enferman. |
| Sigue igual | No se detectaron coliformes en esa muestra. No descarta otros microbios ni químicos. |
| Cuándo leer | A las 48 horas, a temperatura ambiente. Un cambio que aparece días después no cuenta. |
| Errores comunes | Tocar la boca del frasco o la tapa con los dedos, o llenar con una llave sucia, puede dar un cambio de color falso. |
| Colores exactos | Dependen del frasco que consiga Tulio: **verificar con el instructivo** y poner los colores reales en la pantalla. |

Si el frasco solo detecta coliformes totales y no distingue E. coli, la app no debe mencionar E. coli en el resultado: **verificar con el instructivo**.

**Texto propuesto · "Cambió de color"**
> Tu frasco cambió de color. Eso indica que en esa muestra hay bacterias coliformes, una señal de que el agua pudo ensuciarse en el camino. La prueba no dice cuántas hay ni si te vas a enfermar.
> Mientras lo resuelves: hierve el agua que vas a tomar y a usar para cocinar (que hierva a borbotones al menos 1 minuto), lava y desinfecta el tanque o los botellones, y repite la prueba. Para saberlo con certeza, lleva una muestra a un laboratorio.

**Texto propuesto · "Sigue igual"**
> Tu frasco no cambió de color. En esa muestra no se detectaron bacterias coliformes. Es una buena señal, pero es una sola muestra de un solo día. Esta prueba no revisa virus, parásitos ni químicos, y no certifica tu agua.
> Repítela si cambias de fuente, después de lavar el tanque, o si el agua cambia de olor, color o sabor.

Ambos textos pasan por el Asesor legal antes de publicarse. El minuto de hervor viene de la recomendación usual de salud pública: **verificar**.

---

## 6. Vida útil orientativa de cartuchos

**Orientativa.** Cambia con los litros que pasan y con el agua de cada casa. El dato del fabricante, cuando llegue el catálogo, manda sobre esta tabla.

| Tipo de cartucho o equipo | Meses (valor para el cálculo) | Rango usual | Estado |
|---|---|---|---|
| Sedimentos | 3 | 3 a 6 | confirmado (rangos de fabricantes) |
| Carbón granular | 6 | 6 a 9 | verificar |
| Carbón en bloque | 6 | 6 a 12 | confirmado (rangos de fabricantes) |
| KDF | 12 | 6 a 12 | verificar |
| Post-carbón de pulido (ósmosis) | 12 | 12 | verificar |
| Membrana de ósmosis inversa | 24 | 24 a 36 | confirmado (rangos de fabricantes) |
| Lámpara UV | 12 | 12 (unas 9.000 horas) | confirmado (rangos de fabricantes) |
| Calcita o remineralizador | 6 | 6 a 12 | verificar |
| Resina de ablandador (equipo con sal) | 60 | 60 a 120; se regenera con sal, no se cambia cada año | verificar |

Ajustes sugeridos para `diasParaRecambio` (todos **supuestos**, verificar con Tulio):
- Agua turbia o amarilla: sedimentos a la mitad (3 → 1.5 meses).
- 5 o más personas en casa: todos los cartuchos × 0.75.
- Dureza en rojo sin ablandador: membrana de ósmosis × 0.75.
- Cálculo: `días = meses × 30 × ajustes − días desde fecha_ultimo_cambio`. Si da negativo, el recambio está vencido.

---

## Fuentes

- OMS, *Guidelines for drinking-water quality*, 4.ª edición con adendas 1 y 2 (2022): https://www.who.int/publications/i/item/9789240045064
- OMS, ficha de cloro (2022), valor guía 5 mg/L para cloro libre: https://cdn.who.int/media/docs/default-source/wash-documents/water-safety-and-quality/chemical-fact-sheets-2022/chlorine-fact-sheet-2022.pdf
- OMS, ficha de hierro (2022), sin valor guía: https://cdn.who.int/media/docs/default-source/wash-documents/water-safety-and-quality/chemical-fact-sheets-2022/iron-fact-sheet-2022.pdf
- OMS, *Hardness in drinking-water* (2011): https://cdn.who.int/media/docs/default-source/wash-documents/wash-chemicals/hardness-bd.pdf
- Tabla comparativa OMS / UE / EPA (cobre, plomo, nitrato, nitrito): https://en.wikipedia.org/wiki/Drinking_water_quality_standards
- EPA, estándares primarios (plomo 15 ppb, cobre 1.3 mg/L, cloro 4 mg/L, nitrato 10 y nitrito 1 mg/L como N): https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations
- EPA, estándares secundarios (hierro 0.3 mg/L, cobre 1.0 mg/L, pH 6.5 a 8.5): https://www.epa.gov/sdwa/secondary-drinking-water-standards-guidance-nuisance-chemicals
- Australia NHMRC, dureza 200 mg/L por sarro: https://guidelines.nhmrc.gov.au/australian-drinking-water-guidelines/part-5/physical-chemical-characteristics/hardness-as-calcium-carbonate
- Coliformes como bacterias indicadoras (Departamento de Salud de Vermont): https://www.healthvermont.gov/water/coliform-bacteria
- Vida útil de cartuchos (rangos de fabricantes): https://www.pentair.com/en-us/home-water-treatment/resources/blog/when-to-change-your-water-filter.html y https://espwaterproducts.com/pages/how-long-do-water-filters-last
- Venezuela, Resolución SG-018-98, Gaceta Oficial 36.395 (13 feb 1998), ficha en FAOLEX: https://leap.unep.org/en/countries/ve/national-legislation/resolucion-ndeg-sg-01898-normas-sanitarias-de-calidad-del-agua (valores sin verificar)

## Pendientes

1. Casillas reales de la tira que traiga Tulio el domingo (sobre todo `ph`, `nitrito`, `hierro`) y si el nitrato se lee como NO3 o como N.
2. Valores de la norma venezolana (Gaceta 36.395).
3. Instructivo del frasco de bacterias: colores, temperatura y si distingue E. coli.
4. Alcances NSF/ANSI y cortes operativos marcados "verificar".
5. Revisión del Asesor legal de las secciones 2, 4 y 5.
