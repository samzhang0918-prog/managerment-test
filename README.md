# 带队吧，总监

纯前端浏览器小游戏（manager-edition）。你空降成为智驾量产研发总监：6 个月、6 支队伍、若干管理动作，在过年前把项目送到 SOP。玩法是排兵布阵和制度选择，不写代码、不盯路测。

## 核心特性

- **排兵布阵与管理抉择**：6 大研发槽位配置，8 项核心管理手段（KPI 军令状、Badcase 专班、考核指挥棒、隔级 1-on-1、CCB 挡枪、无责复盘等）。
- **沉浸式高管对话**：突发管理困境由具体角色（车企高管、大老板、一线架构师、安全负责人等）提出，决策后以双向对话气泡呈现组织真实反应，告别原生弹窗。
- **质量红线严谨决断**：过年前 SOP 放行门禁，「一键全部 Waive」内置二次高危警示，直观展示未审计盲点与带病放行风险。
- **本地存档与画像图鉴**：基于 `localStorage` 自动记录最近 20 局推演成绩（五维体检报告：安全、战力、交付、成本、士气），并解锁 5 大管理风格画像图鉴。支持无痕模式内存自动降级。

## 在线试玩

https://samzhang0918-prog.github.io/managerment-test/

站点由 `.github/workflows/pages.yml` 从 `main` 根目录部署。仓库管理员需要先打开 Settings → Pages → Build and deployment，把 Source 选成 **GitHub Actions**，然后在 Actions 里重跑 “Deploy static content to Pages”。也可以改成 Deploy from a branch，分支选 `main`、目录选 `/ (root)`；那种情况下不必跑上面的 workflow。

## 本地运行

用浏览器直接打开仓库根目录的 `index.html`。

若浏览器限制本地脚本，在仓库根目录起一个静态服务器后再打开：

```bash
python3 -m http.server 8765
```

然后访问 http://localhost:8765/ 。

## 部署到魔搭社区（ModelScope）

1. 在魔搭创建创空间（Studio），类型/SDK 选择 **Static（静态网页）**，配置选择免费 CPU。
2. 将本仓库根目录的所有文件（包含 `index.html`、`storage.js` 等）直接推送到魔搭的 Git 仓库即可秒级上线。

## 测试

需要 Node.js。在仓库根目录执行：

```bash
node tests/regression.js        # 高危回归（7 项全通）
node tests/regression-mid.js    # 中危与规则回归（29 项全通，内部会跑模拟）
node tests/archive.js           # 本地存档与画像图鉴模块测试（18 项全通）
node tests/simulate.js 3000     # 全流程蒙特卡洛模拟，局数可改；加 --json 输出 JSON
node -e "console.log(require('./game-engine.js').runPRDTests())" # PRD A1–A10 核心验收测试
```

`regression.js` 和 `regression-mid.js` 可以额外传入一个代码目录，用来测别的副本。开发与评审记录在 `docs/`。
