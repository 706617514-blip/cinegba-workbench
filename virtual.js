/* ==========================================================================
   CineGBA · 虚拟素材库
   每种类型条数按原设计再减 80%（950–1400 → 190–280）。
   每条都有：
     · cover —— 一张真实摄影封面（来自 assets/covers，按类型分组，同类型内
                依次轮转，保证同一屏（24 件）里不会撞图）
     · desc  —— 按「那张封面拍的是什么」写的文案，不是套话
   不写入 state（避免存档膨胀），每次启动用固定种子重建，
   保证同一 id 永远指向同一件作品、同一张封面、同一段文案。
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

  /* 一天里的时段，用来把同题材的不同条目区分开，也让文案有具体光位 */
  const TOD = [
    { key: '黎明', light: '低角度侧逆光，色温 4200K 上下',
      keyEn: 'dawn', lightEn: 'low raking backlight at around 4200K' },
    { key: '正午', light: '顶光硬阴影，反差大',
      keyEn: 'midday', lightEn: 'hard top light with high contrast' },
    { key: '黄昏', light: '暖橙余晖，长阴影',
      keyEn: 'dusk', lightEn: 'warm amber afterglow and long shadows' },
    { key: '夜', light: '低照度，靠环境光源与补光',
      keyEn: 'night', lightEn: 'low light, carried by practicals and fill' }
  ];

  /* 文案里的「时段 / 光位」尽量跟画面题材对得上：
     夜景、霓虹、星野一类的就别再写「正午顶光」了。
     对不上的题材退回轮转，保证同一题材的不同条目还能互相区分。 */
  const TOD_HINT = [
    { re: /夜|灯|霓虹|星|月|暮|窗|炉|台|幕/, i: 3 },   // 夜
    { re: /雾|晨|林|雪|霜|冰|瀑|湖|海|江|河/, i: 0 },   // 黎明
    { re: /黄昏|落日|秋|曛|沙|荒|漠|废/, i: 2 },       // 黄昏
    { re: /正午|石|墙|钢|桥|梁|清水|混凝土/, i: 1 }     // 正午
  ];

  function todFor(subject, fallbackIdx) {
    for (let k = 0; k < TOD_HINT.length; k++) {
      if (TOD_HINT[k].re.test(subject)) return TOD[TOD_HINT[k].i];
    }
    return TOD[fallbackIdx % TOD.length];
  }

  const TYPE_META = {
    video: {
      label: '视频',
      suffix: ['· 全片', '· 预告片', '· 片段包', '· 空镜素材', '· 成片 4K'],
      suffixEn: ['· Feature', '· Trailer', '· Clip pack', '· Plates', '· 4K master'],
      tags: ['实拍', '动画', '城市', '自然', '人物', '纪实', '短片', '广告'],
      price: [120, 9800],
      spec: ['3840×2160 · 25fps · H.265', '4096×2160 · 24fps · ProRes 422', '1920×1080 · 50fps · H.264'],
      lens: ['35mm 定焦', '50mm 定焦', '24-70mm 变焦', '85mm 定焦'],
      desc(subject, tod, spec, lens) {
        return `${subject}。${tod.key}时段拍摄，${tod.light}。` +
          `素材规格 ${spec}，${lens}拍摄，已做一版基础调色，另带一条 Log 母版可直接套 LUT。` +
          `适合作为片头、转场或情绪留白，也可作为 AI 训练数据的风格参考样本。`;
      },
      descEn(subjectEn, tod, spec, lens) {
        return `${subjectEn}. Shot at ${tod.keyEn} — ${tod.lightEn}. ` +
          `Delivered at ${spec}, lensed on ${lens}, with one graded version plus a Log master you can LUT straight away. ` +
          `Works as an opening, a transition or an emotional pause, and as a style reference for AI training data.`;
      }
    },
    image: {
      label: '图片',
      suffix: ['· 设定集', '· 概念稿', '· 场景渲染', '· 角色三视图', '· 美术参考'],
      suffixEn: ['· Art bible', '· Concept', '· Scene render', '· Turnaround', '· Reference'],
      tags: ['概念设计', '插画', '写实', '国风', '科幻', '场景', '角色', '纹理'],
      price: [30, 3800],
      spec: ['6000×4000 · 16bit TIFF', '8000×6000 · PSD 分层', '5600×3700 · JPEG 100'],
      lens: ['中画幅数码后背', '135 全画幅', '大画幅扫描'],
      desc(subject, tod, spec, lens) {
        return `${subject}。${tod.key}光位定调，${tod.light}，保留了原始动态范围。` +
          `交付 ${spec}，${lens}取景，可用于设定集内页、海报或投影背景。` +
          `同系列另附一版去色稿，便于二次上色。`;
      },
      descEn(subjectEn, tod, spec, lens) {
        return `${subjectEn}. Lit for ${tod.keyEn} — ${tod.lightEn} — with the full dynamic range retained. ` +
          `Delivered at ${spec}, framed on ${lens}; suited to art-book interiors, posters or projection backdrops. ` +
          `A desaturated pass ships with the set for recolouring.`;
      }
    },
    audio: {
      label: '音频',
      suffix: ['· 配乐', '· 音效库', '· 环境声', '· 主题曲', '· 分轨包'],
      suffixEn: ['· Score', '· SFX library', '· Ambience', '· Theme', '· Stems'],
      tags: ['配乐', '音效', '氛围', '国乐', '电子', '管弦', '环境声', '打击乐'],
      price: [20, 2600],
      spec: ['48kHz / 24bit · WAV', '96kHz / 24bit · WAV 分轨', '44.1kHz / 16bit · MP3 320'],
      lens: ['同期声 + 后期拟音', '现场采样 + 合成器', '同期多轨录音'],
      desc(subject, tod, spec, lens) {
        return `以「${subject}」为灵感写的一段${tod.key}氛围。录法为${lens}，` +
          `交付 ${spec}，另附一条无压缩母带与一份 30 秒短版。` +
          `留了较长的尾部混响，剪辑时可以在任意位置切断而不突兀。`;
      },
      descEn(subjectEn, tod, spec, lens) {
        return `An ambient piece inspired by ${subjectEn}, written for ${tod.keyEn}. Recorded ${lens}, ` +
          `delivered at ${spec}, with an uncompressed master and a 30-second cut-down. ` +
          `The tail reverb runs long, so it can be cut anywhere without clicking.`;
      }
    },
    doc: {
      label: '剧本文档',
      suffix: ['· 剧本', '· 分镜', '· 人物小传', '· 场记表', '· 世界观设定'],
      suffixEn: ['· Script', '· Storyboard', '· Character bio', '· Continuity', '· World bible'],
      tags: ['剧本', '分镜', '长片', '剧集', '短片', '纪录片', '动画', '文学'],
      price: [80, 12000],
      spec: ['48 页 · 标准剧本格式 PDF', '96 场 · 分镜表 XLSX + 缩略图', '120 页 · 设定集 PDF + 源文件'],
      lens: ['单场景 · 室内', '三幕结构 · 外景为主', '群像 · 多线并进'],
      desc(subject, tod, spec, lens) {
        return `围绕「${subject}」展开的一份${tod.key}戏，${lens}。` +
          `交付 ${spec}，含人物关系图、时间线与一版删减前的对照稿。` +
          `对白按可拍摄性做过一轮收敛，标注了镜号与预估时长，可直接进筹备。`;
      },
      descEn(subjectEn, tod, spec, lens) {
        return `A ${tod.keyEn} scene built around ${subjectEn} — ${lens}. Delivered at ${spec}, ` +
          `including a character map, a timeline and a pre-trim comparison draft. ` +
          `Dialogue has been tightened for producibility, with shot numbers and estimated runtimes marked.`;
      }
    },
    model: {
      label: '3D 模型',
      suffix: ['· 角色模型', '· 场景模型', '· 道具模型', '· 材质库', '· 绑定文件'],
      suffixEn: ['· Character', '· Environment', '· Prop', '· Material set', '· Rigged'],
      tags: ['可绑定', '低模', '高模', 'PBR', '角色', '场景', '道具', '毛发'],
      price: [60, 8600],
      spec: ['PBR 4K 贴图 · GLB', '2 套 UV · FBX + 贴图', '带骨骼绑定 · Blender 3.x'],
      lens: ['拓扑已优化', '面数 12 万（高模）', '面数 8 千（低模）'],
      desc(subject, tod, spec, lens) {
        return `「${subject}」的三维资产，按${tod.key}场景校验过光影表现。` +
          `交付 ${spec}，${lens}，法线与 AO 单独烘焙。` +
          `材质走金属/粗糙度工作流，导入 Unreal / Unity 后不需要再改配色即可用。`;
      },
      descEn(subjectEn, tod, spec, lens) {
        return `A 3D asset of ${subjectEn}, validated against ${tod.keyEn} lighting. Delivered at ${spec}, ${lens}, ` +
          `with normals and AO baked separately. Metal/roughness workflow — it drops into Unreal or Unity without recolouring.`;
      }
    }
  };

  const OWNERS = [
    '大湾区晨曦动画工作室', '南岭影业（演示）', '潮汐视觉数字科技', '长夏文化传媒',
    '纸鸢三维工作室', '雾港声音设计', '北岸概念艺术', '孤山剧作社',
    '星野影像（香港）', '归舟动画制作', '澜汀视觉资产库', '川溪摄影棚',
    '风霜特效工作室', '雪线纪录片团队', '月岔美术中心', '寒流音乐制作'
  ];

  /* 机构名英文（与上面按下标对齐） */
  const OWNERS_EN = [
    'GBA Dawn Animation Studio', 'Nanling Pictures (demo)', 'Tidal Visual Digital', 'Long Summer Media',
    'Paper Kite 3D Studio', 'Fog Harbour Sound', 'North Shore Concept Art', 'Lone Mountain Script Co.',
    'Hoshino Imaging (HK)', 'Returning Boat Animation', 'Lanting Visual Assets', 'Chuanxi Studio',
    'Frost Works VFX', 'Snowline Documentary', 'Moonfork Art Centre', 'Cold Current Music'
  ];

  /* 中文题材没有对应英文时，从封面文件名推一个：
     assets/covers/video/misty-mountain-2.jpg → Misty Mountain */
  function enFromSlug(f) {
    if (!f) return '';
    const base = String(f).split('/').pop().replace(/\.[a-z0-9]+$/i, '').replace(/-\d+$/, '');
    return base.split('-').filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  /* 标签也有英文 */
  const TAG_EN = {
    '实拍': 'Live action', '动画': 'Animation', '城市': 'City', '自然': 'Nature', '人物': 'People',
    '纪实': 'Documentary', '短片': 'Short', '广告': 'Advertising',
    '概念设计': 'Concept design', '插画': 'Illustration', '写实': 'Photoreal', '国风': 'Guofeng',
    '科幻': 'Sci-fi', '场景': 'Environment', '角色': 'Character', '纹理': 'Texture',
    '配乐': 'Score', '音效': 'SFX', '氛围': 'Ambient', '国乐': 'Chinese', '电子': 'Electronic',
    '管弦': 'Orchestral', '环境声': 'Ambience', '打击乐': 'Percussion',
    '剧本': 'Script', '分镜': 'Storyboard', '长片': 'Feature', '剧集': 'Series',
    '纪录片': 'Documentary', '文学': 'Literary',
    '可绑定': 'Rigged', '低模': 'Low-poly', '高模': 'High-poly', '道具': 'Prop', '毛发': 'Groom'
  };

  const LIC_SET = [
    ['ai-training', 'clip'],
    ['clip', 'editorial'],
    ['ai-training', 'clip', 'adaptation'],
    ['clip'],
    ['ai-training', 'full'],
    ['clip', 'adaptation'],
    ['editorial']
  ];

  const TYPES = Object.keys(TYPE_META);

  /* 每种类型多少件：**等于这个类型的封面池大小**（一件作品一张图，池子多大就多少件）。
     上一版是每类 190–280 件、池子只有 30 张，等于同一张图要轮 8 遍 ——
     按类型筛选时一屏里就能看到好几张一样的。
     现在改成 1:1，任何一屏都不会撞图。具体数字在 build() 里按实际池子算。 */
  const TYPE_COUNT = {};

  let cache = null;
  const idx = new Map();

  /** 取某个类型的封面池；没有就退回程序化封面 */
  function poolOf(type) {
    const p = (CG.COVER_POOL && CG.COVER_POOL[type]) || null;
    return (p && p.length) ? p : null;
  }

  function build() {
    const rnd = mulberry32(20261028);
    const list = [];
    const nowMs = new Date('2026-10-28T12:00:00+08:00').getTime();

    TYPES.forEach(type => {
      const meta = TYPE_META[type];
      const pool = poolOf(type);
      /* 一件作品一张图：有多少张封面就出多少件作品 */
      const total = pool ? pool.length : 40;
      TYPE_COUNT[type] = total;

      for (let i = 0; i < total; i++) {
        /* 封面轮转：池子按「第 1 张全部 → 第 2 张全部 → 第 3 张全部」排过，
           相邻作品必然来自不同主题；件数等于池子大小时，全程零重复。 */
        const pi = pool ? (i % pool.length) : 0;
        const entry = pool ? pool[pi] : null;
        const subject = entry ? entry.s : (A[i % A.length] + (B[Math.floor(i / A.length) % B.length] || ''));
        const v = (entry && entry.v) || 1;
        const round = pool ? Math.floor(i / pool.length) : 0;   // 正常恒为 0，只是兜底

        const a = A[i % A.length];
        const b = B[Math.floor(i / A.length) % B.length] || B[0];
        /* 同一主题的第 2、3 张换一个后缀，标题不会撞 */
        const suffix = meta.suffix[(v - 1) % meta.suffix.length];
        const suffixEn = (meta.suffixEn || meta.suffix)[(v - 1) % (meta.suffixEn || meta.suffix).length];
        const tod = todFor(subject, v + round);

        const title = subject + suffix + (round ? ' ' + (round + 1) : '');
        const subjectEn = (entry && entry.sen) || enFromSlug(entry && entry.f) || subject;
        const titleEn = subjectEn + ' ' + suffixEn.replace(/^·\s*/, '') + (round ? ' ' + (round + 1) : '');
        const spec = meta.spec[Math.floor(rnd() * meta.spec.length)];
        const lens = meta.lens[Math.floor(rnd() * meta.lens.length)];

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

        const _oi = Math.floor(rnd() * OWNERS.length);
        const daysAgo = Math.floor(rnd() * 300);
        const created = new Date(nowMs - daysAgo * 86400e3);
        const ds = created.toISOString().slice(0, 10);

        const tags = [subject.length <= 6 ? subject : (entry && entry.subject) || meta.tags[0]];
        const t2 = meta.tags[Math.floor(rnd() * meta.tags.length)];
        if (tags.indexOf(t2) < 0) tags.push(t2);
        const tagsEn = tags.map(t => TAG_EN[t] || (t === subject ? subjectEn : t));

        list.push({
          id: 'v-' + type + '-' + String(i + 1).padStart(4, '0'),
          virtual: true,
          title, titleEn,
          type,
          series: a + b,
          cover: entry ? entry.f : null,
          desc: meta.desc(subject, tod, spec, lens),
          descEn: meta.descEn ? meta.descEn(subjectEn, tod, spec, lens) : '',
          tags, tagsEn,
          createdAt: ds,
          status: 'listed',
          owner: OWNERS[_oi],
          ownerEn: OWNERS_EN[_oi],
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

    /* 把中英对照登记进全局内容字典：切到英文时由 CG.translateDom 逐段替换。
       标题 / 机构名 / 描述 / 标签都在这里，视图层一行都不用改。 */
    if (CG.registerContent) {
      list.forEach(w => {
        CG.registerContent(w.title, w.titleEn);
        CG.registerContent(w.owner, w.ownerEn);
        CG.registerContent(w.desc, w.descEn);
        (w.tags || []).forEach((t, i) => CG.registerContent(t, (w.tagsEn || [])[i]));
      });
    }

    return list;
  }

  CG.virtual = {
    TYPE_COUNT: TYPE_COUNT,
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
    countOf(type) { this.ensure(); return TYPE_COUNT[type] || 0 },
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
