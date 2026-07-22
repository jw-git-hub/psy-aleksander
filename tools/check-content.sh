#!/usr/bin/env bash
# Проверки контента и разметки сайта.
# Запуск из любой директории: bash tools/check-content.sh
set -uo pipefail
cd "$(dirname "$0")/.."

failures=0

pass() { printf '  \033[32m+\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m-\033[0m %s\n' "$1"; failures=$((failures + 1)); }
section() { printf '\n%s\n' "$1"; }

# Подстрока обязана присутствовать в файле
expect_present() {
  if grep -qF -- "$2" "$1"; then pass "$3"; else fail "$3 (нет в $1: «$2»)"; fi
}

# Подстроки быть не должно
expect_absent() {
  if grep -qF -- "$2" "$1"; then fail "$3 (всё ещё в $1: «$2»)"; else pass "$3"; fi
}

# Точное число вхождений
expect_count() {
  local actual
  actual=$(grep -oF -- "$2" "$1" | wc -l | tr -d ' ')
  if [ "$actual" = "$3" ]; then pass "$4"; else fail "$4 (ожидалось $3, найдено $actual)"; fi
}

section 'Базовая целостность'
expect_present index.html '<html lang="ru">' 'язык страницы — русский'
expect_present index.html '<main class="main" id="top">' 'основной контент в <main>'
expect_count index.html '<h1' 1 'ровно один <h1>'

section 'Якоря навигации'
for anchor in signs help quiz process approach about docs pricing faq contacts; do
  expect_present index.html "id=\"$anchor\"" "якорь #$anchor на месте"
done

section 'Приватность: адреса и координат быть не должно'
expect_absent index.html 'streetAddress' 'нет streetAddress в разметке'
expect_absent index.html '"geo"' 'нет geo-координат в разметке'

section 'Обязательные формулировки'
expect_present index.html 'не&nbsp;медицинская услуга' 'дисклеймер о немедицинском характере услуги'
expect_present index.html 'Этический кодекс психолога' 'упоминание этического кодекса'

section 'Запрещённые типы схемы'
for forbidden in MedicalBusiness Physician MedicalClinic AggregateRating '"Review"'; do
  expect_absent index.html "$forbidden" "нет $forbidden"
done

section 'Фактура: цены и длительность'
expect_absent index.html '3500 ₽' 'старая цена 3500 убрана'
expect_absent index.html '50–60 минут' 'старая длительность 50–60 убрана'
expect_present index.html '5000 ₽' 'цена индивидуальной онлайн-сессии'
expect_present index.html '10 000 ₽' 'цена работы с парой онлайн'
expect_present index.html '2500 бат' 'цена индивидуальной очной сессии'
expect_present index.html '5000 бат' 'цена очной работы с парой'
expect_present index.html '40–60 минут' 'длительность индивидуальной сессии'
expect_present index.html '90–120 минут' 'длительность работы с парой'

section 'Фактура: очный формат и часы'
expect_present index.html 'Самуи' 'очный формат упомянут'
expect_present index.html 'UTC+7' 'часовой пояс Самуи указан'
expect_present index.html 'МСК' 'пересчёт в московское время указан'

section 'JSON-LD'
if node tools/check-jsonld.mjs index.html; then
  pass 'все блоки JSON-LD валидны'
else
  fail 'JSON-LD не парсится'
fi

printf '\n'
if [ "$failures" -eq 0 ]; then
  printf '\033[32mВсе проверки пройдены.\033[0m\n'
  exit 0
fi
printf '\033[31mПровалено проверок: %s\033[0m\n' "$failures"
exit 1
