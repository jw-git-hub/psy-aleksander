// Поведенческие проверки сайта в настоящем браузере.
//
// check-content.sh сверяет тексты и разметку — то, что видно в исходнике.
// Ошибки, которые он не ловит по устройству, живут в путях, которые при
// обычной работе не выполняются: не доехавший бандл, отказавший буфер обмена,
// обход страницы с клавиатуры. Именно там и нашлись все баги аудита.
//
// Здесь сайт поднимается локально и управляется через CDP: настоящие клики,
// настоящий Tab, настоящий лог консоли и сети. Без зависимостей — Chrome
// запускается напрямую, WebSocket встроен в Node 22+.
//
// Запуск: node tools/check-behavior.mjs

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
];
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml'
};
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1280, height: 900 };
const CDP_TIMEOUT_MS = 15000;
const SETTLE_MS = 350;
const TAB_SWEEP_STEPS = 20;
const OVERFLOW_WIDTHS = [320, 360, 390, 412, 600, 768, 800, 900, 1024, 1280, 1440];

/* ============ статика ============ */

function startServer() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const filePath = join(ROOT, normalize(relative).replace(/^(\.\.[/\\])+/, ''));
    try {
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/* ============ браузер ============ */

async function findChrome() {
  for (const path of CHROME_CANDIDATES) {
    try {
      await readFile(path);
      return path;
    } catch {
      // следующий кандидат
    }
  }
  return null;
}

async function launchChrome(binary) {
  const profile = await mkdtemp(join(tmpdir(), 'psy-check-'));
  const chrome = spawn(binary, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--disable-gpu',
    '--disable-extensions',
    '--hide-scrollbars'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  // Порт отладчика Chrome печатает в stderr при старте
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome не отдал адрес отладчика')), CDP_TIMEOUT_MS);
    chrome.stderr.on('data', (chunk) => {
      const found = String(chunk).match(/ws:\/\/[^\s]+/);
      if (found) {
        clearTimeout(timer);
        resolve(found[0]);
      }
    });
  });

  return { chrome, endpoint, profile };
}

/* Тонкий клиент CDP: отправляет команды и ждёт ответа по id */
function connect(endpoint) {
  const socket = new WebSocket(endpoint);
  const pending = new Map();
  let nextId = 0;

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  });

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('CDP: соединение не открылось')), { once: true });
  });

  const send = (method, params = {}, sessionId) => {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params, sessionId }));
      setTimeout(() => {
        if (pending.delete(id)) reject(new Error(`CDP: ${method} не ответил`));
      }, CDP_TIMEOUT_MS);
    });
  };

  return { socket, send, ready };
}

/* ============ страница ============ */

class Page {
  constructor(client, sessionId) {
    this.client = client;
    this.sessionId = sessionId;
    this.consoleErrors = [];
    this.failedRequests = [];
  }

