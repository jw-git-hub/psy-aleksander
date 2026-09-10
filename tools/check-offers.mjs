// Сверка цен в JSON-LD с прайсом, который видит посетитель.
//
// Раньше эталон был вписан константой прямо сюда, и проверка сходилась сама
// с собой: согласованная правка цены на странице и в разметке ловилась, а вот
// расхождение между этим файлом и прайсом — нет. Теперь источник правды один —
// таблица цен в секции #pricing. Здесь остаётся только соответствие
// «какой оффер какой строке прайса отвечает».
import { readFileSync } from 'node:fs';

const LD_PATTERN = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const PRICING_SECTION = /<section[^>]*id="pricing"[\s\S]*?<\/section>/;
const CARD_TITLE = '<h3 class="pricing-card__title">';
const FREE_PRICE = /<p class="pricing-card__price pricing-card__price--free">([^<]*)<\/p>/;
const PRICE_ROW = /<span class="pricing-card__format">([\s\S]*?)<\/span>\s*<span class="pricing-card__price">([\s\S]*?)<\/span>/g;

const FREE_LABEL = 'Бесплатно';
const CURRENCY_BY_UNIT = { '₽': 'RUB', 'бат': 'THB' };

// Какой оффер какой строке прайса соответствует: [заголовок карточки, формат]
const OFFER_SOURCES = {
  '#offer-intro': ['Первая встреча — 20 минут', FREE_LABEL],
  '#offer-individual-online': ['Консультация психолога', 'Онлайн'],
  '#offer-individual-samui': ['Консультация психолога', 'Очно, о. Самуи'],
  '#offer-family-online': ['Семейное консультирование', 'Онлайн'],
  '#offer-family-samui': ['Семейное консультирование', 'Очно, о. Самуи']
};

const normalize = (text) => text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// «5000 ₽» → { price: '5000', priceCurrency: 'RUB' }, «10 000 ₽» → '10000'
function parsePrice(text) {
  if (text === FREE_LABEL) return { price: '0', priceCurrency: 'RUB' };
  const match = text.match(/^([\d ]+?) ?(₽|бат)$/);
  if (!match) return null;
  return {
    price: match[1].replace(/ /g, ''),
    priceCurrency: CURRENCY_BY_UNIT[match[2]]
  };
}

// { 'Консультация психолога': { 'Онлайн': '5000 ₽', ... }, ... }
function parsePricingTable(html) {
  const section = html.match(PRICING_SECTION);
  if (!section) return null;

  const table = {};
  for (const card of section[0].split(CARD_TITLE).slice(1)) {
    const title = normalize(card.slice(0, card.indexOf('</h3>')));
    const free = card.match(FREE_PRICE);
    if (free) {
      table[title] = { [FREE_LABEL]: normalize(free[1]) };
      continue;
    }
    const rows = {};
    for (const [, format, price] of card.matchAll(PRICE_ROW)) {
      rows[normalize(format)] = normalize(price);
    }
    table[title] = rows;
  }
  return table;
}

function findGraph(html) {
  for (const [, body] of html.matchAll(LD_PATTERN)) {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed['@graph'])) return parsed['@graph'];
  }
  return null;
}

function idFragment(id) {
  const hashIndex = id.indexOf('#');
  return hashIndex === -1 ? id : id.slice(hashIndex);
}

// Цена из прайса для оффера, либо причина, по которой её не нашли
function expectedFor(fragment, table) {
  const source = OFFER_SOURCES[fragment];
  if (!source) return { error: 'неожиданный оффер' };

  const [cardTitle, format] = source;
  const card = table[cardTitle];
  if (!card) return { error: `в прайсе нет карточки «${cardTitle}»` };

  const cellText = card[format];
  if (!cellText) return { error: `в карточке «${cardTitle}» нет строки «${format}»` };

  const parsed = parsePrice(cellText);
  if (!parsed) return { error: `цену «${cellText}» не удалось разобрать` };
  return parsed;
}

const filePath = process.argv[2];
const html = readFileSync(filePath, 'utf8');

const graph = findGraph(html);
if (!graph) {
  console.error('  @graph не найден в JSON-LD');
  process.exit(1);
}

const pricingTable = parsePricingTable(html);
if (!pricingTable) {
  console.error('  секция #pricing не найдена — сверять разметку не с чем');
  process.exit(1);
}

const offers = graph.filter((node) => node['@type'] === 'Offer');
const seenFragments = new Set();
let mismatches = 0;

offers.forEach((offer) => {
  const fragment = idFragment(offer['@id'] ?? '');
  seenFragments.add(fragment);

  const expected = expectedFor(fragment, pricingTable);
  if (expected.error) {
    console.error(`  ${fragment}: ${expected.error}`);
    mismatches += 1;
    return;
  }

  if (offer.price !== expected.price) {
    console.error(`  ${fragment}: цена «${offer.price}», в прайсе «${expected.price}»`);
    mismatches += 1;
  }
  if (offer.priceCurrency !== expected.priceCurrency) {
    console.error(`  ${fragment}: валюта «${offer.priceCurrency}», в прайсе «${expected.priceCurrency}»`);
    mismatches += 1;
  }
});

for (const fragment of Object.keys(OFFER_SOURCES)) {
  if (!seenFragments.has(fragment)) {
    console.error(`  оффер отсутствует: ${fragment}`);
    mismatches += 1;
  }
}

console.log(`  офферов: ${offers.length}, расхождений с прайсом на странице: ${mismatches}`);
process.exit(mismatches === 0 ? 0 : 1);
