# SEO- и GEO-оптимизация psy-krasnogor.pro — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести фактуру сайта в соответствие с действительностью (цены, длительность, очный приём на Самуи), перестроить schema.org в связный граф и добавить извлекаемость для ИИ-систем.

**Architecture:** Работа идёт слоями, а не по секциям страницы: фактура → FAQ → блок-суммари → метатеги → schema → техфайлы. Причина в том, что одна величина живёт в нескольких местах одновременно (цена — в карточке прайса, в `Offer`, в ответе FAQ и в `FAQPage`), и правка слоем гарантирует консистентность. Роль тестов играет скрипт `tools/check-content.sh`: каждая задача сначала добавляет в него проверки, которые падают, затем правит сайт до зелёного.

**Tech Stack:** Статический HTML/CSS/JS без сборки. Хостинг GitHub Pages. Для проверок — bash + `node` (v24, уже установлен). Тестового фреймворка в проекте нет и он не заводится.

## Global Constraints

Эти требования действуют во **всех** задачах без исключения. Источник —
`docs/superpowers/specs/2026-07-22-seo-geo-optimizatsiya-design.md`.

- **Адрес не публикуется.** Максимальная точность локации — «о. Самуи» / «Ко Самуи» / «Koh Samui». Никаких `streetAddress`, никаких `geo`, никаких координат — ни в HTML, ни в JSON-LD, ни в `llms.txt`. Требование безопасности.
- **Никаких выдуманных фактов.** Отзывы, рейтинги, число клиентов, звания, часы обучения — только подтверждённые. `Review` и `AggregateRating` не добавляются никогда.
- **Никаких медицинских типов схемы** — `MedicalBusiness`, `Physician`, `MedicalClinic` и аналоги запрещены.
- **Никаких обещаний результата.** Дисклеймер о том, что консультирование не заменяет врача-психиатра, упоминания этического кодекса и конфиденциальности сохраняются дословно и не ослабляются.
- **URL и якоря не меняются:** `#signs`, `#help`, `#quiz`, `#process`, `#approach`, `#about`, `#docs`, `#pricing`, `#faq`, `#contacts`.
- Пользовательский текст — на русском; ключи schema.org и HTML-атрибуты — на английском.
- Репозиторий публичный.

**Актуальная фактура — единственный источник истины.** Данные на текущей странице и в промтах устарели.

| Услуга | Онлайн | Очно, о. Самуи | Длительность |
|---|---|---|---|
| Индивидуальная консультация | 5000 ₽ | 2500 бат | 40–60 мин |
| Консультирование пары / семьи | 10 000 ₽ | 5000 бат | 90–120 мин |

- Первая встреча-знакомство 20 минут — **бесплатно**, в обоих форматах.
- Цены фиксированные: приставка «от» **не используется**.
- Часы приёма: **Пн–Пт, 9:00–20:00 по времени о. Самуи (UTC+7)** = 5:00–16:00 МСК. На сайте указываются оба пояса.
- Форматы: онлайн (Zoom, Telegram, Max) и очно на о. Самуи, Таиланд.

**Ссылки, используемые в нескольких задачах:**

- Telegram личный: `https://t.me/lex4747`
- Telegram-канал: `https://t.me/domgdeslushat`
- Max личный: `https://max.ru/u/f9LHodD0cOJQvp0dbqo-AxlFudh6LeiadkkXjF6NHFX6ShGGfXY7oe2DgLU`
- Max-чат: `https://max.ru/join/2LVnmf3RVF_O02eFcMMh_9LaDh79B4qH_W0UrdIQ9vY`

---

## Структура файлов

| Файл | Что делаем | Ответственность |
|---|---|---|
| `tools/check-content.sh` | создать | Проверки контента и разметки: наличие/отсутствие подстрок, вызов валидатора JSON-LD. Единая точка запуска. |
| `tools/check-jsonld.mjs` | создать | Извлекает все блоки `application/ld+json` из HTML и проверяет, что каждый парсится. Отдельный файл, потому что bash не умеет в JSON. |
| `index.html` | править | Единственная страница сайта: контент, метатеги, JSON-LD. |
| `css/style.css` | править | Стили новых элементов — цены в карточках и блок-суммари. Новых CSS-файлов не создаём. |
| `llms.txt` | создать | Карта сайта для ИИ-систем. |
| `robots.txt` | править | Явные разрешения для ИИ-краулеров. |
| `sitemap.xml` | править | Обновление `lastmod`. |

`index.html` — 1219 строк, единый файл. Это осознанное состояние проекта (статический сайт без сборки), дробить его в рамках этой задачи не нужно.

---

### Task 1: Проверочная оснастка

Без неё остальные задачи не имеют способа доказать, что сработали. Скрипт стартует с проверок, которые проходят на текущем состоянии сайта, — дальше каждая задача дописывает свои.

**Files:**
- Create: `tools/check-content.sh`
- Create: `tools/check-jsonld.mjs`

**Interfaces:**
- Consumes: ничего.
- Produces: команда `bash tools/check-content.sh` — код возврата 0 при успехе, 1 при провале. Bash-функции для последующих задач:
  - `expect_present ФАЙЛ ПОДСТРОКА ОПИСАНИЕ` — падает, если подстроки нет
  - `expect_absent ФАЙЛ ПОДСТРОКА ОПИСАНИЕ` — падает, если подстрока есть
  - `expect_count ФАЙЛ ПОДСТРОКА ЧИСЛО ОПИСАНИЕ` — падает, если число вхождений не совпало
  - `section ЗАГОЛОВОК` — печатает заголовок группы проверок

- [ ] **Step 1: Создать валидатор JSON-LD**

Файл `tools/check-jsonld.mjs`:

```js
// Проверка JSON-LD: каждый блок application/ld+json должен парситься.
// Отдельный скрипт на node, потому что разбирать JSON средствами bash нельзя.
import { readFileSync } from 'node:fs';

const BLOCK_PATTERN = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

function findBlocks(html) {
  return [...html.matchAll(BLOCK_PATTERN)].map((match) => match[1]);
}

function reportInvalid(blocks) {
  let invalid = 0;

  blocks.forEach((body, index) => {
    try {
      JSON.parse(body);
    } catch (error) {
      console.error(`  блок ${index + 1}: ${error.message}`);
      invalid += 1;
    }
  });

  return invalid;
}

const filePath = process.argv[2];
const blocks = findBlocks(readFileSync(filePath, 'utf8'));

if (blocks.length === 0) {
  console.error('  блоков JSON-LD не найдено');
  process.exit(1);
}

const invalid = reportInvalid(blocks);
console.log(`  блоков: ${blocks.length}, невалидных: ${invalid}`);
process.exit(invalid === 0 ? 0 : 1);
```

