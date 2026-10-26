// 《带队吧，总监》（智驾量产沙盘·纯管理者版）前端交互控制器

document.addEventListener('DOMContentLoaded', () => {
  const { PRD_CONFIG, DIRECTIONS, TEAM_CARDS, MONTHLY_ACTIONS, ROAD_SCENE_OPTIONS, SOP_ITEMS, TRAIT_META } = GameData;
  const { ManagerSandboxGameEngine } = ManagerGameEngine;

  const engine = new ManagerSandboxGameEngine();

  // DOM 元素缓存
  const screens = {
    home: document.getElementById('screen-home'),
    teamSelect: document.getElementById('screen-team-select'),
    rosterConfirm: document.getElementById('screen-roster-confirm'),
    monthlyBoard: document.getElementById('screen-monthly-board'),
    emergencies: document.getElementById('screen-emergencies'),
    sop: document.getElementById('screen-sop'),
    outcome: document.getElementById('screen-outcome')
  };

  const debugBar = document.getElementById('debug-bar');
  const debugInfo = document.getElementById('debug-info');
  const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';

  if (isDebug) {
    debugBar.classList.remove('hidden');
  }

  function updateDebugBar() {
    if (!isDebug) return;
    const s = engine.getStateSnapshot();
    debugInfo.textContent = `种子:${engine.seed} | 预算:${s.budget} | 士气:${s.morale} | 真实质量: 感知${s.dirs.perception.true_quality}/规控${s.dirs.planning.true_quality}/安全${s.dirs.fs.true_quality}/数据${s.dirs.data.true_quality}/路测${s.dirs.road.true_quality}/对接${s.dirs.oem.true_quality}`;
  }

  function showScreen(screenKey) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenKey].classList.add('active');
    window.scrollTo(0, 0);
    updateDebugBar();
  }

  // ====================== 1. 首页逻辑 ======================
  const projectNameInput = document.getElementById('project-name-input');
  const btnStart = document.getElementById('btn-start');

  btnStart.addEventListener('click', () => {
    const rawName = projectNameInput.value;
    engine.initProject(rawName);
    renderTeamSelectionSlots();
    showScreen('teamSelect');
  });

  // ====================== 2. 组队逻辑 ======================
  const slotsContainer = document.getElementById('team-slots-container');
  const slotsFilledCount = document.getElementById('slots-filled-count');
  const btnToRosterConfirm = document.getElementById('btn-to-roster-confirm');

  function renderTeamSelectionSlots() {
    slotsContainer.innerHTML = '';
    const status = engine.getTeamSelectionStatus();

    DIRECTIONS.forEach(dir => {
      const slotBlock = document.createElement('div');
      slotBlock.className = 'slot-block';

      const selectedId = status.selections[dir.id] ? status.selections[dir.id].id : null;

      slotBlock.innerHTML = `
        <div class="slot-title-row">
          <span class="slot-name">${dir.name}</span>
          <span class="slot-status-badge ${selectedId ? 'selected' : ''}">
            ${selectedId ? '已选定' : '待配置'}
          </span>
        </div>
        <div class="candidate-cards-row" data-dir="${dir.id}"></div>
      `;

      const candidateRow = slotBlock.querySelector('.candidate-cards-row');
      const candidates = engine.getPublicTeamCards(dir.id);

      candidates.forEach(card => {
        const isSelected = selectedId === card.id;
        const cardEl = document.createElement('div');
        cardEl.className = `team-card ${isSelected ? 'active' : ''}`;
        cardEl.dataset.cardId = card.id;

        // 严格遵循 A10：绝不渲染 true_power、traits、fake_bias
        cardEl.innerHTML = `
          <div class="team-card-head">
            <span class="team-name">${card.name}</span>
            <span class="team-cost">${card.salary_month} 万/月</span>
          </div>
          <div class="team-meta-row">
            <span>规模: ${card.headcount} 人</span>
            <span>经验: ${card.years} 年量产沉淀</span>
          </div>
          <div class="team-blurb">${card.blurb}</div>
          <div class="team-card-footer">
            <button class="btn btn-select-team">
              ${isSelected ? '✓ 已就位' : '任命该组'}
            </button>
          </div>
        `;

        cardEl.addEventListener('click', () => {
          engine.selectTeamCard(dir.id, card.id);
          renderTeamSelectionSlots();
        });

        candidateRow.appendChild(cardEl);
      });

      slotsContainer.appendChild(slotBlock);
    });

    let filled = 0;
    Object.values(status.selections).forEach(c => { if (c) filled++; });
    slotsFilledCount.textContent = filled;
    btnToRosterConfirm.disabled = (filled < 6);
  }

  btnToRosterConfirm.addEventListener('click', () => {
    renderRosterConfirmPage();
    showScreen('rosterConfirm');
  });

  // ====================== 3. 确认名单逻辑 ======================
  const rosterTotalHc = document.getElementById('roster-total-hc');
  const rosterTotalSalary = document.getElementById('roster-total-salary');
  const rosterTeamsList = document.getElementById('roster-teams-list');
  const btnConfirmAndEnterM1 = document.getElementById('btn-confirm-and-enter-m1');
  const btnBackToTeamSelect = document.getElementById('btn-back-to-team-select');

  function renderRosterConfirmPage() {
    const status = engine.getTeamSelectionStatus();
    rosterTotalHc.textContent = `${status.totalHeadcount} 人`;
    rosterTotalSalary.textContent = `${status.totalSalary} 万/月`;
    rosterTeamsList.innerHTML = '';

    DIRECTIONS.forEach(dir => {
      const card = status.selections[dir.id];
      if (!card) return;
      const item = document.createElement('div');
      item.className = 'roster-item';
      item.innerHTML = `
        <div>
          <div class="roster-dir">${dir.name}</div>
          <div class="roster-name">${card.name} (${card.headcount}人)</div>
        </div>
        <div class="roster-pay">${card.salary_month} 万/月</div>
      `;
      rosterTeamsList.appendChild(item);
    });
  }

  btnBackToTeamSelect.addEventListener('click', () => {
    showScreen('teamSelect');
  });

  btnConfirmAndEnterM1.addEventListener('click', () => {
    engine.confirmTeam();
    updateMonthlyBoard();
    showScreen('monthlyBoard');
  });

  // ====================== 4. 月度工作台看板 ======================
  const boardMonthLabel = document.getElementById('board-month-label');
  const boardProjectName = document.getElementById('board-project-name');
  const dashBudget = document.getElementById('dash-budget');
  const dashPayroll = document.getElementById('dash-payroll');
  const dashMorale = document.getElementById('dash-morale');
  const dashMoraleState = document.getElementById('dash-morale-state');
  const gateFreeze = document.getElementById('gate-freeze');
  const gateSafety = document.getElementById('gate-safety');
  const gateOem = document.getElementById('gate-oem');

  const repCoverage = document.getElementById('rep-coverage');
  const repMileage = document.getElementById('rep-mileage');
  const repShadow = document.getElementById('rep-shadow');
  const repNps = document.getElementById('rep-nps');
  const repCorners = document.getElementById('rep-corners');

  const auditTruthBox = document.getElementById('audit-truth-box');
  const auditTruthContent = document.getElementById('audit-truth-content');
  const overrunAlertBanner = document.getElementById('overrun-alert-banner');
  const btnEnterActionModal = document.getElementById('btn-enter-action-modal');

  function updateMonthlyBoard() {
    const s = engine.getStateSnapshot();
    const rep = engine.currentMonthlyReport || engine.refreshMonthlyReport();

    boardMonthLabel.textContent = `M${s.month}`;
    boardProjectName.textContent = engine.projectName;

    dashBudget.textContent = `${s.budget} 万`;
    dashPayroll.textContent = `月薪固定支出 -${s.payroll_monthly} 万`;

    dashMorale.textContent = s.morale;
    if (s.morale < 35) {
      dashMoraleState.textContent = "极度疲惫/抗议蔓延";
      dashMoraleState.style.color = "var(--danger)";
    } else if (s.morale < 60) {
      dashMoraleState.textContent = "情绪承压中";
      dashMoraleState.style.color = "var(--warning)";
    } else {
      dashMoraleState.textContent = "凝聚力健康";
      dashMoraleState.style.color = "var(--success)";
    }

    // 三态红绿灯
    updateGatePill(gateFreeze, s.function_freeze, {
      risk: "需求发散/频繁倒退",
      converging: "收敛冻结中",
      stable: "功能基线已冻结"
    });
    updateGatePill(gateSafety, s.safety_release, {
      risk: "红线未关闭",
      converging: "安全核查中",
      stable: "安全条件放行"
    });
    updateGatePill(gateOem, s.spec_gate, {
      risk: "高管信任危机",
      converging: "协同对齐中",
      stable: "外部关系稳固"
    });

    // 假周报指标
    repCoverage.textContent = `${rep.reported.reported_coverage}%`;
    repMileage.textContent = `${rep.reported.reported_mileage_wan} 万公里`;
    repShadow.textContent = `${rep.reported.reported_shadow}%`;
    repNps.textContent = `${rep.reported.reported_nps}`;
    repCorners.textContent = `${rep.reported.reported_corners} 个`;

    // Skip-level 隔级摸底穿透的一线真实水位
    let truthLines = [];
    if (s.audited.road) {
      truthLines.push(`• <strong>实车路测真值</strong>：有效极端恶劣天气测试里程仅 ${rep.true_values.true_urban_rain}%`);
    }
    if (s.audited.data) {
      truthLines.push(`• <strong>数据闭环真值</strong>：难例争议样本弃标率高达 ${rep.true_values.true_label_dispute}%`);
    }
    if (s.audited.safety) {
      truthLines.push(`• <strong>功能安全真值</strong>：底层未关闭 SOTIF 遗留隐患 ${rep.true_values.true_sotif_open} 项`);
    }

    if (truthLines.length > 0) {
      auditTruthBox.classList.remove('hidden');
      auditTruthContent.innerHTML = truthLines.join('<br>');
    } else {
      auditTruthBox.classList.add('hidden');
    }

    // 资金链断裂预警
    if (s.budget < 0 && (Math.abs(s.budget) / PRD_CONFIG.initial_budget) > PRD_CONFIG.salary_overrun_threshold) {
      overrunAlertBanner.classList.remove('hidden');
    } else {
      overrunAlertBanner.classList.add('hidden');
    }

    updateDebugBar();
  }

  function updateGatePill(el, status, textMap) {
    el.className = `gate-pill ${status}`;
    el.textContent = textMap[status] || status;
  }

  // ====================== 5. 8 大管理工具弹窗交互 ======================
  const modalActionSelect = document.getElementById('modal-action-select');
  const btnCloseActionModal = document.getElementById('btn-close-action-modal');
  const actionsList = document.getElementById('actions-list');
  const actionTargetDirContainer = document.getElementById('action-target-dir-container');
  const actionDirOptions = document.getElementById('action-dir-options');
  const actionRoadSceneContainer = document.getElementById('action-road-scene-container');
  const roadSceneOptions = document.getElementById('road-scene-options');
  const btnExecuteAction = document.getElementById('btn-execute-action');

  let selectedActionId = null;
  let selectedTargetDir = null;
  let selectedRoadScene = null;

  btnEnterActionModal.addEventListener('click', () => {
    openActionSelectModal();
  });

  btnCloseActionModal.addEventListener('click', () => {
    modalActionSelect.classList.add('hidden');
  });

  function openActionSelectModal() {
    selectedActionId = null;
    selectedTargetDir = null;
    selectedRoadScene = null;
    actionTargetDirContainer.classList.add('hidden');
    actionRoadSceneContainer.classList.add('hidden');
    btnExecuteAction.disabled = true;

    const s = engine.getStateSnapshot();
    actionsList.innerHTML = '';

    MONTHLY_ACTIONS.forEach(act => {
      const canAfford = act.cost === 0 || s.budget >= act.cost;
      const card = document.createElement('div');
      card.className = `action-item-card ${canAfford ? '' : 'disabled'}`;
      card.dataset.actionId = act.id;

      card.innerHTML = `
        <div class="action-item-head">
          <span class="action-name">${act.name}</span>
          <span class="action-cost">${act.cost > 0 ? act.cost + ' 万' : '零预算'}</span>
        </div>
        <div class="action-item-desc">${act.desc}</div>
      `;

      if (canAfford) {
        card.addEventListener('click', () => {
          document.querySelectorAll('.action-item-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          handleActionCardClick(act);
        });
      }

      actionsList.appendChild(card);
    });

    modalActionSelect.classList.remove('hidden');
  }

  function handleActionCardClick(act) {
    selectedActionId = act.id;
    selectedTargetDir = null;
    selectedRoadScene = null;

    if (act.requires_dir) {
      actionTargetDirContainer.classList.remove('hidden');
      renderDirOptions(act.valid_dirs);
    } else {
      actionTargetDirContainer.classList.add('hidden');
    }

    if (act.id === 'road_scene') {
      actionRoadSceneContainer.classList.remove('hidden');
      renderRoadSceneOptions();
    } else {
      actionRoadSceneContainer.classList.add('hidden');
    }

    validateActionExecutionButton();
  }

  function renderDirOptions(validDirs) {
    actionDirOptions.innerHTML = '';
    validDirs.forEach(dirId => {
      const dirObj = DIRECTIONS.find(d => d.id === dirId);
      const teamCard = engine.getTeamCard(dirId);
      const pill = document.createElement('div');
      pill.className = 'sub-option-pill';
      pill.textContent = `${dirObj.name}（当前团队: ${teamCard ? teamCard.name : '未任命'}）`;

      pill.addEventListener('click', () => {
        actionDirOptions.querySelectorAll('.sub-option-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedTargetDir = dirId;
        validateActionExecutionButton();
      });

      actionDirOptions.appendChild(pill);
    });
  }

  function renderRoadSceneOptions() {
    roadSceneOptions.innerHTML = '';
    Object.values(ROAD_SCENE_OPTIONS).forEach(opt => {
      const pill = document.createElement('div');
      pill.className = 'sub-option-pill';
      pill.innerHTML = `<strong>${opt.name}</strong><br><span style="font-size:11px;color:#94a3b8;">${opt.desc}</span>`;

      pill.addEventListener('click', () => {
        roadSceneOptions.querySelectorAll('.sub-option-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedRoadScene = opt.id;
        validateActionExecutionButton();
      });

      roadSceneOptions.appendChild(pill);
    });
  }

  function validateActionExecutionButton() {
    const act = MONTHLY_ACTIONS.find(a => a.id === selectedActionId);
    if (!act) {
      btnExecuteAction.disabled = true;
      return;
    }

    if (act.requires_dir && !selectedTargetDir) {
      btnExecuteAction.disabled = true;
      return;
    }

    if (act.id === 'road_scene' && !selectedRoadScene) {
      btnExecuteAction.disabled = true;
      return;
    }

    btnExecuteAction.disabled = false;
  }

  // 执行动作并弹窗展示反馈
  const modalActionResult = document.getElementById('modal-action-result');
  const actionResultBody = document.getElementById('action-result-body');
  const btnContinueToEmergencies = document.getElementById('btn-continue-to-emergencies');

  btnExecuteAction.addEventListener('click', () => {
    const res = engine.executeMonthlyAction(selectedActionId, selectedTargetDir, selectedRoadScene);
    modalActionSelect.classList.add('hidden');

    actionResultBody.innerHTML = res.actionResult.notes.map(n => `<div class="result-note-item">${n}</div>`).join('');
    modalActionResult.classList.remove('hidden');
  });

  btnContinueToEmergencies.addEventListener('click', () => {
    modalActionResult.classList.add('hidden');
    renderCurrentEmergency();
  });

  // ====================== 6. 突发管理困境交互 ======================
  const emergStepIdx = document.getElementById('emerg-step-idx');
  const emergTitle = document.getElementById('emerg-title');
  const emergBody = document.getElementById('emerg-body');
  const emergOptAText = document.getElementById('emerg-opt-a-text');
  const emergOptADesc = document.getElementById('emerg-opt-a-desc');
  const emergOptBText = document.getElementById('emerg-opt-b-text');
  const emergOptBDesc = document.getElementById('emerg-opt-b-desc');
  const emergOptCText = document.getElementById('emerg-opt-c-text');
  const emergOptCDesc = document.getElementById('emerg-opt-c-desc');

  function renderCurrentEmergency() {
    const currentEvent = engine.currentMonthEmergencies[engine.currentEmergencyIndex];
    if (!currentEvent) {
      handleMonthCompleteOrSOP();
      return;
    }

    const total = engine.currentMonthEmergencies.length;
    const curIdx = engine.currentEmergencyIndex + 1;
    emergStepIdx.textContent = `(${curIdx}/${total})`;

    emergTitle.textContent = currentEvent.title;
    emergBody.textContent = currentEvent.body;

    emergOptAText.textContent = currentEvent.opt_a.text;
    emergOptADesc.textContent = currentEvent.opt_a.desc;

    emergOptBText.textContent = currentEvent.opt_b.text;
    emergOptBDesc.textContent = currentEvent.opt_b.desc;

    emergOptCText.textContent = currentEvent.opt_c.text;
    emergOptCDesc.textContent = currentEvent.opt_c.desc;

    showScreen('emergencies');
  }

  document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', () => {
      const opt = card.dataset.opt;
      const res = engine.resolveEmergency(opt);
      alert(`【管理决策落地】\n${res.effectDesc}`);

      if (res.hasMoreEmergenciesThisMonth) {
        renderCurrentEmergency();
      } else {
        if (res.readyForSOP) {
          renderSOPPage();
          showScreen('sop');
        } else {
          updateMonthlyBoard();
          showScreen('monthlyBoard');
        }
      }
    });
  });

  function handleMonthCompleteOrSOP() {
    if (engine.readyForSOP || engine.state.month > PRD_CONFIG.total_months) {
      renderSOPPage();
      showScreen('sop');
    } else {
      updateMonthlyBoard();
      showScreen('monthlyBoard');
    }
  }

  // ====================== 7. SOP 质量红线终局抉择 ======================
  const sopCurBudget = document.getElementById('sop-cur-budget');
  const sopCurDelay = document.getElementById('sop-cur-delay');
  const btnWaiveAll = document.getElementById('btn-waive-all');
  const sopErrorBanner = document.getElementById('sop-error-banner');
  const sopItemsList = document.getElementById('sop-items-list');
  const sopDecidedCount = document.getElementById('sop-decided-count');
  const btnConfirmSopRelease = document.getElementById('btn-confirm-sop-release');

  function renderSOPPage() {
    if (sopErrorBanner) {
      sopErrorBanner.textContent = '';
      sopErrorBanner.classList.add('hidden');
    }
    const status = engine.getSOPStatus();
    sopCurBudget.textContent = `${status.projectedBudget} 万`;
    sopCurDelay.textContent = `${status.projectedDelayWeeks} 周`;

    sopItemsList.innerHTML = '';
    let decided = 0;

    status.items.forEach(item => {
      if (item.decision) decided++;

      const card = document.createElement('div');
      card.className = 'sop-card';

      card.innerHTML = `
        <div class="sop-card-head">
          <span class="sop-item-title">${item.title}</span>
          <span class="sop-risk-badge ${item.is_red ? 'red-alert' : ''}">
            ${item.is_audited ? `真实风险: ${item.true_risk}%` : `自报风险: ${item.displayed_risk}%`}
          </span>
        </div>
        <div class="sop-item-desc">${item.desc}</div>
        <div class="sop-action-row">
          <button class="btn-sop-choice ${item.decision === 'repair' ? 'selected' : ''} ${item.canRepair ? '' : 'disabled'}" data-action="repair">
            ${item.canRepair ? `修复 (-${item.repair_cost}万 / +${item.repair_weeks}周)` : `预算不足 (需${item.repair_cost}万)`}
          </button>
          <button class="btn-sop-choice ${item.decision === 'waive' ? 'selected' : ''}" data-action="waive">
            Waive (带雷放行)
          </button>
        </div>
      `;

      const btnRepair = card.querySelector('[data-action="repair"]');
      const btnWaive = card.querySelector('[data-action="waive"]');

      if (item.canRepair) {
        btnRepair.addEventListener('click', () => {
          engine.setSOPDecision(item.id, 'repair');
          renderSOPPage();
        });
      }

      btnWaive.addEventListener('click', () => {
        engine.setSOPDecision(item.id, 'waive');
        renderSOPPage();
      });

      sopItemsList.appendChild(card);
    });

    sopDecidedCount.textContent = decided;
    btnConfirmSopRelease.disabled = (decided < 6);
  }

  btnWaiveAll.addEventListener('click', () => {
    engine.waiveAllSOP();
    renderSOPPage();
  });

  btnConfirmSopRelease.addEventListener('click', () => {
    try {
      const outcome = engine.confirmSOPRelease();
      if (sopErrorBanner) {
        sopErrorBanner.textContent = '';
        sopErrorBanner.classList.add('hidden');
      }
      renderOutcomePage(outcome);
      showScreen('outcome');
    } catch (err) {
      if (sopErrorBanner) {
        sopErrorBanner.textContent = err && err.message ? err.message : String(err);
        sopErrorBanner.classList.remove('hidden');
        if (typeof sopErrorBanner.scrollIntoView === 'function') {
          sopErrorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  });

  // ====================== 8. 结局与复盘页面 ======================
  const outcomeGradeBadge = document.getElementById('outcome-grade-badge');
  const outcomeTitle = document.getElementById('outcome-title');
  const outcomeSubtitle = document.getElementById('outcome-subtitle');
  const outcomeInsight = document.getElementById('outcome-insight');

  const axisSafetyScore = document.getElementById('axis-safety-score');
  const axisSafetyBar = document.getElementById('axis-safety-bar');
  const axisSafetyDesc = document.getElementById('axis-safety-desc');

  const axisFuncScore = document.getElementById('axis-func-score');
  const axisFuncBar = document.getElementById('axis-func-bar');
  const axisFuncDesc = document.getElementById('axis-func-desc');

  const axisDelivScore = document.getElementById('axis-deliv-score');
  const axisDelivBar = document.getElementById('axis-deliv-bar');
  const axisDelivDesc = document.getElementById('axis-deliv-desc');

  const axisCostScore = document.getElementById('axis-cost-score');
  const axisCostBar = document.getElementById('axis-cost-bar');
  const axisCostDesc = document.getElementById('axis-cost-desc');

  const axisMoraleScore = document.getElementById('axis-morale-score');
  const axisMoraleBar = document.getElementById('axis-morale-bar');
  const axisMoraleDesc = document.getElementById('axis-morale-desc');

  const profileTitle = document.getElementById('profile-title');
  const profileTagline = document.getElementById('profile-tagline');
  const profileDesc = document.getElementById('profile-desc');

  const anonymousFeedbackList = document.getElementById('anonymous-feedback-list');
  const truthItemsList = document.getElementById('truth-items-list');
  const btnRestart = document.getElementById('btn-restart');

  function renderOutcomePage(outcome) {
    outcomeGradeBadge.textContent = outcome.letter;
    if (outcome.isBrick) {
      outcomeGradeBadge.style.background = "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)";
      outcomeTitle.textContent = "上路第一周下线";
    } else {
      outcomeGradeBadge.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
      outcomeTitle.textContent = "SOP 量产放行达成";
    }
    if (outcome.gradeCapped) {
      outcomeSubtitle.textContent = '';
      outcomeSubtitle.appendChild(
        document.createTextNode(`${outcome.letter} · 综合评分 ${outcome.overall} / 100`)
      );
      const capReasonEl = document.createElement('span');
      capReasonEl.className = 'cap-reason';
      const reasonsText = Array.isArray(outcome.capReasons)
        ? outcome.capReasons.join(' / ')
        : '';
      if (reasonsText) {
        capReasonEl.appendChild(document.createTextNode(`${reasonsText}，`));
      }
      const capTagEl = document.createElement('span');
      capTagEl.className = 'cap-tag';
      capTagEl.textContent = '评级封顶 B';
      capReasonEl.appendChild(capTagEl);
      outcomeSubtitle.appendChild(capReasonEl);
    } else {
      outcomeSubtitle.textContent = outcome.subtitle;
    }

    if (outcomeInsight) {
      if (!outcome.isBrick && outcome.insightBonus > 0) {
        outcomeInsight.textContent = `隔级审计知情度加分 +${outcome.insightBonus}（已计入综合评分）`;
        outcomeInsight.classList.remove('hidden');
      } else {
        outcomeInsight.textContent = '';
        outcomeInsight.classList.add('hidden');
      }
    }

    // 五轴数据
    axisSafetyScore.textContent = outcome.axes.safety.score;
    axisSafetyBar.style.width = `${outcome.axes.safety.score}%`;
    axisSafetyDesc.textContent = outcome.axes.safety.reason;

    axisFuncScore.textContent = outcome.axes.function.score;
    axisFuncBar.style.width = `${outcome.axes.function.score}%`;
    axisFuncDesc.textContent = outcome.axes.function.reason;

    axisDelivScore.textContent = outcome.axes.delivery.score;
    axisDelivBar.style.width = `${outcome.axes.delivery.score}%`;
    axisDelivDesc.textContent = outcome.axes.delivery.reason;

    axisCostScore.textContent = outcome.axes.cost.score;
    axisCostBar.style.width = `${outcome.axes.cost.score}%`;
    axisCostDesc.textContent = outcome.axes.cost.reason;

    axisMoraleScore.textContent = outcome.axes.morale.score;
    axisMoraleBar.style.width = `${outcome.axes.morale.score}%`;
    axisMoraleDesc.textContent = outcome.axes.morale.reason;

    // 独家管理风格诊断书
    profileTitle.textContent = outcome.managementProfile.title;
    profileTagline.textContent = outcome.managementProfile.tagline;
    profileDesc.textContent = outcome.managementProfile.desc;

    // 团队匿名吐槽群
    anonymousFeedbackList.innerHTML = '';
    outcome.anonymousFeedback.forEach(fb => {
      const item = document.createElement('div');
      item.className = 'feedback-item';
      item.innerHTML = `
        <div class="feedback-team-row">
          <span class="fb-team-name">${fb.team_name}（${fb.dir_name}）</span>
          <span class="fb-traits">${fb.traits.join(' · ')}</span>
        </div>
        <div class="fb-quote">“${fb.quote}”</div>
      `;
      anonymousFeedbackList.appendChild(item);
    });

    // 真相核查
    truthItemsList.innerHTML = '';
    outcome.calculatedItems.forEach(it => {
      const isFired = outcome.firedItems.some(f => f.id === it.id);
      const isRepaired = (it.decision === 'repair');
      const itemEl = document.createElement('div');
      itemEl.className = `truth-item ${isFired ? 'fired' : 'safe'}`;

      if (isRepaired) {
        itemEl.innerHTML = `✅ <strong>${it.title}</strong>：你选择花钱延期彻底修复，风险已在出厂前闭环消除。`;
      } else if (isFired) {
        itemEl.innerHTML = `💥 <strong>${it.title}</strong>：选择 Waive 放行，真实风险 ${it.true_risk}%，上路后如期引爆！`;
      } else {
        itemEl.innerHTML = `🛡️ <strong>${it.title}</strong>：选择 Waive 放行（真实风险 ${it.true_risk}%），幸运未在上路第一周引爆。`;
      }

      truthItemsList.appendChild(itemEl);
    });
  }

  btnRestart.addEventListener('click', () => {
    engine.initProject(engine.projectName);
    showScreen('home');
  });
});
