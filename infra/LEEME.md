# Infraestructura de Grimuca Agua

La aplicación vive en un servidor compartido con otros proyectos en producción. Todo lo nuestro está en `/opt/agua` y en el proyecto de compose `agua`. El dominio público hace proxy a `127.0.0.1:3070` del servidor.

**Solo el orquestador despliega y entra al servidor.**

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `Dockerfile` | Imagen de la aplicación: compila el front y deja la API (que también sirve el front) lista para correr. El contexto es la raíz del repo. |
| `dockerignore.txt` | Se copia a la raíz del repo como `.dockerignore` (desde `infra/` no tiene efecto). |
| `docker-compose.yml` | Servicios `bd` (Postgres 16, sin puerto publicado, volumen `agua_bd`) y `app` (publicada solo en `127.0.0.1:3070`). |
| `desplegar.sh` | Sube el código, respalda la base, reconstruye, levanta y verifica. |

## Qué hay en el servidor

```
/opt/agua/
  agua.env            variables y secretos (permisos 600; nunca va al repo)
  fuente/             código de la versión en uso (COMMIT_DESPLEGADO dice cuál commit es)
  fuente.anterior/    última versión que pasó la verificación
  respaldos/          bd-AAAAMMDD-HHMMSS.sql.gz (se conservan los 10 más recientes)
```

Docker crea para el proyecto `agua`: los contenedores `agua-app-1` y `agua-bd-1`, la red `agua_default` y el volumen `agua_bd`.

`agua.env` no trae `DATABASE_URL`: la compone `docker-compose.yml` con `POSTGRES_PASSWORD`. Por eso la contraseña debe ser segura para URL (letras, números, punto, guion, guion bajo o virgulilla); el script lo revisa antes de empezar. Ojo: cambiar `POSTGRES_PASSWORD` en `agua.env` después de creada la base no cambia la contraseña dentro de Postgres.

## Cómo se despliega

Desde la raíz del repo, en Git Bash:

```bash
bash infra/desplegar.sh
```

Variables opcionales del entorno: `SERVIDOR` (usuario@host), `LLAVE` (llave privada de SSH), `URL_PUBLICA` y `OPCIONES_SSH`. El script no pide nada por teclado: si la llave o la clave de host del servidor no están listas, falla de una vez y no cambia nada.

Lo que hace, en orden:

1. Revisa el repositorio. **Solo se despliega lo confirmado en `HEAD`**; si hay cambios sin confirmar, avisa y sigue con lo confirmado.
2. Revisa el servidor sin cambiar nada (`/opt/agua`, `agua.env`, `docker compose`, contraseña).
3. Sube el código con `git archive` a `/opt/agua/fuente.nuevo`.
4. Si la base ya está corriendo, la respalda en `/opt/agua/respaldos/`. Si el respaldo falla, se detiene ahí.
5. Pasa `fuente` a `fuente.anterior` y `fuente.nuevo` a `fuente`. Si la versión que estaba en `fuente` nunca pasó la verificación, se descarta y `fuente.anterior` se queda como estaba.
6. `docker compose ... up -d --build --remove-orphans`. Al arrancar, el contenedor `app` corre las migraciones y siembra los datos de la demo si la base está vacía.
7. Espera hasta 120 s a que `http://127.0.0.1:3070/api/salud` responda `ok` dentro del servidor y después verifica el dominio público desde afuera.
8. Si algo falla, imprime las últimas 60 líneas de logs de `app` y sale con error. No intenta arreglar nada por su cuenta.

Si falla la construcción de la imagen, lo que estaba corriendo sigue corriendo.

### Primera vez

- Copia `infra/dockerignore.txt` a la raíz como `.dockerignore` y confírmalo.
- En `/opt/agua` hay un `compose.yaml` provisional. El primer despliegue reemplaza su contenedor. Después de verificar, renómbralo (por ejemplo `compose.provisional.yaml`) para que nadie lo levante por error con un `docker compose up` suelto en esa carpeta.

### Volver a sembrar la demo

```bash
bash infra/desplegar.sh --reiniciar-datos --confirmo
```

Respalda la base, construye la imagen, baja los servicios del proyecto y borra **solo** el volumen `agua_bd`. Al arrancar se aplican las migraciones y las semillas desde cero. Sin `--confirmo` no hace nada.

### Restablecer los datos de la demo (sin desplegar)

