# manager-edition《带队吧，总监》修复记录（H1–H3 + A10）

> 日期：2026-10-26（北京时间）｜执行：全栈开发 + Antigravity CLI（agy）｜目录：修复工作副本（git）｜原件未改动

## 0. 结论先行

| 项 | 结论 |
|---|---|
| 范围 | 按 Sam 拍板收窄为 **H1、H2、H3 + 自带测试 A10 真实断言**。M1–M6 与低危项**均未改动** |
| 结果 | 3 个高危全部修复，A10 改为真实断言；回归 7/7 通过（基线 1/7，只有自带测试那条通过）；3000 代号 × 3 种策略共 9000 局：**卡死 0，负预算导致卡死 0，SOP 确认异常 0** |
| 状态 | 已自审 diff，并用 gemini-4-argon-high 做终审，结论为「可发布测试」（只提了 3 条低危观察）。**尚待「测试」验收，验收前不算可发布** |

## 1. 需求和目标
- 来源：Sam（经产品经理/大福）。修复评审文档（评审副本中的 `docs/manager-edition-评审.md`，未纳入本仓库）中的 H1–H3；把 runPRDTests 里写死为通过的 A10 改成真实断言。
- 约束：改动最小，不改玩法设计意图；原件和评审副本都不动；每类修复单独提交。

## 2. 技术方案
| 问题 | 方案 |
|---|---|
| H1 事件池抽空卡死 | 引擎新增 `advanceMonth()`，月份推进逻辑统一走这里；`executeMonthlyAction` 抽到 0 个事件时直接推进；新增 `readyForSOP` 状态位（M6 结束时置 true）。界面在没有事件时不再切到空事件页，`handleMonthCompleteOrSOP` 按 `readyForSOP` 进入 SOP |
| H2 负预算卡死 | 采用最小方案：**允许预算为负，但不阻塞流程**，保留原有的「资金链断裂」横幅，不新增破产结局。引擎和界面的可执行判断都改为 `cost===0 \|\| budget>=cost` |
| H3 SOP 修复 | 新增 `getOtherSelectedRepairCost()`，`canRepair` 和 `setSOPDecision` 都按「预算 − 其它已选修复的累计费用」校验；`confirmSOPRelease` 先汇总再校验，不足时抛错且不改任何状态，通过后一次性扣款和加延期；新增 `sopConfirmed` 防重复确认；界面用 try/catch 接住异常，在 SOP 页内的 `#sop-error-banner` 提示条显示错误（不用 alert） |
| A10 | 引擎新增 `getPublicTeamCards()`，只暴露 id/dir/name/headcount/salary_month/years/blurb，组队页改用它渲染；A10 断言公开视图不含 true_power/traits/fake_bias 字段，展示文本也不泄露这些值 |

## 3. 使用的模型（agy 逐步记录）
| 步骤 | agy 版本 | 模型 | 结果 |
|---|---|---|---|
| 第 1 次修复尝试（全量范围，默认模式） | 1.4.5 | claude-opus-5-5-high, --effort high | 读 workspace 外的文件被 headless 权限拒绝，无输出、无改动。当时 box 上 Gemini 报 `User location is not supported`，所以按规则改用 Claude |
| 第 2 次（--mode accept-edits） | 1.4.5 | claude-opus-5-5-high | 范围收窄后中止，无改动 |
| 第 3 次（收窄范围） | — | claude-opus-5-5-high | agy 试图调用终端命令被拒，无改动 |
| 第 4 次 | — | claude-opus-5-5-high | 报 `RESOURCE_EXHAUSTED 429 Individual quota reached`，无改动 |
| 连通性测试 `agy -p "回复 OK"` | 1.4.7（已自动升级） | gemini-4-argon-high | 返回 OK，Gemini 已恢复 |
| **正式修复（产出全部代码改动）** | 1.4.7 | **gemini-4-argon-high**, --effort high, --mode accept-edits | 成功，摘要见 agy-output/fix-summary.md |
| 终审 diff（只读） | 1.4.7 | gemini-4-argon-high, --effort high | 结论「可发布测试」，见 agy-output/final-review.md |

全程没有使用 --dangerously-skip-permissions，也没有修改本机 Antigravity CLI 配置。node 测试、模拟和 git 提交拆分都由我在 shell 里完成。

