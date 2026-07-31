#!/usr/bin/env bash
# Extrae los textos en español del bundle original y verifica que existan en src/.
#
# Dos cuidados:
#  - el JSX de src/ tiene los párrafos cortados en varias líneas, así que se
#    compara con los espacios normalizados de los dos lados;
#  - en el bundle conviven los textos de la app con los de date-fns y
#    react-day-picker, que no tienen por qué estar en src/. Lo que no aparece
#    en src/ se contrasta contra node_modules antes de darlo por faltante.
set -uo pipefail
cd "$(dirname "$0")/.."

BUNDLE=recuperado/assets/index-BLha0cqC.js
DESDE=36324   # antes de esta línea es React, Firebase SDK, lucide y date-fns

norm() { tr '\n\t' '  ' | tr -s ' '; }

# Todo src/ en una sola línea con los espacios colapsados.
find src -type f \( -name '*.js' -o -name '*.jsx' \) -exec cat {} + | norm > /tmp/src-blob.txt
# Idem para las dos librerías que aportan texto en español.
{ find node_modules/date-fns/locale -name '*.js' -exec cat {} + ;
  find node_modules/date-fns -maxdepth 1 -name '*.js' -exec cat {} + ;
  find node_modules/react-day-picker/dist/esm -name '*.js' -exec cat {} + ; } 2>/dev/null \
  | norm > /tmp/lib-blob.txt

sed -n "${DESDE},\$p" "$BUNDLE" \
  | grep -oE '"[^"\\]{4,}"' \
  | sed 's/^"//;s/"$//' \
  | grep -E '[áéíóúñÁÉÍÓÚÑ¿¡]|[a-záéíóúñ] [a-záéíóúñ]' \
  | grep -vE '^(https?:|/|\./|\.\./)|_|^[a-z-]+$' \
  | sort -u > /tmp/textos-bundle.txt

TOTAL=0; EN_SRC=0; EN_LIB=0
: > /tmp/textos-faltantes.txt
while IFS= read -r crudo; do
  t=$(printf '%s' "$crudo" | norm | sed 's/^ //;s/ $//')
  [ -z "$t" ] && continue
  TOTAL=$((TOTAL+1))
  if grep -qF -- "$t" /tmp/src-blob.txt; then
    EN_SRC=$((EN_SRC+1))
  elif grep -qF -- "$t" /tmp/lib-blob.txt; then
    EN_LIB=$((EN_LIB+1))
  else
    echo "$t" >> /tmp/textos-faltantes.txt
  fi
done < /tmp/textos-bundle.txt

FALTAN=$(wc -l < /tmp/textos-faltantes.txt)
echo "textos del original : $TOTAL"
echo "  en src/           : $EN_SRC"
echo "  de librería       : $EN_LIB"
echo "  sin ubicar        : $FALTAN"
[ "$FALTAN" -gt 0 ] && { echo; echo "--- sin ubicar ---"; cat /tmp/textos-faltantes.txt; }
exit 0