- [ ] **Step 2: Создать скрипт проверок**

Файл `tools/check-content.sh`:

```bash
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
```

- [ ] **Step 3: Запустить и убедиться, что на текущем состоянии всё зелёное**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 0, последняя строка «Все проверки пройдены.», в блоке JSON-LD — «блоков: 3, невалидных: 0».

Если что-то падает — значит проверка написана неверно (сайт сейчас в рабочем состоянии). Чинить проверку, не сайт.

- [ ] **Step 4: Коммит**

```bash
git add tools/check-content.sh tools/check-jsonld.mjs
git commit -m "test: скрипт проверки контента и валидности JSON-LD"
```

---

### Task 2: Фактура — цены, длительность, очный формат

**Files:**
- Modify: `index.html` — секция `#process` (~строки 526–555), секция `#pricing` (~строки 910–973), подзаголовок героя (~строка 329)
- Modify: `css/style.css` — секция «Стоимость» (начинается на строке 1080)
- Modify: `tools/check-content.sh`

**Interfaces:**
- Consumes: функции `expect_present` / `expect_absent` / `section` из Task 1.
- Produces: CSS-классы `.pricing-card__prices`, `.pricing-card__price-row`, `.pricing-card__format`, `.pricing-card__duration` — используются только внутри этой задачи.

- [ ] **Step 1: Добавить падающие проверки**

В `tools/check-content.sh` перед секцией `'JSON-LD'` вставить:

```bash
section 'Фактура: цены и длительность'
expect_absent index.html 'от 3500' 'старая цена 3500 убрана'
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
```

- [ ] **Step 2: Убедиться, что проверки падают**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 1, провалено 11 проверок — все из двух новых секций.

- [ ] **Step 3: Обновить подзаголовок героя**

В `index.html` заменить строку:

```html
          <p class="hero__eyebrow">Семейный психолог · Онлайн-консультации · Опыт с&nbsp;2016&nbsp;года</p>
```

на:

```html
          <p class="hero__eyebrow">Семейный психолог · Онлайн и&nbsp;очно на&nbsp;о.&nbsp;Самуи · Опыт с&nbsp;2016&nbsp;года</p>
```

- [ ] **Step 4: Обновить карточки «Формат» и «Длительность сессии» в секции «Как проходит работа»**

Заменить содержимое первых двух `<li class="process-card ...">`:

```html
          <li class="process-card animate-on-scroll">
            <span class="process-card__num" aria-hidden="true">1</span>
            <h3 class="process-card__title">Формат</h3>
            <p class="process-card__text">Онлайн (Zoom, Telegram, Max) или очно на о. Самуи</p>
          </li>
          <li class="process-card animate-on-scroll">
            <span class="process-card__num" aria-hidden="true">2</span>
            <h3 class="process-card__title">Длительность сессии</h3>
            <p class="process-card__text">40–60 минут индивидуально, 90–120 минут с парой</p>
          </li>
```

Карточки 3 («Периодичность») и 4 («Конфиденциальность») не трогаем.

- [ ] **Step 5: Переписать цены в карточках услуг**

В секции `#pricing` заменить весь блок `<ul class="pricing__list">…</ul>` на:

```html
        <ul class="pricing__list">
          <li class="pricing-card animate-on-scroll">
            <h3 class="pricing-card__title">Консультация психолога</h3>
            <ul class="pricing-card__prices" role="list">
              <li class="pricing-card__price-row">
                <span class="pricing-card__format">Онлайн</span>
                <span class="pricing-card__price">5000 ₽</span>
              </li>
              <li class="pricing-card__price-row">
                <span class="pricing-card__format">Очно, о.&nbsp;Самуи</span>
                <span class="pricing-card__price">2500 бат</span>
              </li>
            </ul>
            <p class="pricing-card__duration">40–60 минут · один человек</p>
            <p class="pricing-card__desc">
              Индивидуальная сессия для работы с тревогой, выгоранием, низкой самооценкой, переживанием потерь, поиском смысла и другими личными запросами. На первой встрече мы знакомимся, формулируем запрос и согласуем дальнейший план работы.
            </p>
            <a class="btn btn--accent pricing-card__btn" href="#contacts" data-analytics="pricing_individual_anchor">Записаться</a>
          </li>
          <li class="pricing-card animate-on-scroll">
            <h3 class="pricing-card__title">Семейное консультирование</h3>
            <ul class="pricing-card__prices" role="list">
              <li class="pricing-card__price-row">
                <span class="pricing-card__format">Онлайн</span>
                <span class="pricing-card__price">10 000 ₽</span>
              </li>
              <li class="pricing-card__price-row">
                <span class="pricing-card__format">Очно, о.&nbsp;Самуи</span>
                <span class="pricing-card__price">5000 бат</span>
              </li>
            </ul>
            <p class="pricing-card__duration">90–120 минут · пара или семья</p>
            <p class="pricing-card__desc">
              Работа с парами и семьями: разбор конфликтных ситуаций, восстановление взаимопонимания, обсуждение ролей и ожиданий. Подходит, если хочется выйти из тупика повторяющихся ссор или вместе пережить кризисный период.
            </p>
            <a class="btn btn--accent pricing-card__btn" href="#contacts" data-analytics="pricing_family_anchor">Записаться</a>
          </li>
        </ul>
```

Описания услуг и кнопки сохранены дословно — это работающий текст, менять его не нужно.

- [ ] **Step 6: Переписать блок условий под прайсом**

Заменить весь `<ul class="pricing__details" …>…</ul>` на:

```html
        <ul class="pricing__details animate-on-scroll" aria-label="Условия проведения сессий">
          <li class="pricing-detail">
            <span class="pricing-detail__label">Форматы</span>
            <span class="pricing-detail__value">Онлайн (Zoom, Telegram, Max) или очно на&nbsp;о.&nbsp;Самуи</span>
          </li>
          <li class="pricing-detail">
            <span class="pricing-detail__label">Часы приёма</span>
            <span class="pricing-detail__value">Пн–Пт, 9:00–20:00 по&nbsp;времени Самуи (UTC+7)&nbsp;— это 5:00–16:00 МСК</span>
          </li>
          <li class="pricing-detail">
            <span class="pricing-detail__label">Оплата</span>
            <span class="pricing-detail__value">Наличными или переводом, после сессии</span>
          </li>
        </ul>
```

Строка «Длительность» удалена намеренно: длительность теперь зависит от формата и указана в карточках.

- [ ] **Step 7: Добавить стили**

В `css/style.css`, в секцию «Стоимость» (после правила `.pricing-card__price--free`), добавить:

