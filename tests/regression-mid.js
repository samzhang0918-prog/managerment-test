// 中危 M1–M6 回归：node tests/regression-mid.js [代码目录]；改前(5507650)应失败，改后全过
const path=require('path'),{execFileSync}=require('child_process');
const dir=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const E=require(path.join(dir,'game-engine.js')),D=require(path.join(dir,'game-data.js'));
const R=[];const ok=(n,c,d)=>R.push([n,!!c,d]);
const mk=()=>{const e=new E.ManagerSandboxGameEngine();e.initProject('中危回归');D.DIRECTIONS.forEach(d=>e.selectTeamCard(d.id,D.TEAM_CARDS.find(c=>c.dir===d.id).id));e.confirmTeam();return e};
// M1：只审计过功能安全，不应判为“盲人总监”
try{const blind=D.MANAGEMENT_PROFILES.find(p=>p.id==='blind');const v=blind.condition([], {audited:{safety:true,road:false,data:false}});ok('M1 盲人总监画像读 audited.safety',v===false,'只审计安全时 condition='+v)}catch(x){ok('M1',false,x.message)}
// M2：e_oem_add 选 A 升一级，不被 updateStatusGates 覆盖
try{const e=mk();e.state.dirs.perception.progress=58;e.state.dirs.planning.progress=57;e.updateStatusGates();const b=e.state.function_freeze;
 e.applyEmergencyEffects('e_oem_add','A',{});e.updateStatusGates();const a=e.state.function_freeze;
 ok('M2 事件升级在状态重算后保留',b==='converging'&&a==='stable',`对齐和115：升级前 ${b} → 升级+重算后 ${a}`)}catch(x){ok('M2',false,x.message)}
// M3/M4：好策略 6 个月内能绿灯、能拿 A；与差策略拉开
let J=null;try{J=JSON.parse(execFileSync('node',[path.join(__dirname,'simulate.js'),'600',dir,'--json'],{encoding:'utf8'}))}catch(x){try{J=JSON.parse(x.stdout)}catch(_){}}
if(J){const g=J['好策略'],b=J['差策略'];
 ok('M3 好策略对齐灯可变绿',g.freezeEnd.stable>0,`好策略 600 局 SOP 时绿灯 ${g.freezeEnd.stable}`);
 ok('M4 好策略可拿 A 且非全 A',g.grades.A>0&&g.grades.A<600*0.5,`好策略 A ${g.grades.A}/600`);
 ok('M4 好/差策略均分差 ≥ 20',g.avg.overall-b.avg.overall>=20,`好 ${g.avg.overall} vs 差 ${b.avg.overall}`)}else ok('M3/M4',false,'simulate 无输出');
// M5：士气计入评分
try{const e=mk();e.state.delay_weeks=0;const it=e.getSOPItemsCalculated();e.state.morale=20;const lo=e.computeFinalOutcome(it);e.state.morale=90;const hi=e.computeFinalOutcome(it);
 ok('M5 士气轴且影响总分',hi.axes.morale&&hi.axes.morale.score===90&&hi.overall>lo.overall,`士气20→${lo.overall}，士气90→${hi.overall}`)}catch(x){ok('M5',false,x.message)}
// M6：结局计算纯函数，重复调用不叠加
try{const e=mk();e.state.delay_weeks=4;const it=e.getSOPItemsCalculated();const s0=JSON.stringify(e.state);const o1=e.computeFinalOutcome(it),o2=e.computeFinalOutcome(it);
 ok('M6 重复计算结果一致且不改 state',JSON.stringify(e.state)===s0&&o1.overall===o2.overall&&JSON.stringify(o1.axes)===JSON.stringify(o2.axes),`两次总分 ${o1.overall}/${o2.overall}，state 变化=${JSON.stringify(e.state)!==s0}`)}catch(x){ok('M6',false,x.message)}

