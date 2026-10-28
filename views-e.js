/* ==========================================================================
   视图 E：网站主页 / 素材市场 / 市场详情 / 消费者中心 / 选购车 / 订单 / 收藏
   ========================================================================== */
(function () {
  'use strict';
  const CG = window.CG, U = CG.util, I = CG.icon;
  CG.views = CG.views || {};

  /* ---------------- 统一的素材取用（真实作品优先，其次虚拟库） ---------------- */
  CG.asset = function (id) {
    const own = (CG.state && (CG.state.works || []).find(w => w.id === id));
    if (own) return own;
    return CG.virtual.get(id);
  };
  CG.allAssets = function () {
    const own = (CG.state && (CG.state.works || []) || []).filter(w => w.status === 'listed');
    return own.concat(CG.virtual.all());
  };

  const TYPE_LIST = [
    ['video', '视频', '成片、预告、空镜'],
    ['image', '图片', '概念稿、设定集'],
    ['audio', '音频', '配乐、音效库'],
    ['doc', '剧本文档', '剧本、分镜'],
    ['model', '3D 模型', '角色、场景、道具']
  ];
  const SORTS = [['popular', '最热'], ['new', '最新'], ['cheap', '价格低'], ['expensive', '价格高']];
  const PAGE = 24;

  function minPrice(w) {
    const on = (w.licenses || []).filter(l => l.on);
    if (!on.length) return 0;
    return Math.min.apply(null, on.map(l => l.price));
  }
  function statusPill(s) { const p = U.statusPill(s); return `<span class="pill ${p[1]}">${p[0]}</span>` }
  function fmtViews(n) {
    n = Number(n) || 0;
    return n >= 10000 ? (n / 10000).toFixed(1) + ' 万' : String(n);
  }

  /* ---------------- 素材卡片（市场与消费者中心共用） ---------------- */
  function assetCard(w, opt) {
    opt = opt || {};
    const on = (w.licenses || []).filter(l => l.on);
    const p = minPrice(w);
    return `<div class="mkt" data-open="${w.id}">
      <div class="mkt-cover">
        <img src="${U.cover(w)}" alt="${U.esc(w.title)}" loading="lazy">
        <div class="wm">CineGBA</div>
        <div class="lic">${on.slice(0, 3).map(l => `<span>${U.licOf(l.kind).short}</span>`).join('')}</div>
        <button class="fav ${opt.fav ? 'on' : ''}" data-fav="${w.id}" title="收藏">
          <svg viewBox="0 0 24 24"><path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6-8 11-8 11z"/></svg>
        </button>
      </div>
      <div class="mkt-body">
        <b>${U.esc(w.title)}</b>
        <div class="own">${U.esc(w.owner || (CG.state.profile && CG.state.profile.org) || '')}</div>
        <div class="pr"><b>${U.money(p)}</b><span>起</span>
          <span style="margin-left:auto;font-size:10px">${fmtViews(w.stats.views)} 浏览</span></div>
      </div>
    </div>`;
  }

  /* ========================================================== 网站主页 */
  CG.views.home = function () {
    const total = CG.virtual.count();
    const hot = CG.virtual.top(8);
    const picks = CG.virtual.pick(4, 7);
    const counts = {};
    TYPE_LIST.forEach(t => { counts[t[0]] = CG.virtual.byType(t[0]).length });

    return `
    <section class="hm-hero">
      <div class="hm-hero-bg"></div>
      <div class="hm-hero-in">
        <span class="hm-kicker">
          <i class="pulse"></i> ${total.toLocaleString()} 件素材 · 5 种授权类型 · 三路存证
        </span>
        <h1>每一帧素材<br>都该有据可查</h1>
        <p class="hm-lead">
          CineGBA IP-Bridge 把影视动漫素材的指纹、存证与授权合约接到一起。
          创作者在这里登记与定价，采购方在这里找到可商用、可举证的内容。
        </p>

        <div class="hm-search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input id="hmQ" placeholder="搜索素材：国风动画、城市空镜、配乐…">
          <button class="btn pri" id="hmGo">搜索</button>
        </div>
        <div class="hm-chips">
          <span>热门：</span>
          ${['国风', '城市空镜', '赛博朋克', '配乐', '角色模型'].map(t =>
      `<button data-kw="${t}">${t}</button>`).join('')}
        </div>
      </div>
    </section>

    <section class="hm-sec">
      <div class="hm-sec-h">
        <h2>按类型进入</h2>
        <a class="more" href="#/market">全部素材 ${I.arrow}</a>
      </div>
      <div class="hm-types">
        ${TYPE_LIST.map(t => `
          <a class="hm-type" href="#/market?type=${t[0]}" data-typego="${t[0]}">
            <span class="hm-ti">${typeIcon(t[0])}</span>
            <b>${t[1]}</b>
            <em>${counts[t[0]].toLocaleString()} 件</em>
            <span class="hm-td">${t[2]}</span>
          </a>`).join('')}
      </div>
    </section>

    <section class="hm-sec">
      <div class="hm-sec-h">
        <h2>精选合集</h2>
        <p>由编辑按主题挑选，每期更新</p>
      </div>
      <div class="hm-coll">
        <a class="coll big" href="#/market?type=video">
          <img src="${U.cover(picks[0])}" alt="">
          <div class="coll-ov"><b>城市与夜</b><span>都市空镜 · 霓虹色调 · 4K</span></div>
        </a>
        <a class="coll" href="#/market?type=image">
          <img src="${U.cover(picks[1])}" alt="">
          <div class="coll-ov"><b>概念设定</b><span>美术参考 · 设定集</span></div>
        </a>
        <a class="coll" href="#/market?type=audio">
          <img src="${U.cover(picks[2])}" alt="">
          <div class="coll-ov"><b>氛围音景</b><span>配乐 · 环境声</span></div>
        </a>
      </div>
    </section>

    <section class="hm-sec">
      <div class="hm-sec-h">
        <h2>最近热门</h2>
        <a class="more" href="#/market?sort=popular">查看更多 ${I.arrow}</a>
      </div>
      <div class="mktgrid">${hot.map(w => assetCard(w)).join('')}</div>
    </section>

    <section class="hm-sec hm-why">
      <div class="hm-sec-h"><h2>为什么在这里交易</h2></div>
      <div class="hm-why-grid">
        <div class="why">
          <span class="wi">${I.shield}</span>
          <b>三路存证，各说各的效力</b>
          <p>链上存证证明「该时点存在该指纹」，作品自愿登记是法定证书，可信时间戳是辅助证据。
            三条路并列展示，不把任何一条说成万能的。</p>
        </div>
        <div class="why">
          <span class="wi">${I.file}</span>
          <b>授权条款写成商品</b>
          <p>AI 训练、片段引用、改编权、全版权、编辑用途，五种授权各自的范围、期限、
            能否转授权都写在卡片上，点开就能看清。</p>
        </div>
        <div class="why">
          <span class="wi">${I.chart}</span>
          <b>收益可追溯</b>
          <p>每一笔进账都能追到是哪件作品、哪种授权、哪份合约。
            平台按成交额收 12% 佣金，没有隐藏费用。</p>
        </div>
      </div>
    </section>

    <section class="hm-cta">
      <div class="hm-cta-in">
        <h2>把你手上的素材登记进来</h2>
        <p>上传即生成指纹与存证凭证，配置好授权就能进入市场。</p>
        <div class="row" style="justify-content:center;gap:10px">
          <a class="btn pri lg" href="#/upload">${I.up}上传作品</a>
          <a class="btn lg" href="#/consumer">去看消费者中心</a>
        </div>
      </div>
    </section>`;
  };

  function typeIcon(t) {
    return ({
      video: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3z"/></svg>',
      image: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg>',
      audio: '<svg viewBox="0 0 24 24"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>',
      doc: '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 012-2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><path d="M14 3v6h6"/></svg>',
      model: '<svg viewBox="0 0 24 24"><path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 12l9-5M12 12v10M12 12L3 7"/></svg>'
    })[t] || '';
  }
  CG.typeIcon = typeIcon;

  CG.views.home.after = function () {
    const root = document.getElementById('view');
    const q = document.getElementById('hmQ');
    const go = (kw) => {
      CG.ui.q = (kw != null ? kw : (q ? q.value : '')).trim();
      CG.ui.marketPage = 1;
      CG.go('market');
      const g = document.getElementById('q');
      if (g) g.value = CG.ui.q;
    };
    const b = document.getElementById('hmGo');
    if (b) b.onclick = () => go();
    if (q) q.addEventListener('keydown', e => { if (e.key === 'Enter') go() });
    root.querySelectorAll('[data-kw]').forEach(el => el.onclick = () => go(el.dataset.kw));
    root.querySelectorAll('[data-typego]').forEach(el => el.onclick = (e) => {
      e.preventDefault();
      CG.ui.mk.type = [el.dataset.typego];
      CG.ui.marketPage = 1;
      CG.go('market');
    });
    root.querySelectorAll('[data-open]').forEach(el => el.onclick = () => CG.go('market/' + el.dataset.open));
    bindFav(root);
  };

  /* ---------------- 收藏 ---------------- */
  function bindFav(root) {
    root.querySelectorAll('[data-fav]').forEach(el => {
      el.onclick = (ev) => {
        ev.stopPropagation();
        CG.toggleFav(el.dataset.fav);
        el.classList.toggle('on');
      };
    });
  }
  CG.toggleFav = function (id) {
    const st = CG.state;
    st.favorites = st.favorites || [];
    const i = st.favorites.indexOf(id);
    if (i >= 0) { st.favorites.splice(i, 1); CG.toast('已取消收藏') }
    else { st.favorites.push(id); CG.toast('已加入收藏', 'ok') }
    CG.save();
  };

  /* ========================================================== 素材市场 */
  if (!CG.ui.mk) CG.ui.mk = { type: [], lic: [], price: 'all' };
  CG.ui.marketPage = 1;

  CG.views.market = function (args, query) {
    const f = CG.ui.mk, q = CG.ui.q.trim().toLowerCase();
    const sort = CG.ui.marketSort || 'popular';

    // 合并真实在售 + 虚拟库
    let list = CG.allAssets();

    if (f.type.length) list = list.filter(w => f.type.indexOf(w.type) >= 0);
    if (f.lic.length) list = list.filter(w => (w.licenses || []).some(l => l.on && f.lic.indexOf(l.kind) >= 0));
    if (f.price !== 'all') {
      list = list.filter(w => {
        const p = minPrice(w);
        return f.price === 'low' ? p < 100
          : f.price === 'mid' ? (p >= 100 && p < 1000)
            : f.price === 'high' ? p >= 1000 : true;
      });
    }
    if (q) {
      list = list.filter(w =>
        (w.title + ' ' + (w.series || '') + ' ' + (w.tags || []).join(' ') + ' ' + (w.owner || '')).toLowerCase().indexOf(q) >= 0);
    }

    const sorters = {
      popular: (a, b) => (b.stats.views || 0) - (a.stats.views || 0),
      new: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
      cheap: (a, b) => minPrice(a) - minPrice(b),
      expensive: (a, b) => minPrice(b) - minPrice(a)
    };
    list.sort(sorters[sort] || sorters.popular);

    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / PAGE));
    let page = Math.min(Math.max(1, CG.ui.marketPage || 1), pages);
    CG.ui.marketPage = page;
    const slice = list.slice((page - 1) * PAGE, page * PAGE);

    // 侧栏计数
    const typeCnt = {}, licCnt = {};
    CG.allAssets().forEach(w => {
      typeCnt[w.type] = (typeCnt[w.type] || 0) + 1;
      (w.licenses || []).filter(l => l.on).forEach(l => { licCnt[l.kind] = (licCnt[l.kind] || 0) + 1 });
    });

    const fg = (title, key, items, cnt) => `
      <div class="fgroup"><h4>${title}</h4>
        ${items.map(it => `<label>
          <input type="checkbox" ${f[key].indexOf(it[0]) >= 0 ? 'checked' : ''} data-fg="${key}" value="${it[0]}">
          <span>${it[1]}</span>
          ${cnt ? `<span class="cnt">${(cnt[it[0]] || 0).toLocaleString()}</span>` : ''}
        </label>`).join('')}
      </div>`;

    const pageNav = pages > 1 ? `
      <div class="pager">
        <button class="btn sm" data-pg="${page - 1}" ${page <= 1 ? 'disabled' : ''}>上一页</button>
        <span class="pg-info">第 <b>${page}</b> / ${pages} 页 · 共 ${total.toLocaleString()} 件</span>
        <button class="btn sm" data-pg="${page + 1}" ${page >= pages ? 'disabled' : ''}>下一页</button>
      </div>` : '';

    return `
    <div class="ph">
      <div><h1>素材市场</h1>
        <p>${total.toLocaleString()} 件可采购素材 · 预览带水印 · 采购后交付无水印原件</p></div>
      <div class="ph-r">
        <div class="seg">
          ${SORTS.map(s => `<button class="${sort === s[0] ? 'on' : ''}" data-sort="${s[0]}">${s[1]}</button>`).join('')}
        </div>
      </div>
    </div>

    ${q ? `<div class="row mb12"><span class="pill c">「${U.esc(CG.ui.q)}」
      <button data-act="clrq" style="margin-left:6px;color:inherit">×</button></span></div>` : ''}

    <div class="mkt-wrap">
      <aside class="mkt-side">
        ${fg('类型', 'type', TYPE_LIST.map(t => [t[0], t[1]]), typeCnt)}
        ${fg('授权方式', 'lic', [
      ['ai-training', 'AI 训练'], ['clip', '片段引用'], ['adaptation', '改编权'],
      ['full', '全版权'], ['editorial', '编辑用途']
    ], licCnt)}
        <div class="fgroup"><h4>价格</h4>
          ${[['all', '全部'], ['low', '100 元以下'], ['mid', '100 – 1000 元'], ['high', '1000 元以上']]
        .map(p => `<label><input type="radio" name="pz" ${f.price === p[0] ? 'checked' : ''}
          data-price="${p[0]}"><span>${p[1]}</span></label>`).join('')}
        </div>
        <button class="btn sm wide" data-act="clrf">清空筛选</button>
      </aside>

      <div>
        ${slice.length ? `<div class="mktgrid">${slice.map(w => assetCard(w)).join('')}</div>`
        : `<div class="empty">${I.empty}<b>没有匹配的素材</b>
           <p>换关键词，或清空筛选看全部 5000 件</p>
           <button class="btn" data-act="clrf">清空筛选</button></div>`}
        ${pageNav}
      </div>
    </div>`;
  };

  CG.views.market.after = function () {
    const root = document.getElementById('view'), f = CG.ui.mk;
    root.querySelectorAll('[data-act]').forEach(el => {
      const a = el.dataset.act;
      if (a === 'clrq') el.onclick = () => {
        CG.ui.q = ''; const g = document.getElementById('q'); if (g) g.value = '';
        CG.ui.marketPage = 1; CG.render();
      };
      if (a === 'clrf') el.onclick = () => {
        f.type = []; f.lic = []; f.price = 'all'; CG.ui.marketPage = 1; CG.render();
      };
    });
    root.querySelectorAll('[data-open]').forEach(el => el.onclick = () => CG.go('market/' + el.dataset.open));
    root.querySelectorAll('[data-sort]').forEach(el => el.onclick = () => {
      CG.ui.marketSort = el.dataset.sort; CG.ui.marketPage = 1; CG.render();
    });
    root.querySelectorAll('[data-pg]').forEach(el => el.onclick = () => {
      CG.ui.marketPage = Number(el.dataset.pg);
      CG.render();
      document.getElementById('main').scrollTop = 0;
    });
    root.querySelectorAll('[data-fg]').forEach(el => el.onchange = () => {
      const arr = f[el.dataset.fg];
      if (el.checked) { if (arr.indexOf(el.value) < 0) arr.push(el.value) }
      else { const i = arr.indexOf(el.value); if (i >= 0) arr.splice(i, 1) }
      CG.ui.marketPage = 1; CG.render();
    });
    root.querySelectorAll('[data-price]').forEach(el => el.onchange = () => {
      f.price = el.dataset.price; CG.ui.marketPage = 1; CG.render();
    });
    bindFav(root);
  };

  /* ========================================================== 市场详情 */
  CG.views.marketItem = function (args) {
    const id = args[0];
    const w = CG.asset(id);
    if (!w) return `<div class="empty">${I.empty}<b>素材不存在</b>
      <a class="btn" href="#/market">回市场</a></div>`;
    if (!w.virtual && w.status !== 'listed') {
      return `<div class="empty">${I.empty}<b>该素材当前不可采购</b>
        <p>可能已下架或未配置授权</p><a class="btn" href="#/market">回市场</a></div>`;
    }
    const on = (w.licenses || []).filter(l => l.on);
    const owner = w.owner || (CG.state.profile && CG.state.profile.org) || '';
    const sim = CG.virtual.pick(4, w.id.length * 31 + w.title.length, w.type);

    return `
    <div class="crumb"><a href="#/market">素材市场</a> / <span>${U.esc(w.type ? U.typeOf(w.type) : '')}</span> / <span>${U.esc(w.title)}</span></div>

    <div class="dt-wrap">
      <div class="dt-left">
        <div class="dt-stage">
          <img src="${U.cover(w)}" alt="${U.esc(w.title)}">
          <div class="wm">CineGBA PREVIEW</div>
          <div class="dt-stage-bar">
            <span class="pill ${w.virtual ? 'm' : 'ok'}">${w.virtual ? '虚拟素材' : '本机上架'}</span>
            <span class="hint">预览为带水印版本，采购后交付无水印原件</span>
          </div>
        </div>

        <div class="card mt12">
          <div class="card-h"><h3>素材说明</h3></div>
          <p class="small" style="color:var(--ink-2);line-height:1.75">${U.esc(w.desc || '—')}</p>
          <div class="fgrid mt12">
            <div><div class="hint">类型</div><b class="small">${U.typeOf(w.type)}</b></div>
            <div><div class="hint">系列</div><b class="small">${U.esc(w.series || '—')}</b></div>
            <div><div class="hint">入库时间</div><b class="small">${U.date(w.createdAt)}</b></div>
            <div><div class="hint">存证</div><b class="small">${w.evidence && w.evidence.chain && w.evidence.chain.on ? '已链上存证' : '—'}</b></div>
          </div>
          <div class="mt8">${(w.tags || []).map(t => `<span class="pill m">${U.esc(t)}</span>`).join(' ')}</div>
        </div>

        <div class="card mt12">
          <div class="card-h"><h3>相似素材</h3><a class="more" href="#/market">更多 ${I.arrow}</a></div>
          <div class="mktgrid sim">${sim.map(x => assetCard(x)).join('')}</div>
        </div>
      </div>

      <aside class="dt-right">
        <div class="card">
          <div class="card-h"><h3>选择授权</h3></div>
          ${on.length ? on.map((l, i) => {
      const k = U.licOf(l.kind);
      return `<div class="liccard ${i === 0 ? 'on' : ''}" data-pick="${l.id}">
              <div class="lc-h"><b>${U.esc(k.label)}</b><span class="pr">${U.money(l.price)}</span></div>
              <p>${U.esc(k.desc)}</p>
              <div class="lc-f"><span>${U.esc(l.region)}</span>
                <span>${l.term >= 999 ? '永久' : l.term + ' 个月'}</span>
                <span>${l.resell ? '可转授权' : '不可转授权'}</span></div>
            </div>`;
    }).join('') : '<p class="hint">该素材暂未开放授权。</p>'}

          <div class="dt-buy">
            <button class="btn pri wide lg" data-act="addcart" ${on.length ? '' : 'disabled'}>
              ${I.cart}加入选购车</button>
            <button class="btn wide mt8" data-act="inquiry" ${on.length ? '' : 'disabled'}>
              询价谈条款</button>
            <div class="buy-hint">
              <b>怎么选：</b>标价是标准授权价，条款合适就直接下单；
              要改使用范围、期限或价格，走「询价谈条款」，由版权方回签后生成合约。
            </div>
          </div>
          <div class="note c mt12">${I.info}<div>平台按成交额收 <b>12%</b> 佣金。
            虚拟素材为演示数据，采购流程与真实素材一致。</div></div>
        </div>

        <div class="card mt12">
          <div class="card-h"><h3>权利方</h3></div>
          <div class="srow">
            <div class="avatar" style="width:34px;height:34px;font-size:12px">${U.esc(String(owner).slice(0, 1))}</div>
            <div class="tx"><b>${U.esc(owner)}</b>
              <span>${w.virtual ? '平台入驻创作者（演示）' : '已通过企业认证'}</span></div>
            <span class="pill ok">可信</span>
          </div>
          <div class="hint mt8">采购后可获得：授权书、存证凭证、结算凭证。</div>
        </div>
      </aside>
    </div>`;
  };

  CG.views.marketItem.after = function (args) {
    const w = CG.asset(args[0]); if (!w) return;
    const root = document.getElementById('view');
    const cards = Array.from(root.querySelectorAll('[data-pick]'));
    let picked = cards.length ? cards[0].dataset.pick : null;
    cards.forEach(c => c.onclick = () => {
      cards.forEach(x => x.classList.remove('on'));
      c.classList.add('on'); picked = c.dataset.pick;
    });

    const licOf = () => (w.licenses || []).find(l => l.id === picked);

    root.querySelectorAll('[data-open]').forEach(el => el.onclick = () => CG.go('market/' + el.dataset.open));
    bindFav(root);

    root.querySelectorAll('[data-act]').forEach(el => {
      const a = el.dataset.act;
      if (a === 'addcart') el.onclick = () => {
        const l = licOf(); if (!l) return CG.toast('先选一种授权', 'err');
        CG.addCart(w.id, l.id);
      };
      if (a === 'inquiry') el.onclick = () => {
        const l = licOf(); if (!l) return CG.toast('先选一种授权', 'err');
        CG.inquiry(w, l, null);
      };
    });
  };

  /* ========================================================== 消费者中心 */
  CG.views.consumer = function () {
    const st = CG.state;
    const cart = st.cart || [];
    const orders = st.orders || [];
    const favs = (st.favorites || []).map(id => CG.asset(id)).filter(Boolean);
    const pending = orders.filter(o => o.status === 'pending');
    CG.ui.picksSeed = CG.ui.picksSeed || 20261028;
    const picks = CG.virtual.pick(8, CG.ui.picksSeed);

    return `
    <section class="cs-hero">
      <div class="cs-hero-in">
        <div class="cs-user">
          <div class="avatar big">${U.esc((st.profile.name || '?').slice(0, 1))}</div>
          <div>
            <h2>${U.esc(st.profile.name)}，欢迎回来</h2>
            <p>${U.esc(st.profile.org)} · ${U.esc(st.profile.verifyLevel || '')}</p>
          </div>
        </div>
        <div class="cs-stats">
          <div><b>${cart.length}</b><span>选购车</span></div>
          <div><b>${pending.length}</b><span>待付款</span></div>
          <div><b>${orders.length}</b><span>全部订单</span></div>
          <div><b>${favs.length}</b><span>收藏</span></div>
        </div>
      </div>
    </section>

    <section class="cs-quick">
      <a class="qk2" href="#/cart">${I.cart}<b>选购车</b><span>${cart.length} 件待结算</span></a>
      <a class="qk2" href="#/orders">${I.file}<b>我的订单</b><span>${orders.length} 笔</span></a>
      <a class="qk2" href="#/favorites">${I.shield}<b>我的收藏</b><span>${favs.length} 件</span></a>
      <a class="qk2" href="#/market">${I.chart}<b>继续逛市场</b><span>5000 件素材</span></a>
    </section>

    <section class="cs-sec">
      <div class="cs-sec-h">
        <h2>猜你喜欢</h2>
        <button class="more" data-act="reshuffle">换一批 ${I.arrow}</button>
      </div>
      <div class="mktgrid">${picks.map(w => assetCard(w)).join('')}</div>
    </section>

    <section class="cs-sec">
      <div class="cs-sec-h"><h2>按分类逛</h2></div>
      <div class="cs-cats">
        ${TYPE_LIST.map(t => `<a class="cs-cat" href="#/market" data-typego="${t[0]}">
          <span>${typeIcon(t[0])}</span><b>${t[1]}</b>
          <em>${CG.virtual.byType(t[0]).length} 件</em></a>`).join('')}
      </div>
    </section>

    ${favs.length ? `
    <section class="cs-sec">
      <div class="cs-sec-h"><h2>最近收藏</h2><a class="more" href="#/favorites">全部 ${I.arrow}</a></div>
      <div class="mktgrid">${favs.slice(0, 4).map(w => assetCard(w, { fav: true })).join('')}</div>
    </section>` : ''}`;
  };

  CG.views.consumer.after = function () {
    const root = document.getElementById('view');
    const rs = root.querySelector('[data-act="reshuffle"]');
    if (rs) rs.onclick = () => {
      CG.ui.picksSeed = (CG.ui.picksSeed || 20261028) + 7919;
      CG.render();
    };
    root.querySelectorAll('[data-open]').forEach(el => el.onclick = () => CG.go('market/' + el.dataset.open));
    root.querySelectorAll('[data-typego]').forEach(el => el.onclick = (e) => {
      e.preventDefault();
      CG.ui.mk.type = [el.dataset.typego];
      CG.ui.marketPage = 1;
      CG.go('market');
    });
    bindFav(root);
  };

  /* ========================================================== 选购车 */
  CG.views.cart = function () {
    const st = CG.state;
    const cart = st.cart || [];
    let total = 0;
    const rows = cart.map((it, i) => {
      const w = CG.asset(it.workId);
      if (!w) return '';
      const l = (w.licenses || []).find(x => x.id === it.licId) || { price: it.price, kind: it.kind };
      const amount = l.price * (it.qty || 1);
      total += amount;
      return `<div class="ct-row">
        <label class="ct-check"><input type="checkbox" class="ct-sel" data-i="${i}" checked></label>
        <img class="ct-thumb" src="${U.cover(w)}" alt="">
        <div class="ct-info">
          <a class="ct-title" href="#/market/${w.id}">${U.esc(w.title)}</a>
          <div class="hint">${U.esc(w.owner || '')} · ${U.typeOf(w.type)}</div>
          <div class="ct-lic"><span class="pill ${U.licOf(l.kind).pill}">${U.licOf(l.kind).label}</span>
            <span class="hint">${U.esc(l.region || '')} · ${(l.term >= 999 ? '永久' : (l.term || 12) + ' 个月')}</span></div>
        </div>
        <div class="ct-qty">
          <button class="btn xs" data-q="-1" data-i="${i}">−</button>
          <span>${it.qty || 1}</span>
          <button class="btn xs" data-q="1" data-i="${i}">+</button>
        </div>
        <div class="ct-price">${U.money(amount)}</div>
        <button class="iconbtn" data-del="${i}" title="移除">${I.trash}</button>
      </div>`;
    }).join('');

    return `
    <div class="ph">
      <div><h1>选购车</h1><p>${cart.length} 件素材待结算</p></div>
      <div class="ph-r"><a class="btn" href="#/market">继续挑选</a></div>
    </div>

    ${cart.length ? `
    <div class="card">
      <div class="card-h"><h3>已选素材</h3>
        <button class="more" data-act="clear">清空选购车</button></div>
      <div class="ct-head">
        <span></span><span>素材</span><span>数量</span><span>小计</span><span></span>
      </div>
      ${rows}
      <div class="ct-foot">
        <div class="ct-sum">
          <span>合计</span>
          <b id="ctTotal">${U.money(total)}</b>
        </div>
        <div class="hint">平台佣金 12% 已含在成交价内，结算时从版权方收益中扣除</div>
        <button class="btn pri lg" data-act="checkout">去结算</button>
      </div>
    </div>` : `
    <div class="empty">${I.cart}<b>选购车是空的</b>
      <p>去素材市场挑几件，加入选购车后再一起结算</p>
      <a class="btn pri" href="#/market">去市场</a></div>`}`;
  };

  CG.views.cart.after = function () {
    const root = document.getElementById('view');
    const st = CG.state;
    const recount = () => {
      let t = 0;
      root.querySelectorAll('.ct-sel').forEach((cb, i) => {
        const it = st.cart[Number(cb.dataset.i)];
        if (!it || !cb.checked) return;
        const w = CG.asset(it.workId);
        const l = w && (w.licenses || []).find(x => x.id === it.licId);
        t += (l ? l.price : it.price) * (it.qty || 1);
      });
      const el = document.getElementById('ctTotal');
      if (el) el.textContent = U.money(t);
      return t;
    };
    root.querySelectorAll('.ct-sel').forEach(cb => cb.onchange = recount);
    root.querySelectorAll('[data-q]').forEach(el => el.onclick = () => {
      const it = st.cart[Number(el.dataset.i)];
      if (!it) return;
      it.qty = Math.max(1, (it.qty || 1) + Number(el.dataset.q));
      CG.save(); CG.render();
    });
    root.querySelectorAll('[data-del]').forEach(el => el.onclick = () => {
      st.cart.splice(Number(el.dataset.del), 1);
      CG.save(); CG.syncBadges(); CG.render(); CG.toast('已移除');
    });
    root.querySelectorAll('[data-act]').forEach(el => {
      const a = el.dataset.act;
      if (a === 'clear') el.onclick = () => CG.confirm('清空选购车', '所有已选素材会被移除。', () => {
        st.cart = []; CG.save(); CG.syncBadges(); CG.render();
      }, '清空');
      if (a === 'checkout') el.onclick = () => {
        const sel = Array.from(root.querySelectorAll('.ct-sel')).filter(cb => cb.checked);
        if (!sel.length) return CG.toast('至少要选一件素材', 'err');
        const items = sel.map(cb => st.cart[Number(cb.dataset.i)]).filter(Boolean);
        CG.checkout(items);
      };
    });
  };

  /* ---------------- 结算 ---------------- */
  CG.checkout = function (items) {
    let total = 0;
    items.forEach(it => {
      const w = CG.asset(it.workId);
      const l = w && (w.licenses || []).find(x => x.id === it.licId);
      total += (l ? l.price : it.price) * (it.qty || 1);
    });
    CG.modal(`
      <div style="padding:18px 20px">
        <div class="card-h"><h3>确认结算</h3></div>
        <div class="srow"><div class="tx"><b>${items.length} 件素材</b>
          <span>成交后生成授权订单与存证凭证</span></div>
          <b style="color:var(--gold);font-family:var(--fm);font-size:15px">${U.money(total)}</b></div>
        <div class="fgrid mt12">
          <div class="fld full"><label>采购方名称 <i>*</i></label>
            <input id="ckName" value="${U.esc((CG.state.profile.org || '') + '（采购）')}"></div>
          <div class="fld full"><label>用途说明</label>
            <textarea id="ckNote" rows="2" placeholder="例如：用于某项目的美术参考与模型训练"></textarea></div>
        </div>
        <div class="note w mt12">${I.warn}<div>原型环境不产生真实付款。
          确认后会生成订单并写入你的订单列表。</div></div>
        <div class="row mt16" style="justify-content:flex-end">
          <button class="btn" data-close>取消</button>
          <button class="btn pri" id="ckGo">确认下单 ${U.money(total)}</button>
        </div>
      </div>`, {
      onMount(panel, close) {
        panel.querySelector('#ckGo').onclick = () => {
          const nm = panel.querySelector('#ckName').value.trim();
          if (!nm) return CG.toast('请填写采购方名称', 'err');
          const st = CG.state;
          st.orders = st.orders || [];
          const order = {
            id: 'OD-' + Date.now().toString(36).toUpperCase().slice(-6),
            at: U.now(), buyer: nm,
            note: panel.querySelector('#ckNote').value.trim(),
            status: 'pending', total,
            items: items.map(it => {
              const w = CG.asset(it.workId);
              const l = w && (w.licenses || []).find(x => x.id === it.licId);
              return {
                workId: it.workId, title: w ? w.title : '(已删除)',
                kind: l ? l.kind : it.kind, price: l ? l.price : it.price,
                qty: it.qty || 1, owner: w ? (w.owner || '') : ''
              };
            })
          };
          st.orders.unshift(order);
          st.cart = (st.cart || []).filter(c => items.indexOf(c) < 0);
          st.notices = st.notices || [];
          st.notices.unshift({
            id: U.uid('N'), type: 'lead', at: U.now(),
            title: '新订单 ' + order.id,
            body: nm + ' 采购 ' + items.length + ' 件素材，总额 ' + U.money(total) + '。'
          });
          CG.save(); CG.syncBadges(); close();
          CG.toast('下单成功，订单已生成', 'ok');
          CG.go('orders');
        };
      }
    });
  };

  /* ========================================================== 订单 */
  CG.views.orders = function () {
    const orders = (CG.state.orders || []);
    return `
    <div class="ph">
      <div><h1>我的订单</h1><p>${orders.length} 笔 · 授权订单可下载授权书与存证凭证</p></div>
      <div class="ph-r"><a class="btn" href="#/market">继续采购</a></div>
    </div>
    ${orders.length ? orders.map(o => `
      <div class="card mb12">
        <div class="card-h">
          <h3>${U.esc(o.id)}</h3>
          <span class="pill ${o.status === 'pending' ? 'w' : o.status === 'paid' ? 'c' : 'ok'}">
            ${o.status === 'pending' ? '待付款' : o.status === 'paid' ? '已付款' : '已完成'}</span>
          <span class="more">${U.dt(o.at)}</span>
        </div>
        <div class="od-items">
          ${o.items.map(it => `
            <div class="od-i">
              <img src="${U.cover(CG.asset(it.workId) || { id: it.workId, type: 'image' })}" alt="">
              <div class="od-tx">
                <a href="#/market/${it.workId}">${U.esc(it.title)}</a>
                <span class="hint">${U.licOf(it.kind).label} · ×${it.qty}</span>
              </div>
              <b class="od-p">${U.money(it.price * it.qty)}</b>
            </div>`).join('')}
        </div>
        <div class="od-foot">
          <div class="hint">采购方：${U.esc(o.buyer)}${o.note ? ' · ' + U.esc(o.note) : ''}</div>
          <div class="row">
            <b class="od-total">${U.money(o.total)}</b>
            ${o.status === 'pending'
          ? `<button class="btn sm pri" data-pay="${o.id}">模拟付款</button>`
          : `<button class="btn sm" data-cert="${o.id}">下载授权书</button>`}
          </div>
        </div>
      </div>`).join('') : `
      <div class="empty">${I.file}<b>还没有订单</b>
        <p>在素材市场加入选购车并结算后，订单会出现在这里</p>
        <a class="btn pri" href="#/market">去市场</a></div>`}`;
  };

  CG.views.orders.after = function () {
    const root = document.getElementById('view');
    const st = CG.state;
    root.querySelectorAll('[data-pay]').forEach(el => el.onclick = () => {
      const o = st.orders.find(x => x.id === el.dataset.pay);
      if (!o) return;
      o.status = 'paid'; CG.save(); CG.render(); CG.toast('付款完成（模拟）', 'ok');
    });
    root.querySelectorAll('[data-cert]').forEach(el => el.onclick = () => {
      const o = st.orders.find(x => x.id === el.dataset.cert);
      if (!o) return;
      const txt = ['CineGBA 授权书（演示）', '订单：' + o.id, '采购方：' + o.buyer,
        '时间：' + o.at, '总额：' + U.money(o.total), '',
        ...o.items.map(it => `· ${it.title} ｜ ${U.licOf(it.kind).label} ｜ ${U.money(it.price)} × ${it.qty}`),
        '', '本文件为课程原型演示内容，不构成真实授权。'].join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }));
      a.download = '授权书_' + o.id + '.txt';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      CG.toast('授权书已下载（演示）', 'ok');
    });
  };

  /* ========================================================== 收藏 */
  CG.views.favorites = function () {
    const ids = CG.state.favorites || [];
    const list = ids.map(id => CG.asset(id)).filter(Boolean);
    return `
    <div class="ph">
      <div><h1>我的收藏</h1><p>${list.length} 件素材</p></div>
      <div class="ph-r"><a class="btn" href="#/market">去市场</a></div>
    </div>
    ${list.length ? `<div class="mktgrid">${list.map(w => assetCard(w, { fav: true })).join('')}</div>`
        : `<div class="empty">${I.shield}<b>还没有收藏</b>
           <p>在素材卡片右上角点心形图标即可收藏</p>
           <a class="btn pri" href="#/market">去市场</a></div>`}`;
  };
  CG.views.favorites.after = function () {
    const root = document.getElementById('view');
    root.querySelectorAll('[data-open]').forEach(el => el.onclick = () => CG.go('market/' + el.dataset.open));
    root.querySelectorAll('[data-fav]').forEach(el => el.onclick = (ev) => {
      ev.stopPropagation();
      CG.toggleFav(el.dataset.fav);
      CG.render();
    });
  };

  /* ========================================================== 选购车操作 */
  CG.addCart = function (workId, licId, qty) {
    const st = CG.state;
    st.cart = st.cart || [];
    const w = CG.asset(workId);
    const l = w && (w.licenses || []).find(x => x.id === licId);
    if (!l) return CG.toast('授权不存在', 'err');
    const hit = st.cart.find(c => c.workId === workId && c.licId === licId);
    if (hit) { hit.qty = (hit.qty || 1) + (qty || 1) }
    else {
      st.cart.push({ workId, licId, kind: l.kind, price: l.price, qty: qty || 1 });
    }
    CG.save(); CG.syncBadges();
    CG.toast('已加入选购车', 'ok');
  };

  /* ---------------- 询价（复用） ---------------- */
  CG.inquiry = function (w, l, after) {
    const k = U.licOf(l.kind);
    CG.modal(`
      <div style="padding:18px 20px">
        <div class="card-h"><h3>提交采购询价</h3></div>
        <div class="srow"><div class="tx"><b>${U.esc(w.title)}</b>
          <span>${U.esc(k.label)} · ${U.money(l.price)}</span></div></div>
        <div class="fgrid mt12">
          <div class="fld full"><label>采购方名称 <i>*</i></label>
            <input id="iqName" placeholder="公司或机构名称" value="${U.esc((CG.state.profile.org || '') + '（询价）')}"></div>
          <div class="fld full"><label>使用场景说明</label>
            <textarea id="iqNote" rows="2" placeholder="例如：用于某模型的图像训练，仅内部评测"></textarea></div>
        </div>
        <div class="note c mt12">${I.info}<div>提交后版权方会在工作台看到这条询价。
          若为虚拟素材，会记录在询价列表中供演示。</div></div>
        <div class="row mt16" style="justify-content:flex-end">
          <button class="btn" data-close>取消</button>
          <button class="btn pri" id="iqGo">提交询价</button>
        </div>
      </div>`, {
      onMount(panel, close) {
        panel.querySelector('#iqGo').onclick = () => {
          const nm = panel.querySelector('#iqName').value.trim();
          if (!nm) return CG.toast('请填写采购方名称', 'err');
          const st = CG.state;
          st.leads.unshift({
            id: U.uid('L'), workId: w.id, licensee: nm,
            kind: l.kind, price: l.price, status: 'pending', at: U.now(),
            note: panel.querySelector('#iqNote').value.trim() || '通过市场提交'
          });
          if (w.stats) { w.stats.inquiries = (w.stats.inquiries || 0) + 1 }
          st.notices.unshift({
            id: U.uid('N'), type: 'lead', at: U.now(),
            title: '新询价：' + w.title,
            body: nm + ' 询价「' + U.licOf(l.kind).label + '」，等待回签。'
          });
          CG.save(); CG.syncBadges(); close();
          CG.toast('询价已提交', 'ok');
          if (after) after();
        };
      }
    });
  };

})();