```css
/* Две цены в карточке: онлайн и очно на Самуи */
.pricing-card__prices {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin: var(--spacing-sm) 0 var(--spacing-xs);
}

.pricing-card__price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--color-border);
}

.pricing-card__price-row:last-child {
  border-bottom: none;
}

.pricing-card__format {
  font-size: var(--fs-small);
  color: var(--color-text-light);
}

.pricing-card__duration {
  margin-bottom: var(--spacing-sm);
  font-size: var(--fs-small);
  color: var(--color-text-light);
}
```

Существующее правило `.pricing-card__price` (размер `--fs-price`) остаётся: оно и так применяется к цене внутри строки.

- [ ] **Step 8: Запустить проверки — ожидается остаточный провал по FAQ**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 1, провалено ровно 2 проверки — `старая цена 3500 убрана` и `старая длительность 50–60 убрана`. Остальные новые проверки зелёные.

Причина: старые цифры остались в ответах FAQ и в блоке `FAQPage`. Это чинится следующим шагом. Если провалено что-то ещё — разбираться с этим, прежде чем идти дальше.

- [ ] **Step 9: Убрать устаревшую фактуру из FAQ (видимый текст и JSON-LD)**

Старые значения остались в двух ответах FAQ и в `FAQPage`. Здесь — минимальная правка цифр; содержательная переработка ответов идёт в Task 3.

В видимом тексте FAQ заменить:

```html
              <p>Стандартная консультация длится 50–60 минут.</p>
```

на:

```html
              <p>Индивидуальная сессия длится 40–60 минут, работа с парой или семьёй — 90–120 минут.</p>
```

и:

```html
              <p>От 3500 ₽. Первичная консультация (20 минут) — бесплатно.</p>
```

на:

```html
              <p>Индивидуальная консультация — 5000 ₽ онлайн или 2500 бат очно на Самуи. Работа с парой — 10 000 ₽ онлайн или 5000 бат очно. Первая встреча-знакомство 20 минут — бесплатно.</p>
```

В блоке `FAQPage` синхронно заменить:

```json
          "text": "Стандартная консультация длится 50–60 минут."
```

на:

```json
          "text": "Индивидуальная сессия длится 40–60 минут, работа с парой или семьёй — 90–120 минут."
```

и:

```json
          "text": "От 3500 ₽. Первичная консультация (20 минут) — бесплатно."
```

на:

```json
          "text": "Индивидуальная консультация — 5000 ₽ онлайн или 2500 бат очно на Самуи. Работа с парой — 10 000 ₽ онлайн или 5000 бат очно. Первая встреча-знакомство 20 минут — бесплатно."
```

- [ ] **Step 10: Повторно запустить проверки**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 0, «Все проверки пройдены.»

- [ ] **Step 11: Глазами проверить вёрстку прайса**

```bash
python3 -m http.server 8000
```

Открыть `http://localhost:8000/#pricing`, сузить окно до 375px. Убедиться: цены не наезжают друг на друга, карточки не разъезжаются, горизонтального скролла страницы нет. Остановить сервер (Ctrl+C).

- [ ] **Step 12: Коммит**

```bash
git add index.html css/style.css tools/check-content.sh
git commit -m "fix: актуальные цены, длительность сессий и очный формат на Самуи"
```

---

### Task 3: FAQ — answer-first и вопрос об очном приёме

**Files:**
- Modify: `index.html` — секция `#faq` (~строки 974–1095) и блок `FAQPage` (~строки 88–170)
- Modify: `tools/check-content.sh`

**Interfaces:**
- Consumes: функции проверок из Task 1; цены и длительности, зафиксированные в Task 2.
- Produces: десятый вопрос FAQ. Текст ответов дальше используется в Task 6 при переносе `FAQPage` в общий граф — переносится дословно.

**Важно про `&nbsp;`.** В видимом HTML неразрывные пробелы ставятся по типографике, в JSON-LD пишутся обычные пробелы. Google сравнивает *отрендеренный* текст, где `&nbsp;` уже стал пробелом, — расхождения не возникает.

- [ ] **Step 1: Добавить падающие проверки**

В `tools/check-content.sh` перед секцией `'JSON-LD'` вставить:

```bash
section 'FAQ'
expect_present index.html 'Можно ли прийти на консультацию очно?' 'вопрос об очном приёме есть'
expect_count index.html '<details class="faq-card' 10 'в FAQ десять вопросов'
expect_count index.html '"@type": "Question"' 10 'в FAQPage десять вопросов'
expect_absent index.html 'Все консультации проходят онлайн' 'формулировка «только онлайн» убрана'
```

- [ ] **Step 2: Убедиться, что проверки падают**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 1, провалено 4 проверки (вопросов сейчас 9, нового нет, старая формулировка на месте).

- [ ] **Step 3: Переписать ответ о формате**

В видимом FAQ заменить:

```html
              <p>Все консультации проходят онлайн: через Zoom, Telegram или Max — на ваш выбор.</p>
```

на:

```html
              <p>Консультации проходят онлайн или очно&nbsp;— на&nbsp;ваш выбор. Онлайн&nbsp;— через Zoom, Telegram или Max; очно&nbsp;— на&nbsp;острове Самуи в&nbsp;Таиланде.</p>
```

Синхронно в `FAQPage`:

```json
          "text": "Консультации проходят онлайн или очно — на ваш выбор. Онлайн — через Zoom, Telegram или Max; очно — на острове Самуи в Таиланде."
```

- [ ] **Step 4: Уточнить ответ о записи**

Заменить в видимом FAQ:

```html
              <p>Записаться можно через Telegram: <a class="faq-card__link" href="https://t.me/lex4747" target="_blank" rel="noopener noreferrer">@lex4747</a>.</p>
```

на:

```html
              <p>Записаться можно через Telegram: <a class="faq-card__link" href="https://t.me/lex4747" target="_blank" rel="noopener noreferrer">@lex4747</a> или через Max. Александр отвечает лично, обычно в&nbsp;течение дня. Приём Пн–Пт, 9:00–20:00 по&nbsp;времени Самуи (UTC+7)&nbsp;— это 5:00–16:00 МСК.</p>
```

Синхронно в `FAQPage`:

```json
          "text": "Записаться можно через Telegram: @lex4747 или через Max. Александр отвечает лично, обычно в течение дня. Приём Пн–Пт, 9:00–20:00 по времени Самуи (UTC+7) — это 5:00–16:00 МСК."
```

- [ ] **Step 5: Добавить десятый вопрос в видимый FAQ**

В конец `<div class="faq__list">`, после последнего `</details>` (вопрос «Что если партнёр против парной терапии?»), добавить:

