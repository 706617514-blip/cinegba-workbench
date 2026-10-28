/* ==========================================================================
   视图 C：素材市场 / 宣发 / 收入 / 维权 / 设置
   ========================================================================== */
(function () {
  'use strict';
  const CG = window.CG, U = CG.util, I = CG.icon;
  CG.views = CG.views || {};

  function pill(s) { const p = U.statusPill(s); return `<span class="pill ${p[1]}">${p[0]}</span>` }
  const CH_LABEL = { market: '素材市场推荐位', homepage: '平台首页 Banner', hktdc: 'FILMART 专区' };

  /* ========================================================== 素材市场 */
  if (!CG.ui.mkt) CG.ui.mkt = { types: [], lics: [], price: 'all' };

  CG.views.market = function () {
    const st = CG.state, f = CG.ui.mkt, q = CG.ui.q.trim();
    let list = st.works.filter(w => w.status === 'listed' && (w.licenses || []).some(l => l.on));

    if (f.types.length) list = list.filter(w => f.types.indexOf(w.type) >= 0);
    if (f.lics.length) list = list.filter(w => (w.licenses || []).some(l => l.on && f.lics.indexOf(l.kind) >= 0));
    if (f.price !== 'all') list = list.filter(w => {
      const p = Math.min.apply(null, (w.licenses || []).filter(l => l.on).map(l => l.price));
      return f.price === 'low' ? p < 200 : f.price === 'mid' ? (p >= 200 && p < 5000) : p >= 5000;
    });
    if (q) {
      const k = q.toLowerCase();
      list = list.filter(w => (w.title + ' ' + (w.series || '') + ' ' + (w.tags || []).join(' ')).toLowerCase().includes(k));
    }
    if (CG.ui.mktSort === 'popular') list.sort((a, b) => (b.stats.views || 0) - (a.stats.views || 0));
    else if (CG.ui.mktSort === 'cheap') list.sort((a, b) =>
      Math.min.apply(null, a.licenses.filter(l => l.on).map(l => l.price)) -
      Math.min.apply(null, b.licenses.filter(l => l.on).map(l => l.price)));
    else if (CG.ui.mktSort === 'new') list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    const typeCnt = {}, licCnt = {};
    st.works.filter(w => w.status === 'listed').forEach(w => {
      typeCnt[w.type] = (typeCnt[w.type] || 0) + 1;
      (w.licenses || []).filter(l => l.on).forEach(l => { licCnt[l.kind] = (licCnt[l.kind] || 0) + 1 });
    });

    const cards = list.map(w => {
      const on = (w.licenses || []).filter(l => l.on);
      const minP = Math.min.apply(null, on.map(l => l.price));
      return `<div class="mkt" data-open="${w.id}">
        <div class="mkt-cover">
          <img src="${U.cover(w)}" alt="${U.esc(w.title)}" loading="lazy">
          <div class="wm">CineGBA</div>
          <div class="lic">${on.slice(0, 3).map(l => `<span>${U.licOf(l.kind).short}</span>`).join('')}</div>
        </div>
        <div class="mkt-body">
          <b>${U.esc(w.title)}</b>
          <div class="own">${U.esc(st.profile.org)}</div>
          <div class="pr"><b>${U.money(minP)}</b><span>起</span>
            <span style="margin-left:auto;font-size:10px">浏览 ${(w.stats.views || 0).toLocaleString()}</span></div>
        </div>
      </div>`;
    }).join('');

    const fg = (title, key, items, cntKey) => `
      <div class="fgroup"><h4>${title}</h4>
        ${items.map(it => `<label>
          <input type="checkbox" ${f[key].indexOf(it[0]) >= 0 ? 'checked' : ''} data-fg="${key}" value="${it[0]}">
          <span>${it[1]}</span>
          ${cntKey ? `<span class="cnt">${cntKey[it[0]] || 0}</span>` : ''}
        </label>`).join('')}
      </div>`;

    return `
    <div class="ph">
      <div><h1>素材市场</h1><p>采购方视角 · ${list.length} 件可采购作品 ·
        所有预览带水印，采购后交付无水印原件</p></div>
      <div class="ph-r">
        <div class="seg">
          <button class="${CG.ui.mktSort === 'popular' ? 'on' : ''}" data-msort="popular">最热</button>
          <button class="${CG.ui.mktSort === 'new' ? 'on' : ''}" data-msort="new">最新</button>
          <button class="${CG.ui.mktSort === 'cheap' ? 'on' : ''}" data-msort="cheap">价格低</button>
        </div>
      </div>
    </div>

    ${q ? `<div class="row mb12"><span class="pill c">搜索：${U.esc(q)}
      <a href="#" data-act="clrq" style="margin-left:5px">×</a></span></div>` : ''}

    <div class="mkt-wrap">
      <aside class="mkt-side">
        ${fg('类型', 'types', [['video', '视频'], ['image', '图片'], ['audio', '音频'], ['model', '3D 模型'], ['doc', '剧本']], typeCnt)}
        ${fg('授权方式', 'lics', [
      ['ai-training', 'AI 训练'], ['clip', '片段引用'], ['adaptation', '改编权'], ['full', '全版权'], ['editorial', '编辑用途']
    ], licCnt)}
        <div class="fgroup"><h4>价格</h4>
          ${[['all', '全部'], ['low', '200 元以下'], ['mid', '200 – 5000 元'], ['high', '5000 元以上']]
        .map(p => `<label><input type="radio" name="pz" ${f.price === p[0] ? 'checked' : ''}
              data-price="${p[0]}"><span>${p[1]}</span></label>`).join('')}
        </div>
        <button class="btn sm wide" data-act="clrf">清空筛选</button>
      </aside>

      <div>
        ${list.length ? `<div class="mktgrid">${cards}</div>`
        : `<div class="empty">${CG.emptyArt('search')}<b>没有匹配的作品</b>
           <p>调整左侧筛选条件，或清空筛选看全部</p>
           <button class="btn" data-act="clrf">清空筛选</button></div>`}
      </div>
    </div>`;
  };

  CG.views.market.after = function () {
    const root = document.getElementById('view'), f = CG.ui.mkt;
    CG.bind(root, {
      clrq: () => { CG.ui.q = ''; const i = document.getElementById('q'); if (i) i.value = ''; CG.render() },
      clrf: () => { f.types = []; f.lics = []; f.price = 'all'; CG.render() }
    });
    U.qsa('[data-open]', root).forEach(el => el.onclick = () => CG.go('market/' + el.dataset.open));
    U.qsa('[data-msort]', root).forEach(el => el.onclick = () => { CG.ui.mktSort = el.dataset.msort; CG.render() });
    U.qsa('[data-fg]', root).forEach(el => el.onchange = () => {
      const arr = f[el.dataset.fg];
      if (el.checked) { if (arr.indexOf(el.value) < 0) arr.push(el.value) }
      else { const i = arr.indexOf(el.value); if (i >= 0) arr.splice(i, 1) }
      CG.render();
    });
    U.qsa('[data-price]', root).forEach(el => el.onchange = () => { f.price = el.dataset.price; CG.render() });
  };

  /* ========================================================== 宣发中心 */
  CG.views.promote = function () {
    const st = CG.state;
    const list = st.works.slice();
    const on = list.filter(w => w.marketing && w.marketing.on);
    const totalEx = list.reduce((s, w) => s + ((w.marketing.exposure || []).reduce((a, b) => a + b, 0)), 0);
    const totalViews = list.reduce((s, w) => s + (w.stats.views || 0), 0);

    return `
    <div class="ph">
      <div><h1>宣发中心</h1><p>把作品推到采购方看得见的位置，生成可直接发的物料</p></div>
      <div class="ph-r"><a class="btn pri" href="#/library">${I.plus}选择作品</a></div>
    </div>

    <div class="kpis">
      <div class="kpi cy"><div class="lb">在推作品</div><div class="vl">${on.length}</div>
        <div class="dl">共 ${list.length} 件作品</div></div>
      <div class="kpi"><div class="lb">累计曝光</div><div class="vl">${totalEx.toLocaleString()}</div>
        <div class="dl">近 12 天滚动统计</div></div>
      <div class="kpi gold"><div class="lb">市场浏览</div><div class="vl">${totalViews.toLocaleString()}</div>
        <div class="dl">作品详情页访问</div></div>
      <div class="kpi ok"><div class="lb">曝光转化</div><div class="vl">${totalEx ? (totalViews / totalEx * 100).toFixed(1) + '%' : '—'}</div>
        <div class="dl">浏览 / 曝光</div></div>
    </div>

    <div class="g2">
      <div class="card">
        <div class="card-h"><h3>作品宣发状态</h3><span class="more">${list.length} 件</span></div>
        ${list.length ? list.map(w => {
      const mk = w.marketing || {};
      return `<div class="srow">
            <img src="${U.cover(w)}" alt="" style="width:40px;height:30px;border-radius:5px;object-fit:cover;flex:0 0 auto">
            <div class="tx"><b>${U.esc(w.title)}</b>
              <span>${mk.on
          ? '渠道：' + ((mk.channels || []).map(c => CH_LABEL[c] || c).join(' / ') || '—')
          : '未发布'}</span></div>
            <span class="pill ${mk.on ? 'ok' : 'm'}">${mk.on ? '在推' : '未推'}</span>
            <a class="btn xs" href="#/promote/${w.id}">${mk.on ? '管理' : '发布'}</a>
          </div>`;
    }).join('') : '<p class="hint">还没有作品</p>'}
      </div>

      <div class="card">
        <div class="card-h"><h3>推荐位说明</h3></div>
        <div class="chan">
          <div class="chi"><div class="ci">${I.megaphone}</div>
            <div class="cx"><b>素材市场推荐位</b><span>出现在市场首页前列，按曝光计费</span></div>
            <span class="pill c">含在佣金内</span></div>
          <div class="chi"><div class="ci">${I.chart}</div>
            <div class="cx"><b>平台首页 Banner</b><span>需要运营审核，每周 3 个名额</span></div>
            <span class="pill w">需申请</span></div>
          <div class="chi"><div class="ci">${I.shield}</div>
            <div class="cx"><b>FILMART 专区</b><span>与展会同步的线上展位</span></div>
            <span class="pill g">展期开放</span></div>
        </div>
        <div class="note c mt12">${I.info}<div>宣发是<b>站内推广</b>，不承诺成交。
          曝光数据用于判断作品该不该调价、该补哪类授权。</div></div>
      </div>
    </div>`;
  };

  /* ========================================================== 单作品宣发 */
  CG.views.promoteItem = function (args) {
    const w = CG.work(args[0]);
    if (!w) return `<div class="empty">${CG.emptyArt('lost')}<b>作品不存在</b>
      <a class="btn" href="#/promote">回宣发中心</a></div>`;
    const mk = w.marketing || { on: false, channels: [], headline: '', exposure: [] };

    return `
    <div class="crumb"><a href="#/promote">宣发中心</a> / <span>${U.esc(w.title)}</span></div>
    <div class="ph">
      <div><h1>宣发：${U.esc(w.title)}</h1>
        <p>${mk.on ? '正在推广' : '尚未发布'} · 累计曝光 ${(mk.exposure || []).reduce((a, b) => a + b, 0).toLocaleString()} 次</p></div>
      <div class="ph-r"><a class="btn" href="#/work/${w.id}">作品管理</a>
        <a class="btn" href="#/market/${w.id}">市场预览</a></div>
    </div>

    <div class="g2">
      <div class="card">
        <div class="card-h"><h3>推广文案</h3>
          <span class="pill ${mk.on ? 'ok' : 'm'}">${mk.on ? '已发布' : '草稿'}</span></div>
        <div class="fld"><label>一句话卖点</label>
          <input id="pmHead" value="${U.esc(mk.headline || '')}"
            placeholder="例如：2026 年度国产系列动画，6 位原创角色可商用" maxlength="42">
          <div class="hint">会显示在市场卡片的推荐位与分享卡片上，建议 30 字以内。</div></div>

        <div class="fld mt12"><label>投放渠道</label>
          <div class="chipset" id="pmCh">
            ${Object.keys(CH_LABEL).map(c => `<span class="chip ${(mk.channels || []).indexOf(c) >= 0 ? 'on' : ''}" data-ch="${c}">${CH_LABEL[c]}</span>`).join('')}
          </div></div>

        <div class="sep"></div>
        <div class="row">
          <button class="btn pri" data-act="publish">${mk.on ? '更新宣发' : '发布宣发'}</button>
          ${mk.on ? '<button class="btn danger" data-act="stop">停止宣发</button>' : ''}
          <button class="btn" data-act="share">${I.copy}复制推广链接</button>
        </div>
        <div class="note c mt12">${I.info}<div>发布后会真实写入数据：市场首页推荐位会包含这件作品，
          曝光数字按天累加。</div></div>
      </div>

      <div class="card">
        <div class="card-h"><h3>曝光趋势</h3><span class="more">近 12 天</span></div>
        ${(() => {
        const ex = (mk.exposure || []).slice(-12);
        const max = Math.max.apply(null, ex.concat([1]));
        return `<div class="bars">${ex.map((v, i) =>
          `<div class="b" style="height:${Math.max(4, v / max * 100)}%" title="${v} 次"></div>`).join('')}</div>
          <div class="bars-x">${ex.map((v, i) => `<span>${i + 1}</span>`).join('')}</div>
          <div class="hint mt8">峰值 ${Math.max.apply(null, ex.concat([0]))} 次 / 天</div>`;
      })()}
        <div class="sep"></div>
        <div class="card-h"><h3>分享卡片预览</h3></div>
        <div class="promo-hero">
          <img src="${U.cover(w)}" alt="">
          <div class="ov">
            <b>${U.esc(mk.headline || w.title)}</b>
            <span>${U.esc(CG.state.profile.org)} · ${U.typeOf(w.type)} · 存证于 ${U.date(w.createdAt)}</span>
            <div class="row">${(() => {
              const ps = (w.licenses || []).filter(l => l.on).map(l => l.price);
              return ps.length ? `<span class="pill g">最低 ${U.money(Math.min.apply(null, ps))} 起</span>`
                : '<span class="pill m">未开放授权</span>';
            })()}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>推广物料</h3><span class="more">点击生成</span></div>
      <div class="material">
        <div class="mati" data-mat="封面图 16:10"><div class="mv">1600 × 1000</div>
          <div class="md"><b>封面图</b><span>市场卡片</span></div></div>
        <div class="mati" data-mat="竖版海报 3:4"><div class="mv">1080 × 1440</div>
          <div class="md"><b>竖版海报</b><span>朋友圈</span></div></div>
        <div class="mati" data-mat="授权说明卡"><div class="mv">A4</div>
          <div class="md"><b>授权说明卡</b><span>给采购方</span></div></div>
        <div class="mati" data-mat="存证凭证"><div class="mv">含链上记录</div>
          <div class="md"><b>存证凭证</b><span>提案用</span></div></div>
      </div>
    </div>`;
  };

  CG.views.promoteItem.after = function (args) {
    const w = CG.work(args[0]); if (!w) return;
    const root = document.getElementById('view');
    w.marketing = w.marketing || { on: false, channels: [], headline: '', exposure: new Array(12).fill(0) };
    const mk = w.marketing;
    const save = () => { CG.save(); CG.syncBadges(); CG.render() };

    U.qsa('[data-ch]', root).forEach(el => el.onclick = () => {
      el.classList.toggle('on');
      mk.channels = U.qsa('[data-ch].on', root).map(x => x.dataset.ch);
    });

    CG.bind(root, {
      publish: () => {
        const head = (document.getElementById('pmHead') || {}).value || '';
        mk.headline = head.trim();
        mk.channels = U.qsa('[data-ch].on', root).map(x => x.dataset.ch);
        if (!mk.channels.length) return CG.toast('至少选一个投放渠道', 'err');
        mk.on = true;
        if (!mk.exposure || mk.exposure.length < 12) mk.exposure = new Array(12).fill(0);
        mk.exposure[mk.exposure.length - 1] += 40 + Math.floor(Math.random() * 80);
        w.stats.views = (w.stats.views || 0) + 12;
        CG.state.notices.unshift({
          id: U.uid('N'), type: 'system', at: U.now(),
          title: '宣发已发布：' + w.title,
          body: '渠道：' + mk.channels.map(c => CH_LABEL[c]).join(' / ')
        });
        CG.toast('宣发已发布，市场推荐位已生效', 'ok'); save();
      },
      stop: () => CG.confirm('停止宣发', '作品仍保留在素材市场，只是不再出现在推荐位。', () => {
        mk.on = false; CG.toast('已停止宣发'); save();
      }, '停止'),
      share: () => CG.copy(location.origin + location.pathname + '#/market/' + w.id, '推广链接已复制')
    });
    U.qsa('[data-mat]', root).forEach(el => el.onclick = () =>
      CG.toast('演示不生成真实文件：' + el.dataset.mat + '（正式版会走导出服务）', 'ok'));
  };

  /* ========================================================== 收入中心 */
  CG.views.revenue = function () {
    const st = CG.state, m = CG.metrics();
    const list = (st.revenue || []).slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
    const settled = list.filter(r => r.status === 'settled');
    const pending = list.filter(r => r.status === 'pending');

    // 构成
    const byKind = {};
    list.forEach(r => { byKind[r.kind] = (byKind[r.kind] || 0) + r.amount });
    const total = Object.values(byKind).reduce((a, b) => a + b, 0) || 1;
    const kindOrder = Object.keys(byKind).sort((a, b) => byKind[b] - byKind[a]);
    const colors = ['var(--cyan)', 'var(--gold)', 'var(--ok)', 'var(--muted)', 'var(--danger)'];
    const C = 2 * Math.PI * 40;
    let acc = 0;

    return `
    <div class="ph">
      <div><h1>收入中心</h1><p>更新至 ${U.now()} · 结算周期 T+7 · 平台佣金 12%</p></div>
      <div class="ph-r">
        <button class="btn" data-act="export">${I.down}导出 CSV</button>
        <button class="btn pri" data-act="withdraw" ${pending.length ? '' : 'disabled'}>提现</button>
      </div>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="lb">今日收入</div><div class="vl">${U.money(m.todayRev)}</div>
        <div class="dl">已扣佣金</div></div>
      <div class="kpi gold"><div class="lb">本月收入</div><div class="vl">${U.money(m.monthRev)}</div>
        <div class="dl">${list.filter(r => String(r.at).slice(0, 7) === U.now().slice(0, 7)).length} 笔</div></div>
      <div class="kpi"><div class="lb">累计收入</div><div class="vl">${U.money(m.totalRev)}</div>
        <div class="dl">自首笔授权起</div></div>
      <div class="kpi cy"><div class="lb">待结算</div><div class="vl">${U.money(m.pendingSettle)}</div>
        <div class="dl">${pending.length} 笔 · 已确认收益</div></div>
    </div>

    <div class="g2" style="grid-template-columns:1.15fr 1fr">
      <div class="card">
        <div class="card-h"><h3>收入流水</h3><span class="more">最近 ${Math.min(list.length, 8)} 笔</span></div>
        <div class="live">
          ${list.slice(0, 8).map(r => {
      const w = CG.work(r.workId) || { title: '(已删除)' };
      return `<div class="lvi">
              <time>${U.dt(r.at).slice(5, 16)}</time>
              <span class="src"><a href="#/work/${r.workId}/revenue">${U.esc(w.title)}</a>
                · ${U.licOf(r.kind).short}</span>
              <span class="pill ${r.way === 'auto' ? 'c' : 'm'}">${r.way === 'auto' ? '自动' : '人工'}</span>
              <span class="amt">+${U.money(r.amount)}</span>
            </div>`;
    }).join('')}
        </div>
        <div class="hint mt8">全部明细见下方表格；此列表已按金额排序展示最近 8 笔。</div>
      </div>

      <div class="card">
        <div class="card-h"><h3>收入构成</h3><span class="more">按授权类型</span></div>
        <div style="display:flex;align-items:center;gap:18px;padding:2px 0 6px">
          <svg viewBox="0 0 100 100" style="width:106px;height:106px;flex:0 0 auto">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-3)" stroke-width="15"/>
            <g transform="rotate(-90 50 50)" fill="none" stroke-width="15">
              ${kindOrder.map((k, i) => {
      const frac = byKind[k] / total;
      const seg = `<circle cx="50" cy="50" r="40" stroke="${colors[i % colors.length]}"
                  stroke-dasharray="${(frac * C).toFixed(1)} ${C.toFixed(1)}"
                  stroke-dashoffset="${(-acc * C).toFixed(1)}"/>`;
      acc += frac; return seg;
    }).join('')}
            </g>
            <text x="50" y="47" text-anchor="middle" fill="var(--ink)" font-size="12" font-weight="750"
              font-family="var(--f)">${(total / 1000).toFixed(1)}k</text>
            <text x="50" y="59" text-anchor="middle" fill="var(--muted)" font-size="7"
              font-family="var(--f)">累计</text>
          </svg>
          <div class="legend" style="flex:1">
            ${kindOrder.map((k, i) => `<div class="lg">
              <i style="background:${colors[i % colors.length]}"></i>${U.licOf(k).short}
              <span>${(byKind[k] / total * 100).toFixed(0)}%</span></div>`).join('') || '<p class="hint">无数据</p>'}
          </div>
        </div>
        <div class="note c">${I.info}<div>AI 训练数据授权占比过半时，平台会提示该类授权的
          <b>不可撤回性</b>与下游扩散风险——这是版权方最容易事后反悔的一类合约。</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>收入明细</h3><span class="more">共 ${list.length} 笔</span></div>
      <table>
        <thead><tr><th>时间</th><th>作品</th><th>授权类型</th><th>合约</th>
          <th>结算</th><th style="text-align:right">金额</th><th>状态</th><th></th></tr></thead>
        <tbody>
          ${list.map(r => {
      const w = CG.work(r.workId) || { title: '(已删除)' };
      return `<tr>
              <td class="mono">${U.dt(r.at).slice(5)}</td>
              <td><a href="#/work/${r.workId}/revenue">${U.esc(w.title)}</a></td>
              <td><span class="pill ${U.licOf(r.kind).pill}">${U.licOf(r.kind).short}</span></td>
              <td class="mono">${U.esc(r.contract)}</td>
              <td>${pill(r.way)}</td>
              <td class="num"><span class="amt">${U.money2(r.amount)}</span></td>
              <td>${r.status === 'settled' ? '<span class="pill ok">已结算</span>' : '<span class="pill w">待结算</span>'}</td>
              <td>${r.status === 'pending' ? `<button class="btn xs" data-settle="${r.id}">确认结算</button>` : ''}</td>
            </tr>`;
    }).join('') || '<tr><td colspan="8" class="hint">还没有收入记录</td></tr>'}
        </tbody>
      </table>
      <div class="note w mt12">${I.warn}<div>跨境结算提示：内地 → 香港的资金流适用不同外汇与税务规则，
        「自动分账」不能替代合规通道。提现页分别显示两地账户的到账时间、代扣税项与手续费。</div></div>
    </div>`;
  };

  CG.views.revenue.after = function () {
    const root = document.getElementById('view'), st = CG.state;
    CG.bind(root, {
      export: () => {
        const rows = [['时间', '作品', '授权类型', '合约', '方式', '金额', '状态']];
        (st.revenue || []).forEach(r => {
          const w = CG.work(r.workId) || { title: '' };
          rows.push([r.at, w.title, U.licOf(r.kind).label, r.contract,
            r.way === 'auto' ? '自动' : '人工', r.amount, r.status === 'settled' ? '已结算' : '待结算']);
        });
        const csv = '\ufeff' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = 'CineGBA收入明细.csv';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 3000);
        CG.toast('CSV 已导出', 'ok');
      },
      withdraw: () => {
        const pend = (st.revenue || []).filter(r => r.status === 'pending');
        const sum = pend.reduce((s, r) => s + r.amount, 0);
        CG.modal(`
          <div style="padding:18px 20px">
            <div class="card-h"><h3>提现</h3></div>
            <div class="srow"><div class="tx"><b>可提现余额</b>
              <span>${pend.length} 笔待结算</span></div>
              <b style="color:var(--gold);font-family:var(--fm)">${U.money(sum)}</b></div>
            <div class="fgrid mt12">
              <div class="fld"><label>收款账户</label>
                <select id="wdAcct">
                  <option>${U.esc(st.profile.bankHK)}</option>
                  <option disabled>${U.esc(st.profile.bankCN)}（需先绑定）</option>
                </select></div>
              <div class="fld"><label>预计到账</label><input value="T+3 工作日" disabled></div>
            </div>
            <div class="note w mt12">${I.warn}<div>演示环境下会把这 ${pend.length} 笔标记为已结算，
              不产生真实资金流。</div></div>
            <div class="row mt16" style="justify-content:flex-end">
              <button class="btn" data-close>取消</button>
              <button class="btn pri" id="wdGo">确认提现 ${U.money(sum)}</button>
            </div>
          </div>`, {
          onMount(panel, close) {
            panel.querySelector('#wdGo').onclick = () => {
              pend.forEach(r => r.status = 'settled');
              close(); CG.save(); CG.toast('已提交提现，' + pend.length + ' 笔转为已结算', 'ok');
              CG.render();
            };
          }
        });
      }
    });
    U.qsa('[data-settle]', root).forEach(b => b.onclick = () => {
      const r = st.revenue.find(x => x.id === b.dataset.settle);
      if (!r) return;
      r.status = 'settled'; CG.save(); CG.toast('已结算'); CG.render();
    });
  };

  /* ========================================================== 维权中心 */
  CG.views.dispute = function () {
    const st = CG.state;
    const list = (st.disputes || []).slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
    const open = list.filter(d => d.status === 'open');
    const done = list.filter(d => d.status !== 'open');

    return `
    <div class="ph">
      <div><h1>维权中心</h1><p>全网监测命中的疑似侵权线索，需人工确认后再处置</p></div>
      <div class="ph-r">
        <button class="btn" data-act="export">${I.down}导出证据包</button>
      </div>
    </div>

    <div class="kpis">
      <div class="kpi dg"><div class="lb">待确认</div><div class="vl">${open.length}</div>
        <div class="dl">需要你判断是否侵权</div></div>
      <div class="kpi"><div class="lb">全部线索</div><div class="vl">${list.length}</div>
        <div class="dl">监测覆盖 26 个平台</div></div>
      <div class="kpi ok"><div class="lb">已处置</div><div class="vl">${done.length}</div>
        <div class="dl">发函 / 下架 / 和解</div></div>
      <div class="kpi cy"><div class="lb">处置率</div><div class="vl">${list.length ? Math.round(done.length / list.length * 100) + '%' : '—'}</div>
        <div class="dl">不承诺维权成功率</div></div>
    </div>

    <div class="card">
      <div class="card-h"><h3>侵权线索</h3><span class="more">按时间倒序</span></div>
      ${list.length ? `<table>
        <thead><tr><th>编号</th><th>作品</th><th>来源平台</th><th>相似度</th>
          <th>发现时间</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${list.map(d => {
      const w = CG.work(d.workId) || { title: '(已删除)' };
      return `<tr>
              <td class="mono">${U.esc(d.id)}</td>
              <td><a href="#/work/${d.workId}/dispute">${U.esc(w.title)}</a></td>
              <td>${U.esc(d.platform)}<div class="hint">${U.esc(d.note)}</div></td>
              <td class="num">${d.match}%</td>
              <td class="mono">${U.dt(d.at).slice(5, 16)}</td>
              <td>${pill(d.status)}</td>
              <td>${d.status === 'open'
          ? `<button class="btn xs" data-disp="${d.id}">处置</button>`
          : '<span class="hint">已处理</span>'}</td>
            </tr>`;
    }).join('')}</tbody></table>` : `<div class="empty">${CG.emptyArt('done')}<b>没有侵权线索</b>
        <p>监测范围内没有发现高相似内容</p></div>`}
      <div class="note w mt12">${I.warn}<div>相似度是<b>指纹匹配度</b>，不等于侵权认定。
        平台不代替你作出法律判断，也不承诺维权成功率。</div></div>
    </div>`;
  };

  CG.views.dispute.after = function () {
    const root = document.getElementById('view'), st = CG.state;
    const save = () => { CG.save(); CG.recompute(); CG.syncBadges(); CG.render() };
    CG.bind(root, {
      export: () => {
        const rows = [['编号', '作品', '平台', '相似度', '发现时间', '状态', '说明']];
        (st.disputes || []).forEach(d => {
          const w = CG.work(d.workId) || { title: '' };
          rows.push([d.id, w.title, d.platform, d.match + '%', d.at,
            U.statusPill(d.status)[0], d.note]);
        });
        const csv = '\ufeff' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = '侵权线索证据包.csv'; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 3000);
        CG.toast('证据包已导出', 'ok');
      }
    });
    U.qsa('[data-disp]', root).forEach(el => el.onclick = () => {
      const d = st.disputes.find(x => x.id === el.dataset.disp);
      if (!d) return;
      CG.modal(`
        <div style="padding:18px 20px">
          <div class="card-h"><h3>处置 ${U.esc(d.id)}</h3></div>
          <p class="small" style="color:var(--ink-2)">${U.esc(d.platform)} · 相似度 ${d.match}%</p>
          <p class="hint mt8">${U.esc(d.note)}</p>
          <div class="chipset mt12">
            <span class="chip" data-go="letter">发律师函</span>
            <span class="chip" data-go="takedown">平台投诉下架</span>
            <span class="chip" data-go="settled">标记为已和解</span>
          </div>
          <div class="row mt16" style="justify-content:flex-end"><button class="btn" data-close>取消</button></div>
        </div>`, {
        onMount(panel, close) {
          U.qsa('.chip', panel).forEach(c => c.onclick = () => {
            d.status = c.dataset.go; close();
            CG.toast('已更新为「' + U.statusPill(d.status)[0] + '」', 'ok'); save();
          });
        }
      });
    });
  };

  /* ========================================================== 设置 */
  CG.views.settings = function () {
    const p = CG.state.profile;
    return `
    <div class="ph"><div><h1>认证与设置</h1><p>账户、认证、收款与团队</p></div></div>

    <div class="card mb12">
      <div class="card-h"><h3>当前登录</h3>
        <span class="pill ok">已登录</span>
        <span class="more">${(CG.auth.user && CG.auth.user.email) || p.email || ''}</span></div>
      <div class="fgrid">
        <div><div class="hint">登录邮箱</div><b class="small">${U.esc((CG.auth.user && CG.auth.user.email) || p.email || '—')}</b></div>
        <div><div class="hint">登录方式</div><b class="small">${CG.auth.mode === 'fs' ? '本地服务会话' : '离线本地会话'}</b></div>
        <div><div class="hint">账号创建</div><b class="small">${U.esc(((CG.auth.user && CG.auth.user.createdAt) || '').slice(0, 10) || '—')}</b></div>
        <div><div class="hint">会话有效期</div><b class="small">${CG.auth.mode === 'fs' ? '14 天' : '长期（离线）'}</b></div>
      </div>
      <div class="row mt12">
        <button class="btn danger" data-act="logout">退出登录</button>
        <span class="hint">退出后回到首页，数据仍保留在本机。</span>
      </div>
    </div>

    <div class="g2">
      <div class="card">
        <div class="card-h"><h3>机构信息</h3><span class="pill ok">${U.esc(p.verifyLevel)}已通过</span></div>
        <div class="fgrid">
          <div class="fld"><label>联系人</label><input id="stName" value="${U.esc(p.name)}"></div>
          <div class="fld"><label>机构名称</label><input id="stOrg" value="${U.esc(p.org)}"></div>
          <div class="fld"><label>机构编号</label><input value="${U.esc(p.orgId)}" disabled></div>
          <div class="fld"><label>认证有效期</label><input value="${U.esc(p.verifyUntil)}" disabled></div>
          <div class="fld full"><label>邮箱</label><input id="stEmail" value="${U.esc(p.email)}"></div>
        </div>
        <button class="btn pri mt12" data-act="saveProfile">保存</button>
      </div>

      <div class="card">
        <div class="card-h"><h3>收款账户</h3></div>
        <div class="srow"><div class="tx"><b>香港对公账户</b><span>${U.esc(p.bankHK)}</span></div>
          <span class="pill ok">已绑定</span></div>
        <div class="srow"><div class="tx"><b>内地对公账户</b><span>${U.esc(p.bankCN)}</span></div>
          <span class="pill m">未绑定</span></div>
        <div class="note w mt12">${I.warn}<div>两地资金流适用不同外汇与税务规则，
          绑定前请确认收款主体与授权合约主体一致。</div></div>
      </div>
    </div>

    <div class="g2e">
      <div class="card">
        <div class="card-h"><h3>安全</h3></div>
        <div class="srow"><div class="tx"><b>二次验证</b><span>登录与提现需验证码</span></div>
          <div class="switch on" data-sw="2fa"></div></div>
        <div class="srow"><div class="tx"><b>新设备登录提醒</b><span>通过邮件通知</span></div>
          <div class="switch on" data-sw="dev"></div></div>
        <div class="srow"><div class="tx"><b>侵权线索短信提醒</b><span>含高相似度命中</span></div>
          <div class="switch" data-sw="sms"></div></div>
      </div>

      <div class="card">
        <div class="card-h"><h3>团队成员</h3><button class="more" data-act="addMember">+ 添加</button></div>
        <div class="srow"><div class="tx"><b>林静</b><span>管理员 · 全部权限</span></div>
          <span class="pill c">本人</span></div>
        <div class="srow"><div class="tx"><b>陈律师</b><span>法务 · 仅维权与合约</span></div>
          <span class="pill m">可管理</span></div>
        <div class="srow"><div class="tx"><b>财务同事</b><span>财务 · 仅收入与提现</span></div>
          <span class="pill m">可管理</span></div>
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>数据与导出</h3></div>
      <div class="row">
        <button class="btn" data-act="exportAll">导出全部数据（JSON）</button>
        <button class="btn" data-act="resetSeed">恢复演示数据</button>
        <button class="btn danger" data-act="wipe">清空所有数据</button>
      </div>
      <div class="hint mt8">
        当前存储方式：<b>${CG.store.mode === 'fs' ? '本地服务（真实文件落盘）' :
        CG.store.mode === 'idb' ? '浏览器 IndexedDB' : '临时存储'}</b>
        ${CG.store.mode === 'fs' ? ' · 文件在 cinegba-proto/data/uploads/，数据在 data/db.json' : ''}
      </div>
    </div>`;
  };

  CG.views.settings.after = function () {
    const root = document.getElementById('view'), st = CG.state;
    CG.bind(root, {
      logout: () => { if (CG.doLogout) CG.doLogout() },
      saveProfile: () => {
        const g = id => (document.getElementById(id) || {}).value || '';
        st.profile.name = g('stName').trim() || st.profile.name;
        st.profile.org = g('stOrg').trim() || st.profile.org;
        st.profile.email = g('stEmail').trim() || st.profile.email;
        CG.save(); CG.toast('已保存', 'ok'); CG.render();
      },
      addMember: () => CG.toast('演示环境不发送邀请'),
      exportAll: () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(st, null, 2)], { type: 'application/json' }));
        a.download = 'cinegba-data.json'; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 3000);
        CG.toast('数据已导出', 'ok');
      },
      resetSeed: () => CG.confirm('恢复演示数据', '当前改动会被种子数据覆盖。', () => {
        CG.state = JSON.parse(JSON.stringify(CG.SEED));
        CG.state.savedAt = new Date().toISOString();
        CG.save(); CG.recompute(); CG.syncBadges(); CG.render();
        CG.toast('已恢复演示数据', 'ok');
      }, '恢复'),
      wipe: () => CG.confirm('清空所有数据', '所有作品、授权、收入记录会被删除，<b>不可恢复</b>。', async () => {
        CG.state = { version: 2, profile: st.profile, works: [], leads: [], revenue: [], disputes: [], notices: [] };
        await CG.save(); CG.recompute(); CG.syncBadges(); CG.render();
        CG.toast('已清空');
      }, '清空')
    });
    U.qsa('[data-sw]', root).forEach(el => el.onclick = () => el.classList.toggle('on'));
  };

})();
