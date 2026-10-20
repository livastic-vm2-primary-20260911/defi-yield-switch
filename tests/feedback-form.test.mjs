import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const langs=[
  {home:'index.html',example:'examples/index.html',form:'feedback/index.html',thanks:'feedback/thanks/index.html',path:'/defi-yield-switch/feedback/'},
  {home:'ko/index.html',example:'ko/examples/index.html',form:'ko/feedback/index.html',thanks:'ko/feedback/thanks/index.html',path:'/defi-yield-switch/ko/feedback/'}
];

test('both language variants show exactly one original optional no-signin feedback CTA',()=>{
  for(const x of langs){
    const home=read(x.home),example=read(x.example);
    assert(home.includes('href="'+x.path+'"'));
    assert(example.includes('href="'+x.path+'"'));
    assert(home.includes('15 USDC'));
  }
});
test('only user-submitted native POST permits third-party feedback transfer',()=>{
  for(const x of langs){
    const s=read(x.form);
    assert(s.includes('action="https://formsubmit.co/onecursor1@gmail.com"'));
    assert(s.includes('method="POST"'));
    assert(s.includes('form-action https://formsubmit.co;'));
    assert(s.includes("connect-src 'none'"));
    assert(s.includes('id="external-delivery-consent" type="checkbox" name="external_provider_consent" value="yes" required'));
    assert(s.includes('type="submit"'));
    assert(!/script[^>]*src=/.test(s));
    assert(!/onload=|onchange=|onclick=|javascript:|autoSubmit|setTimeout/.test(s));
  }
});
test('no new email, wallet, private balance, transaction hash or actual CSV field is requested',()=>{
  for(const x of langs){
    const s=read(x.form);
    assert(s.includes('name="biggest_obstacle" required'));
    assert(s.includes('<option value="token_allowance_gas_revoke">'));
    assert(s.includes('name="frequency" required'));
    assert(s.includes('name="nonbinding_willingness_to_pay_usdc" required'));
    assert(s.includes('name="synthetic_technical_example" maxlength="260"'));
    assert(!/name="(email|wallet|private_key|seed_phrase|txhash|actual_balance|csv_data|card_number|amount|password)"/i.test(s));
    assert(!/<input[^>]+type="file"/.test(s));
    assert(!/name="_captcha"\s+value="false"/.test(s));
  }
});
test('feedback users can explicitly say 0 USDC; no claim that a form response is an order',()=>{
  for(const x of langs){
    const s=read(x.form);
    for(const num of ['0','5','15','50'])assert(s.includes('<option value="'+num+'">'));
    assert(s.includes('https://github.com/livastic-vm2-primary-20260911/defi-yield-switch/issues/new?template=feedback.yml'));
    assert(s.includes('mailto:onecursor1@gmail.com?subject='));
    assert(!/verified [1-9]+ paid (users|customers)|automatic paid order/i.test(s));
  }
});
test('native browser select fields disallow empty choice; consent is not prechecked',()=>{
  for(const x of langs){
    const s=read(x.form);
    assert.equal((s.match(/<select id="/g)||[]).length,3);
    assert.equal((s.match(/<option value="" selected disabled>/g)||[]).length,3);
    assert(!/name="external_provider_consent"[^>]*checked/.test(s));
    assert(s.includes('type="text" name="_honey"') && s.includes('tabindex="-1"'));
  }
});
test('provider redirects are not indexed and are NEVER treated as proof of delivery',()=>{
  for(const x of langs){
    const s=read(x.form),thank=read(x.thanks);
    assert(s.includes('value="https://livastic-vm2-primary-20260911.github.io'+x.path+'thanks/"'));
    assert(thank.includes('<meta name="robots" content="noindex,nofollow">'));
    assert(thank.includes('FormSubmit'));
    assert(thank.includes('noindex') && !thank.includes('connection confirmed'));
    assert(thank.includes('mailto:onecursor1@gmail.com'));
  }
});
test('site map references only useful content and excludes potentially misleading thanks redirects',()=>{
  const x=read('sitemap.xml');
  assert.equal((x.match(/<loc>/g)||[]).length,10);
  assert(x.includes('https://livastic-vm2-primary-20260911.github.io/defi-yield-switch/feedback/'));
  assert(x.includes('https://livastic-vm2-primary-20260911.github.io/defi-yield-switch/ko/feedback/'));
  assert(!x.includes('/feedback/thanks/'));
});
test('original financial arithmetic remains purely local, never sends form input without submit',()=>{
  for(const x of langs){
    const home=read(x.home);
    assert(home.includes('form-action \'none\''));
    assert(home.includes('connect-src \'none\''));
    assert(!home.includes('formsubmit.co'));
  }
  const app=read('assets/app.mjs');
  assert(!/fetch\(|XMLHttpRequest|sendBeacon|window\.ethereum|eth_sendTransaction/.test(app));
});
