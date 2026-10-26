// 全流程模拟：N 个代号 × 5 种策略跑到结局。用法：node tests/simulate.js [N] [代码目录] [--json]
// 策略（规则调整轮新增 零审计2实质+3讨好、重复路测×3+3讨好）：最便宜/最贵/随机（高危轮沿用）+ 好策略/差策略（中危轮新增，用于看平衡区分度）+ noop（F1 复测）
const path=require('path');const args=process.argv.slice(2).filter(a=>!a.startsWith('--'));const N=+(args[0]||3000);
const dir=path.resolve(args[1]||path.join(__dirname,'..'));const E=require(path.join(dir,'game-engine.js'));const D=require(path.join(dir,'game-data.js'));
if(process.env.SIM_BALANCE){const b=JSON.parse(process.env.SIM_BALANCE);Object.assign(D.PRD_CONFIG.balance,b)} // 调参用：临时覆盖 PRD_CONFIG.balance
const GR=+(process.env.SIM_GOOD_RISK||25),GW=+(process.env.SIM_GOOD_WEEKS||4); // 好策略 SOP：只修真实风险≥GR 的项，累计延期≤GW 周
const mkR=i=>{let sd=i*7919+1;return()=>((sd=(sd*1103515245+12345)%2147483648)/2147483648)};
const aff=(e,id)=>{const a=D.MONTHLY_ACTIONS.find(x=>x.id===id);return a.cost===0||e.state.budget>=a.cost};
const best=dir=>D.TEAM_CARDS.filter(c=>c.dir===dir).reduce((x,y)=>x.true_power>=y.true_power?x:y);
const worst=dir=>D.TEAM_CARDS.filter(c=>c.dir===dir).reduce((x,y)=>x.true_power<=y.true_power?x:y);
// 好策略：选真实战力高的队；先隔级审计（安全、路测、数据），再做安全兜底/极限场景/数据攻关；事件选 A；SOP 按真实风险从高到低在预算内修复
const goodPlan=['audit:fs','safety_case:fs','audit:road','road_scene:road','data_rain:data','audit:data'];
const S={
 '最便宜':{team:(d,r,cs)=>cs[Math.floor(r()*cs.length)],act:(e,r,acts)=>acts.reduce((x,y)=>x.cost<=y.cost?x:y),opt:r=>'ABC'[Math.floor(r()*3)],sop:'random'},
 '最贵':{team:(d,r,cs)=>cs[Math.floor(r()*cs.length)],act:(e,r,acts)=>acts.reduce((x,y)=>x.cost>=y.cost?x:y),opt:r=>'ABC'[Math.floor(r()*3)],sop:'random'},
 '随机':{team:(d,r,cs)=>cs[Math.floor(r()*cs.length)],act:(e,r,acts)=>acts[Math.floor(r()*acts.length)],opt:r=>'ABC'[Math.floor(r()*3)],sop:'random'},
 '好策略':{team:d=>best(d),act:(e,r,acts)=>{const s=goodPlan[e.state.month-1]||'noop:';const[id,t]=s.split(':');return aff(e,id)?{id,t,x:'urban_rain'}:{id:'noop'}},opt:()=> 'A',sop:'good'},
 '零审计2实质+3讨好':{team:d=>best(d),act:(e,r,acts)=>{const s=['road_scene:road','data_rain:data','oem_please_act:oem','oem_please_act:oem','oem_please_act:oem'][e.state.month-1]||'noop:';const[id,t]=s.split(':');return aff(e,id)?{id,t,x:'urban_rain'}:{id:'noop'}},opt:()=>'A',sop:'good'}, // Sam 规则 2：零审计打法
 '重复路测×3+3讨好':{team:d=>best(d),act:(e,r,acts)=>{const s=['road_scene:road','road_scene:road','road_scene:road','oem_please_act:oem','oem_please_act:oem','oem_please_act:oem'][e.state.month-1]||'noop:';const[id,t]=s.split(':');return aff(e,id)?{id,t,x:'urban_rain'}:{id:'noop'}},opt:()=>'A',sop:'good'}, // Sam 规则 4：重复同一实质动作
 'noop':{team:d=>best(d),act:()=>({id:'noop'}),opt:()=>'A',sop:'waive'}, // F1：整局不作为+强队+事件全A+SOP全waive
 '差策略':{team:d=>worst(d),act:(e,r,acts)=>{const id=e.state.month%2?'overtime':'oem_please_act';return aff(e,id)?{id,t:id==='overtime'?'perception':'oem',x:'highway'}:{id:'noop'}},opt:()=>'C',sop:'waive'}
};
const tot={};
for(const [sn,st] of Object.entries(S)){const R={games:0,stuck:0,negStuck:0,negSeen:0,sopThrow:0,grades:{A:0,B:0,C:0,D:0,'变砖':0},sum:{overall:0,safety:0,function:0,delivery:0,cost:0,morale:0,align:0},freezeEnd:{risk:0,converging:0,stable:0}};
 for(let i=0;i<N;i++){const r=mkR(i);const e=new E.ManagerSandboxGameEngine();e.initProject('代号'+i);
  D.DIRECTIONS.forEach(d=>e.selectTeamCard(d.id,st.team(d.id,r,D.TEAM_CARDS.filter(c=>c.dir===d.id)).id));e.confirmTeam();R.games++;
  let sop=false,neg=false,ok=true;
  for(let step=0;step<12&&!sop;step++){if(e.readyForSOP||e.state.month>6){sop=true;break}
   if(e.state.budget<0)neg=true;const acts=D.MONTHLY_ACTIONS.filter(a=>a.cost===0||e.state.budget>=a.cost);if(!acts.length){ok=false;break}
   let a=st.act(e,r,acts);if(a.cost!==undefined)a={id:a.id,t:(a.valid_dirs||[])[0]||null,x:'urban_rain'};const m0=e.state.month;
   try{e.executeMonthlyAction(a.id,a.t||null,a.x||null)}catch(x){ok=false;break}
   let last=null;while(e.currentEmergencyIndex<e.currentMonthEmergencies.length)last=e.resolveEmergency(st.opt(r));
   if(last&&last.readyForSOP)sop=true;else if(e.state.month===m0&&!e.readyForSOP){ok=false;break}}
  if(e.state.budget<0)neg=true;if(neg)R.negSeen++;
  if(!sop||!ok){R.stuck++;if(neg)R.negStuck++;continue}
  R.freezeEnd[e.state.function_freeze]=(R.freezeEnd[e.state.function_freeze]||0)+1;R.sum.align+=e.state.dirs.perception.progress+e.state.dirs.planning.progress;
  const items=e.getSOPStatus().items;
  if(st.sop==='random')items.forEach(it=>{if(r()<0.5&&e.setSOPDecision(it.id,'repair'))return;e.setSOPDecision(it.id,'waive')});
  else if(st.sop==='waive')items.forEach(it=>e.setSOPDecision(it.id,'waive'));
  else{items.forEach(it=>e.setSOPDecision(it.id,'waive'));let wk=0;[...items].sort((x,y)=>y.true_risk-x.true_risk).forEach(it=>{if(it.true_risk>=GR&&wk+it.repair_weeks<=GW&&e.setSOPDecision(it.id,'repair'))wk+=it.repair_weeks})}
  let out;try{out=e.confirmSOPRelease()}catch(x){R.sopThrow++;R.stuck++;continue}
  R.grades[out.isBrick?'变砖':out.letter]++;if(process.argv.includes('--examples')){const g=out.isBrick?'变砖':out.letter;R.ex=R.ex||{};(R.ex[g]=R.ex[g]||[]).length<3&&R.ex[g].push('代号'+i+'('+out.overall+')')}R.sum.overall+=out.overall;for(const k of ['safety','function','delivery','cost'])R.sum[k]+=out.axes[k].score;R.sum.morale+=out.axes.morale?out.axes.morale.score:e.state.morale;}
 const done=R.games-R.stuck;R.avg={};for(const k in R.sum)R.avg[k]=+(R.sum[k]/Math.max(1,done)).toFixed(1);delete R.sum;tot[sn]=R;}
if(process.argv.includes('--json'))console.log(JSON.stringify(tot));else{
 console.log('策略\t局数\t卡死\t负预算卡死\tA\tB\tC\tD\t变砖\t均分\t安全\t战力\t交付\t成本\t士气\t对齐和\t对齐灯(红/黄/绿)');
 for(const[k,R]of Object.entries(tot)){const g=R.grades,a=R.avg,f=R.freezeEnd;console.log([k,R.games,R.stuck,R.negStuck,g.A,g.B,g.C,g.D,g['变砖'],a.overall,a.safety,a.function,a.delivery,a.cost,a.morale,a.align,`${f.risk}/${f.converging}/${f.stable}`].join('\t'))}}
if(process.argv.includes('--examples'))for(const[k,R]of Object.entries(tot))console.log(k,JSON.stringify(R.ex));
process.exit(Object.values(tot).reduce((s,x)=>s+x.stuck,0)?1:0);
