#!/usr/bin/env bash
# Restablece los datos de la demo en el servidor sin tocar la versión desplegada.
#
#   SERVIDOR=usuario@host LLAVE=ruta/de/la/llave bash infra/restablecer-demo.sh --confirmo
#
# Qué hace, en este orden:
#   1. Respalda la base actual en /opt/agua/respaldos (si falla, no sigue).
#   2. Baja SOLO los servicios del proyecto agua.
#   3. Borra SOLO el volumen agua_bd, después de comprobar que es del proyecto agua.
#   4. Vuelve a levantar la misma imagen: al arrancar, la app migra y siembra los datos de demostración.
#   5. Espera a que /api/salud responda y lo comprueba también desde afuera.
# No construye ni sube código. Los PIN no cambian (viven en el archivo de variables del servidor).
set -euo pipefail

SERVIDOR="${SERVIDOR:?Define SERVIDOR (usuario@host)}"
LLAVE="${LLAVE:?Define LLAVE (ruta de la llave privada de SSH)}"
URL_PUBLICA="${URL_PUBLICA:-https://agua.oydo.app}"

if [ "${1:-}" != "--confirmo" ]; then
  printf 'Este comando borra los datos de la demo y vuelve a sembrarlos (con respaldo previo).\nSi es lo que quieres, ejecútalo con --confirmo.\n' >&2
  exit 1
fi
[ -f "$LLAVE" ] || { echo "No existe la llave indicada en LLAVE." >&2; exit 1; }

SSH=(ssh -i "$LLAVE" -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=15 ${OPCIONES_SSH:-})

echo "==> Restableciendo los datos de la demo en $SERVIDOR"
"${SSH[@]}" "$SERVIDOR" 'bash -s' <<'REMOTO'
set -euo pipefail
BASE=/opt/agua
cd "$BASE"
COMPOSE=(docker compose -p agua --env-file "$BASE/agua.env" -f "$BASE/fuente/infra/docker-compose.yml")

id_bd="$(docker ps -q --filter label=com.docker.compose.project=agua --filter label=com.docker.compose.service=bd </dev/null | head -n 1)"
if [ -n "$id_bd" ]; then
  mkdir -p respaldos && chmod 700 respaldos
  archivo="respaldos/bd-antes-de-restablecer-$(date +%Y%m%d-%H%M%S).sql.gz"
  docker exec "$id_bd" pg_dump -U agua agua </dev/null | gzip > "$archivo"
  if [ ! -s "$archivo" ] || ! gzip -t "$archivo"; then
    rm -f "$archivo"; echo "El respaldo falló. No se borró nada." >&2; exit 1
  fi
  chmod 600 "$archivo"
  echo "Respaldo: $BASE/$archivo"
fi

"${COMPOSE[@]}" down </dev/null
if docker volume inspect agua_bd >/dev/null 2>&1 </dev/null; then
  etiqueta="$(docker volume inspect -f '{{ index .Labels "com.docker.compose.project" }}' agua_bd </dev/null)"
  if [ "$etiqueta" != "agua" ]; then
    echo "El volumen agua_bd no es del proyecto agua. No se borra." >&2
    "${COMPOSE[@]}" up -d </dev/null
    exit 1
  fi
  docker volume rm agua_bd </dev/null >/dev/null
  echo "Volumen agua_bd borrado."
fi
"${COMPOSE[@]}" up -d </dev/null

for _ in $(seq 1 60); do
  if curl -fsS -m 3 http://127.0.0.1:3070/api/salud 2>/dev/null | grep -q '"ok":true'; then
    echo "La app responde dentro del servidor."
    docker logs agua-app-1 2>&1 | grep '\[migrar\]' | tail -3 || true
    exit 0
  fi
  sleep 2
done
echo "La app no respondió en 120 s. Últimos registros:" >&2
docker logs --tail 40 agua-app-1 >&2 || true
exit 1
REMOTO

echo "==> Comprobando $URL_PUBLICA/api/salud desde afuera"
curl -fsS -m 15 "$URL_PUBLICA/api/salud"
echo
echo "==> Listo: datos de la demo restablecidos."
