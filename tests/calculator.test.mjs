import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DEFAULTS,INPUT_FIELDS,CalculatorError,validateInputs,
  evaluateHorizon,evaluate
} from '../assets/calculator.mjs';

test('default inputs are complete finite hypothetical numbers',()=>{
  assert.equal(INPUT_FIELDS.length,15);
  assert.deepEqual(validateInputs(DEFAULTS),DEFAULTS);
});
test('zero fees and 5 point positive APY spread pay back immediately',()=>{
  const x={...DEFAULTS,principal:1000,currentBaseApy:5,targetBaseApy:10,
    currentRewardApy:0,targetRewardApy:0,
    gasUsd:0,bridgeUsd:0,swapUsd:0,exitUsd:0,futureExitUsd:0,
    slippageBps:0,delayDays:0,lockDays:0};
  const y=evaluate(x);
  assert.equal(y.breakEvenDays,0);
  assert.equal(y.totalEstimatedCostsUsd,0);
  assert(y.horizon.netAdvantageUsd>0);
});
test('10 USD switching cost, 1000 principal, +5 percent simple annual APY => day 73',()=>{
  const x={...DEFAULTS,principal:1000,currentBaseApy:5,targetBaseApy:10,
    currentRewardApy:0,targetRewardApy:0,
    gasUsd:10,bridgeUsd:0,swapUsd:0,exitUsd:0,futureExitUsd:0,
    slippageBps:0,delayDays:0};
  const y=evaluate(x);
  assert.equal(y.breakEvenDays,73);
  assert.equal(y.totalEstimatedCostsUsd,10);
  assert.equal(y.snapshots[0].days,30);
  assert(y.snapshots[0].netAdvantageUsd<0);
  assert(y.snapshots[1].netAdvantageUsd>0);
});
test('delay forfeits new yield; break-even moves later',()=>{
  const x={...DEFAULTS,principal:1000,currentBaseApy:5,targetBaseApy:10,
    currentRewardApy:0,targetRewardApy:0,
    gasUsd:10,bridgeUsd:0,swapUsd:0,exitUsd:0,futureExitUsd:0,
    slippageBps:0,delayDays:10};
  assert.equal(evaluate(x).breakEvenDays,93);
  assert.equal(evaluate({...x,horizonDays:7}).horizon.targetYieldUsd,0);
});
test('slippage in bps is charged USD not confused with percent',()=>{
  const x={...DEFAULTS,principal:10000,slippageBps:15,
    gasUsd:0,bridgeUsd:0,swapUsd:0,exitUsd:0,futureExitUsd:0};
  const r=evaluate(x);
  assert.equal(r.fees.slippageUsd,15);
  assert.equal(r.totalEstimatedCostsUsd,15);
});
test('flat or worse target APY with nonzero costs has no break-even day',()=>{
  const x={...DEFAULTS,currentBaseApy:5,targetBaseApy:4,
    currentRewardApy:0,targetRewardApy:0};
  const r=evaluate(x);
  assert.equal(r.breakEvenDays,null);
  assert(r.riskFlags.includes('NO_POSITIVE_APY_SPREAD'));
});
test('haircut halves candidate emissions and conservative loss scenario removes all incentives',()=>{
  const x={...DEFAULTS,principal:10000,currentBaseApy:3,currentRewardApy:0,
    targetBaseApy:3,targetRewardApy:8,rewardRealizationPct:50,
    gasUsd:0,bridgeUsd:0,swapUsd:0,exitUsd:0,futureExitUsd:0,
    slippageBps:0,delayDays:0};
  const r=evaluate(x);
  assert.equal(r.destinationModeledApyPct,7);
  assert.equal(r.spreadPct,4);
  assert.equal(r.conservativeRewardDrop.netAdvantageUsd,0);
  assert(r.riskFlags.includes('NEW_APY_DEPENDS_ON_REWARD_TOKEN'));
});
test('lockups are clearly marked as not withdrawable at selected horizon',()=>{
  const x={...DEFAULTS,lockDays:120,horizonDays:30};
  const r=evaluate(x);
  assert(!r.horizon.withdrawableUnderAssumedLock);
  assert(r.riskFlags.includes('CANNOT_EXIT_BY_HORIZON'));
  assert(r.snapshots.find(s=>s.days===180).withdrawableUnderAssumedLock);
});
test('large bridge fee flags inability to infer risk from cost only',()=>{
  const x={...DEFAULTS,bridgeUsd:125,slippageBps:75};
  const r=evaluate(x);
  assert(r.riskFlags.includes('BRIDGE_RISK_NOT_MODELED'));
  assert(r.riskFlags.includes('PRICE_IMPACT_SENSITIVE'));
  assert(r.totalEstimatedCostsUsd>140);
  assert(r.disclaimer.includes('no live APY'));
});
test('report never requires address, login, wallet, seed or browser storage',()=>{
  const r=evaluate(DEFAULTS);
  const encoded=JSON.stringify(r);
  assert(!encoded.includes('0x'));
  assert(!encoded.includes('walletAddress'));
  assert(!encoded.includes('privateKey'));
});
test('missing, invalid, infinite, NaN, negative or extraordinary input refused',()=>{
  for(const corrupt of [
    {...DEFAULTS,principal:0},
    {...DEFAULTS,principal:Infinity},
    {...DEFAULTS,principal:'not a number'},
    {...DEFAULTS,targetBaseApy:-1},
    {...DEFAULTS,targetBaseApy:250},
    {...DEFAULTS,slippageBps:10001},
    {...DEFAULTS,horizonDays:0},
    {...DEFAULTS,horizonDays:4000},
    {...DEFAULTS,bridgeUsd:-0.01},
    {...DEFAULTS,rewardRealizationPct:101},
    {...DEFAULTS,gasUsd:undefined},
    {...DEFAULTS,lockDays:false}
  ]) assert.throws(()=>evaluate(corrupt),CalculatorError);
});
test('end horizon exact numeric consistency for simple interest',()=>{
  const x={...DEFAULTS,principal:36500,currentBaseApy:0,targetBaseApy:10,
    currentRewardApy:0,targetRewardApy:0,gasUsd:0,bridgeUsd:0,swapUsd:0,
    exitUsd:0,futureExitUsd:0,slippageBps:0,delayDays:0,horizonDays:365};
  const r=evaluate(x);
  assert.equal(r.horizon.targetYieldUsd,3650);
  assert.equal(r.horizon.currentYieldUsd,0);
  assert.equal(r.horizon.netAdvantageUsd,3650);
  assert.equal(r.breakEvenDays,0);
});

