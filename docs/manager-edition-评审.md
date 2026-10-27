---
title: manager-edition 评审（《带队吧，总监》）
date: 2026-10-26
category: 02 工具开发
tags: [管理者自测, manager-edition, 代码评审, 前端, 游戏]
source: 全栈开发 + Antigravity claude-opus-5-5-high
status: 评审完成·未改代码
---

> 附件：[[附件/管理者自测-manager-edition/agy原始报告.md|agy 原始报告]] · [[附件/管理者自测-manager-edition/t.js|t.js]] · [[附件/管理者自测-manager-edition/t2.js|t2.js]] · [[附件/管理者自测-manager-edition/t3.js|t3.js]]
> 说明：box 上 Gemini 模型因地区限制不可用，本次改用 claude-opus-5-5-high 评审。

# manager-edition《带队吧，总监》代码评审（只读）

> 日期：2026-10-26（北京时间）｜执行：全栈开发 + Antigravity CLI（agy）｜性质：只读评审，无代码改动

## 0. 结论先行

| 项 | 结论 |
|---|---|
| 项目 | 纯前端单页管理模拟游戏：扮演智驾量产研发总监，组 6 支队伍 → M1–M6 每月 1 个管理动作 + 1–2 个突发事件 → SOP 时对 6 条质量红线选「修复/Waive」→ 四轴评分与复盘 |
| 架构 | 分层清楚：game-data.js（配置）/ game-engine.js（无 DOM 的确定性引擎，SHA-256+Mulberry32 种子）/ app.js（界面）。引擎自带 A1–A10 测试，**实跑 10/10 通过**，但测试覆盖不到下面的 bug |
| 最严重问题 | **3 个高危 bug，全部经脚本复现确认**：①事件池耗尽，约 5.8% 的项目代号在 M6 卡死，进不了 SOP；②预算为负后连零成本动作也不能点，游戏卡死；③SOP 修复不按累计预算校验，确认时扣到一半抛异常，状态写坏，界面没有任何反应 |
| 中危 | 6 条：画像字段名写错、红绿灯「升/降一级」被立即覆盖、目标对齐灯永远是红灯、A 级几乎拿不到、士气不计分、结局计算会改状态（已全部核实，其中 4 条用脚本复现） |
| 建议 | P0 先修 3 个卡死/写坏状态的问题；P1 修数值与机制、补真实测试；P2 配置集中、无障碍、清理死代码 |
| 原文件 | /workspace/manager-edition/ 5 个文件的 sha256 在评审前后**一致，未改动** |

## 1. 需求和目标
- 来源：Sam 经大福下达（2026-10-26）。用 agy 评审 manager-edition，**只看不改**。
- 目标：讲清这是什么项目、怎么运行、代码结构、bug（带严重度）、按优先级排的改进建议，并人工抽查 agy 的结论。

## 2. 技术方案和架构（项目结构）

| 文件 | 行数 | 职责 |
|---|---|---|
| index.html | 360 | 7 个 screen（首页/组队/名单/月度看板/突发事件/SOP/结局）+ 2 个弹窗，靠 `.screen.active` 切换 |
| style.css | 1141 | 深色主题，移动端最宽 480px，底部固定栏与抽屉式弹窗 |
| game-data.js | 610 | UMD 方式导出 GameData：PRD_CONFIG、DIRECTIONS、TEAM_CARDS(12)、MONTHLY_ACTIONS(8)、EMERGENCY_EVENTS(8)、SOP_ITEMS(6)、MANAGEMENT_PROFILES(5) |
| game-engine.js | 1479 | `ManagerSandboxGameEngine` 状态机：initProject → selectTeamCard/confirmTeam → executeMonthlyAction → resolveEmergency → getSOPStatus/confirmSOPRelease → computeFinalOutcome；runPRDTests |
| app.js | 666 | DOMContentLoaded 里的一个大闭包：渲染、事件绑定、调用引擎 |

