#!/usr/bin/env bash
# Despliega Grimuca Agua en el servidor compartido. Se ejecuta desde la PC del
# orquestador (Git Bash en Windows o cualquier Bash):
#
#   bash infra/desplegar.sh                               despliega el último commit (HEAD)
#   bash infra/desplegar.sh --volver                      vuelve a la versión anterior (fuente.anterior)
#   bash infra/desplegar.sh --reiniciar-datos --confirmo  despliega y vuelve a sembrar la base de la demo
#
# Variables de entorno:
#   SERVIDOR      usuario@host del servidor (por defecto root@agua.oydo.app)
#   LLAVE         llave privada de SSH (por defecto $HOME/.ssh/grimuca_agua_ed25519)
#   URL_PUBLICA   dirección pública que se verifica al final (por defecto https://agua.oydo.app)
#   OPCIONES_SSH  opciones extra para ssh, separadas por espacios (opcional)
#
# En el servidor solo se toca /opt/agua y el proyecto de compose "agua".
# Los detalles están en infra/LEEME.md.

set -euo pipefail

SERVIDOR="${SERVIDOR:-root@agua.oydo.app}"
LLAVE="${LLAVE:-$HOME/.ssh/grimuca_agua_ed25519}"
URL_PUBLICA="${URL_PUBLICA:-https://agua.oydo.app}"

MODO="desplegar"
REINICIAR=0
CONFIRMO=0

uso() {
  cat <<'AYUDA'
Uso: bash infra/desplegar.sh [--volver] [--reiniciar-datos --confirmo]

  (sin opciones)      Sube el último commit (HEAD), respalda la base, reconstruye y verifica.
  --volver            No sube nada: intercambia fuente y fuente.anterior en el servidor y reconstruye.
  --reiniciar-datos   Borra SOLO el volumen agua_bd del proyecto para volver a sembrar la demo.
                      Exige pasar además --confirmo. Antes de borrar se respalda la base.
  --ayuda             Muestra este texto.

Variables: SERVIDOR, LLAVE, URL_PUBLICA, OPCIONES_SSH.
AYUDA
}

paso()  { printf '\n==> %s\n' "$*"; }
aviso() { printf 'AVISO: %s\n' "$*" >&2; }
fallo() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

for opcion in "$@"; do
  case "$opcion" in
    --volver)          MODO="volver" ;;
    --reiniciar-datos) REINICIAR=1 ;;
    --confirmo)        CONFIRMO=1 ;;
    -h|--ayuda|--help) uso; exit 0 ;;
    *) printf 'Opción desconocida: %s\n\n' "$opcion" >&2; uso >&2; exit 2 ;;
  esac
done

if [ "$REINICIAR" = 1 ] && [ "$CONFIRMO" != 1 ]; then
  printf 'ERROR: --reiniciar-datos borra la base de datos del proyecto. Si es lo que quieres, pasa también --confirmo.\n' >&2
  exit 2
fi
if [ "$CONFIRMO" = 1 ] && [ "$REINICIAR" != 1 ]; then
  printf 'ERROR: --confirmo solo acompaña a --reiniciar-datos.\n' >&2
  exit 2
fi

for programa in git ssh curl; do
  command -v "$programa" >/dev/null 2>&1 || fallo "No encuentro '$programa' en el PATH."
done
[ -f "$LLAVE" ] || fallo "No existe la llave indicada en LLAVE."

# Nota para Git Bash: se usa el ssh propio de Git Bash. Las rutas del servidor
# viajan dentro de guiones enviados por la entrada estándar, no como argumentos
# sueltos, para que la conversión de rutas de Windows no las altere.
SSH=(ssh -i "$LLAVE" -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=8)
if [ -n "${OPCIONES_SSH:-}" ]; then
  read -r -a opciones_extra <<<"$OPCIONES_SSH"
  SSH+=("${opciones_extra[@]}")
fi

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

COMMIT="volver"