// ===== 加强用例（F1 轮）：每条都对应一种回退，见文档“回退演练” =====
const lv=e=>['risk','converging','stable'].indexOf(e.state.function_freeze);
const setSum=(e,sum)=>{e.state.dirs.perception.progress=Math.floor(sum/2);e.state.dirs.planning.progress=Math.ceil(sum/2);e.updateStatusGates()};
// M3 阈值 100/130（回退到 110/140 会红）
try{const e=mk();setSum(e,105);const a=e.state.function_freeze;setSum(e,135);const b=e.state.function_freeze;setSum(e,95);const c=e.state.function_freeze;
 ok('M3 阈值 100/130',a==='converging'&&b==='stable'&&c==='risk',`和105→${a}，和135→${b}，和95→${c}`)}catch(x){ok('M3 阈值',false,x.message)}
// M4 战力分 = 0.5×(感知+规控)/2 + 0.5×路测质量（回退到 /3 会变）
try{const e=mk();e.state.dirs.perception.progress=60;e.state.dirs.planning.progress=60;e.state.dirs.road.true_quality=80;e.currentMonthlyReport=null;const o=e.computeFinalOutcome(e.getSOPItemsCalculated());
 ok('M4 战力分公式',o.axes.function.score===70,`进度60/60、路测80 → ${o.axes.function.score}（期望70，旧 /3 公式为67）`)}catch(x){ok('M4 公式',false,x.message)}
// M2 跨月保持：升一级后过一个月仍保持
try{const e=mk();setSum(e,100);e.applyEmergencyEffects('e_oem_add','A',{});e.updateStatusGates();const m=e.state.freeze_mod;const sumNext=()=>e.state.dirs.perception.progress+e.state.dirs.planning.progress;
 e.executeMonthlyAction('noop',null,null);while(e.currentEmergencyIndex<e.currentMonthEmergencies.length)e.resolveEmergency('A');
 const s=sumNext(),base=s>=130?2:s>=100?1:0;ok('M2 升降级跨月保持',e.state.freeze_mod>=1&&lv(e)===Math.min(2,base+e.state.freeze_mod),`升级后 mod=${m}，下月 和=${s} 基础档=${base} 灯=${e.state.function_freeze} mod=${e.state.freeze_mod}`)}catch(x){ok('M2 跨月',false,x.message)}
// M2 钳位 [-2,2]
try{const e=mk();setSum(e,140);for(let i=0;i<3;i++)e.applyEmergencyEffects('e_competitor','B',{});const lo=e.state.freeze_mod;e.applyEmergencyEffects('e_oem_add','A',{});e.updateStatusGates();const a=e.state.function_freeze;
 const f=mk();setSum(f,50);for(let i=0;i<3;i++)f.applyEmergencyEffects('e_oem_add','A',{});const hi=f.state.freeze_mod;f.applyEmergencyEffects('e_competitor','B',{});f.updateStatusGates();const b=f.state.function_freeze;
 ok('M2 freeze_mod 钳位 [-2,2]',lo===-2&&hi===2&&a==='converging'&&b==='converging',`3降→mod ${lo}，再升1→${a}；3升→mod ${hi}，再降1→${b}`)}catch(x){ok('M2 钳位',false,x.message)}
// M6 返回值深拷贝：改返回值不影响引擎
try{const e=mk();e.executeMonthlyAction('noop',null,null);while(e.currentEmergencyIndex<e.currentMonthEmergencies.length)e.resolveEmergency('A');
 const it=e.getSOPItemsCalculated();const h0=JSON.stringify(e.choiceHistory),s0=JSON.stringify(e.state),o=e.computeFinalOutcome(it),k0=JSON.stringify(o);
 o.choiceHistory.push({x:1});if(o.choiceHistory[0])o.choiceHistory[0].month=99;o.calculatedItems.forEach(i=>i.true_risk=999);o.axes.safety.score=-1;try{o.managementProfile.title='zz'}catch(_){}
 const o2=e.computeFinalOutcome(it);ok('M6 返回深拷贝',JSON.stringify(e.choiceHistory)===h0&&JSON.stringify(e.state)===s0&&JSON.stringify(o2)===k0&&D.MANAGEMENT_PROFILES.every(p=>p.title!=='zz'),'改返回值后引擎/常量/重算结果不变')}catch(x){ok('M6 深拷贝',false,x.message)}
