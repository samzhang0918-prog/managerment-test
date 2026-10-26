// 回归测试：H1–H3 + 自带 runPRDTests。用法：node tests/regression.js [代码目录]
const path=require('path');const dir=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const E=require(path.join(dir,'game-engine.js'));const D=require(path.join(dir,'game-data.js'));
const res=[];const rec=(id,ok,d)=>res.push({id,ok:!!ok,d});
function mk(n,i=1){const e=new E.ManagerSandboxGameEngine();e.initProject(n);D.DIRECTIONS.forEach(d=>e.selectTeamCard(d.id,D.TEAM_CARDS.filter(c=>c.dir===d.id)[i].id));e.confirmTeam();return e;}
const sopReady=e=>e.readyForSOP===true||e.state.month>6||e._sop===true;
// 跑完 6 个月，返回 {ok, reason}
function play(e,pick){for(let step=0;step<20;step++){if(sopReady(e))return{ok:true};const acts=D.MONTHLY_ACTIONS.filter(a=>a.cost===0||e.state.budget>=a.cost);if(!acts.length)return{ok:false,reason:'no-action',budget:e.state.budget};const a=pick(acts,e);const m0=e.state.month;
  try{e.executeMonthlyAction(a.id,(a.valid_dirs||[])[0]||null,'urban_rain')}catch(x){return{ok:false,reason:'throw:'+x.message}}
  let last=null;while(e.currentEmergencyIndex<e.currentMonthEmergencies.length)last=e.resolveEmergency('A');
  if(!last&&e.state.month===m0&&!sopReady(e))return{ok:false,reason:'month-stuck',month:m0};
  if(last&&last.readyForSOP)e._sop=true;}
  return{ok:false,reason:'loop'};}
const cheap=a=>a.reduce((x,y)=>x.cost<=y.cost?x:y), rich=a=>a.reduce((x,y)=>x.cost>=y.cost?x:y);
try{
 // H1
 let st=0;for(let i=0;i<3000;i++){const r=play(mk('s'+i),cheap);if(!r.ok)st++;}rec('H1',st===0,`3000 代号 noop/最便宜策略卡死 ${st}`);
 // H2
 let neg=0,stuck=0;for(let i=0;i<300;i++){const e=mk('n'+i,0);let sawNeg=false;const r=play(e,(a,e)=>{if(e.state.budget<0)sawNeg=true;return rich(a)});if(e.state.budget<0)sawNeg=true;if(sawNeg)neg++;if(sawNeg&&!r.ok)stuck++;}
 rec('H2',neg>0&&stuck===0,`300 局高薪+最贵动作：出现负预算 ${neg} 局，其中卡死 ${stuck}`);
 // H3 a: 累计校验
 const g=mk('sop2');g.state.month=6;g.state.budget=1000;const sel=['rain_ped','ghost','brake'].map(i=>g.setSOPDecision(i,'repair'));
 const tot=D.SOP_ITEMS.filter(i=>g.sopDecisions[i.id]==='repair').reduce((s,i)=>s+i.repair_cost,0);
 rec('H3-累计校验',tot<=1000,`预算 1000 选 3 项修复，接受结果 ${sel}，已选累计 ${tot}`);
 // H3 b: 原子化（强行写入超额决策）
 const h=mk('sop3');h.state.month=6;h.state.budget=1000;D.SOP_ITEMS.forEach(i=>h.sopDecisions[i.id]='waive');['rain_ped','ghost','brake'].forEach(i=>h.sopDecisions[i]='repair');
 const b0=h.state.budget,d0=h.state.delay_weeks;let threw=false;try{h.confirmSOPRelease()}catch(x){threw=true}
 rec('H3-原子化',threw&&h.state.budget===b0&&h.state.delay_weeks===d0,`超额确认抛错=${threw}，预算 ${b0}->${h.state.budget}，延期 ${d0}->${h.state.delay_weeks}`);
 // H3 c: 防重复确认
 const k=mk('sop4');k.state.month=6;k.state.budget=5000;D.SOP_ITEMS.forEach(i=>k.sopDecisions[i.id]='waive');k.sopDecisions.cone='repair';
 k.confirmSOPRelease();const b1=k.state.budget,dl=k.state.delay_weeks;let again=false;try{k.confirmSOPRelease()}catch(x){again=true}
 rec('H3-防重复',again&&k.state.budget===b1&&k.state.delay_weeks===dl,`二次确认抛错=${again}，预算 ${b1}->${k.state.budget}`);
 // H3 d: 页内提示（静态检查）
 const fs=require('fs');const app=fs.readFileSync(path.join(dir,'app.js'),'utf8'),html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 rec('H3-页内提示',/id="sop-error-banner"/.test(html)&&/try\s*{\s*const outcome = engine\.confirmSOPRelease/.test(app),'index.html 有 #sop-error-banner 且 app.js confirm 有 try/catch');
}catch(x){rec('FATAL',false,x.stack)}
const prd=E.runPRDTests();rec('runPRDTests',prd.every(r=>r.passed),prd.map(r=>r.id+(r.passed?'✓':'✗')).join(' '));
res.forEach(r=>console.log((r.ok?'PASS':'FAIL'),r.id,'-',r.d));const f=res.filter(r=>!r.ok).length;console.log(`${res.length-f}/${res.length} 通过`);process.exit(f?1:0);
