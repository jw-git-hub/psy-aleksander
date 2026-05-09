# Журнал разработки — Сайт психолога

> **Правила ведения журнала:**
> - Записывать ТОЛЬКО ключевые решения, изменения и проблемы
> - Максимум 30 записей. При превышении — удалять самые старые неактуальные
> - Формат: дата → что сделано / решено / найдена проблема
> - Не дублировать информацию из CLAUDE.md

---

## Записи

### 2026-05-09
- **[СТАРТ]** Проект инициализирован. Создана структура папок и базовые файлы
- **[РЕШЕНИЕ]** Стек: чистый HTML/CSS/JS без фреймворков
- **[РЕШЕНИЕ]** Подход: mobile-first, БЭМ, CSS-переменные
- **[РЕШЕНИЕ]** Роли: Opus — планирование и ревью, Sonnet — написание кода
- **[КОНТЕНТ]** Извлечён весь контент с Tilda-сайта → SITE-CONTENT.md
- **[КОНТАКТЫ]** Добавлены: Telegram @lex4747, канал t.me/domgdeslushat, Max (личка + группа)
- **[ПРОМТ]** Составлен детальный промт для Claude Code (Sonnet) → PROMPT.md
- **[SEO]** Проведено исследование: ключевые слова, Schema.org, мета-теги, структурированные данные
- **[РЕАЛИЗАЦИЯ]** Написан полный лендинг по PROMPT.md: 9 секций (header, hero, help, process, approach, about, pricing, contacts, footer), бургер-меню, smooth scroll, IntersectionObserver-анимации, активный пункт навигации
- **[ДИЗАЙН]** variables.css приведён к итоговой палитре PROMPT.md (тиловый + медь), типографика на clamp(), Inter + Playfair Display через Google Fonts
- **[SEO]** В `<head>` добавлены title/description/keywords, Open Graph, 3 JSON-LD: LocalBusiness+Person, FAQPage (5 вопросов), Service (две услуги)
- **[A11Y]** focus-visible, aria-label, aria-expanded, prefers-reduced-motion (без !important), Esc закрывает мобильное меню
- **[ФИКС]** z-index шапки выше z-index открытого мобильного меню — иначе бургер-кнопка перекрывалась навигацией
- **[ФИКС]** Убран overflow:hidden у hero — обрезал стрелку-указатель
- **[КОНТЕНТ]** Добавлены реальные материалы из img/: фото в "Обо мне" (object-fit: cover, скруглённый), 4 диплома с реальными метаданными (МГИ Дашковой 2016, НИИДПО 2023 620ч, Институт прикладной психологии 2024-25 1640ч + 200ч КПТ)
- **[ФИЧА]** Новая секция #docs — галерея сертификатов 1→2→4 колонки, добавлен пункт "Документы" в навигацию
- **[ФИЧА]** Lightbox-модалка для просмотра сканов в полный экран: клик по миниатюре открывает, закрытие по кнопке/фону/Esc, возврат фокуса на исходную миниатюру
- **[ФИКС]** Добавлен 4-й контакт — Max-чат (https://max.ru/join/2LVnmf3RVF...). Ранее в секции #contacts отображалось только 3 из 4 контактов из SITE-CONTENT.md. JSON-LD sameAs тоже расширен
- **[ДИЗАЙН]** Шрифты переведены на безсерифные: заголовки — Manrope (вместо Playfair Display), тело — Inter. Обновлён Google Fonts link, фолбэки заменены на system-ui
- **[АУДИТ]** Сквозное ревью + правки. Главное: a11y — закрытое мобильное меню и закрытый lightbox получают `inert` (Tab их пропускает); при открытом lightbox `inert` ставится на header/main/footer (фокус-trap); добавлен `scroll-padding-top` для нативных якорных переходов; null-checks в JS; `window.pageYOffset` → `scrollY`
- **[ФИКС]** `.help-card` теперь центрирует иконку и текст по вертикали (раньше иконка на топе, текст по центру → ломалось на 2-строчных карточках)
- **[ФИКС]** `.doc-card__img` переключён с `object-fit: cover` на `contain` — сканы документов больше не обрезаются по краям
- **[ФИКС]** `.about__sublist` `display: flex` ломал маркеры списка → переделано на обычный `block` с `list-style: disc`
- **[ФИКС]** Hero `min-height` использует `100dvh` (фолбэк на `100vh`) — корректная высота на iOS Safari с динамическим toolbar
- **[ФИКС]** Активный пункт навигации больше не сбрасывается при прокрутке через #process (наблюдаются только секции с соответствующим nav-link)
- **[ДИЗАЙН]** Стоимость переведена на `--alt` фон — корректное чередование секций после добавления #docs (about-alt → docs-light → pricing-alt → contacts-dark)
- **[SEO]** Добавлены `og:image`, `theme-color: #4A6B6A`, Twitter Card meta. Внешние ссылки получили `rel="noopener noreferrer"` (privacy)
- **[ШАПКА/МОБ]** Уменьшен padding-y (16px→10px), gap (24px→16px), уменьшен `logo__name` (20px→17px), `logo__title` (13px→12px). Добавлен min-height: 60px. На десктопе — отдельные значения (padding 14px, min-height 72px, name 20px)
- **[A11Y]** Бургер увеличен до клик-зоны 44×44 (WCAG минимум) при сохранении визуальных размеров «трёх линий» 24×18; margin-right: -10px чтобы визуально совпадал с краем
- **[ФИКС]** Hero `min-height` теперь = `calc(100dvh - var(--header-height))` — стрелка-указатель видна сразу. JS замеряет реальную высоту шапки и проставляет `--header-height` на :root, обновляет на resize
- **[ФИКС]** «Обо мне» на мобильном: заголовок и имя теперь по центру (фото же центрировано выше). На десктопе — слева, рядом с фото-колонкой
- **[ФИКС]** Если открыть мобильное меню и ресайзнуть в десктоп → блокировка скролла оставалась. Теперь syncNavInert полностью сбрасывает состояние
- **[ФИКС]** `prefers-reduced-motion` не отменял keyframe-анимации (hero fade-up, bounce у стрелки) → добавлены явные `animation: none`
- **[ФИКС]** `scroll-padding-top` теперь динамический: `calc(var(--header-height) + 1rem)` вместо фиксированных 5rem
- **[ДИЗАЙН]** Документы: aspect-ratio карточки 4:3 → 3:2 (ближе к реальной форме разворотов дипломов, меньше пустых полей)
- **[ДИЗАЙН]** Помощь: 7-я карточка на десктопе/планшете при нечётном числе теперь центрируется по ширине двух колонок вместо одинокой левой
- **[КРИТ-ФИКС]** Реальная причина «съеденных» отступов в шапке: `.header__inner { padding: y 0 }` shorthand'ом обнулял горизонтальный padding `.container` (20px) — логотип и бургер прижимались к краям viewport на мобильных и планшетах. Заменено на `padding-block`, чтобы трогать только вертикаль. Также убран `margin-right: -10px` у бургера (создавал визуальную асимметрию относительно лого слева)
- **[КОНТЕНТ/ФИЧА]** Секция «Мой подход» переделана из списка названий в раскрывающиеся карточки (нативные `<details>`/`<summary>`) с описаниями для КПТ, гештальт-терапии, ЭФТ и mindfulness. Группа `name="approach-method"` обеспечивает «один открыт за раз» на современных движках; JS-фолбэк закрывает соседей через событие `toggle` для Safari < 17 и старых мобильных. Chevron-стрелка вращается на 180° при `[open]`
- **[ФИЧА]** Новая секция #faq — 5 вопросов 1-в-1 с FAQPage JSON-LD (длительность, запись, стоимость, онлайн, конфиденциальность). Те же `<details>`-карточки, но без `name=""` — несколько ответов могут быть открыты одновременно (привычное FAQ-поведение). В навигацию пункт не добавлен — меню уже из 6 пунктов
- **[КОНТЕНТ]** «Стоимость» расширена: описания услуг 1 фраза → 2–3 предложения; под карточками новый блок `.pricing__details` с длительностью, форматом (Telegram/Max/Zoom) и оплатой. На 768+ — 3 колонки в ряд
- **[КОНТЕНТ]** «Контакты» получили вступительный абзац `.contacts__intro` (о времени ответа и бесплатной 20-мин первой встрече) — раньше шли только иконки мессенджеров
- **[A11Y]** Для chevron-вращения в `.approach-card`/`.faq-card` уважается `prefers-reduced-motion: reduce` (transition: none)

### 2026-05-09 (этап A — конверсионный апгрейд hero/узнавание)
- **[ФИЧА]** Hero полностью переписан — eyebrow, новый h1 (тупик в отношениях/тревоге/кризисах), lead, `.hero__benefits` с SVG-data-URI галочками через `::before` (content: url()), двойная CTA (`.btn--accent` + `.btn--ghost`), `.hero__trust` с социальным доказательством, фото в `<picture>` с `fetchpriority="high"`. На 768+: две колонки; на 1024+: фото 420px
- **[ФИЧА]** Новая кнопка `.btn--ghost` — прозрачный фон, рамка `--color-primary`, hover: фон `--color-primary` + текст `--color-text-on-dark`; mirror hover-поведение к `.btn--accent`
- **[ФИЧА]** Новая секция `#signs` «Если узнаёте себя» — 6 цитат-самоописаний в grid, на 768+ две колонки, `border-left: 3px solid var(--color-accent)`, секция идёт между hero и #help
- **[КОНТЕНТ]** `.help-card` переработаны: убраны иконки-чекмарки, добавлены `<h3 class="help-card__title">` + `<p>` с 2–3 строками описания для 7 направлений; на 1024+ сетка 3-колоночная
- **[КОНТЕНТ/ЮРИД]** Дисклеймер `.approach__disclaimer` в секции «Мой подход» — немедицинский характер услуги, рекомендация к психиатру при клинических состояниях
- **[ПЕРФ]** `<link rel="preload" as="image" href="img/photo.jpg" fetchpriority="high">` в `<head>` для ускорения LCP
- **[A11Y]** `prefers-reduced-motion` расширен: новые hero-анимации (eyebrow, benefits, trust) получили `animation: none`

### 2026-05-09 (этап C — расширение FAQ + free-карточка стоимости + блоки credentials/values)
- **[ФИЧА]** FAQ расширен с 5 до 9 вопросов: добавлены 4 новые `<details class="faq-card">` (про первый визит, психолог vs психиатр, страх потерять время, партнёр против терапии). Без атрибута `name=""` — все могут быть открыты независимо
- **[SEO]** JSON-LD FAQPage синхронизирован: те же 4 вопроса добавлены в `mainEntity`, тексты 1-в-1 с HTML, HTML-сущности (`&nbsp;`) заменены на обычные пробелы. Итого 9 вопросов в JSON-LD
- **[ФИЧА]** Секция «Стоимость»: `.pricing__banner` удалён, заменён на полноценную `<article class="pricing-card pricing-card--free">` с бейджем «Знакомство», ценой «Бесплатно» в акцентном зелёном, описанием и CTA-кнопкой на Telegram. Добавлен `.pricing__note` с правилом отмены за 24 ч
- **[ФИЧА]** Секция «Обо мне» получила блок `.about__credentials` — 3 числовые карточки с подтверждаемыми фактами (с 2016 / 2 460 часов / 4 диплома) + примечание о супервизии и Этическом кодексе. На 768+ карточки в 3 колонки
- **[ФИЧА]** Блок `.about__values` — 4 пункта-маркера «Что важно в работе» (позиция специалиста без советов, диагнозов, кейсов, с честным отказом)

### 2026-05-09 (этап D — квиз с copy-to-clipboard)
- **[ФИЧА]** Новая секция `#quiz` «Подберём формат за 1 минуту» — 4 шага-вопроса (запрос / формат / опыт / сроки) + финальный экран с персонализированной рекомендацией и предзаполненным текстом для Telegram. Вставлена между `#help` и `#process`
- **[JS]** Новый файл `js/quiz.js`: step-навигация (Далее/Назад), кнопка «Далее» disabled пока не выбран radio, `FormData` для сборки ответов, `buildRecommendation()` + `buildAnswerText()` для генерации текстов на финальном шаге
- **[ФИЧА]** Copy-to-clipboard: `navigator.clipboard.writeText()` с фолбэком на `textarea + execCommand('copy')` для `file://` и старых браузеров; при успехе кнопка добавляет `.is-copied` на 2 сек (CSS toggle default/success текстов); повторный клик — начинает 2-секундный таймер заново, не ломается
- **[A11Y]** `prefers-reduced-motion` дополнен в `base.css`: `.quiz__step--active { animation: none }` — отключает `quizFade` keyframe. `aria-live="polite"` на финальном шаге и прогрессе, `role="radiogroup"` + `aria-label` на каждой группе опций

### 2026-05-09 (этап B — header-CTA + sticky-mobile-CTA)
- **[ФИЧА]** Кнопка `.header__cta.btn.btn--accent` в шапке: `display: none` на мобильных (там sticky-bar), `display: inline-block` от 768px; CSS `order: 3` на десктопе ставит её правее навигации (`order: 2`), логотип — слева по умолчанию. `transform: none` в hover перебивает подъём `.btn--accent:hover`, кнопка не прыгает в шапке
- **[ФИЧА]** `<aside class="sticky-cta">` в конец body (перед lightbox): фиксированная панель внизу с Telegram-иконкой, текстом «Записаться к психологу» и подсказкой «первые 20 минут — бесплатно»; z-index 50 (ниже меню z=110 и lightbox z=1000); `display: none` от 1024px; поддержка notch через `env(safe-area-inset-bottom)`
- **[JS]** Модуль 9 в `main.js`: `requestAnimationFrame`-throttled scroll/resize обработчик; показывает панель когда hero ушёл вверх и футер не близко (зазор 80px); скрывает при `body.is-locked` (открытое меню или лайтбокс) через `MutationObserver` на классе body; первичный вызов при инициализации
- **[A11Y]** `prefers-reduced-motion` в `base.css` дополнен — `.sticky-cta { transition: none }` внутри существующего `@media (prefers-reduced-motion: reduce)` блока

### 2026-05-09 (этап F — только онлайн, фикс квиза, стоимость, футер)
- **[КОНТЕНТ]** Убраны все упоминания очной работы и Москвы: title/description мета-тегов, hero eyebrow, секция «Стоимость» (формат), секция «Как проходит работа» (формат), FAQ-вопрос про формат переформулирован + синхронизирован с JSON-LD FAQPage
- **[SEO]** JSON-LD LocalBusiness: добавлены `areaServed: "RU"` и `serviceType: "Online psychotherapy"`; description обновлён до «Онлайн-консультации...»
- **[КВИЗ]** Удалён шаг 2 «Удобный формат?» из HTML: осталось 3 вопроса вместо 4. Обновлены data-step (3→2, 4→3, 5→4), прогресс-текст, subtitle секции
- **[КВИЗ/JS]** quiz.js: удалена константа Q2_LABELS; `buildRecommendation(q1, q2)` → `buildRecommendation(q1)`, `formatPart` удалён, итог «(онлайн)»; из `buildAnswerText` удалена строка «Формат»; из `showResult` убран `q2`
- **[ФИКС]** `.quiz [hidden] { display: none }` в style.css — специфичность (0,1,1) перекрывает (0,1,0) у `.btn`, кнопка «Далее» теперь скрыта на финальном экране
- **[ДИЗАЙН]** `.pricing-card__btn`: `align-self: flex-start` → `align-self: center` — кнопки в карточках «Стоимость» по горизонтальному центру

### 2026-05-09 (этап E — defer/decoding/UTM, privacy + robots/sitemap)
- **[ПЕРФ]** Script-теги перемещены из конца `<body>` в `<head>` с атрибутом `defer` — параллельная загрузка с HTML, выполнение после парсинга DOM; у `.hero__photo` `decoding="async"` уже был, добавлен к `.about__photo-img` и 4 `.doc-card__img`
- **[JS]** Модуль 10 в `main.js` — UTM-метки: читает utm_source/medium/campaign/term/content, yclid, gclid из URL и сохраняет в `sessionStorage('utm')`, молча игнорирует ошибки приватного режима; в ссылки на t.me параметры не дописываем (Telegram их игнорирует)
- **[ПРАВОВОЙ]** Создана `pages/privacy.html` — упрощённая политика конфиденциальности (noindex, follow); без оферты (нет ИП/самозанятого статуса), без форм на сайте, с упоминанием будущей Метрики/VK Pixel; создан `css/legal.css` для стилей юр-страниц с `.header__inner--simple` (центрированное лого)
- **[ПОДВАЛ]** Футер главной переработан: `footer__inner` flex-колонка на мобильных / flex-строка на 768+, добавлена `<nav class="footer__nav">` со ссылкой на политику конфиденциальности
- **[SEO/СЕРВИСНОЕ]** Созданы `robots.txt` (Allow: /, Disallow: /pages/privacy.html, Sitemap) и `sitemap.xml` (только главная, priority 1.0); домен-плейсхолдер `https://example.com` с TODO-комментарием к замене после подключения реального домена

### 2026-05-09 (подключение собственного домена)
- **[ДОМЕН]** Создан файл `CNAME` в корне репозитория — содержит `psy-krasnogor.pro` (требование GitHub Pages для кастомного домена)
- **[SEO]** Заменены все 6 вхождений `https://jw-git-hub.github.io/psy-aleksander` на `https://psy-krasnogor.pro` в `index.html`: canonical, og:url, og:image, twitter:image, JSON-LD url, JSON-LD image
- **[SEO/СЕРВИСНОЕ]** В `robots.txt` и `sitemap.xml` обновлены URL на `psy-krasnogor.pro`; удалены TODO-комментарии о необходимости замены домена

### 2026-05-09 (SEO-пакет A–E)
- **[A]** Удалён мёртвый `<meta name="keywords">` — тег игнорируется Google и Яндексом с 2009 г.
- **[B]** `priceRange` в JSON-LD исправлен с нестандартного «от 3500 ₽» на символьный `"$$"` (Schema.org-стандарт)
- **[C]** В JSON-LD добавлены `"image"` (URL фото) и `"address": { "@type": "PostalAddress", "addressCountry": "RU" }` для улучшения парсинга роботами
- **[D]** Атрибуты `width`/`height` добавлены к 4 изображениям документов по реальным пропорциям из `sips`: 3.jpg 1280×913, 4.jpg 1280×911, 2.jpg 1280×928, 1.jpg 1280×905 — устраняет CLS
- **[E]** Установлен `cwebp` (brew install webp). Сгенерированы WebP-версии 5 файлов (q=85). Экономия: photo.jpg 94 705 → photo.webp 41 778 (−56%), 1.jpg 194 292 → 1.webp 138 766 (−29%); у 2.jpg/3.jpg/4.jpg WebP вышел немного тяжелее оригиналов (насыщенный мелкий текст дипломов — edge-case). Preload в `<head>` переключён на WebP. `<picture><source type="image/webp">` добавлен к hero, about и 4 doc-картам
- **[E-фикс]** 2.webp и 4.webp пересжаты с `-q 75`: 2.webp 298 978 → 204 060 байт (−32% vs JPG 282 972), 4.webp 264 412 → 178 844 байт (−31% vs JPG 260 276). Оба WebP теперь легче оригиналов — `<source>` остались, файлы не удалялись

### 2026-05-09 (локализация шрифтов)
- **[ПЕРФ]** Зависимость от Google Fonts полностью устранена. Inter и Manrope скачаны локально в `/fonts/`, Google Fonts CDN убран из обоих HTML-файлов
- **[АНАЛИЗ]** Inter v20 и Manrope v20 — переменные шрифты (variable font): один файл WOFF2 покрывает весь диапазон весов. Скачаны по 4 файла на шрифт (subsets: cyrillic-ext, cyrillic, latin-ext, latin) — итого 8 файлов
- **[АНАЛИЗ]** Реально используемые веса: Inter — 400/500/600; Manrope — 600/700. Inter 700 и Manrope 500/800 нигде в коде не применяются — не скачивались
- **[CSS]** Создан `css/fonts.css` с 8 `@font-face`-правилами и `font-display: swap`; диапазоны весов заданы как `400 600` / `600 700` (синтаксис variable font)
- **[HTML]** В `index.html` и `pages/privacy.html`: блок Google Fonts (`preconnect` + CDN-link) заменён на `<link rel="preload">` для 4 критичных файлов (latin + cyrillic для Inter 400 и Manrope) и `<link rel="stylesheet" href="css/fonts.css">`
- **[РАЗМЕРЫ]** Суммарно 235 КБ: inter-400-latin.woff2 (47 КБ), inter-400-latin-ext.woff2 (83 КБ), inter-400-cyrillic.woff2 (18 КБ), inter-400-cyrillic-ext.woff2 (25 КБ), manrope-latin.woff2 (24 КБ), manrope-latin-ext.woff2 (15 КБ), manrope-cyrillic.woff2 (14 КБ), manrope-cyrillic-ext.woff2 (2 КБ)

### 2026-05-09 (Яндекс.Метрика — аналитика и трекинг конверсий)
- **[АНАЛИТИКА]** Создан `js/metrika.js` — IIFE-инициализация счётчика 109129242 (webvisor, clickmap, trackLinks, accurateTrackBounce, ecommerce dataLayer); подключён в `<head>` с `async` во всех HTML-файлах (index.html и pages/privacy.html). Inline-скриптов нет — соблюдены правила CLAUDE.md
- **[АНАЛИТИКА]** В начало `<body>` в index.html и pages/privacy.html добавлен `<noscript>`-пиксель через класс `.metrika-pixel` (position: absolute; left: -9999px) в style.css — без inline-стилей
- **[ЦЕЛИ]** Делегированный трекинг в `js/main.js` (модуль 11): один `click`-listener на `document` покрывает все элементы с `data-analytics`; вызывает `ym(109129242, 'reachGoal', goal)`; guard `typeof window.ym === 'function'`
- **[ЦЕЛИ]** 6 новых атрибутов `data-analytics` в index.html: `pricing_individual_anchor` (кнопка «Записаться» инд. консультация), `pricing_family_anchor` (семейное консультирование), `contacts_telegram_dm`, `contacts_telegram_channel`, `contacts_max_dm`, `contacts_max_chat`
- **[ЦЕЛИ]** В `js/quiz.js` добавлены 2 события через `ym(..., 'reachGoal', ...)`: `quiz_started` (флаг — первое `change` в форме, один раз), `quiz_completed` (при входе в `showResult()`); в обоих guard-проверка `typeof window.ym === 'function'`
- **[ПРАВОВОЙ]** `pages/privacy.html`: раздел 2 актуализирован (убрано «в будущем» и VK Pixel); добавлен пункт 5 «Яндекс.Метрика» с описанием Webvisor, ссылками на политику Яндекса и opt-out; прежние разделы 5–7 сдвинуты в 6–8

### 2026-05-09 (favicon — монограмма АК)
- **[ФИЧА]** Создан `favicon.svg` — SVG-заглушка с кириллической монограммой «АК»: круглый фон `#4A6B6A`, белый текст `#FAF8F5`, `font-size: 28`, `font-weight: 700`, system-ui без внешних зависимостей
- **[ФИЧА]** Создан `apple-touch-icon.png` 180×180 px через macOS-нативный `qlmanage -t -s 180` (способ 4 из 4 — rsvg-convert и ImageMagick не были установлены)
- **[HTML]** В `<head>` обоих HTML-файлов (`index.html`, `pages/privacy.html`) после `<meta name="theme-color">` добавлен блок из 4 строк: `rel="icon"` SVG, `rel="alternate icon"` PNG-фолбэк, `rel="apple-touch-icon"`, `rel="mask-icon"` с цветом `#4A6B6A`

### 2026-05-09 (фикс навигации — брейкпоинт меню 768→1024)
- **[ФИКС]** Брейкпоинт переключения бургер→горизонтальная навигация поднят с 768px до 1024px: правила `.burger`, `.nav`, `.nav__list`, `.nav__link`, `.nav__link::after`, `.nav__link.is-active::after`, `.nav-backdrop`, `.header__inner`, `.header__cta`, `.logo__name`, `.logo__title` перенесены из `@media (min-width: 768px)` в `@media (min-width: 1024px)`; `MOBILE_BREAKPOINT` в `js/main.js` изменён с `768` на `1024`. На 768–1023px сохраняется планшетный layout секций (hero/help/pricing и т.п.), меню — бургер

### 2026-05-09 (мобильный CTA в шапке + автоскрытие)
- **[ФИЧА]** `.header__cta` теперь видна на мобильных (вместо `display: none` — `display: inline-flex` с компактным padding 0.5rem 0.875rem и `font-size: var(--fs-small)`). Три элемента в шапке (лого + CTA + бургер) помещаются за счёт уже существующего `gap: var(--spacing-sm)` в `.header__inner`
- **[ФИЧА]** Добавлен CSS-класс `.header__cta--hidden { display: none !important }` для управления через JS (с `!important` для перебивания десктопного правила той же специфичности)
- **[JS]** Модуль 9 (`main.js`): добавлена переменная `headerCta = document.querySelector('.header__cta')`; в `updateStickyCta()` добавлен `headerCta.classList.toggle('header__cta--hidden', shouldShow)` — CTA шапки скрывается ровно когда sticky-CTA появляется, и возвращается когда та уходит; при `is-locked` класс `--hidden` явно убирается
- **[CSS]** `.sticky-cta` уже имеет `@media (min-width: 1024px) { display: none }` — на десктопе sticky-панель не появляется, дополнительных правил не потребовалось

### 2026-05-09 (Pre-show audit fix)
- **[ФИКС]** Mobile UX: html background = footer-bg (overscroll bounce); sticky-cta padding-bottom max(spacing-sm, safe-area-inset) — без двойного отступа на iPhone X+
- **[ФИКС]** `pages/privacy.html` стр. 57: `krasnogor-psy` → `psy-krasnogor.pro` в теге `<strong>` (правильное доменное имя)
- **[ПРАВОВОЙ]** `pages/privacy.html` стр. 62: формулировка про формы заменена на юридически точную — квиз упомянут явно, с пояснением что данные не покидают браузер
- **[ПЕРФ]** `js/main.js` `closeLightbox()`: `lightboxImg.src = ''` → `lightboxImg.removeAttribute('src')` — устранён паразитный GET-запрос текущей страницы при пустом src
- **[ПЕРФ]** SVG-sprite — 17 дублирующихся inline SVG (13 chevron + 4 star) → один `<symbol>`-блок + 17 `<use>`-ссылок. ~1.6 KB экономии в HTML.
