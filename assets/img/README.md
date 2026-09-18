# assets/img

Image assets referenced by `index.html`. Add these files with these exact names, or update
the paths in `index.html` to match whatever you use.

| File | Purpose | Recommended size |
| :--- | :--- | :--- |
| `favicon.png` | Browser tab icon | 32×32 or 48×48 PNG |
| `og-preview.png` | Preview card on LinkedIn, Slack, iMessage | 1200×630 PNG |
| `portrait.jpg` | Headshot in the hero | 600×600 or larger, square crop |

**Headshot:** `index.html` currently ships a dashed placeholder box in the hero. To use a real
photo, delete the `<div class="portrait-placeholder">…</div>` element and uncomment the
`<img>` line directly above it.

Keep images optimised — GitHub Pages serves them as-is, and a multi-megabyte headshot is the
fastest way to make a portfolio feel slow. Anything above ~300 KB is worth compressing.