数据流：app 只调用引擎方法，然后通过 `getStateSnapshot()` 读状态渲染；随机数全部来自 `rngU32(seed, tag)`，同一代号可以复现同一局。

## 3. 使用的模型
| 项 | 值 |
|---|---|
| agy 版本 | 1.4.5（/home/box/.local/bin/agy） |
| `agy models` 中最新最强的 Gemini | gemini-4-argon-high |
| 实际使用 | **claude-opus-5-5-high**，`--effort high` |
| 原因 | 所有 Gemini 模型（argon-high、3.8-flash-medium）都报 `FAILED_PRECONDITION (code 400): User location is not supported for the API use.`，Claude 模型正常。见 agy-output/stderr 和 diag.log |
| 命令 | `cd /workspace/manager-edition-review && agy -p "<只读评审提示>" --model claude-opus-5-5-high --effort high --print-timeout 900s` |
| 备注 | 第一次用 `--mode plan` 跑时，agy 想执行 node 但卡在权限上，只输出了两行就结束（review-run1-plan-incomplete.md）。第二次在提示里禁止执行命令，得到完整报告（agy-output/review.md）。没有使用 --dangerously-skip-permissions，也没有扩大权限 |

## 4. 主要改动
本次没有改动任何代码。原目录只读；副本 /workspace/manager-edition-review/ 的 5 个源文件也未改（sha256 与原件一致）。只新增了 docs/ 和 agy-output/。

## 5. 怎么运行
| 方式 | 命令 |
|---|---|
| 直接打开 | 浏览器打开 index.html（普通 script 标签，file:// 下可用） |
| 静态服务 | `cd manager-edition && python3 -m http.server 8000`，访问 http://localhost:8000/ |
| 调试 | URL 加 `?debug=1`，顶部显示种子、预算和各方向真实质量 |
| 引擎自测 | `node -e "console.log(require('./game-engine.js').runPRDTests())"` |

## 6. 测试/验证结果（抽查 agy 结论）
验证脚本：agy-output/t.js、t2.js、t3.js（用 node 加载副本里的引擎）。

| agy 编号 | 结论 | 核实方式 | 结果 |
|---|---|---|---|
| 自带测试 A1–A10 | — | runPRDTests 实跑 | 10/10 通过（A10 是硬编码 true） |
| H1 事件池耗尽导致卡死 | 高 | 跑 3000 个代号的完整流程 | **确认**：175/3000 ≈ 5.8%，都在 M6 抽到 0 个事件，month 不再推进 |
| H2 负预算时全部动作禁用 | 高 | 高薪阵容 + 每月选最贵动作，跑 300 个代号 | **确认**：215/300 局出现预算为负（最低 −1140），之后连 noop/cut 也不满足 `budget>=cost`，卡死。保守玩法不易触发 |
| H3 SOP 修复不按累计校验 | 高 | 预算 1000，选修 rain_ped/ghost/brake（共 1950） | **确认**：抛出「预算不足以修复 鬼探头…」，此时预算已从 1000 扣到 400、延期已 +2 周；app.js 没有 try/catch |
| M1 画像字段 audited.fs | 中 | 设 audited.safety=true 后求画像 | **确认**：仍判为 blind |
| M2 升/降级被覆盖 | 中 | e_oem_add A 之后调用 updateStatusGates | **确认**：converging → risk |
| M3 对齐灯永远是红灯 | 中 | 每月轮流加班/CCB | **确认**：6 个月后感知+规控进度只有 70，阈值是 110/140 |
| M4 A 级几乎拿不到 | 中 | 读代码 | 部分成立（推算合理，未做全策略模拟） |
| M5 士气不计分 | 中 | 读 computeFinalOutcome | **确认** |
| M6 结局计算修改状态 | 中 | 两次调用 computeFinalOutcome，delay=4 | **确认**：oem_relation 60→44→28，会叠加 |
| L1–L13 | 低 | 抽读 L4、L5、L10（style.css 中 sop-list 底边距 70px，fixed 底栏约 100px） | 抽查的几条都成立，其余未逐条核 |

