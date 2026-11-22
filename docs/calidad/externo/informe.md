# Informe de Calidad externa · Grimuca Agua

Pruebas de navegador contra https://agua.oydo.app, hechas desde una máquina distinta a la del equipo que construye. No se tocó código de la app.

Cómo correrlas: `cd pruebas/externas && npm install && npx playwright install chromium && npx playwright test`. Revisión del repositorio: `node pruebas/externas/revisar-repo.js` desde la raíz.

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