## 4. 主要改动
| 问题 | 文件:行（修复后） | 改法 | 提交 |
|---|---|---|---|
| H1 | game-engine.js L210、L362–371、L375、L445–461、L820–823；app.js L421–424、L459、L484 | advanceMonth/readyForSOP；无事件时直接推进；界面按事件有无切页 | b3e15fc |
| H2 | game-engine.js L395；app.js L301 | `cost===0 \|\| budget>=cost` | 61d6df8 |
| H3 | game-engine.js L222、L1053–1054、L1068–1094、L1132–1162；app.js L497、L503–506、L565–583；index.html L270；style.css L849–857 | 累计校验、原子扣款、sopConfirmed、页内提示条 | d125a10 |
| A10 | game-engine.js L305–316、L1513–1531；app.js L78 | getPublicTeamCards + 真实断言 | da7132a |
| 测试/文档 | tests/regression.js、tests/simulate.js、docs/ | 新增 | 最后一个提交 |

## 5. 运行方法
| 用途 | 命令 |
|---|---|
| 页面 | 在仓库根目录执行 `python3 -m http.server 8765`，打开 http://localhost:8765/（直接打开 index.html 也可以） |
| 回归测试 | `node tests/regression.js`（加目录参数可测别的版本，例如基线 worktree） |
| 全流程模拟 | `node tests/simulate.js 3000` |
| 自带测试 | `node -e "console.log(require('./game-engine.js').runPRDTests())"` |
| 修前对比 | 把基线检出到临时目录后执行 `node tests/regression.js <临时目录>`（示例基线 `f93e6c1`） |

## 6. 测试结果
| 检查 | 修前（f93e6c1） | 修后（HEAD） |
|---|---|---|
| H1：3000 代号按最便宜策略跑完 6 个月 | 卡死 175 | 卡死 0 |
| H2：300 局高薪阵容 + 每月最贵动作 | 300 局出现负预算，其中 215 局卡死 | 300 局出现负预算，卡死 0 |
| H3 累计校验：预算 1000 选 rain_ped/ghost/brake | 3 项全接受（1950） | 只接受第 1 项（600） |
| H3 原子化：强行写入超额决策后确认 | 抛错，但预算 1000→400、延期 0→2 | 抛错，预算和延期都不变 |
| H3 防重复：确认两次 | 第二次又扣 350 | 第二次抛错，不扣款 |
| H3 页内提示（静态检查） | 无 | 有 #sop-error-banner，确认处有 try/catch |
| runPRDTests A1–A10 | 10/10（A10 写死） | 10/10（A10 是真实断言） |
| 回归合计 | 1/7 | **7/7** |
| 全流程模拟 3000 代号 × 3 策略（最便宜/最贵/随机，事件随机选，SOP 随机修/放） | 卡死 397/308/1346（其中 SOP 确认抛错 218/110/1167） | **卡死 0/0/0**，负预算出现 0/2350/240 局，均未卡死 |
| `node --check` 3 个 js 文件 | — | 全部通过 |
| headless Chrome 加载页面 | — | 无 Uncaught/语法错误；5 个静态文件都返回 200 |

修后等级分布（随机修/放 SOP，仅作参考，本轮未调平衡）：

| 策略 | A | B | C | D | 变砖 |
|---|---|---|---|---|---|
| 最便宜 | 0 | 11 | 616 | 444 | 1929 |
| 最贵 | 0 | 79 | 227 | 37 | 2657 |
| 随机 | 0 | 123 | 428 | 77 | 2372 |

## 7. 已知问题与未修项
| # | 严重度 | 说明 |
|---|---|---|
| M1 | 中 | `audited.fs` 字段名写错（未修） |
| M2 | 中 | 事件升降级被 updateStatusGates 覆盖（未修） |
| M3 | 中 | 目标对齐灯门槛不可达（未修） |
| M4 | 中 | 战力分偏低，模拟中 A 级为 0（未修，本轮未做平衡） |
| M5 | 中 | 士气不计分（未修） |
| M6 | 中 | computeFinalOutcome 会修改状态，延期被重复惩罚（未修；H3 的防重复确认可以避免从界面重复触发） |
| N1 | 低（本轮新增观察） | 本月没有突发事件时，过渡按钮仍显示「面对突发管理困境」，点击后直接进入下月或 SOP |
| N2 | 低 | 确认放行后，从 API 仍能调用 setSOPDecision，getSOPStatus 的 projectedBudget 会在已扣款的预算上再算一次；界面上走不到这条路径 |
| N3 | 低 | A10 用数字子串匹配，以后改数值可能误报 |
| X1/X2、L1–L13 | 低 | 事件结果用 alert、没有存档、?debug=1 暴露真值等，见评审文档，均未修 |
