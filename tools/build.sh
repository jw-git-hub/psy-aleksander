#!/usr/bin/env bash
# Сборка CSS и JS: склейка исходников и минификация через esbuild.
# Исходники в css/ и js/ остаются источником правды — правим только их,
# а собранные *.min.* перегенерируем этим скриптом перед коммитом.
# Запуск из любой директории: bash tools/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."

ESBUILD="npx --yes esbuild@0.25"

# Порядок склейки CSS обязателен — от него зависит каскад
CSS_SOURCES="css/fonts.css css/variables.css css/reset.css css/base.css css/style.css"
JS_SOURCES="js/main.js js/quiz.js"

step() { printf '\n%s\n' "$1"; }

# Отпечаток исходников — по нему check-content.sh ловит забытую пересборку
fingerprint() { cat "$@" | shasum -a 256 | cut -c1-12; }

# Склеивает файлы и минифицирует результат.
# $1 — тип для esbuild (css|js), $2 — итоговый файл, далее исходники
bundle() {
  local loader="$1" target="$2"; shift 2
  local raw; raw="$(mktemp -t bundle).${loader}"
  cat "$@" > "$raw"
  $ESBUILD "$raw" --minify "--loader:.${loader}=${loader}" --outfile="$target" --log-level=warning

  # Штамп в конец файла: отпечаток исходников, из которых он собран
  if [ "$loader" = css ]; then
    printf '\n/*src:%s*/\n' "$(fingerprint "$@")" >> "$target"
  else
    printf '\n//src:%s\n' "$(fingerprint "$@")" >> "$target"
  fi

  local before after
  before=$(cat "$@" | wc -c)
  after=$(wc -c < "$target")
  rm -f "$raw"
  printf '  %-18s %4s КБ  (из %2s КБ, %s файл.)\n' \
    "$target" "$((after / 1024))" "$((before / 1024))" "$#"
}

step 'Стили:'
bundle css css/app.min.css $CSS_SOURCES
bundle css css/legal.min.css css/legal.css

step 'Скрипты:'
# Склейка безопасна: оба файла целиком завёрнуты в обработчик
# DOMContentLoaded, объявлений на верхнем уровне нет
bundle js js/app.min.js $JS_SOURCES

step 'Готово. Собранные файлы нужно закоммитить вместе с исходниками.'
