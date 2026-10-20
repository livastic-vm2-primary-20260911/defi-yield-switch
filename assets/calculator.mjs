/**
 * Yield Switch Break-Even: transparent arithmetic on USER-ENTERED hypothetical
 * parameters. No market data feed, investment recommendations, wallet or RPC.
 * A flat simple-APY approximation, not APR compounding, oracle truth, advice,
 * forecast, risk assessment, or evidence the user can exit/receive rewards.
 */
export const INPUT_FIELDS=Object.freeze([
  'principal','currentBaseApy','currentRewardApy','targetBaseApy',
  'targetRewardApy','rewardRealizationPct','gasUsd','bridgeUsd','swapUsd',
  'exitUsd','futureExitUsd','slippageBps','delayDays','lockDays','horizonDays'
]);
export const DEFAULTS=Object.freeze({
  principal:10000,currentBaseApy:3,currentRewardApy:0,
  targetBaseApy:4.5,targetRewardApy:1,rewardRealizationPct:50,
  gasUsd:2,bridgeUsd:0,swapUsd:4,exitUsd:1,
  futureExitUsd:2,slippageBps:15,delayDays:2,lockDays:0,horizonDays:90,reserveRequired:false
});
const LIMITS=Object.freeze({
  principal:[0.01,1000000000],
  currentBaseApy:[0,200],currentRewardApy:[0,200],
  targetBaseApy:[0,200],targetRewardApy:[0,200],
  rewardRealizationPct:[0,100],gasUsd:[0,100000000],bridgeUsd:[0,100000000],
  swapUsd:[0,100000000],exitUsd:[0,100000000],futureExitUsd:[0,100000000],
  slippageBps:[0,10000],delayDays:[0,3650],lockDays:[0,3650],horizonDays:[1,3650]
});
export class CalculatorError extends Error {
  constructor(code,field){super(code);this.code=code;this.field=field;}
}
const money=n=>Number(n.toFixed(6));
export function validateInputs(input){
  if(!input || typeof input!=='object' || Array.isArray(input))
    throw new CalculatorError('INVALID_INPUT','');
  const result={};
  for(const field of INPUT_FIELDS){
    const value=input[field],n=Number(value);
    if(value===undefined || value===null || value==='' || typeof value==='boolean' ||
       !Number.isFinite(n)||n<LIMITS[field][0]||n>LIMITS[field][1])
      throw new CalculatorError('OUT_OF_RANGE',field);
    result[field]=n;
  }
  if(input.reserveRequired!==undefined && typeof input.reserveRequired!=='boolean')
    throw new CalculatorError('INVALID_RESERVE_REQUIREMENT','reserveRequired');
  result.reserveRequired=input.reserveRequired===true;
  return result;
}
export function evaluateHorizon(x,days,totalFees,currentApy,targetApy) {
  const currentYield=x.principal*currentApy*days/36500;
  const earningDays=Math.max(0,days-x.delayDays);
  const destinationYield=x.principal*targetApy*earningDays/36500;
  return {
    days,
    currentYieldUsd:money(currentYield),
    targetYieldUsd:money(destinationYield),
    extraYieldBeforeCostsUsd:money(destinationYield-currentYield),
    netAdvantageUsd:money(destinationYield-currentYield-totalFees),
    withdrawableUnderAssumedLock:days>=x.delayDays+x.lockDays
  };
}
export function evaluate(input){
  const x=validateInputs(input),principal=x.principal;
  const rewardsMultiplier=x.rewardRealizationPct/100;
  const currentApy=x.currentBaseApy+x.currentRewardApy*rewardsMultiplier;
  const targetApy=x.targetBaseApy+x.targetRewardApy*rewardsMultiplier;
  const priceImpact=principal*x.slippageBps/10000;
  const fees={
    gasUsd:money(x.gasUsd),
    bridgeUsd:money(x.bridgeUsd),
    swapUsd:money(x.swapUsd),
    oldPositionExitUsd:money(x.exitUsd),
    eventualNewPositionExitUsd:money(x.futureExitUsd),
    slippageUsd:money(priceImpact)
  };
  const totalFees=Object.values(fees).reduce((sum,v)=>sum+v,0);
  const deltaApy=targetApy-currentApy;
  const breakEven=deltaApy>0
    ? Math.max(x.delayDays,Math.ceil(
        (totalFees*36500/principal + targetApy*x.delayDays)/deltaApy))
    : null;
  const snapshots=[30,90,180,365].map(days=>evaluateHorizon(x,days,totalFees,currentApy,targetApy));
  const selected=evaluateHorizon(x,x.horizonDays,totalFees,currentApy,targetApy);
  const currentConservativeApy=x.currentBaseApy+x.currentRewardApy; // assume current rewards continue fully
  const targetConservativeApy=x.targetBaseApy; // assume target reward token pays ZERO
  const conservative=evaluateHorizon(
    x,x.horizonDays,totalFees,currentConservativeApy,targetConservativeApy);
  const flags=[];
  if(deltaApy<=0) flags.push('NO_POSITIVE_APY_SPREAD');
  if(x.targetRewardApy>0)flags.push('NEW_APY_DEPENDS_ON_REWARD_TOKEN');
  if(x.rewardRealizationPct<100 && (x.targetRewardApy>0||x.currentRewardApy>0))
    flags.push('INCENTIVES_HAIRCUT_ESTIMATED');
  if(x.bridgeUsd>0)flags.push('BRIDGE_RISK_NOT_MODELED');
  if(x.lockDays>0)flags.push('LOCK_AND_WITHDRAWAL_EXIT_CONDITIONS');
  if(x.lockDays+x.delayDays>x.horizonDays)flags.push('CANNOT_EXIT_BY_HORIZON');
  if(x.reserveRequired){
    if(x.lockDays>0 || x.delayDays>0)flags.push('RESERVE_CANNOT_EXIT_ON_DEMAND_BY_ASSUMPTIONS');
    flags.push('RESERVE_STRESS_REDEMPTION_UNVERIFIED');
  }
  if(x.delayDays>=x.horizonDays)flags.push('NO_TARGET_EARNING_DAYS');
  if(x.slippageBps>=25)flags.push('PRICE_IMPACT_SENSITIVE');
  if(totalFees>=principal)flags.push('COSTS_EXCEED_PRINCIPAL');
  if(targetApy>15)flags.push('HIGH_REPORTED_APY_VERIFY_SOURCE');
  if(breakEven!==null && breakEven>365)flags.push('BREAK_EVEN_BEYOND_ONE_YEAR');
  flags.push('SMART_CONTRACT_ORACLE_LIQUIDATION_AND_PEG_RISKS_UNSCORED');
  flags.push('APY_VARIABLE_AND_TAX_RULES_UNMODELED');
  return {
    schema:'yield-switch-v1',
    disclaimer:'User-entered constant simple annualized yields; no live APY, onchain access, audited vault ranking, investment/tax advice or guaranteed withdrawal.',
    currency:'USD (user-estimated fee equivalent)',
    principalUsd:money(principal),
    currentModeledApyPct:money(currentApy),
    destinationModeledApyPct:money(targetApy),
    spreadPct:money(deltaApy),
    fees,
    totalEstimatedCostsUsd:money(totalFees),
    inputHorizonDays:x.horizonDays,
    cooldownDays:x.delayDays,assumedLockDays:x.lockDays,
    reserveRequired:x.reserveRequired,
    reserveLiquidityVerdict:!x.reserveRequired?'NOT_REQUESTED':
      x.delayDays>0 || x.lockDays>0?'FAILS_USER_INSTANT_ACCESS_ASSUMPTIONS':'UNKNOWN_REAL_REDEMPTION',
    breakEvenDays:breakEven,
    horizon:selected,
    conservativeRewardDrop:conservative,
    snapshots,
    riskFlags:flags
  };
}