```html
          <details class="faq-card animate-on-scroll">
            <summary class="faq-card__head">
              <span class="faq-card__question">Можно ли прийти на консультацию очно?</span>
              <span class="faq-card__chevron" aria-hidden="true">
                <svg width="20" height="20" aria-hidden="true"><use href="#icon-chevron-down"/></svg>
              </span>
            </summary>
            <div class="faq-card__body">
              <p>Да. Александр Красногор принимает очно на&nbsp;острове Самуи в&nbsp;Таиланде&nbsp;— место встречи согласуем в&nbsp;переписке. Очная сессия стоит 2500 бат индивидуально и&nbsp;5000 бат для пары. Если вы&nbsp;не&nbsp;на&nbsp;Самуи, остаётся онлайн-формат: Zoom, Telegram или Max.</p>
            </div>
          </details>
```

- [ ] **Step 6: Добавить тот же вопрос в `FAQPage`**

В массив `mainEntity`, после последнего объекта `Question`, добавить:

```json
      ,{
        "@type": "Question",
        "name": "Можно ли прийти на консультацию очно?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Да. Александр Красногор принимает очно на острове Самуи в Таиланде — место встречи согласуем в переписке. Очная сессия стоит 2500 бат индивидуально и 5000 бат для пары. Если вы не на Самуи, остаётся онлайн-формат: Zoom, Telegram или Max."
        }
      }
```

Запятую поставить в конце предыдущего объекта, а не в начале нового, — форматирование должно совпадать с соседями.

- [ ] **Step 7: Убедиться, что проверки прошли**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 0, «Все проверки пройдены.», в блоке JSON-LD — «блоков: 3, невалидных: 0».

Если JSON-LD не парсится — почти наверняка лишняя или пропущенная запятая в `mainEntity` из Step 6.

- [ ] **Step 8: Проверить, что аккордеон работает**

```bash
python3 -m http.server 8000
```

Открыть `http://localhost:8000/#faq`, раскрыть десятый вопрос, убедиться, что он открывается и закрывается как остальные. Остановить сервер.

- [ ] **Step 9: Коммит**

```bash
git add index.html tools/check-content.sh
git commit -m "feat: FAQ — прямые ответы и вопрос об очном приёме на Самуи"
```

---

### Task 4: Блок-суммари для ИИ-систем

**Files:**
- Modify: `index.html` — вставка новой секции между `</section>` героя и `<section class="section signs" id="signs" …>`
- Modify: `css/style.css` — новая секция стилей перед секцией «Signs»
- Modify: `tools/check-content.sh`

**Interfaces:**
- Consumes: `.container`, `.section`, `.animate-on-scroll`, `.visually-hidden` (объявлен в `css/base.css:100`) — существующие классы проекта.
- Produces: секция `#summary` и классы `.summary`, `.summary__text`. Якорь `#summary` в навигацию не добавляется — блок читается сверху вниз вместе с героем.

- [ ] **Step 1: Добавить падающие проверки**

В `tools/check-content.sh` перед секцией `'JSON-LD'` вставить:

```bash
section 'Блок-суммари'
expect_present index.html 'id="summary"' 'секция-суммари есть'
expect_present index.html 'в профессии с 2016 года' 'указан стаж'
expect_present index.html 'КПТ, гештальт-терапии, ЭФТ' 'перечислены методы'
```

- [ ] **Step 2: Убедиться, что проверки падают**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 1, провалено 3 проверки.

- [ ] **Step 3: Вставить секцию в HTML**

Между закрывающим `</section>` героя и открывающим тегом секции `#signs` вставить:

```html
    <!-- ============================================
         1.5. Коротко — самодостаточная выжимка фактов.
         Отдельный блок нужен затем, что остальные факты
         размазаны по пяти секциям, и цельного фрагмента
         для цитирования в ответах ИИ на странице нет.
         ============================================ -->
    <section class="section summary" id="summary" aria-labelledby="summary-title">
      <div class="container">
        <h2 class="visually-hidden" id="summary-title">Коротко о специалисте</h2>
        <p class="summary__text animate-on-scroll">
          <strong>Александр Красногор</strong>&nbsp;— семейный психолог, в&nbsp;профессии с 2016 года. Консультирует онлайн (Zoom, Telegram, Max) и&nbsp;очно на&nbsp;острове Самуи в&nbsp;Таиланде. Работает с&nbsp;тревогой, отношениями, выгоранием, самооценкой и&nbsp;кризисами методами КПТ, гештальт-терапии, ЭФТ и&nbsp;практик осознанности.
        </p>
        <p class="summary__text animate-on-scroll">
          Первая встреча-знакомство 20&nbsp;минут&nbsp;— бесплатно. Индивидуальная сессия 40–60&nbsp;минут стоит 5000&nbsp;₽ онлайн или 2500&nbsp;бат очно; работа с&nbsp;парой 90–120&nbsp;минут&nbsp;— 10&nbsp;000&nbsp;₽ онлайн или 5000&nbsp;бат очно. Приём Пн–Пт, 9:00–20:00 по&nbsp;времени Самуи (UTC+7).
        </p>
      </div>
    </section>
```

Заголовок скрыт визуально, но существует в DOM: иерархия `H1 → H2` не должна прерываться, а видимый заголовок здесь не нужен — блок читается как продолжение героя.

- [ ] **Step 4: Добавить стили**

В `css/style.css` перед секцией «Signs — «Если узнаёте себя»» добавить:

```css
/* =============================================
   Коротко — выжимка фактов под первым экраном
   ============================================= */

.summary {
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  background-color: var(--color-bg-alt);
}

.summary__text {
  max-width: 46rem;
  margin: 0 auto;
  font-size: var(--fs-body);
  line-height: 1.7;
  color: var(--color-text);
}

.summary__text + .summary__text {
  margin-top: var(--spacing-sm);
}
```

- [ ] **Step 5: Убедиться, что проверки прошли**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 0, «Все проверки пройдены.»

- [ ] **Step 6: Проверить чередование фона секций**

```bash
python3 -m http.server 8000
```

Открыть `http://localhost:8000/`. Новая секция идёт на фоне `--color-bg-alt`, следом `#signs` на основном фоне — убедиться, что две одинаковые заливки не встали подряд и переход выглядит осмысленно. Проверить на 375px, что текст не прижат к краям. Остановить сервер.

Если `#signs` тоже оказался светлым и получилась «полоса» — поменять `background-color` у `.summary` на `var(--color-bg)`.

- [ ] **Step 7: Проверить страницу с отключённым JS**

В DevTools отключить JavaScript, перезагрузить страницу. Блок-суммари должен быть виден: класс `animate-on-scroll` скрывает элементы только при наличии класса `.js` на `<html>`.

- [ ] **Step 8: Коммит**

```bash
git add index.html css/style.css tools/check-content.sh
git commit -m "feat: блок-выжимка фактов для цитирования ИИ-системами"
```

---

### Task 5: Метатеги `<head>`

**Files:**
- Modify: `index.html` — блок SEO-метатегов и Open Graph (~строки 17–34)
- Modify: `tools/check-content.sh`