Antes de presentar, o si la demo quedó con pedidos de ensayo:

```bash
SERVIDOR=usuario@host LLAVE=ruta/de/la/llave bash infra/restablecer-demo.sh --confirmo
```

No sube ni construye código: respalda la base, borra **solo** el volumen `agua_bd` y vuelve a levantar la misma imagen, que siembra los datos de demostración al arrancar (3 comercios, 70 hogares, pedidos con envío para las rutas y 3 servicios técnicos). Tarda menos de un minuto. Los PIN no cambian.

## Cómo se ven los logs

En el servidor conviene definir una vez el comando completo (hace falta `--env-file` porque el compose interpola la contraseña):

```bash
C="docker compose -p agua --env-file /opt/agua/agua.env -f /opt/agua/fuente/infra/docker-compose.yml"

$C ps                          # estado y salud de app y bd
$C logs -f --tail 100 app      # logs de la aplicación en vivo
$C logs --tail 100 bd          # logs de Postgres
cat /opt/agua/fuente/COMMIT_DESPLEGADO
curl -s http://127.0.0.1:3070/api/salud
```

Los logs rotan solos: 3 archivos de 10 MB por contenedor.

## Cómo se vuelve a la versión anterior

Desde la PC del orquestador:

```bash
bash infra/desplegar.sh --volver
```

Intercambia `fuente` y `fuente.anterior` en el servidor, reconstruye, levanta y verifica igual que un despliegue normal (también respalda la base antes). Ejecutarlo dos veces seguidas deja todo como estaba.

A mano, en el servidor, es lo mismo:

```bash
cd /opt/agua
mv fuente fuente.intercambio && mv fuente.anterior fuente && mv fuente.intercambio fuente.anterior
$C up -d --build --remove-orphans
```

Las migraciones no se deshacen solas. Si la versión nueva cambió el esquema y la anterior no funciona con él, restaura además el respaldo que se tomó justo antes de ese despliegue.

## Cómo se restaura un respaldo de la base

En el servidor, con `C` definido como arriba:

```bash
ls -lt /opt/agua/respaldos/                     # elegir el archivo
R=/opt/agua/respaldos/bd-AAAAMMDD-HHMMSS.sql.gz
gzip -t "$R"                                    # comprobar que no está dañado

$C stop app
$C exec -T bd psql -U agua -d postgres -c "DROP DATABASE agua WITH (FORCE);" -c "CREATE DATABASE agua OWNER agua;"
gunzip -c "$R" | $C exec -T bd psql -U agua -d agua -v ON_ERROR_STOP=1
$C start app
curl -s http://127.0.0.1:3070/api/salud
```

Esto reemplaza la base completa por la del respaldo: lo que se haya registrado después se pierde. Si quieres conservarlo, saca antes otro respaldo:

```bash
$C exec -T bd pg_dump -U agua agua | gzip > /opt/agua/respaldos/bd-$(date +%Y%m%d-%H%M%S).sql.gz
```

## Qué NO se debe hacer en el servidor compartido

- No tocar nada fuera de `/opt/agua`.
- No tocar contenedores, redes, volúmenes ni imágenes que no sean del proyecto `agua`.
- Nunca `docker system prune`, `docker volume prune`, `docker network prune`, `docker image prune -a`, `docker stop $(docker ps -q)` ni nada que actúe "sobre todo".
- No ejecutar `docker compose down -v`: borra la base. Para volver a sembrar se usa `--reiniciar-datos --confirmo`, que respalda primero.
- No publicar el puerto de Postgres ni cambiar `127.0.0.1:3070` por `0.0.0.0`: la aplicación solo se expone a través del proxy web.
- No reiniciar, apagar ni recrear el servidor, ni reiniciar el servicio de Docker.
- No editar la configuración del servidor web desde aquí; eso tiene su propio procedimiento con respaldo previo.
- No subir `agua.env` al repo ni copiar su contenido en chats, issues o logs.
- No quitar los límites de memoria y CPU del compose: están para no afectar a los vecinos.

### Limpieza de imágenes viejas

Cada despliegue deja la imagen anterior sin nombre. Si hace falta liberar espacio, se borran una por una y solo las nuestras (llevan la etiqueta `proyecto=agua`):

```bash
docker image ls --filter label=proyecto=agua
docker image rm <ID>      # solo las que aparecen como <none>; la que está en uso no se deja borrar
```