  static async open(client) {
    const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });
    const page = new Page(client, sessionId);

    client.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.sessionId !== sessionId) return;
      if (message.method === 'Runtime.exceptionThrown') {
        page.consoleErrors.push(message.params.exceptionDetails.text);
      }
      if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        page.consoleErrors.push(message.params.entry.text);
      }
      if (message.method === 'Network.loadingFailed') {
        page.failedRequests.push(message.params.errorText);
      }
    });

    for (const domain of ['Page', 'Runtime', 'Network', 'Log']) {
      await page.call(`${domain}.enable`);
    }
    return page;
  }

  call(method, params) {
    return this.client.send(method, params, this.sessionId);
  }

  async setViewport({ width, height }) {
    await this.call('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile: width < 768
    });
  }

  async blockUrls(patterns) {
    await this.call('Network.setBlockedURLs', { urls: patterns });
  }

  async goto(url) {
    this.consoleErrors = [];
    this.failedRequests = [];
    const loaded = this.waitFor('Page.loadEventFired');
    await this.call('Page.navigate', { url });
    await loaded;
    await this.wait(SETTLE_MS);
  }

  waitFor(method) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`не дождались ${method}`)), CDP_TIMEOUT_MS);
      const listener = (event) => {
        const message = JSON.parse(event.data);
        if (message.method !== method || message.sessionId !== this.sessionId) return;
        clearTimeout(timer);
        this.client.socket.removeEventListener('message', listener);
        resolve(message.params);
      };
      this.client.socket.addEventListener('message', listener);
    });
  }

  async evaluate(expression) {
    const { result, exceptionDetails } = await this.call('Runtime.evaluate', {
      expression: `(() => { ${expression} })()`,
      awaitPromise: true,
      returnByValue: true
    });
    if (exceptionDetails) throw new Error(exceptionDetails.text);
    return result.value;
  }

  async pressTab(times = 1) {
    for (let i = 0; i < times; i += 1) {
      for (const type of ['keyDown', 'keyUp']) {
        await this.call('Input.dispatchKeyEvent', {
          type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9
        });
      }
    }
    await this.wait(SETTLE_MS);
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/* ============ сценарии ============ */

const describeActive = `
  const el = document.activeElement;
  return el ? el.tagName + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\\s+/)[0] : '') : 'НЕТ';
`;

/* Обходит страницу табом и возвращает первый шаг, на котором фокус вышел
   за пределы контейнера. Проверять только финальную позицию нельзя: фокус
   успевает сходить наружу и вернуться — ровно так утечка и пряталась.
   Сам <body> утечкой не считаем: дойдя до конца документа, браузер отдаёт
   фокус своему интерфейсу, а в headless — корню документа, и следующим Tab
   возвращает его в начало. Интерактивного контента там нет. */
async function findFocusEscape(page, containerSelector, steps) {
  for (let step = 1; step <= steps; step += 1) {
    await page.pressTab();
    const isInside = await page.evaluate(`
      const container = document.querySelector('${containerSelector}');
      const active = document.activeElement;
      if (active === document.body) return true;
      return container ? container.contains(active) : false;
    `);
    if (!isInside) {
      const where = await page.evaluate(describeActive);
      return { step, where };
    }
  }
  return null;
}

const scenarios = [
  {
    name: 'бандл не доехал — страница всё равно читается',
    async run(page, base) {
      await page.setViewport(DESKTOP_VIEWPORT);
      await page.blockUrls(['*app.min.js*']);
      await page.goto(base);
      await page.wait(6000); // страховочный таймер в <head> — 5 с
      const hidden = await page.evaluate(`
        return Array.from(document.querySelectorAll('.animate-on-scroll'))
          .filter((el) => Number(getComputedStyle(el).opacity) === 0).length;
      `);
      await page.blockUrls([]);
      return hidden === 0
        ? { ok: true, detail: 'весь контент виден' }
        : { ok: false, detail: `${hidden} блоков остались с opacity: 0` };
    }
  },
  {
    name: 'обычная загрузка — консоль и сеть чисты',
    async run(page, base) {
      await page.setViewport(DESKTOP_VIEWPORT);
      await page.goto(base);
      const problems = [...page.consoleErrors, ...page.failedRequests];
      return problems.length === 0
        ? { ok: true, detail: 'ошибок нет' }
        : { ok: false, detail: problems.slice(0, 3).join(' | ') };
    }
  },
  {
    name: 'страница нигде не едет вбок',
    async run(page, base) {
      const broken = [];
      for (const width of OVERFLOW_WIDTHS) {
        await page.setViewport({ width, height: 900 });
        await page.goto(base);
        const overflow = await page.evaluate(`
          const root = document.documentElement;
          if (root.scrollWidth <= root.clientWidth) return null;
          // Виновника ищем среди элементов вне fixed-предков: вынесенное
          // за экран меню — position: fixed и на ширину документа не влияет
          const isFixed = (el) => {
            for (let node = el; node && node !== root; node = node.parentElement) {
              if (getComputedStyle(node).position === 'fixed') return true;
            }
            return false;
          };
          const culprit = Array.from(document.querySelectorAll('*'))
            .filter((el) => !isFixed(el) && el.getBoundingClientRect().right > root.clientWidth + 1)
            .sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right)[0];
          return {
            over: root.scrollWidth - root.clientWidth,
            who: culprit ? culprit.tagName + '.' + String(culprit.className).trim().split(/\\s+/)[0] : '?'
          };
        `);
        if (overflow) broken.push(`${width}px: +${overflow.over}px (${overflow.who})`);
      }
      await page.setViewport(DESKTOP_VIEWPORT);
      return broken.length === 0
        ? { ok: true, detail: `проверено ширин: ${OVERFLOW_WIDTHS.length}, переполнения нет` }
        : { ok: false, detail: broken.join('; ') };
    }
  },
  {
    name: 'квиз — фокус не падает на body при переходе к следующему вопросу',
    async run(page, base) {
      await page.setViewport(DESKTOP_VIEWPORT);
      await page.goto(base);
      const focused = await page.evaluate(`
        document.querySelector('input[name="q1"]').click();
        const next = document.getElementById('quiz-next');
        next.focus();
        next.click();
        ${describeActive}
      `);
      return focused.startsWith('LI.quiz__step')
        ? { ok: true, detail: `фокус на ${focused}` }
        : { ok: false, detail: `фокус ушёл на ${focused}` };
    }
  },
  {
    name: 'квиз — отказ буфера обмена не выдаётся за успех',
    async run(page, base) {
      await page.setViewport(DESKTOP_VIEWPORT);
      await page.goto(base);
      const state = await page.evaluate(`
        // Имитируем браузер, который отказывает в копировании обоими способами
        Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
        document.execCommand = () => false;
        ['q1', 'q3', 'q4'].forEach((name) => document.querySelector('input[name="' + name + '"]').click());
        const next = document.getElementById('quiz-next');
        next.click(); next.click(); next.click();
        const btn = document.getElementById('quiz-copy-btn');
        btn.click();
        return new Promise((resolve) => setTimeout(() => resolve({
          copied: btn.classList.contains('is-copied'),
          failed: btn.classList.contains('is-copy-failed'),
          visible: btn.innerText.trim()
        }), 200));
      `);
      if (state.copied) return { ok: false, detail: 'кнопка отрапортовала «Скопировано» на пустом буфере' };
      return state.failed
        ? { ok: true, detail: `показано: «${state.visible}»` }
        : { ok: false, detail: 'отказ никак не показан пользователю' };
    }
  },
  {
    name: 'якорь — фокус переезжает на секцию и адрес обновляется',
    async run(page, base) {
      await page.setViewport(DESKTOP_VIEWPORT);
      await page.goto(base);
      const result = await page.evaluate(`
        document.querySelector('.nav__link[href="#faq"]').click();
        return new Promise((resolve) => setTimeout(() => resolve({
          hash: location.hash,
          focus: document.activeElement ? document.activeElement.id : ''
        }), 600));
      `);
      return result.hash === '#faq' && result.focus === 'faq'
        ? { ok: true, detail: 'hash и фокус на секции' }
        : { ok: false, detail: `hash «${result.hash}», фокус «${result.focus}»` };
    }
  },
  {
    name: 'лайтбокс — Tab не выпускает фокус за пределы модалки',
    async run(page, base) {
      await page.setViewport(DESKTOP_VIEWPORT);
      await page.goto(base);
      await page.evaluate(`document.querySelector('.doc-card__btn').click(); return true;`);
      await page.wait(SETTLE_MS);
      const escape = await findFocusEscape(page, '#lightbox', TAB_SWEEP_STEPS);
      return escape === null
        ? { ok: true, detail: `${TAB_SWEEP_STEPS} Tab подряд — фокус остался в модалке` }
        : { ok: false, detail: `на ${escape.step}-м Tab фокус утёк на ${escape.where}` };
    }
  },
  {
    name: 'мобильное меню — Tab не выпускает фокус в закрытый контент',
    async run(page, base) {
      await page.setViewport(MOBILE_VIEWPORT);
      await page.goto(base);
      await page.evaluate(`document.querySelector('.burger').click(); return true;`);
      await page.wait(SETTLE_MS);
      const escape = await findFocusEscape(page, '.header', TAB_SWEEP_STEPS);
      return escape === null
        ? { ok: true, detail: `${TAB_SWEEP_STEPS} Tab подряд — фокус остался в шапке` }
        : { ok: false, detail: `на ${escape.step}-м Tab фокус утёк на ${escape.where}` };
    }
  }
];

/* ============ запуск ============ */

const green = (text) => `[32m${text}[0m`;
const red = (text) => `[31m${text}[0m`;
const yellow = (text) => `[33m${text}[0m`;

const binary = await findChrome();
if (!binary) {
  console.log(`\n  ${yellow('~')} поведенческие проверки пропущены: Chrome не найден`);
  process.exit(0);
}

const { server, port } = await startServer();
const { chrome, endpoint, profile } = await launchChrome(binary);
const client = connect(endpoint);
await client.ready;

const page = await Page.open(client);
const base = `http://127.0.0.1:${port}/`;
let failures = 0;

for (const scenario of scenarios) {
  let result;
  try {
    result = await scenario.run(page, base);
  } catch (error) {
    result = { ok: false, detail: `сценарий упал: ${error.message}` };
  }
  if (!result.ok) failures += 1;
  const mark = result.ok ? green('+') : red('-');
  console.log(`  ${mark} ${scenario.name}\n      ${result.detail}`);
}

client.socket.close();
chrome.kill();
server.close();
await rm(profile, { recursive: true, force: true });

process.exit(failures === 0 ? 0 : 1);
