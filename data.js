/* ==========================================================================
   CineGBA IP-Bridge · 种子数据（全部虚构，仅用于原型演示）
   ========================================================================== */
window.CG = window.CG || {};

CG.LICENSE_KINDS = {
  'ai-training': { label: 'AI 训练数据授权', short: 'AI 训练', pill: 'c',
    desc: '授权购买方将作品用于机器学习模型的训练、微调与评测。授权不可撤回，需披露训练用途。',
    unit: 'per-year', unitLabel: '元 / 年 / 模型' },
  'clip':        { label: '片段引用授权', short: '片段引用', pill: 'c',
    desc: '授权在正片、广告、短视频等场景中按约定时长引用作品片段，不得单独再分发。',
    unit: 'per-piece', unitLabel: '元 / 条' },
  'adaptation':  { label: '改编权授权', short: '改编权', pill: 'w',
    desc: '授权对人物、世界观、剧情进行改编并开发衍生作品，需保留署名与分成条款。',
    unit: 'per-project', unitLabel: '元 / 项目' },
  'full':        { label: '全版权转让', short: '全版权', pill: 'g',
    desc: '转让著作财产权的全部或指定权利种类。转让后原权利人不再享有对应收益。',
    unit: 'once', unitLabel: '元 / 一次性' },
  'editorial':   { label: '编辑与报道用途', short: '编辑用途', pill: 'm',
    desc: '仅限新闻、评论、教学等非商业编辑场景使用，不得用于广告与商品化。',
    unit: 'per-piece', unitLabel: '元 / 条' }
};

CG.TYPE_LABEL = {
  video: '视频', audio: '音频', image: '图片', doc: '剧本文档', model: '3D 模型'
};