test('real published 2026 small-account unit mistake: 2.53 percentage-point spread is 4 cents, not 42 cents',()=>{
  // Fictional arithmetic based on a publicly reported July 2026 $20 stablecoin
  // scenario; not live rates, a wallet position, advice, or independent buyer.
  const x={...DEFAULTS,principal:20.04,
    currentBaseApy:4.77,currentRewardApy:0,
    targetBaseApy:7.3,targetRewardApy:0,rewardRealizationPct:0,
    gasUsd:0.50,bridgeUsd:0,swapUsd:0,exitUsd:0,futureExitUsd:0,
    slippageBps:0,delayDays:0,lockDays:0,horizonDays:30,reserveRequired:false};
  const r=evaluate(x);
  assert.equal(r.spreadPct,2.53);
  assert.equal(r.horizon.extraYieldBeforeCostsUsd,0.041672);
  assert.equal(r.horizon.netAdvantageUsd,-0.458328);
  assert.equal(r.breakEvenDays,360);
  assert.equal(r.snapshots.find(row=>row.days===90).extraYieldBeforeCostsUsd,0.125017);
  // For a stricter gas <10%-of-incremental-yield rule, simple math needs
  // roughly ten times the first (100%-of-extra-yield) break-even horizon.
  const extraPerDay=x.principal*(7.3-4.77)/36500;
  assert(Math.ceil(0.5/(0.1*extraPerDay))>=3599);
  assert(Math.ceil(0.5/(0.1*extraPerDay))<=3601);
});
