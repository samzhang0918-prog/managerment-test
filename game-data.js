// 智驾量产沙盘·纯管理者版（《带队吧，总监》）- 静态数据配置
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GameData = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const PRD_CONFIG = {
    game_title: "带队吧，总监",
    game_subtitle: "智驾量产沙盘 · 纯管理者版",
    default_project_name: "未命名智驾项目",
    total_months: 6,
    initial_budget: 8000,
    initial_morale: 72,
    initial_market: 70,
    initial_oem_relation: 60,
    salary_overrun_threshold: 0.08,
    balance: {
      natural_progress_rate: 0.18,
      freeze_converging_sum: 100,
      freeze_stable_sum: 130,
      func_w_progress: 0.5,
      func_w_road: 0.5,
      delay_penalty_per_week: 4,
      blind_waive_risk_min: 25, // 高风险 SOP 项的真实风险判定阈值
      blind_waive_penalty: 10, // 修复投入不足时每放行一项高风险项扣除的安全分
      blind_waive_exempt: ['gnss'], // 没有审计途径的 SOP 项，不计入高风险放行扣分
      knowing_waive_min_repair_weeks: 3, // 高风险项修复投入达到该周数才免扣
      min_improve_actions: 2, // 至少做几次实质改善动作才可能拿 A
      improve_action_ids: ['data_rain', 'road_scene', 'safety_case'], // 实质改善动作；audit/noop/cut/overtime/oem_please_act 不算
      audit_bonus_per_dir: 1.5, // 每个做过隔级审计的方向（路测/数据/功能安全）计入综合分的知情度加分
      dedupe_substantive_actions: true, // 同一实质动作重复做只算 1 次（Sam 规则 4，可关）
      score_weights: {
        safety: 0.30,
        function: 0.25,
        delivery: 0.15,
        cost: 0.15,
        morale: 0.15
      }
    }
  };

  const DIRECTIONS = [
    { id: "perception", name: "感知算法组", short_name: "感知", default_progress: 8 },
    { id: "planning",   name: "规划控制组", short_name: "规控", default_progress: 8 },
    { id: "fs",         name: "功能安全组", short_name: "安全", default_progress: 5 },
    { id: "data",       name: "数据闭环组", short_name: "数据", default_progress: 10 },
    { id: "oem",        name: "车企对接组", short_name: "对接", default_progress: 12 },
    { id: "road",       name: "实车路测组", short_name: "路测", default_progress: 10 }
  ];

  const TRAIT_META = {
    report_pretty: {
      name: "汇报精装修",
      tag_class: "tag-pretty",
      desc: "擅长向上管理与美化周报。高压考核下真实质量不增，反而全力粉饰假指标。"
    },
    no_mgmt: {
      name: "专家傲气/刺头",
      tag_class: "tag-nomgmt",
      desc: "实力强但反感行政命令与形式主义，遇到强压必抗命；认可专业对齐与无责复盘。"
    },
    no_ot: {
      name: "边界感强/反内卷",
      tag_class: "tag-noot",
      desc: "拒绝无意义的狼性加班口号；但在目标清晰（OKR）且排期合理时交付扎实。"
    },
    oem_please: {
      name: "讨好型老好人",
      tag_class: "tag-oem",
      desc: "缺乏权责边界感，外部一施压就私下妥协加回需求，必须靠 CCB 机制严格约束。"
    }
  };

  const TEAM_CARDS = [
    // 感知
    {
      id: "p_paper",
      dir: "perception",
      name: "星海感知组",
      headcount: 18,
      salary_month: 280,
      years: 6,
      blurb: "顶会论文一整页。模型架构新，榜单第一。雨夜与施工难例声称「后续补数据」。",
      true_power: 38,
      traits: ["no_ot"],
      fake_bias: { reported_coverage: 18 },
      anonymous_quotes: {
        micromanaged: "总监天天抓打卡和工时，那我们就多训几个 baseline 模型跑跑榜应付呗。",
        empowered: "终于有个懂技术的领导，不逼我们刷无效榜单，开始啃硬骨头了。"
      }
    },
    {
      id: "p_zhou",
      dir: "perception",
      name: "老周视觉组",
      headcount: 8,
      salary_month: 160,
      years: 12,
      blurb: "两代量产视觉老将。施工、雨夜、锥桶都出过车。开会爱顶嘴，从不吃行政画饼那一套。",
      true_power: 72,
      traits: ["no_mgmt"],
      fake_bias: { reported_coverage: 4 },
      anonymous_quotes: {
        micromanaged: "天天逼签军令状，老子搞量产的时候总监还在背八股文呢，爱签谁签！",
        empowered: "总监愿意帮我们挡住外行的瞎指挥，这帮兄弟愿意为他通宵攻坚。"
      }
    },

    // 规控
    {
      id: "n_lab",
      dir: "planning",
      name: "实验室规划组",
      headcount: 12,
      salary_month: 220,
      years: 5,
      blurb: "接管指标全公司最好看。影子模式准确率高。主驾安全员一准备接管，模型就立刻放假。",
      true_power: 40,
      traits: ["no_ot"],
      fake_bias: { reported_shadow: 16 },
      anonymous_quotes: {
        micromanaged: "领导要看接管率降到零，那让测试员在平直空旷道路上多跑跑就是了，指标多容易刷。",
        empowered: "把接管率改成真难例复盘后，虽然周报没以前惊艳，但车子真的平稳了。"
      }
    },
    {
      id: "n_kai",
      dir: "planning",
      name: "阿凯规控",
      headcount: 6,
      salary_month: 140,
      years: 9,
      blurb: "扎实落地派。城区复杂路口老黄牛，从不画饼。人少，讲求工效平衡，明确不打卡加班。",
      true_power: 68,
      traits: ["no_ot"],
      fake_bias: { reported_shadow: 5 },
      anonymous_quotes: {
        micromanaged: "既要天天开形式主义站会，又要我们零接管，我们只能选择准点下班。",
        empowered: "只要目标清晰、排期讲科学，阿凯组的交付从没掉过链子。"
      }
    },

    // 功能安全
    {
      id: "f_doc",
      dir: "fs",
      name: "认证文档团",
      headcount: 10,
      salary_month: 150,
      years: 7,
      blurb: "ASPICE、ISO 文件贴满整面墙。汇报条理分明。至于冗余制动真代码实现，永远「在流程里」。",
      true_power: 36,
      traits: ["report_pretty"],
      fake_bias: { reported_fs_green: true },
      anonymous_quotes: {
        micromanaged: "总监最吃流程汇报这一套，只要文档格式合规、印章齐全，他挑不出刺。",
        empowered: "隔级访谈被总监问到底层代码真覆盖率，差点没圆过去，必须得补真代码了。"
      }
    },
    {
      id: "f_zhao",
      dir: "fs",
      name: "老赵安全",
      headcount: 4,
      salary_month: 90,
      years: 14,
      blurb: "底线死守者。测试用例不收敛、冗余验证不通过就死活不签字。自报进度极低，脾气又臭又硬。",
      true_power: 74,
      traits: ["no_mgmt"],
      fake_bias: {},
      anonymous_quotes: {
        micromanaged: "想靠领导权威逼我签字放行？做梦。出了事故是人命，有种你找别人代签。",
        empowered: "总监不仅没架空我，还顶住压力支持我的安全底线，这个领导我认！"
      }
    },

    // 数据闭环
    {
      id: "d_out",
      dir: "data",
      name: "海量标注外包",
      headcount: 40,
      salary_month: 180,
      years: 3,
      blurb: "人月充沛、标注流水线飞快。考核争议样本时，习惯直接把模糊 Corner Case 批量标成「忽略」。",
      true_power: 32,
      traits: ["report_pretty"],
      fake_bias: { reported_corners: 20 },
      anonymous_quotes: {
        micromanaged: "KPI 考核每小时标框数，谁有空给你仔细核对难例？忽略键按得手都酸了。",
        empowered: "总监派人下沉到工位做抽检抽查，把忽略刷量给刹住了，逼着大家啃真样本。"
      }
    },
    {
      id: "d_core",
      dir: "data",
      name: "闭环小分队",
      headcount: 7,
      salary_month: 110,
      years: 8,
      blurb: "极客死磕型。进度看似慢吞吞，Corner Case 不跑通仿真闭环绝不汇报完成。反感假大空管理。",
      true_power: 70,
      traits: ["no_ot"],
      fake_bias: { reported_corners: 2 },
      anonymous_quotes: {
        micromanaged: "天天让我们写日报汇报闭环数，真正的工程死磕哪里是日报填得出来的？",
        empowered: "给了我们专门攻关 Badcase 的机制，这才是真正的量产数据闭环。"
      }
    },

    // 车企对接
    {
      id: "o_rel",
      dir: "oem",
      name: "关系驻场组",
      headcount: 6,
      salary_month: 100,
      years: 6,
      blurb: "驻场老好人。车企领导拍桌子就笑脸相迎，什么非标需求都满口答应，让功能冻结形同虚设。",
      true_power: 35,
      traits: ["oem_please"],
      fake_bias: { reported_oem_green: true },
      anonymous_quotes: {
        micromanaged: "总监说要砍需求，但车企科长一瞪眼，我还是悄悄给加上去了，不敢得罪客户呀。",
        empowered: "总监出面设立 CCB 拿流程替我们顶枪，终于不用当两头受气的小媳妇了。"
      }
    },
    {
      id: "o_disc",
      dir: "oem",
      name: "冻结纪律组",
      headcount: 3,
      salary_month: 70,
      years: 11,
      blurb: "原则看门人。严格执行需求变更基线，宁愿挨车企骂也敢坚决挡需求。市场和销售背地里嫌他们呆板。",
      true_power: 66,
      traits: ["no_mgmt"],
      fake_bias: {},
      anonymous_quotes: {
        micromanaged: "总监为了迎合高管天天搞 War Room 突击作秀，把底线全卖光了，纪律组没法干了。",
        empowered: "总监有骨气守住 SOP 节奏，外部虽然骂声多，但产品交付期没被拖垮。"
      }
    },

    // 路测
    {
      id: "r_miles",
      dir: "road",
      name: "里程工厂",
      headcount: 20,
      salary_month: 160,
      years: 4,
      blurb: "十万公里大字报。三城联动、车队规模大。然而里程数绝大部分都是在高速大晴天平坦路段刷出来的。",
      true_power: 34,
      traits: ["report_pretty"],
      fake_bias: { reported_mileage_bias: 25 },
      anonymous_quotes: {
        micromanaged: "管理层考核里程数 KPI，那我们就去高速上踩定速巡航跑圈，大家都省心有奖金。",
        empowered: "考核指标改成了雨夜和极限接管率，虽然假里程上不去了，但测出了真实雷区。"
      }
    },
    {
      id: "r_rain",
      dir: "road",
      name: "城区雨夜队",
      headcount: 9,
      salary_month: 130,
      years: 10,
      blurb: "硬仗突击队。白天晴天基本不出车，专挑台风天、大暴雨、黑夜施工路段摸黑上路。反感形式主义打卡。",
      true_power: 71,
      traits: ["no_ot"],
      fake_bias: { reported_mileage_bias: -5 },
      anonymous_quotes: {
        micromanaged: "晴天大白天让我们去刷毫无意义的公里数交差，简直是侮辱测试工程师的专业。",
        empowered: "总监识货，给雨夜极限测试倾斜了专项资源与调休，兄弟们淋雨也值了！"
      }
    }
  ];

  const MONTHLY_ACTIONS = [
    {
      id: "overtime",
      name: "强推 KPI 军令状 & 末位淘汰（361）",
      short_name: "军令状考核",
      cost: 400,
      requires_dir: true,
      valid_dirs: ["perception", "planning"],
      desc: "划定末位淘汰红线，立下军令状。目标组表面进度大涨，但团队士气受挫。若遇反骨或反卷团队将触发强烈抗命与形式主义应付。"
    },
    {
      id: "data_rain",
      name: "跨部门攻关：建立 Badcase 攻关专班",
      short_name: "攻坚专班",
      cost: 450,
      requires_dir: true,
      valid_dirs: ["data"],
      desc: "打破感知与数据部门墙，建立联合攻坚机制，不搞表面刷量，专项啃下雨夜与施工难例。"
    },
    {
      id: "road_scene",
      name: "设定考核指挥棒（管理导向二选一）",
      short_name: "考核指挥棒",
      cost: 400,
      requires_dir: true,
      valid_dirs: ["road"],
      desc: "决定路测团队的考核导向：是追求规模体面的【总里程 KPI】，还是追求工程真实的【极限场景 OKR】。"
    },
    {
      id: "audit",
      name: "Skip-level 隔级 1-on-1 & 一线走动管理",
      short_name: "隔级摸底",
      cost: 80,
      requires_dir: true,
      valid_dirs: ["data", "road", "fs"],
      desc: "绕过善于精装修周报的各组 TL，管理者亲自深入一线工位与工程师展开 1-on-1。永久揭开真实水位与隐藏风险。"
    },
    {
      id: "cut",
      name: "启动 CCB（变更控制委员会）替团队挡枪",
      short_name: "CCB 挡枪",
      cost: 0,
      requires_dir: false,
      valid_dirs: [],
      desc: "顶住外部高层与客户的非标插单，砍掉伪需求，保护核心研发心流。但若对接团队是讨好型老好人，可能私下妥协撕开冻结。"
    },
    {
      id: "safety_case",
      name: "推行「无责复盘（Blameless）」与红线兜底",
      short_name: "无责复盘机制",
      cost: 500,
      requires_dir: true,
      valid_dirs: ["fs"],
      desc: "投入专项资源，建立“暴露问题不挨罚、死守安全红线”的工程文化。大幅夯实系统真实底线质量。"
    },
    {
      id: "oem_please_act",
      name: "拉通「高管督战室（War Room）」迎合外部",
      short_name: "高管督战室",
      cost: 250,
      requires_dir: true,
      valid_dirs: ["oem"],
      desc: "大张旗鼓搞运动式冲刺，对外部诉求全盘照收。外部关系好看，但打乱研发节奏，令功能冻结倒退，先前挡掉的需求被重新塞回。"
    },
    {
      id: "noop",
      name: "充分授权 / 观察团队自主运转",
      short_name: "充分授权",
      cost: 0,
      requires_dir: false,
      valid_dirs: [],
      desc: "本月不进行额外的行政与考核干预，给予一线充分空间，观察组织在现有机制下的自发运转。"
    }
  ];

  const ROAD_SCENE_OPTIONS = {
    highway: {
      id: "highway",
      name: "考核「总里程数」KPI（规模与汇报导向）",
      desc: "为了冲好看的十万公里大字报，团队专挑晴天高速刷圈。周报假里程+20万公里，但真实工程质量仅+1。"
    },
    urban_rain: {
      id: "urban_rain",
      name: "考核「极限场景有效发现率」OKR（真实价值导向）",
      desc: "专挑恶劣天气与复杂路口测试。虽然表面里程只+4万公里（向老板汇报不好看），但大幅提升感知与路测真实质量。"
    }
  };

  const EMERGENCY_EVENTS = [
    {
      id: "e_oem_add",
      weight: 3,
      title: "高层施压要求强插「必有」汇报亮点",
      body: "车企高管在群里突然发话，要求在下月领导试乘演示中增加高难度施工绕行，研发团队已处于极限负荷。",
      opt_a: {
        text: "拿 CCB 排期红线顶回去，自己挨批抗压",
        desc: "坚守边界，车企关系-6，市场满意-4，但保护了研发节奏，目标收敛升一级。"
      },
      opt_b: {
        text: "直接向下传导压力，强令全盘接下",
        desc: "迎合外部，研发心流被打断，规控进度-8，市场表面满意+6。"
      },
      opt_c: {
        text: "暗示团队做个假演示配置「口头应下」",
        desc: "表面一团和气，车企关系+4；但助长弄虚作假风气，SOP 施工与鬼探头真实风险各+8！"
      }
    },
    {
      id: "e_iface",
      weight: 3,
      title: "部门墙爆发：感知与规控周会拍桌互撕",
      body: "路测车辆发生紧急接管，感知 TL 与规控 TL 在周例会上当众拍桌子互骂对方模块是垃圾，团队内部严重内耗。",
      opt_a: {
        text: "主持接口契约评审，用机制厘清 RACI 权责",
        desc: "对事不对人，以制度破冰，感知与规控进度各+3，团队士气+4。"
      },
      opt_b: {
        text: "公开偏袒汇报好看的感知组，敲打规控",
        desc: "谁会哭给谁吃奶，感知+4，但规控心寒-6，团队士气-4。"
      },
      opt_c: {
        text: "嫌他们吵闹，各打五十大板不予理会",
        desc: "矛盾转入地下，冷暴力蔓延，团队士气大降-8。"
      }
    },
    {
      id: "e_no_rain",
      weight: 2,
      title: "团队抗拒苦活：路测组集体抵制雨夜出车",
      body: "一线路测队员抱怨连日暴雨出车危险且没有额外补贴，排班表无人报名，甚至出现集体请病假苗头。",
      opt_a: {
        text: "制度化倾斜专项补贴与轮休关怀",
        desc: "以制度体恤一线，士气+3，进度因轮休小幅-2。"
      },
      opt_b: {
        text: "公开红黑榜通报批评，扣发当月绩效奖金",
        desc: "杀鸡儆猴，强行出车进度+4，但引发强烈怨气，团队士气-12！"
      },
      opt_c: {
        text: "下达行政死命令强制全员加班出车",
        desc: "直接按军令状强压结算（若团队带反卷特质将抗命减半）。"
      }
    },
    {
      id: "e_label",
      weight: 2,
      title: "匿名吹哨信：数据团队为冲 KPI 批量刷量",
      body: "管理者信箱收到匿名信，反映标注团队为满足高压完成率 KPI，把大量难例争议样本直接勾选为「忽略」。",
      opt_a: {
        text: "果断整顿考核体系，更换不合格供应商",
        desc: "刮骨疗毒，投入整顿资金-60万，数据闭环真质量+8。"
      },
      opt_b: {
        text: "压下举报，维持周报数据向高管展示的繁荣",
        desc: "默许造假，数据真质量-6，但下月假周报指标再虚增+10。"
      },
      opt_c: {
        text: "亲自开展 Skip-level 隔级工位摸底",
        desc: "立刻免费触发一次数据闭环隔级审计，查明真实标注争议率！"
      }
    },
    {
      id: "e_sign",
      weight: 2,
      title: "技术专家犯倔：安全负责人拒绝在放行单签字",
      body: "阶段评审节点已到，全流程都在等安全负责人签字，但他坚持「冗余制动覆盖率没收敛，签了就是对人命犯罪」。",
      opt_a: {
        text: "尊重专业权威，顶住催促支持他守住底线",
        desc: "安全进度稳健+2，团队士气+2，赢得技术骨干真心敬畏。"
      },
      opt_b: {
        text: "嫌他「缺乏大局观」，撤换为听话的员工代签",
        desc: "表面进度+8，但劣币驱逐良币，安全真质量-10，士气-6。"
      },
      opt_c: {
        text: "动用管理者职权强行签字“特批放行”",
        desc: "安全状态表面变绿，但摧毁了敬畏心，SOP 冗余项真实风险暴涨+15！"
      }
    },
    {
      id: "e_competitor",
      weight: 2,
      title: "老板深夜转文章进高管群：「看看友商的速度！」",
      body: "竞品高调发布无图智驾方案并全网刷屏，大老板凌晨在群里转发并连发三个问号，全团队都看着你的表态。",
      opt_a: {
        text: "做好向上预期管理，向老板客观解析技术节奏",
        desc: "担当团队减震器，顶住焦虑不折腾团队，无负面冲击。"
      },
      opt_b: {
        text: "当「焦虑二传手」，连夜推翻排期跟进竞品热点",
        desc: "朝令夕改，等同启动高管督战室效果，功能冻结倒退降级。"
      },
      opt_c: {
        text: "抽调骨干通宵赶制对比 PPT 安抚老板",
        desc: "公关动作，表面市场口碑假值+5，但白白消耗研发心力。"
      }
    },
    {
      id: "e_ip",
      weight: 2,
      title: "SOP 前夕曝出底层技术债（标定与架构隐患）",
      body: "外部核心供应商私下修改了传感器底层标定参数，一线工程师神色凝重地请示你要不要全面重测。",
      opt_a: {
        text: "批专项经费组织攻关组打小步快跑补丁",
        desc: "务实止损，花费40万预算，感知真质量+3。"
      },
      opt_b: {
        text: "主动向高层坦白风险，申请延期一周彻底重构",
        desc: "勇担管理责任，消耗180万，延期1周，感知真质量大幅+8！"
      },
      opt_c: {
        text: "捂盖子：「别声张，先按原计划如期交付」",
        desc: "感知真质量-4，SOP 雨夜行人漏检真实风险激增+10！"
      }
    },
    {
      id: "e_ot_refuse",
      weight: 4,
      title: "HRBP 预警：某核心团队出现「静音式躺平」",
      body: "协作平台显示某核心团队近期打卡卡点、周会鸦雀无声，对于管理指令一概回复「收到」但无任何主动推进。",
      opt_a: {
        text: "开展一对一深谈，主动为团队砍掉形式主义会议",
        desc: "真诚倾听诉求，为一线减负增效，团队士气恢复+4。"
      },
      opt_b: {
        text: "约谈该组 TL 敲打，提醒其抓好组内作风",
        desc: "温和管理，隔靴搔痒，士气微幅+2。"
      },
      opt_c: {
        text: "在全员月度例会上点名痛批「缺乏狼性」",
        desc: "把团队彻底推向对立面，组织信任崩塌，士气暴降-6。"
      }
    }
  ];

  const SOP_ITEMS = [
    {
      id: "rain_ped",
      title: "雨夜行人漏检隐患",
      desc: "恶劣雨雾夜晚低照度下，横穿马路行人的误检与漏检风险。",
      repair_cost: 600,
      repair_weeks: 2,
      base_risk: 52,
      risk_from: ["perception.true_quality", "road.true_quality", "data.true_quality"]
    },
    {
      id: "cone",
      title: "施工区与异形锥桶绕行",
      desc: "城市与高架施工导流区，异形障碍物侵限判定迟缓。",
      repair_cost: 350,
      repair_weeks: 1,
      base_risk: 36,
      risk_from: ["perception.true_quality", "planning.true_quality"]
    },
    {
      id: "ghost",
      title: "鬼探头与异形三轮车",
      desc: "盲区突然冲出非机动车及异形农用车时的紧急减速与博弈逻辑。",
      repair_cost: 550,
      repair_weeks: 2,
      base_risk: 42,
      risk_from: ["perception.true_quality", "data.true_quality"]
    },
    {
      id: "gnss",
      title: "长隧道与高架 GNSS 丢失",
      desc: "卫星信号遮挡后惯导积分漂移导致的轨迹突变。",
      repair_cost: 300,
      repair_weeks: 1,
      base_risk: 30,
      risk_from: ["planning.true_quality"]
    },
    {
      id: "brake",
      title: "冗余制动切换链路未齐",
      desc: "主控死机或总线挂死时，冗余控制器未能在 50ms 内接管减速。",
      repair_cost: 800,
      repair_weeks: 2,
      base_risk: 40,
      risk_from: ["fs.true_quality"]
    },
    {
      id: "label",
      title: "争议样本未关闭与标注脏数据",
      desc: "为冲进度忽略的数万张标注争议样本，导致模型泛化失真。",
      repair_cost: 120,
      repair_weeks: 1,
      base_risk: 28,
      risk_from: ["true_label_dispute"]
    }
  ];

  const BRICK_SUBTITLES = [
    "雨夜行人漏检，发布会还在热搜上，车企连夜叫停交付",
    "冗余制动没齐，试驾第一周主控死机直接撞墙",
    "盲区鬼探头急刹失败，车主维权视频霸榜各大平台",
    "示波器上有完美波形，但路上没有了生命"
  ];

  const PENALTY_BRICK_SUBTITLE = "多项高风险红线带病放行，安全评审一票否决，项目上路前被叫停";

  // 纯管理者版特有的管理风格画像
  const MANAGEMENT_PROFILES = [
    {
      id: "goodhart",
      title: "古德哈特陷阱亲历者",
      tagline: "“当你把指标变成考核军令状时，你得到的只有精装修的假象。”",
      condition: (history) => history.filter(h => h.action_id === 'overtime').length >= 2,
      desc: "你极度青睐高压 KPI 与军令状管理。周报上的数字被团队刷到了前所未有的高度，但团队为了避嫌开始集体糊弄，把真正的隐患深埋在代码底层。"
    },
    {
      id: "relay",
      title: "高层焦虑二传手",
      tagline: "“上面一施压，底下就地震；朝令夕改是团队最大的内耗。”",
      condition: (history, state) => history.filter(h => h.action_id === 'oem_please_act').length >= 2,
      desc: "你习惯于把外部与老板的焦虑不加过滤地全盘倒向一线，频繁拉通 War Room 搞运动式作秀，反复撕碎研发团队好不容易收敛的节奏。"
    },
    {
      id: "blind",
      title: "办公室里的盲人总监",
      tagline: "“坐在办公室里看周报，永远看不到一行真实的工程代码。”",
      condition: (history, state) => !state.audited.road && !state.audited.data && !state.audited.safety,
      desc: "6 个月里你从未下沉一线做过哪怕一次 Skip-level 隔级摸底。你被精装修的 PPT 与虚高的里程数字彻底蒙蔽，活在自己编织的量产盛世中。"
    },
    {
      id: "shield",
      title: "赋能型破局者",
      tagline: "“给团队当减震器与挡风墙，让专业的人敢于做专业的事。”",
      condition: (history, state) => history.filter(h => h.action_id === 'cut' || h.action_id === 'safety_case').length >= 2,
      desc: "你懂得在外部狂风暴雨中用 CCB 为团队守住边界，用无责复盘建立心理安全感。技术骨干愿意为你啃硬骨头，带出了一支敢说真话的硬核之师。"
    },
    {
      id: "balanced",
      title: "实干平衡型管理者",
      tagline: "“在业务逼仄与组织人性之间，艰难走钢丝的量产操盘手。”",
      condition: () => true, // fallback
      desc: "你在高压交付、有限资源与组织情绪之间努力寻找平衡。你体会到了管理的复杂与权衡，深刻理解了每一个制度背后的代价。"
    }
  ];

  function deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    Object.getOwnPropertyNames(obj).forEach((key) => {
      const val = obj[key];
      if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
        deepFreeze(val);
      }
    });
    return Object.freeze(obj);
  }

  // 深冻结除 PRD_CONFIG 外的全局静态常量（保留 PRD_CONFIG 可写以便测试临时覆盖 balance）
  [
    DIRECTIONS,
    TRAIT_META,
    TEAM_CARDS,
    MONTHLY_ACTIONS,
    ROAD_SCENE_OPTIONS,
    EMERGENCY_EVENTS,
    SOP_ITEMS,
    BRICK_SUBTITLES,
    MANAGEMENT_PROFILES
  ].forEach(deepFreeze);

  return {
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
  };
});
