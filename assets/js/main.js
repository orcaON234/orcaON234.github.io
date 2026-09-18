/* ==========================================================================
   Ocean Ng — Portfolio behaviour
   Plain (vanilla) JavaScript. No dependencies, no build step.

   Contents
   1.  Configuration
   2.  Utilities
   3.  Mobile navigation
   4.  Sticky header state
   5.  Active nav link (scroll spy)
   6.  Footer year
   7.  Skill chips
   8.  GitHub project cards
   9.  Bootstrap
   ========================================================================== */

(function () {
  "use strict";

  /* ========================================================================
     1. Configuration
     ======================================================================== */

  /** GitHub account whose public repositories are shown in #projects. */
  var GITHUB_USERNAME = "orcaON234";

  /**
   * How many repositories to display at most.
   * Set to Infinity to show every repository.
   */
  var MAX_PROJECTS = 9;

  /**
   * How long a cached GitHub response stays fresh, in milliseconds.
   * GitHub's unauthenticated API allows only 60 requests per hour per IP,
   * so caching matters — it also makes repeat visits instant.
   * Default: 1 hour.
   */
  var CACHE_TTL_MS = 60 * 60 * 1000;

  /**
   * Repositories that should never appear (profile README repo, etc.).
   * Matched case-insensitively against the repository name.
   */
  var EXCLUDED_REPOS = [
    GITHUB_USERNAME.toLowerCase() + ".github.io"
  ];

  /**
   * Optional hand-picked ordering. Any repository named here is listed first,
   * in this exact order; everything else follows by most recently pushed.
   * Names are case-insensitive.
   */
  var FEATURED_REPOS = [
    "rust-vpn-project",
    "cropsight",
    "youtube-tag-trend"
  ];

  /**
   * Skill groups rendered into #skills-grid.
   * ---------------------------------------------------------------------
   * EDIT ME: this is the single place to maintain your tech stack.
   * Add, remove, or rename groups and chips freely — the layout adapts.
   * ---------------------------------------------------------------------
   */
  var SKILL_GROUPS = [
    {
      title: "Languages",
      items: ["C++", "Python", "Rust", "TypeScript", "JavaScript", "SQL", "MATLAB", "LaTeX"]
    },
    {
      title: "Machine Learning & Data",
      items: ["PyTorch", "scikit-learn", "Pandas", "NumPy", "Signal Processing", "Feature Engineering", "Model Evaluation"]
    },
    {
      title: "Systems & Robotics",
      items: ["ROS", "Monte Carlo Localization", "Linux", "Git", "Concurrency", "Distributed Systems"]
    },
    {
      title: "Web & Interfaces",
      items: ["React", "Next.js", "HTML", "CSS", "Figma", "REST APIs"]
    },
    {
      title: "Data Stores & Pipelines",
      items: ["PostgreSQL", "MySQL", "Neo4j", "Apache Spark", "ETL & Data Ingestion"]
    },
    {
      title: "Ways of Working",
      items: ["Agile / Scrum", "Code Review", "Technical Writing", "Mentoring", "Cross-functional Collaboration"]
    }
  ];

  /**
   * Hand-written descriptions for repositories whose GitHub "About" field is
   * still empty. Matched case-insensitively against the repository name.
   * ---------------------------------------------------------------------
   * EDIT ME: the better long-term fix is to set the description on GitHub
   * itself (repo -> About -> Description). Anything listed here overrides
   * GitHub, so you can also use this to sharpen a description for recruiters.
   * ---------------------------------------------------------------------
   */
  var REPO_DESCRIPTIONS = {
    "rust-vpn-project": "A VPN implemented from scratch in Rust — packet handling, tunnelling, and encryption primitives built without a networking framework.",
    "youtube-tag-trend": "Tool for comparing YouTube video tags over time, so creators can see which tags actually track with performance.",
    "cropsight": "Multimodal deep learning pipeline for crop-type classification from temporal remote sensing imagery, spanning 16 land-use categories.",
    "cs498hw4": "Coursework for CS 498 — [add the topic this assignment covered].",
    "498hw3": "Coursework for CS 498 — [add the topic this assignment covered].",
    "498homework2": "Coursework for CS 498 — [add the topic this assignment covered].",
    "youtube_tag_trend": "Earlier Python iteration of the YouTube tag trend analysis tool."
  };

  /**
   * Language colours for the dot on each project card.
   * Keys are GitHub's language names; anything unmapped gets a neutral grey.
   */
  var LANGUAGE_COLORS = {
    "Rust": "#dea584",
    "Python": "#3572A5",
    "TypeScript": "#3178c6",
    "JavaScript": "#f1e05a",
    "Jupyter Notebook": "#DA5B0B",
    "C++": "#f34b7d",
    "C": "#555555",
    "Java": "#b07219",
    "Go": "#00ADD8",
    "HTML": "#e34c26",
    "CSS": "#563d7c",
    "Shell": "#89e051",
    "TeX": "#3D6117",
    "MATLAB": "#e16737"
  };


  /* ========================================================================
     2. Utilities
     ======================================================================== */

  var $  = function (selector, scope) {
    return (scope || document).querySelector(selector);
  };

  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };

  /** Create an element with attributes and children in one call. */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);

    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "class") {
        node.className = attrs[key];
      } else if (key === "text") {
        node.textContent = attrs[key];
      } else if (key.indexOf("on") === 0 && typeof attrs[key] === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
      } else if (attrs[key] !== null && attrs[key] !== undefined) {
        node.setAttribute(key, attrs[key]);
      }
    });

    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });

    return node;
  }

  /** Format 1200 -> "1.2k" so star counts stay compact. */
  function formatCount(value) {
    var n = Number(value) || 0;
    if (n < 1000) return String(n);
    return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
  }

  /** "2026-04-21T05:22:09Z" -> "Apr 2026" */
  function formatMonthYear(isoString) {
    if (!isoString) return "";
    var date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  /** Read JSON from sessionStorage without throwing on corrupt or blocked data. */
  function cacheGet(key) {
    try {
      var raw = window.sessionStorage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.timestamp !== "number") return null;
      if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
      return parsed.payload;
    } catch (error) {
      return null; // private mode, disabled storage, or bad JSON
    }
  }

  function cacheSet(key, payload) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify({
        timestamp: Date.now(),
        payload: payload
      }));
    } catch (error) {
      /* Storage full or unavailable — caching is a nice-to-have, so ignore. */
    }
  }


  /* ========================================================================
     3. Mobile navigation
     ======================================================================== */
  function initNavigation() {
    var toggle = $("#nav-toggle");
    var nav = $("#primary-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
    }

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }

    toggle.addEventListener("click", function () {
      setOpen(!isOpen());
    });

    /* Tapping any link closes the mobile panel so the target is visible. */
    $$(".nav-link", nav).forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    /* Escape closes the panel and returns focus to the button. */
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    /* Clicking outside the header closes the panel. */
    document.addEventListener("click", function (event) {
      if (!isOpen()) return;
      if (!event.target.closest(".site-header")) setOpen(false);
    });

    /* Reset state when the viewport grows back to desktop. */
    var wide = window.matchMedia("(min-width: 769px)");
    var onWideChange = function (event) {
      if (event.matches) setOpen(false);
    };
    if (wide.addEventListener) wide.addEventListener("change", onWideChange);
    else if (wide.addListener) wide.addListener(onWideChange);
  }


  /* ========================================================================
     4. Sticky header state
     ======================================================================== */
  function initHeaderState() {
    var header = $("#site-header");
    if (!header) return;

    var ticking = false;

    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    update();
  }


  /* ========================================================================
     5. Active nav link (scroll spy)
     ======================================================================== */

  /**
   * Decide which nav link should be active from a set of IntersectionObserver
   * entries. Kept separate from the observer wiring so the selection rule can
   * be unit-tested directly.
   *
   * @param {Array} entries  IntersectionObserverEntry-like objects, each with
   *                         `target.id` and `intersectionRatio`.
   * @returns {string|null}  The id of the most-visible section, if any.
   */
  function pickMostVisibleSection(entries) {
    var bestId = null;
    var bestRatio = 0;

    entries.forEach(function (entry) {
      var id = entry && entry.target && entry.target.id;
      if (!id) return;
      var ratio = entry.isIntersecting ? (entry.intersectionRatio || 0) : 0;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestId = id;
      }
    });

    // A section must be at least slightly visible to claim the highlight;
    // otherwise the hero is showing and no nav item should be lit.
    return bestRatio > 0 ? bestId : null;
  }

  function markActiveLink(links, id) {
    links.forEach(function (link) {
      var match = id !== null && link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", match);
      if (match) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function initScrollSpy() {
    var links = $$(".nav-link[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var sections = links
      .map(function (link) {
        return document.getElementById(link.getAttribute("href").slice(1));
      })
      .filter(Boolean);

    if (!sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      markActiveLink(links, pickMostVisibleSection(entries));
    }, {
      rootMargin: "-80px 0px -55% 0px",
      threshold: [0, 0.15, 0.35, 0.6, 1]
    });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }


  /* ========================================================================
     6. Footer year
     ======================================================================== */
  function initFooterYear() {
    var node = $("#footer-year");
    if (node) node.textContent = String(new Date().getFullYear());
  }


  /* ========================================================================
     7. Skill chips
     ======================================================================== */
  function renderSkills() {
    var grid = $("#skills-grid");
    if (!grid) return;

    grid.textContent = ""; // clear any static fallback / noscript content

    SKILL_GROUPS.forEach(function (group, index) {
      var list = el("ul", { class: "chip-list" },
        group.items.map(function (item) {
          return el("li", { class: "chip", text: item });
        })
      );

      var title = el("h3", {
        class: "skill-group-title",
        "data-index": String(index + 1).padStart(2, "0"),
        text: group.title
      });

      grid.appendChild(el("article", { class: "skill-group" }, [title, list]));
    });
  }


  /* ========================================================================
     8. GitHub project cards
     ======================================================================== */
  function initProjects() {
    var grid = $("#projects-grid");
    var notice = $("#projects-notice");
    var forkToggle = $("#toggle-forks");
    if (!grid) return;

    var allRepos = [];      // filtered, ordered, ready to render
    var showForks = false;  // view state

    function showNotice(message) {
      if (!notice) return;
      notice.textContent = message;
      notice.hidden = false;
    }

    function hideNotice() {
      if (notice) notice.hidden = true;
    }

    /* ---- ordering ------------------------------------------------------ */

    function orderRepos(repos) {
      var featured = FEATURED_REPOS.map(function (name) { return name.toLowerCase(); });

      return repos.slice().sort(function (a, b) {
        var ai = featured.indexOf(a.name.toLowerCase());
        var bi = featured.indexOf(b.name.toLowerCase());

        var aFeatured = ai !== -1;
        var bFeatured = bi !== -1;

        // Hand-picked repos always come first, in the declared order.
        if (aFeatured && bFeatured) return ai - bi;
        if (aFeatured) return -1;
        if (bFeatured) return 1;

        // Then most recently pushed.
        return new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0);
      });
    }

    function visibleRepos() {
      return allRepos
        .filter(function (repo) { return showForks || !repo.fork; })
        .slice(0, MAX_PROJECTS);
    }

    /* ---- card rendering ------------------------------------------------ */

    function buildCard(repo) {
      // Title link inherits the card's ink colour so the whole heading reads as
      // one clickable unit rather than a blue link. Styled in styles.css.
      var titleLink = el("a", {
        href: repo.html_url,
        target: "_blank",
        rel: "noopener noreferrer",
        text: repo.name
      });

      var title = el("h3", { class: "project-title" }, [titleLink]);
      var head = el("header", { class: "project-head" }, [title]);

      if (repo.fork) {
        head.appendChild(el("span", { class: "badge", text: "Fork" }));
      }

      // Prefer a hand-written override, then GitHub's own description, then a
      // gentle prompt so the card never looks empty.
      var description =
        REPO_DESCRIPTIONS[repo.name.toLowerCase()] ||
        REPO_DESCRIPTIONS[repo.name] ||
        repo.description ||
        "[Add: a one-line description of this project — set it on GitHub under " +
        "\u201cAbout\u201d to have it appear here automatically.]";

      var desc = el("p", { class: "project-desc", text: description });

      var stats = el("div", { class: "project-stats" });

      if (repo.language) {
        stats.appendChild(el("span", { class: "stat" }, [
          el("span", {
            class: "lang-dot",
            style: "background-color:" +
              (LANGUAGE_COLORS[repo.language] || "#8b949e") + ";"
          }),
          el("span", { text: repo.language })
        ]));
      }

      if (repo.stargazers_count) {
        stats.appendChild(el("span", {
          class: "stat",
          text: "★ " + formatCount(repo.stargazers_count)
        }));
      }

      if (repo.forks_count) {
        stats.appendChild(el("span", {
          class: "stat",
          text: "⑂ " + formatCount(repo.forks_count)
        }));
      }

      var pushed = formatMonthYear(repo.pushed_at);
      if (pushed) {
        stats.appendChild(el("span", { class: "stat", text: "Updated " + pushed }));
      }

      var links = el("footer", { class: "project-links" }, [
        el("a", {
          class: "link-arrow",
          href: repo.html_url,
          target: "_blank",
          rel: "noopener noreferrer",
          text: "Repository →"
        })
      ]);

      if (repo.homepage) {
        links.appendChild(el("a", {
          class: "link-arrow",
          href: repo.homepage,
          target: "_blank",
          rel: "noopener noreferrer",
          text: "Live demo →"
        }));
      }

      return el("article", { class: "card project-card" }, [head, desc, stats, links]);
    }

    function render() {
      var repos = visibleRepos();
      grid.textContent = "";

      if (!repos.length) {
        showNotice(
          showForks
            ? "No public repositories were returned for this account."
            : "No original (non-forked) repositories were returned. " +
              "Use the button above to include forked repositories."
        );
        return;
      }

      hideNotice();
      repos.forEach(function (repo) {
        grid.appendChild(buildCard(repo));
      });
    }

    /* ---- fork toggle --------------------------------------------------- */

    if (forkToggle) {
      forkToggle.addEventListener("click", function () {
        showForks = !showForks;
        forkToggle.setAttribute("aria-pressed", showForks ? "true" : "false");
        forkToggle.textContent = showForks
          ? "Hide forked repositories"
          : "Show forked repositories";
        render();
      });
    }

    /* ---- data loading -------------------------------------------------- */

    var CACHE_KEY = "gh-repos:" + GITHUB_USERNAME;

    function prepare(rawRepos) {
      allRepos = orderRepos(
        rawRepos.filter(function (repo) {
          if (!repo || !repo.name) return false;
          if (repo.archived) return false;
          return EXCLUDED_REPOS.indexOf(repo.name.toLowerCase()) === -1;
        })
      );
      render();
    }

    var cached = cacheGet(CACHE_KEY);
    if (cached) {
      prepare(cached);
      return;
    }

    var endpoint = "https://api.github.com/users/" +
      encodeURIComponent(GITHUB_USERNAME) +
      "/repos?per_page=100&sort=pushed";

    fetch(endpoint, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (response) {
        if (response.status === 403 || response.status === 404) {
          throw new Error("GitHub API returned " + response.status);
        }
        if (!response.ok) {
          throw new Error("GitHub API returned " + response.status);
        }
        return response.json();
      })
      .then(function (repos) {
        if (!Array.isArray(repos)) throw new Error("Unexpected API payload");
        cacheSet(CACHE_KEY, repos);
        prepare(repos);
      })
      .catch(function () {
        allRepos = [];
        render();
        showNotice(
          "Could not load repositories from the GitHub API right now " +
          "(the unauthenticated limit is 60 requests per hour). " +
          "Refresh in a few minutes, or browse them directly on GitHub."
        );
        /* Clear the skeletons so the failure is unmistakable. */
        grid.textContent = "";
      });
  }


  /* ========================================================================
     9. Bootstrap
     ======================================================================== */
  function init() {
    initNavigation();
    initHeaderState();
    initScrollSpy();
    initFooterYear();
    renderSkills();
    initProjects();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
