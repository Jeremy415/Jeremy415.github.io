/* =========================================================================
 * main.js —— 全站交互与渲染逻辑
 * 纯原生 JavaScript，无任何第三方依赖。
 * 内容全部取自 profile.js 的 window.PROFILE
 * ========================================================================= */
(function () {
  'use strict';

  // 标记 JS 可用（CSS 里的滚动进场动画依赖这个类，避免无 JS 时内容被隐藏）
  document.documentElement.classList.add('js');

  /* ===================== 0. 基础工具 ===================== */
  var P = window.PROFILE || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // 默认值，防止 profile.js 漏字段导致报错
  var BASE   = P.base         || {};
  var HERO   = P.hero         || {};
  var ABOUT  = P.about        || {};
  var FEAT   = P.featured     || [];
  var SKILLS = P.skills       || [];
  var TOOLS  = P.tools        || [];
  var TIME   = P.timeline     || [];
  var CERTS  = P.certificates || [];
  var CONTACT= P.contact      || {};
  var OVERRIDES = P.repoOverrides || {};
  var OPT = Object.assign({ repoCacheMinutes: 30, defaultTheme: 'dark', typingSpeed: 85 }, P.options || {});

  var GH_USER = (BASE.githubUser || '').trim();
  var GH_URL  = 'https://github.com/' + GH_USER;

  /** HTML 转义，防止内容里的尖括号破坏结构 */
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** 简易元素创建 */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function setText(sel, val) {
    var n = $(sel);
    if (n && val) n.textContent = val;
  }

  /* ===================== 1. 图标库（内联 SVG） ===================== */
  var ICONS = {
    cube:   '<path d="M12 2.6l8.5 4.8v9.2L12 21.4 3.5 16.6V7.4L12 2.6z"/><path d="M3.5 7.4L12 12l8.5-4.6M12 12v9.4"/>',
    code:   '<path d="M9 18l-6-6 6-6M15 6l6 6-6 6"/>',
    mail:   '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 7.5l8 5.5 8-5.5"/>',
    phone:  '<path d="M5 3h3.5l1.7 4.2-2.1 1.5a12 12 0 0 0 5.7 5.7l1.5-2.1L19.5 14V17a2.5 2.5 0 0 1-2.7 2.5A15.5 15.5 0 0 1 3 5.7A2.5 2.5 0 0 1 5 3z"/>',
    wechat: '<path d="M9.5 3C5.6 3 2.5 5.6 2.5 8.8c0 1.8 1 3.4 2.5 4.5l-.6 1.9 2.2-1.2c.9.3 1.9.4 2.9.4h.6"/><path d="M21.5 14.2c0-2.7-2.6-4.9-5.8-4.9s-5.8 2.2-5.8 4.9 2.6 4.9 5.8 4.9c.8 0 1.6-.1 2.3-.3l1.9 1-.5-1.6c1.3-.9 2.1-2.4 2.1-4z"/>',
    spark:  '<path d="M11 3l1.7 4.4 4.4 1.7-4.4 1.7L11 15.2 9.3 10.8 4.9 9.1l4.4-1.7z"/><path d="M18.2 14.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    pin:    '<path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    location: '<path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    education: '<path d="M3 9l9-5 9 5-9 5-9-5z"/><path d="M7 11.5V16c0 1.1 2.2 2.5 5 2.5s5-1.4 5-2.5v-4.5"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    github: '<path d="M12 2a10 10 0 0 0-3.16 19.5c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z" data-fill="1"/>',
    link:   '<path d="M10.5 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M13.5 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/>',
    star:   '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    fork:   '<circle cx="6" cy="5" r="2.2"/><circle cx="18" cy="5" r="2.2"/><circle cx="12" cy="19" r="2.2"/><path d="M6 7.2v1.3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7.2M12 11.5v5.3"/>',
    clock:  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
    lock:   '<rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    arrowOut: '<path d="M8 16l8-8M9 8h7v7"/>',
    copy:   '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    check:  '<path d="M5 13l4.5 4.5L19 7"/>',
    award:  '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.6L7 22l5-2.6 5 2.6-1.5-8.4"/>',
    demo:   '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>',
    doc:    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'
  };

  function icon(name) {
    var p = ICONS[name] || ICONS.link;
    var isFill = p.indexOf('data-fill') > -1;
    p = p.replace(' data-fill="1"', '');
    return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (isFill ? ' class="fill"' : '') + '>' + p + '</svg>';
  }

  /* ===================== 2. 语言配色 ===================== */
  var LANG_COLOR = {
    TypeScript: '#3178c6', JavaScript: '#f1e05a', HTML: '#e34c26', CSS: '#563d7c',
    Python: '#3572A5', Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
    Vue: '#41b883', Shell: '#89e051', Go: '#00ADD8', Rust: '#dea584', Dart: '#00B4AB',
    PHP: '#4F5D95', Ruby: '#701516', Swift: '#F05138', Kotlin: '#A97BFF',
    'Jupyter Notebook': '#DA5B0B', SCSS: '#c6538c', Less: '#1d365d', Lua: '#000080',
    'Objective-C': '#438eff', MATLAB: '#e16737', TeX: '#3D6117', Dockerfile: '#384d54'
  };
  function langColor(lang) { return LANG_COLOR[lang] || '#8b95a5'; }

  function timeAgo(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff <= 0) return '今天更新';
    if (diff === 1) return '昨天更新';
    if (diff < 30) return diff + ' 天前更新';
    if (diff < 365) return Math.floor(diff / 30) + ' 个月前更新';
    return Math.floor(diff / 365) + ' 年前更新';
  }

  /* ===================== 3. 主题切换 ===================== */
  (function initTheme() {
    var KEY = 'portfolio-theme';
    var root = document.documentElement;
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}

    function systemTheme() {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    function apply(t, persist) {
      root.setAttribute('data-theme', t);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', t === 'dark' ? '#0a0e17' : '#f6f7fb');
      if (persist) { try { localStorage.setItem(KEY, t); } catch (e) {} }
    }

    if (saved) apply(saved, false);
    else if (OPT.defaultTheme === 'auto') apply(systemTheme(), false);
    else apply(OPT.defaultTheme || 'dark', false);

    var btn = $('#themeToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        apply(next, true);
      });
    }
  })();

  /* ===================== 4. 渲染静态内容 ===================== */
  // --- 4.1 品牌 / 基础信息 ---
  setText('#brandText', BASE.navName || BASE.name);
  setText('#brandMark', BASE.initials || 'W');
  setText('#heroName', BASE.name);
  setText('#statusText', BASE.status);
  setText('#footerName', BASE.name);
  setText('#termWho', (BASE.name || '') + ' / ' + (BASE.nameEn || ''));
  setText('#termLocation', BASE.location || '');
  setText('#year', new Date().getFullYear());
  if (BASE.name) document.title = BASE.name + ' · 作品集 | AI 应用开发 · Python · 企业系统交付';

  var roleBox = $('#termRole');
  if (roleBox) roleBox.textContent = '"' + ((HERO.roles && HERO.roles[0]) || 'Developer') + '"';
  var stackBox = $('#termStack');
  if (stackBox) stackBox.textContent = '"' + (HERO.tags || []).slice(0, 3).join(' / ') + '"';

  // --- 4.2 首屏 ---
  var heroDesc = $('#heroDesc');
  if (heroDesc && HERO.desc) heroDesc.textContent = HERO.desc;

  var heroTags = $('#heroTags');
  if (heroTags) (HERO.tags || []).forEach(function (t) {
    heroTags.appendChild(el('span', null, esc(t)));
  });

  // 简历按钮：配了在线简历就跳转，没配就调用浏览器打印（页面已做好打印样式）
  var resumeBtn = $('#resumeBtn');
  if (resumeBtn) {
    if (BASE.resumeUrl) {
      resumeBtn.addEventListener('click', function () {
        window.open(BASE.resumeUrl, '_blank', 'noopener');
      });
    } else {
      setText('#resumeBtnText', '打印简历');
      resumeBtn.addEventListener('click', function () { window.print(); });
    }
  }

  // GitHub 入口：没配置用户名就隐藏
  var gb = $('#githubBtn');
  if (gb) {
    if (GH_USER) gb.href = GH_URL;
    else gb.style.display = 'none';
  }
  var arb = $('#allReposBtn');
  if (arb) {
    if (GH_USER) arb.href = GH_URL + '?tab=repositories';
    else arb.style.display = 'none';
  }

  // 首屏统计（仓库数等动态值后面会刷新）
  var statsBox = $('#heroStats');
  var statDefs = [
    { key: 'repos',  num: 0,  label: '项目仓库' },
    { key: 'langs',  num: 0,  label: '主要语言' },
    { key: 'skills', num: SKILLS.reduce(function (a, g) { return a + (g.items || []).length; }, 0), label: '技能项' },
    { key: 'feat',   num: FEAT.length, label: '精选项目' }
  ];
  if (statsBox) {
    statDefs.forEach(function (s) {
      var d = el('div', 'stat');
      d.innerHTML = '<div class="stat-num" data-key="' + s.key + '">' + s.num + '</div>' +
                    '<div class="stat-label">' + esc(s.label) + '</div>';
      statsBox.appendChild(d);
    });
  }

  // --- 4.3 关于我 ---
  setText('#aboutTitle', ABOUT.title);
  var aboutText = $('#aboutText');
  if (aboutText) {
    (ABOUT.paragraphs || []).forEach(function (p) {
      aboutText.appendChild(el('p', null, esc(p)));
    });
  }
  (function renderFacts() {
    var bento = $('.bento');
    if (!bento || !Array.isArray(ABOUT.facts)) return;
    ABOUT.facts.forEach(function (f, i) {
      var node = el('article', 'card bento-fact reveal');
      node.setAttribute('data-reveal', '');
      node.setAttribute('data-delay', String(80 + i * 60));
      node.innerHTML =
        '<span class="fact-ico">' + icon(f.icon || 'link') + '</span>' +
        '<h4>' + esc(f.label) + '</h4>' +
        '<p>' + esc(f.text) + '</p>';
      bento.appendChild(node);
    });
  })();

  // --- 4.4 精选项目 ---
  var featGrid = $('#featGrid');
  if (featGrid) {
    FEAT.forEach(function (f, i) {
      var stack = (f.tech || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
      var points = (f.points || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');
      var chips = (f.tech || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
      var links = (f.links || []).map(function (l) {
        var isPrimary = l.type === 'demo' || l.type === 'github';
        return '<a class="btn ' + (isPrimary ? 'btn-primary' : 'btn-ghost') + '" href="' + esc(l.url) +
               '" target="_blank" rel="noopener">' + icon(l.type === 'github' ? 'github' : (l.type === 'doc' ? 'doc' : 'demo')) +
               esc(l.label || '查看') + '</a>';
      }).join('');

      // 写了 detail 的项目，给一个进详情页的入口
      var more = f.detail
        ? '<button class="btn btn-ghost feat-more" type="button" data-feat="' + i + '">' +
            icon('doc') + '查看项目详情</button>'
        : '';

      var card = el('article', 'feat-card reveal');
      card.setAttribute('data-reveal', '');
      card.innerHTML =
        '<div class="feat-body">' +
          '<div class="feat-head">' +
            '<h3 class="feat-name">' + esc(f.name) + '</h3>' +
            (f.en ? '<span class="feat-en">' + esc(f.en) + '</span>' : '') +
            (f.badge ? '<span class="feat-badge ' + esc(f.accent || 'sky') + '">' + esc(f.badge) + '</span>' : '') +
          '</div>' +
          (f.tagline ? '<p class="feat-tagline">' + esc(f.tagline) + '</p>' : '') +
          (f.desc ? '<p class="feat-desc">' + esc(f.desc) + '</p>' : '') +
          (points ? '<ul class="feat-points">' + points + '</ul>' : '') +
          (chips ? '<div class="chips">' + chips + '</div>' : '') +
          ((links || more) ? '<div class="feat-links">' + links + more + '</div>' : '') +
        '</div>' +
        '<aside class="feat-side">' +
          '<span class="feat-side-label">Tech Stack</span>' +
          '<ul class="feat-side-stack">' + stack + '</ul>' +
          '<span class="feat-num">' + (i + 1 < 10 ? '0' + (i + 1) : String(i + 1)) + '</span>' +
        '</aside>';
      featGrid.appendChild(card);
    });
  }

  /* --- 4.4.1 项目详情弹层 --- */
  (function initProjectModal() {
    var modal = $('#projModal');
    var box   = $('#projModalBody');
    if (!modal || !box) return;

    var lastFocus = null;

    /** 把一个项目渲染成详情页内容 */
    function htmlOf(f) {
      var d = f.detail || {};

      var meta = (d.meta || []).map(function (m) {
        return '<div class="pm-meta-item"><dt>' + esc(m.label) + '</dt><dd>' + esc(m.value) + '</dd></div>';
      }).join('');

      var modules = (d.modules || []).map(function (m) {
        return '<li><b>' + esc(m.name) + '</b><span>' + esc(m.desc) + '</span></li>';
      }).join('');

      var challenges = (d.challenges || []).map(function (c) {
        return '<li><b>' + esc(c.title) + '</b><span>' + esc(c.desc) + '</span></li>';
      }).join('');

      var outcome = (d.outcome || []).map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('');
      var chips = (f.tech || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
      // 没写 detail 的项目：退回用卡片上的要点，保证详情页永远不为空
      var fallback = (f.points || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');

      // 详情页顶部的跳转按钮（GitHub / 演示 / 文档），没有配置就不渲染
      var linkBtns = (f.links || []).map(function (l) {
        var isPrimary = l.type === 'demo' || l.type === 'github';
        return '<a class="btn ' + (isPrimary ? 'btn-primary' : 'btn-ghost') + '" href="' + esc(l.url) +
               '" target="_blank" rel="noopener">' + icon(l.type === 'github' ? 'github' : (l.type === 'doc' ? 'doc' : 'demo')) +
               esc(l.label || '查看') + '</a>';
      }).join('');

      return '' +
        '<header class="pm-head">' +
          (f.en ? '<span class="pm-en">' + esc(f.en) + '</span>' : '') +
          '<h3 class="pm-title" id="pmTitle">' + esc(f.name) + '</h3>' +
          (f.badge ? '<span class="pm-badge ' + esc(f.accent || 'sky') + '">' + esc(f.badge) + '</span>' : '') +
          (f.tagline ? '<p class="pm-tagline">' + esc(f.tagline) + '</p>' : '') +
          (linkBtns ? '<div class="pm-links">' + linkBtns + '</div>' : '') +
        '</header>' +
        (meta ? '<div class="pm-meta">' + meta + '</div>' : '') +
        (d.background
          ? '<section class="pm-sec"><h4>项目背景</h4><p>' + esc(d.background) + '</p></section>'
          : (f.desc ? '<section class="pm-sec"><h4>项目简介</h4><p>' + esc(f.desc) + '</p></section>' : '')) +
        (modules ? '<section class="pm-sec"><h4>核心模块</h4><ul class="pm-list pm-modules">' + modules + '</ul></section>' : '') +
        (challenges
          ? '<section class="pm-sec"><h4>技术难点与解决方式</h4><ul class="pm-list pm-challenges">' + challenges + '</ul></section>'
          : (fallback ? '<section class="pm-sec"><h4>项目要点</h4><ul class="pm-list pm-outcome">' + fallback + '</ul></section>' : '')) +
        (outcome ? '<section class="pm-sec"><h4>交付成果</h4><ul class="pm-list pm-outcome">' + outcome + '</ul></section>' : '') +
        (chips ? '<section class="pm-sec"><h4>技术栈</h4><div class="chips">' + chips + '</div></section>' : '');
    }

    function open(i) {
      var f = FEAT[i];
      if (!f) return;
      box.innerHTML = htmlOf(f);
      box.scrollTop = 0;
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.documentElement.classList.add('pm-open');
      requestAnimationFrame(function () { modal.classList.add('is-on'); });
      var btn = modal.querySelector('.pm-close');
      if (btn) btn.focus();
    }

    function close() {
      if (modal.hidden) return;
      modal.classList.remove('is-on');
      document.documentElement.classList.remove('pm-open');
      window.setTimeout(function () {
        modal.hidden = true;
        box.innerHTML = '';
      }, 220);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var trigger = e.target.closest('[data-feat]');
      if (trigger) { open(Number(trigger.getAttribute('data-feat'))); return; }
      if (e.target.closest('[data-pm-close]')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  })();

  // --- 4.5 技能栈 ---
  var skillCols = $('#skillCols');
  if (skillCols) {
    SKILLS.forEach(function (col) {
      var items = (col.items || []).map(function (it) {
        var hasLevel = typeof it.level === 'number';
        return '<div class="skill-item' + (hasLevel ? '' : ' is-plain') + '">' +
            '<div class="skill-item-top">' +
              '<span class="skill-item-name">' + esc(it.name) + '</span>' +
              (hasLevel ? '<span class="skill-item-pct">' + it.level + '%</span>' : '') +
            '</div>' +
            (it.desc ? '<p class="skill-item-desc">' + esc(it.desc) + '</p>' : '') +
            (hasLevel ? '<div class="skill-bar"><i data-level="' + it.level + '"></i></div>' : '') +
          '</div>';
      }).join('');

      var card = el('div', 'card skill-col reveal');
      card.setAttribute('data-reveal', '');
      card.innerHTML =
        '<div class="skill-col-head">' +
          '<span class="skill-ico">' + icon(col.icon || 'code') + '</span>' +
          '<div><h3>' + esc(col.title) + '</h3>' +
          (col.en ? '<span class="en">' + esc(col.en) + '</span>' : '') + '</div>' +
        '</div>' + items;
      skillCols.appendChild(card);
    });
  }

  var toolChips = $('#toolChips');
  if (toolChips) TOOLS.forEach(function (t) { toolChips.appendChild(el('span', null, esc(t))); });

  // --- 4.6 经历时间轴 ---
  var tlBox = $('#timeline');
  if (tlBox) {
    var KIND = { work: '工作 / 实习', edu: '教育背景', award: '项目成就' };
    TIME.forEach(function (t) {
      var chips = (t.tags || []).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('');
      var node = el('div', 'tl-item type-' + esc(t.type || 'work') + ' reveal');
      node.setAttribute('data-reveal', '');
      node.innerHTML =
        '<div class="card tl-card">' +
          '<div class="tl-head">' +
            '<span class="tl-time">' + esc(t.time) + '</span>' +
            '<span class="tl-kind">' + esc(KIND[t.type] || '') + '</span>' +
          '</div>' +
          '<h3 class="tl-title">' + esc(t.title) + '</h3>' +
          (t.org ? '<p class="tl-org">' + esc(t.org) + '</p>' : '') +
          (t.desc ? '<p class="tl-desc">' + esc(t.desc) + '</p>' : '') +
          (chips ? '<div class="chips">' + chips + '</div>' : '') +
        '</div>';
      tlBox.appendChild(node);
    });
  }

  // --- 4.7 证书 ---
  var certGrid = $('#certGrid');
  if (certGrid) {
    CERTS.forEach(function (c) {
      var card = el('div', 'card cert-card reveal');
      card.setAttribute('data-reveal', '');
      card.innerHTML =
        '<span class="cert-ico">' + icon('award') + '</span>' +
        '<div><h3>' + esc(c.name) + '</h3>' +
        '<p>' + esc([c.org, c.year].filter(Boolean).join(' · ')) + '</p></div>';
      certGrid.appendChild(card);
    });
  }

  // --- 4.8 联系 ---
  setText('#contactTitle', CONTACT.title);
  setText('#contactText', CONTACT.text);
  var mailBtn = $('#mailBtn');
  if (mailBtn) mailBtn.href = 'mailto:' + (BASE.email || '');

  // 联系列表：如果配置了 GitHub 用户名，自动补一条 GitHub 联系方式
  var contactItems = (CONTACT.items || []).slice();
  if (GH_USER && !contactItems.some(function (x) { return x.icon === 'github'; })) {
    contactItems.push({ icon: 'github', label: 'GitHub', value: 'github.com/' + GH_USER, href: GH_URL });
  }

  var contactList = $('#contactList');
  if (contactList) {
    contactItems.forEach(function (it) {
      var li = el('li', 'contact-item');
      var inner =
        '<span class="ci-ico">' + icon(it.icon || 'link') + '</span>' +
        '<span class="ci-text">' +
          '<span class="ci-label">' + esc(it.label) + '</span>' +
          '<span class="ci-value">' + esc(it.value) + '</span>' +
        '</span>';
      if (it.copy) {
        inner += '<button class="ci-copy" type="button" title="复制" aria-label="复制' + esc(it.label) +
                 '" data-copy="' + esc(it.value) + '">' + icon('copy') + '</button>';
      }
      li.innerHTML = inner;

      if (it.href) {
        li.style.cursor = 'pointer';
        li.addEventListener('click', function (e) {
          if (e.target.closest('.ci-copy')) return;
          window.open(it.href, it.href.indexOf('mailto') === 0 || it.href.indexOf('tel') === 0 ? '_self' : '_blank');
        });
      }
      contactList.appendChild(li);
    });

    // 复制按钮事件
    $$('.ci-copy', contactList).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        copyText(btn.getAttribute('data-copy'));
      });
    });
  }

  var copyMailBtn = $('#copyMailBtn');
  if (copyMailBtn) copyMailBtn.addEventListener('click', function () { copyText(BASE.email); });

  /* ===================== 5. 复制 + 提示气泡 ===================== */
  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, 2000);
  }

  function copyText(text) {
    if (!text) return;
    var done = function () { toast('已复制：' + text); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallback(); });
    } else { fallback(); }

    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败，请手动复制'); }
      document.body.removeChild(ta);
    }
  }

  /* ===================== 6. GitHub 仓库同步 ===================== */
  var repoGrid  = $('#repoGrid');
  var repoEmpty = $('#repoEmpty');
  var repoFilters = $('#repoFilters');
  var repoSearch = $('#repoSearch');

  var allRepos = [];
  var activeLang = '全部';
  var keyword = '';

  var CACHE_KEY = 'portfolio-repos-' + GH_USER;

  /** 从缓存读取（按配置的分钟数） */
  function readCache() {
    if (!OPT.repoCacheMinutes) return null;
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !obj.time || !obj.data) return null;
      if (Date.now() - obj.time > OPT.repoCacheMinutes * 60000) return null;
      return obj.data;
    } catch (e) { return null; }
  }
  function writeCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: data })); } catch (e) {}
  }

  /** 骨架屏 */
  function showSkeleton(n) {
    if (!repoGrid) return;
    repoGrid.innerHTML = '';
    for (var i = 0; i < (n || 6); i++) {
      repoGrid.appendChild(el('div', 'skeleton',
        '<div class="sk-line" style="width:52%"></div>' +
        '<div class="sk-line" style="width:100%"></div>' +
        '<div class="sk-line" style="width:86%"></div>' +
        '<div class="sk-line" style="width:40%;margin-top:auto"></div>'));
    }
  }

  /** 合并本地补充信息 */
  function decorate(repo) {
    var ov = null;
    var keys = Object.keys(OVERRIDES);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === String(repo.name).toLowerCase()) { ov = OVERRIDES[keys[i]]; break; }
    }
    ov = ov || {};
    // 私有仓库不生成外链：未登录的人点开只会是 404，不如老老实实标注出来
    var isPrivate = !!ov.private || !!repo.private;
    return {
      name: repo.name,
      url: isPrivate ? null : (repo.html_url || (GH_URL + '/' + repo.name)),
      desc: ov.description || repo.description || '',
      lang: ov.language || repo.language || null,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      updated: repo.updated_at || repo.pushed_at || null,
      tags: ov.topics || ov.tags || repo.topics || [],
      demo: ov.demo || repo.homepage || null,
      isPrivate: isPrivate,
      highlight: !!ov.highlight
    };
  }

  function normalize(list) {
    var hidden = (P.repoHidden || []).map(function (x) { return String(x).toLowerCase(); });
    return list
      .filter(function (r) { return !r.fork; })
      .filter(function (r) { return hidden.indexOf(String(r.name).toLowerCase()) === -1; })
      .map(decorate);
  }

  function renderStats(repos) {
    var langs = {};
    repos.forEach(function (r) { if (r.lang) langs[r.lang] = 1; });
    var values = {
      repos: repos.length,
      langs: Object.keys(langs).length
    };
    Object.keys(values).forEach(function (k) {
      var node = $('.stat-num[data-key="' + k + '"]');
      if (node) countUp(node, values[k]);
    });
  }

  /** 数字滚动动画 */
  function countUp(node, target) {
    if (!target) { node.textContent = '0'; return; }
    var dur = 900, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(target * eased) + '+';
      if (p < 1) requestAnimationFrame(step);
      else node.textContent = target + '+';
    }
    requestAnimationFrame(step);
  }

  /** 语言筛选按钮 */
  function renderFilters(repos) {
    if (!repoFilters) return;
    var counts = {};
    repos.forEach(function (r) {
      var k = r.lang || '其他';
      counts[k] = (counts[k] || 0) + 1;
    });

    var order = (P.repoLangOrder || []).slice();
    var keys = Object.keys(counts).sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia === -1) ia = 99; if (ib === -1) ib = 99;
      if (ia !== ib) return ia - ib;
      return counts[b] - counts[a];
    });

    repoFilters.innerHTML = '';
    var list = ['全部'].concat(keys);
    list.forEach(function (lang) {
      var n = lang === '全部' ? repos.length : counts[lang];
      var b = el('button', 'filter-btn' + (lang === activeLang ? ' is-active' : ''),
        (lang !== '全部' ? '<span class="lang-dot" style="background:' + langColor(lang) + '"></span>' : '') +
        esc(lang) + '<span class="count">' + n + '</span>');
      b.type = 'button';
      b.addEventListener('click', function () {
        activeLang = lang;
        $$('.filter-btn', repoFilters).forEach(function (x) { x.classList.remove('is-active'); });
        b.classList.add('is-active');
        renderRepos();
      });
      repoFilters.appendChild(b);
    });
  }

  /** 渲染仓库卡片 */
  function renderRepos() {
    if (!repoGrid) return;

    var list = allRepos.filter(function (r) {
      var okLang = activeLang === '全部' || (r.lang || '其他') === activeLang;
      if (!okLang) return false;
      if (!keyword) return true;
      var hay = (r.name + ' ' + r.desc + ' ' + (r.tags || []).join(' ')).toLowerCase();
      return hay.indexOf(keyword) > -1;
    });

    // 置顶的排前面
    list.sort(function (a, b) { return (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0); });

    repoGrid.innerHTML = '';
    if (repoEmpty) repoEmpty.hidden = list.length > 0;

    list.forEach(function (r, i) {
      var card = el('article', 'repo-card' + (r.highlight ? ' is-highlight' : ''));
      card.style.animation = 'none';
      card.style.transitionDelay = Math.min(i * 40, 320) + 'ms';

      var meta = [];
      if (r.lang) {
        meta.push('<span class="mi"><i class="lang-dot2" style="background:' + langColor(r.lang) + '"></i>' + esc(r.lang) + '</span>');
      }
      if (r.stars > 0) meta.push('<span class="mi">' + icon('star') + r.stars + '</span>');
      if (r.forks > 0) meta.push('<span class="mi">' + icon('fork') + r.forks + '</span>');
      if (r.updated) meta.push('<span class="mi">' + icon('clock') + esc(timeAgo(r.updated)) + '</span>');

      var tags = (r.tags || []).slice(0, 3).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');

      card.innerHTML =
        '<div class="repo-top">' +
          (r.url
            ? '<a class="repo-name" href="' + esc(r.url) + '" target="_blank" rel="noopener">' +
                esc(r.name) + '<span class="arrow">' + icon('arrowOut') + '</span>' +
              '</a>'
            : '<span class="repo-name">' + esc(r.name) + '</span>') +
          (r.isPrivate ? '<span class="repo-lock" title="私有仓库，代码不公开">' + icon('lock') + '私有</span>' : '') +
        '</div>' +
        (r.desc ? '<p class="repo-desc">' + esc(r.desc) + '</p>' : '<p class="repo-desc" style="opacity:.5">这个仓库还没写描述～</p>') +
        (tags ? '<div class="chips">' + tags + '</div>' : '') +
        (meta.length ? '<div class="repo-meta">' + meta.join('') + '</div>' : '');

      // 有在线 Demo 的在卡片上直接给个入口
      if (r.demo) {
        var demoLink = el('a', 'ci-copy',
          '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></svg>');
        demoLink.href = r.demo;
        demoLink.target = '_blank';
        demoLink.rel = 'noopener';
        demoLink.title = '打开在线 Demo';
        demoLink.style.cssText = 'position:absolute;top:16px;right:16px;color:var(--brand-2)';
        card.appendChild(demoLink);
      }

      repoGrid.appendChild(card);
    });
  }

  /** 主流程：拉取数据 */
  function loadRepos() {
    // 还没在 profile.js 里填 GitHub 用户名 → 隐藏整个板块，避免页面出现空白区域
    if (!GH_USER) {
      var sec = $('#repos');
      if (sec) sec.style.display = 'none';
      var navLink = document.querySelector('.nav-link[href="#repos"]');
      if (navLink) navLink.style.display = 'none';
      console.info('[作品集] 尚未填写 profile.js 里的 base.githubUser，「项目仓库」板块已自动隐藏。');
      return;
    }

    /* options.syncGithub 为 false 时，直接用 profile.js 里配置的仓库列表渲染，
     * 不请求 GitHub API。私有仓库用这种方式展示最稳定，页面也不会出现拉取失败的提示。 */
    if (OPT.syncGithub === false) {
      allRepos = Object.keys(OVERRIDES).map(function (name) {
        return decorate({ name: name });
      });
      renderStats(allRepos);
      renderFilters(allRepos);
      renderRepos();
      return;
    }

    var cached = readCache();
    if (cached) {
      allRepos = normalize(cached);
      renderStats(allRepos);
      renderFilters(allRepos);
      renderRepos();
      return;
    }

    showSkeleton(6);

    fetch('https://api.github.com/users/' + GH_USER + '/repos?sort=updated&per_page=100', {
      headers: { 'Accept': 'application/vnd.github+json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('GitHub API ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error('返回数据格式异常');
        writeCache(data);
        allRepos = normalize(data);
        if (!allRepos.length) throw new Error('没有公开仓库');
        renderStats(allRepos);
        renderFilters(allRepos);
        renderRepos();
      })
      .catch(function (err) {
        console.warn('[作品集] GitHub 数据加载失败：', err.message);
        // 兜底：用 profile.js 里配置的仓库信息渲染，保证页面不空
        var fallback = Object.keys(OVERRIDES).map(function (name) {
          return decorate({ name: name, html_url: GH_URL + '/' + name });
        });
        if (fallback.length) {
          allRepos = fallback;
          renderStats(allRepos);
          renderFilters(allRepos);
          renderRepos();
          var tip = el('p', 'repo-empty', 'GitHub API 未认证请求已达上限（每小时 60 次），当前显示本地配置的仓库；部署到 GitHub Pages 后通常会自动加载全部。');
          tip.style.padding = '16px 0 0';
          if (repoGrid && repoGrid.parentNode) repoGrid.parentNode.insertBefore(tip, repoGrid);
        } else {
          if (repoGrid) repoGrid.innerHTML =
            '<p class="repo-empty">GitHub 数据暂时拉取失败，请稍后刷新，或直接访问 <a href="' + GH_URL + '?tab=repositories" target="_blank" rel="noopener" style="color:var(--brand-2)">我的 GitHub</a>。</p>';
        }
      });
  }

  if (repoSearch) {
    var searchTimer = null;
    repoSearch.addEventListener('input', function () {
      clearTimeout(searchTimer);
      var v = repoSearch.value.trim().toLowerCase();
      searchTimer = setTimeout(function () { keyword = v; renderRepos(); }, 160);
    });
  }

  loadRepos();

  /* ===================== 7. 交互：导航 / 菜单 / 进度 ===================== */
  // 阅读进度条（注入到导航底部）
  var navEl = $('#nav');
  if (navEl) {
    var bar = el('div', 'nav-progress-bar');
    navEl.appendChild(bar);
    var onScrollBar = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(window.scrollY / h, 1) * 100 : 0) + '%';
    };
    onScrollBar();
    window.addEventListener('scroll', onScrollBar, { passive: true });
    window.addEventListener('resize', onScrollBar);
  }

  // 移动端菜单
  var burger = $('#burger');
  var navLinks = $('#navLinks');
  function closeMenu() {
    if (!navLinks) return;
    navLinks.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  }
  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('is-locked', open);
    });
    $$('a', navLinks).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // 滚动：导航背景 + 当前区块高亮 + 回到顶部
  var sections = $$('main section[id]');
  var navAnchors = $$('.nav-link');
  var toTop = $('#toTop');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    if (navEl) navEl.classList.toggle('is-scrolled', y > 12);
    if (toTop) toTop.classList.toggle('is-show', y > 600);

    // 当前区块
    var current = '';
    var line = y + window.innerHeight * 0.32;
    sections.forEach(function (s) {
      if (s.offsetTop <= line) current = s.id;
    });
    if (current) {
      navAnchors.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
      });
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ===================== 8. 滚动进场动画 ===================== */
  var revealNodes = $$('[data-reveal]');
  revealNodes.forEach(function (n) {
    var d = n.getAttribute('data-delay');
    if (d) n.style.setProperty('--reveal-delay', d + 'ms');
  });

  /** 立即显示当前在视口内的 reveal 元素（首屏优化 + 对无头/截图更友好） */
  function revealInView() {
    var h = window.innerHeight || document.documentElement.clientHeight;
    revealNodes.forEach(function (n) {
      if (n.classList.contains('is-visible')) return;
      var r = n.getBoundingClientRect();
      if (r.top < h && r.bottom > 0) n.classList.add('is-visible');
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealNodes.forEach(function (n) { io.observe(n); });
    revealInView();
    window.addEventListener('load', function () { window.setTimeout(revealInView, 60); });
  } else {
    revealNodes.forEach(function (n) { n.classList.add('is-visible'); });
  }

  // 技能条：进入视口后再增长
  var bars = $$('.skill-bar i');
  if ('IntersectionObserver' in window) {
    var bo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var node = entry.target;
          node.style.width = (node.getAttribute('data-level') || 0) + '%';
          bo.unobserve(node);
        }
      });
    }, { threshold: 0.4 });
    bars.forEach(function (b) { bo.observe(b); });
  } else {
    bars.forEach(function (b) { b.style.width = (b.getAttribute('data-level') || 0) + '%'; });
  }

  /* ===================== 9. 打字机 ===================== */
  (function typewriter() {
    var box = $('#roleTyped');
    var roles = HERO.roles || [];
    if (!box || !roles.length) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { box.textContent = roles[0]; return; }

    var ri = 0, ci = 0, deleting = false;
    var SPEED = OPT.typingSpeed || 85;

    function tick() {
      var word = roles[ri];
      if (!deleting) {
        ci++;
        box.textContent = word.slice(0, ci);
        if (ci === word.length) {
          deleting = true;
          return setTimeout(tick, 1700);
        }
        return setTimeout(tick, SPEED);
      }
      ci--;
      box.textContent = word.slice(0, ci);
      if (ci === 0) {
        deleting = false;
        ri = (ri + 1) % roles.length;
        return setTimeout(tick, 380);
      }
      setTimeout(tick, SPEED * 0.45);
    }
    setTimeout(tick, 500);
  })();

  /* ===================== 10. 键盘快捷键 ===================== */
  document.addEventListener('keydown', function (e) {
    // 按 T 快速切换主题（输入框内不触发）
    if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey && !e.altKey) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      var btn = $('#themeToggle');
      if (btn) btn.click();
    }
  });

  /* ===================== 11. 兜底：确保内容不会因异常而隐形 ===================== */
  window.addEventListener('load', function () {
    setTimeout(function () {
      $$('[data-reveal]').forEach(function (n) {
        if (n.classList.contains('is-visible')) return;
        var r = n.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) n.classList.add('is-visible');
      });
    }, 1500);
  });

})();
