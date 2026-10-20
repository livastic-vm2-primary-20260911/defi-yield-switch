import {DEFAULTS,INPUT_FIELDS,evaluate,CalculatorError} from './calculator.mjs';

const ko=document.documentElement.lang==='ko';
const $=id=>document.getElementById(id);
const labels=ko?{
  gain:'예치처 변경의 추정 순증가액',
  lose:'예치처 변경의 추정 순손실',
  flat:'예치처 변경의 추정 순변화',
  break:'추정 비용 회수 시점',
  none:'회수 불가',
  days:'일',
  amount:'예상 총 전환 비용',
  rate0:'현재 유효 APY',
  rate1:'후보 유효 APY',
  stress:'보상 토큰이 0이 되는 보수적 경우',
  cooldown:'수익 미발생 대기일',
  lockOk:'입력된 출금 제한 내에서 선택 기간에 인출 가능한 것으로 가정',
  lockNo:'주의: 선택 기간 종료 시점에 인출 가능한지 확인되지 않았습니다.',
  graph:'기간별 현재 유지 대비 순차액',
  good:'양수는 단순 가정에서 후보 예치의 추가 수익을 뜻합니다.',
  bad:'음수는 단순 가정에서 비용 또는 낮은 수익률이 더 크다는 뜻입니다.',
  invalid:'숫자가 범위를 벗어났습니다. 해당 입력을 수정하세요.',
  clean:'시나리오를 수정하면 해당 가정으로 즉시 다시 계산할 수 있습니다.',
  download:'개인정보·지갑 주소 없는 숫자 시나리오 JSON을 로컬에 저장했습니다.',
  copied:'공개 팁 수령 주소를 복사했습니다. 결제나 서명은 발생하지 않았습니다.',
  copyFail:'이 브라우저에서는 복사할 수 없습니다. 주소를 직접 확인하세요.',
  required:'필수 숫자를 입력하세요.',
  reserveFail:'비상예비금 부적합: 입력한 이동 지연 또는 출금 잠금 때문에 즉시 인출할 수 있다고 볼 수 없습니다. 계산된 수익이 양수라도 현금처럼 취급하지 마세요.',
  reserveUnknown:'출금 가능성 미확인: 입력 지연·잠금이 0일지라도 대량 인출·사용률 급증·예치 중지·디페깅 상황에서 원금을 즉시 회수할 수 있는지는 계산기로 증명할 수 없습니다.',
  flags:{
    NO_POSITIVE_APY_SPREAD:'후보 APY가 현재 APY보다 높지 않아 수익 차이만으로는 비용을 회수할 수 없습니다.',
    RESERVE_CANNOT_EXIT_ON_DEMAND_BY_ASSUMPTIONS:'비상예비금 조건과 입력한 이동 지연·출금 잠금이 충돌합니다. 실제 수익률보다 필요한 당일 인출 조건을 우선 확인하세요.',
    RESERVE_STRESS_REDEMPTION_UNVERIFIED:'정상일 즉시 출금 약속은 시장 스트레스 시 출금 가능성을 보장하지 않습니다.',
    NEW_APY_DEPENDS_ON_REWARD_TOKEN:'후보 수익 일부는 보상 토큰/인센티브에 의존합니다. 지급 중단·가격 하락을 확인하세요.',
    INCENTIVES_HAIRCUT_ESTIMATED:'인센티브 실현율은 사용자가 가정한 값이지 실제 지급 보증이 아닙니다.',
    BRIDGE_RISK_NOT_MODELED:'브리지 비용 외에 최종성·메시지 실패·컨트랙트 위험은 계산하지 않습니다.',
    LOCK_AND_WITHDRAWAL_EXIT_CONDITIONS:'출금 잠금·대기열·쿨다운·중도 출금 제약을 원문에서 확인하세요.',
    CANNOT_EXIT_BY_HORIZON:'선택 기간 종료 전에 잠금이 풀리지 않는다고 가정합니다. 표시된 수익을 실현 가능한 현금으로 보지 마세요.',
    NO_TARGET_EARNING_DAYS:'선택 기간이 이동 지연 기간 이내여서 후보 예치 수익을 계산할 날이 없습니다.',
    PRICE_IMPACT_SENSITIVE:'가정한 슬리피지가 높습니다. 실제 거래 호가·유동성에 따라 달라집니다.',
    COSTS_EXCEED_PRINCIPAL:'추정 비용이 원금 이상입니다. 입력값을 확인하세요.',
    HIGH_REPORTED_APY_VERIFY_SOURCE:'후보 APY가 15%를 넘습니다. 수익의 출처와 지속 가능성을 먼저 확인하세요.',
    BREAK_EVEN_BEYOND_ONE_YEAR:'단순 가정의 손익분기점이 1년보다 깁니다.',
    SMART_CONTRACT_ORACLE_LIQUIDATION_AND_PEG_RISKS_UNSCORED:'컨트랙트·청산·담보·오라클·스테이블코인 디페깅 위험은 별도로 평가해야 합니다.',
    APY_VARIABLE_AND_TAX_RULES_UNMODELED:'APY 변화·복리·세금·가격 변동·실제 출금 가능성은 예측하지 않습니다.'
  }
}:{
  gain:'Estimated net benefit of switching',
  lose:'Estimated net cost of switching',
  flat:'Estimated net difference',
  break:'Estimated fee break-even',
  none:'Not reached',
  days:'days',
  amount:'Total estimated switching friction',
  rate0:'Current effective APY',
  rate1:'Candidate effective APY',
  stress:'Stress: target reward token pays zero',
  cooldown:'No-yield transfer delay',
  lockOk:'Assumed withdrawal conditions allow exiting by selected date',
  lockNo:'Warning: selected horizon may end before funds become withdrawable.',
  graph:'Advantage vs staying, by horizon',
  good:'Positive values indicate modeled incremental income under unchanged-APY assumptions.',
  bad:'Negative values indicate that costs or lower modeled yields outweigh the difference.',
  invalid:'An input number is out of range; revise the highlighted assumption.',
  clean:'Change the numbers to compute another hypothetical scenario.',
  download:'Numeric scenario saved locally as JSON, without wallet addresses or personal data.',
  copied:'Public tip recipient copied. No wallet signature or payment occurred.',
  copyFail:'Clipboard unavailable; inspect the public address yourself.',
  required:'Enter all required numbers.',
  reserveFail:'NOT CASH-LIKE under your own inputs: moving or locking this emergency reserve prevents modeled immediate access, even if net yield is positive. Do not treat this as spendable cash.',
  reserveUnknown:'REAL LIQUIDITY UNVERIFIED: even zero assumed delay or lock does NOT prove redemption during stress, utilization spikes, a pause, depeg or queue. Check original vault terms.',
  flags:{
    NO_POSITIVE_APY_SPREAD:'Candidate effective APY is not higher. Higher yield cannot repay these switching costs under the model.',
    RESERVE_CANNOT_EXIT_ON_DEMAND_BY_ASSUMPTIONS:'Your emergency-reserve requirement conflicts with the modeled bridge, cooldown or vault lock. Verify needed-day liquidity first.',
    RESERVE_STRESS_REDEMPTION_UNVERIFIED:'A normal-day instant withdrawal promise is not a stress-time liquidity guarantee.',
    NEW_APY_DEPENDS_ON_REWARD_TOKEN:'A share of the candidate APY is a token incentive. Check emission duration and token price exposure.',
    INCENTIVES_HAIRCUT_ESTIMATED:'The reward haircut is your assumption, not a guaranteed real-world payout.',
    BRIDGE_RISK_NOT_MODELED:'Bridge completion, contract and message risks are not priced by the fee calculator.',
    LOCK_AND_WITHDRAWAL_EXIT_CONDITIONS:'Verify vault lockup, withdrawal queue, cooldown and early-exit policies at the primary source.',
    CANNOT_EXIT_BY_HORIZON:'Selected horizon precedes assumed unlock. These numbers do not imply realizable cash.',
    NO_TARGET_EARNING_DAYS:'Your earning horizon ends before the assumed move completes.',
    PRICE_IMPACT_SENSITIVE:'Estimated price impact is material; the executable swap price and liquidity may differ.',
    COSTS_EXCEED_PRINCIPAL:'Total estimated costs equal or exceed principal; revisit inputs.',
    HIGH_REPORTED_APY_VERIFY_SOURCE:'Candidate modeled APY exceeds 15%; investigate where sustainable yield comes from.',
    BREAK_EVEN_BEYOND_ONE_YEAR:'The simple-model break-even exceeds one year.',
    SMART_CONTRACT_ORACLE_LIQUIDATION_AND_PEG_RISKS_UNSCORED:'Smart contracts, liquidation, collateral, oracles and stablecoin depegs need separate diligence.',
    APY_VARIABLE_AND_TAX_RULES_UNMODELED:'The model does not forecast variable APY, compounding, taxes, price movement or actual redemption.'
  }
};
let lastResult;
const amount=n=>new Intl.NumberFormat(ko?'ko-KR':'en-US',{
  style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2
}).format(n);
const percent=n=>new Intl.NumberFormat(ko?'ko-KR':'en-US',{maximumFractionDigits:2}).format(n)+'%';
const dollars=n=>(n>0?'+':'')+amount(n);
const editFields=INPUT_FIELDS.map(key=>({key,el:document.querySelector('[data-input="'+key+'"]')}));

