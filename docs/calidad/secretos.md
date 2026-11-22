# Revisión de secretos del repositorio

**Fecha:** sáb 21 nov 2026, 8:55 p.m. (hora de Caracas) · **Hecha por:** Calidad
**Alcance:** la carpeta del proyecto tal como está en ese momento, incluido `HANDOFF-hackaton.md` de la raíz (es público). El repositorio es público desde el inicio, así que todo lo que no esté en `.gitignore` se considera a la vista de cualquiera.

**Resultado en una línea:** no se encontró ninguna clave, token, contraseña, llave privada ni PIN escritos en los archivos. Sí hay **información del servidor y de la forma de operar** en archivos públicos que conviene quitar, y varios nombres de proveedores que rompen la regla del repo.

Este documento no copia ningún secreto: solo indica archivo y línea.

## 1. Procedimiento

Se buscó con expresiones regulares en todo el proyecto, sin `node_modules/`, `.git/` ni las salidas de pruebas. No se usó git (lo integra el orquestador), así que **no se revisó el historial de commits** (ver sección 4).

| Qué se buscó | Patrón (resumen) | Resultado |
|---|---|---|
| Claves de servicios | prefijos habituales de claves de API, de nube, de repositorios y de mensajería; tokens con forma de JWT; `Bearer` seguido de un valor largo | Nada |
| Llaves privadas | `-----BEGIN … PRIVATE KEY` | Nada (solo una expresión de prueba en `pruebas/externas/revisar-repo.js`) |
| Contraseñas en direcciones | `postgres://usuario:clave@` | Solo la forma con variable en `infra/docker-compose.yml` (la clave viene de `agua.env`) |
| Asignaciones | `PIN_OPERADOR`, `SECRETO_SESION`, `VISION_API_KEY`, `POSTGRES_PASSWORD`, `password`, `secret`, `token` seguidos de un valor | Ningún valor escrito; solo nombres de variables |
| Direcciones IP | cuatro grupos de números | Solo `127.0.0.1` |
| Correos | `algo@dominio` | Ninguno de personas. Aparece `root@` + el dominio público como destino de SSH (hallazgo 2) |
| Teléfonos | móviles y fijos de Venezuela, `+58`, `wa.me/` | Solo marcadores (hallazgo 7) |
| Rutas de llaves y de equipos | `.pem`, `id_rsa`, `id_ed25519`, `.ssh`, `/root/`, rutas de usuario de Windows | Hallazgos 2 y 6 |
| Archivos sensibles | `.env*`, `*.env`, `*.pem`, `*.key`, `id_*`, volcados y respaldos | Ninguno en la carpeta |
| Nombres de personas y de proveedores | nombres del equipo; proveedores de nube, de correo y de servicios de visión y voz | Hallazgos 1, 3 y 4 |
| Front compilado y fuentes del front | las mismas claves, más variables de entorno expuestas al navegador | Nada: el front no lee ninguna variable secreta |
| Imágenes | revisión a ojo de `docs/calidad/externo/capturas/` | Una captura de una página de error; sin datos |

## 2. Hallazgos, de mayor a menor gravedad

### Graves (decidir antes de que el jurado lea el repositorio)

**1. `HANDOFF-hackaton.md` (raíz, público) describe el servidor y la forma de operar.** No trae claves, pero sí:

- Sección 0, fila "Clave del servicio de visión": explica que la clave se toma de los archivos de entorno de **otros proyectos** del mismo servidor. Le dice a cualquiera que ese servidor guarda credenciales de terceros y dónde.
- Sección 4: servidor compartido con otros proyectos en producción, acceso por SSH, programa del servidor web y puertos, puerto interno de la app, ruta y permisos del archivo de variables, fecha y **hora de vencimiento del snapshot** y fecha del último respaldo.
- Secciones 0 y 11: dicen que el correo del dueño se revisa cada 20 minutos y que lo que mande una persona con nombre y apellido **se ejecuta de forma autónoma**. Con el repo público, es una invitación a suplantar a esa persona por correo.
- Secciones 0 y 3: nombran a un proveedor externo de voz y la variable de su clave (líneas 18 y 88).
- `docs/decisiones/registro.md` línea 10 afirma que el documento se sube "sin datos del servidor": hoy no es cierto.

  *Recomendación:* sacar el documento del repositorio público, o dejar solo producto, alcance, modelo de datos y guion (secciones 2, 3, 5, 6, 7, 12) y quitar las secciones 0, 4, 10, 11 y las líneas de servidor de la 13. Si ya se subió, quitarlo en un commit nuevo no lo borra del historial.

**2. `infra/desplegar.sh` (líneas 10, 11, 20 y 21) trae por defecto el usuario administrador del servidor junto al dominio público, y el nombre del archivo de la llave privada.** No es la llave, pero publica usuario, destino y método de entrada. `infra/LEEME.md` línea 3 repite que el servidor es compartido con otros proyectos en producción.

  *Recomendación:* sin valores por defecto; que el script falle si `SERVIDOR` y `LLAVE` no vienen del entorno. Aparte, y fuera del repo: entrar con un usuario sin privilegios de administrador.

### Medios

