// Сверка цен в JSON-LD с авторитетной таблицей: без этого скрипта подмена
// "5000" на "6000" в @graph прошла бы все текстовые проверки контента,
// потому что те match-ят карточку цены на странице, а не разметку схемы.
import { readFileSync } from 'node:fs';

const LD_PATTERN = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

// Авторитетная таблица офферов: @id-фрагмент → цена и валюта.
const EXPECTED_OFFERS = {
  '#offer-intro': { price: '0', priceCurrency: 'RUB' },
  '#offer-individual-online': { price: '5000', priceCurrency: 'RUB' },
  '#offer-individual-samui': { price: '2500', priceCurrency: 'THB' },
  '#offer-family-online': { price: '10000', priceCurrency: 'RUB' },
  '#offer-family-samui': { price: '5000', priceCurrency: 'THB' }
};

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

const filePath = process.argv[2];
const html = readFileSync(filePath, 'utf8');
const graph = findGraph(html);

if (!graph) {
  console.error('  @graph не найден в JSON-LD');
  process.exit(1);
}

const offers = graph.filter((node) => node['@type'] === 'Offer');

let mismatches = 0;
const seenFragments = new Set();

offers.forEach((offer) => {
  const fragment = idFragment(offer['@id'] ?? '');
  seenFragments.add(fragment);

  const expected = EXPECTED_OFFERS[fragment];
  if (!expected) {
    console.error(`  неожиданный оффер: ${fragment}`);
    mismatches += 1;
    return;
  }

  if (offer.price !== expected.price) {
    console.error(`  ${fragment}: цена «${offer.price}», ожидалось «${expected.price}»`);
    mismatches += 1;
  }
  if (offer.priceCurrency !== expected.priceCurrency) {
    console.error(`  ${fragment}: валюта «${offer.priceCurrency}», ожидалось «${expected.priceCurrency}»`);
    mismatches += 1;
  }
});

for (const fragment of Object.keys(EXPECTED_OFFERS)) {
  if (!seenFragments.has(fragment)) {
    console.error(`  оффер отсутствует: ${fragment}`);
    mismatches += 1;
  }
}

console.log(`  офферов: ${offers.length}, расхождений с прайсом: ${mismatches}`);
process.exit(mismatches === 0 ? 0 : 1);
