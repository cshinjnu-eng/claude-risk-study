# Four-page poster implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce and publish four readable 1080 × 1350 px Xiaohongshu posters that turn the current survey findings into a measured invitation to use the risk checker.

**Architecture:** One self-contained HTML file contains four poster sections and their shared editorial CSS. A generated QR image is reused by each section. Playwright renders each section to a named PNG so source and delivery images remain synchronized.

**Tech Stack:** Static HTML/CSS, local QR encoder, Playwright with installed Google Chrome, Prettier, GitHub Pages deployment.

## Global Constraints

- Canvas is exactly 1080 × 1350 px with 76 px safe margins.
- Use cream, ink, red, and gray only; no gradients, glass, glow, or card grid.
- Every page uses the real QR URL `http://claude-risk.bsbsanwu.xyz/`.
- Treat all numeric results as sample-level evidence, never as personal probability or official platform policy.

---

### Task 1: Build the shared source and QR asset

**Files:**

- Create: `posters/study-20260710.html`
- Create: `assets/risk-checker-qr.png`

**Produces:** Four `.poster` sections with the class names `cover`, `signal`, `profiles`, and `method`, each rendering at 1080 × 1350 px.

- [ ] Generate an error-corrected PNG QR code for `http://claude-risk.bsbsanwu.xyz/` and decode it once to verify the exact URL.
- [ ] Implement the four poster sections using the approved text from `docs/superpowers/specs/2026-07-10-xiaohongshu-poster-design.md`.
- [ ] Run `prettier --write posters/study-20260710.html`.

### Task 2: Render and inspect deliverables

**Files:**

- Create: `posters/01-cover.png`
- Create: `posters/02-main-signal.png`
- Create: `posters/03-lower-event-profiles.png`
- Create: `posters/04-method-and-qr.png`

**Consumes:** `.poster` sections from `posters/study-20260710.html`.

- [ ] Render each section with Playwright at 1080 × 1350 px.
- [ ] Verify each PNG dimensions with `file posters/0*.png`.
- [ ] Visually inspect all four pages for crop, contrast, body-size, and QR placement issues.

### Task 3: Publish the reviewed campaign

**Files:**

- Modify: `README.md`
- Modify: `posters/carousel.html` only if it needs a pointer to the new campaign source.

**Produces:** A committed repository whose four new campaign PNGs and source are available from GitHub.

- [ ] Add the new source and four export files to the project file list.
- [ ] Run `git diff --check` and verify the working tree contains only campaign files.
- [ ] Commit with `git commit -m "Add four-page survey poster campaign"` and push `main`.