// 常量冻结
ok('常量深冻结',Object.isFrozen(D.MANAGEMENT_PROFILES)&&Object.isFrozen(D.MANAGEMENT_PROFILES[0])&&Object.isFrozen(D.SOP_ITEMS[0])&&Object.isFrozen(D.TEAM_CARDS)&&!Object.isFrozen(D.PRD_CONFIG.balance),'MANAGEMENT_PROFILES/SOP_ITEMS/TEAM_CARDS 冻结，PRD_CONFIG 不冻结');
// A9 交付：超 2 周部分车企关系 -8/周（局部）+ 交付按周扣分
try{const e=mk();e.state.delay_weeks=4;const it=e.getSOPItemsCalculated().map(i=>({...i,decision:'repair'}));const o=e.computeFinalOutcome(it);const B=D.PRD_CONFIG.balance;
 const exp=Math.max(0,Math.min(100,Math.round(40+Math.max(0,e.state.oem_relation-16)*0.5+e.state.market*0.2)-4*(B.delay_penalty_per_week??8)));
 ok('A9/M6 延期 4 周交付分',o.axes.delivery.score===exp&&e.state.oem_relation===60,`交付 ${o.axes.delivery.score}（期望 ${exp}，含车企关系 -16 局部扣减），state.oem_relation=${e.state.oem_relation}`)}catch(x){ok('A9 交付',false,x.message)}
// F1：测试复现局不再是 A，且文案与等级一致
const noopRun=(n,cardIdx)=>{const e=new E.ManagerSandboxGameEngine();e.initProject('代号'+n);D.DIRECTIONS.forEach(d=>e.selectTeamCard(d.id,D.TEAM_CARDS.filter(c=>c.dir===d.id)[cardIdx].id));e.confirmTeam();
 for(let s=0;s<8&&!e.readyForSOP;s++){e.executeMonthlyAction('noop',null,null);while(e.currentEmergencyIndex<e.currentMonthEmergencies.length)e.resolveEmergency('A')}
 e.getSOPStatus().items.forEach(it=>e.setSOPDecision(it.id,'waive'));return e.confirmSOPRelease()};
try{const rs=[10,20,97,140,174].map(n=>noopRun(n,1));const bad=rs.filter(o=>!o.isBrick&&(o.letter==='A'||o.overall>=85||o.gradeCapped||!o.subtitle.startsWith(o.letter)));
 ok('F1(a) 复现代号 10/20/97/140/174 分数<85 且不靠封顶',bad.length===0,rs.map((o,i)=>[10,20,97,140,174][i]+':'+(o.isBrick?'砖':o.letter)+o.overall).join(' '))}catch(x){ok('F1 复现',false,x.message)}
// F1(b) 兜底：关掉(a)的扣分，盲人总监+全 noop 仍封顶 B，副标题注明
try{const B=D.PRD_CONFIG.balance,old=B.blind_waive_penalty;B.blind_waive_penalty=0;let o;try{o=noopRun(10,1)}finally{B.blind_waive_penalty=old}
 ok('F1 兜底封顶 B（含 noop 过半原因）',o.letter==='B'&&o.gradeCapped===true&&o.subtitle.startsWith('B')&&o.subtitle.includes('封顶')&&(o.capReasons||[]).includes('整局多数月份不作为'),`(a) 关闭时 代号10 → ${o.letter}·${o.overall}，${o.subtitle}`)}catch(x){ok('F1 兜底',false,x.message)}
// F1：noop 策略 A=0，好策略 A>0
if(J&&J.noop)ok('F1 noop 策略 A=0 且好策略仍有 A',J.noop.grades.A===0&&J['好策略'].grades.A>0,`noop A ${J.noop.grades.A}/600，好策略 A ${J['好策略'].grades.A}/600`);else ok('F1 noop 策略',false,'simulate 无 noop 策略');