**Interfaces:**
- Consumes: ничего от предыдущих задач.
- Produces: значение `title`, которое Task 6 подставляет в `WebPage.name`: «Семейный психолог Александр Красногор — онлайн и Самуи».

- [ ] **Step 1: Добавить падающие проверки**

В `tools/check-content.sh` перед секцией `'JSON-LD'` вставить:

```bash
section 'Метатеги'
expect_present index.html '<title>Семейный психолог Александр Красногор — онлайн и Самуи</title>' 'title обновлён'
expect_present index.html 'hreflang="ru"' 'hreflang ru'
expect_present index.html 'hreflang="x-default"' 'hreflang x-default'
expect_present index.html '<meta property="og:type" content="profile">' 'og:type = profile'
expect_absent index.html 'content="website"' 'старый og:type убран'
```

- [ ] **Step 2: Убедиться, что проверки падают**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 1, провалено 5 проверок.

- [ ] **Step 3: Заменить блок метатегов**

Заменить блоки «SEO мета-теги», «Open Graph» и «Twitter Card» целиком на:

```html
  <!-- SEO мета-теги -->
  <title>Семейный психолог Александр Красногор — онлайн и Самуи</title>
  <meta name="description" content="Семейный психолог Александр Красногор: тревога, отношения, выгорание. Онлайн (Zoom, Telegram, Max) и очно на о. Самуи. Знакомство 20 минут бесплатно, сессия 5000 ₽.">
  <link rel="canonical" href="https://psy-krasnogor.pro/">
  <link rel="alternate" hreflang="ru" href="https://psy-krasnogor.pro/">
  <link rel="alternate" hreflang="x-default" href="https://psy-krasnogor.pro/">

  <!-- Open Graph -->
  <meta property="og:title" content="Семейный психолог Александр Красногор — онлайн и Самуи">
  <meta property="og:description" content="Тревога, отношения, выгорание, кризисы. Онлайн и очно на о. Самуи. Первая встреча 20 минут — бесплатно.">
  <meta property="og:type" content="profile">
  <meta property="og:url" content="https://psy-krasnogor.pro/">
  <meta property="og:image" content="https://psy-krasnogor.pro/img/photo.jpg">
  <meta property="og:locale" content="ru_RU">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Семейный психолог Александр Красногор — онлайн и Самуи">
  <meta name="twitter:description" content="Тревога, отношения, выгорание, кризисы. Онлайн и очно на о. Самуи. Первая встреча 20 минут — бесплатно.">
  <meta name="twitter:image" content="https://psy-krasnogor.pro/img/photo.jpg">
```

- [ ] **Step 4: Проверить длину title и description**

```bash
node -e '
const html = require("fs").readFileSync("index.html", "utf8");
const title = html.match(/<title>(.*?)<\/title>/)[1];
const desc = html.match(/<meta name="description" content="(.*?)">/)[1];
console.log("title:", title.length, "символов");
console.log("description:", desc.length, "символов");
'
```

Ожидается: title в диапазоне 50–60 символов, description — 140–160.

Если description вышел за 160 — сократить, убрав «(Zoom, Telegram, Max)». Если title короче 50 — оставить как есть, превышение верхней границы важнее недобора.

- [ ] **Step 5: Убедиться, что проверки прошли**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 0, «Все проверки пройдены.»

- [ ] **Step 6: Коммит**

```bash
git add index.html tools/check-content.sh
git commit -m "feat: метатеги под очный формат, hreflang и og:type=profile"
```

---

### Task 6: Schema.org — связный граф

Самая объёмная задача. Три независимых блока `application/ld+json` заменяются одним графом со ссылками через `@id`.

**Files:**
- Modify: `index.html` — три блока `application/ld+json` (~строки 63–210) заменяются одним
- Modify: `tools/check-content.sh`

**Interfaces:**
- Consumes: `title` из Task 5; тексты ответов FAQ из Task 3 (переносятся дословно); цены и длительности из Task 2.
- Produces: узлы графа с постоянными `@id`, на которые может опираться будущая разметка: `#website`, `#webpage`, `#person`, `#practice`, `#service-individual`, `#service-family`, `#offer-intro`, `#offer-individual-online`, `#offer-individual-samui`, `#offer-family-online`, `#offer-family-samui`.

- [ ] **Step 1: Добавить падающие проверки**

В `tools/check-content.sh` перед секцией `'JSON-LD'` вставить:

```bash
section 'Schema.org'
expect_count index.html '<script type="application/ld+json">' 1 'ровно один блок JSON-LD'
expect_present index.html '"@graph"' 'разметка собрана в граф'
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
```

- [ ] **Step 2: Убедиться, что проверки падают**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 1, провалено 12 проверок.

- [ ] **Step 3: Заменить все три блока JSON-LD на один**

Удалить блоки с комментариями `<!-- JSON-LD: LocalBusiness + Person -->`, `<!-- JSON-LD: FAQPage -->` и `<!-- JSON-LD: Service (две услуги) -->` вместе с их `<script>`, вставив на их место:

