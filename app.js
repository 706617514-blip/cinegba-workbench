/* ==========================================================================
   CineGBA IP-Bridge · 启动 / 认证分流 / 全局交互
   ========================================================================== */
(function () {
  'use strict';
  const CG = window.CG, U = CG.util, I = CG.icon;

  const PUBLIC = ['login', 'register'];

  /* ---------------- 主题 ---------------- */
  function initTheme() {
    const saved = localStorage.getItem('cg-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const lbl = document.getElementById('themeLbl');
    if (lbl) lbl.textContent = saved === 'dark' ? '深色' : '浅色';
    const btn = document.getElementById('themeBtn');
    if (!btn) return;
    btn.onclick = () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('cg-theme', next);
      if (lbl) lbl.textContent = next === 'dark' ? '深色' : '浅色';
    };
  }

  /* ---------------- 路由名（区分公开页） ---------------- */
  function routeName() {
    const raw = (location.hash || '').replace(/^#\/?/, '');
    if (!raw) return 'landing';
    return raw.split('/').filter(Boolean)[0] || 'landing';
  }

  /* ---------------- 显示切换 ---------------- */
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
    window.scrollTo(0, 0);
    if (fn.after) fn.after();
    CG.closeModal(); CG.closeDrawer();
  }

  function showApp() {
    const app = document.getElementById('app');
    const pub = document.getElementById('public');
    if (pub) { pub.hidden = true; pub.innerHTML = '' }
    if (app) app.hidden = false;
    document.body.classList.remove('mode-public');
    document.body.classList.add('mode-app');
  }

  /* ---------------- 统一渲染入口 ---------------- */
  let lastPublic = null;

  function route() {
    const h = location.hash || '';

    // 纯锚点（#capabilities）不触发重渲染，交给浏览器滚动
    if (h && !h.startsWith('#/')) {
      if (!CG.auth.isIn) {
        if (lastPublic !== 'landing') showPublic('landing');
      } else {
        showApp();
      }
      return;
    }

    const name = routeName();

    if (!CG.auth.isIn) {
      if (PUBLIC.indexOf(name) >= 0) return showPublic(name);
      return showPublic('landing');
    }

    if (PUBLIC.indexOf(name) >= 0 || name === 'landing') {
      if (location.hash !== '#/dash') { location.hash = '#/dash'; return }
    }
    showApp();
    if (CG.state) CG.render();
  }
  CG.route = route;

  /* ---------------- 登录态变化 ---------------- */
  CG.onAuthChanged = async function () {
    if (CG.auth.isIn) {
      await ensureState();
      showApp();
      location.hash = '#/dash';
      CG.render();
      CG.syncBadges();
    } else {
      CG.state = null;
      loaded = false;
      showPublic('landing');
    }
  };

  /* ---------------- 加载数据 ---------------- */
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
    CG.state = st;
    CG.recompute();
    loaded = true;
  }
  CG.reloadState = async function () { loaded = false; await ensureState() };

  /* ---------------- 顶栏 ---------------- */
  function initTop() {
    const nb = document.getElementById('notifBtn');
    if (nb) nb.onclick = () => CG.openNotices();

    const ab = document.getElementById('avatarBtn');
    if (ab) ab.onclick = () => {
      const p = (CG.state && CG.state.profile) || {};
      const u = CG.auth.user || {};
      CG.drawer('账户', `
        <div class="srow" style="border-bottom:none;padding-top:0">
          <div class="avatar" style="width:38px;height:38px;font-size:13px">${U.esc((p.name || '?').slice(0, 1))}</div>
          <div class="tx"><b>${U.esc(p.name || '')}</b><span>${U.esc(p.org || '')}</span></div>
          <span class="pill ok">已认证</span>
        </div>
        <div class="hint" style="margin:-2px 0 10px 48px">${U.esc(u.email || p.email || '')}</div>
        <div class="sep"></div>
        <a class="navi" href="#/settings">${I.edit}<span style="margin-left:2px">账户与认证</span></a>
        <a class="navi" href="#/revenue">${I.chart}<span style="margin-left:2px">收款与提现</span></a>
        <a class="navi" href="#/settings">${I.shield}<span style="margin-left:2px">安全设置</span></a>
        <a class="navi" href="#/market">${I.cart}<span style="margin-left:2px">切到采购方视图</span></a>
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
    };

    const qi = document.getElementById('q');
    if (qi) {
      const onQ = U.debounce(() => {
        CG.ui.q = qi.value.trim();
        const r = CG.parse();
        if (r.name === 'library' || r.name === 'market') CG.render();
      }, 220);
      qi.addEventListener('input', onQ);
      qi.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          CG.ui.q = qi.value.trim();
          const r = CG.parse();
          if (r.name !== 'library' && r.name !== 'market') CG.go('library');
          else CG.render();
        }
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

  /* ---------------- 退出登录 ---------------- */
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
    initTheme();

    await CG.store.detect();
    CG.showMode();

    const u = await CG.auth.boot();

    initTop();

    if (u) {
      await ensureState();
      showApp();
      if (!location.hash || location.hash === '#/' || PUBLIC.indexOf(routeName()) >= 0) {
        location.hash = '#/dash';
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
            ? '已连接本地数据站，上传的文件会真实写入电脑文件夹'
            : '浏览器模式：数据存在浏览器里，运行 node server.mjs 可改为真实落盘', 'ok');
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