# ---------------------------------------------------------------------------
# (a) Estado del árbol de git: solo se despliega lo confirmado.
# ---------------------------------------------------------------------------
if [ "$MODO" = "desplegar" ]; then
  paso "Revisando el repositorio"
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fallo "Esta carpeta no es un repositorio de git."
  COMMIT="$(git rev-parse --short=12 HEAD)"

  if [ -n "$(git status --porcelain)" ]; then
    aviso "Hay cambios sin confirmar. Se despliega SOLO lo confirmado en HEAD ($COMMIT); lo demás se queda en tu PC:"
    git status --short | head -n 20 >&2 || true
  else
    echo "Árbol limpio. Commit: $COMMIT"
  fi

  faltan=()
  for ruta in package.json package-lock.json api/package.json app/package.json \
              api/src/servidor.ts api/src/migrar.ts db/migraciones \
              infra/Dockerfile infra/docker-compose.yml; do
    git cat-file -e "HEAD:$ruta" 2>/dev/null || faltan+=("$ruta")
  done
  if [ "${#faltan[@]}" -gt 0 ]; then
    fallo "Esto hace falta para construir la imagen y no está confirmado en HEAD: ${faltan[*]}"
  fi
  if ! git cat-file -e "HEAD:.dockerignore" 2>/dev/null; then
    aviso "No hay .dockerignore confirmado en la raíz (copia infra/dockerignore.txt). No impide el despliegue."
  fi
fi

# ---------------------------------------------------------------------------
# Revisión previa en el servidor (no cambia nada).
# ---------------------------------------------------------------------------
paso "Revisando el servidor ($SERVIDOR)"
"${SSH[@]}" "$SERVIDOR" 'bash -s' <<'REMOTO' || fallo "La revisión previa del servidor no pasó (si es de conexión, revisa SERVIDOR, LLAVE y known_hosts). No se cambió nada."
set -euo pipefail
[ -d /opt/agua ] || { echo "No existe /opt/agua en el servidor." >&2; exit 1; }
[ -f /opt/agua/agua.env ] || { echo "No existe /opt/agua/agua.env." >&2; exit 1; }
docker compose version >/dev/null 2>&1 </dev/null || { echo "El servidor no tiene 'docker compose' (v2)." >&2; exit 1; }
# La contraseña va dentro de DATABASE_URL: debe ser segura para URL. No se imprime.
if ! grep -Eq "^POSTGRES_PASSWORD=[\"']?[A-Za-z0-9._~-]+[\"']?[[:space:]]*\$" /opt/agua/agua.env; then
  echo "POSTGRES_PASSWORD falta en agua.env o tiene caracteres que rompen la URL de conexión." >&2
  echo "Usa solo letras, números, punto, guion, guion bajo o virgulilla." >&2
  exit 1
fi
echo "Servidor listo."
REMOTO

# ---------------------------------------------------------------------------
# (b) Subir el código confirmado a /opt/agua/fuente.nuevo.
# ---------------------------------------------------------------------------
if [ "$MODO" = "desplegar" ]; then
  paso "Subiendo el commit $COMMIT"
  git archive --format=tar HEAD \
    | "${SSH[@]}" "$SERVIDOR" 'rm -rf /opt/agua/fuente.nuevo && mkdir -p /opt/agua/fuente.nuevo && tar -x -f - -C /opt/agua/fuente.nuevo' \
    || fallo "No se pudo subir el código. En el servidor sigue corriendo lo que había."
fi

# ---------------------------------------------------------------------------
# (c) a (f) En el servidor: respaldar, intercambiar carpetas, construir,
# levantar y esperar a que /api/salud responda.
# ---------------------------------------------------------------------------
paso "Desplegando en el servidor (modo: $MODO)"
if ! "${SSH[@]}" "$SERVIDOR" "MODO=$MODO REINICIAR=$REINICIAR COMMIT=$COMMIT bash -s" <<'REMOTO'
set -euo pipefail

