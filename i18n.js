/* ==========================================================================
   CineGBA IP-Bridge · 双语（中文 / English）
   ─ 机制：
     · CG.t(key, vars)  取词；缺英文时回退中文，再缺就回退 key
     · <html data-lang> + localStorage 记住选择
     · 静态外壳（index.html）用 [data-i18n] 标记，切语言时直接换 textContent
     · 视图是 JS 渲染的，切语言后调 CG.render() 重跑当前页即可
     · 数据层（授权类型 / 素材类型 / 状态）在 data.js 里带 *En 字段，
       由 U.licOf / U.typeOf / U.statusPill 按当前语言取
   ─ 不翻译的东西：作品标题与描述、机构名、编号 —— 这些是原始内容，
     真实的跨境素材库也是原文展示，不做机器翻译。
   ========================================================================== */
(function () {
  'use strict';
  const CG = window.CG = window.CG || {};

  const ZH = {}, EN = {};
  const def = (k, zh, en) => { ZH[k] = zh; if (en != null) EN[k] = en; };

  /* ---------------- 通用 ---------------- */
  def('common.search', '搜索', 'Search');
  def('common.more', '查看全部', 'View all');
  def('common.expand', '展开', 'Expand');
  def('common.collapse', '收起', 'Collapse');
  def('common.cancel', '取消', 'Cancel');
  def('common.confirm', '确定', 'OK');
  def('common.close', '关闭', 'Close');
  def('common.back', '返回', 'Back');
  def('common.save', '保存', 'Save');
  def('common.edit', '编辑', 'Edit');
  def('common.start', '起', 'from');
  def('common.views', '浏览', 'views');
  def('common.items', '件', 'items');
  def('common.lang', 'EN', '中文');

  /* ---------------- 外壳：顶栏 / 分区 / 侧栏 ---------------- */
  def('shell.note', '香港 · 粤港澳大湾区', 'Hong Kong · Greater Bay Area');
  def('shell.brandSub', '影视动漫 AI 资产确权与合规授权', 'RIGHTS · EVIDENCE · LICENCE');
  def('shell.searchPh', '搜索作品、授权、编号…', 'Search works, licences, IDs…');
  def('shell.cart', '选购车', 'Cart');
  def('shell.notif', '通知', 'Notifications');
  def('shell.account', '账户', 'Account');
  def('shell.connecting', '连接中…', 'Connecting…');
  def('shell.modeFs', '本地数据站', 'Local data store');
  def('shell.modeIdb', '浏览器存储', 'Browser storage');

  def('zone.home', '首页', 'Home');
  def('zone.homeSub', '品牌与精选合集', 'Brand & collections');
  def('zone.market', '素材市场', 'Marketplace');
  def('zone.marketSub', '浏览与采购可授权素材', 'Browse & license assets');
  def('zone.creator', '创作者中心', 'Creator');
  def('zone.creatorSub', '存证 · 授权 · 收入 · 维权', 'Evidence · Licence · Revenue');
  def('zone.consumer', '消费者中心', 'Buyer');
  def('zone.consumerSub', '收藏 · 选购 · 订单', 'Saved · Cart · Orders');

  def('side.groupCreate', '创作', 'Create');
  def('side.groupTrade', '交易与维权', 'Trade & rights');
  def('side.groupAccount', '账户', 'Account');
  def('side.groupVisit', '逛与买', 'Browse & buy');
  def('side.dash', '工作台', 'Dashboard');
  def('side.library', '作品库', 'Library');
  def('side.upload', '上传作品', 'Upload');
  def('side.promote', '宣发中心', 'Promotion');
  def('side.revenue', '收入中心', 'Revenue');
  def('side.dispute', '维权中心', 'Enforcement');
  def('side.settings', '认证与设置', 'Verification');
  def('side.consumer', '消费者中心', 'Buyer hub');
  def('side.cart', '选购车', 'Cart');
  def('side.orders', '我的订单', 'Orders');
  def('side.favorites', '我的收藏', 'Saved');
  def('side.verified', '企业认证已通过', 'Verified entity');
  def('side.org', '大湾区晨曦动画工作室', 'GBA Dawn Animation Studio');
  def('side.orgNo', '编号', 'No.');

  def('mobnav.home', '主页', 'Home');
  def('mobnav.market', '市场', 'Market');
  def('mobnav.upload', '上传', 'Upload');
  def('mobnav.cart', '选购车', 'Cart');
  def('mobnav.me', '我的', 'Me');

  /* ---------------- 落地页 ---------------- */
  def('lp.navCap', '能力', 'Capabilities');
  def('lp.navHow', '流程', 'Process');
  def('lp.navLic', '授权类型', 'Licences');
  def('lp.navBoundary', '边界', 'Limits');
  def('lp.login', '登录', 'Log in');
  def('lp.join', '免费入驻', 'Get started');
  def('lp.kicker', '香港 · 粤港澳大湾区', 'Hong Kong · Greater Bay Area');
  def('lp.h1', '让每一帧素材<br>可授权、可结算、可举证', 'Every frame you own<br>licensable, payable, provable');
  def('lp.lead', '影视动漫公司的素材长期被白用、被压价、被拿走训练模型却无从追索。CineGBA IP-Bridge 把内容指纹、存证记录与标准化授权合约接在一起，让权利可查、交易可签、收益可分。',
    'Film and animation catalogues keep getting used for free, underpriced, or scraped for model training — with no way to trace it. CineGBA IP-Bridge connects content fingerprints, registry records and standard licensing contracts, so rights are searchable, deals are signable and revenue is shareable.');
  def('lp.ctaJoin', '免费入驻，上传即存证', 'Get started — upload and register');
  def('lp.ctaLogin', '已有账号，登录', 'I already have an account');
  def('lp.stat1', '种标准化授权类型', 'standard licence types');
  def('lp.stat2', '路存证并行', 'parallel evidence rails');
  def('lp.stat3', '平台佣金（成交额）', 'platform fee (GMV)');

  def('lp.capH', '三件事，做成一套', 'Three jobs, one system');
  def('lp.capHSub', '不是把区块链、AI、版权三个词拼在一起，而是让它们各自解决一个具体问题。',
    'Not blockchain-plus-AI-plus-copyright as buzzwords — each one solves a specific problem.');
  def('lp.cap1t', '多模态内容指纹', 'Multimodal fingerprint');
  def('lp.cap1p', '画面、音频、文本、3D 模型分别提取指纹，用于跨平台比对。指纹是当前唯一经大规模工业验证的比对方案。',
    'Visual, audio, text and 3D assets each yield their own fingerprint for cross-platform matching — the only comparison method proven at industrial scale.');
  def('lp.cap1l1', '四种模态独立提取', 'Four modalities extracted separately');
  def('lp.cap1l2', '比对结果只作线索，不作侵权认定', 'Matches are leads, not infringement verdicts');
  def('lp.cap1l3', '水印不作为存证依据', 'Watermarks are not treated as evidence');
  def('lp.cap2t', '三路存证并行', 'Three evidence rails');
  def('lp.cap2p', '链上存证、作品自愿登记、可信时间戳三路同时呈现，每条都写明自己的效力边界。',
    'On-chain hash, voluntary registration and trusted timestamp shown side by side, each stating the limits of what it proves.');
  def('lp.cap2l1', '链上存证：证明该时点存在该指纹', 'On-chain: proves the fingerprint existed at that moment');
  def('lp.cap2l2', '作品登记：法定证书，效力最高', 'Registration: statutory certificate, strongest effect');
  def('lp.cap2l3', '时间戳：电子数据真实性的辅助证据', 'Timestamp: corroborating evidence for electronic data');
  def('lp.cap3t', '合规授权交易', 'Compliant licensing');
  def('lp.cap3p', '把「AI 训练数据授权」「片段引用」「改编权」等做成可选商品，条款、范围、期限、分成写清楚再成交。',
    'AI-training, clip-usage and adaptation rights become purchasable items — with clauses, scope, term and split set before the deal closes.');
  def('lp.cap3l1', '5 种标准化授权类型', '5 standard licence types');
  def('lp.cap3l2', '在线询价、回签、生成合约', 'Quote, accept and contract online');
  def('lp.cap3l3', '收益进入结算，按成交额抽佣', 'Revenue settles automatically, fee on GMV');

  def('lp.howH', '从上传到结算，四步', 'From upload to payout, in four steps');
  def('lp.howHSub', '每一步都留下可查的记录，任一步都可以停下来不做。',
    'Every step leaves an auditable record — and any step can be skipped.');
  def('lp.how1t', '上传作品', 'Upload');
  def('lp.how1p', '拖入文件后，系统生成指纹并落库，原始文件加密留存，对外只展示带水印预览。',
    'Drop a file and the system fingerprints it, stores it, encrypts the original and shows only a watermarked preview.');
  def('lp.how2t', '登记存证', 'Register');
  def('lp.how2p', '链上存证与可信时间戳自动完成；作品自愿登记需要人工办理，可后补。',
    'On-chain and timestamp rails run automatically; voluntary registration is filed by hand and can be added later.');
  def('lp.how3t', '配置授权', 'Licence');
  def('lp.how3p', '选择授权类型、适用范围、期限与价格，含肖像或声音的作品需先补充授权文件才能上架。',
    'Pick licence type, scope, term and price. Works containing likeness or voice need supporting files before listing.');
  def('lp.how4t', '交易与结算', 'Trade & settle');
  def('lp.how4p', '采购方询价、你回签、合同生效、收益入账。跨境结算走合规通道，不做承诺性宣传。',
    'Buyers request a quote, you countersign, the contract takes effect, revenue lands. Cross-border settlement runs on compliant rails.');

  def('lp.licH', '五种授权，法律含义不同', 'Five licences, five legal meanings');
  def('lp.licHSub', '「AI 训练」和「改编权」不是一回事，用户点错一次可能就是永久性的权利让渡，所以要写清楚。',
    'AI training and adaptation rights are not the same thing — one mis-click can be a permanent transfer, so each is spelled out.');
  def('lp.boundH', '我们明确不承诺的事', 'What we explicitly do not promise');
  def('lp.boundHSub', '这一页放在官网而不是藏在用户协议里，是因为说清楚比说好更好卖。',
    'This page sits on the website instead of buried in the terms — being clear sells better than sounding impressive.');
  def('lp.finalH', '先上传一件作品，看看能生成什么', 'Upload one work and see what comes out');
  def('lp.finalSub', '不需要信用卡，不需要接入系统。上传即生成指纹与存证凭证。',
    'No card, no integration. Upload and get a fingerprint plus an evidence certificate.');
  def('lp.demoLogin', '用演示账号看看', 'Try the demo account');
  def('lp.footNote', '本网站为课程项目原型，数据全部虚构。', 'Course prototype — all data is fictional.');
  def('lp.footRight', '演示数据 · 非真实业务 · 不构成法律意见', 'Demo data · not a live service · not legal advice');
  def('lp.licUnit', '计价：', 'Priced: ');
  def('lp.footP', '连接香港国际版权枢纽与大湾区内容产能。<br>本站为课程项目原型，数据全部虚构。',
    'Bridging Hong Kong’s copyright hub with Greater Bay Area production capacity.<br>Course prototype — all data is fictional.');
  def('lp.footProduct', '产品', 'Product');
  def('lp.footTrust', '信任', 'Trust');
  def('lp.footRef', '合规参考', 'References');
  def('lp.footBoundary', '边界声明', 'Limits');
  def('lp.footJoin', '入驻', 'Join');

  def('lp.b1t', '存证不等于确权', 'Registration is not ownership');
  def('lp.b1p', '香港没有区块链存证的法定推定规则；内地《人民法院在线诉讼规则》第 16 条是可反驳的推定，且只覆盖上传之后的完整性。存证提升可追溯性，不产生权属推定。',
    'Hong Kong has no statutory presumption for on-chain records; Article 16 of the Mainland online-litigation rules is a rebuttable presumption covering only post-upload integrity. Registration improves traceability, not title.');
  def('lp.b2t', '相似度不等于侵权认定', 'Similarity is not infringement');
  def('lp.b2p', '指纹匹配度是技术指标，不是法律结论。是否构成侵权需要人工判断，平台不代替权利人作出法律判断，也不承诺维权成功率。',
    'A fingerprint match is a technical signal, not a legal conclusion. Infringement needs human judgement; the platform does not decide for rights holders and does not promise success rates.');
  def('lp.b3t', '水印不是证据', 'Watermarks are not evidence');
  def('lp.b3p', '公开研究显示水印在对抗性攻击下可被低成本去除，单样本即可完成去除与伪造。我们不把水印作为存证依据。',
    'Public research shows watermarks can be stripped cheaply under adversarial attack, even from a single sample. We do not treat watermarks as evidence of registration.');
  def('lp.b4t', '成本是目标值，不是实测值', 'Cost is a target, not a measurement');
  def('lp.b4p', '「单笔授权成本低于 1 美元」是设计目标，需要 MVP 实测验证。行业参照：传统授权单笔约 400 美元，AI 侵权诉讼单案从百万级起算。',
    '“Under US$1 per licence” is a design goal pending MVP validation. For reference, a traditional licence costs about US$400, and AI infringement litigation starts in the millions.');

  /* ---------------- 四道门 ---------------- */
  def('gate.law', '法律确定性', 'Legal certainty');
  def('gate.cert', '权利认证', 'Rights certification');
  def('gate.gate', '双向通道', 'Two-way corridor');
  def('gate.arb', '争议解决', 'Dispute resolution');
  def('gate.lawShort', 'TDM 豁免立法中，为 AI 训练定性', 'TDM exemption in progress');
  def('gate.certShort', 'MPIA 为国家版权局指定机构', 'MPIA is a designated body');
  def('gate.gateShort', 'CEPA 北上免配额，东盟南下已验证', 'CEPA northbound, ASEAN southbound');
  def('gate.arbShort', '普通法 + 中英双语 + 国际仲裁', 'Common law + bilingual + arbitration');

  /* ---------------- 登录 / 注册 ---------------- */
  def('au.login', '登录', 'Log in');
  def('au.register', '注册', 'Sign up');
  def('au.welcome', '欢迎回来', 'Welcome back');
  def('au.loginSub', '登录后进入创作者工作台', 'Sign in to your creator workspace');
  def('au.email', '邮箱', 'Email');
  def('au.pw', '密码', 'Password');
  def('au.pwPh', '至少 6 位', 'At least 6 characters');
  def('au.forgot', '忘记密码？', 'Forgot password?');
  def('au.go', '登录', 'Log in');
  def('au.fillDemo', '一键填入', 'Fill demo account');
  def('au.noAccount', '还没有账号？', 'No account yet?');
  def('au.toRegister', '免费注册', 'Sign up free');
  def('au.hasAccount', '已有账号？', 'Already registered?');
  def('au.toLogin', '去登录', 'Log in');
  def('au.regH', '创建账号', 'Create an account');
  def('au.regSub', '注册后直接进入工作台，可先上传一件作品试试。',
    'You land in the workspace right away — start with one upload.');

  /* ---------------- 首页 ---------------- */
  def('hm.sec1', '01 — 香港 · 粤港澳大湾区 · C2PA 兼容', '01 — Hong Kong · Greater Bay Area · C2PA ready');
  def('hm.h1', '每一件素材<br>都带着它的<em>证据</em>', 'Every asset arrives<br>with its <em>evidence</em>');
  def('hm.lead', '上传即生成多模态指纹，同步写入联盟链、版权登记与可信时间戳。授权条款、成交记录、侵权取证 —— 全部挂在这一份证据上，不是挂在截图和聊天记录上。',
    'Uploading produces a multimodal fingerprint, written to the consortium chain, copyright registry and a trusted timestamp at once. Licence terms, deal records and enforcement evidence all hang off that one record — not off screenshots and chat logs.');
  def('hm.searchPh', '搜索素材：国风动画、城市空镜、配乐…', 'Search: animation, city plates, score…');
  def('hm.hot', '热门：', 'Trending:');
  def('hm.m1', '件已存证素材', 'registered assets');
  def('hm.m2', '路登记并行', 'evidence rails');
  def('hm.m3', '种授权类型', 'licence types');
  def('hm.m4', '条待处理询价', 'open quotes');
  def('hm.evH', '02 — 最近存证', '02 — Latest registrations');
  def('hm.evSub', '链上写入 · 逐件可查', 'On-chain · verifiable per asset');
  def('hm.sec3', '03 — 为什么是香港', '03 — Why Hong Kong');
  def('hm.sec3Lead', 'AI 授权的四道门——只有这四道同时开着，这门生意才成立。',
    'Four gates for AI licensing — the business only works when all four are open at once.');
  def('hm.sec4', '04 — 按类型进入', '04 — Browse by type');
  def('hm.sec5', '05 — 精选合集', '05 — Curated collections');
  def('hm.sec5Lead', '由编辑按主题挑选，每期更新。', 'Hand-picked by editors, refreshed each cycle.');
  def('hm.sec6', '06 — 最近热门', '06 — Trending now');
  def('hm.ctaH', '把你手上的素材登记进来', 'Register what you already own');
  def('hm.ctaP', '上传即生成指纹与三路存证，配置好授权就能进入市场。',
    'Upload to get a fingerprint and three evidence rails; configure licences and you are on the market.');
  def('hm.ctaBtn', '上传作品', 'Upload a work');
  def('hm.ctaBtn2', '去看消费者中心', 'Browse as a buyer');
  def('hm.coll1', '城市与夜', 'City & night');
  def('hm.coll1Sub', '都市空镜 · 霓虹色调 · 4K', 'Urban plates · neon grade · 4K');
  def('hm.coll2', '概念设定', 'Concept design');
  def('hm.coll2Sub', '美术参考 · 设定集', 'Art reference · bible');
  def('hm.coll3', '氛围音景', 'Ambient soundscape');
  def('hm.coll3Sub', '配乐 · 环境声', 'Score · ambience');

  /* ---------------- 素材市场 ---------------- */
  def('mk.title', '素材市场', 'Marketplace');
  def('mk.sub', '件可采购素材 · 预览带水印 · 采购后交付无水印原件',
    'licensable assets · watermarked previews · clean originals on purchase');
  def('mk.sortHot', '最热', 'Popular');
  def('mk.sortNew', '最新', 'Newest');
  def('mk.sortCheap', '价格低', 'Price ↑');
  def('mk.sortExp', '价格高', 'Price ↓');
  def('mk.clear', '清空筛选', 'Clear filters');
  def('mk.f-type', '类型', 'Type');
  def('mk.f-lic', '授权方式', 'Licence');
  def('mk.f-price', '价格', 'Price');
  def('mk.priceAll', '全部', 'Any');
  def('mk.price1', '100 元以下', 'Under ¥100');
  def('mk.price2', '100 — 1000 元', '¥100 — ¥1,000');
  def('mk.price3', '1000 元以上', 'Over ¥1,000');
  def('mk.pageInfo', '页 · 共', 'of');
  def('mk.inq', '询价 →', 'Quote →');
  def('mk.verified', '已存证', 'Registered');
  def('mk.rails', '3 路', '3 rails');
  def('mk.fp', '指纹', 'FP');
  def('mk.empty', '没有符合条件的素材', 'No assets match these filters');
  def('mk.emptySub', '换个筛选条件，或直接清空。', 'Try different filters, or clear them.');
  def('mk.assets', '件', 'items');

  def('mk.subTail', '件可采购素材 · 预览带水印 · 采购后交付无水印原件',
    'licensable assets · watermarked previews · clean originals on purchase');
  def('mk.f-type', '类型', 'Type');
  def('mk.f-lic', '授权方式', 'Licence');
  def('mk.prev', '上一页', 'Previous');
  def('mk.next', '下一页', 'Next');

  def('au.goReg', '注册并进入工作台', 'Create account and enter');
  def('au.demoH', '演示账号', 'Demo account');
  def('au.sideH', '把素材变成<br>可结算的资产', 'Turn assets into<br>settleable value');
  def('au.side1t', '上传即存证', 'Evidence on upload');
  def('au.side1p', '指纹、链上记录、时间戳一次生成', 'Fingerprint, chain record and timestamp in one pass');
  def('au.side2t', '授权可配置', 'Configurable licences');
  def('au.side2p', '五种授权类型，价格与范围自己定', 'Five licence types — set your own scope and price');
  def('au.side3t', '收益看得见', 'Revenue you can see');
  def('au.side3p', '每笔进账的授权类型与合约都能追溯', 'Every payment traces back to a licence and a contract');
  def('au.sideFoot', '课程项目原型 · 演示数据', 'Course prototype · demo data');

  /* ---------------- 工作台 ---------------- */
  def('dash.hello', '下午好，{name}', 'Good afternoon, {name}');
  def('dash.upload', '上传并存证', 'Upload & register');
  def('dash.k1', '已存证作品', 'Registered works');
  def('dash.k1d', '共 {n} 件 · 在售 {l} 件', '{n} total · {l} listed');
  def('dash.k2', '疑似侵权线索', 'Infringement leads');
  def('dash.k2d', '待确认 {a} · 已处置 {b}', '{a} to confirm · {b} handled');
  def('dash.k3', '本月授权收入', 'Licence revenue this month');
  def('dash.k3d', '已扣除平台佣金', 'Net of platform fee');
  def('dash.k4', '累计收入', 'Lifetime revenue');
  def('dash.k4d', '含待结算 {p}', 'Includes {p} pending');
  def('dash.todo', '待处理事项', 'Needs attention');
  def('dash.todoN', '共 {n} 项', '{n} items');
  def('dash.todo1', '新侵权线索 {n} 条', '{n} new infringement leads');
  def('dash.todo2', '待确认询价 {n} 条', '{n} quotes awaiting confirmation');
  def('dash.todo2d', '最高一单 {p}，等待你回签', 'Highest {p}, awaiting your countersignature');
  def('dash.todo3', '待结算 {p}', '{p} pending settlement');
  def('dash.todo3d', '已确认收益，可提现至香港对公账户', 'Confirmed revenue — withdrawable to a HK corporate account');
  def('dash.todo4', '{n} 件作品还没有存证', '{n} works not yet registered');
  def('dash.todo4d', '草稿状态的作品无法上架，也不能发起授权', 'Drafts cannot be listed or licensed');

  def('dash.chart', '近 12 天收入', 'Revenue · last 12 days');
  def('dash.byday', '按日', 'Daily');
  def('dash.chartFoot', '合计 {p} · 已扣除平台佣金', 'Total {p} · net of platform fee');
  def('dash.top', '作品被授权 Top 5', 'Most licensed works');
  def('dash.feed', '平台动态', 'Activity');
  def('dash.note', '口径：按已结算 + 待结算的授权收入统计', 'Basis: settled plus pending licence revenue');

  def('lp.stocked', '入库', 'Ingested');

  CG.I18N = { zh: ZH, en: EN };

  const LS = 'cg-lang';
  let lang = 'zh';
  try { lang = localStorage.getItem(LS) === 'en' ? 'en' : 'zh' } catch (e) { }

  CG.getLang = function () { return lang };
  CG.isEn = function () { return lang === 'en' };

  /* t('a.b', {n: 3}) —— {n} 会被替换 */
  CG.t = function (key, vars) {
    const dict = lang === 'en' ? EN : ZH;
    let s = dict[key];
    if (s == null) s = ZH[key];
    if (s == null) s = key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : vars[k]));
    return s;
  };
  const t = CG.t;

  /* 静态外壳：换掉所有 [data-i18n] 的文案 / [data-i18n-ph] 的占位符 */
  CG.applyShellI18n = function (root) {
    const r = root || document;
    r.querySelectorAll('[data-i18n]').forEach(function (el) {
      const v = t(el.dataset.i18n);
      if (el.innerHTML !== v) el.innerHTML = v;
    });
    r.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      const v = t(el.dataset.i18nPh);
      if (el.placeholder !== v) el.placeholder = v;
    });
    r.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.title = t(el.dataset.i18nTitle);
    });
  };

  /* 切换语言：写标记 → 换外壳 → 重渲染当前视图 */
  CG.setLang = function (next) {
    lang = next === 'en' ? 'en' : 'zh';
    try { localStorage.setItem(LS, lang) } catch (e) { }
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.documentElement.setAttribute('data-lang', lang);
    CG.applyShellI18n();
    CG.syncLangButtons();
    /* 视图是 JS 渲染的，重跑一遍即可。
       注意公开页（落地 / 登录 / 注册）不走 CG.render，由 app.js 监听 cg:lang 重画 */
    document.dispatchEvent(new CustomEvent('cg:lang'));
    try { if (CG.syncBadges) CG.syncBadges() } catch (e) { }
  };

  CG.toggleLang = function () { CG.setLang(lang === 'en' ? 'zh' : 'en') };

  /* 语言按钮的文案（按钮本身出现在顶栏、落地页、登录页，会随渲染重建，
     所以用事件委托，不逐个绑 onclick） */
  CG.syncLangButtons = function () {
    document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
      b.textContent = t('common.lang');
      b.setAttribute('aria-label', lang === 'en' ? 'Switch to Chinese' : '切换到英文');
    });
  };

  /* 启动时套一次 */
  CG.initI18n = function () {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.documentElement.setAttribute('data-lang', lang);
    CG.applyShellI18n();
    CG.syncLangButtons();
    if (!document.__cgLangBound) {
      document.__cgLangBound = true;
      document.addEventListener('click', function (e) {
        const b = e.target && e.target.closest ? e.target.closest('[data-lang-btn]') : null;
        if (!b) return;
        e.preventDefault();
        CG.toggleLang();
      }, true);
    }
  };
})();
