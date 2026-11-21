/* ==========================================================================
   公开页面：落地页 / 登录 / 注册
   渲染到 #public，不进侧栏
   ========================================================================== */
(function () {
  'use strict';
  const CG = window.CG, U = CG.util, I = CG.icon;
  CG.pages = CG.pages || {};

  const KINDS = ['ai-training', 'clip', 'adaptation', 'full', 'editorial'];

  /* ========================================================== 落地页 */
  /* 落地页顶部不再是「照片流」，而是「已存证清单」：
     每一格带印章 + 链上交易号 + 存证日期，一眼看出这些图是被登记过的。 */
  function lpStrip(n, skip) {
    const used = skip || [];
    const list = [].concat(
      (CG.virtual && CG.virtual.top ? CG.virtual.top(n + 6) : [])
    ).filter(w => w && used.indexOf(U.cover(w)) < 0);
    if (!list.length) return '';
    const picked = list.slice(0, n);
    if (!picked.length) return '';
    const cell = (w) => {
      const tx = (w.evidence && w.evidence.chain && w.evidence.chain.tx) || '0x—';
      const fp = String((w.fingerprints && w.fingerprints[0] && w.fingerprints[0].hash) || '');
      return `<div class="lp-evcell">
        <div class="lp-evph">
          <img src="${U.cover(w)}" alt="" loading="eager" decoding="async">
          ${CG.seal('已存證', 'sm')}
        </div>
        <div class="lp-evtx">${U.esc(tx)}</div>
        <div class="lp-evdt">${U.esc(w.createdAt)} · ${U.esc(fp.slice(0, 8))}</div>
      </div>`;
    };
    const row = (arr, cls) => `<div class="band-row ${cls}"><div class="band-track">
      ${arr.concat(arr).map(cell).join('')}</div></div>`;
    return `<div class="lp-strip">${row(picked, 'r1')}${row(picked.slice().reverse(), 'r2')}</div>`;
  }

  /* 主视觉轮播：一件作品一张卡，左右箭头翻页。
     每类的展示口径（规格 / 后缀 / 授权标签 / 起价）按类型给，避免所有卡长得一样。 */
  const CAR_CFG = {
    video: { kind: '视频', spec: '4K · 24fps', suffix: '· 全片', price: '1,200', lic: ['AI 训练授权', '片段引用', '改编权'] },
    image: { kind: '图片', spec: '6000×4000', suffix: '· 设定集', price: '680', lic: ['AI 训练授权', '片段引用'] },
    audio: { kind: '音频', spec: '48k · 24bit', suffix: '· 配乐', price: '360', lic: ['片段引用', '改编权'] },
    doc: { kind: '剧本文档', spec: '48 页 · PDF', suffix: '· 剧本', price: '2,400', lic: ['改编权', '片段引用'] },
    model: { kind: '3D 模型', spec: 'PBR · GLB', suffix: '· 角色模型', price: '1,900', lic: ['AI 训练授权', '片段引用'] }
  };
  const CAR_OWNERS = ['星野影像（香港）', '北岸概念艺术', '雾港声音设计', '孤山剧作社', '纸鸢三维工作室', '潮汐视觉数字科技'];

  function showcaseItems(n) {
    const types = Object.keys(CAR_CFG);
    const out = [];
    for (let i = 0; out.length < n && i < n * 8; i++) {
      const t = types[i % types.length];
      const pool = (CG.COVER_POOL && CG.COVER_POOL[t]) || [];
      if (!pool.length) continue;
      const e = pool[Math.floor(i / types.length) % pool.length];
      if (!e || out.some(x => x.f === e.f)) continue;
      const c = CAR_CFG[t];
      out.push({
        f: e.f, subject: e.s || '未命名素材',
        kind: c.kind, spec: c.spec, suffix: c.suffix, price: c.price, lic: c.lic,
        owner: CAR_OWNERS[i % CAR_OWNERS.length]
      });
    }
    return out;
  }

  /* 落地页主视觉：多件作品的可翻页轮播。
     原来是单张卡 + 一枚浮在下面的存证凭证（被嫌多余，已删掉）；
     现在一次能翻 6 件，左右大箭头，任何人都看得出能点。 */
  function lpCarousel(items) {
    if (!items.length) return '';
    const slides = items.map((it, i) => `
        <article class="lp-slide" aria-hidden="${i ? 'true' : 'false'}">
          <div class="lp-show">
            <div class="lp-show-media">
              <img src="${it.f}" alt="${U.esc(it.subject)}" loading="${i < 2 ? 'eager' : 'lazy'}">
              <span class="lp-show-spec">${U.esc(it.spec)}</span>
              <span class="lp-show-wm">CineGBA</span>
              <span class="lp-show-count">${i + 1} / ${items.length}</span>
            </div>
            <div class="lp-show-body">
              <div class="lp-show-h">
                <b>${U.esc(it.subject)} ${U.esc(it.suffix)}</b>
                <span class="pill ok">在售</span>
              </div>
              <div class="lp-show-own">${U.esc(it.owner)} · ${U.esc(it.kind)} · 入库 2026-09-24</div>
              <div class="lp-show-badges">
                ${it.lic.map(l => `<span>${U.esc(l)}</span>`).join('')}
              </div>
              <div class="lp-show-foot">
                <b>¥${U.esc(it.price)}</b><span>起</span>
                <em>询价 →</em>
              </div>
            </div>
          </div>
        </article>`).join('');

    const dots = items.map((_, i) =>
      `<button class="lp-car-dot${i ? '' : ' on'}" data-car-go="${i}" aria-label="第 ${i + 1} 件"></button>`).join('');

    return `
      <div class="lp-car" id="lpCar" data-count="${items.length}">
        <div class="lp-car-view"><div class="lp-car-track" id="lpCarTrack">${slides}</div></div>
        <button class="lp-car-btn prev" data-car-prev aria-label="上一件作品">
          <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <button class="lp-car-btn next" data-car-next aria-label="下一件作品">
          <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </button>
        <div class="lp-car-dots">${dots}</div>
      </div>`;
  }

  CG.pages.landing = function () {
    const carItems = showcaseItems(6);
    return `
<div class="lp">

  <header class="lp-nav">
    <a class="lp-logo" href="#/">
      <div class="logo">CG</div>
      <div><b>CineGBA IP-Bridge</b><span>影视动漫 AI 资产确权与合规授权</span></div>
    </a>
    <nav class="lp-links">
      <a href="#capabilities" data-i18n="lp.navCap">能力</a>
      <a href="#how" data-i18n="lp.navHow">流程</a>
      <a href="#licensing" data-i18n="lp.navLic">授权类型</a>
      <a href="#boundary" data-i18n="lp.navBoundary">边界</a>
    </nav>
    <div class="lp-act">
      <button class="langbtn" data-lang-btn type="button" aria-label="切换到英文">EN</button>
      <a class="btn lp-btn-ghost" href="#/login" data-i18n="lp.login">登录</a>
      <a class="btn pri lp-btn-pri" href="#/register" data-i18n="lp.join">免费入驻</a>
    </div>
  </header>

  ${lpStrip(15, carItems.map(x => x.f))}

  <section class="lp-hero">
    <div class="lp-hero-tx">
      <span class="lp-kicker" data-i18n="lp.kicker">香港 · 粤港澳大湾区</span>
      <h1 data-i18n="lp.h1">让每一帧素材<br>可授权、可结算、可举证</h1>
      <p class="lp-lead" data-i18n="lp.lead">
        影视动漫公司的素材长期被白用、被压价、被拿走训练模型却无从追索。
        CineGBA IP-Bridge 把内容指纹、存证记录与标准化授权合约接在一起，
        让权利可查、交易可签、收益可分。
      </p>
      <div class="lp-cta">
        <a class="btn pri lg" href="#/register">${I.up}<span data-i18n="lp.ctaJoin">免费入驻，上传即存证</span></a>
        <a class="btn lg" href="#/login" data-i18n="lp.ctaLogin">已有账号，登录</a>
      </div>
      <div class="lp-stats">
        <div><b>5</b><span data-i18n="lp.stat1">种标准化授权类型</span></div>
        <div><b>3</b><span data-i18n="lp.stat2">路存证并行</span></div>
        <div><b>12%</b><span data-i18n="lp.stat3">平台佣金（成交额）</span></div>
      </div>
    </div>
    <div class="lp-hero-vis">
      ${lpCarousel(carItems)}
      <div class="lp-glow"></div>
    </div>
  </section>

  <section class="lp-sec" id="capabilities">
    <div class="lp-sec-h">
      <h2 data-i18n="lp.capH">三件事，做成一套</h2>
      <p data-i18n="lp.capHSub">不是把区块链、AI、版权三个词拼在一起，而是让它们各自解决一个具体问题。</p>
    </div>
    <div class="lp-cards">
      <article class="lp-card">
        <div class="lp-ci">${I.shield}</div>
        <h3 data-i18n="lp.cap1t">多模态内容指纹</h3>
        <p data-i18n="lp.cap1p">画面、音频、文本、3D 模型分别提取指纹，用于跨平台比对。
          指纹是当前唯一经大规模工业验证的比对方案。</p>
        <ul>
          <li data-i18n="lp.cap1l1">四种模态独立提取</li>
          <li data-i18n="lp.cap1l2">比对结果只作线索，不作侵权认定</li>
          <li data-i18n="lp.cap1l3">水印不作为存证依据</li>
        </ul>
      </article>
      <article class="lp-card">
        <div class="lp-ci">${I.file}</div>
        <h3 data-i18n="lp.cap2t">三路存证并行</h3>
        <p data-i18n="lp.cap2p">链上存证、作品自愿登记、可信时间戳三路同时呈现，
          每条都写明自己的效力边界。</p>
        <ul>
          <li data-i18n="lp.cap2l1">链上存证：证明该时点存在该指纹</li>
          <li data-i18n="lp.cap2l2">作品登记：法定证书，效力最高</li>
          <li data-i18n="lp.cap2l3">时间戳：电子数据真实性的辅助证据</li>
        </ul>
      </article>
      <article class="lp-card">
        <div class="lp-ci">${I.cart}</div>
        <h3 data-i18n="lp.cap3t">合规授权交易</h3>
        <p data-i18n="lp.cap3p">把「AI 训练数据授权」「片段引用」「改编权」等做成可选商品，
          条款、范围、期限、分成写清楚再成交。</p>
        <ul>
          <li data-i18n="lp.cap3l1">5 种标准化授权类型</li>
          <li data-i18n="lp.cap3l2">在线询价、回签、生成合约</li>
          <li data-i18n="lp.cap3l3">收益进入结算，按成交额抽佣</li>
        </ul>
      </article>
    </div>
  </section>

  <section class="lp-sec alt" id="how">
    <div class="lp-sec-h">
      <h2 data-i18n="lp.howH">从上传到结算，四步</h2>
      <p data-i18n="lp.howHSub">每一步都留下可查的记录，任一步都可以停下来不做。</p>
    </div>
    <div class="lp-steps">
      <div class="lp-step"><span class="n">01</span><b data-i18n="lp.how1t">上传作品</b>
        <p data-i18n="lp.how1p">拖文件进来，系统生成指纹并落库。原始文件加密存储，对外只展示带水印预览。</p></div>
      <div class="lp-step"><span class="n">02</span><b data-i18n="lp.how2t">登记存证</b>
        <p data-i18n="lp.how2p">链上存证与可信时间戳自动完成；作品自愿登记需要人工办理，可后补。</p></div>
      <div class="lp-step"><span class="n">03</span><b data-i18n="lp.how3t">配置授权</b>
        <p data-i18n="lp.how3p">选择授权类型、适用范围、期限与价格。含肖像或声音的作品需先补授权文件才能上架。</p></div>
      <div class="lp-step"><span class="n">04</span><b data-i18n="lp.how4t">交易与结算</b>
        <p data-i18n="lp.how4p">采购方询价、你回签、合约生效、收益入账。跨境结算走合规通道，不做承诺性宣传。</p></div>
    </div>
  </section>

  <section class="lp-sec" id="licensing">
    <div class="lp-sec-h">
      <h2 data-i18n="lp.licH">五种授权，法律含义不同</h2>
      <p data-i18n="lp.licHSub">「AI 训练」和「改编权」不是一回事。用户点错一次就可能是永久性的权利让渡，所以要写清楚。</p>
    </div>
    <div class="lp-lic">
      ${KINDS.map(k => {
      const it = U.licOf(k);
      return `<div class="lp-lici">
          <div class="lp-lic-h"><b>${U.esc(it.label)}</b><span class="pill ${it.pill}">${it.short}</span></div>
          <p>${U.esc(it.desc)}</p>
          <div class="lp-lic-f"><span data-i18n="lp.licUnit">计价：</span>${U.esc(it.unitLabel)}</div>
        </div>`;
    }).join('')}
    </div>
  </section>

  <section class="lp-sec alt" id="boundary">
    <div class="lp-sec-h">
      <h2 data-i18n="lp.boundH">我们明确不承诺的事</h2>
      <p data-i18n="lp.boundHSub">这一页放在官网而不是藏在用户协议里，是因为说清楚比说好听更重要。</p>
    </div>
    <div class="lp-bound">
      <div class="lp-bi"><span class="ic">${I.warn}</span>
        <div><b data-i18n="lp.b1t">存证不等于确权</b>
          <p data-i18n="lp.b1p">香港没有区块链存证的法定推定规则；内地《人民法院在线诉讼规则》第 16 条是可反驳的推定，
            且只覆盖上传之后的完整性。存证提升可追溯性，不产生权属推定。</p></div></div>
      <div class="lp-bi"><span class="ic">${I.warn}</span>
        <div><b data-i18n="lp.b2t">相似度不等于侵权认定</b>
          <p data-i18n="lp.b2p">指纹匹配度是技术指标，不是法律结论。是否构成侵权需要人工判断，
            平台不代替权利人作出法律判断，也不承诺维权成功率。</p></div></div>
      <div class="lp-bi"><span class="ic">${I.warn}</span>
        <div><b data-i18n="lp.b3t">水印不是证据</b>
          <p data-i18n="lp.b3p">公开研究显示水印在对抗性攻击下可被低成本去除，单样本即可完成去除与伪造。
            我们不把水印作为存证依据。</p></div></div>
      <div class="lp-bi"><span class="ic">${I.info}</span>
        <div><b data-i18n="lp.b4t">成本是目标值，不是实测值</b>
          <p data-i18n="lp.b4p">「单笔授权成本低于 1 美元」是设计目标，需要 MVP 实测验证。
            行业参照：传统授权单笔约 400 美元，AI 侵权诉讼单案从百万级起算。</p></div></div>
    </div>
  </section>

  <section class="lp-final">
    <h2 data-i18n="lp.finalH">先上传一件作品，看看能生成什么</h2>
    <p data-i18n="lp.finalSub">不需要信用卡，不需要接入系统。上传即生成指纹与存证凭证。</p>
    <div class="lp-cta center">
      <a class="btn pri lg" href="#/register" data-i18n="lp.join">免费入驻</a>
      <a class="btn lg" href="#/login" data-i18n="lp.demoLogin">用演示账号看看</a>
    </div>
  </section>

  <footer class="lp-foot">
    <div class="lp-foot-top">
      <div>
        <div class="lp-logo"><div class="logo">CG</div>
          <div><b>CineGBA IP-Bridge</b><span>影视动漫 AI 资产确权与合规授权</span></div></div>
        <p class="lp-fp" data-i18n="lp.footP">连接香港国际版权枢纽与大湾区内容产能。<br>本站为课程项目原型，数据全部虚构。</p>
      </div>
      <div class="lp-fcols">
        <div><h4 data-i18n="lp.footProduct">产品</h4><a href="#capabilities" data-i18n="lp.navCap">能力</a><a href="#how" data-i18n="lp.navHow">流程</a>
          <a href="#licensing" data-i18n="lp.navLic">授权类型</a></div>
        <div><h4 data-i18n="lp.footTrust">信任</h4><a href="#boundary" data-i18n="lp.footBoundary">边界声明</a><a href="#/login">登录</a>
          <a href="#/register" data-i18n="lp.footJoin">入驻</a></div>
        <div><h4 data-i18n="lp.footRef">合规参考</h4>
          <span>作品自愿登记（DCI 体系）</span>
          <span>香港知识产权署公开资料</span>
          <span>FILMART 展会渠道</span></div>
      </div>
    </div>
    <div class="lp-foot-bot">
      <span>© 2026 CineGBA IP-Bridge · 课程项目原型</span>
      <span>演示数据 · 非真实业务 · 不构成法律意见</span>
    </div>
  </footer>
</div>`;
  };

  CG.pages.landing.after = function () {
    // 锚点滚动用原生行为即可；这里处理主视觉轮播
    const car = document.getElementById('lpCar');
    if (!car) return;
    const track = document.getElementById('lpCarTrack');
    const slides = Array.from(track.children);
    const dots = Array.from(car.querySelectorAll('.lp-car-dot'));
    const total = slides.length;
    let idx = 0;

    function go(n) {
      idx = (n + total) % total;
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      slides.forEach((s, i) => s.setAttribute('aria-hidden', i === idx ? 'false' : 'true'));
      dots.forEach((d, i) => d.classList.toggle('on', i === idx));
    }

    const prev = car.querySelector('[data-car-prev]');
    const next = car.querySelector('[data-car-next]');
    if (prev) prev.onclick = () => go(idx - 1);
    if (next) next.onclick = () => go(idx + 1);
    dots.forEach((d, i) => { d.onclick = () => go(i) });

    // 键盘 ← → 也能翻（焦点在页面任意处都行，输入框里除外）
    document.addEventListener('keydown', function onKey(e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (!document.getElementById('lpCar')) { document.removeEventListener('keydown', onKey); return }
      e.preventDefault();
      go(idx + (e.key === 'ArrowRight' ? 1 : -1));
    });

    // 触屏左右滑
    let sx = null;
    car.addEventListener('pointerdown', e => { sx = e.clientX });
    car.addEventListener('pointerup', e => {
      if (sx === null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    });

    go(0);
  };

  /* ========================================================== 登录 */
  CG.pages.login = function () {
    return `
<div class="au">
  <aside class="au-side">
    <a class="lp-logo" href="#/">
      <div class="logo">CG</div>
      <div><b>CineGBA IP-Bridge</b><span>影视动漫 AI 资产确权与合规授权</span></div>
    </a>
    <div class="au-side-mid">
      <h2 data-i18n="au.sideH">把素材变成<br>可结算的资产</h2>
      <ul class="au-points">
        <li><span>${I.shield}</span><div><b data-i18n="au.side1t">上传即存证</b>
          <p data-i18n="au.side1p">指纹、链上记录、时间戳一次生成</p></div></li>
        <li><span>${I.cart}</span><div><b data-i18n="au.side2t">授权可配置</b>
          <p data-i18n="au.side2p">五种授权类型，价格与范围自己定</p></div></li>
        <li><span>${I.chart}</span><div><b data-i18n="au.side3t">收益看得见</b>
          <p data-i18n="au.side3p">每笔进账的授权类型与合约都能追溯</p></div></li>
      </ul>
    </div>
    <p class="au-side-foot" data-i18n="au.sideFoot">课程项目原型 · 演示数据</p>
  </aside>

  <main class="au-main">
    <div class="au-box">
      <div class="au-tabs">
        <a class="au-tab on" href="#/login" data-i18n="au.login">登录</a>
        <a class="au-tab" href="#/register" data-i18n="au.register">注册</a>
      </div>

      <h1 data-i18n="au.welcome">欢迎回来</h1>
      <p class="au-sub" data-i18n="au.loginSub">登录后进入创作者工作台</p>

      <div class="au-err" id="auErr" hidden></div>

      <form id="loginForm" autocomplete="on">
        <div class="fld">
          <label for="lgEmail" data-i18n="au.email">邮箱</label>
          <input id="lgEmail" type="email" placeholder="you@example.com" autocomplete="username" required>
        </div>
        <div class="fld mt12">
          <label for="lgPw" data-i18n="au.pw">密码</label>
          <div class="au-pw">
            <input id="lgPw" type="password" placeholder="至少 6 位" autocomplete="current-password" required>
            <button type="button" class="au-eye" id="lgEye" title="显示密码">${I.eye}</button>
          </div>
        </div>
        <div class="row between mt12">
          <label class="au-check"><input type="checkbox" id="lgRemember" checked> 记住我</label>
          <a class="au-link" href="#" id="lgForgot">忘记密码？</a>
        </div>
        <button class="btn pri wide lg mt16" type="submit" id="lgGo" data-i18n="au.go">登录</button>
      </form>

      <div class="au-demo">
        <div class="au-demo-h"><span data-i18n="au.demoH">演示账号</span>
          <button class="btn xs" id="fillDemo" data-i18n="au.fillDemo">一键填入</button></div>
        <div class="au-demo-list">
          <div class="au-di" data-email="lin@example.com" data-pw="cinegba2026">
            <b>创作方 · 主账号</b>
            <code>lin@example.com / cinegba2026</code>
          </div>
          <div class="au-di" data-email="demo@cinegba.com" data-pw="demo1234">
            <b>创作方 · 备用</b>
            <code>demo@cinegba.com / demo1234</code>
          </div>
        </div>
      </div>

      <p class="au-foot">还没有账号？<a class="au-link" href="#/register">免费注册</a>
        · <a class="au-link" href="#/">返回首页</a></p>
    </div>
  </main>
</div>`;
  };

  CG.pages.login.after = function () {
    const err = document.getElementById('auErr');
    const showErr = (m) => { err.hidden = false; err.textContent = m };
    const hideErr = () => { err.hidden = true };

    const fill = (e, p) => {
      document.getElementById('lgEmail').value = e;
      document.getElementById('lgPw').value = p;
      hideErr();
    };
    document.getElementById('fillDemo').onclick = () => fill('lin@example.com', 'cinegba2026');
    document.querySelectorAll('.au-di').forEach(el => {
      el.onclick = () => fill(el.dataset.email, el.dataset.pw);
    });

    document.getElementById('lgEye').onclick = function () {
      const i = document.getElementById('lgPw');
      const toText = i.type === 'password';
      i.type = toText ? 'text' : 'password';
      this.innerHTML = toText ? I.eyeOff : I.eye;
      this.title = toText ? '隐藏密码' : '显示密码';
    };

    document.getElementById('lgForgot').onclick = (ev) => {
      ev.preventDefault();
      CG.modal(`<div style="padding:18px 20px">
        <div class="card-h"><h3>找回密码</h3></div>
        <p class="small" style="color:var(--ink-2);line-height:1.7">
          原型环境不发送邮件。请直接用演示账号登录，或重新注册一个账号。</p>
        <div class="row mt16" style="justify-content:flex-end">
          <button class="btn pri" data-close>知道了</button></div>
      </div>`);
    };

    const go = document.getElementById('lgGo');
    document.getElementById('loginForm').onsubmit = async (ev) => {
      ev.preventDefault();
      hideErr();
      const email = document.getElementById('lgEmail').value;
      const pw = document.getElementById('lgPw').value;
      go.disabled = true; go.textContent = '登录中…';
      try {
        await CG.auth.login(email, pw);
        CG.toast('登录成功', 'ok');
        CG.onAuthChanged();
      } catch (e) {
        showErr(e.message);
        go.disabled = false; go.textContent = '登录';
      }
    };

    // 回车提交
    document.getElementById('lgPw').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('loginForm').requestSubmit();
    });
  };

  /* ========================================================== 注册 */
  CG.pages.register = function () {
    return `
<div class="au">
  <aside class="au-side">
    <a class="lp-logo" href="#/">
      <div class="logo">CG</div>
      <div><b>CineGBA IP-Bridge</b><span>影视动漫 AI 资产确权与合规授权</span></div>
    </a>
    <div class="au-side-mid">
      <h2>注册即获得<br>一个数据站</h2>
      <ul class="au-points">
        <li><span>${I.up}</span><div><b>上传即存证</b>
          <p>不需要先签合同，先把你手上的作品登记进来</p></div></li>
        <li><span>${I.file}</span><div><b>三路登记</b>
          <p>链上、登记、时间戳，效力边界各自写清</p></div></li>
        <li><span>${I.cart}</span><div><b>随时上架</b>
          <p>配置好授权与价格，作品就出现在授权市场</p></div></li>
      </ul>
    </div>
    <p class="au-side-foot" data-i18n="au.sideFoot">课程项目原型 · 演示数据</p>
  </aside>

  <main class="au-main">
    <div class="au-box">
      <div class="au-tabs">
        <a class="au-tab" href="#/login">登录</a>
        <a class="au-tab on" href="#/register">注册</a>
      </div>

      <h1 data-i18n="au.regH">创建账号</h1>
      <p class="au-sub">注册后会直接进入工作台</p>

      <div class="au-err" id="rgErr" hidden></div>

      <form id="regForm">
        <div class="fgrid">
          <div class="fld"><label for="rgName">联系人 <i>*</i></label>
            <input id="rgName" placeholder="姓名" required></div>
          <div class="fld"><label for="rgOrg">机构名称</label>
            <input id="rgOrg" placeholder="公司或工作室"></div>
        </div>
        <div class="fld mt12">
          <label for="rgEmail">邮箱 <i>*</i></label>
          <input id="rgEmail" type="email" placeholder="you@example.com" autocomplete="username" required>
        </div>
        <div class="fld mt12">
          <label for="rgPw">密码 <i>*</i></label>
          <input id="rgPw" type="password" placeholder="至少 6 位" autocomplete="new-password" required>
        </div>
        <div class="fld mt12">
          <label for="rgPw2">确认密码 <i>*</i></label>
          <input id="rgPw2" type="password" placeholder="再输一次" autocomplete="new-password" required>
        </div>
        <label class="au-check mt12"><input type="checkbox" id="rgAgree">
          我已阅读并同意 <a class="au-link" href="#" id="rgTerms">服务条款</a> 与隐私说明</label>
        <button class="btn pri wide lg mt16" type="submit" id="rgGo" data-i18n="au.goReg">注册并进入工作台</button>
      </form>

      <p class="au-foot">已有账号？<a class="au-link" href="#/login">去登录</a>
        · <a class="au-link" href="#/">返回首页</a></p>
    </div>
  </main>
</div>`;
  };

  CG.pages.register.after = function () {
    const err = document.getElementById('rgErr');
    const go = document.getElementById('rgGo');

    document.getElementById('rgTerms').onclick = (ev) => {
      ev.preventDefault();
      CG.modal(`<div style="padding:18px 20px">
        <div class="card-h"><h3>服务条款（摘要）</h3></div>
        <ul class="au-terms">
          <li>本原型仅用于课程演示，注册信息与上传内容不会被对外发布。</li>
          <li>上传内容默认仅本机存储，不上传至第三方服务。</li>
          <li>页面中的链上存证、时间戳、指纹均为演示数据，不具备法律效力。</li>
          <li>平台不对内容权属作任何担保，请自行确认你拥有上传与授权的权利。</li>
        </ul>
        <div class="row mt16" style="justify-content:flex-end">
          <button class="btn pri" data-close>我知道了</button></div>
      </div>`);
    };

    document.getElementById('regForm').onsubmit = async (ev) => {
      ev.preventDefault();
      err.hidden = true;
      const name = document.getElementById('rgName').value.trim();
      const org = document.getElementById('rgOrg').value.trim();
      const email = document.getElementById('rgEmail').value.trim();
      const pw = document.getElementById('rgPw').value;
      const pw2 = document.getElementById('rgPw2').value;
      const agree = document.getElementById('rgAgree').checked;

      if (!name) { err.hidden = false; err.textContent = '请填写联系人'; return }
      if (pw !== pw2) { err.hidden = false; err.textContent = '两次输入的密码不一致'; return }
      if (!agree) { err.hidden = false; err.textContent = '请先勾选同意服务条款'; return }

      go.disabled = true; go.textContent = '创建中…';
      try {
        await CG.auth.register({ name, org, email, password: pw });
        CG.toast('注册成功，已进入工作台', 'ok');
        CG.onAuthChanged();
      } catch (e) {
        err.hidden = false; err.textContent = e.message;
        go.disabled = false; go.textContent = '注册并进入工作台';
      }
    };
  };

})();
