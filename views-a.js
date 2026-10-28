/* ==========================================================================
   视图 A：工作台 / 上传 / 作品库
   ========================================================================== */
(function () {
  'use strict';
  const CG = window.CG, U = CG.util, I = CG.icon;
  CG.views = CG.views || {};

  /* 局部事件绑定 helper */
  CG.bind = function (root, map) {
    U.qsa('[data-act]', root).forEach(el => {
      const fn = map[el.dataset.act];
      if (!fn) return;
      el.onclick = function (e) { e.preventDefault(); e.stopPropagation(); fn(el, e) };
    });
  };

  function pill(s) { const p = U.statusPill(s); return `<span class="pill ${p[1]}">${p[0]}</span>` }

  function thumbHtml(w) {
    const src = U.cover(w);
    return `<img src="${src}" alt="${U.esc(w.title)}" loading="lazy">`;
  }

  /* ========================================================== 工作台 */
  CG.views.dash = function () {
    const st = CG.state, m = CG.metrics();
    const works = st.works.slice();

    // 近 12 天收入（真实聚合）
    const days = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10).replace(/-/g, '-');
      days.push({ k, label: String(d.getDate()), v: 0 });
    }
    (st.revenue || []).forEach(r => {
      const k = String(r.at).slice(0, 10);
      const hit = days.find(x => x.k === k);
      if (hit) hit.v += r.amount;
    });
    const maxV = Math.max.apply(null, days.map(d => d.v).concat([1]));

    // Top5（真实排序）
    const top = works.slice().sort((a, b) => (b.stats.revenue || 0) - (a.stats.revenue || 0)).slice(0, 5);
    const topMax = Math.max.apply(null, top.map(w => w.stats.revenue || 0).concat([1]));

    // 待处理（真实来源）
    const todo = [];
    m.openDisputes && todo.push({
      ic: 'r', act: 'goDispute',
      t: `新侵权线索 ${m.openDisputes} 条`,
      d: (st.disputes.find(d => d.status === 'open') || {}).note || '',
      go: '去维权'
    });
    const pendLeads = (st.leads || []).filter(l => l.status === 'pending');
    pendLeads.length && todo.push({
      ic: 'w', act: 'goLeads',
      t: `待确认询价 ${pendLeads.length} 条`,
      d: `最高一单 ${U.money(Math.max.apply(null, pendLeads.map(l => l.price)))}，等待你回签`,
      go: '去处理'
    });
    m.pendingSettle > 0 && todo.push({
      ic: 'g', act: 'goRevenue',
      t: `待结算 ${U.money(m.pendingSettle)}`,
      d: '已确认收益，可提现至香港对公账户',
      go: '去提现'
    });
    m.draft > 0 && todo.push({
      ic: 'c', act: 'goDraft',
      t: `${m.draft} 件作品还没有存证`,
      d: '草稿状态的作品无法上架，也不能发起授权',
      go: '去补全'
    });

    return `
    <div class="ph">
      <div>
        <h1>下午好，${U.esc(st.profile.name)}</h1>
        <p>你有 <b style="color:var(--danger)">${m.openDisputes}</b> 条待确认侵权线索，
           <b style="color:var(--gold)">${m.pendingLeads}</b> 条询价等待回签。</p>
      </div>
      <div class="ph-r">
        <a class="btn" href="#/library">作品库</a>
        <a class="btn pri" href="#/upload">${I.up}上传并存证</a>
      </div>
    </div>

    <div class="kpis">
      <div class="kpi cy"><div class="lb">已存证作品</div><div class="vl">${m.registered}</div>
        <div class="dl">共 ${m.workCount} 件 · 在售 ${m.listed} 件</div></div>
      <div class="kpi dg"><div class="lb">疑似侵权线索</div><div class="vl">${m.disputes}</div>
        <div class="dl">待确认 ${m.openDisputes} · 已处置 ${m.disputes - m.openDisputes}</div></div>
      <div class="kpi gold"><div class="lb">本月授权收入</div><div class="vl">${U.money(m.monthRev)}</div>
        <div class="dl">已扣除平台佣金</div></div>
      <div class="kpi"><div class="lb">累计收入</div><div class="vl">${U.money(m.totalRev)}</div>
        <div class="dl">含待结算 ${U.money(m.pendingSettle)}</div></div>
    </div>

    <div class="g2">
      <div class="card">
        <div class="card-h"><h3>待处理事项</h3>
          <span class="more">共 ${todo.length} 项</span></div>
        ${todo.length ? `<div class="todo">${todo.map(t => `
          <div class="srow" data-act="${t.act}" style="cursor:pointer">
            <div class="ci ci-${t.ic}"><span>${t.ic === 'r' ? I.warn : t.ic === 'w' ? I.cart : t.ic === 'g' ? I.chart : I.file}</span></div>
            <div class="tx"><b>${U.esc(t.t)}</b><span>${U.esc(t.d)}</span></div>
            <span class="more" style="color:var(--cyan);font-weight:600">${t.go} →</span>
          </div>`).join('')}</div>`
        : `<div class="empty" style="padding:26px"><svg>${CG.emptyArt('done')}</svg><b>全部处理完了</b><p>没有待办事项</p></div>`}
      </div>

      <div class="card">
        <div class="card-h"><h3>近 12 天收入</h3><span class="more">按日</span></div>
        <div class="bars">
          ${days.map(d => `<div class="b${d.v ? "" : " zero"}" style="height:${Math.max(4, d.v / maxV * 100)}%"
            title="${d.k}：${U.money(d.v)}"></div>`).join('')}
        </div>
        <div class="bars-x">${days.map(d => `<span>${d.label}</span>`).join('')}</div>
        <div class="hint mt8">合计 ${U.money(days.reduce((s, d) => s + d.v, 0))} · 已扣除平台佣金</div>
      </div>
    </div>

    <div class="g2e">
      <div class="card">
        <div class="card-h"><h3>作品被授权 Top 5</h3><a class="more" href="#/library">全部 →</a></div>
        ${top.length ? `<div class="rank-list">${top.map((w, i) => `
          <div class="rk" data-act="openWork" data-id="${w.id}" style="cursor:pointer">
            <span class="no">${i + 1}</span>
            <img class="rk-th" src="${U.cover(w)}" alt="">
            <span class="nm">${U.esc(w.title)}</span>
            <span class="bar"><i style="width:${Math.round((w.stats.revenue || 0) / topMax * 100)}%"></i></span>
            <span class="vv">${U.money(w.stats.revenue || 0)}</span>
          </div>`).join('')}</div>` : '<p class="hint">还没有授权记录</p>'}
        <div class="hint mt12">口径：按已结算 + 待结算的授权收入统计</div>
      </div>

      <div class="card">
        <div class="card-h"><h3>平台动态</h3><span class="more">${(st.notices || []).length} 条</span></div>
        <div>
          ${(st.notices || []).slice(0, 4).map(n => `
            <div class="fd">
              <time>${U.rel(n.at)}</time>
              <div><p style="font-size:11.5px;color:var(--ink-2);line-height:1.5">${U.esc(n.title)}</p></div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>快捷入口</h3></div>
      <div class="quick">
        <a class="qk" href="#/upload">${I.up}<b>上传作品</b><span>拖文件即可存证</span></a>
        <a class="qk" href="#/library">${I.file}<b>作品库</b><span>${m.workCount} 件作品</span></a>
        <a class="qk" href="#/market">${I.cart}<b>素材市场</b><span>素材市场</span></a>
        <a class="qk" href="#/promote">${I.megaphone}<b>宣发中心</b><span>推广与曝光</span></a>
        <a class="qk" href="#/revenue">${I.chart}<b>收入中心</b><span>${U.money(m.monthRev)} 本月</span></a>
      </div>
    </div>`;
  };

  CG.views.dash.after = function () {
    CG.bind(document.getElementById('view'), {
      goDispute: () => CG.go('dispute'),
      goLeads: () => { CG.go('library'); setTimeout(() => CG.openLeads(), 60) },
      goRevenue: () => CG.go('revenue'),
      goDraft: () => { CG.ui.libFilter = 'draft'; CG.go('library') },
      openWork: el => CG.go('work/' + el.dataset.id)
    });
  };

  /* 询价面板（供工作台 / 作品库调用） */
  CG.openLeads = function () {
    const st = CG.state;
    const rows = (st.leads || []).map(l => {
      const w = CG.work(l.workId) || { title: '(已删除)' };
      const k = U.licOf(l.kind);
      const p = U.statusPill(l.status);
      return `<tr>
        <td class="mono">${U.esc(l.id)}</td>
        <td><a href="#/work/${l.workId}">${U.esc(w.title)}</a></td>
        <td>${U.esc(l.licensee)}</td>
        <td><span class="pill ${k.pill}">${k.short}</span></td>
        <td class="num">${U.money(l.price)}</td>
        <td><span class="pill ${p[1]}">${p[0]}</span></td>
        <td style="white-space:nowrap">${l.status === 'pending'
          ? `<button class="btn xs" data-lead-ok="${l.id}">回签</button>
             <button class="btn xs danger" data-lead-no="${l.id}">驳回</button>`
          : '<span class="hint">已处理</span>'}</td>
      </tr>`;
    }).join('');

    CG.modal(`
      <div style="padding:16px 18px">
        <div class="card-h"><h3>询价与合约</h3><span class="more">${(st.leads || []).length} 条</span></div>
        ${(st.leads || []).length ? `<table><thead><tr>
          <th>编号</th><th>作品</th><th>采购方</th><th>授权类型</th><th style="text-align:right">报价</th><th>状态</th><th>操作</th>
        </tr></thead><tbody>${rows}</tbody></table>`
        : '<p class="hint">还没有询价</p>'}
      </div>`, {
      wide: true,
      onMount(panel) {
        U.qsa('[data-lead-ok]', panel).forEach(b => b.onclick = () => {
          const l = st.leads.find(x => x.id === b.dataset.leadOk);
          if (!l) return;
          l.status = 'signed';
          const w = CG.work(l.workId);
          if (w) { w.stats.licenses = (w.stats.licenses || 0) + 1 }
          st.revenue.unshift({
            id: U.uid('R'), workId: l.workId, contract: 'CT-2026-' + Math.floor(900 + Math.random() * 99),
            kind: l.kind, amount: l.price, way: 'manual', at: U.now(), status: 'pending'
          });
          CG.markStale(); CG.save(); CG.closeModal(); CG.render();
          CG.toast('已回签，合约进入履行中，入账待结算', 'ok');
        });
        U.qsa('[data-lead-no]', panel).forEach(b => b.onclick = () => {
          const l = st.leads.find(x => x.id === b.dataset.leadNo);
          if (!l) return;
          l.status = 'rejected';
          CG.markStale(); CG.save(); CG.closeModal(); CG.render();
          CG.toast('已驳回该询价');
        });
      }
    });
  };

  /* ========================================================== 上传 */
  CG._up = null;
  function upInit() {
    CG._up = { step: 1, type: 'video', files: [], form: null, busy: false, done: null };
  }

  CG.views.upload = function () {
    const s = CG._up || (upInit(), CG._up);
    const types = [['video', '视频', 'MP4/MOV ≤60MB'], ['audio', '音频', 'MP3/WAV/FLAC'],
      ['image', '图片', 'JPG/PNG/WEBP'], ['doc', '剧本文档', 'PDF/DOCX/TXT'],
      ['model', '3D 模型', 'GLB/FBX/OBJ/ZIP']];

    const stepHtml = (a, b, c) => `
      <div class="steps">
        <div class="st ${s.step > 1 ? 'done' : s.step === 1 ? 'now' : ''}"><span class="n">${s.step > 1 ? '✓' : '1'}</span>选择文件</div>
        <div class="ln"></div>
        <div class="st ${s.step > 2 ? 'done' : s.step === 2 ? 'now' : ''}"><span class="n">${s.step > 2 ? '✓' : '2'}</span>填写信息</div>
        <div class="ln"></div>
        <div class="st ${s.step > 3 ? 'done' : s.step === 3 ? 'now' : ''}"><span class="n">${s.step > 3 ? '✓' : '3'}</span>提交存证</div>
      </div>`;

    /* --- 第 3 步：完成 --- */
    if (s.step === 3 && s.done) {
      const w = s.done;
      return `
      <div class="ph"><div><h1>存证完成</h1><p>作品已写入作品库，可继续配置授权或发布宣发</p></div></div>
      ${stepHtml()}
      <div class="g2">
        <div class="card">
          <div class="cert">
            <div class="cert-h"><span class="ci-c">${I.shield}</span><b>CineGBA 存证凭证</b></div>
            <div class="cert-sub">凭证编号 ${U.esc(w.id.toUpperCase())} · 生成于 ${U.now()}</div>
            <div class="cert-grid">
              <div><span class="k">作品名称</span><span class="v">${U.esc(w.title)}</span></div>
              <div><span class="k">文件</span><span class="v">${U.esc(w.file.name)}</span></div>
              <div><span class="k">文件大小</span><span class="v">${U.bytes(w.file.size)}</span></div>
              <div><span class="k">指纹哈希</span><span class="v">${U.esc((w.fingerprints[0] || {}).hash || '—')}</span></div>
              <div><span class="k">存证方式</span><span class="v">链上存证 + 可信时间戳</span></div>
              <div><span class="k">存证位置</span><span class="v">${U.esc((w.file.storedAt || '').slice(0, 30))}</span></div>
            </div>
          </div>
          <div class="note w mt12">${I.warn}<div>存证用于<b>提升可追溯性与举证便利</b>，不构成作品权属的法定推定。如需登记效力，请另行办理作品自愿登记（境内）或按香港适用法律处理。</div></div>
        </div>
        <div class="card">
          <div class="card-h"><h3>接下来可以做什么</h3></div>
          <div class="chan">
            <div class="chi" data-act="toWork" style="cursor:pointer">
              <div class="ci">${I.file}</div>
              <div class="cx"><b>进入作品管理</b><span>配置授权类型、价格、上架开关</span></div>
              <span class="more">→</span></div>
            <div class="chi" data-act="toPromote" style="cursor:pointer">
              <div class="ci">${I.megaphone}</div>
              <div class="cx"><b>发布宣发</b><span>写推广语、选渠道、看曝光</span></div>
              <span class="more">→</span></div>
            <div class="chi" data-act="again" style="cursor:pointer">
              <div class="ci">${I.up}</div>
              <div class="cx"><b>继续上传</b><span>批量存证更多作品</span></div>
              <span class="more">→</span></div>
          </div>
          <div class="row mt16">
            <a class="btn pri" href="#/work/${w.id}">进入作品管理</a>
            <a class="btn" href="#/library">回作品库</a>
          </div>
        </div>
      </div>`;
    }

    /* --- 第 2 步：填写信息 --- */
    if (s.step === 2) {
      const f = s.form;
      return `
      <div class="ph">
        <div><h1>填写作品信息</h1><p>${s.files.length} 个文件已就绪，${U.bytes(s.files.reduce((a, b) => a + b.size, 0))}</p></div>
        <div class="ph-r"><button class="btn" data-act="backStep">${I.back}上一步</button></div>
      </div>
      ${stepHtml()}
      <div class="g2">
        <div class="card">
          <div class="card-h"><h3>基本信息</h3></div>
          <div class="fgrid">
            <div class="fld full"><label>作品名称 <i>*</i></label>
              <input id="fTitle" value="${U.esc(f.title)}" placeholder="例如：山海绘卷 · 第 3 集"></div>
            <div class="fld"><label>所属系列</label>
              <input id="fSeries" value="${U.esc(f.series)}" placeholder="选填"></div>
            <div class="fld"><label>创作完成日期 <i>*</i></label>
              <input id="fDate" type="date" value="${U.esc(f.createdAt)}"></div>
            <div class="fld full"><label>简介</label>
              <textarea id="fDesc" rows="2" placeholder="一句话说明作品内容与可用于哪些场景">${U.esc(f.desc)}</textarea></div>
            <div class="fld full"><label>标签</label>
              <input id="fTags" value="${U.esc(f.tags)}" placeholder="用逗号分隔，例如：动画, 国风, 系列剧"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-h"><h3>权利与合规</h3></div>
          <div class="fgrid">
            <div class="fld full"><label>权利归属声明 <i>*</i></label>
              <select id="fOwn">
                <option value="company" ${f.ownership === 'company' ? 'selected' : ''}>原创（公司全资持有）</option>
                <option value="licensed" ${f.ownership === 'licensed' ? 'selected' : ''}>已获授权（需上传授权链文件）</option>
                <option value="shared" ${f.ownership === 'shared' ? 'selected' : ''}>合作共有</option>
              </select></div>
            <div class="fld full"><label>是否含真实人物肖像 / 声音 <i>*</i></label>
              <div class="chipset" id="fPortrait">
                <span class="chip ${!f.portrait && !f.voice ? 'on' : ''}" data-v="none">不含</span>
                <span class="chip ${f.portrait ? 'on' : ''}" data-v="portrait">含肖像</span>
                <span class="chip ${f.voice ? 'on' : ''}" data-v="voice">含声音</span>
              </div>
              <div class="hint">含肖像或声音时，可存证但不能上架素材市场，需先补充对应授权文件。</div>
            </div>
          </div>
          <div class="note c mt12">${I.info}<div>提交后会<b>真实生成</b>指纹占位与存证记录，并保存到你选择的数据位置。</div></div>
          <button class="btn pri wide mt16" data-act="submit">${I.shield}提交并存证</button>
        </div>
      </div>`;
    }

    /* --- 第 1 步：选类型 + 拖文件 --- */
    const list = s.files.map((f, i) => `
      <div class="fitem">
        <div class="thumb">${f.preview ? `<img src="${f.preview}" alt="">` : U.esc((f.name.split('.').pop() || '').slice(0, 4).toUpperCase())}</div>
        <div class="fi"><b>${U.esc(f.name)}</b><span>${U.bytes(f.size)}${f.type ? ' · ' + U.esc(f.type) : ''}</span>
          <div class="pbar"><i style="width:${Math.round((f.progress || 0) * 100)}%"></i></div></div>
        <button class="iconbtn" data-rm="${i}" title="移除">${I.trash}</button>
      </div>`).join('');

    return `
    <div class="ph">
      <div><h1>上传作品并生成存证</h1><p>文件会${CG.store.mode === 'fs' ? '真实写入电脑的 data/uploads/ 目录' : '保存在浏览器里（要真实落盘请用本地服务运行）'}</p></div>
      <div class="ph-r"><a class="btn" href="#/library">取消</a></div>
    </div>
    ${stepHtml()}

    <div class="card mb12">
      <div class="card-h"><h3>作品类型</h3><span class="more">已选：${U.typeOf(s.type)}</span></div>
      <div class="types-grid">
        ${types.map(t => `<div class="tp ${s.type === t[0] ? 'on' : ''}" data-type="${t[0]}">
          <b>${t[1]}</b><span>${t[2]}</span></div>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>选择文件</h3><span class="more">支持多选</span></div>
      <div class="dzone" id="dzone">
        ${I.up}
        <b>把文件拖到这里，或点击选择</b>
        <span>${CG.store.mode === 'fs' ? '单个文件上限 60MB' : '浏览器模式建议 40MB 以内'}</span>
      </div>
      <input type="file" id="fileInput" multiple hidden>
      ${s.files.length ? `<div class="filelist">${list}</div>` : ''}
      <div class="row mt16">
        <button class="btn pri" data-act="next" ${s.files.length && s.files.every(f => f.progress >= 1) ? '' : 'disabled'}>
          下一步：填写信息 ${I.arrow}</button>
        <span class="hint" id="upHint">${s.files.length ? (s.files.every(f => f.progress >= 1) ? '文件已就绪' : '正在上传…') : '先选择至少一个文件'}</span>
      </div>
    </div>`;
  };

  CG.views.upload.after = function () {
    const s = CG._up; if (!s) return;
    const root = document.getElementById('view');
    const rerender = () => CG.render();

    CG.bind(root, {
      backStep: () => { s.step = 1; rerender() },
      next: () => {
        if (!s.files.length) return CG.toast('请先选择文件', 'err');
        const f = s.files[0];
        const base = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
        s.form = {
          title: s.form ? s.form.title : base,
          series: s.form ? s.form.series : '',
          createdAt: new Date().toISOString().slice(0, 10),
          desc: s.form ? s.form.desc : '',
          tags: s.form ? s.form.tags : '',
          ownership: s.form ? s.form.ownership : 'company',
          portrait: s.form ? s.form.portrait : false,
          voice: s.form ? s.form.voice : false
        };
        s.step = 2; rerender();
      },
      submit: () => doSubmit(),
      toWork: () => CG.go('work/' + s.done.id),
      toPromote: () => CG.go('promote/' + s.done.id),
      again: () => { upInit(); rerender() }
    });

    // 移除文件
    U.qsa('[data-rm]', root).forEach(b => b.onclick = e => {
      e.stopPropagation();
      s.files.splice(Number(b.dataset.rm), 1); rerender();
    });

    // 类型
    U.qsa('[data-type]', root).forEach(el => el.onclick = () => {
      s.type = el.dataset.type; rerender();
    });

    if (s.step !== 1) {
      // 第 2 步：chipset
      const cs = document.getElementById('fPortrait');
      if (cs) U.qsa('.chip', cs).forEach(c => c.onclick = () => {
        const v = c.dataset.v;
        U.qsa('.chip', cs).forEach(x => x.classList.remove('on'));
        c.classList.add('on');
        s.form.portrait = v === 'portrait';
        s.form.voice = v === 'voice';
      });
      return;
    }

    // 第 1 步：拖拽与选择
    const dz = document.getElementById('dzone');
    const inp = document.getElementById('fileInput');
    if (!dz || !inp) return;
    dz.onclick = () => inp.click();
    inp.onchange = () => { handleFiles(Array.from(inp.files)); inp.value = '' };
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => {
      e.preventDefault(); dz.classList.add('over');
    }));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => {
      e.preventDefault(); dz.classList.remove('over');
    }));
    dz.addEventListener('drop', e => {
      const fs = Array.from(e.dataTransfer.files || []);
      if (fs.length) handleFiles(fs);
    });

    function handleFiles(files) {
      files.forEach(file => {
        const rec = {
          key: U.uid('u'), name: file.name, size: file.size, type: file.type,
          progress: 0, url: null, preview: null
        };
        if (/^image\//.test(file.type)) {
          rec.preview = URL.createObjectURL(file);
        }
        s.files.push(rec);
        CG.render();
        CG.store.upload(file, p => {
          rec.progress = p;
          const bar = document.querySelector(`[data-rm="${s.files.indexOf(rec)}"]`);
          if (bar) {
            const i = bar.parentElement.querySelector('.pbar i');
            if (i) i.style.width = Math.round(p * 100) + '%';
          }
        }).then(info => {
          rec.progress = 1;
          rec.url = info.url;
          rec.storedAt = info.storedAt;
          rec.savedName = info.name;
          CG.render();
        }).catch(err => {
          rec.progress = 0;
          CG.toast('上传失败：' + err.message, 'err');
          CG.render();
        });
      });
    }

    async function doSubmit() {
      const g = id => (document.getElementById(id) || {}).value || '';
      const title = g('fTitle').trim();
      if (!title) return CG.toast('作品名称不能为空', 'err');
      if (!g('fDate')) return CG.toast('请填写创作完成日期', 'err');

      const f0 = s.files[0];
      const now = U.now();
      const hid = () => {
        const c = '0123456789abcdef';
        let a = '', b = '';
        for (let i = 0; i < 8; i++) a += c[Math.floor(Math.random() * 16)];
        for (let i = 0; i < 4; i++) b += c[Math.floor(Math.random() * 16)];
        return a + '…' + b;
      };
      const w = {
        id: 'w-' + Math.random().toString(36).slice(2, 8),
        title, type: s.type, series: g('fSeries').trim(), desc: g('fDesc').trim(),
        tags: g('fTags').split(/[,，]/).map(x => x.trim()).filter(Boolean),
        createdAt: g('fDate'), status: 'registered',
        file: {
          name: f0.name, size: f0.size, url: f0.url,
          storedAt: f0.storedAt || '浏览器 IndexedDB'
        },
        coverUrl: f0.preview || null,
        rights: {
          ownership: g('fOwn'), portrait: !!s.form.portrait, voice: !!s.form.voice, docs: 0
        },
        evidence: {
          chain: { on: true, net: '机构联盟链（演示）', tx: '0x' + hid(), block: String(1300000 + Math.floor(Math.random() * 99999)), at: now },
          registry: { on: false, org: '—', no: '—', dci: '—' },
          tsa: { on: true, issuer: '第三方 TSA（演示）', stamp: 'TSA-' + now.slice(0, 10) + '-' + hid().slice(0, 4), at: now }
        },
        fingerprints: [
          { mod: '内容指纹', hash: hid(), at: now.slice(5, 16), state: 'ok' }
        ],
        licenses: [], stats: { views: 0, inquiries: 0, licenses: 0, revenue: 0, disputes: 0, resolves: 0 },
        marketing: { on: false, headline: '', channels: [], exposure: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      };

      CG.state.works.unshift(w);
      CG.state.notices.unshift({
        id: U.uid('N'), type: 'system', at: now,
        title: '新作品已存证：' + title,
        body: '指纹已生成，接下来可以配置授权类型与价格。'
      });
      await CG.save();
      CG.recompute(); CG.syncBadges();
      s.step = 3; s.done = w;
      CG.render();
      CG.toast('存证完成，文件已写入 ' + (f0.storedAt || '浏览器'), 'ok');
    }
  };

  /* ========================================================== 作品库 */
  CG.views.library = function () {
    const st = CG.state;
    const f = CG.ui.libFilter, sort = CG.ui.libSort, q = CG.ui.q.trim();
    let list = st.works.slice();

    if (f !== 'all') list = list.filter(w => w.status === f);
    if (q) {
      const k = q.toLowerCase();
      list = list.filter(w =>
        (w.title + ' ' + (w.series || '') + ' ' + (w.tags || []).join(' ') + ' ' + w.id).toLowerCase().includes(k));
    }
    const sorters = {
      recent: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
      revenue: (a, b) => (b.stats.revenue || 0) - (a.stats.revenue || 0),
      views: (a, b) => (b.stats.views || 0) - (a.stats.views || 0),
      disputes: (a, b) => (b.stats.disputes || 0) - (a.stats.disputes || 0)
    };
    list.sort(sorters[sort] || sorters.recent);

    const tabs = [['all', '全部'], ['listed', '在售'], ['registered', '已存证'],
      ['draft', '草稿'], ['offline', '已下架']];
    const counts = {
      all: st.works.length,
      listed: st.works.filter(w => w.status === 'listed').length,
      registered: st.works.filter(w => w.status === 'registered').length,
      draft: st.works.filter(w => w.status === 'draft').length,
      offline: st.works.filter(w => w.status === 'offline').length
    };

    const dispCnt = {};
    (st.disputes || []).forEach(d => { dispCnt[d.workId] = (dispCnt[d.workId] || 0) + 1 });

    const cards = list.map(w => {
      const p = U.statusPill(w.status);
      const dc = dispCnt[w.id] || 0;
      return `<div class="wcard" data-open="${w.id}">
        <div class="wcover">
          <img src="${U.cover(w)}" alt="${U.esc(w.title)}" loading="lazy">
          <span class="st-badge pill ${p[1]}">${p[0]}</span>
          <span class="type-badge">${U.typeOf(w.type)}</span>
        </div>
        <div class="wbody">
          <b>${U.esc(w.title)}</b>
          <div class="mt">${w.series ? `<span>${U.esc(w.series)}</span>` : ''}<span>${U.date(w.createdAt)}</span></div>
          <div class="mx">
            <span class="p">${U.money(w.stats.revenue || 0)}</span>
            <span>授权 ${w.stats.licenses || 0}</span>
            <span style="margin-left:auto;color:${dc > 0 ? 'var(--danger)' : 'var(--muted)'}">侵权 ${dc}</span>
          </div>
        </div>
      </div>`;
    }).join('');

    return `
    <div class="ph">
      <div><h1>作品库</h1><p>共 ${st.works.length} 件 · 在售 ${counts.listed} 件 · 草稿 ${counts.draft} 件</p></div>
      <div class="ph-r">
        <button class="btn" data-act="leads">${I.cart}询价 (${(st.leads || []).filter(l => l.status === 'pending').length})</button>
        <a class="btn pri" href="#/upload">${I.up}上传作品</a>
      </div>
    </div>

    <div class="toolbar">
      <div class="seg">
        ${tabs.map(t => `<button class="${f === t[0] ? 'on' : ''}" data-filter="${t[0]}">${t[1]} ${counts[t[0]]}</button>`).join('')}
      </div>
      <div class="grow"></div>
      ${q ? `<span class="pill c">搜索：${U.esc(q)} <a href="#" data-act="clearQ" style="margin-left:4px">×</a></span>` : ''}
      <select id="sortSel">
        <option value="recent" ${sort === 'recent' ? 'selected' : ''}>最近上传</option>
        <option value="revenue" ${sort === 'revenue' ? 'selected' : ''}>收入最高</option>
        <option value="views" ${sort === 'views' ? 'selected' : ''}>浏览量高</option>
        <option value="disputes" ${sort === 'disputes' ? 'selected' : ''}>侵权最多</option>
      </select>
    </div>

    ${list.length ? `<div class="wgrid">${cards}</div>`
        : `<div class="empty">${CG.emptyArt('search')}<b>没有符合条件的作品</b>
           <p>${q ? '换个关键词试试' : '先上传第一件作品，它会出现在这里'}</p>
           <a class="btn pri" href="#/upload">上传作品</a></div>`}`;
  };

  CG.views.library.after = function () {
    const root = document.getElementById('view');
    CG.bind(root, {
      leads: () => CG.openLeads(),
      clearQ: () => { CG.ui.q = ''; CG.render() }
    });
    U.qsa('[data-open]', root).forEach(el => el.onclick = () => CG.go('work/' + el.dataset.open));
    U.qsa('[data-filter]', root).forEach(el => el.onclick = () => {
      CG.ui.libFilter = el.dataset.filter; CG.render();
    });
    const sel = document.getElementById('sortSel');
    if (sel) sel.onchange = () => { CG.ui.libSort = sel.value; CG.render() };
  };

})();