// B1：审计充数 + 全放行（M1–M3 审计三向，M4–M6 noop）
const auditRun=(n,cardIdx,plan)=>{const e=new E.ManagerSandboxGameEngine();e.initProject('代号'+n);D.DIRECTIONS.forEach(d=>e.selectTeamCard(d.id,D.TEAM_CARDS.filter(c=>c.dir===d.id)[cardIdx].id));e.confirmTeam();
 for(let s=0;s<8&&!e.readyForSOP;s++){const[id,t]=(plan[e.state.month-1]||'noop').split(':');e.executeMonthlyAction(id,t||null,'urban_rain');while(e.currentEmergencyIndex<e.currentMonthEmergencies.length)e.resolveEmergency('A')}
 e.getSOPStatus().items.forEach(it=>e.setSOPDecision(it.id,'waive'));return e.confirmSOPRelease()};
const B1P=['audit:road','audit:data','audit:fs'];
try{const o=auditRun(10,1,B1P);ok('B1 审计充数全放行不再 A（知情放行扣分）',!o.isBrick&&o.letter!=='A'&&o.overall<85&&o.axes.safety.score<100,`代号10 → ${o.letter}·${o.overall} 安全 ${o.axes.safety.score}（修复前 A·89 安全 100）`)}catch(x){ok('B1 复现',false,x.message)}
try{const B=D.PRD_CONFIG.balance,old=B.blind_waive_penalty;B.blind_waive_penalty=0;let o;try{o=auditRun(10,1,B1P)}finally{B.blind_waive_penalty=old}
 const r=o.capReasons||[];ok('B1 兜底：实质改善不足/高风险一项未修封顶 B',o.letter==='B'&&o.gradeCapped&&r.includes('实质改善动作不足')&&r.includes('高风险项一项未修')&&!r.includes('整局多数月份不作为'),`扣分关闭时 代号10 → ${o.letter}·${o.overall}，${r.join(' / ')}`)}catch(x){ok('B1 兜底',false,x.message)}
// 规则 3（Sam）：最终安全分（含所有扣分）≤25 即变砖；扣分导致的变砖用专属文案
try{let bad=[],pen=[];for(let n=0;n<120;n++){const o=auditRun(n,1,B1P);if((o.axes.safety.score<=25)!==o.isBrick)bad.push(n);
  if(o.isBrick&&!o.firedItems.some(f=>['rain_ped','ghost','brake'].includes(f.id)))pen.push([n,o])}
 const okTxt=pen.every(([,o])=>o.subtitle===D.PENALTY_BRICK_SUBTITLE);
 ok('规则3 安全≤25 即变砖（含扣分）',bad.length===0&&pen.length>0&&okTxt,`代号0–119：安全≤25 与变砖不一致 ${bad.length} 局；扣分致砖 ${pen.length} 局（如代号${pen[0]&&pen[0][0]}），文案一致 ${okTxt}`)}catch(x){ok('规则3',false,x.message)}
// finalOutcome 存的是深拷贝：改 confirmSOPRelease 返回值不影响引擎内 finalOutcome
try{const e=mk();e.executeMonthlyAction('noop',null,null);while(e.currentEmergencyIndex<e.currentMonthEmergencies.length)e.resolveEmergency('A');
 while(!e.readyForSOP){e.executeMonthlyAction('noop',null,null);while(e.currentEmergencyIndex<e.currentMonthEmergencies.length)e.resolveEmergency('A')}
 e.getSOPStatus().items.forEach(it=>e.setSOPDecision(it.id,'waive'));const o=e.confirmSOPRelease();const k0=JSON.stringify(e.finalOutcome);
 o.axes.safety.score=-1;o.choiceHistory.push({x:1});o.calculatedItems[0].true_risk=999;o.letter='Z';
 ok('finalOutcome 深拷贝',JSON.stringify(e.finalOutcome)===k0&&e.finalOutcome!==o,'改返回值后 engine.finalOutcome 不变')}catch(x){ok('finalOutcome 深拷贝',false,x.message)}
