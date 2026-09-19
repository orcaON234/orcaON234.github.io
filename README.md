# orcaon234.github.io

Personal portfolio site for **Ocean Ng** — served at **https://orcaon234.github.io**

Built with plain HTML, CSS, and vanilla JavaScript. No build step, no dependencies, no
package manager. Push and it is live.

---

## Repository naming (important)

This must be a **user site** repository, so the name has to be exactly
`<username>.github.io` with the username **lowercased**:

| | |
| :--- | :--- |
| Repository name | Exactly `orcaON234.github.io` — it must match your username with `.github.io` appended |
| Published URL | `https://orcaon234.github.io` (the host part is always lowercased) |
| Entry file | `index.html` at the **top level** of the publishing source |

If you would rather publish it as a project site (`orcaon234.github.io/portfolio/`), rename
the repository to something else and set **Settings → Pages → Source** accordingly. All asset
paths in this project are relative, so it works either way without edits.

---

## Deploy in 6 steps

1. Create a new **public** repository on GitHub named exactly `orcaON234.github.io`
   (no README, no .gitignore — this folder already has them).
2. From inside this folder, initialise and push:

   ```bash
   git init
   git add .
   git commit -m "Initial portfolio scaffold"
   git branch -M main
   git remote add origin https://github.com/orcaON234/orcaON234.github.io.git
   git push -u origin main
   ```

3. On GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to `Deploy from a branch`, then choose
   branch **`main`** and folder **`/ (root)`**. Save. (If it already defaults to a GitHub
   Actions workflow, switch it to the branch option — this is a static site with nothing to build.)
5. Wait for the first deployment. GitHub notes it can take **up to 10 minutes** for changes to
   publish; the Actions tab shows progress.
6. Visit **https://orcaon234.github.io** and confirm it loads.

Then, optionally, enable **Enforce HTTPS** on the same Pages settings screen.

> `.nojekyll` is included and must stay. Branch publishing runs Jekyll by default; this empty
> file disables it so your files are served exactly as committed.

---

## Scope: this complements the résumé, it does not repeat it

Deliberate design decision — the page covers **tech stack, research, and projects only**:

| On this page | On the résumé |
| :--- | :--- |
| Grouped tech stack (chips) | One-line skills list |
| Projects, pulled live from GitHub | Selected projects, trimmed |
| Research interests and technical depth | Work history, dates, titles |
| — | Education, GPA, coursework, honors |
| — | Awards, certifications |

There is **no Experience or Education section**, on purpose. A recruiter already has your
résumé; duplicating it here spends the ten seconds they will actually give this page. Instead,
the About panel carries a single **"Full history → See résumé (PDF)"** link for anyone who
wants the chronology.

If you later want a work-history block back, add a `<section class="section section--alt"
id="experience">` plus a matching nav link — the timeline CSS was removed in this cleanup, so
you would be writing those styles fresh.

---

## What to edit before you share the link

Everything visible is a labelled placeholder. Search for `[Add:` to find every one.

| What | File | Notes |
| :--- | :--- | :--- |
| Page title, meta description, social preview | `index.html` `<head>` | Shown in the browser tab, Google results, and link previews |
| Headline, pitch, quick facts | `index.html` → hero + `#about` | |
| Résumé PDF | `assets/Ocean-Ng-Resume.pdf` | Drop your PDF here with that exact name, or update all three `href`s (hero, About panel, contact) |
| **Your tech stack** | `assets/js/main.js` → `SKILL_GROUPS` | Single source of truth — the chips render from this array |
| Project card ordering / exclusions | `assets/js/main.js` → `FEATURED_REPOS`, `EXCLUDED_REPOS` | Featured repos list first, in your order |
| Project descriptions | `assets/js/main.js` → `REPO_DESCRIPTIONS` | Falls back to the repo's GitHub description |
| GitHub username | `assets/js/main.js` → `GITHUB_USERNAME` | Only change if you fork this |
| Headshot | `assets/img/portrait.jpg` | See the comment in the hero; swap the placeholder div for the `<img>` |
| Favicon | `assets/img/favicon.png` | 32×32 PNG is fine |
| Social preview image | `assets/img/og-preview.png` | 1200×630 PNG |
| Email / LinkedIn / GitHub links | `index.html` | Hero, contact grid, footer |

---

## Project files

```
orcaON234.github.io/
├── index.html                 # the page: hero, about, tech stack, projects, contact
├── 404.html                   # custom not-found page
├── .nojekyll                  # disables Jekyll on GitHub Pages — do not delete
├── .gitattributes             # pins LF line endings in the repo, regardless of local config
├── .gitignore
├── README.md
└── assets/
    ├── css/
    │   └── styles.css         # all styling, incl. dark-on-white print stylesheet
    ├── js/
    │   └── main.js            # nav, scroll spy, skill chips, live GitHub projects
    └── img/                   # favicon.png, og-preview.png, portrait.jpg
```

---

## How the GitHub project cards work

`assets/js/main.js` calls the public GitHub REST API and renders one card per repository:

```
https://api.github.com/users/orcaON234/repos?per_page=100&sort=pushed
```

Behaviour worth knowing:

- **Forks are hidden by default.** A "Show forked repositories" button toggles them. Several
  of your strongest repos are forks (CropSight, TrendRadar), so if you want them in the default
  view, either un-fork/re-create them as originals or set `showForks = true` as the initial
  state in `initProjects()`.
- **Archived repos are skipped**, as is the profile-README repo (`orcaON234.github.io`).
- **At most `MAX_PROJECTS` (default 9) cards render.** Change the constant to taste.
- **Responses are cached for 1 hour** in `sessionStorage`. The unauthenticated API allows only
  **60 requests per hour per IP**, so this keeps you well clear of the limit.
- **If the API fails**, a notice appears and the skeletons are cleared — the section never
  breaks the rest of the page.
- **Repo descriptions**: a hand-written entry in `REPO_DESCRIPTIONS` wins, then the repo's own
  GitHub *About* text, then a reminder placeholder. Filling in *About* on GitHub is the better
  long-term habit since it also improves your GitHub profile.

Prefer to hand-curate instead of auto-pulling? Comment out the `SKILL_GROUPS`-style API block
and use the static card template that is already commented out in `index.html` under
`#projects-grid-static`.

---

## Local preview

No tooling required — open `index.html` in a browser. For a proper local server (so the
GitHub API call and relative paths behave exactly as they will in production):

```bash
# Python 3
python -m http.server 8000

# or Node
npx serve .
```

Then visit <http://localhost:8000>.

Opening the file directly with `file://` also works, though some browsers restrict
`sessionStorage` on that scheme — the caching simply falls back to no-cache.

---

## Regenerating the print stylesheet behaviour

`Ctrl+P` / `Cmd+P` on the live site produces a clean, ink-light version: navigation, buttons,
and footer are dropped, cards collapse into a tidy two-column grid, and the URL prints under
your name. Use **Save as PDF** to hand recruiters a one-page summary straight from the site.
