/**
 * 《带队吧，总监》本地存档模块（localStorage）
 * - 记录历史推演（最近 MAX_HISTORY 局）与管理风格画像图鉴
 * - 纯逻辑、无 DOM 依赖：可注入任意 storage（浏览器 localStorage / Node 内存桩）
 * - 所有读写都容错：隐私模式、file:// 受限、配额已满、数据被篡改时都不会抛异常，
 *   游戏本体不依赖存档，存档不可用时静默降级为本局内存存档
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ArchiveStore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const STORAGE_KEY = 'manager_edition_archive_v1';
  const SCHEMA_VERSION = 1;
  const MAX_HISTORY = 20;
  const AXIS_KEYS = ['safety', 'function', 'delivery', 'cost', 'morale'];

  function emptyArchive() {
    return { version: SCHEMA_VERSION, history: [], profiles: {} };
  }

  function toNum(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function toStr(v, maxLen) {
    return String(v === undefined || v === null ? '' : v).slice(0, maxLen);
  }

  /** 清洗单条历史记录；不合法返回 null */
  function sanitizeRun(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const profileId = toStr(raw.profileId, 32);
    if (!profileId) return null;
    const axes = {};
    AXIS_KEYS.forEach(k => {
      axes[k] = toNum(raw.axes && raw.axes[k], 0);
    });
    return {
      ts: toNum(raw.ts, 0),
      projectName: toStr(raw.projectName, 16),
      seed: toNum(raw.seed, 0),
      letter: toStr(raw.letter, 2),
      overall: toNum(raw.overall, 0),
      isBrick: !!raw.isBrick,
      profileId,
      profileTitle: toStr(raw.profileTitle, 32),
      axes,
      debug: !!raw.debug
    };
  }

  /** 清洗整份存档：容忍缺字段 / 类型错误 / 被手改 */
  function sanitizeArchive(raw) {
    const out = emptyArchive();
    if (!raw || typeof raw !== 'object' || raw.version !== SCHEMA_VERSION) return out;

    if (Array.isArray(raw.history)) {
      raw.history.forEach(item => {
        const run = sanitizeRun(item);
        if (run) out.history.push(run);
      });
      out.history = out.history.slice(0, MAX_HISTORY);
    }

    if (raw.profiles && typeof raw.profiles === 'object' && !Array.isArray(raw.profiles)) {
      Object.keys(raw.profiles).forEach(id => {
        const p = raw.profiles[id];
        if (!p || typeof p !== 'object') return;
        const count = Math.max(0, Math.floor(toNum(p.count, 0)));
        if (count < 1) return;
        out.profiles[toStr(id, 32)] = {
          count,
          firstAt: toNum(p.firstAt, 0),
          lastAt: toNum(p.lastAt, 0),
          bestOverall: toNum(p.bestOverall, 0)
        };
      });
    }
    return out;
  }

  /** 取浏览器 localStorage；访问本身就可能抛 SecurityError，所以要包 try */
  function getBrowserStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch (e) { /* 不可用，走内存降级 */ }
    return null;
  }

  function createStore(storageLike) {
    const storage = storageLike === undefined ? getBrowserStorage() : storageLike;
    let memoryArchive = null; // 存储不可用 / 写入失败时的本局内存兜底

    function isAvailable() {
      if (!storage) return false;
      try {
        const probe = '__manager_edition_probe__';
        storage.setItem(probe, '1');
        storage.removeItem(probe);
        return true;
      } catch (e) {
        return false;
      }
    }

    function load() {
      if (memoryArchive) return memoryArchive;
      if (!storage) return emptyArchive();
      try {
        const text = storage.getItem(STORAGE_KEY);
        if (!text) return emptyArchive();
        return sanitizeArchive(JSON.parse(text));
      } catch (e) {
        return emptyArchive(); // JSON 损坏等：当作空档案，下次写入会覆盖
      }
    }

    function persist(archive) {
      memoryArchive = archive; // 始终保留内存副本，写盘失败也不影响本局展示
      if (!storage) return false;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(archive));
        memoryArchive = null; // 写盘成功，以磁盘为准
        return true;
      } catch (e) {
        return false;
      }
    }

    /**
     * 记录一局结果。
     * @returns {{archive, saved: boolean, newlyUnlocked: boolean, unlockedCount: number}}
     */
    function recordRun(run) {
      const entry = sanitizeRun(Object.assign({ ts: Date.now() }, run));
      const archive = load();
      if (!entry) {
        return { archive, saved: false, newlyUnlocked: false, unlockedCount: Object.keys(archive.profiles).length };
      }

      const prev = archive.profiles[entry.profileId];
      const newlyUnlocked = !prev;
      archive.profiles[entry.profileId] = {
        count: (prev ? prev.count : 0) + 1,
        firstAt: prev ? prev.firstAt : entry.ts,
        lastAt: entry.ts,
        bestOverall: prev ? Math.max(prev.bestOverall, entry.overall) : entry.overall
      };

      archive.history.unshift(entry); // 最新在前
      archive.history = archive.history.slice(0, MAX_HISTORY);

      const saved = persist(archive);
      return {
        archive,
        saved,
        newlyUnlocked,
        unlockedCount: Object.keys(archive.profiles).length
      };
    }

    function clear() {
      memoryArchive = null;
      if (!storage) return true;
      try {
        storage.removeItem(STORAGE_KEY);
        return true;
      } catch (e) {
        return false;
      }
    }

    return { load, recordRun, clear, isAvailable };
  }

  return {
    STORAGE_KEY,
    SCHEMA_VERSION,
    MAX_HISTORY,
    createStore,
    sanitizeArchive
  };
});
