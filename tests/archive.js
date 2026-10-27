// 本地存档模块单元测试：node tests/archive.js
// 覆盖：记录/排序/截断、画像解锁与计数、数据篡改容错、存储不可用降级、写盘失败兜底、清空
const path = require('path');
const dir = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const { createStore, STORAGE_KEY, MAX_HISTORY, sanitizeArchive } = require(path.join(dir, 'storage.js'));

let passed = 0;
let failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log(`PASS ${name}${detail ? ' - ' + detail : ''}`); }
  else { failed++; console.log(`FAIL ${name}${detail ? ' - ' + detail : ''}`); }
}

// 内存版 storage 桩
function fakeStorage(opts = {}) {
  const data = {};
  return {
    data,
    getItem(k) { if (opts.throwOnGet) throw new Error('denied'); return k in data ? data[k] : null; },
    setItem(k, v) { if (opts.throwOnSet) throw new Error('quota'); data[k] = String(v); },
    removeItem(k) { delete data[k]; }
  };
}

function run(overrides = {}) {
  return Object.assign({
    ts: 1000, projectName: '代号-麒麟', seed: 1, letter: 'B', overall: 72, isBrick: false,
    profileId: 'shield', profileTitle: '赋能型破局者',
    axes: { safety: 80, function: 70, delivery: 60, cost: 75, morale: 85 }
  }, overrides);
}

// 1. 记录与新解锁
{
  const store = createStore(fakeStorage());
  const r1 = store.recordRun(run());
  check('首局记录：saved 且新解锁', r1.saved && r1.newlyUnlocked && r1.unlockedCount === 1);
  const r2 = store.recordRun(run({ ts: 2000, overall: 90, letter: 'A' }));
  check('同画像再次达成：不再是新解锁，计数 2，最佳分取高值',
    !r2.newlyUnlocked && r2.archive.profiles.shield.count === 2 && r2.archive.profiles.shield.bestOverall === 90);
  check('firstAt 保持首次、lastAt 更新', r2.archive.profiles.shield.firstAt === 1000 && r2.archive.profiles.shield.lastAt === 2000);
  const r3 = store.recordRun(run({ ts: 3000, profileId: 'blind', profileTitle: '办公室里的盲人总监' }));
  check('不同画像：新解锁，已解锁 2 种', r3.newlyUnlocked && r3.unlockedCount === 2);
  check('历史最新在前', store.load().history[0].profileId === 'blind' && store.load().history.length === 3);
}

// 2. 历史截断
{
  const store = createStore(fakeStorage());
  for (let i = 0; i < MAX_HISTORY + 5; i++) store.recordRun(run({ ts: i + 1, seed: i }));
  const h = store.load().history;
  check('历史最多保留 MAX_HISTORY 条且保留最新', h.length === MAX_HISTORY && h[0].seed === MAX_HISTORY + 4, `len=${h.length}`);
  check('画像计数不受历史截断影响', store.load().profiles.shield.count === MAX_HISTORY + 5);
}

// 3. 跨实例持久化
{
  const st = fakeStorage();
  createStore(st).recordRun(run());
  const again = createStore(st).load();
  check('新实例可读回已存档案', again.history.length === 1 && again.profiles.shield.count === 1);
}

// 4. 数据篡改 / 损坏容错
{
  const st = fakeStorage();
  st.setItem(STORAGE_KEY, '{not json');
  check('JSON 损坏 → 空档案不抛错', createStore(st).load().history.length === 0);

  st.setItem(STORAGE_KEY, JSON.stringify({ version: 999, history: [run()], profiles: {} }));
  check('版本号不符 → 空档案', createStore(st).load().history.length === 0);

  const tampered = {
    version: 1,
    history: [null, 5, { profileId: '' }, run({ projectName: 'x'.repeat(100), overall: 'abc' })],
    profiles: { shield: { count: -3 }, blind: { count: 2, firstAt: 1, lastAt: 2, bestOverall: 60 }, junk: 'str' }
  };
  const clean = sanitizeArchive(tampered);
  check('非法历史项被剔除、字段被裁剪/归零', clean.history.length === 1 && clean.history[0].projectName.length === 16 && clean.history[0].overall === 0);
  check('非法画像项被剔除，合法项保留', !clean.profiles.shield && !clean.profiles.junk && clean.profiles.blind.count === 2);

  const store = createStore(fakeStorage());
  const r = store.recordRun({ profileId: '' });
  check('缺 profileId 的记录被拒绝且不抛错', r.saved === false && store.load().history.length === 0);
}

// 5. 存储不可用 / 写入失败
{
  const noStore = createStore(null);
  check('无 storage：isAvailable=false', noStore.isAvailable() === false);
  const r = noStore.recordRun(run());
  check('无 storage：saved=false 但本局内存可读', r.saved === false && noStore.load().history.length === 1);

  const quota = createStore(fakeStorage({ throwOnSet: true }));
  const r2 = quota.recordRun(run());
  check('写盘失败（配额）：不抛错，saved=false，内存兜底', r2.saved === false && quota.load().history.length === 1 && quota.isAvailable() === false);

  const denied = createStore(fakeStorage({ throwOnGet: true }));
  check('读取抛错：load 返回空档案不抛错', denied.load().history.length === 0);
}

// 6. 清空
{
  const st = fakeStorage();
  const store = createStore(st);
  store.recordRun(run());
  store.clear();
  check('clear 后档案为空且存储键被移除', store.load().history.length === 0 && !(STORAGE_KEY in st.data));
}

console.log(`${passed}/${passed + failed} 通过`);
process.exit(failed ? 1 : 0);