// 事件深拷贝：抽出的事件与常量不共享嵌套引用
try{const e=mk();let shared=[],n=0;for(let m=0;m<6&&!e.readyForSOP;m++){e.executeMonthlyAction('noop',null,null);
  e.currentMonthEmergencies.forEach(ev=>{n++;const c=D.EMERGENCY_EVENTS.find(x=>x.id===ev.id);Object.keys(c).forEach(k=>{if(c[k]&&typeof c[k]==='object'&&ev[k]===c[k])shared.push(ev.id+'.'+k)})});
  while(e.currentEmergencyIndex<e.currentMonthEmergencies.length)e.resolveEmergency('A')}
 ok('事件深拷贝',n>0&&shared.length===0,`抽到 ${n} 个事件，共享引用 ${shared.length ? shared.join(',') : '无'}`)}catch(x){ok('事件深拷贝',false,x.message)}
// ===== Sam 四条规则（规则调整轮）=====
const bestCard=d=>D.TEAM_CARDS.filter(c=>c.dir===d).reduce((x,y)=>x.true_power>=y.true_power?x:y);
const playPlan=(n,plan)=>{const e=new E.ManagerSandboxGameEngine();e.initProject('代号'+n);D.DIRECTIONS.forEach(d=>e.selectTeamCard(d.id,bestCard(d.id).id));e.confirmTeam();
 for(let m=0;m<10&&!e.readyForSOP;m++){let[id,t]=(plan[m]||'noop').split(':');const a=D.MONTHLY_ACTIONS.find(x=>x.id===id);if(a.cost>e.state.budget){id='noop';t=null}
  e.executeMonthlyAction(id,t||null,'urban_rain');while(e.currentEmergencyIndex<e.currentMonthEmergencies.length)e.resolveEmergency('A')}return e};
const cloneE=e=>Object.assign(Object.create(Object.getPrototypeOf(e)),structuredClone(Object.fromEntries(Object.entries(e))));
const bestSOP=e=>{const items=e.getSOPStatus().items;let b=null;for(let mask=0;mask<64;mask++){const c=cloneE(e);items.forEach(i=>c.setSOPDecision(i.id,'waive'));let okm=true;items.forEach((it,i)=>{if(mask>>i&1&&!c.setSOPDecision(it.id,'repair'))okm=false});if(!okm)continue;const o=c.confirmSOPRelease();if(o.isBrick)continue;const sc=o.overall+(o.letter==='A'?1000:0);if(!b||sc>b.sc)b={sc,o}}return b};
const GOODP=['audit:fs','safety_case:fs','audit:road','road_scene:road','data_rain:data','audit:data'];
const ZEROA=['road_scene:road','data_rain:data','oem_please_act:oem','oem_please_act:oem','oem_please_act:oem','noop'];
const REPR=['road_scene:road','road_scene:road','road_scene:road','oem_please_act:oem','oem_please_act:oem','oem_please_act:oem'];
// 规则 1：交付延期每周扣 4
try{const e=playPlan(3,GOODP);const items=e.getSOPItemsCalculated();const d0=e.state.delay_weeks;e.state.delay_weeks=0;const a=e.computeFinalOutcome(items).axes.delivery.score;e.state.delay_weeks=1;const b=e.computeFinalOutcome(items).axes.delivery.score;e.state.delay_weeks=d0;
 ok('规则1 交付延期每周扣 4',a-b===4,`延期 0→1 周 交付 ${a}→${b}`)}catch(x){ok('规则1',false,x.message)}
// 规则 2：零审计（2 实质 + 3 讨好车企）在各代号都低于好策略（双方 SOP 都取最优）
try{let beat=0,tie=0,n=0;for(let k=0;k<60;k++){const g=bestSOP(playPlan(k,GOODP)),z=bestSOP(playPlan(k,ZEROA));n++;const gs=g?g.sc:-1,zs=z?z.sc:-1;if(zs>gs)beat++;else if(zs===gs)tie++}
 ok('规则2 零审计打法分数低于好策略',beat===0&&tie===0,`代号0–59：零审计高于好策略 ${beat}、持平 ${tie}`)}catch(x){ok('规则2 比较',false,x.message)}