```html
  <!-- JSON-LD: связный граф — специалист, практика, услуги, офферы, FAQ -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://psy-krasnogor.pro/#website",
        "url": "https://psy-krasnogor.pro/",
        "name": "Александр Красногор — семейный психолог",
        "inLanguage": "ru",
        "publisher": { "@id": "https://psy-krasnogor.pro/#person" }
      },
      {
        "@type": "WebPage",
        "@id": "https://psy-krasnogor.pro/#webpage",
        "url": "https://psy-krasnogor.pro/",
        "name": "Семейный психолог Александр Красногор — онлайн и Самуи",
        "description": "Семейный психолог Александр Красногор: тревога, отношения, выгорание. Онлайн (Zoom, Telegram, Max) и очно на о. Самуи.",
        "inLanguage": "ru",
        "isPartOf": { "@id": "https://psy-krasnogor.pro/#website" },
        "about": { "@id": "https://psy-krasnogor.pro/#person" },
        "primaryImageOfPage": "https://psy-krasnogor.pro/img/photo.jpg"
      },
      {
        "@type": "Person",
        "@id": "https://psy-krasnogor.pro/#person",
        "name": "Александр Красногор",
        "jobTitle": "Семейный психолог",
        "url": "https://psy-krasnogor.pro/",
        "image": "https://psy-krasnogor.pro/img/photo.jpg",
        "description": "Семейный психолог. Консультирует онлайн (Zoom, Telegram, Max) и очно на острове Самуи в Таиланде. Работает с тревогой, отношениями, выгоранием, самооценкой и кризисами.",
        "knowsLanguage": "ru",
        "knowsAbout": [
          "Тревога и страхи",
          "Отношения и близость",
          "Эмоциональное выгорание",
          "Самооценка и уверенность",
          "Кризисы и потери",
          "Поиск себя и смысла",
          "Когнитивно-поведенческая терапия",
          "Гештальт-терапия",
          "Эмоционально-фокусированная терапия",
          "Практики осознанности (mindfulness)"
        ],
        "alumniOf": {
          "@type": "EducationalOrganization",
          "name": "Московский гуманитарный институт имени Е. Р. Дашковой"
        },
        "hasCredential": [
          {
            "@type": "EducationalOccupationalCredential",
            "name": "Бакалавр по направлению «Психология» (37.03.01)",
            "credentialCategory": "Диплом бакалавра",
            "dateCreated": "2016",
            "recognizedBy": {
              "@type": "EducationalOrganization",
              "name": "Московский гуманитарный институт имени Е. Р. Дашковой"
            }
          },
          {
            "@type": "EducationalOccupationalCredential",
            "name": "Психологическое консультирование и психодиагностика, 620 часов",
            "credentialCategory": "Диплом о профессиональной переподготовке",
            "dateCreated": "2023",
            "recognizedBy": {
              "@type": "EducationalOrganization",
              "name": "АНО «НИИДПО»"
            }
          },
          {
            "@type": "EducationalOccupationalCredential",
            "name": "Практический психолог. Психолог-консультант, 1640 часов",
            "credentialCategory": "Диплом о профессиональной переподготовке",
            "dateCreated": "2025",
            "recognizedBy": {
              "@type": "EducationalOrganization",
              "name": "АНО ДПО «Институт прикладной психологии в социальной сфере»"
            }
          },
          {
            "@type": "EducationalOccupationalCredential",
            "name": "Метод когнитивно-поведенческой терапии (КПТ) в работе с преодолением тревожности и страхов, 200 часов",
            "credentialCategory": "Удостоверение о повышении квалификации",
            "dateCreated": "2025",
            "recognizedBy": {
              "@type": "EducationalOrganization",
              "name": "АНО ДПО «Институт прикладной психологии в социальной сфере»"
            }
          }
        ],
        "makesOffer": [
          { "@id": "https://psy-krasnogor.pro/#offer-intro" },
          { "@id": "https://psy-krasnogor.pro/#offer-individual-online" },
          { "@id": "https://psy-krasnogor.pro/#offer-individual-samui" },
          { "@id": "https://psy-krasnogor.pro/#offer-family-online" },
          { "@id": "https://psy-krasnogor.pro/#offer-family-samui" }
        ],
        "sameAs": [
          "https://t.me/lex4747",
          "https://t.me/domgdeslushat",
          "https://max.ru/u/f9LHodD0cOJQvp0dbqo-AxlFudh6LeiadkkXjF6NHFX6ShGGfXY7oe2DgLU",
          "https://max.ru/join/2LVnmf3RVF_O02eFcMMh_9LaDh79B4qH_W0UrdIQ9vY"
        ]
      },
      {
        "@type": "ProfessionalService",
        "@id": "https://psy-krasnogor.pro/#practice",
        "name": "Психологическое консультирование — Александр Красногор",
        "url": "https://psy-krasnogor.pro/",
        "image": "https://psy-krasnogor.pro/img/photo.jpg",
        "provider": { "@id": "https://psy-krasnogor.pro/#person" },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Ко Самуи",
          "addressRegion": "Surat Thani",
          "addressCountry": "TH"
        },
        "areaServed": [
          { "@type": "Place", "name": "Ко Самуи, Таиланд" },
          { "@type": "Country", "name": "Россия" }
        ],
        "availableChannel": [
          {
            "@type": "ServiceChannel",
            "name": "Онлайн — Zoom",
            "serviceUrl": "https://psy-krasnogor.pro/#contacts"
          },
          {
            "@type": "ServiceChannel",
            "name": "Онлайн — Telegram",
            "serviceUrl": "https://t.me/lex4747"
          },
          {
            "@type": "ServiceChannel",
            "name": "Онлайн — Max",
            "serviceUrl": "https://max.ru/u/f9LHodD0cOJQvp0dbqo-AxlFudh6LeiadkkXjF6NHFX6ShGGfXY7oe2DgLU"
          },
          {
            "@type": "ServiceChannel",
            "name": "Очный приём на о. Самуи",
            "serviceLocation": {
              "@type": "Place",
              "name": "Ко Самуи, Таиланд",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Ко Самуи",
                "addressRegion": "Surat Thani",
                "addressCountry": "TH"
              }
            }
          }
        ],
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "20:00"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Услуги",
          "itemListElement": [
            { "@id": "https://psy-krasnogor.pro/#service-individual" },
            { "@id": "https://psy-krasnogor.pro/#service-family" }
          ]
        }
      },
      {
        "@type": "Service",
        "@id": "https://psy-krasnogor.pro/#service-individual",
        "name": "Консультация психолога",
        "serviceType": "Психологическое консультирование",
        "description": "Индивидуальная сессия 40–60 минут: тревога, выгорание, низкая самооценка, переживание потерь, поиск смысла и другие личные запросы.",
        "provider": { "@id": "https://psy-krasnogor.pro/#person" },
        "areaServed": [
          { "@type": "Place", "name": "Ко Самуи, Таиланд" },
          { "@type": "Country", "name": "Россия" }
        ],
        "offers": [
          { "@id": "https://psy-krasnogor.pro/#offer-individual-online" },
          { "@id": "https://psy-krasnogor.pro/#offer-individual-samui" }
        ]
      },
      {
        "@type": "Service",
        "@id": "https://psy-krasnogor.pro/#service-family",
        "name": "Семейное консультирование",
        "serviceType": "Семейное психологическое консультирование",
        "description": "Работа с парами и семьями 90–120 минут: конфликты, взаимопонимание, роли и ожидания, кризисные периоды.",
        "provider": { "@id": "https://psy-krasnogor.pro/#person" },
        "areaServed": [
          { "@type": "Place", "name": "Ко Самуи, Таиланд" },
          { "@type": "Country", "name": "Россия" }
        ],
        "offers": [
          { "@id": "https://psy-krasnogor.pro/#offer-family-online" },
          { "@id": "https://psy-krasnogor.pro/#offer-family-samui" }
        ]
      },
      {
        "@type": "Offer",
        "@id": "https://psy-krasnogor.pro/#offer-intro",
        "name": "Первая встреча-знакомство, 20 минут",
        "description": "Знакомство и обсуждение запроса. Без обязательств продолжать.",
        "price": "0",
        "priceCurrency": "RUB",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "@id": "https://psy-krasnogor.pro/#offer-individual-online",
        "name": "Индивидуальная консультация онлайн, 40–60 минут",
        "price": "5000",
        "priceCurrency": "RUB",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "@id": "https://psy-krasnogor.pro/#offer-individual-samui",
        "name": "Индивидуальная консультация очно на о. Самуи, 40–60 минут",
        "price": "2500",
        "priceCurrency": "THB",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "@id": "https://psy-krasnogor.pro/#offer-family-online",
        "name": "Консультирование пары или семьи онлайн, 90–120 минут",
        "price": "10000",
        "priceCurrency": "RUB",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "@id": "https://psy-krasnogor.pro/#offer-family-samui",
        "name": "Консультирование пары или семьи очно на о. Самуи, 90–120 минут",
        "price": "5000",
        "priceCurrency": "THB",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "FAQPage",
        "@id": "https://psy-krasnogor.pro/#faq",
        "isPartOf": { "@id": "https://psy-krasnogor.pro/#webpage" },
        "mainEntity": []
      }
    ]
  }
  </script>
```

