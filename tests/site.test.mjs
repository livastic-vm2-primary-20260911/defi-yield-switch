import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {evaluate,DEFAULTS,INPUT_FIELDS,validateInputs,CalculatorError} from '../assets/calculator.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const en=read('index.html'),ko=read('ko/index.html'),js=read('assets/app.mjs');
const SITE='https://livastic-vm2-primary-20260911.github.io/defi-yield-switch/';

test('EN and KO pages have one canonical each and reciprocal hreflang',()=>{
  assert.match(en,/<html lang="en">/);
  assert.match(ko,/<html lang="ko">/);
  assert(en.includes('rel="canonical" href="'+SITE+'"'));
  assert(ko.includes('rel="canonical" href="'+SITE+'ko/"'));
  for(const html of [en,ko]){
    assert(html.includes('hreflang="en"'));
    assert(html.includes('hreflang="ko"'));
    assert(!html.includes('"aggregateRating"'));
    assert(html.includes('No')||html.includes('지갑'));
  }
});
test('all original 15 risk-sensitive numeric fields and result controls present',()=>{
  for(const html of [en,ko]){
    for(const field of INPUT_FIELDS){
      assert(html.includes('data-input="'+field+'"'),field);
      assert(html.includes('id="i-'+field+'"'),field);
    }
    for(const control of ['calculator','net-change','break-even','friction','rate-current','rate-target',
      'stress','chart','flags','status','download','copy-tip','public-tip','example-costly']){
      assert(html.includes('id="'+control+'"'),control);
    }
    assert.equal(html.split('id="calculator"').length-1,1);
  }
});
test('default privacy: CSP prevents network and third-party scripts, no form action',()=>{
  for(const html of [en,ko]){
    assert(html.includes("connect-src 'none'"));
    assert(html.includes("default-src 'none'"));
    assert(html.includes("form-action 'none'"));
    assert(!/google-analytics|gtag\(|hotjar|clarity\.ms|mixpanel|segment\.com|posthog/i.test(html));
    assert(!/action="https?:\/\//.test(html));
    for(const match of html.matchAll(/<a\b[^>]*>/g)){
      const tag=match[0];
      if(tag.includes('target="_blank"'))assert(tag.includes('rel="noopener noreferrer"'),tag.slice(0,120));
    }
  }
  assert(!/\bfetch\(|XMLHttpRequest|sendBeacon|window\.ethereum|eth_send|eth_sign|eth_requestAccounts/.test(js));
});
test('no personal finance information is transmitted, persisted, used for analytics, or appended to feedback email',()=>{
  assert(!/localStorage|sessionStorage|document\.cookie|IndexedDB|indexedDB/.test(js));
  assert(!/rpc|connectWallet|sendTransaction|approve/.test(js));
  assert(js.includes('new Blob'));
  assert(js.includes('URL.createObjectURL'));
  assert(js.includes('mailto')===false);
  for(const html of [en,ko])assert(html.includes('mailto:onecursor1@gmail.com?subject='));
});
test('free calculator and optional fixed scoped report are separate with honest $0 and 15 USDC',()=>{
  for(const html of [en,ko]){
    assert(html.includes('0 USDC')||html.includes('0 USD')||html.includes('No wallet')||html.includes('무료'));
    assert(html.includes('15')&&html.includes('USDC'));
    assert(html.includes('0x6b01efA0705E91a7aca54271510bf9e594717f34'));
    assert(html.includes('https://basescan.org/address/0x6b01efA0705E91a7aca54271510bf9e594717f34'));
    assert(html.includes('https://defillama.com/yields'));
    assert(!html.includes('Pay Now'));
    assert(!/verified [1-9][0-9]* buyers/i.test(html));
  }
});
test('public root project GitHub repo and valid site sitemap, robots',()=>{
  const url='https://github.com/livastic-vm2-primary-20260911/defi-yield-switch';
  assert(en.includes(url));assert(ko.includes(url));
  const xml=read('sitemap.xml');
  assert.equal((xml.match(/<loc>/g)||[]).length,8);
  assert(xml.includes(SITE+'</loc>'));
  assert(xml.includes(SITE+'ko/</loc>'));
  assert(read('robots.txt').includes('Sitemap: '+SITE+'sitemap.xml'));
});
test('all external sources are context, APY never fetched or ranked automatically',()=>{
  assert(js.includes('evaluate(read())'));
  assert(js.includes('riskFlags'));
  assert(!js.includes('yieldAPYAPI'));
  assert(en.includes('2026')&&ko.includes('2026'));
  assert(read('README.md').includes('November 2026')===false||read('README.md').includes('13 Nov 2026'));
});
test('original source workflow is read-only and pinned official action SHAs',()=>{
  const yml=read('.github/workflows/verify.yml');
  assert(yml.includes('contents: read'));
  assert(!yml.includes('id-token: write'));
  assert(!yml.includes('pull_request_target:'));
  assert.equal((yml.match(/uses: actions\/.+@[a-f0-9]{40}/g)||[]).length,2);
  assert(yml.includes('npm test'));
});
test('web UI sample high-fee scenario is significantly worse than typical when reward realization falls',()=>{
  const baseline=evaluate(DEFAULTS);
  const high=evaluate({...DEFAULTS,principal:1500,currentBaseApy:3.9,targetBaseApy:4.7,
    targetRewardApy:6,rewardRealizationPct:20,gasUsd:15,bridgeUsd:48,
    swapUsd:15,exitUsd:5,futureExitUsd:12,slippageBps:100,
    delayDays:7,lockDays:150,horizonDays:90});
  assert(high.totalEstimatedCostsUsd>baseline.totalEstimatedCostsUsd);
  assert(high.horizon.netAdvantageUsd<0);
  assert(!high.horizon.withdrawableUnderAssumedLock);
});

test('honest external crypto tools directory navigation is discoverable without paying for promotion',()=>{
  for(const html of [en,ko]) {
    assert(html.includes('href="https://polymart.app/crypto"'));
    assert(html.includes('target="_blank" rel="noopener noreferrer">Crypto Tools Directory'));
    assert(!html.includes('sponsored listing approved'));
  }
});

test('one-page paid report example is HONEST synthetic free preview and links to actual feedback',()=>{
  const issue='https://github.com/livastic-vm2-primary-20260911/defi-yield-switch/issues/new?template=feedback.yml';
  for(const lang of ['','ko/']){
    const html=lang?ko:en;
    const sample=read(lang+'examples/index.html');
    assert(html.includes(issue));
    assert(html.includes('href="/defi-yield-switch/'+lang+'examples/"'));
    assert(sample.includes('href="'+issue+'"'));
    assert(sample.includes('15 USDC')||sample.includes('$15'));
    assert(sample.includes('49 days')||sample.includes('49일'));
    assert(sample.includes('$22.58'));
    assert(sample.includes('$10.52'));
    assert(sample.includes('AI')&&sample.includes('https://github.com/livastic-vm2-primary-20260911/defi-yield-switch'));
    assert(sample.includes("connect-src 'none'"));
    assert(!/customer testimonial|real paid client|we guarantee/i.test(sample));
  }
  const sitemap=read('sitemap.xml');
  assert(sitemap.includes(SITE+'examples/'));
  assert(sitemap.includes(SITE+'ko/examples/'));
});

test('original third-party educational article links to real examples and local feedback privacy is truthful',()=>{
  const article='https://dev.to/livasticvm2primary/why-a-2-apy-upgrade-can-lose-money-defi-vault-switching-costs-3h42';
  for(const html of [en,ko]){
    assert(html.includes('href="'+article+'" target="_blank" rel="noopener noreferrer"'));
    assert(html.includes('href="/defi-yield-switch/feedback/"') || html.includes('href="/defi-yield-switch/ko/feedback/"'));
    assert(!html.includes('Feedback is opt-in via your own email app; this page collects none.'));
  }
});

test('actual no-wallet small DeFi position example exposes gas unit economics in EN/KO UI',()=>{
  const app=read('assets/app.mjs');
  for(const [html,needle] of [[en,'Small $20 fee trap'],[ko,'소액 $20 가스비 함정']]){
    assert(html.includes('id="example-small"'));
    assert(html.includes(needle));
    assert(html.includes('실시간')||html.includes('not a live APY'));
  }
  assert(app.includes("$('example-small').addEventListener('click'"));
  assert(app.includes('principal:20.04'));
  assert(app.includes('gasUsd:0.50'));
  assert(app.includes('targetBaseApy:7.3'));
  assert(!/eth_sendTransaction|window\.ethereum|fetch\(/.test(app));
});
