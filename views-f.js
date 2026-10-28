/* ==========================================================================
   视图 F：为什么是香港（四道门 + 过桥五步 + 实证）
   ========================================================================== */
(function () {
  'use strict';
  const CG = window.CG, U = CG.util, I = CG.icon;
  CG.views = CG.views || {};

  CG.GATES = [
    {
      n: '01', key: 'law', title: '法律确定性',
      short: 'TDM 豁免立法中，为 AI 训练定性',
      q: 'AI 训练到底合不合法，谁说了算？',
      lead: '全球多数法域还在打官司，香港正在把它写成条文。',
      facts: [
        { t: '《2022 年版权（修订）条例》2023-05-01 生效', d: '新增传播权，并为戏仿、讽刺、滑稽、模仿、引用、评论时事提供豁免。', s: '知识产权署' },
        { t: '政府 2024-02 建议引入 TDM 豁免', d: '向立法会建议为文本及数据开采设立版权豁免，让 AI 训练有明确法理基础。', s: '知识产权署文件' }
      ],
      why: '做授权交易，最怕的是「卖了以后说不清合不合法」。香港是少数正在给这件事定性的地方。',
      caveat: 'TDM 豁免目前仍在立法建议阶段，尚未生效。'
    },
    {
      n: '02', key: 'cert', title: '权利认证',
      short: 'MPIA 为国家版权局指定机构',
      q: '谁出的版权凭证，内地认不认？',
      lead: '香港有一家被国家版权局指定的电影版权认证机构。',
      facts: [
        { t: 'MPIA 获国家版权局委任', d: '香港影业协会自 1993 年起为国家版权局指定的香港电影作品版权认证及发证机构。', s: '国家版权局' },
        { t: '线上认证数据库自 2002 年运行', d: '认证记录可查，构成跨境授权时的权利基础。', s: '香港影业协会' }
      ],
      why: '跨境授权最实际的障碍是「你的凭证在对方那边算不算数」。这条路香港是通的。',
      caveat: '认证证明的是登记事实，不等于法院对权属的最终认定。'
    },
    {
      n: '03', key: 'gate', title: '双向通道',
      short: 'CEPA 北上免配额，东盟南下已验证',
      q: '一个剧本，能不能同时进内地和东盟？',
      lead: '北上免配额，南下已跑通，这是香港最不可替代的一条。',
      facts: [
        { t: 'CEPA：通过内地审查不受进口配额限制', d: '香港电影可不受进口配额限制进入内地，并可在内地投资设立电影制作公司。', s: '工业贸易署' },
        { t: '港片在星马印实际卖座', d: '香港与内地电影在新加坡、马来西亚、印尼表现突出，《破·地狱》《九龙城寨之围城》区内成绩佳。', s: 'HKTDC Research' },
        { t: '《给阿嬷的情书》香港与东盟同步上映', d: '2026-06-18 同步登陆香港、澳门、新加坡、马来西亚、文莱，海外票房破 1 亿人民币。', s: 'China Daily' }
      ],
      why: '把新剧本推向东盟，不是设想，是已经在发生的发行路径。香港是这条路径的结算与合约节点。',
      caveat: '配額豁免仍需通过内地审查；东盟各市场仍需本地发行伙伴。'
    },
    {
      n: '04', key: 'arb', title: '争议解决',
      short: '普通法 + 中英双语 + 国际仲裁',
      q: '出事了，去哪打官司？',
      lead: '普通法 + 中英双语 + 国际仲裁，是内地与东盟都能接受的第三地。',
      facts: [
        { t: 'HKIAC 仲裁中约 7.4% 涉知识产权等类型', d: '香港国际仲裁中心是区域内主要商事仲裁机构之一。', s: 'HKIAC 统计' },
        { t: '普通法体系，中英双语并行', d: '合约可双语并行拟订，判决与裁决在区域内认可度较高。', s: '制度事实' }
      ],
      why: '授权合约必须写清管辖。香港是少数双方都不排斥的选择。',
      caveat: '仲裁裁决的跨境执行仍依赖各法域的承认与执行安排。'
    }
  ];

  const BRIDGE = [
    { n: '认证', hk: 'MPIA 国家版权局指定机构', alt: '内地认可度不同', icon: 'shield' },
    { n: '定价', hk: '版权条例 + TDM 立法方向', alt: '法律不确定，不敢定价', icon: 'chart' },
    { n: '北上', hk: 'CEPA 配额豁免', alt: '需走进口配额', icon: 'arrow' },
    { n: '南下', hk: '东盟自贸协定 + 华语发行网络', alt: '无现成通道', icon: 'globe' },
    { n: '结算', hk: '普通法 + 国际仲裁', alt: '双方都不认', icon: 'scale' }
  ];

  const IC = {
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    scale: '<path d="M12 3v18M6 7h12M6 7l-3 7h6zM18 7l-3 7h6z"/>'
  };
  const sv = k => `<svg viewBox="0 0 24 24">${IC[k] || IC.shield}</svg>`;

  CG.views.whyhk = function () {
    return `
    <div class="wk-topbar">
      <button class="btn sm ghost" data-back-home>
        <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2">
          <path d="M19 12H5M11 6l-6 6 6 6"/></svg>
        收起，回首页
      </button>
    </div>

    <section class="wk-hero">
      <div class="wk-hero-bg"></div>
      <div class="wk-hero-in">
        <span class="wk-kicker">为什么是香港</span>
        <h1>AI 素材授权的四道门<br>只有这里同时开着</h1>
        <p class="wk-lead">
          做这件事，任何城市都能买到服务器、招到人、写出代码。
          真正决定成败的不是技术，而是四个制度条件：
          <b>法律确定性、权利认证、双向市场通道、争议解决地</b>。
          这四道门同时开着的，只有香港。
        </p>
        <div class="wk-quote">
          「不是我们更强，是这条路只有这里通。」
        </div>
      </div>
    </section>

    <section class="wk-gates">
      ${CG.GATES.map(g => `
        <article class="wk-gate">
          <div class="wk-gn">${g.n}</div>
          <h2>${g.title}</h2>
          <p class="wk-q">${g.q}</p>
          <p class="wk-lead2">${g.lead}</p>
          <div class="wk-facts">
            ${g.facts.map(f => `
              <div class="wk-f">
                <b>${U.esc(f.t)}</b>
                <p>${U.esc(f.d)}</p>
                <span class="wk-src">来源：${U.esc(f.s)}</span>
              </div>`).join('')}
          </div>
          <div class="wk-why"><b>对我们的意义</b>${g.why}</div>
          <div class="wk-cav">${I.warn}<span>${g.caveat}</span></div>
        </article>`).join('')}
    </section>

    <section class="wk-sec">
      <div class="wk-sec-h">
        <h2>所以叙事要换一个动词</h2>
        <p>从「帮你确权」改成「帮你过桥」。确权哪里都能讲，过桥只有这里能走。</p>
      </div>
      <div class="wk-bridge">
        ${BRIDGE.map((b, i) => `
          <div class="wk-step">
            <div class="wk-si">${sv(b.icon)}</div>
            <div class="wk-sb">
              <span class="wk-sn">${String(i + 1).padStart(2, '0')}</span>
              <b>${b.n}</b>
              <em>${U.esc(b.hk)}</em>
              <span class="wk-alt">换成别处：${U.esc(b.alt)}</span>
            </div>
          </div>`).join('')}
      </div>
      <div class="wk-note">
        ${I.info}
        <div>一个剧本在香港走完这五步，每一步都依赖一项本地制度才能成立。
          平台的作用是把这五步的产品化、可查询、可结算。</div>
      </div>
    </section>

    <section class="wk-sec alt">
      <div class="wk-sec-h">
        <h2>政策坐标：两个国家级定位正好拼成这件事</h2>
      </div>
      <div class="wk-policy">
        <div class="wk-p">
          <span class="wk-tag">十四五规划纲要</span>
          <b>区域知识产权贸易中心</b>
          <p>首次提出支持香港建设区域知识产权贸易中心，带动知识产权使用与商品化。</p>
          <span class="wk-src">来源：《十四五规划纲要》／2021 施政报告</span>
        </div>
        <div class="wk-plus">＋</div>
        <div class="wk-p">
          <span class="wk-tag">十四五规划纲要</span>
          <b>中外文化艺术交流中心</b>
          <p>明确支持香港发展中外文化艺术交流中心，为文化产业提供国家级定位。</p>
          <span class="wk-src">来源：《十四五规划纲要》／2021 施政报告</span>
        </div>
        <div class="wk-eq">＝</div>
        <div class="wk-p res">
          <span class="wk-tag">CineGBA 的位置</span>
          <b>影视 IP 跨境授权的基础设施</b>
          <p>一个管 IP 交易制度，一个管文化出海通道。合起来就是我们要做的事的政策依据。</p>
        </div>
      </div>
    </section>

    <section class="wk-sec">
      <div class="wk-sec-h">
        <h2>我们不夸大的部分</h2>
        <p>这套叙事能站住，靠的是边界清楚，不是形容词多。</p>
      </div>
      <div class="wk-limits">
        <div class="wk-l"><b>TDM 豁免尚未生效</b><p>目前是立法建议阶段。不能对外声称香港已确立 AI 训练的法定豁免。</p></div>
        <div class="wk-l"><b>配额豁免 ≠ 自动上映</b><p>CEPA 免除进口配额，但仍须通过内地审查，且需内地发行伙伴。</p></div>
        <div class="wk-l"><b>东盟不是单一市场</b><p>新加坡、马来西亚、印尼各有审查与发行体系，需要分别对接本地伙伴。</p></div>
        <div class="wk-l"><b>认证不等于司法确权</b><p>MPIA 认证证明登记事实，最终权属认定仍由法院裁判。</p></div>
        <div class="wk-l"><b>我们尚未与机构签约</b><p>与 MPIA、iProA、AMP4 等机构的合作仍在洽谈，官网不使用其标识。</p></div>
        <div class="wk-l"><b>跨境结算有硬约束</b><p>资金跨境受外汇与税务规则约束，不能靠「自动分账」绕开。</p></div>
      </div>
    </section>

    <section class="wk-cta">
      <h2>从一件作品开始走这条路</h2>
      <p>上传、认证、定价，然后看它能不能进内地、能不能往南走。</p>
      <div class="row" style="justify-content:center;gap:10px">
        <a class="btn pri lg" href="#/upload">${I.up}上传作品</a>
        <a class="btn lg" href="#/market">先看素材市场</a>
      </div>
    </section>`;
  };

  CG.views.whyhk.after = function () {
    const root = document.getElementById('view');
    root.querySelectorAll('[data-back-home]').forEach(el => el.onclick = () => {
      CG.ui.openGate = null;
      CG.go('home');
    });
  };

})();
