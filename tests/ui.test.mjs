import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { preview } from 'astro';
import { readKnowledge, validateKnowledge, projectRoot } from '../scripts/knowledge-content.mjs';
import { locales } from '../src/i18n/ui.ts';
import { topics, topicIds, topicGroups, programmingLanguages, featuredCardLimit } from '../src/knowledge.ts';

const entries = validateKnowledge(readKnowledge());
const browserPath = process.env.BROWSER_PATH || [
  path.join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'),
  path.join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(existsSync);
assert(browserPath && existsSync(browserPath), 'Set BROWSER_PATH to an installed Chrome/Chromium/Edge executable; this test does not download browsers.');
const output = path.resolve(process.env.QA_OUTPUT || path.join(projectRoot, '../knowledgeos-browser-qa'));
const relativeOutput = path.relative(projectRoot, output);
assert(relativeOutput.startsWith(`..${path.sep}`) || path.isAbsolute(relativeOutput), 'QA_OUTPUT must be outside the repository so dev does not watch browser profiles.');
mkdirSync(output, { recursive: true });
const runOutput = mkdtempSync(path.join(output, 'maintained-'));
const results = [];
const errors = [];
let server, browser, socket;
let base = process.env.QA_BASE;
const hrefFor = entry => `/${entry.data.locale}/knowledge/${entry.data.key}/`;
const sameMembers = (actual, expected) => JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
const searchText = entry => {
  const d = entry.data;
  const group = topicGroups.find(group => group.id === topics[d.topic].group);
  return [d.cardId, d.title, d.subtitle, d.summary, group[d.locale], topics[d.topic][d.locale], ...d.languages, ...d.tags].join(' ').toLocaleLowerCase();
};

async function run() {
  if (!base) {
    server = await preview({ root: projectRoot, server: { host: '127.0.0.1', port: 0, open: false }, logLevel: 'error' });
    base = `http://127.0.0.1:${server.port}`;
  }
  base = base.replace(/\/$/, '');
  console.log(`Testing ${base}; screenshots and isolated profile: ${runOutput}`);
  browser = spawn(browserPath, [
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
    '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${path.join(runOutput, 'profile')}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const endpoint = await new Promise((resolve, reject) => {
    let text = '';
    const timer = setTimeout(() => reject(new Error('Browser startup timeout')), 20000);
    browser.once('error', error => { clearTimeout(timer); reject(error); });
    browser.once('exit', code => { clearTimeout(timer); reject(new Error(`Browser exited: ${code}`)); });
    browser.stderr.on('data', chunk => {
      text += chunk;
      const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  const targets = await (await fetch(`http://${new URL(endpoint).host}/json/list`)).json();
  const target = targets.find(item => item.type === 'page' && item.url === 'about:blank');
  assert(target, 'Isolated blank browser target exists');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args);
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`Browser command timed out: ${method}`)); }, 15000);
    pending.set(requestId, { resolve, reject, timer });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  const waitFor = async expression => {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      try { if (await evaluate(`Boolean(${expression})`)) return; }
      catch (error) { if (!/navigated or closed|context.*destroyed|Cannot find context/i.test(error.message)) throw error; }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`Timed out waiting for ${expression}`);
  };
  const navigate = async route => {
    await send('Page.navigate', { url: base + route });
    await waitFor(`location.pathname === ${JSON.stringify(route.split('?')[0])} && document.readyState === 'complete'`);
  };
  const point = selector => evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  const click = async selector => {
    const p = await point(selector);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...p });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...p });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...p });
  };
  const change = async (selector, value) => {
    await waitFor("document.readyState === 'complete'");
    await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  };
  const screenshot = async name => {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(path.join(runOutput, name), Buffer.from(shot.data, 'base64'));
  };
  const check = (label, condition) => { assert(condition, label); results.push(label); console.log('PASS', label); };
  const paths = selector => evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})].map(a=>new URL(a.href).pathname)`);
  const visible = () => paths('.catalog-item:not([hidden]) .knowledge-card');
  const viewport = (width, mobile) => send('Emulation.setDeviceMetricsOverride', { width, height: 1100, deviceScaleFactor: 1, mobile });
  const reset = async expected => {
    await click('.filter-reset');
    await waitFor(`!location.search && document.querySelectorAll('.catalog-item:not([hidden])').length === ${expected.length}`);
    check('native reset restores source members and clears URL', sameMembers(await visible(), expected.map(hrefFor)));
  };
  const checkFeaturedFallback = async (locale, cards, route, mode) => {
    const label = `${locale}: ${mode} ${route}`;
    const expected = [...cards].sort((a, b) => a.data.cardId.localeCompare(b.data.cardId)).slice(0, featuredCardLimit);
    const fallback = await paths('.featured-card .knowledge-card');
    check(`${label} retains the fixed, capped source slice`, JSON.stringify(fallback) === JSON.stringify(expected.map(hrefFor)));
    const rendered = await evaluate(`Array.from(document.querySelectorAll('.featured-card .knowledge-card'), a => {
      const title = a.querySelector('.card-title > span');
      const summary = a.querySelector('.card-summary');
      return {
        title: title.textContent, summary: summary.textContent,
        readable: [a, title, summary].every(e => {
          const rect = e.getBoundingClientRect();
          return e.checkVisibility({checkOpacity: true, checkVisibilityCSS: true}) &&
            rect.width > 0 && rect.height > 0 && parseFloat(getComputedStyle(e).fontSize) > 0 && e.innerText.trim().length > 0;
        }),
      };
    })`);
    check(`${label} cards are visible and readable with source text`, rendered.length === expected.length && rendered.every((item, index) => item.readable && item.title === expected[index].data.title && item.summary === expected[index].data.summary));
    const pool = await evaluate("[...document.querySelector('[data-featured-deck] template').content.querySelectorAll('.knowledge-card')].map(a=>new URL(a.getAttribute('href'), location.href).pathname)");
    check(`${label} keeps all candidates inert without extra visible cards`, sameMembers(pool, cards.map(hrefFor)) && await evaluate(`document.querySelectorAll('[data-featured-deck] .knowledge-card').length === ${fallback.length}`));
    if (expected.length) {
      await click('.featured-card:first-child .card-title > span:first-child');
      await waitFor(`location.pathname === ${JSON.stringify(hrefFor(expected[0]))} && document.readyState === 'complete' && !!document.querySelector('.article-header')`);
      check(`${label} native card click opens the correct source detail`, await evaluate("document.querySelector('.article-header h1').textContent") === expected[0].data.title);
    }
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await viewport(1440, false);
  for (const locale of locales) {
    const cards = entries.filter(entry => entry.data.locale === locale);
    const expectedPaths = cards.map(hrefFor);
    const catalogRoute = `/${locale}/knowledge/sets/`;
    for (const route of [`/${locale}/`, `/${locale}/knowledge/`]) {
      await navigate(route);
      const featured = await paths('.featured-card .knowledge-card');
      check(`${locale}: featured members are unique, valid and capped by the shared limit`, featured.length === Math.min(featuredCardLimit, cards.length) && new Set(featured).size === featured.length && featured.every(href => expectedPaths.includes(href)));
      check(`${locale}: random pool matches all source articles including preview`, sameMembers(await evaluate("JSON.parse(document.querySelector('.random-card').dataset.cardUrls)"), expectedPaths));
      const rendered = await evaluate("[...document.querySelectorAll('.featured-card .knowledge-card')].map(a=>({href:a.pathname,title:a.querySelector('.card-title > span').textContent,topic:a.querySelector('.card-topic').textContent,art:a.querySelector('img').getAttribute('src')}))");
      check(`${locale}: random featured content agrees with its source`, rendered.every(item => {
        const entry = cards.find(entry => hrefFor(entry) === item.href);
        return entry && item.title === entry.data.title && item.topic === topics[entry.data.topic][locale] && item.art === entry.data.cardArt;
      }));
      const sortedPaths = [...cards].sort((a, b) => a.data.cardId.localeCompare(b.data.cardId)).map(hrefFor);
      let override = await send('Page.addScriptToEvaluateOnNewDocument', { source: "Math.random = () => 0; globalThis.__featuredDraw = 'start';" });
      try {
        await navigate(route);
        await waitFor("globalThis.__featuredDraw === 'start' && !document.querySelector('[data-featured-deck] template')");
        const firstDraw = await paths('.featured-card .knowledge-card');
        check(`${locale}: featured sampling uses browser randomness on page load`, JSON.stringify(firstDraw) === JSON.stringify(sortedPaths.slice(0, featuredCardLimit)));
        await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: override.identifier });
        override = await send('Page.addScriptToEvaluateOnNewDocument', { source: "Math.random = () => 0.9999999999999999; globalThis.__featuredDraw = 'end';" });
        await send('Page.reload', { ignoreCache: true });
        await waitFor("document.readyState === 'complete' && globalThis.__featuredDraw === 'end' && !document.querySelector('[data-featured-deck] template')");
        const nextDraw = await paths('.featured-card .knowledge-card');
        check(`${locale}: refresh samples the full pool without rebuilding`, nextDraw.length === Math.min(featuredCardLimit, cards.length) && new Set(nextDraw).size === nextDraw.length && nextDraw.every(href => expectedPaths.includes(href)) && (!cards.length || nextDraw[0] === sortedPaths.at(-1)) && (cards.length <= 1 || JSON.stringify(nextDraw) !== JSON.stringify(firstDraw)));
      } finally {
        await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: override.identifier });
      }
    }
    await navigate(`/${locale}/`);
    await screenshot(`${locale}-home-desktop.png`);
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    for (const [width, height] of [[320, 680], [390, 844], [760, 900], [768, 900], [1024, 768], [1280, 800], [1440, 560], [1920, 960], [2400, 1200], [3840, 1920]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 760 });
      await evaluate('window.scrollTo(0, 0)');
      const layout = await evaluate(`(() => {
        const sky = document.querySelector('.sky-world').getBoundingClientRect();
        const deck = document.querySelector('.home-deck').getBoundingClientRect();
        const eyebrow = document.querySelector('.world-intro .world-eyebrow').getBoundingClientRect();
        const islands = [...document.querySelectorAll('.sky-island-left, .sky-island-right')].map(svg => {
          const r = svg.querySelector('g').getBoundingClientRect();
          const matrix = svg.getScreenCTM();
          return { visible: r.left >= sky.left && r.right <= sky.right && r.top >= sky.top && r.bottom <= deck.top,
            aboveIntro: r.bottom <= eyebrow.top, undistorted: Math.abs(matrix.a - matrix.d) < .001 };
        });
        const art = [...document.querySelectorAll('.section-art')];
        const sun = document.querySelector('.sky-sun > circle:nth-of-type(2)').getBoundingClientRect();
        return { islands, sunVisible: sun.left >= sky.left && sun.right <= sky.right && sun.top >= sky.top && sun.bottom <= deck.top,
          noOverflow: document.documentElement.scrollWidth <= innerWidth,
          decorative: art.every(e => e.getAttribute('aria-hidden') === 'true' && getComputedStyle(e).pointerEvents === 'none'),
          fills: art.every(e => { const r = e.getBoundingClientRect(); const fill = e.querySelector('.scene-fill').getBoundingClientRect(); return r.width === fill.width && r.height === fill.height; }) };
      })()`);
      check(`${locale}: ${width}x${height} sun and islands stay visible, proportional and above the cards`, layout.sunVisible && layout.islands.length === 2 && layout.islands.every(item => item.visible && item.undistorted && (width > 760 || item.aboveIntro)));
      check(`${locale}: ${width}x${height} background fills both sections without overflow or input interception`, layout.noOverflow && layout.decorative && layout.fills);
      const measureScene = `(() => [...document.querySelectorAll('.sky-island-left, .sky-island-right, .sky-cloud-left, .sky-cloud-right, .sky-cloud-bottom-left, .sky-cloud-bottom-right, .ocean-light, .ocean-waves, .ocean-ridge-right, .ocean-reef-right')].map(e => {
        const r = e.getBoundingClientRect(); const panel = e.closest('.world-panel').getBoundingClientRect();
        const bottomAnchored = /bottom|ridge|reef/.test(e.getAttribute('class'));
        return { name: e.getAttribute('class'), width: r.width, height: r.height, left: r.left - panel.left, edge: bottomAnchored ? panel.bottom - r.bottom : r.top - panel.top };
      }))()`;
      // Isolate height changes from the scrollbar appearing in tall viewports.
      await evaluate("document.documentElement.style.overflowY = 'scroll'");
      const before = await evaluate(measureScene);
      try {
        await evaluate("document.querySelectorAll('.world-panel').forEach(e => { e.style.minHeight = `${e.getBoundingClientRect().height + 400}px`; })");
        const after = await evaluate(measureScene);
        check(`${locale}: ${width}x${height} added content height does not scale or displace anchored scenery`, before.length === after.length && before.every((item, index) => item.name === after[index].name && ['width', 'height', 'left', 'edge'].every(key => Math.abs(item[key] - after[index][key]) < .1)));
      } finally {
        await evaluate("document.querySelectorAll('.world-panel').forEach(e => e.style.removeProperty('min-height')); document.documentElement.style.removeProperty('overflow-y')");
      }
      await screenshot(`${locale}-scene-${width}x${height}-sky.png`);
      await evaluate("document.querySelector('.ocean-world').scrollIntoView({block:'start'})");
      const reef = await evaluate(`(() => {
        const panel = document.querySelector('.ocean-world').getBoundingClientRect();
        const reef = document.querySelector('.ocean-reef-right > g').getBoundingClientRect();
        return reef.left >= panel.left && reef.right <= panel.right && reef.top >= panel.top && Math.min(reef.bottom, panel.bottom) - reef.top > 40;
      })()`);
      check(`${locale}: ${width}x${height} ocean reef stays inside the section`, reef);
      await screenshot(`${locale}-scene-${width}x${height}-ocean.png`);
    }
    await send('Emulation.setEmulatedMedia', { features: [] });
    await viewport(1440, false);
    await evaluate('window.scrollTo(0, 0)');
    if (cards.length) {
      const p = await point('.featured-card .card-title');
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
      const top = await evaluate("document.querySelector('.featured-card').getBoundingClientRect().top");
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...p });
      await waitFor(`getComputedStyle(document.querySelector('.featured-card')).zIndex==='10' && document.querySelector('.featured-card').getBoundingClientRect().top < ${top}-20`);
      check(`${locale}: hover lifts the card and pointer updates the sky`, await evaluate("document.querySelector('.sky-world').style.getPropertyValue('--scene-x')!==''"));
      await click('.random-card');
      await waitFor(`document.readyState==='complete' && !!document.querySelector('.article-header') && document.documentElement.lang.startsWith(${JSON.stringify(locale)})`);
      const drawn = await evaluate('location.pathname');
      check(`${locale}: random opens a real detail and excludes itself`, expectedPaths.includes(drawn) && sameMembers(await evaluate("JSON.parse(document.querySelector('.random-card').dataset.cardUrls)"), expectedPaths.filter(href => href !== drawn)));
      if (cards.length > 1) {
        await click('.random-card');
        await waitFor(`location.pathname!==${JSON.stringify(drawn)} && document.readyState==='complete' && !!document.querySelector('.article-header')`);
        check(`${locale}: another draw changes the current card`, expectedPaths.includes(await evaluate('location.pathname')));
      }
    }
    await navigate(catalogRoute);
    check(`${locale}: catalog exactly matches source articles`, sameMembers(await visible(), expectedPaths));
    const options = await evaluate("[...document.querySelectorAll('#topic-filter option[value]:not([value=\"\"])')].map(o=>({id:o.value,name:o.textContent,group:o.parentElement.label}))");
    check(`${locale}: topic dropdown matches the registry`, options.length === topicIds.length && options.every(option => option.name === topics[option.id][locale] && option.group === topicGroups.find(group => group.id === topics[option.id].group)[locale]));
    check(`${locale}: language options match the registry`, sameMembers(await evaluate("[...document.querySelectorAll('#language-filter option')].map(o=>o.value).filter(Boolean)"), programmingLanguages));
    const catalogData = await evaluate("[...document.querySelectorAll('.catalog-item')].map(e=>({href:e.querySelector('.knowledge-card').pathname,topic:e.dataset.topic,languages:JSON.parse(e.dataset.languages),topicLabel:e.querySelector('.card-topic').textContent,groupLabel:e.querySelector('.card-group').textContent}))");
    check(`${locale}: card classification matches source metadata`, catalogData.every(item => {
      const entry = cards.find(entry => hrefFor(entry) === item.href);
      return entry && item.topic === entry.data.topic && sameMembers(item.languages, entry.data.languages) && item.topicLabel === topics[entry.data.topic][locale] && item.groupLabel === topicGroups.find(group => group.id === topics[entry.data.topic].group)[locale];
    }));
    await screenshot(`${locale}-catalog-desktop.png`);
    for (const topic of topicIds) {
      await change('#topic-filter', topic);
      check(`${locale}: topic ${topic} matches source members`, sameMembers(await visible(), cards.filter(entry => entry.data.topic === topic).map(hrefFor)));
    }
    await change('#topic-filter', '');
    for (const language of programmingLanguages) {
      await change('#language-filter', language);
      check(`${locale}: language ${language} matches source members`, sameMembers(await visible(), cards.filter(entry => entry.data.languages.includes(language)).map(hrefFor)));
      for (const topic of topicIds) {
        await change('#topic-filter', topic);
        check(`${locale}: ${topic} AND ${language} matches source intersection`, sameMembers(await visible(), cards.filter(entry => entry.data.topic === topic && entry.data.languages.includes(language)).map(hrefFor)));
      }
      await change('#topic-filter', '');
    }
    await reset(cards);
    for (const query of [cards[0]?.data.cardId, topicGroups[0][locale]].filter(Boolean)) {
      await change('#card-search', query);
      check(`${locale}: search ${query} matches source fields`, sameMembers(await visible(), cards.filter(entry => searchText(entry).includes(query.toLocaleLowerCase())).map(hrefFor)));
    }
    await change('#card-search', '__no_such_knowledge_card_9f64__');
    check(`${locale}: empty result is visible and announced`, await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===0 && !document.querySelector('.search-empty').hidden && document.querySelector('#card-count').getAttribute('aria-live')==='polite'"));
    await reset(cards);
    const crossLanguage = programmingLanguages[0];
    await change('#language-filter', crossLanguage);
    const translatedLocale = locales.find(value => value !== locale);
    await click('.language-switch');
    await waitFor(`location.pathname==='/${translatedLocale}/knowledge/sets/' && document.readyState==='complete' && document.querySelector('#language-filter')?.value===${JSON.stringify(crossLanguage)}`);
    check(`${locale}: locale switch preserves filters and translated members`, sameMembers(await visible(), entries.filter(entry => entry.data.locale === translatedLocale && entry.data.languages.includes(crossLanguage)).map(hrefFor)));
    await navigate(`/${locale}/knowledge/directory/`);
    check(`${locale}: directory lists each source article once`, sameMembers(await paths('.topic-content li a'), expectedPaths));
    const branches = await evaluate("[...document.querySelectorAll('.topic-branch')].map(e=>({id:e.dataset.topic,name:e.querySelector('summary > span').textContent,group:e.closest('section').id,count:Number(e.querySelector('.topic-count').textContent.match(/\\d+/)[0]),hrefs:[...e.querySelectorAll('li a')].map(a=>a.pathname)}))");
    check(`${locale}: directory labels, counts and members match content`, branches.length === topicIds.length && branches.every(branch => branch.name === topics[branch.id][locale] && branch.group === topics[branch.id].group && branch.count === branch.hrefs.length && sameMembers(branch.hrefs, cards.filter(entry => entry.data.topic === branch.id).map(hrefFor))));
    const languageLinks = await evaluate("[...document.querySelectorAll('.language-topics a')].map(a=>({language:new URL(a.href).searchParams.get('language'),count:Number(a.lastElementChild.textContent)}))");
    check(`${locale}: language cross-reference counts match content`, languageLinks.length === programmingLanguages.length && languageLinks.every(link => link.count === cards.filter(entry => entry.data.languages.includes(link.language)).length));
    await click('.directory-nav a');
    check(`${locale}: parent anchor works`, await evaluate('location.hash') === `#${topicGroups[0].id}`);
    for (const entry of cards) {
      await navigate(hrefFor(entry));
      const detail = await evaluate("({title:document.querySelector('.article-header h1').textContent,topic:document.querySelector('.card-topic').textContent,group:document.querySelector('.card-group').textContent,breadcrumbs:[...document.querySelectorAll('.breadcrumbs a')].map(a=>({text:a.textContent,href:a.href})),languages:[...document.querySelectorAll('.article-languages a')].map(a=>({name:a.textContent,language:new URL(a.href).searchParams.get('language')})),preview:!!document.querySelector('.article-header .preview-badge')})");
      const group = topicGroups.find(group => group.id === topics[entry.data.topic].group);
      check(`${locale}: ${entry.data.key} detail agrees with its article`, detail.title === entry.data.title && detail.topic === topics[entry.data.topic][locale] && detail.group === group[locale] && detail.breadcrumbs[0].text === group[locale] && new URL(detail.breadcrumbs[0].href).hash === `#${group.id}` && new URL(detail.breadcrumbs[1].href).searchParams.get('topic') === entry.data.topic && sameMembers(detail.languages.map(link => link.language), entry.data.languages) && detail.preview === (entry.data.status === 'preview'));
      const body = await evaluate(`({
        headings: [...document.querySelectorAll('.prose h2')].map(e => e.id),
        toc: [...document.querySelectorAll('.article-toc a')].map(a => decodeURIComponent(a.hash.slice(1))),
        code: [...document.querySelectorAll('.prose pre code')].map(e => e.textContent.trimEnd()),
        art: document.querySelector('.knowledge-card img').getAttribute('src'),
        images: [...document.images].every(img => img.complete && img.naturalWidth > 0),
        translation: document.querySelector('.language-switch').pathname,
        canonical: new URL(document.querySelector('link[rel="canonical"]').href).pathname,
        links: [...document.querySelectorAll('.prose a')].filter(a => a.getAttribute('href').startsWith('/')).map(a => a.pathname)
      })`);
      const sourceCode = [...entry.body.matchAll(/\x60\x60\x60[^\r\n]*\r?\n([\s\S]*?)\x60\x60\x60/g)].map(match => match[1].replaceAll('\r\n', '\n').trimEnd());
      check(`${locale}: ${entry.data.key} code, artwork, contents and translation render correctly`,
        body.images && body.art === entry.data.cardArt && body.headings.length > 0 &&
        body.headings.every(id => id && body.toc.includes(id)) &&
        body.toc.every(id => body.headings.includes(id) || (entry.data.key === 'mb-vs-mib' && id === 'scale-heading')) &&
        JSON.stringify(body.code) === JSON.stringify(sourceCode) &&
        body.translation === `/${translatedLocale}/knowledge/${entry.data.key}/` && body.canonical === hrefFor(entry) &&
        body.links.every(href => expectedPaths.includes(href)));
      if (locale === 'en') {
        await evaluate("document.querySelector('.knowledge-card img').scrollIntoView({block:'center'})");
        const clip = await evaluate("(()=>{const r=document.querySelector('.knowledge-card img').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:2};})()");
        const shot = await send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
        writeFileSync(path.join(runOutput, `${entry.data.key}-art.png`), Buffer.from(shot.data, 'base64'));
      }
      await click('.language-switch');
      await waitFor(`location.pathname===${JSON.stringify(`/${translatedLocale}/knowledge/${entry.data.key}/`)} && document.readyState==='complete'`);
      const translation = entries.find(other => other.data.locale === translatedLocale && other.data.key === entry.data.key);
      check(`${locale}: ${entry.data.key} native language switch keeps the same concept`, await evaluate("document.querySelector('.article-header h1').textContent") === translation.data.title);
      await navigate(hrefFor(entry));
      if (entry.data.languages.length) {
        await click('.article-languages a');
        await waitFor(`location.pathname===${JSON.stringify(catalogRoute)} && document.readyState==='complete' && document.querySelector('#language-filter')?.value===${JSON.stringify(entry.data.languages[0])}`);
        check(`${locale}: ${entry.data.key} language link selects the right source members`, sameMembers(await visible(), cards.filter(card => card.data.languages.includes(entry.data.languages[0])).map(hrefFor)));
      }
    }
    if (cards.length) {
      await navigate(`/${locale}/knowledge/`);
      await click('#card-search');
      await send('Input.insertText', { text: cards[0].data.cardId });
      await click('.library-search button');
      await waitFor(`location.pathname===${JSON.stringify(catalogRoute)} && document.readyState==='complete' && document.querySelector('#card-search')?.value===${JSON.stringify(cards[0].data.cardId)}`);
      check(`${locale}: landing search reaches matching catalog content`, sameMembers(await visible(), cards.filter(entry => searchText(entry).includes(cards[0].data.cardId.toLocaleLowerCase())).map(hrefFor)));
    }
    for (const width of [390, 320]) {
      await viewport(width, true);
      for (const route of [catalogRoute, `/${locale}/knowledge/directory/`, ...cards.map(hrefFor)]) {
        await navigate(route);
        check(`${locale}: ${width}px page fits ${route}`, await evaluate(`document.documentElement.scrollWidth<=${width} && [...document.querySelectorAll('.card-classification,.card-topic,.card-group')].every(e=>e.scrollWidth<=e.clientWidth+1)`));
        if (route.endsWith('/directory/')) {
          check(`${locale}: ${width}px directory navigation precedes its tree`, await evaluate("document.querySelector('.directory-nav').getBoundingClientRect().bottom <= document.querySelector('.directory-tree').getBoundingClientRect().top"));
          if (width === 390) await screenshot(`${locale}-directory-mobile.png`);
        }
      }
    }
    await viewport(390, true);
    await navigate(`/${locale}/`);
    check(`${locale}: mobile homepage has no horizontal overflow`, await evaluate('document.documentElement.scrollWidth<=390'));
    if (cards.length) {
      const last = await evaluate("document.querySelector('.featured-card:last-child a').pathname");
      await evaluate("document.querySelector('.featured-deck').scrollLeft=99999");
      await screenshot(`${locale}-home-mobile.png`);
      await click('.featured-card:last-child a');
      await waitFor(`location.pathname===${JSON.stringify(last)} && document.readyState==='complete'`);
      check(`${locale}: last mobile featured member is reachable`, expectedPaths.includes(last));
    }
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await navigate(`/${locale}/`);
    check(`${locale}: reduced motion disables scene animation and card transitions`, await evaluate("getComputedStyle(document.querySelector('.cloud-drift')).animationName==='none' && (!document.querySelector('.featured-card') || getComputedStyle(document.querySelector('.featured-card')).transitionDuration==='0s')"));
    await click('.gallery-link');
    await waitFor(`location.pathname==='/${locale}/projects/' && document.readyState==='complete' && !!document.querySelector('.project-placeholder')`);
    check(`${locale}: existing gallery styles survive cleanup`, await evaluate("!!document.querySelector('.ocean .portal-label') && getComputedStyle(document.querySelector('.ocean')).backgroundImage!=='none'"));
    await navigate(`/${locale}/about/`);
    check(`${locale}: about and header navigation still render`, await evaluate("!!document.querySelector('.about-copy') && document.querySelectorAll('.site-header nav a').length>0"));
    await send('Emulation.setEmulatedMedia', { features: [] });
    await viewport(1440, false);
    await send('Emulation.setScriptExecutionDisabled', { value: true });
    try {
      await navigate(catalogRoute);
      check(`${locale}: no-JavaScript catalog retains all source cards`, sameMembers(await visible(), expectedPaths) && await evaluate("document.querySelector('.random-card').disabled"));
      for (const route of [`/${locale}/`, `/${locale}/knowledge/`]) {
        await navigate(route);
        await checkFeaturedFallback(locale, cards, route, 'no-JavaScript');
      }
    } finally {
      await send('Emulation.setScriptExecutionDisabled', { value: false });
    }
    let blockedDocuments = 0;
    const policyRequests = [];
    const blockScriptPolicy = event => {
      const message = JSON.parse(event.data);
      if (message.method !== 'Fetch.requestPaused') return;
      policyRequests.push((async () => {
        const { requestId, responseStatusCode, responseHeaders } = message.params;
        const body = await send('Fetch.getResponseBody', { requestId });
        const headers = responseHeaders.filter(header => !['content-security-policy', 'content-length', 'content-encoding'].includes(header.name.toLowerCase()));
        headers.push({ name: 'Content-Security-Policy', value: "script-src 'none'" });
        await send('Fetch.fulfillRequest', {
          requestId, responseCode: responseStatusCode, responseHeaders: headers,
          body: body.base64Encoded ? body.body : Buffer.from(body.body).toString('base64'),
        });
        blockedDocuments++;
      })().catch(error => { errors.push(error); }));
    };
    socket.addEventListener('message', blockScriptPolicy);
    try {
      await send('Network.enable');
      await send('Network.setCacheDisabled', { cacheDisabled: true });
      await send('Fetch.enable', { patterns: [{ resourceType: 'Document', requestStage: 'Response' }] });
      for (const route of [`/${locale}/`, `/${locale}/knowledge/`]) {
        const before = blockedDocuments;
        await navigate(route);
        await Promise.all(policyRequests);
        check(`${locale}: ${route} receives a policy blocking inline and external scripts`, blockedDocuments > before);
        await checkFeaturedFallback(locale, cards, route, 'blocked-script-policy');
      }
    } finally {
      await send('Fetch.disable');
      socket.removeEventListener('message', blockScriptPolicy);
      await Promise.all(policyRequests);
      await send('Network.setCacheDisabled', { cacheDisabled: false });
      await send('Network.disable');
    }
    const externalScriptRoutes = [];
    for (const route of [`/${locale}/`, `/${locale}/knowledge/`]) {
      await navigate(route);
      if (await evaluate("document.querySelectorAll('script[src]').length > 0")) externalScriptRoutes.push(route);
    }
    if (externalScriptRoutes.length) {
      let blockedLoads = 0;
      const blockedRequests = [];
      const blockScript = event => {
        const message = JSON.parse(event.data);
        if (message.method !== 'Fetch.requestPaused') return;
        blockedRequests.push(send('Fetch.failRequest', { requestId: message.params.requestId, errorReason: 'Failed' })
          .then(() => { blockedLoads++; })
          .catch(error => { errors.push(error); }));
      };
      socket.addEventListener('message', blockScript);
      try {
        await send('Network.enable');
        await send('Network.setCacheDisabled', { cacheDisabled: true });
        await send('Fetch.enable', { patterns: [{ resourceType: 'Script', requestStage: 'Request' }] });
        for (const route of externalScriptRoutes) {
          await Promise.all(blockedRequests);
          const before = blockedLoads;
          await navigate(route);
          await Promise.all(blockedRequests);
          check(`${locale}: ${route} actually fails browser Script resource loads`, blockedLoads > before);
          await checkFeaturedFallback(locale, cards, route, 'failed-script');
        }
      } finally {
        await send('Fetch.disable');
        socket.removeEventListener('message', blockScript);
        await Promise.all(blockedRequests);
        await send('Network.setCacheDisabled', { cacheDisabled: false });
        await send('Network.disable');
      }
    }
  }
  await navigate('/zh/knowledge/mb-vs-mib/');
  await click('input[value="MiB"]');
  check('MB/MiB interaction still works', await evaluate("document.querySelector('[data-scale-value]').textContent==='1' && document.querySelector('[data-scale-unit]').textContent==='MiB'"));
  check('no browser JavaScript exceptions or console errors', errors.length === 0);
  console.log(JSON.stringify({ passed: results.length, base, output: runOutput, errors }, null, 2));
  await send('Browser.close');
}

try { await run(); }
catch (error) { console.error(error); if (errors.length) console.error(errors); process.exitCode = 1; }
finally { socket?.close(); browser?.kill(); await server?.stop(); }
