/* ==========================================================================
   CineGBA IP-Bridge · 启动与全局交互
   ========================================================================== */
(function () {
  'use strict';
  const CG = window.CG, U = CG.util, I = CG.icon;

  /* ---------------- 主题 ---------------- */
  function initTheme() {
    const saved = localStorage.getItem('cg-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const lbl = document.getElementById('themeLbl');
    if (lbl) lbl.textContent = saved === 'dark' ? '深色' : '浅色';
    document.getElementById('themeBtn').onclick = () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('cg-theme', next);
      if (lbl) lbl.textContent = next === 'dark' ? '深色' : '浅色';
    };
  }

  /* ---------------- 顶栏 ---------------- */
  function initTop() {
    document.getElementById('notifBtn').onclick = () => CG.openNotices();
    document.getElementById('avatarBtn').onclick = () => {
      const p = CG.state.profile;
      CG.drawer('账户', `
        <div class="srow" style="border-bottom:none;padding-top:0">
          <div class="avatar" style="width:38px;height:38px;font-size:13px">${U.esc(p.name.slice(0, 1))}</div>
          <div class="tx"><b>${U.esc(p.name)}</b><span>${U.esc(p.org)}</span></div>
          <span class="pill ok">已认证</span>
        </div>
        <div class="sep"></div>
        <a class="navi" href="#/settings" onclick="CG.closeDrawer()">${I.edit}<span style="margin-left:2px">账户与认证</span></a>
        <a class="navi" href="#/revenue" onclick="CG.closeDrawer()">${I.chart}<span style="margin-left:2px">收款与提现</span></a>
        <a class="navi" href="#/settings" onclick="CG.closeDrawer()">${I.shield}<span style="margin-left:2px">安全设置</span></a>
        <a class="navi" href="#/market" onclick="CG.closeDrawer()">${I.cart}<span style="margin-left:2px">切到采购方视图</span></a>
        <div class="sep"></div>
        <div class="srow"><div class="tx"><b>存储方式</b>
          <span>${CG.store.mode === 'fs' ? '本地服务 · 真实落盘' :
            CG.store.mode === 'idb' ? '浏览器存储' : '临时存储'}</span></div>
          <span class="pill ${CG.store.mode === 'fs' ? 'ok' : 'w'}">${CG.store.mode === 'fs' ? '持久' : '临时'}</span></div>
        <div class="srow"><div class="tx"><b>数据版本</b>
          <span>${CG.state.savedAt ? '保存于 ' + U.dt(CG.state.savedAt) : '尚未保存'}</span></div></div>
      `);
    };

    // 全局搜索
    const qi = document.getElementById('q');
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
      if (e.key === 'Escape') { qi.value = ''; CG.ui.q = ''; CG.render(); qi.blur() }
    });
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); qi.focus(); qi.select();
      }
      if (e.key === 'Escape') { CG.closeModal(); CG.closeDrawer() }
    });

    // 路由
    window.addEventListener('hashchange', () => CG.render());

    // 遮罩关闭
    document.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', () => { CG.closeModal(); CG.closeDrawer() });
    });
  }

  /* ---------------- 后台自动刷新曝光（让宣发数据看起来在动） ---------------- */
  function startTick() {
    setInterval(() => {
      if (document.hidden) return;
      const r = CG.parse();
      if (r.name !== 'promote' && r.name !== 'promoteItem' && r.name !== 'dash') return;
      let changed = false;
      (CG.state.works || []).forEach(w => {
        if (w.marketing && w.marketing.on) {
          const ex = w.marketing.exposure || [];
          if (ex.length) { ex[ex.length - 1] += Math.floor(Math.random() * 3); changed = true }
        }
      });
      if (changed) {
        CG.saveSoon();
        if (r.name === 'promote' || r.name === 'promoteItem') {
          // 只更新数字，避免整页重绘打断输入
        }
      }
    }, 12000);
  }

  /* ---------------- 启动 ---------------- */
  async function boot() {
    initTheme();

    await CG.store.detect();

    let st = await CG.store.load();
    if (!st || !st.works) {
      st = JSON.parse(JSON.stringify(CG.SEED));
    }
    CG.state = st;
    CG.recompute();

    CG.showMode();
    initTop();
    CG.syncBadges();
    CG.render();
    startTick();

    // 首次进入提示
    if (!localStorage.getItem('cg-welcomed')) {
      localStorage.setItem('cg-welcomed', '1');
      setTimeout(() => {
        CG.toast(CG.store.mode === 'fs'
          ? '已连接本地数据站，上传的文件会真实写入电脑文件夹'
          : '浏览器模式：数据存在浏览器里，运行 node server.mjs 可改为真实落盘', 'ok');
      }, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