function fill(values) {
  for(const {key,el} of editFields)if(el)el.value=values[key]??DEFAULTS[key];
  $('reserve-required').checked=values.reserveRequired===true;
}
function read() {
  const x={};
  for(const {key,el} of editFields)x[key]=el.value;
  x.reserveRequired=$('reserve-required').checked;
  return x;
}
function fillText(id,str){$(id).textContent=str;}
function item(tag,textValue,clazz){
  const n=document.createElement(tag);
  if(clazz)n.className=clazz;
  n.textContent=textValue;
  return n;
}
function displayCharts(report){
  const box=$('chart');
  box.replaceChildren();
  const max=Math.max(1,...report.snapshots.map(x=>Math.abs(x.netAdvantageUsd)));
  for(const snap of report.snapshots){
    const row=item('div','', 'chart-row');
    row.append(item('span',snap.days+'d','chart-label'));
    const rail=item('div','',snap.netAdvantageUsd<0?'bar negative':'bar');
    const meter=item('div','');
    meter.style.width=(Math.min(100,100*Math.abs(snap.netAdvantageUsd)/max))+'%';
    rail.append(meter);
    row.append(rail);
    const result=item('span',dollars(snap.netAdvantageUsd),'chart-value');
    if(!snap.withdrawableUnderAssumedLock)result.title=labels.lockNo;
    row.append(result);box.append(row);
  }
}
function render(flags){
  $('flags').replaceChildren();
  for(const flag of flags)$('flags').append(item('li',labels.flags[flag]||flag));
}
function recalc(){
  try{
    const result=evaluate(read());lastResult=result;
    const val=result.horizon.netAdvantageUsd;
    const top=$('net-change');
    top.className='delta '+(val>0?'positive':val<0?'negative':'neutral');
    top.textContent=dollars(val);
    fillText('net-label',val>0?labels.gain:val<0?labels.lose:labels.flat);
    fillText('net-explain',val>=0?labels.good:labels.bad);
    fillText('break-even',result.breakEvenDays===null?labels.none:result.breakEvenDays+' '+labels.days);
    fillText('friction',amount(result.totalEstimatedCostsUsd));
    fillText('rate-current',percent(result.currentModeledApyPct));
    fillText('rate-target',percent(result.destinationModeledApyPct));
    fillText('stress',dollars(result.conservativeRewardDrop.netAdvantageUsd));
    fillText('locked',result.horizon.withdrawableUnderAssumedLock?labels.lockOk:labels.lockNo);
    $('reserve-warning').hidden=!result.reserveRequired;
    if(result.reserveRequired)fillText('reserve-warning',
      result.reserveLiquidityVerdict==='FAILS_USER_INSTANT_ACCESS_ASSUMPTIONS'
        ?labels.reserveFail:labels.reserveUnknown);
    fillText('cost-detail',Object.entries(result.fees).map(([k,v])=>k+': '+amount(v)).join(' • '));
    fillText('horizon',result.inputHorizonDays+' '+labels.days);
    displayCharts(result);render(result.riskFlags);
    fillText('status',labels.clean);
    $('download').disabled=false;
  }catch(error){
    lastResult=undefined;
    fillText('status',error instanceof CalculatorError?labels.invalid:labels.required);
    $('download').disabled=true;
  }
}
$('calculator').addEventListener('submit',event=>{
  event.preventDefault();recalc();
});
for(const {el} of editFields){
  if(!el)continue;
  el.addEventListener('change',recalc);
}
$('reserve-required').addEventListener('change',recalc);
$('example-low-cost').addEventListener('click',()=>{
  fill(DEFAULTS);recalc();
});
$('example-costly').addEventListener('click',()=>{
  fill({...DEFAULTS,principal:1500,currentBaseApy:3.9,currentRewardApy:0,
    targetBaseApy:4.7,targetRewardApy:6,rewardRealizationPct:20,
    gasUsd:15,bridgeUsd:48,swapUsd:15,exitUsd:5,futureExitUsd:12,
    slippageBps:100,delayDays:7,lockDays:150,horizonDays:90});
  recalc();
});
$('download').addEventListener('click',()=>{
  if(!lastResult)return;
  const report={
    exportedAtUTC:new Date().toISOString(),
    product:'DeFi Yield Switch — one-owner AI-assisted, non-advisory static calculator',
    calculations:lastResult,
    note:'No wallet, token balances, keys, private transaction data, live APY, user account or tax records.'
  };
  const obj=new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(obj);
  const link=document.createElement('a');
  link.href=url;
  link.download='defi-yield-switch-approximate-break-even.json';
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  fillText('status',labels.download);
});
$('copy-tip').addEventListener('click',async()=>{
  const value=$('public-tip').textContent.trim();
  if(!/^0x[a-fA-F0-9]{40}$/.test(value))return;
  try{await navigator.clipboard.writeText(value);fillText('tip-status',labels.copied);}
  catch{fillText('tip-status',labels.copyFail);}
});
fill(DEFAULTS);
recalc();
