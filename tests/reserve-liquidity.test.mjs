import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DEFAULTS,CalculatorError,validateInputs,evaluate
} from '../assets/calculator.mjs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('existing default simple-APY result is not changed by opt-in cash reserve feature',()=>{
  const v=evaluate(DEFAULTS);
  assert.equal(v.reserveRequired,false);
  assert.equal(v.reserveLiquidityVerdict,'NOT_REQUESTED');
  assert.equal(v.breakEvenDays,49);
  assert.equal(v.horizon.netAdvantageUsd,22.575342);
  assert(!v.riskFlags.includes('RESERVE_CANNOT_EXIT_ON_DEMAND_BY_ASSUMPTIONS'));
});

test('real emergency reserve 10k may show APY net positive and still FAIL instant-liquidity requirements',()=>{
  const v=evaluate({...DEFAULTS,reserveRequired:true});
  assert(v.horizon.netAdvantageUsd>0);
  assert.equal(v.reserveLiquidityVerdict,'FAILS_USER_INSTANT_ACCESS_ASSUMPTIONS');
  assert(v.riskFlags.includes('RESERVE_CANNOT_EXIT_ON_DEMAND_BY_ASSUMPTIONS'));
  assert(v.riskFlags.includes('RESERVE_STRESS_REDEMPTION_UNVERIFIED'));
});

test('zero modeled delay/lock does NOT certify emergency cash accessible on demand',()=>{
  const v=evaluate({...DEFAULTS,reserveRequired:true,delayDays:0,lockDays:0});
  assert.equal(v.reserveLiquidityVerdict,'UNKNOWN_REAL_REDEMPTION');
  assert(v.riskFlags.includes('RESERVE_STRESS_REDEMPTION_UNVERIFIED'));
  assert(!v.riskFlags.includes('RESERVE_CANNOT_EXIT_ON_DEMAND_BY_ASSUMPTIONS'));
});

test('post-transfer 20d lock plus 10d bridge/cooldown means earliest assumed exit is day30',()=>{
  const v=evaluate({...DEFAULTS,reserveRequired:true,delayDays:10,lockDays:20,horizonDays:25});
  assert.equal(v.horizon.withdrawableUnderAssumedLock,false);
  assert(v.riskFlags.includes('CANNOT_EXIT_BY_HORIZON'));
  const day30=evaluate({...DEFAULTS,reserveRequired:true,delayDays:10,lockDays:20,horizonDays:30});
  assert.equal(day30.horizon.withdrawableUnderAssumedLock,true);
  assert(!day30.riskFlags.includes('CANNOT_EXIT_BY_HORIZON'));
});

test('a locked reserve with no transport delay is not instantly withdrawable',()=>{
  const v=evaluate({...DEFAULTS,reserveRequired:true,delayDays:0,lockDays:1,horizonDays:365});
  assert.equal(v.reserveLiquidityVerdict,'FAILS_USER_INSTANT_ACCESS_ASSUMPTIONS');
  assert(!v.riskFlags.includes('CANNOT_EXIT_BY_HORIZON'));
});

test('reserveRequired is a true boolean, never string or number guessed from input',()=>{
  assert.equal(validateInputs({...DEFAULTS,reserveRequired:undefined}).reserveRequired,false);
  assert.equal(validateInputs({...DEFAULTS,reserveRequired:true}).reserveRequired,true);
  for(const inval of ['true','false',1,0,null])
    assert.throws(()=>evaluate({...DEFAULTS,reserveRequired:inval}),
      e=>e instanceof CalculatorError&&e.code==='INVALID_RESERVE_REQUIREMENT');
});

test('English and Korean sites have a real opt-in cash-reserve toggle and warning',()=>{
  for(const p of ['index.html','ko/index.html']){
    const s=read(p);
    assert(s.includes('id="reserve-required"'));
    assert(s.includes('type="checkbox" id="reserve-required"'));
    assert(s.includes('id="reserve-warning" class="reserve-warning" role="status"'));
    assert(s.includes('aria-live="polite" hidden'));
  }
  const app=read('assets/app.mjs');
  assert(app.includes("x.reserveRequired=$('reserve-required').checked"));
  assert(app.includes("$('reserve-required').addEventListener('change',recalc)"));
  assert(app.includes("result.reserveLiquidityVerdict==='FAILS_USER_INSTANT_ACCESS_ASSUMPTIONS'"));
});

test('cash reserve warning never connects wallet, stores actual positions or sends client financial data',()=>{
  const core=read('assets/calculator.mjs'),ui=read('assets/app.mjs');
  for(const source of [core,ui]){
    assert(!/\bfetch\(|XMLHttpRequest|sendBeacon|window\.ethereum|eth_sendTransaction|eth_signTypedData|localStorage|sessionStorage/.test(source));
  }
  for(const html of [read('index.html'),read('ko/index.html')]){
    assert(html.includes("connect-src 'none'"));
    assert(html.includes("form-action 'none'"));
    assert(!html.includes('formsubmit.co'));
  }
});
