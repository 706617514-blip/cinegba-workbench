/* ==========================================================================
   CineGBA IP-Bridge · 核心层
   存储适配 / 真上传 / 路由 / 通用 UI
   ========================================================================== */
(function () {
  'use strict';
  const CG = window.CG;

  /* ------------------------------------------------------------ 工具 */
  const U = CG.util = {
    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      ));
    },
    money(n) {
      n = Number(n) || 0;
      return '¥' + n.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
    },
    money2(n) { return '¥' + (Number(n) || 0).toFixed(2); },
    bytes(n) {
      n = Number(n) || 0;
      if (n < 1024) return n + ' B';
      const u = ['KB', 'MB', 'GB', 'TB'];
      let i = -1;
      do { n /= 1024; i++ } while (n >= 1024 && i < u.length - 1);
      return (n >= 10 ? n.toFixed(0) : n.toFixed(1)) + ' ' + u[i];
    },
    date(s) { return String(s || '').slice(0, 10); },
    time(s) { return String(s || '').slice(11, 16); },
    dt(s) { return String(s || '').replace('T', ' ').slice(0, 16); },
    rel(s) {
      const t = new Date(String(s).replace(' ', 'T'));
      if (isNaN(t)) return s;
      const diff = (Date.now() - t.getTime()) / 1000;
      if (diff < 60) return '刚刚';
      if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
      if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
      if (diff < 86400 * 30) return Math.floor(diff / 86400) + ' 天前';
      return U.date(s);
    },
    now() {
      const t = new Date(), p = n => String(n).padStart(2, '0');
      return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`;
    },
    uid(pre) { return (pre || 'id') + '-' + Math.random().toString(36).slice(2, 7).toUpperCase(); },
    qs(s, r) { return (r || document).querySelector(s) },
    qsa(s, r) { return Array.from((r || document).querySelectorAll(s)) },
    debounce(fn, ms) { let t; return function () { clearTimeout(t); t = setTimeout(() => fn.apply(this, arguments), ms) } },
    cover(w) {
      if (w && w.coverUrl) return w.coverUrl;
      return CG.makeCover(w ? w.id : 'x', w ? w.type : 'image');
    },
    licOf(id) { return CG.LICENSE_KINDS[id] || { label: id, short: id, pill: 'm', unitLabel: '' } },
    typeOf(t) { return CG.TYPE_LABEL[t] || t },
    statusPill(s) {
      return ({
        draft: ['草稿', 'm'], registered: ['已存证', 'ok'], listed: ['在售', 'c'],
        offline: ['已下架', 'm'], open: ['待确认', 'd'], letter: ['已发函', 'w'],
        takedown: ['已下架', 'ok'], settled: ['已和解', 'ok'],
        pending: ['待处理', 'w'], signed: ['已签约', 'ok'], negotiating: ['议价中', 'c'],
        rejected: ['已驳回', 'm'], auto: ['自动', 'c'], manual: ['人工', 'm']
      }[s] || [s, 'm']);
    }
  };

  /* ------------------------------------------------------------ 图标 */
  /* 图标取自 Lucide（ISC 许可）https://github.com/lucide-icons/lucide */
  const I = CG.icon = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /> <path d="m16 9-5.5 5.5L8 12" /></svg>',
    no: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /> <path d="m15 9-6 6" /> <path d="m9 9 6 6" /></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /> <path d="M12 16v-4" /> <path d="M12 8h.01" /></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" /></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /> <path d="M12 5v14" /></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12" /> <path d="m17 8-5-5-5 5" /> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3" /> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /> <path d="m7 10 5 5 5-5" /></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /> <path d="M14 2v5a1 1 0 0 0 1 1h5" /> <path d="M10 9H8" /> <path d="M16 13H8" /> <path d="M16 17H8" /></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16" /> <path d="M18 17V9" /> <path d="M13 17V5" /> <path d="M8 17v-3" /></svg>',
    megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" /> <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" /> <path d="M8 6v8" /></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18" /> <path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25" /> <circle cx="18" cy="20" r="2" /> <circle cx="8" cy="20" r="2" /></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /> <path d="m9 12 2 2 4-4" /></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /> <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6" /> <path d="M14 11v6" /> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /> <path d="M3 6h18" /> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /> <path d="m15 5 4 4" /></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /> <path d="m12 5 7 7-7 7" /></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7" /> <path d="M19 12H5" /></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /> <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /> <circle cx="12" cy="12" r="3" /></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /> <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /> <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /> <path d="m2 2 20 20" /></svg>',
  };

  /* ------------------------------------------------------------ Toast */
  CG.toast = function (msg, kind) {
    const box = document.getElementById('toasts');
    const n = document.createElement('div');
    n.className = 'toast ' + (kind || '');
    n.innerHTML = (kind === 'ok' ? I.ok : kind === 'err' ? I.no : I.info) + '<span>' + U.esc(msg) + '</span>';
    box.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; n.style.transition = 'opacity .25s'; }, 2400);
    setTimeout(() => n.remove(), 2750);
  };

  /* ------------------------------------------------------------ 模态 */
  CG.modal = function (html, opts) {
    opts = opts || {};
    const m = document.getElementById('modal');
    const panel = document.getElementById('modalPanel');
    panel.className = 'modal-panel' + (opts.wide ? ' wide' : '');
    panel.innerHTML = html;
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    const close = () => { m.hidden = true; document.body.style.overflow = ''; };
    CG._closeModal = close;
    U.qsa('[data-close]', m).forEach(el => el.onclick = close);
    if (opts.onMount) opts.onMount(panel, close);
    return close;
  };
  CG.closeModal = function () { if (CG._closeModal) CG._closeModal(); };

  /* ------------------------------------------------------------ 抽屉 */
  CG.drawer = function (title, html) {
    const d = document.getElementById('drawer');
    document.getElementById('drawerTitle').textContent = title;
    document.getElementById('drawerBody').innerHTML = html;
    d.hidden = false;
    const close = () => { d.hidden = true };
    CG._closeDrawer = close;
    U.qsa('[data-close]', d).forEach(el => el.onclick = close);
    return close;
  };
  CG.closeDrawer = function () { if (CG._closeDrawer) CG._closeDrawer(); };

  /* ------------------------------------------------------------ IndexedDB */
  function idbOpen() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('cg-proto', 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  function idbTx(store, mode, fn) {
    return idbOpen().then(db => new Promise((res, rej) => {
      const tx = db.transaction(store, mode);
      const s = tx.objectStore(store);
      const req = fn(s);
      tx.oncomplete = () => res(req && req.result);
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
    })).catch(() => null);
  }
  const idbGet = (st, k) => idbTx(st, 'readonly', s => s.get(k));
  const idbPut = (st, k, v) => idbTx(st, 'readwrite', s => s.put(v, k));


  /* ------------------------------------------------------------ 授权策略 */
  /** 条款包：一套「采购方要填什么」+「创作者放行到哪」的预设 */
  CG.POLICY_PACKS = [
    {
      id: 'standard', label: '标准商用包',
      desc: '正片、短视频、广告；内地与香港；24 个月内；非独占',
      clause: {
        media: ['正片/成片', '短视频', '广告'], region: ['中国内地', '香港'], term: '24 个月',
        exclusive: '非独占', modify: '原样使用', training: '禁止', resell: '禁止', credit: '必须署名'
      },
      auto: {
        media: ['正片/成片', '短视频', '广告', '互动应用'], region: ['中国内地', '香港', '澳门'],
        termMax: 24, exclusive: ['非独占'], modify: ['原样使用', '可剪辑'],
        training: ['禁止'], resell: ['禁止'], credit: ['必须署名', '署名可选']
      }
    },
    {
      id: 'training', label: 'AI 训练包',
      desc: '模型训练与评测；不要求独占；需披露训练用途',
      clause: {
        media: ['互动应用'], region: ['中国内地', '香港'], term: '12 个月',
        exclusive: '非独占', modify: '原样使用', training: '允许但需披露', resell: '禁止', credit: '必须署名'
      },
      auto: {
        media: ['互动应用', '正片/成片'], region: ['中国内地', '香港', '澳门'],
        termMax: 24, exclusive: ['非独占'], modify: ['原样使用'],
        training: ['允许但需披露'], resell: ['禁止'], credit: ['必须署名', '署名可选']
      }
    },
    {
      id: 'distribution', label: '全渠道发行包',
      desc: '含印刷与线下展陈；内地、香港、东盟；36 个月；品类独占',
      clause: {
        media: ['正片/成片', '广告', '印刷出版', '线下展陈'], region: ['中国内地', '香港', '东南亚'],
        term: '36 个月', exclusive: '品类独占', modify: '可剪辑',
        training: '禁止', resell: '允许一级', credit: '必须署名'
      },
      auto: {
        media: ['正片/成片', '广告', '印刷出版', '线下展陈'],
        region: ['中国内地', '香港', '澳门', '东南亚'],
        termMax: 36, exclusive: ['非独占', '品类独占'], modify: ['原样使用', '可剪辑'],
        training: ['禁止'], resell: ['禁止', '允许一级'], credit: ['必须署名', '署名可选']
      }
    },
    {
      id: 'derivative', label: '衍生开发包',
      desc: '允许改编与衍生；完全独占需人工；可转授权',
      clause: {
        media: ['互动应用', '印刷出版'], region: ['全球'], term: '36 个月',
        exclusive: '完全独占', modify: '可衍生', training: '禁止', resell: '允许一级', credit: '署名可选'
      },
      auto: {
        media: ['正片/成片', '互动应用', '印刷出版'], region: ['中国内地', '香港', '澳门'],
        termMax: 36, exclusive: ['非独占', '品类独占'], modify: ['原样使用', '可剪辑', '可改编'],
        training: ['禁止'], resell: ['禁止', '允许一级'], credit: ['必须署名', '署名可选']
      }
    }
  ];

  /** 取作品策略：没配过就用默认 */
  CG.workPolicy = function (w) {
    if (w && w.policy && w.policy.auto) return w.policy;
    return JSON.parse(JSON.stringify(CG.DEFAULT_POLICY));
  };

  /** 是否对该作品启用了自动成交 */
  CG.policyOn = function (w) {
    return !(w && w.policy && w.policy.enabled === false);
  };

  /** 飞轮统计：历史上「人工接受过」的超限维度次数 */
  CG.policyStats = function () {
    const out = {};
    ((CG.state && CG.state.leads) || []).forEach(l => {
      if (l.status !== 'signed' || !l.over) return;
      l.over.forEach(o => { out[o.dim] = (out[o.dim] || 0) + 1 });
    });
    return out;
  };

  /** 给创作者的建议：哪些维度已经够条件放宽了 */
  CG.policyHints = function (w, min) {
    const stats = CG.policyStats();
    const pol = CG.workPolicy(w);
    const hints = [];
    Object.keys(stats).forEach(dim => {
      if (stats[dim] >= (min || 3)) hints.push({ dim, count: stats[dim] });
    });
    return hints.sort((a, b) => b.count - a.count);
  };

  /** 策略的"放行率"估算：用近期询价里落在区间内的比例 */
  CG.policyCoverage = function (w) {
    const rows = ((CG.state && CG.state.leads) || []).filter(l => l.workId === (w && w.id));
    if (!rows.length) return null;
    const auto = rows.filter(l => !l.over || !l.over.length).length;
    return { total: rows.length, auto, rate: Math.round(auto / rows.length * 100) };
  };

  /* ------------------------------------------------------------ 认证头 */
  function authH(extra) {
    const h = Object.assign({}, extra || {});
    const tk = localStorage.getItem('cg-token');
    if (tk) h.authorization = 'Bearer ' + tk;
    return h;
  }

  /* ------------------------------------------------------------ 存储层 */
  const store = CG.store = {
    mode: 'local',          // fs | idb | local
    info: null,
    blobCache: new Map(),

    async detect() {
      // 1) 本地 Node 服务？
      try {
        const r = await fetch('/api/health', { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          if (j && j.ok && j.storage === 'fs') { this.mode = 'fs'; this.info = j; return this.mode }
        }
      } catch (e) { }
      // 2) 浏览器 IndexedDB？
      const probe = await idbPut('kv', '__probe', 1);
      if (probe !== null) { this.mode = 'idb'; return this.mode }
      // 3) localStorage 兜底
      this.mode = 'local';
      return this.mode;
    },

    async load() {
      if (this.mode === 'fs') {
        try {
          const r = await fetch('/api/state', { cache: 'no-store', headers: authH() });
          const j = await r.json();
          if (j.ok && j.state && (j.state.works || []).length) return j.state;
        } catch (e) { }
        return null;
      }
      if (this.mode === 'idb') return await idbGet('kv', 'state');
      try { return JSON.parse(localStorage.getItem('cg-state') || 'null') } catch (e) { return null }
    },

    async save(state) {
      if (this.mode === 'fs') {
        try {
          const r = await fetch('/api/state', {
            method: 'PUT', headers: authH({ 'content-type': 'application/json' }),
            body: JSON.stringify(state)
          });
          if (r.status === 401) { CG.toast('登录已失效，请重新登录', 'err'); return false }
          return true;
        } catch (e) { CG.toast('保存失败：' + e.message, 'err'); return false }
      }
      if (this.mode === 'idb') { await idbPut('kv', 'state', state); return true }
      try { localStorage.setItem('cg-state', JSON.stringify(state)); return true }
      catch (e) { CG.toast('本地空间不足，请改用本地服务运行', 'err'); return false }
    },

    /** 真上传：fs 模式写进 data/uploads/，idb 模式存浏览器 */
    async upload(file, onProgress) {
      if (this.mode === 'fs') {
        return await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/upload');
          xhr.setRequestHeader('x-filename', encodeURIComponent(file.name));
          xhr.setRequestHeader('content-type', 'application/octet-stream');
          const tk = localStorage.getItem('cg-token');
          if (tk) xhr.setRequestHeader('Authorization', 'Bearer ' + tk);
          xhr.upload.onprogress = e => {
            if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
          };
          xhr.onload = () => {
            try {
              const j = JSON.parse(xhr.responseText);
              if (j.ok) resolve(j.file);
              else reject(new Error(j.error || '上传失败'));
            } catch (e) { reject(new Error('返回解析失败')) }
          };
          xhr.onerror = () => reject(new Error('网络错误'));
          xhr.send(file);
        });
      }
      // idb 模式：把文件体存进浏览器
      const key = 'f-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
      const ok = await idbPut('files', key, {
        blob: file, name: file.name, type: file.type, size: file.size
      });
      if (ok === null && file.size > 40 * 1024 * 1024) {
        throw new Error('浏览器模式不支持超过 40MB 的文件，请用本地服务运行');
      }
      if (onProgress) onProgress(1);
      return {
        id: key, name: file.name, size: file.size, type: file.type,
        url: 'idb://' + key, storedAt: '浏览器 IndexedDB'
      };
    },

    /** 解析文件地址（fs 直接用 URL，idb 生成 objectURL） */
    async fileUrl(u) {
      if (!u) return null;
      if (u.startsWith('idb://')) {
        const key = u.slice(6);
        if (this.blobCache.has(key)) return this.blobCache.get(key);
        const rec = await idbGet('files', key);
        if (!rec) return null;
        const obj = URL.createObjectURL(rec.blob);
        this.blobCache.set(key, obj);
        return obj;
      }
      return u;
    }
  };

  /* ------------------------------------------------------------ 状态 */
  CG.state = null;
  CG.ui = { q: '', libFilter: 'all', libSort: 'recent', mktFilter: 'all', mktSort: 'popular' };

  CG.save = async function () {
    CG.state.savedAt = new Date().toISOString();
    return await store.save(CG.state);
  };
  CG.saveSoon = U.debounce(() => { CG.save() }, 400);

  CG.work = function (id) {
    return (CG.state.works || []).find(w => w.id === id) || null;
  };

  CG.recompute = function () {
    const st = CG.state;
    const byWork = {};
    (st.revenue || []).forEach(r => {
      byWork[r.workId] = byWork[r.workId] || { revenue: 0, licenses: 0 };
      if (r.status === 'settled' || r.status === 'pending') byWork[r.workId].revenue += r.amount;
    });
    (st.leads || []).forEach(l => {
      if (l.status === 'signed') {
        byWork[l.workId] = byWork[l.workId] || { revenue: 0, licenses: 0 };
        byWork[l.workId].licenses += 1;
      }
    });
    const byDisp = {};
    (st.disputes || []).forEach(d => {
      byDisp[d.workId] = byDisp[d.workId] || 0;
      byDisp[d.workId] += 1;
    });
    (st.works || []).forEach(w => {
      const a = byWork[w.id];
      if (a) { w.stats.revenue = Math.max(w.stats.revenue, a.revenue); }
      w.stats.licenses = Math.max(w.stats.licenses || 0, a ? a.licenses : 0);
      w.stats.disputes = Math.max(w.stats.disputes || 0, byDisp[w.id] || 0);
    });
  };

  /* ------------------------------------------------------------ 汇总指标 */
  CG.metrics = function () {
    const st = CG.state;
    const works = st.works || [];
    const settled = (st.revenue || []).filter(r => r.status === 'settled');
    const pending = (st.revenue || []).filter(r => r.status === 'pending');
    const monthKey = U.now().slice(0, 7);
    const monthRev = settled.concat(pending)
      .filter(r => String(r.at).slice(0, 7) === monthKey)
      .reduce((s, r) => s + r.amount, 0);
    const todayRev = settled.concat(pending)
      .filter(r => String(r.at).slice(0, 10) === U.now().slice(0, 10))
      .reduce((s, r) => s + r.amount, 0);
    const totalRev = settled.concat(pending).reduce((s, r) => s + r.amount, 0)
      + works.reduce((s, w) => s + Math.max(0, (w.stats.revenue || 0) - 0), 0) * 0;
    const openDisputes = (st.disputes || []).filter(d => d.status === 'open');
    const pendingLeads = (st.leads || []).filter(l => l.status === 'pending');
    return {
      workCount: works.length,
      registered: works.filter(w => w.status !== 'draft').length,
      listed: works.filter(w => w.status === 'listed').length,
      draft: works.filter(w => w.status === 'draft').length,
      disputes: (st.disputes || []).length,
      openDisputes: openDisputes.length,
      monthRev, todayRev,
      totalRev: Math.max(totalRev, works.reduce((s, w) => s + (w.stats.revenue || 0), 0)),
      pendingSettle: pending.reduce((s, r) => s + r.amount, 0),
      leads: (st.leads || []).length,
      pendingLeads: pendingLeads.length,
      views: works.reduce((s, w) => s + (w.stats.views || 0), 0),
      inquiries: works.reduce((s, w) => s + (w.stats.inquiries || 0), 0)
    };
  };

  /* ------------------------------------------------------------ 路由 */
  CG.routes = ['home', 'dash', 'upload', 'library', 'work', 'market', 'marketItem',
    'promote', 'promoteItem', 'revenue', 'dispute', 'settings',
    'consumer', 'cart', 'orders', 'favorites', 'whyhk'];

  // 带二级路径时转发到独立视图（如 #/market/:id → marketItem）
  CG.ITEM_VIEW = { market: 'marketItem', promote: 'promoteItem' };

  CG.parse = function () {
    let raw = (location.hash || '').replace(/^#\/?/, '');
    if (!raw) raw = 'dash';
    const seg = raw.split('/').filter(Boolean);
    const name = seg[0];
    return { name: CG.routes.indexOf(name) >= 0 ? name : 'dash', args: seg.slice(1) };
  };

  CG.go = function (path) {
    if (location.hash === '#/' + path) { CG.render(); return }
    location.hash = '#/' + path;
  };

  CG.render = function () {
    if (!CG.state) return;
    const r = CG.parse();
    const view = document.getElementById('view');
    let name = r.name;
    if (r.args.length && CG.ITEM_VIEW[name]) name = CG.ITEM_VIEW[name];
    const fn = CG.views[name];
    if (!fn) { view.innerHTML = '<div class="empty"><b>页面不存在</b></div>'; return }
    document.getElementById('main').scrollTop = 0;
    view.innerHTML = fn(r.args);
    CG.updateNav(name);
    if (fn.after) fn.after(r.args);
    CG.syncBadges();
  };

  CG.updateNav = function (name) {
    const map = { dash: 'dash', library: 'library', work: 'library', upload: 'upload', promote: 'promote', promoteItem: 'promote', market: 'market', marketItem: 'market', revenue: 'revenue', dispute: 'dispute', settings: 'settings' };
    const active = map[name] || name;
    U.qsa('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === active));
  };

  CG.syncBadges = function () {
    const m = CG.metrics();
    const nw = document.getElementById('navWorkCnt');
    const nd = document.getElementById('navDisputeCnt');
    if (nw) nw.textContent = m.listed ? String(m.listed) : '';
    if (nd) nd.textContent = m.openDisputes ? String(m.openDisputes) : '';
    const dot = document.getElementById('notifDot');
    if (dot) dot.hidden = !(CG.state.notices || []).length;
    const foot = document.getElementById('sideFoot');
    if (foot) {
      const p = CG.state.profile;
      foot.innerHTML = `<b>${U.esc(p.verifyLevel)}已通过</b>${U.esc(p.org)}<br>
        编号 <u>${U.esc(p.orgId)}</u><br>有效期至 ${U.esc(p.verifyUntil)}`;
    }
  };

  CG.markStale = function () { CG.saveSoon(); CG.recompute(); CG.syncBadges(); };

  /* ------------------------------------------------------------ 模式角标 */
  CG.showMode = function () {
    const b = document.getElementById('modeBadge');
    const t = document.getElementById('modeText');
    if (!b) return;
    b.classList.remove('fs', 'idb');
    if (store.mode === 'fs') {
      b.classList.add('fs'); t.textContent = '本地数据站';
      b.title = '真实文件写入 data/uploads/，数据存 data/db.json。点击查看位置。';
    } else if (store.mode === 'idb') {
      b.classList.add('idb'); t.textContent = '浏览器存储';
      b.title = '当前没有连接本地服务，数据存在浏览器里。想在电脑文件夹里留存文件，请运行 node server.mjs。';
    } else {
      t.textContent = '临时存储';
      b.title = '数据只能保留在当前页面中。';
    }
    b.onclick = () => {
      const isFs = store.mode === 'fs';
      CG.modal(`
        <div style="padding:18px 20px">
          <div class="card-h"><h3>数据存在哪里</h3></div>
          <p class="small" style="line-height:1.7;color:var(--ink-2)">
            ${isFs
          ? '当前连接着本地服务，你上传的原始文件会真实写进电脑里的文件夹，作品、授权、收入、宣发的所有改动都会保存成 JSON。'
          : '当前是浏览器模式（静态托管或直接打开文件）。上传的文件存在浏览器 IndexedDB 里，换设备或清缓存就会丢。'}
          </p>
          <div class="note c" style="margin-top:12px">
            ${I.info}
            <div>${isFs
          ? '文件目录：<code class="mono">cinegba-proto/data/uploads/</code><br>数据文件：<code class="mono">cinegba-proto/data/db.json</code>'
          : '想改成真实落盘：在项目目录运行 <code class="mono">node server.mjs</code>，然后访问 <code class="mono">http://localhost:8090</code>。'}</div>
          </div>
          <div class="row mt16" style="justify-content:flex-end">
            <button class="btn" data-close>知道了</button>
          </div>
        </div>`);
    };
  };

  /* ------------------------------------------------------------ 通知 */
  CG.openNotices = function () {
    const list = (CG.state.notices || []);
    const html = list.length ? list.map(n => {
      const ic = n.type === 'dispute' ? I.shield : n.type === 'lead' ? I.cart
        : n.type === 'money' ? I.chart : I.info;
      return `<div class="srow" style="align-items:flex-start">
        <div class="ci" style="width:28px;height:28px;border-radius:8px;display:grid;place-items:center;
          background:var(--cyan-soft);color:var(--cyan);flex:0 0 auto">
          <span style="display:block;width:14px;height:14px">${ic}</span>
        </div>
        <div class="tx">
          <b>${U.esc(n.title)}</b>
          <span>${U.esc(n.body)}</span>
          <div class="hint" style="margin-top:3px">${U.rel(n.at)}</div>
        </div>
      </div>`;
    }).join('') : '<div class="empty"><p>没有新通知</p></div>';
    CG.drawer('通知', html);
  };

  /* ------------------------------------------------------------ 复制 */
  CG.copy = function (text, msg) {
    const done = () => CG.toast(msg || '已复制', 'ok');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done() } catch (e) { CG.toast('复制失败', 'err') }
      ta.remove();
    }
  };

  CG.confirm = function (title, body, onYes, yesLabel) {
    CG.modal(`
      <div style="padding:18px 20px">
        <div class="card-h"><h3>${U.esc(title)}</h3></div>
        <p class="small" style="line-height:1.7;color:var(--ink-2)">${body}</p>
        <div class="row mt16" style="justify-content:flex-end">
          <button class="btn" data-close>取消</button>
          <button class="btn pri" id="cfmYes">${U.esc(yesLabel || '确定')}</button>
        </div>
      </div>`, {
      onMount(panel, close) {
        panel.querySelector('#cfmYes').onclick = () => { close(); onYes() };
      }
    });
  };


  /* ------------------------------------------------------------ 认证 */
  const TK = 'cg-token', SE = 'cg-session', UK = 'cg-users';

  async function sha256(txt) {
    if (window.crypto && window.crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 2166136261;
    for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619) }
    return (h >>> 0).toString(16).padStart(8, '0').repeat(8).slice(0, 64);
  }

  const SEED_USERS = [
    { email: 'lin@example.com', password: 'cinegba2026', name: '林静',
      org: '大湾区晨曦动画工作室', orgId: 'CG-ENT-0231' },
    { email: 'demo@cinegba.com', password: 'demo1234', name: '陈立',
      org: '南岭影业（演示）', orgId: 'CG-ENT-0308' }
  ];
  CG.SEED_USERS = SEED_USERS;

  /* ---- 离线（无后端）账号库 ---- */
  const localDb = {
    async all() {
      try { return JSON.parse(localStorage.getItem(UK) || '[]') } catch (e) { return [] }
    },
    async save(list) { localStorage.setItem(UK, JSON.stringify(list)) },
    async ensureSeed() {
      let list = await this.all();
      if (list.length) return list;
      for (const s of SEED_USERS) {
        const salt = Math.random().toString(36).slice(2, 10);
        list.push({
          id: 'u-' + Math.random().toString(36).slice(2, 10),
          email: s.email, name: s.name, org: s.org, orgId: s.orgId,
          role: 'creator', verifyLevel: '企业认证', verifyUntil: '2027-08',
          salt, hash: await sha256(salt + s.password),
          createdAt: new Date().toISOString()
        });
      }
      await this.save(list);
      return list;
    }
  };

  CG.auth = {
    user: null,
    mode: 'fs',           // fs | local
    lastLogin: null,

    get isIn() { return !!(this.user) },

    /** 启动时恢复会话 */
    async boot() {
      this.mode = (store.mode === 'fs') ? 'fs' : 'local';

      if (this.mode === 'fs') {
        const tk = localStorage.getItem(TK);
        if (!tk) return null;
        try {
          const r = await fetch('/api/auth/me', { headers: { authorization: 'Bearer ' + tk } });
          if (!r.ok) { localStorage.removeItem(TK); return null }
          const j = await r.json();
          this.user = j.user;
          this.lastLogin = new Date().toISOString();
          return this.user;
        } catch (e) { return null }
      }

      // 离线模式
      await localDb.ensureSeed();
      const uid = localStorage.getItem(SE);
      if (!uid) return null;
      const list = await localDb.all();
      const u = list.find(x => x.id === uid);
      if (!u) { localStorage.removeItem(SE); return null }
      this.user = u;
      this.lastLogin = new Date().toISOString();
      return u;
    },

    async login(email, password) {
      email = String(email || '').trim().toLowerCase();
      if (!email || !password) throw new Error('请输入邮箱和密码');

      if (this.mode === 'fs') {
        const r = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || '登录失败');
        localStorage.setItem(TK, j.token);
        this.user = j.user;
        this.lastLogin = new Date().toISOString();
        return j.user;
      }

      const list = await localDb.ensureSeed();
      const u = list.find(x => x.email === email);
      if (!u) throw new Error('邮箱或密码不正确');
      const h = await sha256(u.salt + password);
      if (h !== u.hash) throw new Error('邮箱或密码不正确');
      localStorage.setItem(SE, u.id);
      this.user = u;
      this.lastLogin = new Date().toISOString();
      return u;
    },

    async register(data) {
      const email = String(data.email || '').trim().toLowerCase();
      const pw = String(data.password || '');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('邮箱格式不正确');
      if (pw.length < 6) throw new Error('密码至少 6 位');

      if (this.mode === 'fs') {
        const r = await fetch('/api/auth/register', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password: pw, name: data.name, org: data.org })
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || '注册失败');
        localStorage.setItem(TK, j.token);
        this.user = j.user;
        this.lastLogin = new Date().toISOString();
        return j.user;
      }

      const list = await localDb.ensureSeed();
      if (list.some(x => x.email === email)) throw new Error('该邮箱已注册');
      const salt = Math.random().toString(36).slice(2, 10);
      const u = {
        id: 'u-' + Math.random().toString(36).slice(2, 10),
        email, name: String(data.name || '未命名用户').slice(0, 40),
        org: String(data.org || '未填写机构').slice(0, 60),
        orgId: 'CG-ENT-' + Math.floor(1000 + Math.random() * 8999),
        role: 'creator', verifyLevel: '待认证', verifyUntil: '—',
        salt, hash: await sha256(salt + pw),
        createdAt: new Date().toISOString()
      };
      list.push(u);
      await localDb.save(list);
      localStorage.setItem(SE, u.id);
      this.user = u;
      this.lastLogin = new Date().toISOString();
      return u;
    },

    async logout() {
      if (this.mode === 'fs') {
        const tk = localStorage.getItem(TK);
        if (tk) {
          try {
            await fetch('/api/auth/logout', {
              method: 'POST', headers: { authorization: 'Bearer ' + tk }
            });
          } catch (e) { }
        }
        localStorage.removeItem(TK);
      } else {
        localStorage.removeItem(SE);
      }
      this.user = null;
    }
  };

})();
