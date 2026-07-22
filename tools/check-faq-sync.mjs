// Сверка видимого FAQ с разметкой FAQPage: количество, порядок и тексты.
// Счётчики вопросов по отдельности этого не ловят — при перестановке или
// подмене одного ответа обе стороны остаются по десять штук.
// Google сравнивает отрендеренный текст, поэтому &nbsp; приводится к пробелу.
import { readFileSync } from 'node:fs';

const LD_PATTERN = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const QUESTION_PATTERN = /<span class="faq-card__question">(.*?)<\/span>/g;
const ANSWER_PATTERN = /<div class="faq-card__body">\s*<p>([\s\S]*?)<\/p>/g;

function normalize(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findFaqPage(html) {
  for (const [, body] of html.matchAll(LD_PATTERN)) {
    const parsed = JSON.parse(body);
    const nodes = parsed['@graph'] ?? [parsed];
    const faqPage = nodes.find((node) => node['@type'] === 'FAQPage');
    if (faqPage) return faqPage;
  }
  return null;
}

function collect(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => normalize(match[1]));
}

function reportMismatches(label, fromSchema, fromPage) {
  let mismatches = 0;

  fromSchema.forEach((schemaText, index) => {
    if (schemaText !== fromPage[index]) {
      mismatches += 1;
      console.error(`  ${label} ${index + 1} расходится`);
      console.error(`    схема:    ${schemaText}`);
      console.error(`    страница: ${fromPage[index] ?? '(нет)'}`);
    }
  });

  return mismatches;
}

const html = readFileSync(process.argv[2], 'utf8');
const faqPage = findFaqPage(html);

if (!faqPage) {
  console.error('  разметка FAQPage не найдена');
  process.exit(1);
}

const schemaQuestions = faqPage.mainEntity.map((item) => normalize(item.name));
const schemaAnswers = faqPage.mainEntity.map((item) => normalize(item.acceptedAnswer.text));
const pageQuestions = collect(html, QUESTION_PATTERN);
const pageAnswers = collect(html, ANSWER_PATTERN);

let mismatches = 0;

if (schemaQuestions.length !== pageQuestions.length) {
  console.error(`  вопросов в схеме ${schemaQuestions.length}, на странице ${pageQuestions.length}`);
  mismatches += 1;
}

mismatches += reportMismatches('вопрос', schemaQuestions, pageQuestions);
mismatches += reportMismatches('ответ', schemaAnswers, pageAnswers);

console.log(`  пар вопрос-ответ: ${schemaQuestions.length}, расхождений: ${mismatches}`);
process.exit(mismatches === 0 ? 0 : 1);
