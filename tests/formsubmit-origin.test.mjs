import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const origin='https://livastic-vm2-primary-20260911.github.io';
const forms=[
 ['quote/index.html','/defi-yield-switch/quote/'],
 ['ko/quote/index.html','/defi-yield-switch/ko/quote/'],
 ['feedback/index.html','/defi-yield-switch/feedback/'],
 ['ko/feedback/index.html','/defi-yield-switch/ko/feedback/']
];
test('all original hosted third-party forms send the public website origin, NOT no-referrer',()=>{
 for(const [file] of forms){
   const t=source(file);
   assert(t.includes('<meta name="referrer" content="strict-origin-when-cross-origin">'),file);
   assert(!t.includes('<meta name="referrer" content="no-referrer">'),file);
   assert(t.includes('form-action https://formsubmit.co;'));
   assert(t.includes("connect-src 'none'"));
 }
});
test('FormSubmit public path hint is FIXED server-owned page, never user email or parameters',()=>{
 for(const [file,path] of forms){
   const t=source(file),url=origin+path;
   assert(t.includes('<input type="hidden" name="_url" value="'+url+'">'),file);
   assert(t.includes('<link rel="canonical" href="'+url+'">'),file);
   assert(!t.includes('<input type="hidden" name="_url" value="mailto:'));
   assert(!t.includes('?_url='));
 }
});
test('the form remains an actual native POST and the submitter must opt in',()=>{
 for(const [file] of forms){
   const t=source(file);
   assert(t.includes('action="https://formsubmit.co/onecursor1@gmail.com" method="POST"'));
   assert(t.includes('type="submit"'));
   assert(/type="checkbox"[^>]*required/.test(t));
   assert(!/type="checkbox"[^>]*checked/.test(t));
   assert(!t.includes('name="_captcha" value="false"'));
   assert(!t.includes('window.ethereum'));
 }
});
test('free, private calculator never changes its CSP or sends user portfolio elsewhere',()=>{
 for(const file of ['index.html','ko/index.html']){
   const s=source(file);
   assert(s.includes("connect-src 'none'; form-action 'none'"));
   assert(!s.includes('formsubmit.co'));
 }
 const app=source('assets/app.mjs');
 assert(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/.test(app));
});
test('redirect/thanks pages keep noindex; the static success page cannot verify delivery',()=>{
 for(const file of ['quote/thanks/index.html','ko/quote/thanks/index.html',
                     'feedback/thanks/index.html','ko/feedback/thanks/index.html']){
  const s=source(file);
  assert(s.includes('name="robots" content="noindex,nofollow"'));
  assert(!s.includes('name="_url"'));
  assert(!s.includes('type="submit"'));
 }
});
test('readme explicitly distinguishes an owner synthetic error from real user feedback',()=>{
 const s=source('README.md');
 assert(s.includes('no-referrer'));
 assert(s.includes('"Unable to submit form"'));
 assert(s.includes('two synthetic owner-only native form attempts'));
 assert(s.includes('neither test is a real customer inquiry'));
});

test('a failed third-party human verification has a real alternative; no false success claims',()=>{
 const checks=[
  ['quote/index.html','If it fails, use the email link below'],
  ['ko/quote/index.html','인증이 실패하면 아래 이메일 링크를 이용'],
  ['feedback/index.html','If delivery fails, do not assume'],
  ['ko/feedback/index.html','인증에 실패하면 피드백이 도착한 것으로 간주하지']
 ];
 for(const [p,expected] of checks){
  const html=source(p);
  assert(html.includes(expected));
  assert(html.includes('mailto:onecursor1@gmail.com?subject='));
  assert(!html.includes('name="_captcha" value="false"'));
 }
 const doc=source('README.md');
 assert(doc.includes('normal reCAPTCHA'));
 assert(doc.includes('OWNER ONLY synthetic browser submission'));
 assert(doc.includes('NOT a buyer conversion or delivery confirmation'));
});
