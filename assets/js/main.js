/* =========================================================================
   Priya Nair — JSON-driven portfolio
   Vanilla ES6+. No frameworks.
   ========================================================================= */
(() => {
  "use strict";

  const DATA_BASE = "data/";
  const REDUCED_MOTION =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------- *
   * Tiny helpers
   * ---------------------------------------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const esc = (str) =>
    String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const attr = (str) => esc(str); // attribute-safe (same escaping)

  async function fetchJSON(file) {
    const res = await fetch(DATA_BASE + file, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
    return res.json();
  }

  // Wrap each loader so one failure never blocks the rest of init.
  function safe(label, fn) {
    try {
      const out = fn();
      if (out && typeof out.catch === "function") {
        return out.catch((err) => console.error(`[${label}]`, err));
      }
      return out;
    } catch (err) {
      console.error(`[${label}]`, err);
    }
  }

  /* ---------------------------------------------------------------------- *
   * Loaders
   * ---------------------------------------------------------------------- */
  function loadSiteConfig(data) {
    const meta = (data && data.meta) || {};
    if (meta.title) document.title = meta.title;
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl && meta.description) descEl.setAttribute("content", meta.description);
    const authEl = document.querySelector('meta[name="author"]');
    if (authEl && meta.author) authEl.setAttribute("content", meta.author);
    if (meta.keywords) {
      let kw = document.querySelector('meta[name="keywords"]');
      if (!kw) {
        kw = document.createElement("meta");
        kw.setAttribute("name", "keywords");
        document.head.appendChild(kw);
      }
      kw.setAttribute("content", meta.keywords);
    }
  }

  function loadNavigation(data) {
    const brandEl = $("#nav-brand");
    const menuEl = $("#nav-menu");
    if (brandEl && data.brand) {
      brandEl.textContent = data.brand.name || brandEl.textContent;
      if (data.brand.href) brandEl.setAttribute("href", data.brand.href);
    }
    if (menuEl && Array.isArray(data.menuItems)) {
      menuEl.innerHTML = data.menuItems
        .map(
          (it) =>
            `<li><a class="nav-link" href="${attr(it.href)}">${esc(it.text)}</a></li>`
        )
        .join("");
    }
  }

  function iconLink(platform, url, icon) {
    return (
      `<a class="icon-link" href="${attr(url)}" target="_blank" rel="noopener" ` +
      `aria-label="${attr(platform)}"><i class="${attr(icon)}" aria-hidden="true"></i></a>`
    );
  }

  function loadHero(data) {
    const eyebrowEl = $("#hero-eyebrow");
    if (eyebrowEl && data.eyebrow) eyebrowEl.textContent = `// ${data.eyebrow}`;

    // accessible/SEO heading (visually hidden — the terminal is the visual)
    const nameEl = $("#hero-name");
    if (nameEl && data.name) {
      nameEl.textContent = data.role ? `${data.name} — ${data.role}` : data.name;
    }

    const ctaEl = $("#hero-cta");
    if (ctaEl && data.cta && Array.isArray(data.cta.buttons)) {
      ctaEl.innerHTML = data.cta.buttons
        .map((b) => {
          const cls = b.type === "secondary" ? "btn btn-ghost" : "btn btn-primary";
          return `<a class="${cls}" href="${attr(b.href)}">${esc(b.text)}</a>`;
        })
        .join("");
    }

    const socialEl = $("#hero-social");
    if (socialEl && Array.isArray(data.socialLinks)) {
      socialEl.innerHTML = data.socialLinks
        .map((s) => iconLink(s.platform, s.url, s.icon))
        .join("");
    }

    const term = $("#hero-terminal");
    if (term) buildHeroTerminal(term, data);
  }

  // Types out a fake shell session in the hero: whoami / role / stats / pitch.
  function buildHeroTerminal(el, data) {
    const stats = Array.isArray(data.stats) ? data.stats : [];
    const statsHTML =
      `<div class="t-line t-stats">` +
      stats
        .map(
          (s) =>
            `<span class="t-stat"><b class="mono">${esc(s.value)}</b> <span>${esc(s.label)}</span></span>`
        )
        .join("") +
      `</div>`;

    const steps = [
      { cmd: "whoami", out: `<div class="t-line t-name">${esc(data.name || "")}</div>` },
      { cmd: "cat role.txt", out: `<div class="t-line t-role">${esc(data.role || "")}</div>` },
    ];
    if (stats.length) steps.push({ cmd: "./summary --stats", out: statsHTML });
    if (data.tagline)
      steps.push({ cmd: "echo $PITCH", out: `<div class="t-line t-pitch">${esc(data.tagline)}</div>` });

    const cmdLine = (c) =>
      `<div class="t-line"><span class="t-prompt">$</span> <span class="t-cmd">${esc(c)}</span></div>`;
    const endPrompt =
      `<div class="t-line"><span class="t-prompt">$</span> <span class="t-cursor t-blink" aria-hidden="true">▮</span></div>`;
    const finalHTML = steps.map((s) => cmdLine(s.cmd) + s.out).join("") + endPrompt;

    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.innerHTML = finalHTML;
      return;
    }

    let html = "";
    let si = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.innerHTML = finalHTML;
    };
    const safety = setTimeout(finish, 7000); // guarantee the final state
    function nextStep() {
      if (done) return;
      if (si >= steps.length) {
        clearTimeout(safety);
        finish();
        return;
      }
      const cmd = steps[si].cmd;
      let ci = 0;
      (function typeChar() {
        if (done) return;
        el.innerHTML =
          html +
          `<div class="t-line"><span class="t-prompt">$</span> <span class="t-cmd">${esc(
            cmd.slice(0, ci)
          )}</span><span class="t-cursor" aria-hidden="true">▮</span></div>`;
        el.scrollTop = el.scrollHeight;
        if (ci < cmd.length) {
          ci++;
          setTimeout(typeChar, 32);
        } else {
          html += cmdLine(cmd) + steps[si].out;
          el.innerHTML = html;
          el.scrollTop = el.scrollHeight;
          si++;
          setTimeout(nextStep, 300);
        }
      })();
    }
    nextStep();
  }

  function loadAbout(data) {
    const titleEl = $("#about-title");
    if (titleEl && data.sectionTitle) titleEl.textContent = data.sectionTitle;
    const contentEl = $("#about-content");
    if (contentEl && Array.isArray(data.content)) {
      contentEl.innerHTML = data.content.map((p) => `<p>${esc(p)}</p>`).join("");
    }
  }

  // Emphasize standalone metrics: percentages (65%), magnitudes (8M+, 3 TB),
  // and small integer counts (25). Conservative on purpose — stay readable.
  const METRIC_RE =
    /(\b\d[\d.,]*\s?(?:%|[KMB]\+?|TB|GB|PB|x)\b|\b\d[\d.,]*\+(?!\w))/gi;

  function emphasizeMetrics(text) {
    // Operate on escaped text so injected <strong> is the only markup.
    const escaped = esc(text);
    return escaped.replace(
      METRIC_RE,
      (m) => `<strong class="metric mono">${m}</strong>`
    );
  }

  // Derive a 1–2 letter monogram from a company name.
  // "Medsix,USA"->"M", "The Cigna Group,USA"->"CG", "Tata Capital,India"->"TC"
  function companyMonogram(company) {
    const clean = String(company == null ? "" : company)
      .split(",")[0]
      .replace(/^The\s+/i, "")
      .trim();
    return clean
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase();
  }

  // Real company logos (light chip); anything not listed falls back to a monogram.
  const COMPANY_LOGOS = { "Cigna Group": "cigna.svg", "Tata Capital": "tata.svg" };
  function companyLogoFile(company) {
    const clean = String(company == null ? "" : company)
      .split(",")[0]
      .replace(/^The\s+/i, "")
      .trim();
    return COMPANY_LOGOS[clean] || null;
  }
  function companyBadge(company) {
    const initials = companyMonogram(company);
    const file = companyLogoFile(company);
    if (file) {
      return (
        `<span class="company-logo has-logo" data-mono="${esc(initials)}" aria-hidden="true">` +
        `<img src="assets/img/logos/${file}" alt="" loading="lazy" ` +
        `onerror="var s=this.parentElement;s.classList.remove('has-logo');s.textContent=s.dataset.mono"></span>`
      );
    }
    return `<span class="company-logo mono" aria-hidden="true">${esc(initials)}</span>`;
  }

  function loadExperience(data) {
    const titleEl = $("#experience-title");
    if (titleEl && data.sectionTitle) titleEl.textContent = data.sectionTitle;
    const listEl = $("#experience-list");
    if (!listEl || !Array.isArray(data.experiences)) return;

    listEl.innerHTML = data.experiences
      .map((xp) => {
        const points = (xp.responsibilities || [])
          .map((r) => `<li>${emphasizeMetrics(r)}</li>`)
          .join("");
        return (
          `<article class="xp">` +
          `<span class="xp-dot" aria-hidden="true"></span>` +
          `<div class="xp-head">` +
          `<span class="xp-period mono">${esc(xp.period)}</span>` +
          `<h3 class="xp-title">${esc(xp.title)}</h3>` +
          `<p class="xp-company mono">${companyBadge(xp.company)}<span class="xp-company-name">${esc(xp.company)}</span></p>` +
          `</div>` +
          `<ul class="xp-points">${points}</ul>` +
          `</article>`
        );
      })
      .join("");
  }

  function repoSlug(project) {
    if (project.github) {
      const clean = project.github.replace(/\/+$/, "");
      const slug = clean.substring(clean.lastIndexOf("/") + 1);
      if (slug) return slug;
    }
    return project.title || "project";
  }

  // Category -> image filename slug (files at assets/img/projects/<slug>.png).
  const CATEGORY_SLUG = {
    "GenAI / LLM": "genai",
    "Machine Learning": "ml",
    "Data Science": "datascience",
    Web: "web",
    MLOps: "mlops",
    Security: "security",
    "Computer Vision": "cv",
  };

  function slugForCategory(category) {
    return CATEGORY_SLUG[category] || "genai";
  }

  function loadProjects(data) {
    const titleEl = $("#work-title");
    if (titleEl && data.sectionTitle) titleEl.textContent = data.sectionTitle;

    const grid = $("#work-grid");
    const filters = $("#work-filters");
    const projects = Array.isArray(data.projects) ? data.projects.slice() : [];
    if (!grid) return;

    // Featured first, otherwise preserve original order (stable sort).
    projects.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    // Build filter bar from distinct categories.
    const cats = [];
    projects.forEach((p) => {
      if (p.category && !cats.includes(p.category)) cats.push(p.category);
    });

    if (filters) {
      const btns = [
        `<button class="filter is-active" data-filter="all" aria-pressed="true">All</button>`,
      ].concat(
        cats.map(
          (c) =>
            `<button class="filter" data-filter="${attr(c)}" aria-pressed="false">${esc(
              c
            )}</button>`
        )
      );
      filters.innerHTML = btns.join("");
    }

    grid.innerHTML = projects
      .map((p) => {
        const slug = repoSlug(p);
        const imgSlug = slugForCategory(p.category);
        const tags = (p.technologies || [])
          .map((t) => `<li class="chip mono">${esc(t)}</li>`)
          .join("");
        const links = p.github
          ? `<div class="proj-links"><a class="proj-link mono" href="${attr(
              p.github
            )}" target="_blank" rel="noopener" aria-label="${attr(
              p.title
            )} source on GitHub"><i class="fab fa-github"></i> Source</a></div>`
          : "";
        return (
          `<article class="proj" data-category="${attr(p.category)}">` +
          `<div class="proj-tile" aria-hidden="true">` +
          `<img class="proj-img" src="assets/img/projects/${attr(
            imgSlug
          )}.png" alt="" loading="lazy" aria-hidden="true" onerror="this.remove()">` +
          `<span class="proj-mono mono">${esc(slug)}</span></div>` +
          `<div class="proj-body">` +
          `<span class="proj-cat mono">${esc(p.category)}</span>` +
          `<h3 class="proj-title">${esc(p.title)}</h3>` +
          `<p class="proj-desc">${esc(p.description)}</p>` +
          `<ul class="proj-tags">${tags}</ul>` +
          links +
          `</div>` +
          `</article>`
        );
      })
      .join("");

    // Filter behavior.
    if (filters) {
      filters.addEventListener("click", (e) => {
        const btn = e.target.closest(".filter");
        if (!btn) return;
        const val = btn.getAttribute("data-filter");
        $$(".filter", filters).forEach((b) => {
          const active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });
        $$(".proj", grid).forEach((card) => {
          const show =
            val === "all" || card.getAttribute("data-category") === val;
          card.style.display = show ? "" : "none";
        });
      });
    }
  }

  function loadSkills(data) {
    const titleEl = $("#skills-title");
    if (titleEl && data.sectionTitle) titleEl.textContent = data.sectionTitle;
    const grid = $("#skills-grid");
    if (!grid || !Array.isArray(data.categories)) return;

    grid.innerHTML = data.categories
      .map((cat) => {
        const chips = (cat.skills || [])
          .map((s) => `<li class="chip mono">${esc(s)}</li>`)
          .join("");
        return (
          `<div class="skillcat">` +
          `<div class="skillcat-head">` +
          `<i class="${attr(cat.icon)}" aria-hidden="true"></i>` +
          `<h3 class="skillcat-name">${esc(cat.name)}</h3>` +
          `</div>` +
          `<ul class="chips">${chips}</ul>` +
          `</div>`
        );
      })
      .join("");
  }

  function loadEducation(data) {
    const titleEl = $("#education-title");
    if (titleEl && data.sectionTitle) titleEl.textContent = data.sectionTitle;
    const listEl = $("#education-list");
    if (!listEl || !Array.isArray(data.education)) return;

    listEl.innerHTML = data.education
      .map(
        (ed) =>
          `<article class="edu">` +
          `<span class="edu-period mono">${esc(ed.period)}</span>` +
          `<h3 class="edu-degree">${esc(ed.degree)}</h3>` +
          `<p class="edu-school">${esc(ed.school)}</p>` +
          `</article>`
      )
      .join("");
  }

  function loadContact(data) {
    const titleEl = $("#contact-title");
    if (titleEl && data.sectionTitle) titleEl.textContent = data.sectionTitle;
    const subEl = $("#contact-subtitle");
    if (subEl && data.subtitle) subEl.textContent = data.subtitle;

    const infoEl = $("#contact-info");
    if (infoEl) {
      const items = [];
      if (data.email) {
        items.push(
          `<div class="contact-item mono"><i class="fas fa-envelope" aria-hidden="true"></i>` +
            `<a href="mailto:${attr(data.email)}">${esc(data.email)}</a></div>`
        );
      }
      if (data.location) {
        items.push(
          `<div class="contact-item mono"><i class="fas fa-location-dot" aria-hidden="true"></i>` +
            `<span>${esc(data.location)}</span></div>`
        );
      }
      if (data.availability) {
        items.push(
          `<div class="contact-item mono"><i class="fas fa-circle-check" aria-hidden="true"></i>` +
            `<span>${esc(data.availability)}</span></div>`
        );
      }
      infoEl.innerHTML = items.join("");
    }

    const socialEl = $("#contact-social");
    if (socialEl && Array.isArray(data.socialLinks)) {
      socialEl.innerHTML = data.socialLinks
        .map((s) => iconLink(s.platform, s.url, s.icon))
        .join("");
    }
  }

  function loadFooter(data) {
    const textEl = $("#footer-text");
    if (textEl && data.text) textEl.textContent = data.text;
    const copyEl = $("#footer-copyright");
    if (copyEl && data.copyright) copyEl.textContent = data.copyright;
    const linksEl = $("#footer-links");
    if (linksEl && Array.isArray(data.links)) {
      linksEl.innerHTML = data.links
        .map(
          (l) =>
            `<a href="${attr(l.url)}" target="_blank" rel="noopener">${esc(
              l.text
            )}</a>`
        )
        .join("");
    }
  }

  /* ---------------------------------------------------------------------- *
   * Interactions
   * ---------------------------------------------------------------------- */
  function initNavToggle() {
    const toggle = $("#nav-toggle");
    const menu = $("#nav-menu");
    if (!toggle || !menu) return;

    const close = () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", (e) => {
      if (e.target.closest(".nav-link")) close();
    });
  }

  function initScrollSpy() {
    const links = $$("#nav-menu .nav-link");
    const sections = $$("main .section");
    const nodes = $$(".spine-node");
    if (!sections.length) return;

    const byId = {};
    links.forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#")) byId[href.slice(1)] = a;
    });
    const nodeById = {};
    nodes.forEach((n) => {
      nodeById[n.getAttribute("data-node")] = n;
    });

    const setActive = (id) => {
      links.forEach((a) => a.classList.remove("active"));
      nodes.forEach((n) => n.classList.remove("active"));
      if (byId[id]) byId[id].classList.add("active");
      if (nodeById[id]) nodeById[id].classList.add("active");
    };

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) setActive(en.target.id);
          });
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
      );
      sections.forEach((s) => obs.observe(s));
    } else {
      const onScroll = () => {
        let current = sections[0].id;
        const y = window.scrollY + window.innerHeight * 0.35;
        sections.forEach((s) => {
          if (s.offsetTop <= y) current = s.id;
        });
        setActive(current);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  function initReveal() {
    const targets = $$("main .section");
    if (!targets.length) return;

    if (REDUCED_MOTION || !("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("in"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries, ob) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            ob.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    targets.forEach((t) => obs.observe(t));
  }

  function initBackToTop() {
    const btn = $("#back-to-top");
    if (!btn) return;
    const onScroll = () => {
      btn.classList.toggle("is-visible", window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    btn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: REDUCED_MOTION ? "auto" : "smooth",
      });
    });
  }

  function initSmoothAnchors() {
    if (REDUCED_MOTION) return;
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---------------------------------------------------------------------- *
   * Dataflow canvas: ingest -> transform -> model -> serve
   * ---------------------------------------------------------------------- */
  function initDataflow() {
    const canvas = $("#dataflow");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");

    const root = getComputedStyle(document.documentElement);
    const pick = (name, fallback) => {
      const v = root.getPropertyValue(name).trim();
      return v || fallback;
    };
    const C_WIRE = pick("--wire", "#3C566B");
    const C_SIGNAL = pick("--signal", "#FFB454");
    const C_NODE = pick("--ink-2", "#10161E");

    const labels = ["ingest", "transform", "model", "serve"];
    let W = 0,
      H = 0,
      dpr = 1;
    let nodes = [];

    function layout() {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Zig-zag pipeline layout.
      const padX = W * 0.14;
      const usableW = W - padX * 2;
      const yTop = H * 0.32;
      const yBot = H * 0.68;
      nodes = labels.map((lab, i) => {
        const t = labels.length > 1 ? i / (labels.length - 1) : 0;
        return {
          x: padX + usableW * t,
          y: i % 2 === 0 ? yTop : yBot,
          label: lab,
        };
      });
    }

    function drawNode(n) {
      const r = Math.max(6, Math.min(W, H) * 0.028);
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = C_NODE;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C_SIGNAL;
      ctx.stroke();

      ctx.fillStyle = C_WIRE;
      ctx.font = `500 ${Math.max(
        9,
        Math.min(W, H) * 0.05
      )}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(n.label, n.x, n.y + r + 6);
    }

    function drawFrame(progress) {
      ctx.clearRect(0, 0, W, H);

      // Edges.
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C_WIRE;
      for (let i = 0; i < nodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[i + 1].x, nodes[i + 1].y);
        ctx.stroke();
      }

      // Nodes.
      nodes.forEach(drawNode);

      // Packet(s) travelling along the edge chain.
      const segCount = nodes.length - 1;
      if (segCount > 0) {
        const packets = REDUCED_MOTION
          ? [0.5]
          : [progress, (progress + 0.5) % 1];
        packets.forEach((p) => {
          const scaled = p * segCount;
          const seg = Math.min(segCount - 1, Math.floor(scaled));
          const local = scaled - seg;
          const a = nodes[seg];
          const b = nodes[seg + 1];
          const px = a.x + (b.x - a.x) * local;
          const py = a.y + (b.y - a.y) * local;

          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fillStyle = C_SIGNAL;
          ctx.shadowColor = C_SIGNAL;
          ctx.shadowBlur = 14;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }
    }

    let raf = null;
    function tick(ts) {
      const period = 4200; // ms per full pass
      const progress = (ts % period) / period;
      drawFrame(progress);
      raf = requestAnimationFrame(tick);
    }

    function start() {
      layout();
      if (REDUCED_MOTION) {
        drawFrame(0.5); // single static frame; no RAF loop
        return;
      }
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    }

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        layout();
        if (REDUCED_MOTION) drawFrame(0.5);
      }, 150);
    });

    start();
  }

  /* ---------------------------------------------------------------------- *
   * Init
   * ---------------------------------------------------------------------- */
  async function init() {
    const files = {
      site: "site-config.json",
      nav: "navigation.json",
      hero: "hero.json",
      about: "about.json",
      experience: "experience.json",
      projects: "projects.json",
      skills: "skills.json",
      education: "education.json",
      contact: "contact.json",
      footer: "footer.json",
    };

    const entries = Object.entries(files);
    const results = await Promise.all(
      entries.map(([, file]) =>
        fetchJSON(file).catch((err) => {
          console.error(`[fetch ${file}]`, err);
          return null;
        })
      )
    );

    const data = {};
    entries.forEach(([key], i) => (data[key] = results[i]));

    if (data.site) safe("siteConfig", () => loadSiteConfig(data.site));
    if (data.nav) safe("navigation", () => loadNavigation(data.nav));
    if (data.hero) safe("hero", () => loadHero(data.hero));
    if (data.about) safe("about", () => loadAbout(data.about));
    if (data.experience) safe("experience", () => loadExperience(data.experience));
    if (data.projects) safe("projects", () => loadProjects(data.projects));
    if (data.skills) safe("skills", () => loadSkills(data.skills));
    if (data.education) safe("education", () => loadEducation(data.education));
    if (data.contact) safe("contact", () => loadContact(data.contact));
    if (data.footer) safe("footer", () => loadFooter(data.footer));

    // Hydrate static identity chrome the section loaders don't touch: the
    // terminal prompt label, the portrait caption/alt, and the author meta tag.
    safe("identityChrome", () => {
      const name =
        (data.hero && data.hero.name) ||
        (data.site && data.site.meta && data.site.meta.author) ||
        "";
      if (!name) return;
      const first = name.trim().split(/\s+/)[0] || "user";
      const loc = (data.contact && data.contact.location) || "";
      const promptEl = document.querySelector(".terminal-label");
      if (promptEl) promptEl.textContent = `${first.toLowerCase()}@portfolio: ~`;
      const capEl = document.querySelector(".about-portrait figcaption");
      if (capEl) capEl.textContent = loc ? `${name} · ${loc}` : name;
      const portraitImg = document.querySelector(".about-portrait img");
      if (portraitImg) {
        portraitImg.alt = `Portrait of ${name}`;
        // Without this the bundled demo portrait ships to the customer.
        const avatar = data.hero && data.hero.avatarUrl;
        if (avatar) portraitImg.src = avatar;
      }
      const metaAuthor = document.querySelector('meta[name="author"]');
      if (metaAuthor) metaAuthor.setAttribute("content", name);
    });

    // Interactions (independent of any single data file).
    safe("navToggle", initNavToggle);
    safe("scrollSpy", initScrollSpy);
    safe("reveal", initReveal);
    safe("backToTop", initBackToTop);
    safe("smoothAnchors", initSmoothAnchors);
    safe("dataflow", initDataflow);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => safe("init", init));
  } else {
    safe("init", init);
  }
})();
