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
  if [ ! -f "$1" ]; then fail "$3 (файл $1 не найден)"; return; fi
  if grep -qF -- "$2" "$1"; then pass "$3"; else fail "$3 (нет в $1: «$2»)"; fi
}

# Подстроки быть не должно
expect_absent() {
  if [ ! -f "$1" ]; then fail "$3 (файл $1 не найден)"; return; fi
  if grep -qF -- "$2" "$1"; then fail "$3 (всё ещё в $1: «$2»)"; else pass "$3"; fi
}

# Точное число вхождений
expect_count() {
  if [ ! -f "$1" ]; then fail "$4 (файл $1 не найден)"; return; fi
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

section 'FAQ'
expect_present index.html 'Можно ли прийти на консультацию очно?' 'вопрос об очном приёме есть'
expect_count index.html '<details class="faq-card' 10 'в FAQ десять вопросов'
expect_count index.html '"@type": "Question"' 10 'в FAQPage десять вопросов'
expect_absent index.html 'Все консультации проходят онлайн' 'формулировка «только онлайн» убрана'

section 'Schema.org'
expect_count index.html '<script type="application/ld+json">' 1 'ровно один блок JSON-LD'
expect_present index.html '"@id": "https://psy-krasnogor.pro/#person"' 'узел Person адресуем по @id'
expect_present index.html '"founder": { "@id": "https://psy-krasnogor.pro/#person" }' 'практика связана с персоной'
expect_present index.html '"hasCredential"' 'квалификации размечены'
expect_present index.html '"alumniOf"' 'вуз размечен'
expect_present index.html '"knowsAbout"' 'темы и методы размечены'
expect_present index.html '"ProfessionalService"' 'сущность практики'
expect_present index.html '"addressLocality": "Ко Самуи"' 'локация на уровне острова'
expect_present index.html '"openingHoursSpecification"' 'часы приёма размечены'
expect_present index.html '"priceCurrency": "THB"' 'цены в батах размечены'
expect_absent index.html '"LocalBusiness"' 'комбинированный тип убран'
expect_absent index.html '"priceRange"' 'бессодержательный priceRange убран'
expect_absent index.html '"addressCountry": "RU"' 'неверная страна убрана'
expect_absent index.html '"price": "3500"' 'устаревшая цена ушла из разметки'
expect_count index.html '"@type": "Offer"' 5 'пять офферов'

section 'Метатеги'
expect_present index.html '<title>Семейный психолог Александр Красногор — онлайн и Самуи</title>' 'title обновлён'
expect_present index.html 'hreflang="ru"' 'hreflang ru'
expect_present index.html 'hreflang="x-default"' 'hreflang x-default'
expect_present index.html '<meta property="og:type" content="profile">' 'og:type = profile'
expect_absent index.html 'content="website"' 'старый og:type убран'

section 'Блок-суммари'
expect_present index.html 'id="summary"' 'секция-суммари есть'
expect_present index.html 'в&nbsp;профессии с 2016 года' 'указан стаж'
expect_present index.html 'КПТ, гештальт-терапии, ЭФТ' 'перечислены методы'

section 'Соответствие FAQ и разметки'
if node tools/check-faq-sync.mjs index.html; then
  pass 'видимый FAQ и FAQPage совпадают по порядку и текстам'
else
  fail 'FAQ и FAQPage разошлись'
fi

section 'Сквозная консистентность'
expect_absent index.html '3500' 'нигде не осталось старой цены'
expect_absent index.html 'от 5000' 'цены указаны без приставки «от»'
expect_absent llms.txt '3500' 'в llms.txt нет старой цены'
expect_present index.html 'Александр Красногор' 'полное имя на странице'

section 'Техфайлы'
expect_present robots.txt 'User-agent: GPTBot' 'GPTBot разрешён явно'
expect_present robots.txt 'User-agent: ClaudeBot' 'ClaudeBot разрешён явно'
expect_present robots.txt 'User-agent: PerplexityBot' 'PerplexityBot разрешён явно'
expect_present robots.txt 'Disallow: /pages/privacy.html' 'политика закрыта от индексации'
expect_present llms.txt '# Александр Красногор' 'llms.txt есть'
expect_absent llms.txt 'streetAddress' 'в llms.txt нет адреса'
expect_present sitemap.xml '<lastmod>2026-07-22</lastmod>' 'дата в sitemap обновлена'

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