/* 抽象封面：按 id 生成不同色相的 SVG，让作品墙看起来像真的缩略图 */
CG.makeCover = function (seed, type) {
  let h = 5381;
  for (let i = 0; i < String(seed).length; i++) h = ((h << 5) + h + String(seed).charCodeAt(i)) | 0;
  h = Math.abs(h);

  /* 色域收敛：82% 走青蓝（186–252），18% 走琥珀（28–46）。
     不再用整圈 360° 随机色相，避免素材墙出现绿、粉、紫混战。 */
  const warm = (h % 100) < 18;
  const hue = warm ? 28 + (h % 19) : 186 + (h % 67);
  const hue2 = warm ? (hue + 11) % 360 : 186 + ((h >> 3) % 67);
  const hue3 = warm ? (hue + 6) % 360 : 232 + ((h >> 5) % 22);
  /* 跟随主题：深色主题走暗调，浅色主题走淡调 */
  const isLight = (typeof document !== 'undefined')
    && document.documentElement.getAttribute('data-theme') === 'light';
  const light = isLight ? 86 + (h >> 9) % 6 : 11 + (h >> 9) % 6;
  const sat = isLight ? 30 : 34;
  const sat2 = isLight ? 26 : 40;
  const shapeSat = isLight ? 42 : 62;
  const shapeLt = isLight ? 52 : 58;
  const shapeA = isLight ? .30 : .38;
  const inkDark = isLight ? 'rgba(255,255,255,.72)' : 'rgba(9,12,18,.86)';

  const rot = (h >> 7) % 44 - 22;
  const sc = 0.82 + ((h >> 3) % 34) / 100;
  const ox = (h >> 5) % 70 - 35;
  const oy = (h >> 11) % 56 - 28;

  const shapes = {
    video: `<rect x="40" y="70" width="240" height="135" rx="8" fill="hsla(${hue3},${shapeSat - 6}%,${shapeLt}%,.16)"/>
            <circle cx="160" cy="137" r="${22 + (h % 9)}" fill="hsla(${hue2},${shapeSat}%,${shapeLt}%,${shapeA})"/>
            <path d="M153 127l17 10-17 10z" fill="${inkDark}"/>`,
    audio: `<g stroke="hsla(${hue2},${shapeSat}%,${shapeLt}%,${isLight ? .42 : .48})" stroke-width="${4 + (h % 3)}" stroke-linecap="round">
            ${[40, 70, 100, 130, 160, 190, 220, 250].map((x, i) =>
    `<path d="M${x} 150v-${10 + ((h >> i) % 70)}"/>`).join('')}</g>`,
    image: `<rect x="46" y="76" width="228" height="122" rx="7" fill="hsla(${hue3},${shapeSat - 6}%,${shapeLt}%,.18)"/>
            <circle cx="${92 + (h % 40)}" cy="${104 + (h >> 4) % 22}" r="${13 + (h % 10)}"
              fill="hsla(${hue2},${shapeSat}%,${shapeLt}%,${shapeA + .06})"/>
            <path d="M46 198l70-${48 + (h % 24)} 44 34 36-28 78 52z" fill="hsla(${hue2},${shapeSat - 8}%,${shapeLt - 6}%,${shapeA - .04})"/>`,
    doc:   `<rect x="86" y="60" width="148" height="156" rx="7" fill="hsla(${hue3},${shapeSat - 8}%,${shapeLt}%,.18)"/>
            <g stroke="hsla(${hue2},${shapeSat - 6}%,${shapeLt - 2}%,${isLight ? .38 : .40})" stroke-width="4" stroke-linecap="round">
            <path d="M108 94h${70 + (h % 36)}M108 118h104M108 142h${60 + (h % 30)}M108 166h96"/></g>`,
    model: `<path d="M160 58l86 48v100l-86 48-86-48V106z" fill="hsla(${hue3},${shapeSat - 10}%,${shapeLt}%,.14)"
            stroke="hsla(${hue2},${shapeSat}%,${shapeLt - 4}%,${isLight ? .40 : .46})" stroke-width="3"/>
            <path d="M160 58v100M74 106l86 52 86-52" stroke="hsla(${hue2},${shapeSat}%,${shapeLt - 6}%,.28)"
            stroke-width="3" fill="none"/>`
  };

  const dots = [];
  for (let i = 0; i < 2 + (h % 3); i++) {
    const dx = ((h >> (i * 3 + 2)) % 300) + 10;
    const dy = ((h >> (i * 5 + 4)) % 250) + 12;
    const dr = 2 + ((h >> (i * 2)) % 7);
    dots.push(`<circle cx="${dx}" cy="${dy}" r="${dr}" fill="hsla(${warm ? 34 : (186 + i * 22)},${shapeSat}%,${shapeLt}%,${isLight ? .16 : .14})"/>`);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 274">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},${sat}%,${light}%)"/>
      <stop offset="1" stop-color="hsl(${hue3},${sat2}%,${isLight ? light - 5 : Math.max(7, light - 4)}%)"/>
    </linearGradient></defs>
    <rect width="320" height="274" fill="url(#g)"/>
    ${dots.join('')}
    <g transform="rotate(${rot} 160 137) translate(${ox} ${oy}) translate(160 137) scale(${sc.toFixed(2)}) translate(-160 -137)">
      ${shapes[type] || shapes.image}
    </g>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};

const d = (s) => s;
const now = new Date('2026-10-28T09:00:00+08:00');

CG.SEED = {
  version: 2,
  profile: {
    name: '林静',
    org: '大湾区晨曦动画工作室',
    orgId: 'CG-ENT-0231',
    role: 'creator',
    verified: true,
    verifyLevel: '企业认证',
    verifyUntil: '2027-08',
    email: 'lin@example.com',
    phoneHK: '+852 9xxx xxxx',
    bankHK: '已绑定 · 香港某银行对公账户',
    bankCN: '未绑定',
    langs: ['zh-HK', 'zh-CN', 'en']
  },

  works: [
    {
      id: 'w-shanhai', title: '山海绘卷 · 第 3 集', type: 'video',
      series: '山海绘卷', desc: '系列动画第三集，含 6 个原创角色设定与全部场景美术。',
      tags: ['动画', '国风', '系列剧'], createdAt: '2026-04-02', status: 'listed',
      file: { name: '山海绘卷_第3集_master_v7.mp4', size: 4093000000, url: null,
              storedAt: '真实上传后写入 data/uploads/' },
      rights: { ownership: 'company', portrait: false, voice: false, docs: 3 },
      evidence: {
        chain: { on: true, net: '机构联盟链（演示）', tx: '0x8f3c…d21a', block: '1,204,887', at: '2026-04-02 10:41' },
        registry: { on: false, org: '—', no: '—', dci: '—' },
        tsa: { on: true, issuer: '第三方 TSA（演示）', stamp: 'TSA-2026-0402-88f1', at: '2026-04-02 10:39' }
      },
      fingerprints: [
        { mod: '画面指纹', hash: 'a3f8c1d2…7e4b', at: '04-02 10:38', state: 'ok' },
        { mod: '音频指纹', hash: '91bc04aa…2f81', at: '04-02 10:38', state: 'ok' },
        { mod: '文本指纹（字幕）', hash: '7d20e5f1…c93a', at: '04-02 10:39', state: 'ok' }
      ],
      licenses: [
        { id: 'l1', kind: 'ai-training', price: 1200, on: true, region: '中国内地 / 香港', term: 12, resell: false },
        { id: 'l2', kind: 'clip', price: 180, on: true, region: '全球', term: 24, resell: false },
        { id: 'l3', kind: 'adaptation', price: 48000, on: true, region: '中国内地', term: 36, resell: true },
        { id: 'l4', kind: 'full', price: 260000, on: false, region: '全球', term: 999, resell: false }
      ],
      stats: { views: 3841, inquiries: 26, licenses: 18, revenue: 86400, disputes: 11, resolves: 7 },
      marketing: {
        on: true, headline: '2026 年度国产系列动画，6 位原创角色可商用',
        channels: ['market', 'homepage', 'hktdc'],
        exposure: [420, 610, 580, 720, 880, 1010, 940, 1120, 1290, 1180, 1360, 1520]
      }
    },
    {
      id: 'w-neon', title: '霓虹湾 · 全片', type: 'video',
      series: '霓虹湾', desc: '赛博都市题材长片，适合概念参考与场景训练。',
      tags: ['科幻', '赛博朋克', '长片'], createdAt: '2026-02-18', status: 'listed',
      file: { name: '霓虹湾_master_4k.mp4', size: 12800000000, url: null, storedAt: '—' },
      rights: { ownership: 'company', portrait: false, voice: false, docs: 2 },
      evidence: {
        chain: { on: true, net: '机构联盟链（演示）', tx: '0x2b71…9c04', block: '1,180,332', at: '2026-02-18 20:03' },
        registry: { on: true, org: '中国版权保护中心（演示）', no: '国作登字-2026-F-000312', dci: 'DCI-C-2026-03-0131' },
        tsa: { on: true, issuer: '第三方 TSA（演示）', stamp: 'TSA-2026-0218-31aa', at: '2026-02-18 20:01' }
      },
      fingerprints: [
        { mod: '画面指纹', hash: 'c17b3ee9…0d24', at: '02-18 19:58', state: 'ok' },
        { mod: '音频指纹', hash: '5a9f22b1…7f60', at: '02-18 19:58', state: 'ok' }
      ],
      licenses: [
        { id: 'l1', kind: 'ai-training', price: 2100, on: true, region: '全球', term: 12, resell: false },
        { id: 'l2', kind: 'clip', price: 260, on: true, region: '全球', term: 24, resell: true }
      ],
      stats: { views: 5120, inquiries: 34, licenses: 13, revenue: 71200, disputes: 5, resolves: 4 },
      marketing: {
        on: true, headline: '赛博都会视觉参考，4K 原片可分镜授权',
        channels: ['market', 'homepage'],
        exposure: [380, 420, 500, 470, 560, 690, 740, 700, 820, 910, 880, 960]
      }
    },
    {
      id: 'w-chaoxi', title: '潮汐纪 · 概念设定集', type: 'image',
      series: '潮汐纪', desc: '《潮汐纪》全片概念设计手稿与场景美术共 128 张。',
      tags: ['概念设计', '设定集', '海洋'], createdAt: '2026-06-11', status: 'listed',
      file: { name: '潮汐纪_concept_128.zip', size: 840000000, url: null, storedAt: '—' },
      rights: { ownership: 'company', portrait: false, voice: false, docs: 1 },
      evidence: {
        chain: { on: true, net: '机构联盟链（演示）', tx: '0x7d02…41be', block: '1,261,004', at: '2026-06-11 09:22' },
        registry: { on: false, org: '—', no: '—', dci: '—' },
        tsa: { on: true, issuer: '第三方 TSA（演示）', stamp: 'TSA-2026-0611-7c02', at: '2026-06-11 09:20' }
      },
      fingerprints: [{ mod: '图像指纹', hash: 'e8451aa0…bb31', at: '06-11 09:19', state: 'ok' }],
      licenses: [
        { id: 'l1', kind: 'ai-training', price: 960, on: true, region: '中国内地', term: 12, resell: false },
        { id: 'l2', kind: 'clip', price: 96, on: true, region: '全球', term: 24, resell: false }
      ],
      stats: { views: 2260, inquiries: 19, licenses: 10, revenue: 23800, disputes: 3, resolves: 2 },
      marketing: {
        on: true, headline: '128 张设定稿，适合美术风格训练与项目提案',
        channels: ['market'],
        exposure: [120, 160, 210, 190, 260, 300, 280, 340, 390, 420, 400, 460]
      }
    },
    {
      id: 'w-xiaocheng', title: '小城年夜 · 片段包', type: 'video',
      series: '小城年夜', desc: '写实家庭题材短片，含 12 段可独立授权的生活场景片段。',
      tags: ['写实', '家庭', '短片'], createdAt: '2026-08-05', status: 'listed',
      file: { name: '小城年夜_clips_12.zip', size: 2100000000, url: null, storedAt: '—' },
      rights: { ownership: 'company', portrait: true, voice: true, docs: 4 },
      evidence: {
        chain: { on: true, net: '机构联盟链（演示）', tx: '0xa41c…88d2', block: '1,330,771', at: '2026-08-05 14:10' },
        registry: { on: false, org: '—', no: '—', dci: '—' },
        tsa: { on: false, issuer: '—', stamp: '—', at: '—' }
      },
      fingerprints: [
        { mod: '画面指纹', hash: 'f0927cc1…4a8e', at: '08-05 14:06', state: 'ok' },
        { mod: '音频指纹', hash: 'b31e7740…19cc', at: '08-05 14:06', state: 'ok' }
      ],
      licenses: [
        { id: 'l1', kind: 'clip', price: 140, on: true, region: '全球', term: 24, resell: false },
        { id: 'l2', kind: 'adaptation', price: 26000, on: false, region: '中国内地', term: 36, resell: false }
      ],
      stats: { views: 1680, inquiries: 12, licenses: 7, revenue: 18400, disputes: 2, resolves: 2 },
      marketing: { on: false, headline: '', channels: [], exposure: [60, 80, 90, 110, 100, 130, 150, 140, 160, 180, 170, 190] }
    },
    {
      id: 'w-zhiyuan', title: '纸鸢 · 角色模型', type: 'model',
      series: '纸鸢', desc: '主角「纸鸢」带绑定与表情的 3D 模型，可直接用于游戏与动画。',
      tags: ['3D', '角色', '可绑定'], createdAt: '2026-09-14', status: 'listed',
      file: { name: 'zhiyuan_rigged_v3.glb', size: 640000000, url: null, storedAt: '—' },
      rights: { ownership: 'company', portrait: false, voice: false, docs: 2 },
      evidence: {
        chain: { on: true, net: '机构联盟链（演示）', tx: '0xc8f1…ae37', block: '1,371,442', at: '2026-09-14 11:35' },
        registry: { on: false, org: '—', no: '—', dci: '—' },
        tsa: { on: true, issuer: '第三方 TSA（演示）', stamp: 'TSA-2026-0914-2d1e', at: '2026-09-14 11:33' }
      },
      fingerprints: [{ mod: '模型指纹', hash: '0b7a45dd…ee12', at: '09-14 11:31', state: 'ok' }],
      licenses: [
        { id: 'l1', kind: 'ai-training', price: 780, on: true, region: '全球', term: 12, resell: false },
        { id: 'l2', kind: 'clip', price: 120, on: true, region: '全球', term: 24, resell: true }
      ],
      stats: { views: 1420, inquiries: 9, licenses: 4, revenue: 9800, disputes: 1, resolves: 1 },
      marketing: { on: true, headline: '可绑定的原创角色，游戏与动画双场景可用',
        channels: ['market'], exposure: [40, 60, 70, 90, 110, 130, 120, 150, 170, 160, 180, 210] }
    },
    {
      id: 'w-nanyin', title: '南音手记 · 纪录片', type: 'video',
      series: '南音手记', desc: '南音传承人口述史纪录长片，含全部访谈原始素材。',
      tags: ['纪录片', '非遗', '岭南'], createdAt: '2026-05-22', status: 'registered',
      file: { name: '南音手记_100min.mp4', size: 6800000000, url: null, storedAt: '—' },
      rights: { ownership: 'company', portrait: true, voice: true, docs: 6 },
      evidence: {
        chain: { on: true, net: '机构联盟链（演示）', tx: '0x1f6a…07cd', block: '1,232,558', at: '2026-05-22 16:44' },
        registry: { on: false, org: '—', no: '—', dci: '—' },
        tsa: { on: true, issuer: '第三方 TSA（演示）', stamp: 'TSA-2026-0522-90ba', at: '2026-05-22 16:42' }
      },
      fingerprints: [
        { mod: '画面指纹', hash: '6cc9e1b3…5f70', at: '05-22 16:40', state: 'ok' },
        { mod: '音频指纹', hash: '2a80bf17…d4e9', at: '05-22 16:40', state: 'ok' }
      ],
      licenses: [],
      stats: { views: 0, inquiries: 0, licenses: 0, revenue: 0, disputes: 0, resolves: 0 },
      marketing: { on: false, headline: '', channels: [], exposure: [0,0,0,0,0,0,0,0,0,0,0,0] }
    },
    {
      id: 'w-wugang', title: '雾港十四行 · 配乐', type: 'audio',
      series: '雾港十四行', desc: '原创配乐 14 首，含分轨与纯乐器版本。',
      tags: ['原创音乐', '配乐', '氛围'], createdAt: '2026-07-30', status: 'listed',
      file: { name: 'wugang_score_14.zip', size: 1200000000, url: null, storedAt: '—' },
      rights: { ownership: 'company', portrait: false, voice: false, docs: 1 },
      evidence: {
        chain: { on: true, net: '机构联盟链（演示）', tx: '0x9be2…31f8', block: '1,315,109', at: '2026-07-30 08:50' },
        registry: { on: false, org: '—', no: '—', dci: '—' },
        tsa: { on: true, issuer: '第三方 TSA（演示）', stamp: 'TSA-2026-0730-5b17', at: '2026-07-30 08:48' }
      },
      fingerprints: [{ mod: '音频指纹', hash: 'dd40a2e7…6b90', at: '07-30 08:47', state: 'ok' }],
      licenses: [
        { id: 'l1', kind: 'ai-training', price: 520, on: true, region: '全球', term: 12, resell: false },
        { id: 'l2', kind: 'clip', price: 88, on: true, region: '全球', term: 24, resell: false }
      ],
      stats: { views: 960, inquiries: 11, licenses: 6, revenue: 12600, disputes: 1, resolves: 0 },
      marketing: { on: true, headline: '氛围向原创配乐，支持分轨与改编',
        channels: ['market'], exposure: [90, 110, 100, 130, 150, 140, 170, 190, 180, 210, 230, 220] }
    },
    {
      id: 'w-changxia', title: '长夏未晚 · 剧本', type: 'doc',
      series: '长夏未晚', desc: '院线长片剧本初稿与三版修订稿，含人物小传。',
      tags: ['剧本', '长片', '青春'], createdAt: '2026-10-20', status: 'draft',
      file: { name: '长夏未晚_script_v4.docx', size: 2400000, url: null, storedAt: '—' },
      rights: { ownership: 'company', portrait: false, voice: false, docs: 0 },
      evidence: {
        chain: { on: false, net: '—', tx: '—', block: '—', at: '—' },
        registry: { on: false, org: '—', no: '—', dci: '—' },
        tsa: { on: false, issuer: '—', stamp: '—', at: '—' }
      },
      fingerprints: [],
      licenses: [],
      stats: { views: 0, inquiries: 0, licenses: 0, revenue: 0, disputes: 0, resolves: 0 },
      marketing: { on: false, headline: '', channels: [], exposure: [0,0,0,0,0,0,0,0,0,0,0,0] }
    }
  ],

  leads: [
    { id: 'L-0912', workId: 'w-shanhai', licensee: '某 AI 公司（企业认证）', kind: 'ai-training',
      price: 1200, status: 'signed', at: '2026-10-24 09:12', note: '年度授权，已回签' },
    { id: 'L-0918', workId: 'w-neon', licensee: '某短视频平台', kind: 'clip',
      price: 260, status: 'pending', at: '2026-10-25 11:20', note: '等待你确认条款' },
    { id: 'L-0921', workId: 'w-chaoxi', licensee: '某游戏工作室', kind: 'ai-training',
      price: 960, status: 'pending', at: '2026-10-26 15:03', note: '要求延长至 24 个月' },
    { id: 'L-0924', workId: 'w-shanhai', licensee: '某动画制作公司', kind: 'adaptation',
      price: 48000, status: 'negotiating', at: '2026-10-27 10:41', note: '对方要求独家，待议价' },
    { id: 'L-0927', workId: 'w-wugang', licensee: '某品牌广告代理', kind: 'clip',
      price: 88, status: 'rejected', at: '2026-10-27 17:22', note: '用途超出授权范围，已驳回' }
  ],

  revenue: [
    { id: 'R-1204', workId: 'w-shanhai', contract: 'CT-2026-0912', kind: 'ai-training', amount: 320, way: 'auto', at: '2026-10-28 08:04', status: 'settled' },
    { id: 'R-1203', workId: 'w-neon',    contract: 'CT-2026-0877', kind: 'clip',        amount: 180, way: 'auto', at: '2026-10-27 19:58', status: 'settled' },
    { id: 'R-1202', workId: 'w-chaoxi',  contract: 'CT-2026-0840', kind: 'clip',        amount: 96,  way: 'auto', at: '2026-10-27 16:41', status: 'settled' },
    { id: 'R-1201', workId: 'w-shanhai', contract: 'CT-2026-0912', kind: 'ai-training', amount: 320, way: 'auto', at: '2026-10-27 11:52', status: 'settled' },
    { id: 'R-1200', workId: 'w-xiaocheng', contract: 'CT-2026-0801', kind: 'adaptation', amount: 2400, way: 'manual', at: '2026-10-26 11:20', status: 'pending' },
    { id: 'R-1199', workId: 'w-zhiyuan', contract: 'CT-2026-0779', kind: 'clip',        amount: 120, way: 'auto', at: '2026-10-26 10:47', status: 'settled' },
    { id: 'R-1198', workId: 'w-neon',    contract: 'CT-2026-0877', kind: 'ai-training', amount: 560, way: 'auto', at: '2026-10-26 09:02', status: 'settled' },
    { id: 'R-1197', workId: 'w-shanhai', contract: 'CT-2026-0912', kind: 'clip',        amount: 180, way: 'auto', at: '2026-10-25 21:36', status: 'settled' },
    { id: 'R-1196', workId: 'w-wugang',  contract: 'CT-2026-0744', kind: 'ai-training', amount: 520, way: 'auto', at: '2026-10-25 15:14', status: 'settled' },
    { id: 'R-1195', workId: 'w-chaoxi',  contract: 'CT-2026-0840', kind: 'ai-training', amount: 960, way: 'manual', at: '2026-10-24 18:30', status: 'settled' },
    { id: 'R-1194', workId: 'w-neon',    contract: 'CT-2026-0877', kind: 'clip',        amount: 260, way: 'auto', at: '2026-10-24 15:11', status: 'settled' },
    { id: 'R-1193', workId: 'w-shanhai', contract: 'CT-2026-0912', kind: 'ai-training', amount: 320, way: 'auto', at: '2026-10-24 10:05', status: 'settled' },
    { id: 'R-1192', workId: 'w-zhiyuan', contract: 'CT-2026-0779', kind: 'ai-training', amount: 780, way: 'manual', at: '2026-10-23 16:48', status: 'settled' },
    { id: 'R-1191', workId: 'w-chaoxi',  contract: 'CT-2026-0840', kind: 'clip',        amount: 96,  way: 'auto', at: '2026-10-23 12:22', status: 'settled' },
    { id: 'R-1190', workId: 'w-wugang',  contract: 'CT-2026-0744', kind: 'clip',        amount: 88,  way: 'auto', at: '2026-10-22 20:09', status: 'settled' },
    { id: 'R-1189', workId: 'w-shanhai', contract: 'CT-2026-0912', kind: 'clip',        amount: 180, way: 'auto', at: '2026-10-22 13:40', status: 'settled' },
    { id: 'R-1188', workId: 'w-neon',    contract: 'CT-2026-0877', kind: 'ai-training', amount: 560, way: 'auto', at: '2026-10-21 19:03', status: 'settled' },
    { id: 'R-1187', workId: 'w-xiaocheng', contract: 'CT-2026-0801', kind: 'clip',      amount: 140, way: 'auto', at: '2026-10-21 11:17', status: 'settled' }
  ],

  disputes: [
    { id: 'D-2201', workId: 'w-shanhai', platform: '某短视频平台', match: 94.2, at: '2026-10-26 09:12', status: 'open', note: '第 3 集片段被搬运，播放量约 42 万' },
    { id: 'D-2202', workId: 'w-neon',    platform: '某 AI 数据集站点', match: 88.5, at: '2026-10-25 14:30', status: 'letter', note: '疑似纳入训练集，已发律师函' },
    { id: 'D-2203', workId: 'w-shanhai', platform: '某短视频平台', match: 91.0, at: '2026-10-24 10:02', status: 'takedown', note: '平台已下架' },
    { id: 'D-2204', workId: 'w-chaoxi',  platform: '某素材站', match: 76.4, at: '2026-10-22 15:55', status: 'open', note: '设定稿被打包转售' },
    { id: 'D-2205', workId: 'w-neon',    platform: '某二创社区', match: 82.1, at: '2026-10-20 08:41', status: 'settled', note: '已和解，对方删除并致歉' },
    { id: 'D-2206', workId: 'w-wugang',  platform: '某音乐平台', match: 90.7, at: '2026-10-19 17:20', status: 'open', note: '配乐被重新上传冒名发行' }
  ],

  notices: [
    { id: 'N1', type: 'dispute', at: '2026-10-26 09:12', title: '新侵权线索：山海绘卷 第3集', body: '在某短视频平台发现搬运，相似度 94.2%。建议 7 天内处置。' },
    { id: 'N2', type: 'lead', at: '2026-10-25 11:20', title: '新询价：霓虹湾 · 全片', body: '某短视频平台询价「片段引用授权」，等待你确认条款。' },
    { id: 'N3', type: 'money', at: '2026-10-25 09:00', title: '本月收入已达 ¥48,600', body: '较上月 +24.6%，已扣除平台佣金。' },
    { id: 'N4', type: 'system', at: '2026-10-24 16:00', title: '「AI 训练数据授权」标准合约 v1.2 发布', body: '新增训练用途披露条款，建议核对已签署合约。' },
    { id: 'N5', type: 'system', at: '2026-10-22 10:00', title: '版权登记对接流程更新', body: '新增 DCI 编码回填字段（可选），可在存证信息页补充。' }
  ]
};