**3. Nombre del proveedor del servicio de visión en el código.** `api/src/medicion/lector.ts` línea 283 usa una cabecera HTTP que lleva el nombre del proveedor (y la línea 18 fija la versión de esa API). Rompe la regla "sin menciones de proveedores ni modelos" del contrato, y el jurado revisa el código.

  *Recomendación:* que el nombre y el valor de esa cabecera lleguen por variable de entorno, como ya llegan la dirección, la clave y el modelo.

**4. Otros nombres de proveedores y herramientas en archivos públicos.** El proveedor de voz aparece en `docs/decisiones/bloqueos.md` línea 7, `docs/legal/puede-y-no-puede-decir.md` línea 5 y `docs/legal/riesgos.md` línea 97. La carpeta de configuración de una herramienta de asistencia aparece con su nombre en `.gitignore` línea 15, `.dockerignore` línea 8 e `infra/dockerignore.txt` línea 8.

  *Recomendación:* decir "servicio de voz"; para la carpeta, usar un patrón genérico o aceptar el riesgo (es poco visible).

**5. Falta `.env.example`.** Lo piden la sección 4 del traspaso y el contrato, y no existe ni en la raíz ni en `api/`. Sin él, quien quiera correr el proyecto termina copiando un `.env` real.

  *Recomendación:* crearlo con todas las variables del contrato y valores vacíos o de mentira evidentes (nunca un PIN de verdad).

**6. Ruta local con el nombre de usuario de la PC de desarrollo** en `docs/decisiones/contrato-api.md` línea 8 (dos veces). Es un dato personal menor y no sirve a quien clone el repo.

  *Recomendación:* reemplazar por "la carpeta donde esté Node".

### Bajos e informativos

**7. Teléfonos: solo marcadores.** `wa.me/580000000000` (barra inferior y especificación), `0412 000 0000` (pruebas de punta a punta) y `0414 123 4567` como ejemplo en la ayuda del perfil, en `docs/marketing/textos-app.md` y en pruebas de unidad. Este último tiene forma de número real: conviene cambiarlo por uno con ceros.

**8. Token del operador en la dirección del canal en vivo** (`/api/eventos?token=…`, `app/src/lib/eventos.ts` línea 127). Lo define el contrato y es lo normal con `EventSource`, pero el token queda en el registro de accesos del servidor web y vale 3 días. Aceptable para la demo; anotarlo como deuda.

**9. `insumos/catalogo/` sí va al repo** (a diferencia de `insumos-tulio/`). Son datos públicos de la tienda, sin credenciales ni precios. Trae 104 enlaces a un subdominio de administración de la tienda (`url_producto`): es público, pero no hace falta mostrarlo.

**10. Nombres de personas.** Los dos integrantes del equipo aparecen con nombre en 22 archivos (documentos, y comentarios en `api/src/medicion/config/` y `app/src/features/alta/comun.tsx`). Es información que el propio hackatón publica; se anota para que sea una decisión y no un descuido. No hay correos ni teléfonos de ninguno.

### Lo que está bien

- `.gitignore` cubre `.env`, `.env.*`, `*.env`, `agua.env`, `*.pem`, `*.key`, `id_*`, `insumos-tulio/`, la copia interna del traspaso, `grimuca-design/_raw/`, y las salidas de pruebas (`test-results/`, `pruebas/informe-html/`).
- La API no trae secretos por defecto: sin `PIN_OPERADOR` nadie entra al panel; sin `SECRETO_SESION` se genera uno temporal; el PIN se compara en tiempo constante y hay freno de intentos (8 fallidos por dirección en 5 minutos).
- La clave de visión solo se lee en el servidor; el front no recibe ninguna variable secreta.
- Las pruebas de punta a punta toman el PIN solo del entorno, no graban trazas y escriben el PIN sin dejarlo en el informe.
- Semillas y pruebas usan datos inventados.

## 3. Qué hacer y quién

| N.º | Acción | Dueño |
|---|---|---|
| 1 | Recortar o retirar `HANDOFF-hackaton.md` del repo público y corregir la línea 10 del registro | Orquestador |
| 2 | Quitar los valores por defecto de `SERVIDOR` y `LLAVE` | Infra |
| 3 | Cabecera del servicio de visión por variable de entorno | Dev · Medición |
| 4 | Reemplazar los nombres de proveedores en `docs/` | Orquestador (con Legal) |
| 5 | Crear `.env.example` | Dev · Plataforma |
| 6 | Quitar la ruta local del contrato | Orquestador |
| 7 | Cambiar el teléfono de ejemplo por uno con ceros | Dev · Cliente y Marketing |

## 4. Lo que esta revisión no cubre

- **El historial de git.** Un secreto borrado en un commit posterior sigue público. Antes de entregar, el orquestador debe buscar en todo el historial (`git log -p` con los mismos patrones) y confirmar con `git ls-files` que no se subió ninguno de los archivos ignorados.
- El servidor, `agua.env` y los registros del servidor web.
- Las capturas y el informe HTML que se generen después: revisarlos antes de adjuntarlos como evidencia.
- El código que Desarrollo escriba después de esta hora. **Se repite completa en la pasada final (dom 12:00 m.)** y se actualiza este archivo con la nueva fecha.
