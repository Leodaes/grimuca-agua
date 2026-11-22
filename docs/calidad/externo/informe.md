# Informe de Calidad externa · Grimuca Agua

Pruebas de navegador contra https://agua.oydo.app, hechas desde una máquina distinta a la del equipo que construye. No se tocó código de la app.

Cómo correrlas: `cd pruebas/externas && npm install && npx playwright install chromium && npx playwright test`. Revisión del repositorio: `node pruebas/externas/revisar-repo.js` desde la raíz.

## Pasada 3 · sáb 21 nov, 8:46 p.m.

**Resumen:** el orquestador avanza rápido: componentes, especificación de pantallas, contenedores y guion de despliegue (último commit `4cc3a9a`, 8:44 p.m.). La URL pública sigue con la página provisional y las rutas del operador siguen vacías en el código. El recorrido aún no se puede probar.

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| La bienvenida carga con su título | **No:** página provisional | **No:** página provisional |
| No dice «potable» | Cumple | Cumple |
| Controles de 44 px o más | No hay controles todavía | No aplica |
| Recorrido completo en teléfono | **No:** la app no está publicada | — |
| Pedido en vivo en Despacho sin recargar | **No:** `/operador` no muestra «Panel de despacho» | **No** |
| Aviso fijo en el resultado | No probado | No probado |

**Repositorio:** 96 archivos revisados. No hay `.github/workflows`, secretos, archivos `.env` ni teléfonos reales, y «potable» no aparece en el código. Siguen faltando `LICENCIAS.md` y `.env.example`.

**Señales de vida del orquestador:** commits a las 8:41, 8:43 y 8:44 p.m. El sitio responde con la página provisional. No hay alerta.

**Ajustes a las pruebas:** el recorrido se reescribió contra `docs/diseno/especificacion.md`, con sus rutas (§1) y los textos exactos de cada botón:
- Cliente: «Empezar» → «Guardar y seguir» → «Seguir al pago» → «Pagar $9 (simulación)» → «Ya me llegó el sobre» → «Marca los colores a mano» → «Ver mi resultado» → «Agregar a mi lista» → «Confirmar pedido».
- Operador: PIN → «Entrar» → `/operador/despacho`, abierto desde antes de que el cliente empiece. La prueba exige que el pedido aparezca sin recargar.
- Los datos de prueba son inventados («Prueba Calidad», 0414 123 4567).

### Fallas abiertas

**Rompe la demo**
- Ninguna todavía. Lo que falla es esperado: la app no está publicada.

**Confunde**
- Faltan `LICENCIAS.md` y `.env.example`.
- ~~Aqual en el catálogo~~: resuelto. El catálogo quedó solo con Oasis (`b1bbfe5`).

**Cosmético**
- Nada nuevo.

## Pasada 2 · sáb 21 nov, 8:38 p.m.

**Resumen:** el esqueleto del monorepo ya está en main (`3d097c4`, 8:34 p.m.), pero la URL pública sigue sirviendo la página provisional. Las rutas de la app existen en el código y están vacías, incluida la del operador. El recorrido de la demo todavía no se puede probar en la URL pública.

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| La página carga | Sí (provisional) | Sí (provisional) |
| No dice «potable» | Cumple | Cumple |
| Botones de 44 px o más | No hay botones todavía | No aplica |
| Recorrido completo en teléfono | **No:** la app no está publicada | — |
| Pedido en vivo en el panel sin recargar | **No:** `/operador` da 404 | **No:** `/operador` da 404 |
| Aviso fijo en el resultado | No probado | No probado |

**Repositorio:** 56 archivos revisados. No hay `.github/workflows`, secretos, archivos `.env` ni teléfonos reales, y «potable» no aparece en el código de `app/`, `api/` ni `db/`. Todavía faltan `LICENCIAS.md` y `.env.example`, que el HANDOFF exige (sección 4).

**Señales de vida del orquestador:** último commit suyo el sáb a las 8:34 p.m. El sitio responde, pero aún con la página provisional.

**Ajustes a las pruebas en esta pasada:**
- La prueba del panel ahora acepta el PIN del operador (HANDOFF §3) desde la variable `PANEL_PIN`. El PIN nunca se escribe en el repo.
- `revisar-repo.js` ya no marca los números de ejemplo (0414 123 4567), y solo busca «potable» en código, porque la documentación nombra la palabra para prohibirla.

### Fallas abiertas

**Rompe la demo**
- Ninguna todavía. Lo que falla es esperado: la app no está publicada.

**Confunde**
- **Aqual:** el HANDOFF dice que no se usa la línea Aqual, pero el catálogo de `insumos/catalogo/` la incluye porque así lo pidió el encargo. Hay que filtrar por Oasis antes de llevarlo a la base. Quedó anotado en `insumos/catalogo/NOTAS.md`.
- **Faltan `LICENCIAS.md` y `.env.example`**, que el jurado revisa.
- **No se sabe la ruta del panel:** las pruebas usan `/operador` hasta que exista la ruta real.

**Cosmético**
- Nada nuevo.

Captura: `capturas/pasada2-panel-telefono.png` (404 del panel).

## Pasada 1 · sáb 21 nov, 8:30 p.m. (hora de Caracas)

**Resumen:** la app todavía no está publicada. La raíz responde 200 con la página provisional «Sitio en construcción». El recorrido de la demo no se puede probar aún.

| Revisión | Teléfono (375 px) | Escritorio |
|---|---|---|
| La página carga | Sí (provisional) | Sí (provisional) |
| No dice «potable» | Cumple | Cumple |
| Botones de 44 px o más | No hay botones todavía | No aplica |
| Recorrido completo | No probado: no hay app | No probado: no hay app |
| Pedido en vivo en el panel | No probado: `/operador` da 404 | No probado: `/operador` da 404 |
| Aviso fijo en el resultado | No probado: no hay resultado | No probado |

**Repositorio:** 14 archivos revisados. No hay `.github/workflows`, secretos, archivos `.env` ni teléfonos reales, y la palabra «potable» no aparece en el código.

**Señales de vida del orquestador:** último commit en main el sáb 21 nov a las 8:26 p.m. (`edbcece`, estructura inicial). El sitio responde.

**Acceso al servidor:** la comprobación por SSH no se hizo. El sistema de permisos de esta PC la bloqueó y no se intentó otra vía.

### Fallas abiertas

**Rompe la demo**
- Ninguna todavía. Lo que falla es esperado: la app no existe aún.

**Confunde**
- No se sabe la ruta del panel del operador. Las pruebas usan `/operador` por defecto; si es otra, se corre con `PANEL_PATH=/ruta npx playwright test`.
- El documento de traspaso (HANDOFF) no está en el repositorio, por la decisión de las 8:30 p.m. Las pruebas se escribieron a partir del recorrido descrito en el encargo.

**Cosmético**
- La página provisional muestra «construcciÃ³n» cuando se lee sin UTF-8. En navegador se ve bien porque declara `charset=utf-8`.