try{const o=bestSOP(playPlan(0,GOODP)).o;ok('规则2 知情度加分=审计方向数×1.5',o.insightBonus===4.5&&o.auditedDirs===3,`好策略 代号0 insightBonus ${o.insightBonus}，审计方向 ${o.auditedDirs}`)}catch(x){ok('规则2 加分',false,x.message)}
try{const e=playPlan(0,GOODP);e.getSOPStatus().items.forEach(i=>e.setSOPDecision(i.id,'waive'));const o=e.confirmSOPRelease();const b=auditRun(10,1,B1P);
 ok('规则2 加分需配合修复（不重开 B1）',o.insightBonus===0&&b.insightBonus===0&&b.letter!=='A',`好策略动作+全放行 加分 ${o.insightBonus}；B1 打法 加分 ${b.insightBonus} ${b.letter}·${b.overall}`)}catch(x){ok('规则2 B1',false,x.message)}
// 规则 4：同一实质动作重复只算 1 次（开关默认开）
try{const B=D.PRD_CONFIG.balance;let on=0,capOn=0,off=0;for(let k=0;k<40;k++){const a=bestSOP(playPlan(k,REPR));if(a&&a.o.letter==='A')on++;if(a&&(a.o.capReasons||[]).includes('实质改善动作不足'))capOn++;
  const old=B.dedupe_substantive_actions;B.dedupe_substantive_actions=false;let c;try{c=bestSOP(playPlan(k,REPR))}finally{B.dedupe_substantive_actions=old}if(c&&c.o.letter==='A')off++}
 ok('规则4 重复路测×3 不再拿 A（关开关可恢复）',B.dedupe_substantive_actions===true&&on===0&&capOn>0&&off>0,`代号0–39：开关开 A ${on}（因实质不足封顶 ${capOn}），开关关 A ${off}`)}catch(x){ok('规则4',false,x.message)}

// 被放行高风险项扣分的独立复算：只看 SOP 项本身（阈值 25、gnss 豁免、修复周 <3）
const penDiff=(e,it)=>{const B=D.PRD_CONFIG.balance,o=B.blind_waive_penalty;const s=p=>{B.blind_waive_penalty=p;try{return e.computeFinalOutcome(it).axes.safety.score}finally{B.blind_waive_penalty=o}};return [s(0),s(0)-s(o)]};
const sideCase=(want)=>{for(let k=0;k<200;k++){const e=playPlan(k,GOODP);const items=e.getSOPStatus().items;const pre=e.getSOPItemsCalculated();
  const hi=pre.filter(x=>x.id!=='gnss'&&x.true_risk>=25),g=pre.find(x=>x.id==='gnss');let rep=null;
  if(want==='weeks'){rep=hi.find(x=>x.repair_weeks===2);if(!rep||hi.length<2)continue}else if(!(g&&g.true_risk>=25))continue;
  items.forEach(i=>e.setSOPDecision(i.id,'waive'));if(rep&&!e.setSOPDecision(rep.id,'repair'))continue;
  const it=e.getSOPItemsCalculated();const exp=it.filter(x=>x.id!=='gnss'&&x.true_risk>=25&&x.decision==='waive').length*10;const[s0,d]=penDiff(e,it);if(s0-exp<=0||exp===0)continue;return {k,rep:rep&&rep.id,exp,d}}return null};
try{const c=sideCase('weeks');ok('高风险项只修 2 周（<3）仍按放行项扣分',c&&c.d===c.exp,c?`代号${c.k} 只修 ${c.rep}（2 周），放行高风险项扣分 ${c.d}，应为 ${c.exp}`:'找不到用例')}catch(x){ok('修复周阈值',false,x.message)}

try{const c=sideCase('gnss');ok('gnss 放行不计入高风险扣分（豁免）',c&&c.d===c.exp,c?`代号${c.k} 全放行（gnss 真实风险≥25），扣分 ${c.d}，应为 ${c.exp}（不含 gnss）`:'找不到用例')}catch(x){ok('gnss 豁免',false,x.message)}

R.forEach(([n,p,d])=>console.log((p?'PASS ':'FAIL ')+n+' - '+d));const n=R.filter(r=>r[1]).length;console.log(`${n}/${R.length} 通过`);process.exit(n===R.length?0:1);
