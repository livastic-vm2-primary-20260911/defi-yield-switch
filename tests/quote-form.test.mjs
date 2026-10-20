import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const base='https://livastic-vm2-primary-20260911.github.io/defi-yield-switch/';
const variants=[
  {lang:'en',prefix:'',form:'quote/index.html',thanks:'quote/thanks/index.html'},
  {lang:'ko',prefix:'ko/',form:'ko/quote/index.html',thanks:'ko/quote/thanks/index.html'}
];

test('two localized forms have true own-site canonical URLs and only user-requested scope',()=>{
 for(const v of variants){
  const html=read(v.form);
  assert(html.includes('<html lang="'+v.lang+'">'));
  assert(html.includes('<link rel="canonical" href="'+base+v.prefix+'quote/">'));
  assert(html.includes('15 USDC')||html.includes('USDC 15'));
  assert(html.includes('DeFi Switch Lab'));
 }
});
test('forms POST only after explicit native browser submission to the activated original email',()=>{
 for(const v of variants){
  const html=read(v.form);
  assert(html.includes('action="https://formsubmit.co/onecursor1@gmail.com" method="POST"'));
  assert(html.includes("form-action https://formsubmit.co;"));
  assert(html.includes("connect-src 'none'"));
  assert(html.includes('type="submit"'));
  assert(!/<script\b[^>]+src=/.test(html));
  assert(!/\bfetch\(|onload=|onclick=|onsubmit=|setInterval\(/.test(html));
 }
});
test('buyer contact email deliberately required for scope reply, with no onchain wallet intake',()=>{
 for(const v of variants){
  const s=read(v.form);
  assert(s.includes('type="email" name="email" maxlength="254"'));
  assert(s.includes('type="url" name="source_protocol_docs_url"'));
  assert(s.includes('type="url" name="candidate_protocol_docs_url"'));
  assert(s.includes('name="hypothetical_public_scope_question" minlength="20" maxlength="450"'));
  assert(!/name="(seed|mnemonic|password|wallet|walletAddress|privateKey|private_key|txhash|actualBalance|actual_balance|portfolio|card_number)"/i.test(s));
  assert(!/<input[^>]+type="file"/i.test(s));
 }
});
test('no automatic signing or payment occurs when requesting a quote',()=>{
 for(const v of variants){
  const s=read(v.form);
  assert(!/eth_sendTransaction|eth_signTypedData|window\.ethereum|payment-signature|0x833589fCD6/i.test(s));
  assert(!/href="ethereum:|action="https:\/\/.*onrender\.com/i.test(s));
  assert(s.includes('name="_subject" value="DeFi Yield Switch — 15 USDC technical evidence scope REQUEST (not order)"'));
  assert(s.includes('name="_next"'));
 }
});
test('no new identity or KYC requirement, explicit external transfer consent is unchecked',()=>{
 for(const v of variants){
  const s=read(v.form);
  assert(s.includes('name="external_formsubmit_and_scope_consent" value="yes" required'));
  assert(s.includes('id="scope-consent" type="checkbox"'));
  assert(!/id="scope-consent"[^>]*\bchecked\b/.test(s));
  assert(!/name="_captcha"[^>]*value="false"/.test(s));
  assert(s.includes('name="_honey"'));
  assert(s.includes('tabindex="-1"'));
 }
});
test('inquiry accepts zero budget as honest WTP research, no sale inferred',()=>{
 for(const v of variants){
  const s=read(v.form);
  assert(s.includes('name="nonbinding_budget_preference_usdc"'));
  assert(s.includes('<option value="0">'));
  assert(s.includes('<option value="15">'));
  assert(s.includes('name="evidence_question_category" required'));
  assert(s.includes('<option value="approval-revoke-gas">'));
  assert(!s.includes('wallet connection required'));

  assert((s.match(/<option value="" selected disabled>/g)||[]).length===2);
 }
});
test('no investment choice is offered as a report, firstparty terms are required separately',()=>{
 for(const v of variants){
  const s=read(v.form);
  assert(s.includes('AI')||s.includes('AI 보조'));
  assert(s.includes('scope')||s.includes('범위'));
  assert(s.includes('refund')||s.includes('환불'));
  assert(s.includes('mailto:onecursor1@gmail.com?subject=DeFi%20Yield%20Switch%20scoped%20fee%20review%20inquiry'));
  assert(s.includes('no payment')||s.includes('결제'));
 }
});
test('redirect page is explicitly NOT a contract or delivery confirmation, is noindex',()=>{
 for(const v of variants){
  const s=read(v.thanks);
  assert(s.includes('<meta name="robots" content="noindex,nofollow">'));
  assert(s.includes('<link rel="canonical" href="'+base+v.prefix+'quote/thanks/">'));
  assert(!s.includes('payment received'));
  assert(s.includes('FormSubmit'));
 }
});
test('buyer CTA links to the new real no-wallet scope form, not a failing mailto-only funnel',()=>{
 for(const v of variants){
  const route='/defi-yield-switch/'+v.prefix+'quote/';
  for(const page of [v.prefix+'index.html',v.prefix+'examples/index.html']){
    const s=read(page);
    assert(s.includes('href="'+route+'"'),page);
  }
  const feedback=read(v.prefix+'feedback/index.html');
  assert(feedback.includes('href="'+route+'"'));
 }
});
test('sitemap lists 8 actual indexable routes, excludes quote and feedback confirmation pages',()=>{
 const s=read('sitemap.xml');
 assert.equal((s.match(/<loc>/g)||[]).length,10);
 assert(s.includes(base+'quote/'));
 assert(s.includes(base+'ko/quote/'));
 assert(!s.includes('/quote/thanks/'));
 assert(!s.includes('/feedback/thanks/'));
});
test('the free original calculator is still completely local and does not submit the scope form',()=>{
 for(const v of variants){
  const s=read(v.prefix+'index.html');
  assert(s.includes("connect-src 'none'"));
  assert(s.includes("form-action 'none'"));
  assert(!s.includes('formsubmit.co'));
  assert(!/window\.ethereum|eth_sendTransaction|eth_signTypedData/.test(s));
 }
 const source=read('assets/app.mjs');
 assert(!/\bfetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/.test(source));
});
test('static source describes third-party contact data and strictly conditional Base USDC payment',()=>{
 const README=read('README.md');
 const llm=read('llms.txt');
 assert(README.includes('Direct paid-scope request conversion'));
 assert(README.includes('FormSubmit'));
 assert(README.includes('before** collecting money'));
 assert(llm.includes('/quote/'));
});