- [ ] **Step 4: Перенести вопросы FAQ в граф**

Массив `mainEntity` в узле `FAQPage` сейчас пустой. Перенести в него **все десять** объектов `Question` из старого блока `FAQPage` — дословно, включая правки из Task 2 и Task 3. Порядок должен совпадать с порядком `<details>` в разделе `#faq`.

Проверить соответствие текстов после переноса:

```bash
node -e '
const html = require("fs").readFileSync("index.html", "utf8");
const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const faq = graph["@graph"].find((node) => node["@type"] === "FAQPage");
const questions = faq.mainEntity.map((item) => item.name);
const visible = [...html.matchAll(/<span class="faq-card__question">(.*?)<\/span>/g)].map((m) => m[1]);
console.log("в схеме:", questions.length, "| на странице:", visible.length);
questions.forEach((q, i) => {
  if (q !== visible[i]) console.log("РАСХОЖДЕНИЕ", i + 1, "\n  схема:  ", q, "\n  страница:", visible[i]);
});
'
```

Ожидается: «в схеме: 10 | на странице: 10» и ни одной строки «РАСХОЖДЕНИЕ».

- [ ] **Step 5: Убедиться, что проверки прошли**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 0, «Все проверки пройдены.», в блоке JSON-LD — «блоков: 1, невалидных: 0».

- [ ] **Step 6: Проверить граф внешним валидатором**

Открыть https://validator.schema.org/, вставить содержимое единственного блока `application/ld+json` из `index.html`.

Ожидается: 0 ошибок. Предупреждения о необязательных полях допустимы.

Отдельно убедиться глазами: ни в одном узле нет `streetAddress`, `geo`, `Review`, `AggregateRating` и медицинских типов.

- [ ] **Step 7: Коммит**

```bash
git add index.html tools/check-content.sh
git commit -m "feat: schema.org — единый граф с квалификациями, офферами и привязкой к Самуи"
```

---

### Task 7: Техфайлы — llms.txt, robots.txt, sitemap.xml

**Files:**
- Create: `llms.txt`
- Modify: `robots.txt`
- Modify: `sitemap.xml`
- Modify: `tools/check-content.sh`

**Interfaces:**
- Consumes: фактуру и якоря страницы, зафиксированные в Task 2–4.
- Produces: ничего для последующих задач.

- [ ] **Step 1: Добавить падающие проверки**

В `tools/check-content.sh` перед секцией `'JSON-LD'` вставить:

```bash
section 'Техфайлы'
expect_present robots.txt 'User-agent: GPTBot' 'GPTBot разрешён явно'
expect_present robots.txt 'User-agent: ClaudeBot' 'ClaudeBot разрешён явно'
expect_present robots.txt 'User-agent: PerplexityBot' 'PerplexityBot разрешён явно'
expect_present robots.txt 'Disallow: /pages/privacy.html' 'политика закрыта от индексации'
expect_present llms.txt '# Александр Красногор' 'llms.txt есть'
expect_absent llms.txt 'streetAddress' 'в llms.txt нет адреса'
expect_present sitemap.xml '<lastmod>2026-07-22</lastmod>' 'дата в sitemap обновлена'
```

- [ ] **Step 2: Убедиться, что проверки падают**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 1, провалено 6 проверок (`Disallow: /pages/privacy.html` уже есть и должен пройти).

- [ ] **Step 3: Переписать robots.txt**

```
# Общее правило: сайт открыт для индексации
User-agent: *
Allow: /
Disallow: /pages/privacy.html

# ИИ-краулеры разрешены намеренно: цель — попадать в ответы ассистентов.
# Технически дублирует правило выше, но фиксирует решение явно.
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: YandexBot
Allow: /

Sitemap: https://psy-krasnogor.pro/sitemap.xml
```

Правило `Disallow: /pages/privacy.html` намеренно оставлено только в общей секции: перечисленные ИИ-боты его не унаследуют, но страница политики и не содержит ничего, что стоило бы прятать от ассистентов, — важно лишь держать её вне поисковой выдачи.

- [ ] **Step 4: Создать llms.txt**

```
# Александр Красногор — семейный психолог

Семейный психолог, в профессии с 2016 года. Консультирует онлайн (Zoom, Telegram, Max)
и очно на острове Самуи в Таиланде. Работает на русском языке.
Психологическое консультирование — немедицинская услуга; оно не заменяет консультацию
врача-психиатра при тяжёлых психических расстройствах.

## С какими запросами работает

- Тревога и страхи
- Отношения и близость, конфликты в паре
- Эмоциональное выгорание
- Самооценка и уверенность
- Кризисы и потери
- Поиск себя и смысла
- Принятие решений

## Методы

Когнитивно-поведенческая терапия (КПТ), гештальт-терапия,
эмоционально-фокусированная терапия (ЭФТ), практики осознанности (mindfulness).

## Форматы и стоимость

- Первая встреча-знакомство, 20 минут — бесплатно
- Индивидуальная консультация, 40–60 минут — 5000 ₽ онлайн или 2500 бат очно
- Консультирование пары или семьи, 90–120 минут — 10 000 ₽ онлайн или 5000 бат очно

Приём: Пн–Пт, 9:00–20:00 по времени острова Самуи (UTC+7), это 5:00–16:00 по Москве.
Онлайн — Zoom, Telegram, Max. Очно — остров Самуи, Таиланд.

## Образование

- Московский гуманитарный институт имени Е. Р. Дашковой — бакалавр, «Психология» (37.03.01), 2016
- АНО «НИИДПО» — «Психологическое консультирование и психодиагностика», 620 часов, 2023
- АНО ДПО «Институт прикладной психологии в социальной сфере» — «Практический психолог. Психолог-консультант», 1640 часов, 2024–2025
- АНО ДПО «Институт прикладной психологии в социальной сфере» — КПТ в работе с тревожностью и страхами, 200 часов, 2025

Регулярно проходит личную терапию, супервизию и интервизию. Соблюдает Этический кодекс
психолога: не ставит диагнозов, не публикует кейсы и отзывы, соблюдает конфиденциальность.

## Ссылки

- Сайт: https://psy-krasnogor.pro/
- Чем помогает: https://psy-krasnogor.pro/#help
- Как проходит работа: https://psy-krasnogor.pro/#process
- Подход и методы: https://psy-krasnogor.pro/#approach
- Об Александре: https://psy-krasnogor.pro/#about
- Стоимость: https://psy-krasnogor.pro/#pricing
- Частые вопросы: https://psy-krasnogor.pro/#faq
- Контакты: https://psy-krasnogor.pro/#contacts
- Telegram для записи: https://t.me/lex4747
- Telegram-канал: https://t.me/domgdeslushat
```

