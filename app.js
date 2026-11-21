/* ==========================================================================
   CineGBA IP-Bridge · 启动 / 认证分流 / 分区导航 / 全局交互
   ========================================================================== */
(function () {
  'use strict';
  const CG = window.CG, U = CG.util, I = CG.icon;

  const PUBLIC = ['login', 'register'];

  /* ---------------- 分区定义 ---------------- */
  /* 「首页」现在是独立的一档，和素材市场并列（原来它藏在市场分区的小导航里） */
  const ZONE_OF = {
    home: 'home', whyhk: 'home',
    market: 'market', marketItem: 'market',
    dash: 'creator', library: 'creator', upload: 'creator', work: 'creator',
    promote: 'creator', promoteItem: 'creator', revenue: 'creator', dispute: 'creator',
    consumer: 'consumer', cart: 'consumer', orders: 'consumer', favorites: 'consumer',
    settings: 'creator'
  };

  /* 侧栏只放「本分区内」的入口。
     跨分区切换统一交给顶部的分区栏（.zonebar），
     所以这里不再出现 market / dash / home / settings 这类跨区重复项：
       · 创作者中心原来还有一条「素材市场」，和分区栏重复 → 删
       · 消费者中心原来有「网站主页 / 素材市场 / 为什么是香港 / 切到创作者中心 / 账户设置」，
         全是别的地方已有的入口 → 删
       · 「为什么是香港」是市场分区的页面，不再挂在创作者侧栏里 */
  const SIDEBAR = {
    creator: [
      ['创作', [
        ['dash', '工作台', 'grid'],
        ['library', '作品库', 'file'],
        ['upload', '上传作品', 'up'],
        ['promote', '宣发中心', 'megaphone']
      ]],
      ['交易与维权', [
        ['revenue', '收入中心', 'chart'],
        ['dispute', '维权中心', 'shield', 'disputeCnt']
      ]],
      ['账户', [['settings', '认证与设置', 'gear']]]
    ],
    consumer: [
      ['逛与买', [
        ['consumer', '消费者中心', 'user'],
        ['cart', '选购车', 'cart', 'cartCnt'],
        ['orders', '我的订单', 'file'],
        ['favorites', '我的收藏', 'shield', 'favCnt']
      ]]
    ]
  };

  /* 底部导航：五个位置固定不变，切换分区只改高亮与「我的」的落点，
     避免项的顺序随分区变化导致手指按记忆点错 */
  const MOBNAV = [
    ['home', '主页', 'grid'],
    ['market', '市场', 'cart'],
    ['upload', '上传', 'up'],
    ['cart', '选购车', 'cart'],
    ['__me', '我的', 'user']
  ];
  const ME_TARGET = { creator: 'dash', market: 'consumer', consumer: 'consumer' };

  /* 显式映射：每个页面写清楚高亮哪一项（'__me' 表示「我的」）。
     不做「列表包含判断」，从根本上杜绝一项页面点亮两个导航。 */
  const PAGE_NAV = {
    home: 'home',
    market: 'market',
    marketItem: 'market',
    whyhk: 'market',
    upload: 'upload',
    cart: 'cart',
    consumer: '__me',
    orders: '__me',
    favorites: '__me',
    dash: '__me',
    library: '__me',
    work: '__me',
    promote: '__me',
    promoteItem: '__me',
    dispute: '__me',
    revenue: '__me',
    settings: '__me'
  };

  /* 兜底：新页面忘了登记时按分区猜，并在控制台提醒补映射 */
  function navKeyOf(name, zone) {
    if (PAGE_NAV[name]) return PAGE_NAV[name];
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[nav] 页面「' + name + '」未在 PAGE_NAV 登记，已按分区兜底，请补映射');
    }
    return zone === 'market' ? 'market' : '__me';
  }

  function mobNavHtml(zone, name) {
    const activeKey = navKeyOf(name, zone);
    return MOBNAV.map(function (it) {
      const key = it[0], label = it[1], ic = it[2];
      const isMe = key === '__me';
      const target = isMe ? (ME_TARGET[zone] || 'consumer') : key;
      const on = key === activeKey;
      return `<a data-nav="${target}" class="${on ? 'on' : ''}" href="#/${target}">${svg(ic)}${label}</a>`;
    }).join('');
  }

  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    file: '<path d="M4 5a2 2 0 012-2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><path d="M14 3v6h6"/>',
    up: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/>',
    megaphone: '<path d="M3 11l16-6v14L3 13z"/><path d="M7 12v6"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.4 11h11L21 7H6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'
  };
  const svg = k => `<svg viewBox="0 0 24 24">${ICONS[k] || ICONS.grid}</svg>`;

  /* ---------------- 主题 ---------------- */
  /* 只剩一套「暖石」主题（深色模式按用户要求取消，浅色也压深了一档）。
     这里不再有切换按钮，只负责把主题标记写上，并清掉老版本留在
     localStorage 里的 cg-theme —— 否则老用户带着 dark 进来会看到半旧样式。 */
  /* 主题 + 语言：语言切换后要重渲染，所以放在启动最前面 */
  function initLang() {
    if (CG.initI18n) CG.initI18n();
  }

  function initTheme() {
    try { localStorage.removeItem('cg-theme') } catch (e) { }
    document.documentElement.setAttribute('data-theme', 'stone');
  }

  /* ---------------- 路由名 ---------------- */
  function routeName() {
    const raw = (location.hash || '').replace(/^#\/?/, '');
    if (!raw) return 'landing';
    return raw.split(/[/?]/).filter(Boolean)[0] || 'landing';
  }

  /* ---------------- 公开页 ---------------- */
  let lastPublic = null;
  function showPublic(name) {
    const app = document.getElementById('app');
    const pub = document.getElementById('public');
    if (app) app.hidden = true;
    if (pub) pub.hidden = false;
    document.body.classList.add('mode-public');
    document.body.classList.remove('mode-app');
    const fn = CG.pages[name] || CG.pages.landing;
    lastPublic = CG.pages[name] ? name : 'landing';
    pub.innerHTML = fn();
    if (CG.applyShellI18n) CG.applyShellI18n(pub);
    window.scrollTo(0, 0);
    if (fn.after) fn.after();
    CG.closeModal(); CG.closeDrawer();
  }

  /* 切语言：公开页与工作台走的是两条渲染路径，这里各重画一次 */
  document.addEventListener('cg:lang', function () {
    const pub = document.getElementById('public');
    if (pub && !pub.hidden) { showPublic(lastPublic); return; }
    CG.render();
  });

  function showApp() {
    const app = document.getElementById('app');
    const pub = document.getElementById('public');
    if (pub) { pub.hidden = true; pub.innerHTML = '' }
    if (app) app.hidden = false;
    document.body.classList.remove('mode-public');
    document.body.classList.add('mode-app');
  }

  /* ---------------- 侧栏 / 移动导航 ---------------- */
  function counts() {
    return {
      disputeCnt: ((CG.state && CG.state.disputes) || []).filter(d => d.status === 'open').length,
      cartCnt: ((CG.state && CG.state.cart) || []).length,
      favCnt: (CG.favCount ? CG.favCount() : ((CG.state && CG.state.favorites) || []).length)
    };
  }

  function paintChrome(name) {
    const zone = ZONE_OF[name] || 'creator';
    document.body.classList.remove('zone-market', 'zone-creator', 'zone-consumer');
    document.body.classList.add('zone-' + zone);

    const c = counts();
    const side = document.getElementById('side');
    const def = SIDEBAR[zone] || SIDEBAR.creator;
    side.innerHTML = def.map(([lbl, items]) => `
      <div class="side-lbl">${lbl}</div>
      ${items.map(([key, label, ic, cntKey]) => {
      const n = cntKey ? c[cntKey] : 0;
      return `<a class="navi ${name === key ? 'on' : ''}" data-nav="${key}" href="#/${key}">
          ${svg(ic)}${label}${n ? `<span class="cnt">${n}</span>` : ''}</a>`;
    }).join('')}
    `).join('') + `<div class="side-foot">${sideFoot()}</div>`;

    const mob = document.getElementById('mobnav');
    mob.innerHTML = mobNavHtml(zone, name);

    document.querySelectorAll('#zones .zone').forEach(a => {
      a.classList.toggle('on', a.dataset.zone === zone);
    });

    paintAvatar(); paintCart();
  }

  function sideFoot() {
    const p = (CG.state && CG.state.profile) || {};
    const lvl = p.verifyLevel || '未认证';
    const okTxt = lvl.indexOf('待') < 0 && lvl !== '未认证' ? '已通过' : '';
    return `<b>${U.esc(lvl)}${okTxt}</b>
      ${U.esc(p.org || '')}<br>编号 <span class="mono">${U.esc(p.orgId || '—')}</span>`;
  }

  function paintAvatar() {
    const el = document.getElementById('avatarBtn');
    if (!el) return;
    const p = (CG.state && CG.state.profile) || {};
    const u = CG.auth.user || {};
    const nm = String(p.name || u.name || '?').trim();
    el.textContent = nm.slice(0, 1) || '?';
    el.title = nm;
  }

  function paintCart() {
    const el = document.getElementById('cartCount');
    if (!el) return;
    const n = ((CG.state && CG.state.cart) || []).length;
    el.textContent = n > 99 ? '99+' : String(n);
    el.hidden = !n;
  }

  /* ---------------- 渲染入口 ---------------- */
  function route() {
    const h = location.hash || '';
    if (h && !h.startsWith('#/')) {
      if (!CG.auth.isIn) { if (lastPublic !== 'landing') showPublic('landing') }
      else showApp();
      return;
    }
    const name = routeName();
    if (!CG.auth.isIn) {
      if (PUBLIC.indexOf(name) >= 0) return showPublic(name);
      return showPublic('landing');
    }
    if (PUBLIC.indexOf(name) >= 0 || name === 'landing') {
      if (location.hash !== '#/home') { location.hash = '#/home'; return }
    }
    showApp();
    if (!CG.state) return;
    if (!CG.views[name] && !CG.ITEM_VIEW[name] && name !== 'landing') {
      location.hash = '#/home'; return;
    }
    CG.render();
  }
  CG.route = route;

  /* ---------------- 登录态变化 ---------------- */
  CG.onAuthChanged = async function () {
    if (CG.auth.isIn) {
      await ensureState();
      showApp();
      location.hash = '#/home';
      CG.render();
      CG.syncBadges();
    } else {
      CG.state = null; loaded = false;
      showPublic('landing');
    }
  };

  /* ---------------- 状态 ---------------- */
  let loaded = false;
  async function ensureState() {
    if (loaded && CG.state) return;
    let st = await CG.store.load();
    if (!st || !st.works) st = JSON.parse(JSON.stringify(CG.SEED));
    if (CG.auth.user) {
      st.profile = st.profile || {};
      st.profile.name = CG.auth.user.name || st.profile.name;
      st.profile.org = CG.auth.user.org || st.profile.org;
      st.profile.email = CG.auth.user.email || st.profile.email;
      st.profile.orgId = CG.auth.user.orgId || st.profile.orgId;
      st.profile.verifyLevel = CG.auth.user.verifyLevel || st.profile.verifyLevel;
      st.profile.verifyUntil = CG.auth.user.verifyUntil || st.profile.verifyUntil;
    }
    st.cart = st.cart || [];
    st.orders = st.orders || [];
    st.favorites = st.favorites || [];
    CG.state = st;
    if (CG.applySeedEn) CG.applySeedEn(CG.state);
    CG.recompute();
    loaded = true;
  }
  CG.reloadState = async function () { loaded = false; await ensureState() };

  /* ---------------- 顶栏 ---------------- */
  function initTop() {
    const nb = document.getElementById('notifBtn');
    if (nb) nb.onclick = () => CG.openNotices();
    const ab = document.getElementById('avatarBtn');
    if (ab) ab.onclick = openAccount;

    const qi = document.getElementById('q');
    if (qi) {
      const onQ = U.debounce(() => {
        CG.ui.q = qi.value.trim();
        CG.ui.marketPage = 1;
        const r = CG.parse();
        if (r.name === 'market' || r.name === 'home' || r.name === 'library') CG.render();
        else if (CG.ui.q) CG.go('market');
      }, 260);
      qi.addEventListener('input', onQ);
      qi.addEventListener('keydown', e => {
        if (e.key === 'Enter') { CG.ui.q = qi.value.trim(); CG.ui.marketPage = 1; CG.go('market') }
        if (e.key === 'Escape') { qi.value = ''; CG.ui.q = ''; if (CG.state) CG.render(); qi.blur() }
      });
    }

    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const i = document.getElementById('q');
        const app = document.getElementById('app');
        if (i && app && !app.hidden) { e.preventDefault(); i.focus(); i.select() }
      }
      if (e.key === 'Escape') { CG.closeModal(); CG.closeDrawer() }
    });

    window.addEventListener('hashchange', route);

    document.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', () => { CG.closeModal(); CG.closeDrawer() });
    });
  }

  function openAccount() {
    const p = (CG.state && CG.state.profile) || {};
    const u = CG.auth.user || {};
    const cart = ((CG.state && CG.state.cart) || []).length;
    CG.drawer('账户', `
      <div class="srow" style="border-bottom:none;padding-top:0">
        <div class="avatar" style="width:38px;height:38px;font-size:13px">${U.esc(String(p.name || '?').slice(0, 1))}</div>
        <div class="tx"><b>${U.esc(p.name || '')}</b><span>${U.esc(p.org || '')}</span></div>
        <span class="pill ok">已认证</span>
      </div>
      <div class="hint" style="margin:-2px 0 10px 48px">${U.esc(u.email || p.email || '')}</div>
      <div class="sep"></div>
      <a class="navi" href="#/consumer">${svg('user')}<span style="margin-left:2px">消费者中心</span></a>
      <a class="navi" href="#/cart">${svg('cart')}<span style="margin-left:2px">选购车</span>${cart ? `<span class="cnt">${cart}</span>` : ''}</a>
      <a class="navi" href="#/orders">${svg('file')}<span style="margin-left:2px">我的订单</span></a>
      <a class="navi" href="#/dash">${svg('grid')}<span style="margin-left:2px">创作者中心</span></a>
      <a class="navi" href="#/settings">${svg('gear')}<span style="margin-left:2px">账户与设置</span></a>
      <div class="sep"></div>
      <div class="srow"><div class="tx"><b>存储方式</b>
        <span>${CG.store.mode === 'fs' ? '本地服务 · 真实落盘' :
        CG.store.mode === 'idb' ? '浏览器存储' : '临时存储'}</span></div>
        <span class="pill ${CG.store.mode === 'fs' ? 'ok' : 'w'}">${CG.store.mode === 'fs' ? '持久' : '临时'}</span></div>
      <div class="srow"><div class="tx"><b>数据版本</b>
        <span>${CG.state && CG.state.savedAt ? '保存于 ' + U.dt(CG.state.savedAt) : '尚未保存'}</span></div></div>
      <div class="sep"></div>
      <button class="btn wide danger" id="logoutDrawer">${I.no}退出登录</button>
    `);
    const b = document.getElementById('logoutDrawer');
    if (b) b.onclick = doLogout;
  }

  /* ---------------- 退出 ---------------- */
  async function doLogout() {
    CG.confirm('退出登录', '退出后会回到首页。你上传的文件与数据仍保留在本机，重新登录即可看到。', async () => {
      await CG.auth.logout();
      CG.closeDrawer();
      CG.toast('已退出登录');
      CG.onAuthChanged();
    }, '退出登录');
  }
  CG.doLogout = doLogout;

  /* ---------------- 曝光微增 ---------------- */
  function startTick() {
    setInterval(() => {
      if (document.hidden || !CG.auth.isIn || !CG.state) return;
      let changed = false;
      (CG.state.works || []).forEach(w => {
        if (w.marketing && w.marketing.on) {
          const ex = w.marketing.exposure || [];
          if (ex.length) { ex[ex.length - 1] += Math.floor(Math.random() * 3); changed = true }
        }
      });
      if (changed) CG.saveSoon();
    }, 12000);
  }

  /* ---------------- 启动 ---------------- */
  async function boot() {
    initLang();
    initTheme();
    await CG.store.detect();
    CG.showMode();
    const u = await CG.auth.boot();
    initTop();

    // 动效标记：稍后打开，避免首屏动画与数据渲染打架
    setTimeout(() => { document.body.dataset.anim = 'on' }, 120);

    const origSync = CG.syncBadges;
    CG.syncBadges = function () {
      if (!CG.state) return;
      try { origSync() } catch (e) { }
      paintAvatar(); paintCart();
      const d = document.querySelector('[data-nav="dispute"] .cnt');
      if (d) {
        const n = (CG.state.disputes || []).filter(x => x.status === 'open').length;
        d.textContent = n || '';
      }
      const cm = document.querySelector('[data-nav="cart"] .cnt');
      if (cm) {
        const n = (CG.state.cart || []).length;
        cm.textContent = n || '';
      }
      const fm = document.querySelector('[data-nav="favorites"] .cnt');
      if (fm) {
        const n = CG.favCount ? CG.favCount() : ((CG.state.favorites) || []).length;
        fm.textContent = n || '';
      }
    };

    CG.updateNav = function (name) { paintChrome(name) };

    if (u) {
      await ensureState();
      showApp();
      const n = routeName();
      if (!location.hash || location.hash === '#/' || PUBLIC.indexOf(n) >= 0 || n === 'landing') {
        location.hash = '#/home';
      }
      CG.render();
      CG.syncBadges();
    } else {
      route();
    }

    startTick();

    if (!localStorage.getItem('cg-welcomed')) {
      localStorage.setItem('cg-welcomed', '1');
      setTimeout(() => {
        if (CG.auth.isIn) {
          CG.toast(CG.store.mode === 'fs'
            ? '已连接本地数据站 · 素材市场已载入 ' + CG.virtual.count().toLocaleString() + ' 件演示素材'
            : '浏览器模式 · 素材市场已载入 ' + CG.virtual.count().toLocaleString() + ' 件演示素材', 'ok');
        }
      }, 600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