BASE=/opt/agua
COMPOSE=(docker compose -p agua --env-file "$BASE/agua.env" -f "$BASE/fuente/infra/docker-compose.yml")

mostrar_logs() {
  echo "----- Últimas 60 líneas de logs de app -----" >&2
  "${COMPOSE[@]}" logs --no-color --tail 60 app </dev/null >&2 || true
  echo "--------------------------------------------" >&2
}

consultar() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS -m 5 "$1"
  else
    wget -q -T 5 -O - "$1"
  fi
}

cd "$BASE"

# Validar antes de tocar nada.
if [ "$MODO" = "desplegar" ]; then
  if [ ! -f fuente.nuevo/infra/docker-compose.yml ] || [ ! -f fuente.nuevo/infra/Dockerfile ]; then
    echo "La subida quedó incompleta (falta infra/ en fuente.nuevo). No se cambió nada." >&2
    exit 1
  fi
  printf '%s\n' "$COMMIT" > fuente.nuevo/COMMIT_DESPLEGADO
else
  if [ ! -d fuente ] || [ ! -d fuente.anterior ]; then
    echo "No hay versión anterior a la cual volver (falta fuente o fuente.anterior)." >&2
    exit 1
  fi
fi

# (c) Respaldo de la base ANTES de intercambiar y migrar, si bd está corriendo.
id_bd="$(docker ps -q --filter label=com.docker.compose.project=agua --filter label=com.docker.compose.service=bd </dev/null | head -n 1)"
if [ -n "$id_bd" ]; then
  mkdir -p respaldos
  chmod 700 respaldos
  archivo="respaldos/bd-$(date +%Y%m%d-%H%M%S).sql.gz"
  echo "Respaldando la base en $BASE/$archivo"
  if ! docker exec "$id_bd" pg_dump -U agua agua </dev/null | gzip > "$archivo"; then
    rm -f "$archivo"
    echo "Falló el respaldo de la base. No se cambió nada." >&2
    exit 1
  fi
  if [ ! -s "$archivo" ] || ! gzip -t "$archivo"; then
    rm -f "$archivo"
    echo "El respaldo quedó vacío o dañado. No se cambió nada." >&2
    exit 1
  fi
  chmod 600 "$archivo"
  # Se conservan los 10 más recientes.
  ls -1t respaldos/bd-*.sql.gz | tail -n +11 | xargs -r rm -f --
elif docker volume inspect agua_bd >/dev/null 2>&1 </dev/null; then
  echo "AVISO: existe el volumen agua_bd pero bd no está corriendo; se continúa SIN respaldo nuevo." >&2
else
  echo "Primera instalación: todavía no hay base que respaldar."
fi

# (b) Intercambio de carpetas. fuente.anterior guarda la última versión que
# pasó la verificación; una versión fallida no la pisa.
if [ "$MODO" = "desplegar" ]; then
  if [ -d fuente ]; then
    if [ -f fuente/.despliegue_ok ] || [ ! -d fuente.anterior ]; then
      rm -rf fuente.anterior
      mv fuente fuente.anterior
    else
      echo "La versión que estaba en fuente no llegó a verificarse: se descarta y se conserva fuente.anterior."
      rm -rf fuente
    fi
  fi
  mv fuente.nuevo fuente
else
  mv fuente fuente.intercambio
  mv fuente.anterior fuente
  mv fuente.intercambio fuente.anterior
fi
echo "Versión en $BASE/fuente: $(cat fuente/COMMIT_DESPLEGADO 2>/dev/null || echo desconocida)"

