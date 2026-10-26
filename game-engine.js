/**
 * 《带队吧，总监》（智驾量产沙盘·纯管理者版）核心确定性沙盘引擎
 * 严格基于 UTF-8 SHA-256 + Mulberry32 确定性伪随机流，零 Math.random()
 * 遵循硬结算顺序与管理学维度评估模型
 */

(function (global) {
  const Data = typeof module !== 'undefined' && module.exports
    ? require('./game-data.js')
    : global.GameData;

  const {
    PRD_CONFIG,
    DIRECTIONS,
    TRAIT_META,
    TEAM_CARDS,
    MONTHLY_ACTIONS,
    ROAD_SCENE_OPTIONS,
    EMERGENCY_EVENTS,
    SOP_ITEMS,
    BRICK_SUBTITLES,
    PENALTY_BRICK_SUBTITLE,
    MANAGEMENT_PROFILES
  } = Data;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function deepClone(val) {
    return JSON.parse(JSON.stringify(val));
  }

  // 纯 JS 同步标准 UTF-8 SHA-256
  function utf8ToBytes(str) {
    if (typeof TextEncoder !== 'undefined') {
      return Array.from(new TextEncoder().encode(str));
    }
    const utf8 = unescape(encodeURIComponent(str));
    const bytes = [];
    for (let i = 0; i < utf8.length; i++) {
      bytes.push(utf8.charCodeAt(i));
    }
    return bytes;
  }

  function sha256Bytes(asciiBytes) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    let H = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    const bitLen = asciiBytes.length * 8;
    const msg = asciiBytes.slice();
    msg.push(0x80);
    while ((msg.length % 64) !== 56) {
      msg.push(0);
    }
    const hi = Math.floor(bitLen / 0x100000000);
    const lo = bitLen >>> 0;
    msg.push((hi >>> 24) & 0xff, (hi >>> 16) & 0xff, (hi >>> 8) & 0xff, hi & 0xff);
    msg.push((lo >>> 24) & 0xff, (lo >>> 16) & 0xff, (lo >>> 8) & 0xff, lo & 0xff);

    const W = new Array(64);
    for (let i = 0; i < msg.length; i += 64) {
      for (let t = 0; t < 16; t++) {
        const j = i + t * 4;
        W[t] = ((msg[j] << 24) | (msg[j + 1] << 16) | (msg[j + 2] << 8) | msg[j + 3]) >>> 0;
      }
      for (let t = 16; t < 64; t++) {
        const s0 = (rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3)) >>> 0;
        const s1 = (rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10)) >>> 0;
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
      }

      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
        const ch = ((e & f) ^ (~e & g)) >>> 0;
        const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
        const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
        const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        const temp2 = (S0 + maj) >>> 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }

      H[0] = (H[0] + a) >>> 0;
      H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0;
      H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0;
      H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0;
      H[7] = (H[7] + h) >>> 0;
    }

    const out = [];
    for (let i = 0; i < 8; i++) {
      out.push(
        (H[i] >>> 24) & 0xff,
        (H[i] >>> 16) & 0xff,
        (H[i] >>> 8) & 0xff,
        H[i] & 0xff
      );
    }
    return out;
  }

  function rotr(n, b) {
    return ((n >>> b) | (n << (32 - b))) >>> 0;
  }

  function computeSeedFromName(projectName) {
    const bytes = sha256Bytes(utf8ToBytes(projectName));
    const hi = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    const lo = ((bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7]) >>> 0;
    return (hi ^ lo) >>> 0;
  }

  class Mulberry32 {
    constructor(seedUint32) {
      this.state = seedUint32 >>> 0;
    }

    nextUint32() {
      let t = (this.state += 0x6d2b79f5) | 0;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return (t ^ (t >>> 14)) >>> 0;
    }

    nextFloat() {
      return this.nextUint32() / 4294967296;
    }
  }

  function rngU32(seed, tag) {
    const bytes = sha256Bytes(utf8ToBytes(`${seed}:${tag}`));
    const u32 = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    const m = new Mulberry32((seed ^ u32) >>> 0);
    return m.nextUint32();
  }

  class ManagerSandboxGameEngine {
    constructor() {
      this.reset();
    }

    reset() {
      this.projectName = PRD_CONFIG.default_project_name;
      this.seed = 0;
      this.rng = null;

      this.state = {
        month: 1,
        budget: 8000,
        payroll_monthly: 0,
        morale: 72,
        market: 70,
        oem_relation: 60,
        delay_weeks: 0,
        spec_gate: 'risk',
        function_freeze: 'risk',
        freeze_mod: 0,
        safety_release: 'risk',
        feature_cut: [],
        audited: { road: false, data: false, safety: false },
        dirs: {
          perception: { team_id: null, progress: 8, true_quality: 0 },
          planning: { team_id: null, progress: 8, true_quality: 0 },
          fs: { team_id: null, progress: 5, true_quality: 0 },
          data: { team_id: null, progress: 10, true_quality: 0 },
          oem: { team_id: null, progress: 12, true_quality: 0 },
          road: { team_id: null, progress: 10, true_quality: 0 }
        }
      };

      this.teamConfirmed = false;
      this.extraFakeMileage = 0;
      this.extraReportedCorners = 0;
      this.pendingReportedCornersBonus = 0;
      this.safetyActionSucceeded = false;
      this.forcedSafetyStable = false;
      this.oemPleaseToreFreezeThisMonth = false;
      this.oemPleaseActThisMonth = false;
      this.sopRiskModifiers = {
        rain_ped: 0,
        cone: 0,
        ghost: 0,
        gnss: 0,
        brake: 0,
        label: 0
      };

      this.usedEmergencyIds = [];
      this.currentMonthEmergencies = [];
      this.currentEmergencyIndex = 0;
      this.readyForSOP = false;
      this.noOtRotationIndex = 0;

      this.lastActionResult = null;
      this.currentMonthlyReport = null;

      this.sopDecisions = {};
      SOP_ITEMS.forEach(item => {
        this.sopDecisions[item.id] = null;
      });
      this.sopBaseBudget = null;
      this.sopBaseDelayWeeks = 0;
      this.sopConfirmed = false;

      this.choiceHistory = [];
      this.finalOutcome = null;
    }

    initProject(rawName) {
      this.reset();
      const trimmed = (rawName || '').trim().slice(0, 16);
      this.projectName = trimmed.length > 0 ? trimmed : PRD_CONFIG.default_project_name;
      this.seed = computeSeedFromName(this.projectName);
      this.rng = new Mulberry32(this.seed);
      return {
        projectName: this.projectName,
        seed: this.seed
      };
    }

    selectTeamCard(dirId, cardId) {
      if (this.teamConfirmed) {
        throw new Error("团队名单已确认，无法修改组队");
      }
      const dir = DIRECTIONS.find(d => d.id === dirId);
      if (!dir) throw new Error(`未知的职能槽位: ${dirId}`);
      const card = TEAM_CARDS.find(c => c.id === cardId && c.dir === dirId);
      if (!card) throw new Error(`卡片 ${cardId} 不属于槽位 ${dirId}`);

      this.state.dirs[dirId].team_id = cardId;
      return this.getTeamSelectionStatus();
    }

    getTeamSelectionStatus() {
      const selections = {};
      let allSelected = true;
      let totalSalary = 0;
      let totalHeadcount = 0;

      DIRECTIONS.forEach(d => {
        const teamId = this.state.dirs[d.id].team_id;
        if (!teamId) {
          allSelected = false;
          selections[d.id] = null;
        } else {
          const card = TEAM_CARDS.find(c => c.id === teamId);
          selections[d.id] = card;
          totalSalary += card.salary_month;
          totalHeadcount += card.headcount;
        }
      });

      return {
        selections,
        allSelected,
        totalSalary,
        totalHeadcount,
        initialBudget: PRD_CONFIG.initial_budget,
        totalMonths: PRD_CONFIG.total_months
      };
    }

    confirmTeam() {
      const status = this.getTeamSelectionStatus();
      if (!status.allSelected) {
        throw new Error("所有 6 个管理槽位必须全部配置团队，不可空槽！");
      }

      this.state.payroll_monthly = status.totalSalary;
      DIRECTIONS.forEach(d => {
        const card = status.selections[d.id];
        this.state.dirs[d.id].true_quality = card.true_power;
      });

      this.teamConfirmed = true;
      this.updateStatusGates();
      this.refreshMonthlyReport();
      return this.getStateSnapshot();
    }

    getTeamCard(dirId) {
      const teamId = this.state.dirs[dirId].team_id;
      return TEAM_CARDS.find(c => c.id === teamId);
    }

    getPublicTeamCards(dirId = null) {
      const list = dirId ? TEAM_CARDS.filter(c => c.dir === dirId) : TEAM_CARDS;
      return list.map(c => ({
        id: c.id,
        dir: c.dir,
        name: c.name,
        headcount: c.headcount,
        salary_month: c.salary_month,
        years: c.years,
        blurb: c.blurb
      }));
    }

    updateStatusGates() {
      const planningP = this.state.dirs.planning.progress;
      const perceptionP = this.state.dirs.perception.progress;
      const fsP = this.state.dirs.fs.progress;
      const fsQ = this.state.dirs.fs.true_quality;
      const oemRel = this.state.oem_relation;

      // 1. 功能目标对齐 / 需求冻结
      if (this.oemPleaseToreFreezeThisMonth) {
        this.state.function_freeze = 'risk';
      } else {
        const sumP = planningP + perceptionP;
        const { freeze_converging_sum, freeze_stable_sum } = PRD_CONFIG.balance;
        let baseLevel = 0;
        if (sumP >= freeze_stable_sum) {
          baseLevel = 2;
        } else if (sumP >= freeze_converging_sum) {
          baseLevel = 1;
        }
        let finalLevel = clamp(baseLevel + this.state.freeze_mod, 0, 2);
        if (this.oemPleaseActThisMonth && finalLevel > 1) {
          finalLevel = 1;
        }
        const freezeLevels = ['risk', 'converging', 'stable'];
        this.state.function_freeze = freezeLevels[finalLevel];
      }

      // 2. 质量红线 / 安全放行
      if (this.forcedSafetyStable) {
        this.state.safety_release = 'stable';
      } else {
        if (fsQ >= 55 && (this.safetyActionSucceeded || this.state.audited.safety)) {
          this.state.safety_release = 'stable';
        } else if (fsP >= 40 && (this.state.audited.safety || this.safetyActionSucceeded)) {
          this.state.safety_release = 'converging';
        } else {
          this.state.safety_release = 'risk';
        }
      }

      // 3. 车企外部协同节点
      if (oemRel >= 75) {
        this.state.spec_gate = 'stable';
      } else if (oemRel >= 50) {
        this.state.spec_gate = 'converging';
      } else {
        this.state.spec_gate = 'risk';
      }
    }

    applyNaturalProgress() {
      const rate = PRD_CONFIG.balance.natural_progress_rate;
      const moraleMult = this.state.morale < 35 ? 0.75 : 1.0;
      DIRECTIONS.forEach(d => {
        const team = this.getTeamCard(d.id);
        if (!team) return;
        const gain = Math.round(team.true_power * rate * moraleMult);
        this.state.dirs[d.id].progress = clamp(this.state.dirs[d.id].progress + gain, 0, 100);
      });
    }

    advanceMonth() {
      this.currentMonthEmergencies = [];
      this.currentEmergencyIndex = 0;
      if (this.state.month >= PRD_CONFIG.total_months) {
        this.readyForSOP = true;
        return { monthFinished: true, readyForSOP: true };
      }
      this.state.month++;
      return { monthFinished: true, readyForSOP: false };
    }

    executeMonthlyAction(actionId, targetDir = null, extraParam = null) {
      if (!this.teamConfirmed) throw new Error("请先确认团队名单");
      if (this.readyForSOP || this.state.month > PRD_CONFIG.total_months) throw new Error("项目已完成 M6，请进入 SOP 阶段");

      const action = MONTHLY_ACTIONS.find(a => a.id === actionId);
      if (!action) throw new Error(`未知的管理动作: ${actionId}`);

      if (action.requires_dir) {
        if (!targetDir || !action.valid_dirs.includes(targetDir)) {
          throw new Error(`动作 ${action.name} 必须指定合法管理方向: ${action.valid_dirs.join(', ')}`);
        }
      } else {
        targetDir = null;
      }

      if (action.id === 'road_scene') {
        if (!extraParam || !['highway', 'urban_rain'].includes(extraParam)) {
          throw new Error("考核指挥棒动作必须在「总里程 KPI (highway)」与「极限场景 OKR (urban_rain)」中二选一");
        }
      }

      // 1. 扣除管理费用
      if (!(action.cost === 0 || this.state.budget >= action.cost)) {
        throw new Error(`管理预算不足！当前预算 ${this.state.budget} 万，需要 ${action.cost} 万`);
      }
      this.state.budget -= action.cost;

      // 重置当月瞬时标记
      this.oemPleaseToreFreezeThisMonth = false;
      this.oemPleaseActThisMonth = false;

      // 2. 结算管理动作效果
      const actionResult = this.computeActionEffects(action, targetDir, extraParam);
      this.lastActionResult = actionResult;

      // 自然进度推进（动作效果结算之后、updateStatusGates 之前）
      this.applyNaturalProgress();

      // 3. 扣除当月团队固定月薪
      this.state.budget -= this.state.payroll_monthly;

      // 4. 预算超支检查
      let salaryOverrunAlert = false;
      let overrunRatio = 0;
      if (this.state.budget < 0) {
        overrunRatio = Math.abs(this.state.budget) / PRD_CONFIG.initial_budget;
        if (overrunRatio > PRD_CONFIG.salary_overrun_threshold) {
          salaryOverrunAlert = true;
        }
      }

      // 5. 刷新月度汇报
      if (this.pendingReportedCornersBonus > 0) {
        this.extraReportedCorners += this.pendingReportedCornersBonus;
        this.pendingReportedCornersBonus = 0;
      }
      this.updateStatusGates();
      const monthlyReport = this.refreshMonthlyReport();

      // 记录管理操作历史
      this.choiceHistory.push({
        month: this.state.month,
        type: 'action',
        action_id: action.id,
        action_name: action.name,
        target_dir: targetDir,
        extra_param: extraParam,
        result: actionResult,
        budget_after: this.state.budget,
        morale_after: this.state.morale
      });

      // 6. 抽取当月管理困境突发
      this.generateEmergenciesForCurrentMonth();

      let monthFinished = false;
      let readyForSOP = false;
      if (this.currentMonthEmergencies.length === 0) {
        const adv = this.advanceMonth();
        monthFinished = adv.monthFinished;
        readyForSOP = adv.readyForSOP;
      }

      return {
        actionResult,
        monthlyReport,
        salaryOverrunAlert,
        overrunRatio,
        emergencies: this.currentMonthEmergencies,
        monthFinished,
        readyForSOP
      };
    }

    computeActionEffects(action, targetDir, extraParam) {
      let notes = [];
      let multiplier = 1.0;
      let targetTeam = targetDir ? this.getTeamCard(targetDir) : null;

      // 人格特质乘子与组织反噬修正
      if (targetTeam) {
        if (action.id === 'overtime') {
          if (targetTeam.traits.includes('no_ot')) {
            multiplier *= 0.5;
            this.state.morale = clamp(this.state.morale - 4, 0, 100);
            notes.push(`【反内卷抗命】${targetTeam.name} 抵制高压军令状，表面敷衍，考核效果减半，士气额外 -4！`);
          } else if (targetTeam.traits.includes('no_mgmt')) {
            multiplier *= 0.5;
            this.state.morale = clamp(this.state.morale - 4, 0, 100);
            notes.push(`【专家傲气抗命】${targetTeam.name} 摔杯抗议官僚考核，效果减半，士气额外 -4！`);
          }
        }

        if (action.id === 'safety_case') {
          if (targetTeam.traits.includes('no_mgmt')) {
            multiplier *= 0.5;
            notes.push(`【专家坚持底线】${targetTeam.name} 虽嫌形式化流程繁琐（进度折半），但底线质量扎实！`);
          }
        }
      }

      // 车企对接组老好人妥协风险（CCB 挡枪）
      if (action.id === 'cut') {
        const oemTeam = this.getTeamCard('oem');
        if (oemTeam && oemTeam.traits.includes('oem_please')) {
          const cutRoll = rngU32(this.seed, `cut_resist:${this.state.month}`) % 100;
          if (cutRoll < 50) {
            this.state.market = clamp(this.state.market - 6, 0, 100);
            this.state.oem_relation = clamp(this.state.oem_relation - 8, 0, 100);
            this.oemPleaseToreFreezeThisMonth = true;
            this.state.function_freeze = 'risk';
            notes.push("【管理妥协崩塌】你刚宣布 CCB 挡枪，驻场老好人经不住车企施压，私下又答应加回去了！");
            return {
              action_id: action.id,
              success: false,
              notes,
              effects: { market: -6, oem_relation: -8, freeze: 'risk' }
            };
          }
        }
      }

      // 高管督战室作秀
      if (action.id === 'oem_please_act') {
        this.oemPleaseActThisMonth = true;
        const oemTeam = this.getTeamCard('oem');
        if (oemTeam && oemTeam.traits.includes('no_mgmt')) {
          notes.push(`【纪律组抗拒作秀】${oemTeam.name} 拒绝陪笑假大空汇报，外部关系仅小幅提升。`);
        }
      }

      // 团队士气低迷打折
      if (this.state.morale < 35) {
        multiplier *= 0.75;
        notes.push("【团队士气溃败】全员心力交瘁，管理动作推行阻力极大，效果再打 75 折。");
      }

      const effects = {};

      switch (action.id) {
        case 'overtime': {
          const addProgress = Math.round(15 * multiplier);
          this.state.dirs[targetDir].progress = clamp(this.state.dirs[targetDir].progress + addProgress, 0, 100);
          this.state.morale = clamp(this.state.morale - 8, 0, 100);
          effects.progress = addProgress;
          effects.morale = -8;
          notes.push(`推行高压军令状：${targetTeam.name} 表面进度 +${addProgress}，士气 -8。`);
          break;
        }

        case 'data_rain': {
          const addDataP = Math.round(12 * multiplier);
          const addDataQ = Math.round(6 * multiplier);
          const addPerQ = Math.round(4 * multiplier);
          this.state.dirs.data.progress = clamp(this.state.dirs.data.progress + addDataP, 0, 100);
          this.state.dirs.data.true_quality = clamp(this.state.dirs.data.true_quality + addDataQ, 0, 100);
          this.state.dirs.perception.true_quality = clamp(this.state.dirs.perception.true_quality + addPerQ, 0, 100);
          effects.data_progress = addDataP;
          effects.data_quality = addDataQ;
          effects.perception_quality = addPerQ;
          notes.push(`跨部门专班攻关：数据进度 +${addDataP}、真实质量 +${addDataQ}；感知真质量 +${addPerQ}。`);
          break;
        }

        case 'road_scene': {
          if (extraParam === 'highway') {
            const addP = Math.round(6 * multiplier);
            const addQ = Math.round(1 * multiplier);
            this.state.dirs.road.progress = clamp(this.state.dirs.road.progress + addP, 0, 100);
            this.state.dirs.road.true_quality = clamp(this.state.dirs.road.true_quality + addQ, 0, 100);
            this.extraFakeMileage += 20;
            effects.road_progress = addP;
            effects.road_quality = addQ;
            effects.fake_mileage = 20;
            notes.push(`考核总里程 KPI：专挑高速晴天刷量，假周报里程暴增 +20 万公里，路测真质量仅 +${addQ}。`);
          } else {
            const addP = Math.round(10 * multiplier);
            const addRoadQ = Math.round(7 * multiplier);
            const addPerQ = Math.round(3 * multiplier);
            this.state.dirs.road.progress = clamp(this.state.dirs.road.progress + addP, 0, 100);
            this.state.dirs.road.true_quality = clamp(this.state.dirs.road.true_quality + addRoadQ, 0, 100);
            this.state.dirs.perception.true_quality = clamp(this.state.dirs.perception.true_quality + addPerQ, 0, 100);
            this.extraFakeMileage += 4;
            effects.road_progress = addP;
            effects.road_quality = addRoadQ;
            effects.perception_quality = addPerQ;
            effects.fake_mileage = 4;
            notes.push(`考核极限场景 OKR：雨夜与复杂路口摸底，假里程仅 +4 万公里，路测真质量 +${addRoadQ}，感知真质量 +${addPerQ}！`);
          }
          break;
        }

        case 'audit': {
          if (targetDir === 'data') {
            this.state.audited.data = true;
            notes.push("Skip-level 隔级摸底【数据闭环】：查明真实标注争议率，刺破外包刷量泡沫！");
          } else if (targetDir === 'road') {
            this.state.audited.road = true;
            notes.push("Skip-level 隔级摸底【实车路测】：揭晓有效极端恶劣天气里程，掌握一线真实路况！");
          } else if (targetDir === 'fs') {
            this.state.audited.safety = true;
            notes.push("Skip-level 隔级摸底【功能安全】：穿透合规文档墙，摸清真实未关闭 SOTIF 遗留项！");
          }
          effects.audited = targetDir;
          break;
        }

        case 'cut': {
          this.state.market = clamp(this.state.market - 12, 0, 100);
          if (!this.state.feature_cut.includes('complex_intersection')) {
            this.state.feature_cut.push('complex_intersection');
          }
          const addPlanP = Math.round(8 * multiplier);
          this.state.dirs.planning.progress = clamp(this.state.dirs.planning.progress + addPlanP, 0, 100);
          effects.market = -12;
          effects.planning_progress = addPlanP;
          effects.feature_cut = 'complex_intersection';
          notes.push(`CCB 机制挡枪成功：顶住外部非标插单，市场暂时抱怨满意度 -12，但规控研发心流受保护，进度 +${addPlanP}。`);
          break;
        }

        case 'safety_case': {
          const addFsP = Math.round(14 * multiplier);
          const addFsQ = Math.round(8 * multiplier);
          this.state.dirs.fs.progress = clamp(this.state.dirs.fs.progress + addFsP, 0, 100);
          this.state.dirs.fs.true_quality = clamp(this.state.dirs.fs.true_quality + addFsQ, 0, 100);
          this.state.morale = clamp(this.state.morale - 3, 0, 100);
          this.safetyActionSucceeded = true;
          effects.fs_progress = addFsP;
          effects.fs_quality = addFsQ;
          effects.morale = -3;
          notes.push(`推行无责复盘机制：安全进度 +${addFsP}，系统真实底线质量大幅 +${addFsQ}！`);
          break;
        }

        case 'oem_please_act': {
          const oemTeam = this.getTeamCard('oem');
          let addOemRel = 12;
          if (oemTeam && oemTeam.traits.includes('no_mgmt')) {
            addOemRel = 4;
          }
          this.state.oem_relation = clamp(this.state.oem_relation + addOemRel, 0, 100);
          this.state.market = clamp(this.state.market + 8, 0, 100);

          this.state.freeze_mod = clamp(this.state.freeze_mod - 1, -2, 2);
          this.updateStatusGates();

          const cutIdx = this.state.feature_cut.indexOf('complex_intersection');
          if (cutIdx >= 0) {
            this.state.feature_cut.splice(cutIdx, 1);
            notes.push("高管督战室妥协：原先好不容易砍掉的城区复杂场景被车企重新塞回排期！");
          }

          effects.oem_relation = addOemRel;
          effects.market = 8;
          notes.push(`成立高管督战室迎合演示：车企关系 +${addOemRel}，表面满意 +8，但打乱研发节奏，功能收敛度倒退！`);
          break;
        }

        case 'noop': {
          notes.push("本月管理者充分授权，不做额外行政干预，静观团队自主运转。");
          break;
        }
      }

      return {
        action_id: action.id,
        success: true,
        multiplier,
        notes,
        effects
      };
    }

    refreshMonthlyReport() {
      const p = this.state.dirs.perception.progress;
      const r = this.state.dirs.road.progress;
      const n = this.state.dirs.planning.progress;
      const d = this.state.dirs.data.progress;
      const fsP = this.state.dirs.fs.progress;

      const pTeam = this.getTeamCard('perception');
      const rTeam = this.getTeamCard('road');
      const nTeam = this.getTeamCard('planning');
      const dTeam = this.getTeamCard('data');
      const oemTeam = this.getTeamCard('oem');
      const fsTeam = this.getTeamCard('fs');

      const pBias = (pTeam && pTeam.fake_bias.reported_coverage) || 0;
      const nBias = (nTeam && nTeam.fake_bias.reported_shadow) || 0;
      const dBias = (dTeam && dTeam.fake_bias.reported_corners) || 0;
      const rBonus = (rTeam && rTeam.id === 'r_miles') ? 8 : 0;

      const reported_coverage = clamp(Math.round(55 + p * 0.35 + pBias), 0, 99);
      const reported_mileage_wan = Math.round(3 + r * 0.12 + rBonus + this.extraFakeMileage);
      const reported_shadow = clamp(Math.round(60 + n * 0.3 + nBias), 0, 99);
      const reported_nps = clamp(Math.round(50 + this.state.market * 0.3), 0, 95);
      const reported_corners = Math.round(d * 0.4 + dBias + this.extraReportedCorners);

      // 一线真实工程质量（默认被掩盖，仅 Skip-level 审计后揭开）
      const roadQ = this.state.dirs.road.true_quality;
      const perQ = this.state.dirs.perception.true_quality;
      const planQ = this.state.dirs.planning.true_quality;
      const dataQ = this.state.dirs.data.true_quality;
      const fsQ = this.state.dirs.fs.true_quality;
      const oemQ = this.state.dirs.oem.true_quality;

      const true_urban_rain = Math.round(roadQ * 0.5 + perQ * 0.2);
      const true_preempt = clamp(Math.round(40 - planQ * 0.35), 5, 60);
      const true_label_dispute = clamp(Math.round(48 - dataQ * 0.4), 5, 60);
      const true_sotif_open = clamp(Math.round(22 - fsQ * 0.18), 2, 22);
      const freezePenalty = (this.state.function_freeze === 'risk') ? 3 : 0;
      const true_oem_drift = Math.round((100 - oemQ) * 0.15) + freezePenalty;

      this.currentMonthlyReport = {
        month: this.state.month,
        reported: {
          reported_coverage,
          reported_mileage_wan,
          reported_shadow,
          reported_nps,
          reported_corners
        },
        true_values: {
          true_urban_rain,
          true_preempt,
          true_label_dispute,
          true_sotif_open,
          true_oem_drift
        },
        audited: { ...this.state.audited }
      };

      return this.currentMonthlyReport;
    }

    generateEmergenciesForCurrentMonth() {
      const month = this.state.month;
      let count = 1;

      if (month === PRD_CONFIG.total_months) {
        count = 2;
      } else {
        const doubleRoll = rngU32(this.seed, `emerg_count:${month}`) % 100;
        if (doubleRoll < 20) {
          count = 2;
        }
      }

      const availableEvents = EMERGENCY_EVENTS.filter(e => !this.usedEmergencyIds.includes(e.id));
      const drawn = [];

      for (let i = 0; i < count && availableEvents.length > 0; i++) {
        let totalWeight = 0;
        availableEvents.forEach(e => { totalWeight += e.weight; });
        const roll = rngU32(this.seed, `emerg_draw:${month}:${i}`) % totalWeight;

        let accum = 0;
        let chosenIndex = 0;
        for (let j = 0; j < availableEvents.length; j++) {
          accum += availableEvents[j].weight;
          if (roll < accum) {
            chosenIndex = j;
            break;
          }
        }

        const chosen = availableEvents.splice(chosenIndex, 1)[0];
        this.usedEmergencyIds.push(chosen.id);

        let finalEvent = deepClone(chosen);
        if (chosen.id === 'e_ot_refuse') {
          const noOtTeams = [];
          DIRECTIONS.forEach(d => {
            const card = this.getTeamCard(d.id);
            if (card && card.traits.includes('no_ot')) {
              noOtTeams.push(card);
            }
          });

          if (noOtTeams.length > 0) {
            const rotIdx = this.noOtRotationIndex % noOtTeams.length;
            this.noOtRotationIndex++;
            const t = noOtTeams[rotIdx];
            finalEvent.title = `HRBP 预警：【${t.name}】出现集体「静音式躺平」`;
            finalEvent.body = `考勤与协作系统显示【${t.name}】全员准点卡点下班、周会沉默寡言，对管理指令只回「收到」但无任何主动推进。`;
            finalEvent.affected_team = deepClone(t);
          }
        }

        drawn.push(finalEvent);
      }

      this.currentMonthEmergencies = drawn;
      this.currentEmergencyIndex = 0;
      return drawn;
    }

    resolveEmergency(optionKey) {
      if (!['A', 'B', 'C'].includes(optionKey)) {
        throw new Error("突发决策必须在 A、B、C 中选择");
      }
      if (this.currentEmergencyIndex >= this.currentMonthEmergencies.length) {
        throw new Error("当前月份没有待处理的突发管理困境");
      }

      const currentEvent = this.currentMonthEmergencies[this.currentEmergencyIndex];
      const effectDesc = this.applyEmergencyEffects(currentEvent.id, optionKey, currentEvent);

      this.choiceHistory.push({
        month: this.state.month,
        type: 'emergency',
        event_id: currentEvent.id,
        event_title: currentEvent.title,
        chosen_option: optionKey,
        effect_desc: effectDesc
      });

      this.currentEmergencyIndex++;
      this.updateStatusGates();
      this.refreshMonthlyReport();

      const hasMoreEmergenciesThisMonth = this.currentEmergencyIndex < this.currentMonthEmergencies.length;
      let monthFinished = false;
      let readyForSOP = false;

      if (!hasMoreEmergenciesThisMonth) {
        const adv = this.advanceMonth();
        monthFinished = adv.monthFinished;
        readyForSOP = adv.readyForSOP;
      }

      return {
        eventResolved: currentEvent,
        chosenOption: optionKey,
        effectDesc,
        hasMoreEmergenciesThisMonth,
        nextEmergency: hasMoreEmergenciesThisMonth ? this.currentMonthEmergencies[this.currentEmergencyIndex] : null,
        monthFinished,
        readyForSOP,
        currentState: this.getStateSnapshot()
      };
    }

    applyEmergencyEffects(eventId, optionKey, eventContext) {
      let desc = "";
      switch (eventId) {
        case 'e_oem_add': {
          if (optionKey === 'A') {
            this.state.oem_relation = clamp(this.state.oem_relation - 6, 0, 100);
            this.state.market = clamp(this.state.market - 4, 0, 100);
            this.state.freeze_mod = clamp(this.state.freeze_mod + 1, -2, 2);
            this.updateStatusGates();
            desc = "用 CCB 排期顶回外部非标插单：车企关系 -6，市场满意 -4，保护了团队研发节奏，目标收敛升一级。";
          } else if (optionKey === 'B') {
            this.state.dirs.planning.progress = clamp(this.state.dirs.planning.progress - 8, 0, 100);
            this.state.market = clamp(this.state.market + 6, 0, 100);
            desc = "向下施压强令全盘接下：研发心流被打断，规控进度 -8，市场表面满意 +6。";
          } else {
            this.state.oem_relation = clamp(this.state.oem_relation + 4, 0, 100);
            this.sopRiskModifiers.cone += 8;
            this.sopRiskModifiers.ghost += 8;
            desc = "暗示团队做假演示应付高管：车企关系 +4，但纵容了弄虚作假，SOP 施工与鬼探头真实风险各激增 +8！";
          }
          break;
        }

        case 'e_iface': {
          if (optionKey === 'A') {
            this.state.dirs.perception.progress = clamp(this.state.dirs.perception.progress + 3, 0, 100);
            this.state.dirs.planning.progress = clamp(this.state.dirs.planning.progress + 3, 0, 100);
            this.state.morale = clamp(this.state.morale + 4, 0, 100);
            desc = "主持架构契约评审，厘清 RACI 权责：对事不对人，感知与规控进度各 +3，士气 +4。";
          } else if (optionKey === 'B') {
            this.state.dirs.perception.progress = clamp(this.state.dirs.perception.progress + 4, 0, 100);
            this.state.dirs.planning.progress = clamp(this.state.dirs.planning.progress - 6, 0, 100);
            this.state.morale = clamp(this.state.morale - 4, 0, 100);
            desc = "公开偏袒汇报好看的感知组：感知 +4，但规控极度心寒进度 -6，士气 -4。";
          } else {
            this.state.morale = clamp(this.state.morale - 8, 0, 100);
            desc = "嫌他们吵闹各打五十大板：矛盾转入地下，冷暴力蔓延，团队士气重挫 -8。";
          }
          break;
        }

        case 'e_no_rain': {
          if (optionKey === 'A') {
            this.state.morale = clamp(this.state.morale + 3, 0, 100);
            this.state.dirs.road.progress = clamp(this.state.dirs.road.progress - 2, 0, 100);
            desc = "制度化倾斜补贴与轮休：关爱一线，士气 +3，路测进度因轮休小幅 -2。";
          } else if (optionKey === 'B') {
            this.state.morale = clamp(this.state.morale - 12, 0, 100);
            this.state.dirs.road.progress = clamp(this.state.dirs.road.progress + 4, 0, 100);
            desc = "通报批评扣发奖金：强行出车进度 +4，但引发强烈怨气，团队士气暴跌 -12！";
          } else {
            const roadTeam = this.getTeamCard('road');
            let mult = 1.0;
            if (roadTeam && (roadTeam.traits.includes('no_ot') || roadTeam.traits.includes('no_mgmt'))) {
              mult = 0.5;
            }
            const addP = Math.round(15 * mult);
            this.state.dirs.road.progress = clamp(this.state.dirs.road.progress + addP, 0, 100);
            this.state.morale = clamp(this.state.morale - 8, 0, 100);
            desc = `下达行政命令强推雨夜加班：路测进度 +${addP}（含特质抗命乘子），士气 -8。`;
          }
          break;
        }

        case 'e_label': {
          if (optionKey === 'A') {
            this.state.budget -= 60;
            this.state.dirs.data.true_quality = clamp(this.state.dirs.data.true_quality + 8, 0, 100);
            desc = "果断整顿考核体系与供应商：刮骨疗毒，消耗预算 60 万，数据闭环真质量扎实 +8！";
          } else if (optionKey === 'B') {
            this.state.dirs.data.true_quality = clamp(this.state.dirs.data.true_quality - 6, 0, 100);
            this.pendingReportedCornersBonus += 10;
            desc = "压下举报维持周报繁荣：数据真质量 -6，但下月假周报闭环数将再虚增 +10。";
          } else {
            this.state.audited.data = true;
            desc = "启动 Skip-level 隔级摸底：免费穿透数据闭环真实水位，查明真实标注争议率！";
          }
          break;
        }

        case 'e_sign': {
          if (optionKey === 'A') {
            this.state.dirs.fs.progress = clamp(this.state.dirs.fs.progress + 2, 0, 100);
            this.state.morale = clamp(this.state.morale + 2, 0, 100);
            desc = "尊重专业权威守住底线：安全进度稳健 +2，士气 +2，赢得技术骨干敬畏。";
          } else if (optionKey === 'B') {
            this.state.dirs.fs.true_quality = clamp(this.state.dirs.fs.true_quality - 10, 0, 100);
            this.state.dirs.fs.progress = clamp(this.state.dirs.fs.progress + 8, 0, 100);
            this.state.morale = clamp(this.state.morale - 6, 0, 100);
            desc = "撤换老专家找听话的人代签：进度表面 +8，但安全真质量暴跌 -10，士气 -6。";
          } else {
            this.forcedSafetyStable = true;
            this.sopRiskModifiers.brake += 15;
            desc = "动用管理者特权强行代签：安全节点表面变绿，但摧毁了敬畏心，SOP 冗余制动真实风险激增 +15！";
          }
          break;
        }

        case 'e_competitor': {
          if (optionKey === 'A') {
            desc = "做好向上管理顶住焦虑：向老板客观拆解技术节奏，做团队减震器，无负面冲击。";
          } else if (optionKey === 'B') {
            this.oemPleaseActThisMonth = true;
            this.state.market = clamp(this.state.market + 8, 0, 100);
            this.state.freeze_mod = clamp(this.state.freeze_mod - 1, -2, 2);
            this.updateStatusGates();
            desc = "当焦虑二传手连夜改排期：朝令夕改，等同启动高管督战室，功能收敛度倒退！";
          } else {
            this.state.market = clamp(this.state.market + 5, 0, 100);
            desc = "抽调骨干通宵赶制对比 PPT：表面市场口碑假值 +5，徒增团队形式主义内耗。";
          }
          break;
        }

        case 'e_ip': {
          if (optionKey === 'A') {
            this.state.budget -= 40;
            this.state.dirs.perception.true_quality = clamp(this.state.dirs.perception.true_quality + 3, 0, 100);
            desc = "批专项经费打小步快跑补丁：务实止损，消耗 40 万，感知真质量 +3。";
          } else if (optionKey === 'B') {
            this.state.budget -= 180;
            this.state.delay_weeks += 1;
            this.state.dirs.perception.true_quality = clamp(this.state.dirs.perception.true_quality + 8, 0, 100);
            desc = "主动担责申请延期彻底重构：消耗 180 万，项目延期 1 周，感知真质量扎实 +8！";
          } else {
            this.state.dirs.perception.true_quality = clamp(this.state.dirs.perception.true_quality - 4, 0, 100);
            this.sopRiskModifiers.rain_ped += 10;
            desc = "捂盖子「先上线再说」：感知真质量 -4，SOP 雨夜行人漏检真实风险激增 +10！";
          }
          break;
        }

        case 'e_ot_refuse': {
          if (optionKey === 'A') {
            this.state.morale = clamp(this.state.morale + 4, 0, 100);
            desc = "开展 1-on-1 砍掉无效形式主义：真正为一线减负增效，团队士气恢复 +4。";
          } else if (optionKey === 'B') {
            this.state.morale = clamp(this.state.morale + 2, 0, 100);
            desc = "约谈该组 TL 敲打：温和提醒，隔靴搔痒，士气微幅 +2。";
          } else {
            this.state.morale = clamp(this.state.morale - 6, 0, 100);
            desc = "全员大会痛批「缺乏狼性」：把团队推向对立面，组织信任崩塌，士气重挫 -6。";
          }
          break;
        }
      }
      return desc;
    }

    getSOPItemsCalculated() {
      const perQ = this.state.dirs.perception.true_quality;
      const roadQ = this.state.dirs.road.true_quality;
      const planQ = this.state.dirs.planning.true_quality;
      const dataQ = this.state.dirs.data.true_quality;
      const fsQ = this.state.dirs.fs.true_quality;
      const true_label_dispute = clamp(Math.round(48 - dataQ * 0.4), 5, 60);

      return SOP_ITEMS.map(item => {
        let rawRisk = item.base_risk;
        let isAudited = false;

        switch (item.id) {
          case 'rain_ped':
            rawRisk += (70 - perQ) * 0.3 + (70 - roadQ) * 0.2;
            if (this.state.audited.road) {
              rawRisk -= 8;
              isAudited = true;
            }
            rawRisk += this.sopRiskModifiers.rain_ped;
            break;

          case 'cone':
            rawRisk += (70 - perQ) * 0.25 + (70 - planQ) * 0.15;
            rawRisk += this.sopRiskModifiers.cone;
            if (this.state.audited.road) isAudited = true;
            break;

          case 'ghost':
            rawRisk += (70 - perQ) * 0.2 + (70 - dataQ) * 0.2;
            rawRisk += this.sopRiskModifiers.ghost;
            if (this.state.audited.road) isAudited = true;
            break;

          case 'gnss':
            rawRisk += (70 - planQ) * 0.25;
            rawRisk += this.sopRiskModifiers.gnss;
            break;

          case 'brake':
            rawRisk += (70 - fsQ) * 0.4;
            if (this.state.audited.safety) {
              rawRisk -= 10;
              isAudited = true;
            }
            rawRisk += this.sopRiskModifiers.brake;
            break;

          case 'label':
            rawRisk += true_label_dispute * 0.5;
            if (this.state.audited.data) {
              rawRisk -= 12;
              isAudited = true;
            }
            rawRisk += this.sopRiskModifiers.label;
            break;
        }

        const trueRisk = clamp(Math.round(rawRisk), 5, 95);
        const displayedRisk = isAudited ? trueRisk : Math.min(trueRisk, 18);
        const isRed = isAudited && trueRisk >= 60;
        const remainingForThis = this.state.budget - this.getOtherSelectedRepairCost(item.id);
        const canRepair = remainingForThis >= item.repair_cost;

        return {
          ...item,
          risk_from: item.risk_from.slice(),
          true_risk: trueRisk,
          displayed_risk: displayedRisk,
          is_audited: isAudited,
          is_red: isRed,
          canRepair,
          decision: this.sopDecisions[item.id]
        };
      });
    }

    getOtherSelectedRepairCost(excludeItemId) {
      let cost = 0;
      SOP_ITEMS.forEach(it => {
        if (it.id !== excludeItemId && this.sopDecisions[it.id] === 'repair') {
          cost += it.repair_cost;
        }
      });
      return cost;
    }

    setSOPDecision(itemId, decision) {
      if (!['repair', 'waive'].includes(decision)) {
        throw new Error("SOP 决策必须为 'repair' 或 'waive'");
      }
      const item = SOP_ITEMS.find(it => it.id === itemId);
      if (!item) throw new Error(`未知的 SOP 质量红线项: ${itemId}`);

      if (decision === 'repair') {
        const remainingForThis = this.state.budget - this.getOtherSelectedRepairCost(itemId);
        if (remainingForThis < item.repair_cost) {
          return false;
        }
      }

      this.sopDecisions[itemId] = decision;
      return true;
    }

    waiveAllSOP() {
      SOP_ITEMS.forEach(it => {
        this.sopDecisions[it.id] = 'waive';
      });
      return this.getSOPStatus();
    }

    getSOPStatus() {
      const items = this.getSOPItemsCalculated();
      let allDecided = true;
      let additionalCost = 0;
      let additionalDelayWeeks = 0;

      items.forEach(it => {
        if (!it.decision) {
          allDecided = false;
        } else if (it.decision === 'repair') {
          additionalCost += it.repair_cost;
          additionalDelayWeeks += it.repair_weeks;
        }
      });

      const projectedBudget = this.state.budget - additionalCost;
      const projectedDelayWeeks = this.state.delay_weeks + additionalDelayWeeks;

      return {
        items,
        allDecided,
        additionalCost,
        additionalDelayWeeks,
        projectedBudget,
        projectedDelayWeeks,
        canAffordRepairs: projectedBudget >= 0 || true
      };
    }

    confirmSOPRelease() {
      if (this.sopConfirmed) {
        throw new Error("SOP 放行已确认，请勿重复提交");
      }

      const sopStatus = this.getSOPStatus();
      if (!sopStatus.allDecided) {
        throw new Error("必须对全部 6 条质量红线做出【修复 / Waive】决策后方可确认放行");
      }

      let totalRepairCost = 0;
      let totalRepairWeeks = 0;
      sopStatus.items.forEach(it => {
        if (it.decision === 'repair') {
          totalRepairCost += it.repair_cost;
          totalRepairWeeks += it.repair_weeks;
        }
      });

      if (totalRepairCost > 0 && this.state.budget < totalRepairCost) {
        throw new Error(`预算不足以完成所选修复！当前预算 ${this.state.budget} 万，修复总额需要 ${totalRepairCost} 万`);
      }

      this.state.budget -= totalRepairCost;
      this.state.delay_weeks += totalRepairWeeks;
      this.sopConfirmed = true;

      // 计算最终结局与引爆项
      const outcome = this.computeFinalOutcome(sopStatus.items);
      this.finalOutcome = deepClone(outcome);
      return outcome;
    }

    computeFinalOutcome(calculatedItems = this.getSOPItemsCalculated()) {
      const firedItems = [];
      let allWaived = true;

      calculatedItems.forEach(it => {
        if (it.decision === 'waive') {
          const roll = rngU32(this.seed, `fire:${it.id}`) % 100;
          const fired = roll < it.true_risk;
          if (fired) {
            firedItems.push({
              ...it,
              roll
            });
          }
        } else {
          allWaived = false;
        }
      });

      // 1. 安全底线轴 safety
      let safety = 100;
      firedItems.forEach(f => {
        if (['rain_ped', 'ghost', 'brake'].includes(f.id)) {
          safety -= 35;
        } else if (['cone', 'gnss'].includes(f.id)) {
          safety -= 18;
        } else if (f.id === 'label') {
          safety -= 8;
        }
      });

      const anyAudited = this.state.audited.road || this.state.audited.data || this.state.audited.safety;
      if (!anyAudited && allWaived) {
        safety -= 10;
      }
      safety = clamp(safety, 0, 100);

      const severeFired = firedItems.some(f => ['rain_ped', 'ghost', 'brake'].includes(f.id));
      if (severeFired && safety > 25) {
        safety = 25;
      }

      // 2. 真实战力轴 function
      const pProg = this.state.dirs.perception.progress;
      const nProg = this.state.dirs.planning.progress;
      const rTrueQ = this.state.dirs.road.true_quality;
      const { func_w_progress, func_w_road, score_weights } = PRD_CONFIG.balance;
      let func = Math.round(func_w_progress * ((pProg + nProg) / 2) + func_w_road * rTrueQ);

      if (this.state.feature_cut.includes('complex_intersection')) {
        func -= 18;
      }
      const true_urban_rain = Math.round(rTrueQ * 0.5 + this.state.dirs.perception.true_quality * 0.2);
      if (this.currentMonthlyReport && this.currentMonthlyReport.reported.reported_coverage > 75 && true_urban_rain < 20) {
        func -= 12;
      }
      func = clamp(func, 0, 100);

      // 3. 组织协同与兑现轴 delivery
      let oemRel = this.state.oem_relation;
      if (this.state.delay_weeks > 2) {
        const extraWeeks = this.state.delay_weeks - 2;
        oemRel = clamp(oemRel - extraWeeks * 8, 0, 100);
      }

      let delivery = Math.round(40 + oemRel * 0.5 + this.state.market * 0.2);
      // 延期惩罚去重：保留“超过 2 周部分车企关系 -8/周（局部 oemRel）”与“交付轴按周扣分（balance.delay_penalty_per_week，Sam 决定每周扣 4）”，删除原先重复叠加的“超过 2 周再 -12/周”
      delivery -= this.state.delay_weeks * (PRD_CONFIG.balance.delay_penalty_per_week ?? 4);
      if (safety < 30) {
        delivery -= 20;
      }
      delivery = clamp(delivery, 0, 100);

      // 4. 资源与人效轴 cost
      const overrun = Math.max(0, -this.state.budget) / PRD_CONFIG.initial_budget;
      let cost = Math.round(90 - overrun * 400);
      if (overrun > PRD_CONFIG.salary_overrun_threshold) {
        cost -= 10;
      }
      cost = clamp(cost, 0, 100);

      // 5. 团队士气轴 morale
      const morale = clamp(Math.round(this.state.morale), 0, 100);

      // B1：高风险项修复投入不足时，每放行一项真实风险≥阈值的项扣安全分；移至变砖判定之前
      const blindWaiveExempt = PRD_CONFIG.balance.blind_waive_exempt ?? ['gnss'];
      const blindWaiveRiskMin = PRD_CONFIG.balance.blind_waive_risk_min ?? 25;
      const blindWaivePenalty = PRD_CONFIG.balance.blind_waive_penalty ?? 10;
      const knowingWaiveMinRepairWeeks = PRD_CONFIG.balance.knowing_waive_min_repair_weeks ?? 3;
      const hiItems = calculatedItems.filter(
        it => !blindWaiveExempt.includes(it.id) && it.true_risk >= blindWaiveRiskMin
      );
      const hiRepairWeeks = hiItems
        .filter(it => it.decision === 'repair')
        .reduce((sum, it) => sum + (it.repair_weeks ?? 0), 0);
      const hiWaived = hiItems.filter(it => it.decision === 'waive');
      let hiWaivedCount = 0;
      if (hiRepairWeeks < knowingWaiveMinRepairWeeks) {
        const penalty = hiWaived.length * blindWaivePenalty;
        safety = clamp(safety - penalty, 0, 100);
        if (penalty > 0) {
          hiWaivedCount = hiWaived.length;
        }
      }

      // 砖头与总分 —— Sam 决定：最终安全分（含所有扣分）≤25 即变砖
      const isBrick = safety <= 25;

      // Sam 规则 4：同一实质动作重复只算 1 次（开关 dedupe_substantive_actions）
      const minImproveActions = PRD_CONFIG.balance.min_improve_actions ?? 2;
      const improveActionIds = PRD_CONFIG.balance.improve_action_ids ?? ['data_rain', 'road_scene', 'safety_case'];
      const actionHistory = this.choiceHistory.filter(h => h.type === 'action');
      const improveHist = actionHistory.filter(h => improveActionIds.includes(h.action_id));
      const improveCount = (PRD_CONFIG.balance.dedupe_substantive_actions ?? true)
        ? new Set(improveHist.map(h => h.action_id)).size
        : improveHist.length;

      // 审计知情度加分（配合实质修复与实质改善时生效）
      const auditedDirs = ['road', 'data', 'safety'].filter(k => this.state.audited[k]).length;
      const auditBonusPerDir = PRD_CONFIG.balance.audit_bonus_per_dir ?? 1.5;
      const insightBonus = (hiItems.length === 0 || hiRepairWeeks >= knowingWaiveMinRepairWeeks) && improveCount >= minImproveActions
        ? auditedDirs * auditBonusPerDir
        : 0;

      const overall = Math.min(
        100,
        Math.round(
          safety * score_weights.safety +
          func * score_weights.function +
          delivery * score_weights.delivery +
          cost * score_weights.cost +
          morale * score_weights.morale +
          insightBonus
        )
      );

      let letter = 'D';
      if (!isBrick) {
        if (overall >= 85) letter = 'A';
        else if (overall >= 70) letter = 'B';
        else if (overall >= 55) letter = 'C';
        else letter = 'D';
      }

      // 计算管理风格画像与团队匿名吐槽
      const rawProfile = this.evaluateManagementProfile();
      const anonymousFeedback = this.getAnonymousFeedback();

      // 兜底封顶：盲人总监画像、多数月份不作为或没有实际改善时，评级最高封顶 B
      const noopCount = actionHistory.filter(h => h.action_id === 'noop').length;
      const isBlindProfile = rawProfile.id === 'blind';
      const isMajorityNoop = actionHistory.length > 0 && noopCount > actionHistory.length / 2;
      const noImproveAction = improveCount < minImproveActions;
      const noHiRepair = hiItems.length > 0 && hiItems.filter(it => it.decision === 'repair').length === 0;

      let gradeCapped = false;
      let capReason = '';
      const capReasons = [];
      if ((isMajorityNoop || isBlindProfile || noImproveAction || noHiRepair) && letter === 'A') {
        letter = 'B';
        gradeCapped = true;
        if (isMajorityNoop) capReasons.push('整局多数月份不作为');
        if (isBlindProfile) capReasons.push('从未下沉一线');
        if (noImproveAction) capReasons.push('实质改善动作不足');
        if (noHiRepair) capReasons.push('高风险项一项未修');
        capReason = `${capReasons.join(' / ')}，评级封顶 B`;
      }

      let subtitle = "";
      if (isBrick) {
        if (!severeFired) {
          subtitle = PENALTY_BRICK_SUBTITLE;
        } else {
          const brickIdx = rngU32(this.seed, "brick_subtitle") % BRICK_SUBTITLES.length;
          subtitle = BRICK_SUBTITLES[brickIdx];
        }
      } else {
        subtitle = `${letter} · 综合评分 ${overall} / 100`;
        if (gradeCapped) {
          subtitle = `${subtitle} · ${capReason}`;
        }
      }

      const { condition, ...managementProfile } = rawProfile;

      return deepClone({
        letter,
        overall,
        isBrick,
        insightBonus,
        auditedDirs,
        gradeCapped,
        capReason,
        capReasons,
        subtitle,
        axes: {
          safety: { score: safety, label: "底线敬畏", reason: this.getSafetyReason(safety, firedItems, hiWaivedCount) },
          function: { score: func, label: "真实战力", reason: this.getFunctionReason(func) },
          delivery: { score: delivery, label: "协同兑现", reason: this.getDeliveryReason(delivery) },
          cost: { score: cost, label: "组织人效", reason: this.getCostReason(cost, overrun) },
          morale: { score: morale, label: "团队士气", reason: this.getMoraleReason(morale) }
        },
        firedItems,
        calculatedItems,
        managementProfile,
        anonymousFeedback,
        choiceHistory: this.choiceHistory
      });
    }

    getSafetyReason(score, firedItems, hiWaivedCount = 0) {
      if (firedItems.length === 0) {
        if (hiWaivedCount > 0) {
          return `知情放行 ${hiWaivedCount} 项高风险红线且修复投入不足，安全分被扣`;
        }
        return "红线未被引爆，安全敬畏意识经受住了检验";
      }
      const severe = firedItems.find(f => ['rain_ped', 'ghost', 'brake'].includes(f.id));
      if (severe) return `致命风险引爆：${severe.title}，高压瞒报焊进系统`;
      return `部分边界未收敛，触发 ${firedItems.length} 起长尾安全事故`;
    }

    getFunctionReason(score) {
      if (this.state.feature_cut.includes('complex_intersection')) {
        return "启动 CCB 砍掉了城区复杂路口，核心场景稳定但功能有所妥协";
      }
      if (score >= 70) return "架构扎实，真实场景泛化与接管表现经受住了考验";
      return "周报好看但真实工程水位不足，雨夜泛化能力严重欠缺";
    }

    getDeliveryReason(score) {
      if (this.state.delay_weeks > 2) {
        return `严重延期 ${this.state.delay_weeks} 周，错失过年前关键节点，车企信任透支`;
      }
      if (score >= 75) return "边界清晰，外部预期管理与内部研发节奏双向兑现";
      return "外部诉求反复横跳，交付节奏频繁打乱";
    }

    getCostReason(score, overrun) {
      if (overrun > PRD_CONFIG.salary_overrun_threshold) {
        return `管理预算严重透支 ${(overrun * 100).toFixed(1)}%，薪酬包失控引发动荡`;
      }
      if (score >= 75) return "人效配置合理，激励与研发投入精准花在刀刃上";
      return "预算吃紧，高薪诱饵团队消耗了过多组织资源";
    }

    getMoraleReason(score) {
      if (score >= 70) return "组织凝聚力高涨，一线骨干信任管理层并保持战斗力";
      if (score >= 45) return "团队情绪整体可控，高压冲刺下偶有疲态但未失序";
      if (score >= 25) return "内耗与疲惫明显累积，部分骨干开始消极应对";
      return "组织信任濒临崩塌，全员心力交瘁、离职暗流涌动";
    }

    evaluateManagementProfile() {
      for (const prof of MANAGEMENT_PROFILES) {
        if (prof.condition(this.choiceHistory, this.state)) {
          return prof;
        }
      }
      return MANAGEMENT_PROFILES[MANAGEMENT_PROFILES.length - 1];
    }

    getAnonymousFeedback() {
      const feedbackList = [];
      const usedMicromanage = this.choiceHistory.filter(h => h.action_id === 'overtime').length >= 1;

      DIRECTIONS.forEach(d => {
        const team = this.getTeamCard(d.id);
        if (!team) return;
        let quote = "";
        if (usedMicromanage) {
          quote = team.anonymous_quotes.micromanaged;
        } else {
          quote = team.anonymous_quotes.empowered;
        }
        feedbackList.push({
          dir_name: d.name,
          team_name: team.name,
          quote: quote,
          traits: team.traits.map(t => TRAIT_META[t].name)
        });
      });

      return feedbackList;
    }

    getStateSnapshot() {
      return JSON.parse(JSON.stringify(this.state));
    }
  }

  // 纯管理者版自动化验收测试（A1-A10）
  function runPRDTests() {
    const results = [];
    function record(id, passed, detail) {
      results.push({ id, passed, detail });
    }

    try {
      // A1: 种子确定性复现测试
      const e1 = new ManagerSandboxGameEngine();
      e1.initProject('蓬莱-50');
      DIRECTIONS.forEach(d => e1.selectTeamCard(d.id, TEAM_CARDS.find(c => c.dir === d.id).id));
      e1.confirmTeam();
      const r1 = e1.executeMonthlyAction('overtime', 'perception');
      e1.resolveEmergency('A');

      const e2 = new ManagerSandboxGameEngine();
      e2.initProject('蓬莱-50');
      DIRECTIONS.forEach(d => e2.selectTeamCard(d.id, TEAM_CARDS.find(c => c.dir === d.id).id));
      e2.confirmTeam();
      const r2 = e2.executeMonthlyAction('overtime', 'perception');
      e2.resolveEmergency('A');

      const a1Pass = (
        e1.seed === e2.seed &&
        r1.emergencies[0].id === r2.emergencies[0].id &&
        e1.state.budget === e2.state.budget &&
        e1.state.morale === e2.state.morale
      );
      record('A1', a1Pass, `同名种子可精确复现 (${e1.seed})`);

      // A2: 不同项目名产生不同种子
      const e3 = new ManagerSandboxGameEngine();
      e3.initProject('蓬莱-51');
      record('A2', e1.seed !== e3.seed, `不同项目名种子不同 (${e1.seed} vs ${e3.seed})`);

      // A3: 全选贵诱饵队
      const eA3 = new ManagerSandboxGameEngine();
      eA3.initProject('A3测试');
      eA3.selectTeamCard('perception', 'p_paper');
      eA3.selectTeamCard('planning', 'n_lab');
      eA3.selectTeamCard('fs', 'f_doc');
      eA3.selectTeamCard('data', 'd_out');
      eA3.selectTeamCard('oem', 'o_rel');
      eA3.selectTeamCard('road', 'r_miles');
      eA3.confirmTeam();
      const a3Pass = eA3.state.payroll_monthly === 1090 && (8000 - 1090 * 6) === 1460;
      record('A3', a3Pass, `月薪合计 ${eA3.state.payroll_monthly} 万，6月无动作余款 1460 万`);

      // A4: 对星海感知（带 no_ot）执行军令状加班
      const eA4 = new ManagerSandboxGameEngine();
      eA4.initProject('A4测试');
      eA4.selectTeamCard('perception', 'p_paper');
      eA4.selectTeamCard('planning', 'n_lab');
      eA4.selectTeamCard('fs', 'f_doc');
      eA4.selectTeamCard('data', 'd_out');
      eA4.selectTeamCard('oem', 'o_rel');
      eA4.selectTeamCard('road', 'r_miles');
      eA4.confirmTeam();
      const pBefore = eA4.state.dirs.perception.progress;
      const resA4 = eA4.executeMonthlyAction('overtime', 'perception');
      const eA4Nat = new ManagerSandboxGameEngine();
      eA4Nat.initProject('A4测试');
      eA4Nat.selectTeamCard('perception', 'p_paper');
      eA4Nat.selectTeamCard('planning', 'n_lab');
      eA4Nat.selectTeamCard('fs', 'f_doc');
      eA4Nat.selectTeamCard('data', 'd_out');
      eA4Nat.selectTeamCard('oem', 'o_rel');
      eA4Nat.selectTeamCard('road', 'r_miles');
      eA4Nat.confirmTeam();
      eA4Nat.state.morale = eA4.state.morale;
      eA4Nat.applyNaturalProgress();
      const natGain = eA4Nat.state.dirs.perception.progress - pBefore;
      const pGain = (eA4.state.dirs.perception.progress - pBefore) - natGain;
      const a4Pass = pGain === 8 && resA4.actionResult.notes.some(n => n.includes('抗命') || n.includes('减半'));
      record('A4', a4Pass, `星海感知抗命减半，扣除自然进度 +${natGain} 后动作进度实际增加 +${pGain}（期望 +8）`);

      // A5: 不审计且全 Waive，大概率触发 brick
      const eA5 = new ManagerSandboxGameEngine();
      eA5.initProject('A5测试');
      DIRECTIONS.forEach(d => eA5.selectTeamCard(d.id, TEAM_CARDS.find(c => c.dir === d.id).id));
      eA5.confirmTeam();
      for (let m = 1; m <= 6; m++) {
        eA5.executeMonthlyAction('noop');
        while (eA5.currentEmergencyIndex < eA5.currentMonthEmergencies.length) {
          eA5.resolveEmergency('B');
        }
      }
      eA5.waiveAllSOP();
      const outA5 = eA5.confirmSOPRelease();
      record('A5', outA5.axes.safety.score <= 25, `不审计全 Waive 安全得分 ${outA5.axes.safety.score} (<= 25)`);

      // A6: M3 审计路测后，SOP 雨夜项显示真实风险且可 >= 60
      const eA6 = new ManagerSandboxGameEngine();
      eA6.initProject('A6测试');
      eA6.selectTeamCard('perception', 'p_paper');
      eA6.selectTeamCard('planning', 'n_lab');
      eA6.selectTeamCard('fs', 'f_doc');
      eA6.selectTeamCard('data', 'd_out');
      eA6.selectTeamCard('oem', 'o_rel');
      eA6.selectTeamCard('road', 'r_miles');
      eA6.confirmTeam();
      for (let m = 1; m <= 2; m++) {
        eA6.executeMonthlyAction('noop');
        while (eA6.currentEmergencyIndex < eA6.currentMonthEmergencies.length) {
          eA6.resolveEmergency('A');
        }
      }
      eA6.executeMonthlyAction('audit', 'road');
      while (eA6.currentEmergencyIndex < eA6.currentMonthEmergencies.length) {
        eA6.resolveEmergency('A');
      }
      for (let m = 4; m <= 6; m++) {
        eA6.executeMonthlyAction('noop');
        while (eA6.currentEmergencyIndex < eA6.currentMonthEmergencies.length) {
          eA6.resolveEmergency('A');
        }
      }
      const sopA6 = eA6.getSOPItemsCalculated();
      const rainItem = sopA6.find(it => it.id === 'rain_ped');
      record('A6', rainItem.is_audited && rainItem.true_risk >= 60, `审计路测后雨夜真风险为 ${rainItem.true_risk}% (>= 60) 且标红`);

      // A7: CCB 挡枪后启动高管督战室，功能加回且冻结降级
      const eA7 = new ManagerSandboxGameEngine();
      eA7.initProject('A7测试');
      eA7.selectTeamCard('perception', 'p_zhou');
      eA7.selectTeamCard('planning', 'n_kai');
      eA7.selectTeamCard('fs', 'f_zhao');
      eA7.selectTeamCard('data', 'd_core');
      eA7.selectTeamCard('oem', 'o_disc');
      eA7.selectTeamCard('road', 'r_rain');
      eA7.confirmTeam();
      eA7.executeMonthlyAction('cut');
      const hadCut = eA7.state.feature_cut.includes('complex_intersection');
      eA7.executeMonthlyAction('oem_please_act', 'oem');
      const cutRestored = !eA7.state.feature_cut.includes('complex_intersection');
      record('A7', hadCut && cutRestored, `CCB 挡枪后督战室作秀，功能被加回且冻结降级`);

      // A8: 预算不足时修复禁用校验
      const eA8 = new ManagerSandboxGameEngine();
      eA8.initProject('A8测试');
      DIRECTIONS.forEach(d => eA8.selectTeamCard(d.id, TEAM_CARDS.find(c => c.dir === d.id).id));
      eA8.confirmTeam();
      eA8.state.budget = 500;
      const sopListA8 = eA8.getSOPItemsCalculated();
      const brakeStatus = sopListA8.find(x => x.id === 'brake');
      const attemptRepair = eA8.setSOPDecision('brake', 'repair');
      const a8Pass = brakeStatus.canRepair === false && attemptRepair === false;
      record('A8', a8Pass, `预算 500 万时修复 800 万冗余被正确阻断 (canRepair=${brakeStatus.canRepair}, attempt=${attemptRepair})`);

      // A9: delay_weeks 从 0 到 3 交付轴明显衰减
      const eA9a = new ManagerSandboxGameEngine();
      eA9a.initProject('A9测试');
      DIRECTIONS.forEach(d => eA9a.selectTeamCard(d.id, TEAM_CARDS.find(c => c.dir === d.id).id));
      eA9a.confirmTeam();
      for (let m = 1; m <= 6; m++) {
        eA9a.executeMonthlyAction('noop');
        while (eA9a.currentEmergencyIndex < eA9a.currentMonthEmergencies.length) {
          eA9a.resolveEmergency('A');
        }
      }
      eA9a.setSOPDecision('cone', 'repair'); // +1 week
      eA9a.setSOPDecision('ghost', 'repair'); // +2 weeks -> total 3 weeks
      SOP_ITEMS.forEach(it => { if (!eA9a.sopDecisions[it.id]) eA9a.setSOPDecision(it.id, 'waive'); });
      const outA9 = eA9a.confirmSOPRelease();
      record('A9', outA9.axes.delivery.score < 50, `延期 3 周交付轴显著恶化 (score = ${outA9.axes.delivery.score})`);

      // A10: 组队页信息屏蔽
      const eA10 = new ManagerSandboxGameEngine();
      const publicCards = eA10.getPublicTeamCards();
      const allTraitIds = Object.keys(TRAIT_META);
      const allTraitNames = Object.values(TRAIT_META).map(t => t.name);
      const a10Pass = publicCards.length === TEAM_CARDS.length && publicCards.every(pub => {
        const raw = TEAM_CARDS.find(c => c.id === pub.id);
        if (!raw) return false;
        if ('true_power' in pub || 'traits' in pub || 'fake_bias' in pub) return false;
        const renderedText = `${pub.name} ${pub.salary_month} 万/月 规模: ${pub.headcount} 人 经验: ${pub.years} 年量产沉淀 ${pub.blurb}`;
        const serialized = JSON.stringify(pub);
        const hasTruePowerVal = renderedText.includes(String(raw.true_power));
        const hasTraitLeak = raw.traits.some(t =>
          renderedText.includes(t) ||
          serialized.includes(t) ||
          (TRAIT_META[t] && renderedText.includes(TRAIT_META[t].name))
        ) || allTraitIds.some(t => renderedText.includes(t)) || allTraitNames.some(n => renderedText.includes(n));
        return !hasTruePowerVal && !hasTraitLeak;
      });
      record('A10', a10Pass, `组队公开卡片视图共 ${publicCards.length} 张，均不含 true_power 与 traits 字段及对应值`);

    } catch (err) {
      record('FATAL', false, `测试运行异常: ${err.message}`);
    }

    return results;
  }

  const exportObj = {
    computeSeedFromName,
    Mulberry32,
    rngU32,
    ManagerSandboxGameEngine,
    runPRDTests
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportObj;
  } else {
    global.ManagerGameEngine = exportObj;
  }
})(typeof self !== 'undefined' ? self : this);