误报：0 条。我补充的问题见下表的 X1–X2。

## 7. 已知问题（bug 表）
| # | 严重度 | 位置 | 问题 | 核实 |
|---|---|---|---|---|
| H1 | 高 | game-engine.js L693–753、L783–792；app.js L438–442、L482–490 | 事件池只有 8 个且不放回，约 5.8% 的代号在 M6 抽空，月份不推进，玩家永远进不了 SOP，并且每次重复动作都会再扣一遍工资 | 确认 |
| H2 | 高 | app.js L301；game-engine.js L369、L383 | 工资和事件扣款不检查余额，预算可以变负；之后零成本动作也被禁用，游戏卡死 | 确认 |
| H3 | 高 | game-engine.js L1022、L1043、L1093–1101；app.js L559–563 | 修复只按单项校验，确认时扣款不是原子操作，抛异常后状态写坏，界面无反馈 | 确认 |
| M1 | 中 | game-data.js L579 | `state.audited.fs` 应为 `audited.safety` | 确认 |
| M2 | 中 | game-engine.js L310–322（L400/L776 处调用） | 事件/动作里的升降级被 updateStatusGates 覆盖 | 确认 |
| M3 | 中 | game-engine.js L314–321 | 冻结阈值 110/140 实际达不到 | 确认 |
| M4 | 中 | game-engine.js L1154、L1191–1195 | 战力分偏低，A 级几乎拿不到 | 部分成立 |
| M5 | 中 | game-engine.js L1108–1230 | 士气不进入最终评分 | 确认 |
| M6 | 中 | game-engine.js L1166–1175、L1087 | 结局计算写 this.state，可重复调用叠加；超过 2 周的延期被三重惩罚 | 确认 |
| X1 | 低 | app.js L466 | （补充）事件结果用 alert；没有存档，刷新页面整局丢失 | 读代码 |
| X2 | 低 | app.js L22–31 | （补充）任何人在 URL 加 ?debug=1 就能看到全部真值，答案直接暴露 | 读代码 |
| L1–L13 | 低 | 见 agy-output/review.md §4.3 | 审计规则不一致、死代码、写死的常量、无障碍问题、SOP 底栏遮挡最后一张卡片、假测试等 | 抽查成立 |

## 8. 改进建议（优先级）
| 优先级 | 建议 | 对应问题 |
|---|---|---|
| P0 | 事件抽空时引擎直接推进月份或进入 SOP（新增 advanceMonth），界面不再自己判断 month>6；或扩充事件池/允许重新洗牌 | H1 |
| P0 | 零成本动作永远可用（`cost===0 \|\| budget>=cost`），或者设计明确的破产结局 | H2 |
| P0 | SOP 按「当前预算 − 已选修复累计」校验；confirm 先校验总额再一次性扣款；防重复调用；界面加 try/catch | H3、M6 |
| P1 | 修正 audited.fs；红绿灯改为「基础值 + 持久修正」，阈值调到可达范围 | M1–M3 |
| P1 | 重新平衡评分（加入自然增长、士气计分），用模拟脚本看 A–D 的分布 | M4、M5 |
| P1 | computeFinalOutcome 改为纯函数；补上覆盖 H1–H3 的测试，A10 改成真实的 DOM 检查 | M6、L5 |
| P1 | 用页内弹窗替换 alert | X1 |
| P2 | 常量统一读 PRD_CONFIG；清理死代码；无障碍（button/键盘/允许缩放）；修 SOP 底栏遮挡；一键 Waive 加二次确认；localStorage 存档；正式版关闭 debug | L 系列、X1、X2 |

## 9. 文件清单
- agy 原始输出：/workspace/manager-edition-review/agy-output/review.md（完整），review-run1-plan-incomplete.md（plan 模式不完整），stderr.log，diag.log
- 验证脚本：/workspace/manager-edition-review/agy-output/t.js、t2.js、t3.js
- 原件 sha256：/workspace/manager-edition-review/agy-output/sha256-original.txt