- [ ] **Step 5: Обновить sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap-0.9">
  <url>
    <loc>https://psy-krasnogor.pro/</loc>
    <lastmod>2026-07-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

`pages/privacy.html` не добавляется намеренно: страница закрыта в `robots.txt`, и запрещённый URL в sitemap вызывает предупреждение в Search Console.

- [ ] **Step 6: Убедиться, что проверки прошли**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 0, «Все проверки пройдены.»

- [ ] **Step 7: Проверить, что sitemap остался валидным XML**

```bash
python3 -c "import xml.dom.minidom, sys; xml.dom.minidom.parse('sitemap.xml'); print('sitemap.xml — валидный XML')"
```

Ожидается: «sitemap.xml — валидный XML».

- [ ] **Step 8: Коммит**

```bash
git add llms.txt robots.txt sitemap.xml tools/check-content.sh
git commit -m "feat: llms.txt, явные разрешения ИИ-краулерам, актуальный sitemap"
```

---

### Task 8: Сквозная проверка и отчёт владельцу

**Files:**
- Create: `docs/superpowers/reports/2026-07-22-otchet-optimizatsii.md`
- Modify: `tools/check-content.sh`

**Interfaces:**
- Consumes: результаты Task 1–7.
- Produces: отчёт для владельца сайта.

- [ ] **Step 1: Добавить сквозные проверки консистентности**

В `tools/check-content.sh` перед секцией `'JSON-LD'` вставить:

```bash
section 'Сквозная консистентность'
expect_absent index.html '3500' 'нигде не осталось старой цены'
expect_absent index.html 'от 5000' 'цены указаны без приставки «от»'
expect_absent llms.txt '3500' 'в llms.txt нет старой цены'
expect_present index.html 'Александр Красногор' 'полное имя на странице'
```

- [ ] **Step 2: Запустить полный набор проверок**

```bash
bash tools/check-content.sh
```

Ожидается: код возврата 0, «Все проверки пройдены.»

Если падает `expect_absent index.html '3500'` — найти остаток: `grep -n 3500 index.html`.

- [ ] **Step 3: Проверить страницу в браузере целиком**

```bash
python3 -m http.server 8000
```

Пройти сверху вниз на 375px и на 1440px:

- все десять пунктов навигации ведут в свои секции;
- квиз открывается и выдаёт результат;
- лайтбокс дипломов открывается и закрывается;
- FAQ раскрывается;
- горизонтального скролла страницы нет ни на одной ширине;
- в консоли нет ошибок.

Остановить сервер.

- [ ] **Step 4: Написать отчёт**

Создать `docs/superpowers/reports/2026-07-22-otchet-optimizatsii.md` со структурой:

1. **Целевые запросы страницы** — что закрывает: «семейный психолог онлайн», «психолог онлайн консультация», «психолог на Самуи», «психолог для пары», плюс вопросные запросы из FAQ.
2. **Было → стало** — таблица по `title`, `description`, ценам, длительности, формату.
3. **Schema.org** — перечень узлов графа с указанием, что добавлено и что удалено с обоснованием.
4. **Изменения в контенте** — блок-суммари, FAQ, прайс, часы приёма.
5. **Решения по `llms.txt` и `robots.txt`** — что сделано и почему.
6. **TODO для Александра** — переносится дословно из раздела «Вне кода» спеки: Google Business Profile как service-area business со скрытым адресом, единый NAP без улицы, Яндекс.Вебмастер, Google Search Console.
7. **Открытые вопросы** — что стоит перепроверить: например, актуальность формулировки «Опыт с 2016 года» и корректность часов приёма после смены сезона.

- [ ] **Step 5: Коммит**

```bash
git add docs/superpowers/reports/2026-07-22-otchet-optimizatsii.md tools/check-content.sh
git commit -m "docs: отчёт по SEO- и GEO-оптимизации"
```

---

## Самопроверка плана

**Покрытие спеки.** Каждое требование закрыто задачей:

| Раздел спеки | Задача |
|---|---|
| Слой 1: прайс, длительность, очный формат | Task 2 |
| Слой 1: исправление «50–60» в четырёх местах | Task 2 (шаги 4, 6, 9) |
| Слой 2: метатеги, hreflang, OG | Task 5 |
| Слой 2: граф schema.org, удаление LocalBusiness/priceRange/addressCountry | Task 6 |
| Слой 2: sitemap | Task 7 |
| Слой 3: блок-суммари | Task 4 |
| Слой 3: FAQ answer-first и новый вопрос | Task 3 |
| Слой 3: llms.txt, robots.txt | Task 7 |
| Проверка результата (чек-лист спеки) | Task 1 + накопительно в каждой задаче, свод в Task 8 |
| TODO владельцу | Task 8 |

**Отклонение от спеки, требующее внимания.** Спека предписывает заменить карточки прайса таблицей 2×2. План вместо этого сохраняет обе карточки и размещает по две цены внутри каждой. Причина: карточки уже соответствуют строкам предполагаемой таблицы, а их описания на 300+ знаков — ценный текст, который таблица уничтожила бы. Все четыре комбинации цены и формата присутствуют, требование извлекаемости выполнено.

**Согласованность имён.** `@id` узлов графа заданы в Task 6 и больше нигде не переопределяются. CSS-классы `.pricing-card__prices`, `.pricing-card__price-row`, `.pricing-card__format`, `.pricing-card__duration` (Task 2) и `.summary`, `.summary__text` (Task 4) не пересекаются между собой и с существующими. Функции `expect_present` / `expect_absent` / `expect_count` / `section` объявлены в Task 1 и используются во всех последующих задачах с той же сигнатурой.

**Порядок задач.** Task 2 правит фактуру, включая её следы в FAQ, — иначе проверка `expect_absent '50–60 минут'` не прошла бы. Task 3 перерабатывает FAQ содержательно. Task 6 переносит готовые тексты FAQ в граф последним, когда они уже не меняются.
