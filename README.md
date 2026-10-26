# 带队吧，总监

纯前端浏览器小游戏（manager-edition，内部版本 4a65d84）。你空降成为智驾量产研发总监：6 个月、6 支队伍、若干管理动作，在过年前把项目送到 SOP。玩法是排兵布阵和制度选择，不写代码、不盯路测。

## 在线试玩

https://samzhang0918-prog.github.io/managerment-test/

## 本地运行

用浏览器直接打开仓库根目录的 `index.html`。

若浏览器限制本地脚本，在仓库根目录起一个静态服务器后再打开：

```bash
python3 -m http.server 8765
```

然后访问 http://localhost:8765/ 。

## 测试

需要 Node.js。在仓库根目录执行：

```bash
node tests/regression.js        # 高危回归
node tests/regression-mid.js    # 中危回归（内部会跑模拟，耗时更长）
node tests/simulate.js 3000     # 全流程模拟，局数可改；加 --json 输出 JSON
```

`regression.js` 和 `regression-mid.js` 可以额外传入一个代码目录，用来测别的副本。开发记录在 `docs/`。
