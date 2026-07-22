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
