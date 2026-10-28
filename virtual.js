/* ==========================================================================
   CineGBA · 虚拟素材库
   每种类型 1000 条，共 5000 条。不写入 state（避免存档膨胀），
   每次启动用固定种子重建，保证同一 id 永远指向同一件作品。
   ========================================================================== */
(function () {
  'use strict';
  const CG = window.CG;

  /* ---- 确定性随机 ---- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const A = ('山海雾霓纸潮南长北孤野春归星月夜风霜雪雨寒流岚澜汀洲岚屿崖谷川溪涧潭渚')
    .split('');
  const B = ('绘卷湾年纪行记歌谣手札图鉴编年拾遗札记纪略志异杂录片段剪影序章终章前夜黎明')
    .split('').reduce((acc, _, i, arr) => {
      if (i % 2 === 0 && arr[i + 1]) acc.push(arr[i] + arr[i + 1]);
      return acc;
    }, []);

  const TYPE_META = {
    video: {
      label: '视频', suffix: ['· 全片', '· 预告片', '· 片段包', '· 空镜素材', '· 成片 4K'],
      tags: ['实拍', '动画', '城市', '自然', '人物', '纪实', '短片', '广告'],
      price: [120, 9800]
    },
    image: {
      label: '图片', suffix: ['· 设定集', '· 概念稿', '· 场景渲染', '· 角色三视图', '· 美术参考'],
      tags: ['概念设计', '插画', '写实', '国风', '科幻', '场景', '角色', '纹理'],
      price: [30, 3800]
    },
    audio: {
      label: '音频', suffix: ['· 配乐', '· 音效库', '· 环境声', '· 主题曲', '· 分轨包'],
      tags: ['配乐', '音效', '氛围', '国乐', '电子', '管弦', '环境声', '打击乐'],
      price: [20, 2600]
    },
    doc: {
      label: '剧本文档', suffix: ['· 剧本', '· 分镜', '· 人物小传', '· 场记表', '· 世界观设定'],
      tags: ['剧本', '分镜', '长片', '剧集', '短片', '纪录片', '动画', '文学'],
      price: [80, 12000]
    },
    model: {
      label: '3D 模型', suffix: ['· 角色模型', '· 场景模型', '· 道具模型', '· 材质库', '· 绑定文件'],
      tags: ['可绑定', '低模', '高模', 'PBR', '角色', '场景', '道具', '毛发'],
      price: [60, 8600]
    }
  };

  const OWNERS = [
    '大湾区晨曦动画工作室', '南岭影业（演示）', '潮汐视觉数字科技', '长夏文化传媒',
    '纸鸢三维工作室', '雾港声音设计', '北岸概念艺术', '孤山剧作社',
    '星野影像（香港）', '归舟动画制作', '澜汀视觉资产库', '川溪摄影棚',
    '风霜特效工作室', '雪线纪录片团队', '月岔美术中心', '寒流音乐制作'
  ];

  const LIC_SET = [
    ['ai-training', 'clip'],
    ['clip', 'editorial'],
    ['ai-training', 'clip', 'adaptation'],
    ['clip'],
    ['ai-training', 'full'],
    ['clip', 'adaptation'],
    ['editorial']
  ];

  const PER_TYPE = 1000;
  const TYPES = Object.keys(TYPE_META);

  let cache = null;
  const idx = new Map();

  function build() {
    const rnd = mulberry32(20261028);
    const list = [];
    const nowMs = new Date('2026-10-28T12:00:00+08:00').getTime();

    TYPES.forEach(type => {
      const meta = TYPE_META[type];
      for (let i = 0; i < PER_TYPE; i++) {
        const a = A[i % A.length];
        const b = B[Math.floor(i / A.length) % B.length] || B[0];
        const title = a + b + meta.suffix[i % meta.suffix.length];

        const licKinds = LIC_SET[Math.floor(rnd() * LIC_SET.length)];
        const KF = { 'editorial': 0.05, 'clip': 0.42, 'ai-training': 1.35, 'adaptation': 8, 'full': 22 };
        const base = meta.price[0] + rnd() * (meta.price[1] - meta.price[0]);
        const lic = licKinds.map((k, j) => ({
          id: 'vl' + i + '_' + j, kind: k,
          price: Math.max(9, Math.round(base * (KF[k] || 1))),
          on: true,
          region: ['全球', '中国内地 / 香港', '香港', '中国内地'][Math.floor(rnd() * 4)],
          term: [12, 24, 36, 999][Math.floor(rnd() * 4)],
          resell: rnd() > 0.8
        }));

        const daysAgo = Math.floor(rnd() * 300);
        const created = new Date(nowMs - daysAgo * 86400e3);
        const ds = created.toISOString().slice(0, 10);

        list.push({
          id: 'v-' + type + '-' + String(i + 1).padStart(4, '0'),
          virtual: true,
          title,
          type,
          series: a + b,
          desc: '演示用虚拟素材：' + meta.label + '，可用于' +
            (licKinds.indexOf('ai-training') >= 0 ? '模型训练与风格参考' : '成片引用与项目提案') + '。',
          tags: [meta.tags[Math.floor(rnd() * meta.tags.length)],
          meta.tags[Math.floor(rnd() * meta.tags.length)]].filter((v, k, s) => s.indexOf(v) === k),
          createdAt: ds,
          status: 'listed',
          owner: OWNERS[Math.floor(rnd() * OWNERS.length)],
          file: { name: (a + b) + '.' + ({ video: 'mp4', image: 'jpg', audio: 'wav', doc: 'pdf', model: 'glb' }[type]), size: 0, url: null, storedAt: '虚拟数据' },
          rights: { ownership: 'company', portrait: false, voice: false, docs: 1 },
          evidence: {
            chain: { on: true, net: '机构联盟链（演示）', tx: '0x' + Math.floor(rnd() * 1e16).toString(16).slice(0, 8) + '…', block: String(1200000 + Math.floor(rnd() * 200000)), at: ds + ' 10:00' },
            registry: { on: rnd() > 0.7, org: '—', no: '—', dci: '—' },
            tsa: { on: true, issuer: '第三方 TSA（演示）', stamp: 'TSA-' + ds, at: ds + ' 09:58' }
          },
          fingerprints: [{ mod: '内容指纹', hash: Math.floor(rnd() * 1e16).toString(16) + '…', at: ds, state: 'ok' }],
          licenses: lic,
          stats: {
            views: Math.floor(18 + Math.pow(rnd(), 2.2) * 90000 * (0.32 + rnd() * 0.68)),
            inquiries: Math.floor(rnd() * 60),
            licenses: Math.floor(rnd() * 40),
            revenue: Math.floor(rnd() * 200000),
            disputes: Math.floor(rnd() * 6),
            resolves: 0
          },
          marketing: { on: rnd() > 0.55, headline: '', channels: ['market'], exposure: new Array(12).fill(0) }
        });
      }
    });

    return list;
  }

  CG.virtual = {
    ensure() {
      if (!cache) {
        cache = build();
        cache.forEach(w => idx.set(w.id, w));
      }
      return cache;
    },
    all() { return this.ensure() },
    get(id) { this.ensure(); return idx.get(id) || null },
    count() { return this.ensure().length },
    byType(type) { return this.ensure().filter(w => w.type === type) },
    /** 榜单：按热度 */
    top(n, type) {
      const list = type ? this.byType(type) : this.all();
      return list.slice().sort((a, b) => b.stats.views - a.stats.views).slice(0, n || 12);
    },
    /** 确定性"猜你喜欢"：给定种子挑 n 条 */
    pick(n, seed, type) {
      const rnd = mulberry32(seed || 1);
      const pool = type ? this.byType(type) : this.all();
      const out = [];
      const used = new Set();
      let guard = 0;
      while (out.length < n && guard++ < n * 40) {
        const i = Math.floor(rnd() * pool.length);
        if (used.has(i)) continue;
        used.add(i);
        out.push(pool[i]);
      }
      return out;
    }
  };
})();