# Reinicio de datos: SOLO el volumen agua_bd del proyecto agua.
if [ "$REINICIAR" = "1" ]; then
  echo "Construyendo la imagen antes de bajar los servicios..."
  if ! "${COMPOSE[@]}" build </dev/null; then
    echo "Falló la construcción. No se borró ningún dato." >&2
    exit 1
  fi
  "${COMPOSE[@]}" down --remove-orphans </dev/null
  if docker volume inspect agua_bd >/dev/null 2>&1 </dev/null; then
    etiqueta="$(docker volume inspect -f '{{ index .Labels "com.docker.compose.project" }}' agua_bd </dev/null)"
    if [ "$etiqueta" != "agua" ]; then
      echo "El volumen agua_bd no está etiquetado como del proyecto agua. No se borra." >&2
      exit 1
    fi
    docker volume rm agua_bd </dev/null
    echo "Volumen agua_bd borrado: la base se vuelve a sembrar al arrancar."
  fi
fi

# (d) Construir y levantar. --remove-orphans solo alcanza al proyecto agua.
if ! "${COMPOSE[@]}" up -d --build --remove-orphans </dev/null; then
  echo "Falló 'docker compose up'." >&2
  mostrar_logs
  exit 1
fi

# (e) Esperar hasta 120 s a que la API responda dentro del servidor.
echo "Esperando a http://127.0.0.1:3070/api/salud (hasta 120 s)..."
limite=$((SECONDS + 120))
listo=0
cuerpo=""
while [ "$SECONDS" -lt "$limite" ]; do
  if cuerpo="$(consultar http://127.0.0.1:3070/api/salud 2>/dev/null)" \
     && printf '%s' "$cuerpo" | grep -Eq '"ok"[[:space:]]*:[[:space:]]*true'; then
    listo=1
    break
  fi
  sleep 3
done

# (f) Si falla: logs y salida con error, sin tocar nada más.
if [ "$listo" != "1" ]; then
  echo "La API no respondió ok en 120 s." >&2
  "${COMPOSE[@]}" ps </dev/null >&2 || true
  mostrar_logs
  exit 1
fi

touch fuente/.despliegue_ok
echo "Dentro del servidor responde: $cuerpo"
if printf '%s' "$cuerpo" | grep -Eq '"bd"[[:space:]]*:[[:space:]]*false'; then
  echo "AVISO: la API está arriba pero informa que NO tiene conexión con la base (bd: false)." >&2
fi
"${COMPOSE[@]}" ps </dev/null || true
REMOTO
then
  fallo "El despliegue falló en el servidor. Revisa los logs de arriba; no se tocó nada más."
fi

# ---------------------------------------------------------------------------
# (e) Verificación desde afuera, por el dominio público.
# ---------------------------------------------------------------------------
paso "Verificando $URL_PUBLICA/api/salud desde afuera"
intentos=0
publico=0
respuesta=""
while [ "$intentos" -lt 10 ]; do
  if respuesta="$(curl -fsS -m 10 "$URL_PUBLICA/api/salud" 2>/dev/null)" \
     && printf '%s' "$respuesta" | grep -Eq '"ok"[[:space:]]*:[[:space:]]*true'; then
    publico=1
    break
  fi
  intentos=$((intentos + 1))
  sleep 3
done

if [ "$publico" != "1" ]; then
  aviso "Dentro del servidor la API responde, pero $URL_PUBLICA/api/salud no. Revisa el proxy web o el DNS, no la aplicación."
  "${SSH[@]}" "$SERVIDOR" 'bash -s' <<'REMOTO' || true
id_app="$(docker ps -aq --filter label=com.docker.compose.project=agua --filter label=com.docker.compose.service=app </dev/null | head -n 1)"
if [ -n "$id_app" ]; then
  echo "----- Últimas 60 líneas de logs de app -----"
  docker logs --tail 60 "$id_app" 2>&1 </dev/null
fi
REMOTO
  exit 1
fi

echo "Respuesta pública: $respuesta"
if [ "$MODO" = "volver" ]; then
  paso "Listo. $URL_PUBLICA está sirviendo la versión anterior."
else
  paso "Listo. $URL_PUBLICA está sirviendo el commit $COMMIT."
fi
