/* ==========================================================================
   视图 B：作品详情与管理 / 市场详情
   ========================================================================== */
(function () {
  'use strict';
  const CG = window.CG, U = CG.util, I = CG.icon;
  CG.views = CG.views || {};

  const TABS = [
    ['overview', '总览'],
    ['evidence', '存证信息'],
    ['license', '授权配置'],
    ['policy', '自动策略'],
    ['dispute', '维权动态'],
    ['revenue', '收入明细'],
    ['marketing', '宣发']
  ];

  function pill(s) { const p = U.statusPill(s); return `<span class="pill ${p[1]}">${p[0]}</span>` }

  /* ========================================================== 作品详情 */
  CG.views.work = function (args) {
    const id = args[0], tab = args[1] || 'overview';
    const w = CG.work(id);
    if (!w) return `<div class="empty">${I.empty}<b>作品不存在</b><p>可能已被删除</p>
      <a class="btn" href="#/library">回作品库</a></div>`;

    const lic = w.licenses || [];
    const onLic = lic.filter(l => l.on);
    const disp = (CG.state.disputes || []).filter(d => d.workId === id);
    const revs = (CG.state.revenue || []).filter(r => r.workId === id);
    const canList = (w.rights.portrait || w.rights.voice) ? (w.rights.docs > 0) : true;

    const head = `
    <div class="crumb"><a href="#/library">作品库</a> / <span>${U.esc(w.title)}</span></div>
    <div class="ph">
      <div>
        <h1>${U.esc(w.title)}</h1>
        <p>${U.typeOf(w.type)}${w.series ? ' · ' + U.esc(w.series) : ''} · ${U.date(w.createdAt)}
           · 作品编号 <span class="mono">${U.esc(w.id)}</span> · ${pill(w.status)}</p>
      </div>
      <div class="ph-r">
        <button class="btn" data-act="edit">${I.edit}编辑</button>
        <button class="btn" data-act="cert">${I.copy}凭证</button>
        ${w.status === 'listed'
        ? `<button class="btn" data-act="offline">下架</button>`
        : `<button class="btn pri" data-act="online" ${canList ? '' : 'disabled title="含肖像/声音且未上传授权文件，暂不能上架"'}>上架</button>`}
        <a class="btn" href="#/market/${w.id}">市场预览</a>
      </div>
    </div>`;

    const kpis = `
    <div class="kpis">
      <div class="kpi cy"><div class="lb">累计授权</div><div class="vl">${w.stats.licenses || 0}</div>
        <div class="dl">在售授权 ${onLic.length} 种</div></div>
      <div class="kpi gold"><div class="lb">累计收入</div><div class="vl">${U.money(w.stats.revenue || 0)}</div>
        <div class="dl">已扣佣金</div></div>
      <div class="kpi dg"><div class="lb">疑似侵权</div><div class="vl">${disp.length}</div>
        <div class="dl">待确认 ${disp.filter(d => d.status === 'open').length}</div></div>
      <div class="kpi"><div class="lb">市场浏览</div><div class="vl">${(w.stats.views || 0).toLocaleString()}</div>
        <div class="dl">询价 ${w.stats.inquiries || 0}</div></div>
    </div>`;

    const tabs = `<div class="tabs">${TABS.map(t => {
      const n = t[0] === 'dispute' ? disp.length : t[0] === 'license' ? lic.length
        : t[0] === 'revenue' ? revs.length : 0;
      return `<a class="tab ${tab === t[0] ? 'on' : ''}" href="#/work/${id}/${t[0]}">${t[1]}${n ? `<span class="n">${n}</span>` : ''}</a>`;
    }).join('')}</div>`;

    return head + kpis + tabs + body(w, tab, { lic, disp, revs, canList });
  };

  function body(w, tab, ctx) {
    if (tab === 'evidence') return tabEvidence(w);
    if (tab === 'license') return tabLicense(w, ctx);
    if (tab === 'policy') return tabPolicy(w, ctx);
    if (tab === 'dispute') return tabDispute(w, ctx);
    if (tab === 'revenue') return tabRevenue(w, ctx);
    if (tab === 'marketing') return tabMarketing(w);
    return tabOverview(w, ctx);
  }

  /* ---------------- 总览 ---------------- */
  function tabOverview(w, ctx) {
    const lic = ctx.lic;
    return `
    <div class="g2">
      <div class="card">
        <div class="card-h"><h3>作品信息</h3><button class="more" data-act="edit">编辑</button></div>
        <div class="cover-big"><img src="${U.cover(w)}" alt=""></div>
        <div class="fgrid mt12">
          <div><div class="hint">系列</div><b class="small">${U.esc(w.series || '—')}</b></div>
          <div><div class="hint">类型</div><b class="small">${U.typeOf(w.type)}</b></div>
          <div><div class="hint">创作完成</div><b class="small">${U.date(w.createdAt)}</b></div>
          <div><div class="hint">文件</div><b class="small ellip" title="${U.esc(w.file.name)}">${U.esc(w.file.name)}</b></div>
          <div><div class="hint">文件大小</div><b class="small">${U.bytes(w.file.size)}</b></div>
          <div><div class="hint">存储位置</div><b class="small ellip" title="${U.esc(w.file.storedAt || '')}">${U.esc(w.file.storedAt || '—')}</b></div>
        </div>
        <div class="mt12"><div class="hint">简介</div>
          <p class="small" style="color:var(--ink-2);line-height:1.6">${U.esc(w.desc || '—')}</p></div>
        <div class="mt8">
          ${(w.tags || []).map(t => `<span class="pill m">${U.esc(t)}</span>`).join(' ')}
        </div>
      </div>

      <div>
        <div class="card mb12">
          <div class="card-h"><h3>权利与合规</h3></div>
          <div class="srow"><div class="tx"><b>权利归属</b>
            <span>${({ company: '原创（公司全资）', licensed: '已获授权（需授权链文件）', shared: '合作共有' })[w.rights.ownership] || '—'}</span></div></div>
          <div class="srow"><div class="tx"><b>含真实人物肖像</b>
            <span>${w.rights.portrait ? '是 —— 需补授权文件才能上架' : '否'}</span></div>
            <span class="pill ${w.rights.portrait ? 'w' : 'ok'}">${w.rights.portrait ? '需补文件' : '无限制'}</span></div>
          <div class="srow"><div class="tx"><b>含真实声音</b>
            <span>${w.rights.voice ? '是 —— 需补授权文件才能上架' : '否'}</span></div>
            <span class="pill ${w.rights.voice ? 'w' : 'ok'}">${w.rights.voice ? '需补文件' : '无限制'}</span></div>
          <div class="srow"><div class="tx"><b>权属文件</b>
            <span>已上传 ${w.rights.docs || 0} 份</span></div>
            <button class="btn xs" data-act="uploadDocs">补充</button></div>
          ${!ctx.canList ? `<div class="note w">${I.warn}<div>该作品含肖像或声音且没有授权文件，已限制上架素材市场。这属于合规硬性限制，不能通过改状态绕过。</div></div>` : ''}
        </div>

        <div class="card">
          <div class="card-h"><h3>授权概览</h3><a class="more" href="#/work/${w.id}/license">配置 →</a></div>
          ${lic.length ? lic.map(l => {
          const k = U.licOf(l.kind);
          return `<div class="srow">
              <div class="tx"><b><span class="pill ${k.pill}">${k.short}</span> ${U.money(l.price)}</b>
                <span>${l.region} · ${l.term >= 999 ? '永久' : l.term + ' 个月'}${l.resell ? ' · 可转授权' : ''}</span></div>
              <span class="pill ${l.on ? 'ok' : 'm'}">${l.on ? '在售' : '关闭'}</span>
            </div>`;
        }).join('') : `<p class="hint">还没有配置授权。到「授权配置」里加一项就能上架。</p>
            <a class="btn sm mt8" href="#/work/${w.id}/license">去配置</a>`}
        </div>
      </div>
    </div>`;
  }

  /* ---------------- 存证信息 ---------------- */
  function tabEvidence(w) {
    const e = w.evidence;
    const b = (on, okTxt, badTxt) => `<span class="bdg ${on ? 'ok' : 'm'}">${on ? okTxt : badTxt}</span>`;
    return `
    <div class="reg">
      <div class="rgi">
        <div class="rg-t"><span style="color:var(--cyan)">${I.shield}</span>链上存证 ${b(e.chain.on, '已完成', '未存证')}</div>
        <dl>
          <div><dt>存证网络</dt><dd>${U.esc(e.chain.net)}</dd></div>
          <div><dt>交易哈希</dt><dd>${U.esc(e.chain.tx)}</dd></div>
          <div><dt>区块高度</dt><dd>${U.esc(e.chain.block)}</dd></div>
          <div><dt>上链时间</dt><dd>${U.esc(e.chain.at)}</dd></div>
          <div><dt>效力说明</dt><dd style="color:var(--warn);font-family:var(--f)">仅证明该时点存在该指纹，不构成权属推定</dd></div>
        </dl>
      </div>
      <div class="rgi">
        <div class="rg-t"><span style="color:var(--gold)">${I.file}</span>作品自愿登记 ${b(e.registry.on, '已登记', '未办理')}</div>
        <dl>
          <div><dt>登记机关</dt><dd>${U.esc(e.registry.org)}</dd></div>
          <div><dt>登记号</dt><dd>${U.esc(e.registry.no)}</dd></div>
          <div><dt>DCI 编码</dt><dd>${U.esc(e.registry.dci)}</dd></div>
          <div><dt>效力说明</dt><dd style="font-family:var(--f);color:var(--muted)">法定登记证书，效力最高但需人工办理</dd></div>
        </dl>
        ${!e.registry.on ? '<button class="btn sm wide mt8" data-act="applyReg">了解如何办理</button>' : ''}
      </div>
      <div class="rgi">
        <div class="rg-t"><span style="color:var(--ok)">${I.ok}</span>可信时间戳 ${b(e.tsa.on, '已完成', '未签发')}</div>
        <dl>
          <div><dt>签发机构</dt><dd>${U.esc(e.tsa.issuer)}</dd></div>
          <div><dt>戳值</dt><dd>${U.esc(e.tsa.stamp)}</dd></div>
          <div><dt>签发时间</dt><dd>${U.esc(e.tsa.at)}</dd></div>
          <div><dt>效力说明</dt><dd style="font-family:var(--f);color:var(--ok)">司法实践中常作为电子数据真实性的辅助证据</dd></div>
        </dl>
      </div>
    </div>

    <div class="g2">
      <div class="card">
        <div class="card-h"><h3>内容指纹</h3><span class="more">算法 CG-FP v0.9.3</span></div>
        <table>
          <thead><tr><th>模态</th><th>哈希值</th><th>提取时间</th><th>状态</th></tr></thead>
          <tbody>
            ${(w.fingerprints || []).map(f => `<tr>
              <td>${U.esc(f.mod)}</td><td class="mono">${U.esc(f.hash)}</td>
              <td class="mono">${U.esc(f.at)}</td><td><span class="pill ok">有效</span></td></tr>`).join('')
      || '<tr><td colspan="4" class="hint">还没有生成指纹</td></tr>'}
            <tr><td>水印（参考）</td><td class="mono">—</td><td class="mono">—</td>
              <td><span class="pill w">不采用</span></td></tr>
          </tbody>
        </table>
        <div class="note w">${I.warn}<div>水印不作为存证依据：公开研究显示水印在对抗性攻击下可被低成本去除。指纹是当前唯一经大规模工业验证的方案，但<b>相似度不等于侵权认定</b>。</div></div>
      </div>

      <div class="card">
        <div class="card-h"><h3>权属文件</h3><span class="more">${w.rights.docs || 0} 份</span></div>
        ${w.rights.docs > 0 ? `<table>
          <colgroup><col style="width:46%"><col style="width:28%"><col style="width:26%"></colgroup>
          <thead><tr><th>文件</th><th>类型</th><th>上传时间</th></tr></thead>
          <tbody>
            <tr><td>创作过程_分镜脚本.pdf</td><td><span class="pill c">创作过程</span></td><td class="mono">${U.date(w.createdAt)}</td></tr>
            <tr><td>角色设定合同.pdf</td><td><span class="pill c">授权链</span></td><td class="mono">${U.date(w.createdAt)}</td></tr>
            ${w.rights.docs > 2 ? `<tr><td>公司持有声明.pdf</td><td><span class="pill c">权属声明</span></td><td class="mono">${U.date(w.createdAt)}</td></tr>` : ''}
          </tbody></table>` : '<p class="hint">还没有上传权属文件。</p>'}
        <button class="btn wide mt12" data-act="uploadDocs">上传权属文件</button>
        <div class="hint mt8">建议：权属文件缺失时，平台自动降低该作品可上架的授权等级，而不是让用户自由选择。</div>
      </div>
    </div>`;
  }


  /* ---------------- 自动成交策略 ---------------- */
  function tabPolicy(w, ctx) {
    const pol = CG.workPolicy(w);
    const on = CG.policyOn(w);
    const stats = CG.policyStats();
    const hints = CG.policyHints(w, 3);
    const cov = CG.policyCoverage(w);
    const packs = CG.POLICY_PACKS;
    const curPack = (w.policy && w.policy.pack) || null;

    const dimRow = (d) => {
      const allowed = d.multi ? (pol.auto[d.k] || []) : null;
      if (d.k === 'term') {
        return `<div class="cl-dim">
          <div class="cl-label">${d.label}</div>
          <div class="chipset" data-pdim="term" data-multi="0">
            ${['12 个月', '24 个月', '36 个月'].map(t => {
          const v = { '12 个月': 12, '24 个月': 24, '36 个月': 36 }[t];
          return `<span class="chip ${pol.auto.termMax >= v ? 'on' : ''}" data-termv="${v}">≤ ${t}</span>`;
        }).join('')}
            <span class="hint" style="align-self:center">当前上限 ${pol.auto.termMax} 个月</span>
          </div>
        </div>`;
      }
      if (d.multi) {
        return `<div class="cl-dim">
          <div class="cl-label">${d.label}</div>
          <div class="chipset" data-pdim="${d.k}" data-multi="1">
            ${d.opts.map(o => `<span class="chip ${allowed.indexOf(o) >= 0 ? 'on' : ''}"
              data-opt="${U.esc(o)}">${U.esc(o)}</span>`).join('')}
          </div>
        </div>`;
      }
      const cur = pol.auto[d.k] || [];
      return `<div class="cl-dim">
        <div class="cl-label">${d.label}</div>
        <div class="chipset" data-pdim="${d.k}" data-multi="1">
          ${d.opts.map(o => `<span class="chip ${cur.indexOf(o) >= 0 ? 'on' : ''}"
            data-opt="${U.esc(o)}">${U.esc(o)}</span>`).join('')}
        </div>
      </div>`;
    };

    return `
    <div class="card mb12">
      <div class="card-h">
        <h3>自动成交</h3>
        <span class="pill ${on ? 'ok' : 'm'}">${on ? '已启用' : '已关闭'}</span>
        <div class="switch ${on ? 'on' : ''}" data-psw="enabled" style="margin-left:auto"></div>
      </div>
      <p class="small" style="color:var(--ink-2);line-height:1.7">
        开启后，采购方在「询价谈条款」里勾选的维度如果全部落在下面的放行区间内，
        <b>系统直接生成订单</b>，不经过你。超出区间的部分才会进你的待办。
      </p>
      ${cov ? `<div class="note c" style="margin-top:11px">${I.info}
        <div>效果参考：这件作品近期有 <b>${cov.total}</b> 条询价，其中
        <b>${cov.auto}</b> 条可自动成交（<b>${cov.rate}%</b>）。
        ${cov.rate < 50 ? '放行区间偏窄，可以考虑用条款包快速放宽。' : ''}</div></div>` : ''}
    </div>

    <div class="card mb12">
      <div class="card-h"><h3>快速套用条款包</h3>
        <span class="more">${curPack ? '当前：' + (packs.find(p => p.id === curPack) || {}).label : '未套用'}</span></div>
      <div class="pack-grid">
        ${packs.map(p => `
          <div class="pack ${curPack === p.id ? 'on' : ''}" data-pack="${p.id}">
            <b>${U.esc(p.label)}</b>
            <p>${U.esc(p.desc)}</p>
            <span class="pack-go">${curPack === p.id ? '已套用' : '套用'}</span>
          </div>`).join('')}
      </div>
      <div class="hint mt8">套用会覆盖下面的放行区间，之后仍可逐项微调。</div>
    </div>

    <div class="card mb12">
      <div class="card-h"><h3>放行区间</h3>
        <span class="more">勾选的组合可自动成交</span></div>
      ${CG.CLAUSE.map(dimRow).join('')}
      <div class="hint mt8">至少勾一个选项；全部取消会导致没有询价能自动成交。</div>
    </div>

    ${hints.length ? `<div class="card mb12">
      <div class="card-h"><h3>建议放宽</h3>
        <span class="pill w">${hints.length} 条</span></div>
      <p class="hint" style="margin-bottom:10px">
        这些维度你已经手动接受过多次，说明实际业务里有需求。放宽后能减少人工回签。
      </p>
      ${hints.map(h => `<div class="srow">
        <div class="tx"><b>${U.esc(h.dim)}</b>
          <span>已被你手动接受 ${h.count} 次</span></div>
        <button class="btn xs" data-widen="${U.esc(h.dim)}">放宽这一维</button>
      </div>`).join('')}
    </div>` : ''}

    <div class="card">
      <div class="card-h"><h3>当前策略摘要</h3></div>
      <div class="fgrid">
        ${CG.CLAUSE.map(d => {
      let v;
      if (d.k === 'term') v = '≤ ' + pol.auto.termMax + ' 个月';
      else v = (pol.auto[d.k] || []).join('、') || '未放行';
      return `<div><div class="hint">${d.label}</div><b class="small">${U.esc(v)}</b></div>`;
    }).join('')}
      </div>
      <div class="row mt12">
        <button class="btn" data-act="resetPolicy">恢复默认</button>
        <span class="hint">修改会立即保存。</span>
      </div>
    </div>`;
  }

  /* ---------------- 授权配置 ---------------- */
  function tabLicense(w, ctx) {
    const lic = ctx.lic;
    const all = Object.keys(CG.LICENSE_KINDS);
    const missing = all.filter(k => !lic.some(l => l.kind === k));
    return `
    <div class="note c">${I.info}<div>每开一种授权，作品就会以对应价格出现在<b>素材市场</b>。
      采购方下单后你会收到询价，回签即生成合约与入账记录。
      <br><b>价格联动：</b>这里显示的是<b>市场标价</b>，由「基准价 × 自动策略的默认条款系数」算出。
      改了策略，标价会跟着变，不会再出现「直购价比自动成交价还低」的倒挂。</div></div>

    <div class="g2 mt12">
      <div class="card">
        <div class="card-h"><h3>已配置的授权</h3><span class="more">${lic.length} 种</span></div>
        ${lic.length ? lic.map(l => {
      const k = U.licOf(l.kind);
      return `<div class="liccard ${l.on ? 'on' : ''} mb8">
              <div class="lc-h"><b>${k.label}</b><span class="pr">${U.money(CG.listPrice(w, l))}</span></div>
              <p>${U.esc(k.desc)}</p>
              <div class="lc-f">
                <span>${U.esc(l.region)}</span>
                <span>${l.term >= 999 ? '永久' : l.term + ' 个月'}</span>
                <span>${l.resell ? '可转授权' : '不可转授权'}</span>
                <span>${U.esc(k.unitLabel)}</span>
              </div>
              <div class="lc-price-note">
                市场标价 ${U.money(CG.listPrice(w, l))}
                · 基准价 ${U.money(l.price)}
                ${CG.listPrice(w, l) !== l.price
        ? `<b class="up">策略系数 ×${(CG.listPrice(w, l) / l.price).toFixed(1)}</b>`
        : '<span class="ok">与基准价一致</span>'}
              </div>
              <div class="row mt8">
                <button class="btn xs" data-ltoggle="${l.id}">${l.on ? '关闭' : '开启'}</button>
                <button class="btn xs" data-ledit="${l.id}">改价格</button>
                <button class="btn xs danger" data-ldel="${l.id}">删除</button>
              </div>
            </div>`;
    }).join('') : `<p class="hint">还没有配置授权，从右侧选一种开始。</p>`}
      </div>

      <div class="card">
        <div class="card-h"><h3>添加授权类型</h3></div>
        ${missing.length ? missing.map(k => {
      const info = U.licOf(k);
      return `<div class="liccard mb8" data-addlic="${k}">
                <div class="lc-h"><b>${U.esc(info.label)}</b>
                  <span class="pr" style="color:var(--muted);font-size:11px">点此添加</span></div>
                <p>${U.esc(info.desc)}</p>
              </div>`;
    }).join('') : `<p class="hint">五种授权类型都已配置。</p>`}

        <div class="sep"></div>
        <div class="card-h"><h3>上架条件</h3></div>
        <div class="srow"><div class="tx"><b>已存证</b><span>链上存证或时间戳至少一项</span></div>
          <span class="pill ${(w.evidence.chain.on || w.evidence.tsa.on) ? 'ok' : 'd'}">${(w.evidence.chain.on || w.evidence.tsa.on) ? '满足' : '缺失'}</span></div>
        <div class="srow"><div class="tx"><b>至少一种授权在售</b><span>否则市场里看不到</span></div>
          <span class="pill ${lic.some(l => l.on) ? 'ok' : 'd'}">${lic.some(l => l.on) ? '满足' : '缺失'}</span></div>
        <div class="srow"><div class="tx"><b>肖像 / 声音授权文件</b><span>含则必须补齐</span></div>
          <span class="pill ${ctx.canList ? 'ok' : 'd'}">${ctx.canList ? '满足' : '缺失'}</span></div>
      </div>
    </div>`;
  }

  /* ---------------- 维权动态 ---------------- */
  function tabDispute(w, ctx) {
    const list = ctx.disp;
    return `
    <div class="g2">
      <div class="card">
        <div class="card-h"><h3>侵权线索</h3><span class="more">${list.length} 条</span></div>
        ${list.length ? `<table>
          <thead><tr><th>编号</th><th>来源</th><th>相似度</th><th>状态</th><th></th></tr></thead>
          <tbody>${list.map(d => `<tr>
            <td class="mono">${U.esc(d.id)}</td>
            <td>${U.esc(d.platform)}<div class="hint">${U.esc(d.note)}</div></td>
            <td class="num">${d.match}%</td>
            <td>${pill(d.status)}</td>
            <td>${d.status === 'open' ? `<button class="btn xs" data-disp="${d.id}">处置</button>` : '<span class="hint">已处理</span>'}</td>
          </tr>`).join('')}</tbody></table>`
        : `<p class="hint">这件作品目前没有侵权线索。</p>`}
        <div class="note w mt12">${I.warn}<div>「相似度」是<strong>指纹匹配度</strong>，不等于侵权认定。
          正式维权前需要人工确认权属与使用场景。平台不代替你作出法律判断。</div></div>
      </div>
      <div class="card">
        <div class="card-h"><h3>处置流程</h3></div>
        <div class="tl">
          <div class="tli done"><b>发现线索</b><time>指纹比对命中</time><p>系统在监测范围内发现高相似内容。</p></div>
          <div class="tli done"><b>人工确认</b><time>需你操作</time><p>查看对比、确认是否属于未授权使用。</p></div>
          <div class="tli ${list.some(d => d.status === 'letter') ? 'done' : ''}"><b>发送通知 / 律师函</b><time>走合作律所</time><p>可选用平台模板，也可自行委托。</p></div>
          <div class="tli ${list.some(d => d.status === 'takedown') ? 'done' : ''}"><b>平台下架</b><time>依赖对方配合</time><p>跨境场景下平台响应时间差异较大。</p></div>
          <div class="tli ${list.some(d => d.status === 'settled') ? 'done' : ''}"><b>和解或索赔</b><time>结果回填</time><p>赔偿金额与到账进度会进入收入中心。</p></div>
        </div>
      </div>
    </div>`;
  }

  /* ---------------- 收入明细 ---------------- */
  function tabRevenue(w, ctx) {
    const list = ctx.revs.slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
    const sum = list.reduce((s, r) => s + r.amount, 0);
    const pend = list.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
    return `
    <div class="kpis">
      <div class="kpi gold"><div class="lb">这件作品累计</div><div class="vl">${U.money(sum)}</div>
        <div class="dl">${list.length} 笔</div></div>
      <div class="kpi cy"><div class="lb">待结算</div><div class="vl">${U.money(pend)}</div>
        <div class="dl">已确认，等待打款</div></div>
      <div class="kpi"><div class="lb">已结算</div><div class="vl">${U.money(sum - pend)}</div>
        <div class="dl">可提现</div></div>
      <div class="kpi"><div class="lb">分成比例</div><div class="vl">88%</div>
        <div class="dl">平台佣金 12%</div></div>
    </div>
    <div class="card">
      <div class="card-h"><h3>收入流水</h3><span class="more">按时间倒序</span></div>
      ${list.length ? `<table>
        <thead><tr><th>时间</th><th>授权类型</th><th>合约</th><th>结算</th><th style="text-align:right">金额</th><th>状态</th></tr></thead>
        <tbody>${list.map(r => {
      const k = U.licOf(r.kind);
      return `<tr>
            <td class="mono">${U.dt(r.at).slice(5)}</td>
            <td><span class="pill ${k.pill}">${k.short}</span></td>
            <td class="mono">${U.esc(r.contract)}</td>
            <td>${pill(r.way)}</td>
            <td class="num"><span class="amt">${U.money2(r.amount)}</span></td>
            <td>${r.status === 'settled' ? '<span class="pill ok">已结算</span>' : '<span class="pill w">待结算</span>'}</td>
          </tr>`;
    }).join('')}</tbody></table>` : '<p class="hint">还没有收入记录。</p>'}
    </div>`;
  }

  /* ---------------- 宣发 ---------------- */
  function tabMarketing(w) {
    const mk = w.marketing || {};
    return `
    <div class="g2e">
      <div class="card">
        <div class="card-h"><h3>宣发状态</h3>
          <span class="pill ${mk.on ? 'ok' : 'm'}">${mk.on ? '已发布' : '未发布'}</span></div>
        ${mk.on ? `
          <div class="promo-hero" style="margin-bottom:10px">
            <img src="${U.cover(w)}" alt="">
            <div class="ov"><b>${U.esc(mk.headline || w.title)}</b>
              <span>渠道：${(mk.channels || []).map(c => ({ market: '素材市场', homepage: '平台首页', hktdc: 'FILMART 专区' }[c] || c)).join(' / ') || '—'}</span></div>
          </div>
          <div class="row">
            <button class="btn sm" data-act="editPromo">改文案</button>
            <button class="btn sm danger" data-act="stopPromo">停止宣发</button>
          </div>` : `
          <p class="hint">还没有发布宣发。发布后作品会出现在素材市场推荐位，并获得独立的推广链接。</p>
          <button class="btn pri wide mt12" data-act="goPromo">${I.megaphone}去发布宣发</button>`}
      </div>
      <div class="card">
        <div class="card-h"><h3>曝光趋势</h3><span class="more">近 12 天</span></div>
        ${(() => {
        const ex = (mk.exposure || []).slice(-12);
        const max = Math.max.apply(null, ex.concat([1]));
        return `<div class="bars">${ex.map((v, i) =>
          `<div class="b" style="height:${Math.max(4, v / max * 100)}%" title="第 ${i + 1} 天：${v} 次曝光"></div>`).join('')}</div>
          <div class="bars-x">${ex.map((v, i) => `<span>${i + 1}</span>`).join('')}</div>`;
      })()}
        <div class="hint mt8">累计曝光 ${(mk.exposure || []).reduce((a, b) => a + b, 0).toLocaleString()} 次</div>
      </div>
    </div>
    <div class="card">
      <div class="card-h"><h3>推广物料</h3><span class="more">可下载</span></div>
      <div class="material">
        <div class="mati" data-mat="封面图 16:10"><div class="mv">1600 × 1000</div>
          <div class="md"><b>封面图</b><span>市场卡片用</span></div></div>
        <div class="mati" data-mat="竖版海报 3:4"><div class="mv">1080 × 1440</div>
          <div class="md"><b>竖版海报</b><span>朋友圈 / 小红书</span></div></div>
        <div class="mati" data-mat="授权说明卡"><div class="mv">A4 版式</div>
          <div class="md"><b>授权说明卡</b><span>发给采购方</span></div></div>
        <div class="mati" data-mat="存证凭证 PDF"><div class="mv">含链上记录</div>
          <div class="md"><b>存证凭证</b><span>投标 / 提案用</span></div></div>
      </div>
      <div class="hint mt8">物料为演示占位，点击会提示生成位置。</div>
    </div>`;
  }

  /* ========================================================== 挂载事件 */
  CG.views.work.after = function (args) {
    const id = args[0], tab = args[1] || 'overview';
    const w = CG.work(id); if (!w) return;
    const root = document.getElementById('view');
    const save = () => { CG.save(); CG.recompute(); CG.syncBadges(); CG.render() };

    CG.bind(root, {
      edit: () => editWork(w, save),
      cert: () => showCert(w),
      online: () => {
        if (!(w.evidence.chain.on || w.evidence.tsa.on)) return CG.toast('先完成存证才能上架', 'err');
        if (!(w.licenses || []).some(l => l.on)) return CG.toast('先在「授权配置」里开启至少一种授权', 'err');
        if ((w.rights.portrait || w.rights.voice) && !w.rights.docs) return CG.toast('含肖像/声音，需先补充授权文件', 'err');
        w.status = 'listed'; w.stats.views = w.stats.views || 0;
        CG.toast('作品已上架素材市场', 'ok'); save();
      },
      offline: () => CG.confirm('下架作品', '下架后素材市场里不再展示，已签合约不受影响。', () => {
        w.status = 'offline'; CG.toast('已下架'); save();
      }, '确认下架'),
      uploadDocs: () => CG.confirm('补充权属文件', '演示环境下会直接记为「已上传 1 份文件」。<br>正式版这里应该接文件上传。', () => {
        w.rights.docs = (w.rights.docs || 0) + 1;
        CG.toast('权属文件已记录', 'ok'); save();
      }, '模拟上传'),
      applyReg: () => CG.modal(`
        <div style="padding:18px 20px">
          <div class="card-h"><h3>作品自愿登记</h3></div>
          <p class="small" style="line-height:1.7;color:var(--ink-2)">
            平台可以代你提交作品自愿登记申请，登记完成后会回填登记号与 DCI 编码。
            登记证书的效力高于链上存证，但需要人工审核，通常需要数周。</p>
          <div class="note w mt12">${I.warn}<div>香港没有区块链存证的法定推定规则；内地《人民法院在线诉讼规则》第 16 条是可反驳的推定，且只覆盖上传之后的完整性。所以登记这条路必须与链上存证并列展示。</div></div>
          <div class="row mt16" style="justify-content:flex-end">
            <button class="btn" data-close>知道了</button>
            <button class="btn pri" id="regGo">模拟提交申请</button>
          </div>
        </div>`, {
        onMount(panel, close) {
          panel.querySelector('#regGo').onclick = () => {
            w.evidence.registry = { on: true, org: '中国版权保护中心（演示）', no: '国作登字-2026-F-00' + Math.floor(1000 + Math.random() * 8999), dci: 'DCI-C-2026-' + Math.floor(1000 + Math.random() * 8999) };
            close(); CG.toast('登记信息已回填（演示）', 'ok'); save();
          };
        }
      }),
      goPromo: () => CG.go('promote/' + w.id),
      editPromo: () => CG.go('promote/' + w.id),
      stopPromo: () => CG.confirm('停止宣发', '停止后作品不再出现在推荐位，但仍在素材市场可搜到。', () => {
        w.marketing.on = false; CG.toast('已停止宣发'); save();
      }, '停止')
    });

    // 授权配置
    U.qsa('[data-addlic]', root).forEach(el => el.onclick = () => addLicense(w, el.dataset.addlic, save));
    U.qsa('[data-ltoggle]', root).forEach(el => el.onclick = () => {
      const l = w.licenses.find(x => x.id === el.dataset.ltoggle);
      if (l) { l.on = !l.on; CG.toast(l.on ? '已开启' : '已关闭'); save() }
    });
    U.qsa('[data-ledit]', root).forEach(el => el.onclick = () => {
      const l = w.licenses.find(x => x.id === el.dataset.ledit);
      if (!l) return;
      const v = prompt('输入新的基准价（元）\n市场标价 = 基准价 × 当前策略系数', l.price);
      if (v == null) return;
      const n = Number(v);
      if (!n || n <= 0) return CG.toast('价格不合法', 'err');
      l.price = n; CG.toast('价格已更新', 'ok'); save();
    });
    U.qsa('[data-ldel]', root).forEach(el => el.onclick = () => {
      const l = w.licenses.find(x => x.id === el.dataset.ldel);
      if (!l) return;
      CG.confirm('删除授权', '删除后该授权会从市场下架，已签合约不受影响。', () => {
        w.licenses = w.licenses.filter(x => x.id !== l.id); CG.toast('已删除'); save();
      }, '删除');
    });
    U.qsa('[data-disp]', root).forEach(el => el.onclick = () => {
      const d = CG.state.disputes.find(x => x.id === el.dataset.disp);
      if (!d) return;
      CG.modal(`
        <div style="padding:18px 20px">
          <div class="card-h"><h3>处置侵权线索 ${U.esc(d.id)}</h3></div>
          <p class="small" style="color:var(--ink-2)">${U.esc(d.platform)} · 相似度 ${d.match}% · ${U.esc(d.note)}</p>
          <div class="chipset mt12" id="dispActs">
            <span class="chip" data-go="letter">发律师函</span>
            <span class="chip" data-go="takedown">平台投诉下架</span>
            <span class="chip" data-go="settled">标记为已和解</span>
          </div>
          <div class="row mt16" style="justify-content:flex-end">
            <button class="btn" data-close>取消</button></div>
        </div>`, {
        onMount(panel, close) {
          U.qsa('.chip', panel).forEach(c => c.onclick = () => {
            d.status = c.dataset.go;
            close(); CG.toast('状态已更新为「' + U.statusPill(d.status)[0] + '」', 'ok'); save();
          });
        }
      });
    });
    U.qsa('[data-mat]', root).forEach(el => el.onclick = () =>
      CG.toast('演示环境不生成真实文件：' + el.dataset.mat, 'ok'));

    // ---- 自动策略 tab ----
    if (tab === 'policy') bindPolicy(w, save);
  };


  /* ---------------- 策略页事件 ---------------- */
  function bindPolicy(w, save) {
    const root = document.getElementById('view');
    if (!w.policy) w.policy = CG.workPolicy(w);
    const pol = w.policy;
    if (pol.enabled === undefined) pol.enabled = true;

    const sw = root.querySelector('[data-psw="enabled"]');
    if (sw) sw.onclick = () => {
      pol.enabled = !pol.enabled;
      CG.toast(pol.enabled ? '已启用自动成交' : '已关闭自动成交');
      save();
    };

    root.querySelectorAll('[data-pack]').forEach(el => el.onclick = () => {
      const p = CG.POLICY_PACKS.find(x => x.id === el.dataset.pack);
      if (!p) return;
      pol.auto = JSON.parse(JSON.stringify(p.auto));
      pol.pack = p.id;
      CG.toast('已套用「' + p.label + '」', 'ok');
      save();
    });

    // 维度勾选
    root.querySelectorAll('[data-pdim]').forEach(set => {
      const dim = set.dataset.pdim;
      if (dim === 'term') {
        set.querySelectorAll('[data-termv]').forEach(chip => {
          chip.onclick = () => {
            const v = Number(chip.dataset.termv);
            pol.auto.termMax = (pol.auto.termMax === v) ? Math.max(6, v - 12) : v;
            pol.pack = 'custom';
            save();
          };
        });
        return;
      }
      set.querySelectorAll('.chip').forEach(chip => {
        chip.onclick = () => {
          const opt = chip.dataset.opt;
          const arr = pol.auto[dim] || (pol.auto[dim] = []);
          const i = arr.indexOf(opt);
          if (i >= 0) {
            if (arr.length === 1) return CG.toast('至少保留一项', 'err');
            arr.splice(i, 1);
          } else {
            arr.push(opt);
          }
          pol.pack = 'custom';
          save();
        };
      });
    });

    // 飞轮：放宽某一维
    root.querySelectorAll('[data-widen]').forEach(el => el.onclick = () => {
      const dimName = el.dataset.widen;
      const d = CG.CLAUSE.find(x => x.label === dimName);
      if (!d) return;
      if (d.k === 'term') {
        pol.auto.termMax = 36;
      } else {
        pol.auto[d.k] = d.opts.slice();
      }
      pol.pack = 'custom';
      CG.toast('已放宽「' + dimName + '」', 'ok');
      save();
    });

    CG.bind(root, {
      resetPolicy: () => CG.confirm('恢复默认策略', '会把放行区间重置为平台默认值。', () => {
        w.policy = JSON.parse(JSON.stringify(CG.DEFAULT_POLICY));
        w.policy.enabled = true;
        CG.toast('已恢复默认');
        save();
      }, '恢复')
    });
  }

  /* ---------------- 编辑作品 ---------------- */
  function editWork(w, done) {
    CG.modal(`
      <div style="padding:18px 20px">
        <div class="card-h"><h3>编辑作品信息</h3></div>
        <div class="fgrid">
          <div class="fld full"><label>作品名称</label><input id="eTitle" value="${U.esc(w.title)}"></div>
          <div class="fld"><label>系列</label><input id="eSeries" value="${U.esc(w.series || '')}"></div>
          <div class="fld"><label>创作完成日期</label><input id="eDate" type="date" value="${U.date(w.createdAt)}"></div>
          <div class="fld full"><label>简介</label><textarea id="eDesc" rows="2">${U.esc(w.desc || '')}</textarea></div>
          <div class="fld full"><label>标签</label><input id="eTags" value="${U.esc((w.tags || []).join(', '))}"></div>
        </div>
        <div class="row mt16" style="justify-content:flex-end">
          <button class="btn" data-close>取消</button>
          <button class="btn pri" id="eSave">保存</button>
        </div>
      </div>`, {
      onMount(panel, close) {
        panel.querySelector('#eSave').onclick = () => {
          const g = id => (panel.querySelector('#' + id) || {}).value || '';
          if (!g('eTitle').trim()) return CG.toast('名称不能为空', 'err');
          w.title = g('eTitle').trim(); w.series = g('eSeries').trim();
          w.createdAt = g('eDate') || w.createdAt; w.desc = g('eDesc').trim();
          w.tags = g('eTags').split(/[,，]/).map(x => x.trim()).filter(Boolean);
          close(); CG.toast('已保存', 'ok'); done();
        };
      }
    });
  }

  /* ---------------- 存证凭证 ---------------- */
  function showCert(w) {
    const mk = (on, t, v) => `<div class="srow"><div class="tx"><b>${t}</b><span>${U.esc(v)}</span></div>
      <span class="pill ${on ? 'ok' : 'm'}">${on ? '已具备' : '未办理'}</span></div>`;
    CG.modal(`
      <div style="padding:18px 20px">
        <div class="card-h"><h3>存证凭证</h3><span class="more mono">${U.esc(w.id.toUpperCase())}</span></div>
        <div class="cert">
          <div class="cert-h"><span class="ci-c">${I.shield}</span><b>CineGBA 存证凭证</b></div>
          <div class="cert-sub">演示样本 · 非法律文件</div>
          <div class="cert-grid">
            <div><span class="k">作品名称</span><span class="v">${U.esc(w.title)}</span></div>
            <div><span class="k">文件</span><span class="v">${U.esc(w.file.name)}</span></div>
            <div><span class="k">指纹哈希</span><span class="v">${U.esc((w.fingerprints[0] || {}).hash || '—')}</span></div>
            <div><span class="k">链上交易</span><span class="v">${U.esc(w.evidence.chain.tx)}</span></div>
            <div><span class="k">时间戳</span><span class="v">${U.esc(w.evidence.tsa.stamp)}</span></div>
            <div><span class="k">生成时间</span><span class="v">${U.now()}</span></div>
          </div>
        </div>
        <div class="mt12">
          ${mk(w.evidence.chain.on, '链上存证', w.evidence.chain.at)}
          ${mk(w.evidence.registry.on, '作品自愿登记', w.evidence.registry.no)}
          ${mk(w.evidence.tsa.on, '可信时间戳', w.evidence.tsa.at)}
        </div>
        <div class="note w">${I.warn}<div>存证不等于确权。此凭证用于证明「该时点存在该指纹」，不构成权属的法定推定。</div></div>
        <div class="row mt16" style="justify-content:flex-end">
          <button class="btn" data-close>关闭</button>
          <button class="btn pri" id="certDl">下载凭证（模拟）</button>
        </div>
      </div>`, {
      onMount(panel, close) {
        panel.querySelector('#certDl').onclick = () => {
          const txt = `CineGBA 存证凭证（演示）\n作品：${w.title}\n编号：${w.id}\n文件：${w.file.name}\n指纹：${(w.fingerprints[0] || {}).hash || '—'}\n链上：${w.evidence.chain.tx}\n时间：${U.now()}\n\n本凭证用于证明该时点存在该指纹，不构成权属的法定推定。`;
          const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `存证凭证_${w.title}.txt`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 3000);
          CG.toast('凭证已下载到浏览器下载目录', 'ok');
        };
      }
    });
  }

  /* ---------------- 添加授权 ---------------- */
  function addLicense(w, kind, done) {
    const k = U.licOf(kind);
    const base = { 'ai-training': 1000, clip: 150, adaptation: 30000, full: 200000, editorial: 80 }[kind] || 500;
    CG.modal(`
      <div style="padding:18px 20px">
        <div class="card-h"><h3>添加：${U.esc(k.label)}</h3></div>
        <p class="small" style="color:var(--muted);line-height:1.6">${U.esc(k.desc)}</p>
        <div class="fgrid mt12">
          <div class="fld"><label>价格（元）</label><input id="alPrice" type="number" value="${base}"></div>
          <div class="fld"><label>期限（月，999 为永久）</label><input id="alTerm" type="number" value="12"></div>
          <div class="fld"><label>适用范围</label>
            <select id="alRegion">
              <option>中国内地</option><option>香港</option>
              <option selected>中国内地 / 香港</option><option>全球</option>
            </select></div>
          <div class="fld"><label>可否转授权</label>
            <select id="alResell"><option value="0">不可转授权</option><option value="1">可转授权</option></select></div>
        </div>
        <div class="note c mt12">${I.info}<div>这里填的是<b>基准价</b>（对应最基础的条款组合）。
          实际市场标价 = 基准价 × 当前自动策略的系数，加价后的部分由采购方承担。</div></div>
        <div class="row mt16" style="justify-content:flex-end">
          <button class="btn" data-close>取消</button>
          <button class="btn pri" id="alSave">添加并上架</button>
        </div>
      </div>`, {
      onMount(panel, close) {
        panel.querySelector('#alSave').onclick = () => {
          const g = id => panel.querySelector('#' + id).value;
          const price = Number(g('alPrice'));
          if (!price || price <= 0) return CG.toast('价格不合法', 'err');
          w.licenses = w.licenses || [];
          w.licenses.push({
            id: U.uid('l'), kind, price: price,
            on: true, region: g('alRegion'),
            term: Number(g('alTerm')) || 12,
            resell: g('alResell') === '1'
          });
          if (w.status !== 'listed') w.status = 'listed';
          close(); CG.toast('已添加并上架', 'ok'); done();
        };
      }
    });
  }

  /* ========================================================== 市场详情（C 端） */
  CG.views.marketItem = function (args) {
    const id = args[0];
    const w = CG.work(id);
    if (!w || w.status !== 'listed') {
      return `<div class="empty">${I.empty}<b>该作品当前不可采购</b><p>可能已下架或未配置授权</p>
        <a class="btn" href="#/market">回素材市场</a></div>`;
    }
    const onLic = (w.licenses || []).filter(l => l.on);
    const similar = CG.state.works.filter(x => x.id !== id && x.status === 'listed').slice(0, 4);

    return `
    <div class="crumb"><a href="#/market">素材市场</a> / <span>${U.esc(w.title)}</span></div>
    <div class="g2" style="grid-template-columns:1.5fr 1fr">
      <div>
        <div class="card" style="padding:0;overflow:hidden">
          <div style="position:relative;background:var(--surface-3)">
            <img src="${U.cover(w)}" alt="${U.esc(w.title)}" style="width:100%;display:block">
            <div class="wm">CineGBA PREVIEW</div>
            <div class="mkt-cover lic" style="position:absolute;left:10px;bottom:10px;display:flex;gap:5px">
              ${onLic.map(l => `<span>${U.licOf(l.kind).short}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="card mt12">
          <div class="card-h"><h3>作品说明</h3></div>
          <p class="small" style="color:var(--ink-2);line-height:1.7">${U.esc(w.desc || '—')}</p>
          <div class="fgrid mt12">
            <div><div class="hint">类型</div><b class="small">${U.typeOf(w.type)}</b></div>
            <div><div class="hint">系列</div><b class="small">${U.esc(w.series || '—')}</b></div>
            <div><div class="hint">存证状态</div><b class="small">${w.evidence.chain.on ? '已链上存证' : '未存证'}</b></div>
            <div><div class="hint">浏览量</div><b class="small">${(w.stats.views || 0).toLocaleString()}</b></div>
          </div>
          <div class="mt8">${(w.tags || []).map(t => `<span class="pill m">${U.esc(t)}</span>`).join(' ')}</div>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="card-h"><h3>选择授权方式</h3></div>
          ${onLic.length ? onLic.map((l, i) => {
      const k = U.licOf(l.kind);
      return `<div class="liccard mb8" data-pick="${l.id}">
              <div class="lc-h"><b>${U.esc(k.label)}</b><span class="pr">${U.money(l.price)}</span></div>
              <p>${U.esc(k.desc)}</p>
              <div class="lc-f"><span>${U.esc(l.region)}</span>
                <span>${l.term >= 999 ? '永久' : l.term + ' 个月'}</span>
                <span>${l.resell ? '可转授权' : '不可转授权'}</span></div>
            </div>`;
    }).join('') : '<p class="hint">这件作品暂未开放授权。</p>'}
          <button class="btn pri wide mt12" data-act="inquiry" ${onLic.length ? '' : 'disabled'}>
            ${I.cart}提交采购询价</button>
          <div class="note c mt12">${I.info}<div>询价会进入版权方的待办。双方确认条款后在线签署合约，
            平台按成交额收取 <b>12%</b> 佣金。</div></div>
        </div>

        <div class="card mt12">
          <div class="card-h"><h3>版权方</h3></div>
          <div class="srow">
            <div class="avatar" style="width:34px;height:34px;font-size:12px">晨</div>
            <div class="tx"><b>${U.esc(CG.state.profile.org)}</b>
              <span>${U.esc(CG.state.profile.verifyLevel)} · 已通过实名</span></div>
            <span class="pill ok">可信</span>
          </div>
          <div class="hint mt8">采购后可获得：授权书、存证凭证、结算凭证。</div>
        </div>
      </div>
    </div>

    ${similar.length ? `<div class="card mt12">
      <div class="card-h"><h3>相似作品</h3><a class="more" href="#/market">更多 →</a></div>
      <div class="mktgrid">
        ${similar.map(x => `<div class="mkt" data-open="${x.id}">
          <div class="mkt-cover"><img src="${U.cover(x)}" alt="">
            <div class="wm">PREVIEW</div></div>
          <div class="mkt-body"><b>${U.esc(x.title)}</b>
            <div class="pr"><b>${U.money((x.licenses.find(l => l.on) || {}).price || 0)}</b>
              <span>起</span></div></div>
        </div>`).join('')}
      </div>
    </div>` : ''}`;
  };

  CG.views.marketItem.after = function (args) {
    const w = CG.work(args[0]); if (!w) return;
    const root = document.getElementById('view');
    let picked = ((w.licenses || []).find(l => l.on) || {}).id || null;
    const cards = U.qsa('[data-pick]', root);
    cards.forEach(c => {
      if (c.dataset.pick === picked) c.classList.add('on');
      c.onclick = () => {
        cards.forEach(x => x.classList.remove('on'));
        c.classList.add('on'); picked = c.dataset.pick;
      };
    });
    U.qsa('[data-open]', root).forEach(el => el.onclick = () => CG.go('market/' + el.dataset.open));

    CG.bind(root, {
      inquiry: () => {
        const l = (w.licenses || []).find(x => x.id === picked);
        if (!l) return CG.toast('先选择一种授权方式', 'err');
        const k = U.licOf(l.kind);
        CG.modal(`
          <div style="padding:18px 20px">
            <div class="card-h"><h3>提交采购询价</h3></div>
            <div class="srow"><div class="tx"><b>${U.esc(w.title)}</b>
              <span>${U.esc(k.label)} · ${U.money(l.price)}</span></div></div>
            <div class="fgrid mt12">
              <div class="fld full"><label>采购方名称 <i>*</i></label>
                <input id="iqName" placeholder="请输入公司或机构名称"></div>
              <div class="fld full"><label>使用场景说明</label>
                <textarea id="iqNote" rows="2" placeholder="例如：用于某模型的图像训练，仅内部评测"></textarea></div>
            </div>
            <div class="note c mt12">${I.info}<div>提交后版权方会在工作台看到这条询价。
              成交后平台收取 12% 佣金。此操作会真实写入数据。</div></div>
            <div class="row mt16" style="justify-content:flex-end">
              <button class="btn" data-close>取消</button>
              <button class="btn pri" id="iqGo">提交询价</button>
            </div>
          </div>`, {
          onMount(panel, close) {
            panel.querySelector('#iqGo').onclick = () => {
              const nm = panel.querySelector('#iqName').value.trim();
              if (!nm) return CG.toast('请填写采购方名称', 'err');
              CG.state.leads.unshift({
                id: U.uid('L'), workId: w.id, licensee: nm + '（市场询价）',
                kind: l.kind, price: l.price, status: 'pending', at: U.now(),
                note: panel.querySelector('#iqNote').value.trim() || '通过素材市场提交'
              });
              w.stats.inquiries = (w.stats.inquiries || 0) + 1;
              w.stats.views = (w.stats.views || 0) + 1;
              CG.state.notices.unshift({
                id: U.uid('N'), type: 'lead', at: U.now(),
                title: '新询价：' + w.title, body: nm + ' 询价「' + k.label + '」，等待版权方回签。'
              });
              CG.save(); CG.recompute(); CG.syncBadges(); close();
              CG.toast('询价已提交，版权方会在工作台看到', 'ok');
            };
          }
        });
      }
    });
  };

})();
