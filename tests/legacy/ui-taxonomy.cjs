const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.QA_BASE || 'http://127.0.0.1:4321';
const projectRoot = path.resolve(__dirname, '../..');
const outputRoot = path.resolve(process.env.QA_OUTPUT || path.join(projectRoot, '../knowledgeos-browser-qa'));
const relativeOutput = path.relative(projectRoot, outputRoot);
assert(relativeOutput.startsWith(`..${path.sep}`) || path.isAbsolute(relativeOutput), 'QA_OUTPUT must be outside the repository.');
fs.mkdirSync(outputRoot, { recursive: true });
const output = fs.mkdtempSync(path.join(outputRoot, 'legacy-taxonomy-'));
const results = [];
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
  '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
  `--user-data-dir=${path.join(output, 'qa-chrome-interaction')}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
async function run() {
  const endpoint = await new Promise((resolve, reject) => {
    let text = '';
    const timeout = setTimeout(() => reject(new Error('Headless browser startup timeout')), 20000);
    browser.stderr.on('data', chunk => {
      text += chunk;
      const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
    browser.on('error', reject);
  });
  const origin = new URL(endpoint);
  const targets = await (await fetch(`http://${origin.host}/json/list`)).json();
  const target = targets.find(item => item.type === 'page' && item.url === 'about:blank');
  assert(target);
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (!message.id) return;
    const request = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  const waitFor = async expression => {
    const end = Date.now() + 10000;
    while (Date.now() < end) {
      try { if (await evaluate(`Boolean(${expression})`)) return; }
      catch (error) {
        if (!/navigated or closed|context.*destroyed|Cannot find context/i.test(error.message)) throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`Timed out waiting for ${expression}`);
  };
  const settled = () => evaluate('new Promise(resolve=>setTimeout(resolve,400))');
  const navigate = async route => {
    await send('Page.navigate', { url: base + route });
    await waitFor(`location.pathname === ${JSON.stringify(route.split('?')[0])} && document.readyState === 'complete' && (!document.querySelector('.random-card') || !document.querySelector('.random-card').disabled)`);
  };
  const point = selector => evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  const click = async selector => {
    const p = await point(selector);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...p });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...p });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...p });
  };
  const change = async (selector, value) => {
    await waitFor("document.readyState === 'complete'");
    return evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  };
  const screenshot = async name => {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(output, name), Buffer.from(shot.data, 'base64'));
  };
  const check = (label, condition) => { assert(condition, label); results.push(label); console.log('PASS', label); };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1150, deviceScaleFactor: 1, mobile: false });
  await navigate('/zh/');
  await waitFor('[...document.images].every(image=>image.complete)');
  check('home has exactly seven cards and eleven random candidates', await evaluate("document.querySelectorAll('.featured-card').length===7 && JSON.parse(document.querySelector('.random-card').dataset.cardUrls).length===11"));
  await screenshot('home-desktop-verified.png');
  const p = await point('.featured-card:nth-child(4) .card-title');
  const before = await evaluate("document.querySelector('.featured-card:nth-child(4)').getBoundingClientRect().top");
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...p });
  await settled();
  check('native pointer hover lifts the card and raises its stacking layer', await evaluate(`document.querySelector('.featured-card:nth-child(4)').getBoundingClientRect().top < ${before}-20 && getComputedStyle(document.querySelector('.featured-card:nth-child(4)')).zIndex==='10'`));
  check('pointer moves the sky scene', await evaluate("document.querySelector('.sky-world').style.getPropertyValue('--scene-x')!==''"));
  await screenshot('home-hover.png');
  await click('.random-card');
  await waitFor("location.pathname.startsWith('/zh/knowledge/') && !!document.querySelector('.article-header h1') && !document.querySelector('.random-card').disabled");
  const first = await evaluate('location.pathname');
  check('random card opens localized detail and excludes itself from next draw', await evaluate("JSON.parse(document.querySelector('.random-card').dataset.cardUrls).length===10 && !JSON.parse(document.querySelector('.random-card').dataset.cardUrls).includes(location.pathname)"));
  await click('.random-card');
  await waitFor(`location.pathname!==${JSON.stringify(first)} && !!document.querySelector('.article-header h1')`);
  check('draw another opens a different card', (await evaluate('location.pathname')) !== first);
  await click('.library-actions a:first-child');
  await waitFor("location.pathname==='/zh/knowledge/sets/' && !!document.querySelector('#card-count')");
  check('All Sets displays eleven cards', await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===11"));
  await change('#card-search', 'TCP');
  check('search filters all cards to TCP', await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===1 && document.querySelector('.catalog-item:not([hidden])').textContent.includes('TCP')"));
  await change('#topic-filter', 'architecture');
  check('combined filter has an accessible empty result', await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===0 && !document.querySelector('.search-empty').hidden && document.querySelector('#card-count').textContent==='0 张卡牌'"));
  await click('.filter-reset');
  await waitFor("document.querySelectorAll('.catalog-item:not([hidden])').length===11 && !location.search");
  check('clear filters restores all eleven cards and clears query parameters', await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===11 && !location.search"));
  await click('.library-actions a:last-child');
  await waitFor("location.pathname==='/zh/knowledge/directory/' && !!document.querySelector('.directory-tree')");
  check('subject hierarchy indexes all eleven cards exactly once', await evaluate("document.querySelectorAll('.topic-content li a').length===11 && new Set([...document.querySelectorAll('.topic-content li a')].map(a=>a.href)).size===11"));
  await click('.topic-branch:not([open]) summary');
  check('empty architecture branch expands honestly', await evaluate("[...document.querySelectorAll('.topic-branch[open]')].some(d=>d.textContent.includes('计算机体系结构') && d.textContent.includes('暂时没有卡片'))"));
  await screenshot('directory-desktop.png');
  await click('.language-topics a:first-child');
  await waitFor("location.pathname==='/zh/knowledge/sets/' && document.querySelector('#language-filter')?.value==='C#'");
  check('C# cross-reference filters to closure card', await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===1 && document.querySelector('.catalog-item:not([hidden])').textContent.includes('闭包')"));
  await click('.language-switch');
  await waitFor("location.pathname==='/en/knowledge/sets/' && document.querySelector('#language-filter')?.value==='C#'");
  check('language switch preserves active filters', await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===1 && document.querySelector('#card-count').textContent==='1 card'"));
  await click('.random-card');
  await waitFor("location.pathname.startsWith('/en/knowledge/') && !!document.querySelector('.article-header h1')");
  check('English draw stays in English', await evaluate("document.documentElement.lang==='en'"));
  await navigate('/zh/knowledge/mb-vs-mib/');
  await click('input[value="MiB"]');
  check('existing MB/MiB interaction still works', await evaluate("document.querySelector('[data-scale-value]').textContent==='1' && document.querySelector('[data-scale-unit]').textContent==='MiB'"));
  await navigate('/en/knowledge/');
  check('English library landing has seven cards', await evaluate("document.querySelectorAll('.featured-card').length===7"));
  await click('#card-search');
  await send('Input.insertText', { text: 'TCP' });
  await click('.library-search button');
  await waitFor("location.pathname==='/en/knowledge/sets/' && document.querySelector('#card-search')?.value==='TCP'");
  check('library search navigates to filtered All Sets', await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===1"));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 1100, deviceScaleFactor: 1, mobile: true });
  await navigate('/zh/');
  check('mobile page has no horizontal overflow', await evaluate('document.documentElement.scrollWidth<=390'));
  check('mobile deck holds seven cards in a horizontal scroller', await evaluate("document.querySelectorAll('.featured-card').length===7 && document.querySelector('.featured-deck').scrollWidth>document.querySelector('.featured-deck').clientWidth"));
  await screenshot('home-mobile-verified.png');
  await evaluate("document.querySelector('.featured-deck').scrollLeft=9999");
  await settled();
  check('mobile deck can reach the last card', await evaluate("document.querySelector('.featured-deck').scrollLeft>500"));
  await click('.featured-card:last-child a');
  await waitFor("location.pathname==='/zh/knowledge/n-plus-one-queries/'");
  check('last mobile card is clickable', true);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await navigate('/zh/');
  check('reduced motion disables cloud animation and card transitions', await evaluate("getComputedStyle(document.querySelector('.cloud-drift')).animationName==='none' && getComputedStyle(document.querySelector('.featured-card')).transitionDuration==='0s'"));
  await click('.gallery-link');
  await waitFor("location.pathname==='/zh/projects/' && !!document.querySelector('.project-placeholder')");
  check('ocean entrance reaches the existing gallery', true);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1150, deviceScaleFactor: 1, mobile: false });
  for (const locale of ['zh', 'en']) {
    await navigate(`/${locale}/knowledge/sets/`);
    await waitFor("document.querySelectorAll('.catalog-item:not([hidden])').length===11");
    const catalog = await evaluate(`(()=>({groups:[...document.querySelectorAll('#topic-filter optgroup')].map(g=>g.label),topics:[...document.querySelectorAll('#topic-filter option[value]:not([value=""])')].map(o=>({id:o.value,name:o.textContent,group:o.parentElement.label})),cards:[...document.querySelectorAll('.catalog-item')].map(c=>({id:c.dataset.topic,name:c.querySelector('.card-topic').textContent,group:c.querySelector('.card-group').textContent,href:new URL(c.querySelector('a').href).pathname,languages:JSON.parse(c.dataset.languages)}))}))()`);
    check(`${locale}: four groups and eleven topic options`, catalog.groups.length === 4 && catalog.topics.length === 11);
    check(`${locale}: every card matches filter topic and parent group`, catalog.cards.every(c => catalog.topics.some(t=>t.id===c.id && t.name===c.name && t.group===c.group)));
    await screenshot(`taxonomy-${locale}-desktop.png`);
    for (const topic of catalog.topics) {
      await change('#topic-filter', topic.id);
      const ids = await evaluate("[...document.querySelectorAll('.catalog-item:not([hidden])')].map(c=>c.dataset.topic)");
      check(`${locale}: topic ${topic.id} filters exact members`, ids.length===catalog.cards.filter(c=>c.id===topic.id).length && ids.every(id=>id===topic.id));
    }
    await change('#topic-filter', 'organization');
    await change('#language-filter', 'JavaScript');
    check(`${locale}: subject and language intersect on floating point`, await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===1 && document.querySelector('.catalog-item:not([hidden]) a').pathname.endsWith('/floating-point-rounding/')"));
    await change('#language-filter', 'C#');
    check(`${locale}: unrelated subject and language show zero`, await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===0 && !document.querySelector('.search-empty').hidden"));
    await click('.filter-reset');
    await waitFor("!location.search && document.querySelectorAll('.catalog-item:not([hidden])').length===11");
    await change('#card-search', catalog.groups[0]);
    check(`${locale}: parent-group keyword finds its three cards`, await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===3"));
    await navigate(`/${locale}/knowledge/directory/`);
    const directory = await evaluate(`([...document.querySelectorAll('.topic-branch')].map(d=>({id:d.dataset.topic,name:d.querySelector('summary > span').textContent,group:d.closest('section').querySelector('h2').lastChild.textContent,hrefs:[...d.querySelectorAll('li a')].map(a=>new URL(a.href).pathname)})))`);
    check(`${locale}: directory matches every filter label and membership`, directory.length===11 && directory.every(d=>catalog.topics.some(t=>t.id===d.id && t.name===d.name && t.group===d.group) && JSON.stringify(d.hrefs.slice().sort())===JSON.stringify(catalog.cards.filter(c=>c.id===d.id).map(c=>c.href).sort())));
    await click('.directory-nav a:first-of-type');
    check(`${locale}: stable parent anchor works`, await evaluate("location.hash==='#systems'"));
    for (const card of catalog.cards) {
      await navigate(card.href);
      check(`${locale}: detail ${card.href.split('/').at(-2)} matches its path`, await evaluate(`(()=>{const links=[...document.querySelectorAll('.breadcrumbs a')];return links.length===2 && links[0].textContent===${JSON.stringify(card.group)} && links[1].textContent===${JSON.stringify(card.name)} && new URL(links[1].href).searchParams.get('topic')===${JSON.stringify(card.id)} && document.querySelector('.card-topic').textContent===${JSON.stringify(card.name)}})()`));
    }
    await navigate(`/${locale}/knowledge/floating-point-rounding/`);
    await click('.article-languages a');
    await waitFor(`location.pathname==='/${locale}/knowledge/sets/' && document.querySelector('#language-filter')?.value==='JavaScript'`);
    check(`${locale}: detail language link filters catalog`, await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===1"));
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 1100, deviceScaleFactor: 1, mobile: true });
    for (const route of [`/${locale}/knowledge/sets/`, `/${locale}/knowledge/directory/`, `/${locale}/knowledge/closure-capture/`]) {
      await navigate(route);
      check(`${locale}: mobile classification fits ${route}`, await evaluate("document.documentElement.scrollWidth<=390 && [...document.querySelectorAll('.card-classification,.card-topic,.card-group')].every(e=>e.scrollWidth<=e.clientWidth+1)"));
    }
    await screenshot(`taxonomy-${locale}-mobile-detail.png`);
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1150, deviceScaleFactor: 1, mobile: false });
  }
  await send('Emulation.setScriptExecutionDisabled', { value: true });
  await send('Page.navigate', { url: base + '/en/knowledge/sets/' });
  await waitFor("location.pathname==='/en/knowledge/sets/' && document.readyState==='complete' && document.querySelectorAll('.catalog-item').length===11");
  check('without JavaScript every card retains its classification', await evaluate("document.querySelectorAll('.catalog-item:not([hidden])').length===11 && document.querySelectorAll('.card-classification').length===11 && document.querySelector('.random-card').disabled"));
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  check('no browser JavaScript exceptions', errors.length===0);
  console.log(JSON.stringify({passed:results.length,errors},null,2));
  await send('Browser.close');
}
run().catch(error => { console.error(error); process.exitCode=1; }).finally(() => { socket?.close(); browser.kill(); });
