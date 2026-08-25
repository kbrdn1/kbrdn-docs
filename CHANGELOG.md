# Changelog

All notable changes to this repository are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This file tracks the **platform** itself (structure, shared package, tooling,
CI), which is versioned with SemVer tags from `v1.0.0` on. The **product docs**
are versioned separately, by branch (see
[CONTRIBUTING.md](CONTRIBUTING.md#versioning--releases)) — a gwm release does
not move this number, and this number does not freeze anyone's docs.

This root file carries the current `[Unreleased]` section only; every released
version lives in its own file under [`changelogs/`](changelogs/).

## [Unreleased]

### Fixed

- Accessibility pass on the whole UI surface written in this repo, against
  RGAA 4.1.2 / WCAG 2.2 AA. `--sl-color-accent` (#c15f3c) was declared
  identically in both themes and used as a text colour, which no single tone
  can survive: 4.11:1 on #1a1a1a, 3.87:1 on #f5f5f5. Text usages now go through
  Starlight's own `--sl-color-text-accent`, redeclared on `accent-high` in the
  light block because Starlight rests it back on `--sl-color-accent` there
  (`props.css:156`); hairlines, badge fills and every `color-mix()` keep the
  brand token, so the identity does not move. That one token was the
  root of 58 failing nodes on `/cli/` in light and 13 in dark, including the
  override that deliberately repainted inline code — the identifiers readers
  retype into a terminal — at 3.20:1
  ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).
- Footer copyright links are underlined at rest instead of on hover only: they
  sit inside a paragraph of text and were told apart by colour alone, at 1.48:1
  against the surrounding text where the threshold is 3:1 — so never at the
  keyboard ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).
- Focus ring on the four header tabs is visible again. `.kbrdn-nav__tabs` is
  `overflow: hidden` and the tabs fill their parent exactly (0 px of margin,
  measured), so a ring painted outside was entirely clipped while the 22 other
  tab stops kept theirs. It now paints inside, using the offset Starlight
  reserves for that case ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).
- Install-command copy button: named by its own visible text instead of a
  frozen English `aria-label` served as-is on `/fr/`, so the name follows the
  page language and keeps containing the visible label in both states (voice
  control could no longer target it once the label read "copied"). Success and
  clipboard failure — which used to pass in silence — are announced in a
  `role="status"` region ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).
- Image zoom dialog is named and closable. It was created without a label and
  holds only an `<img>`, so it announced as "dialog" and nothing else, with
  Escape as the only way out and nothing saying so. Its trigger now says what
  it does — `role="button"` turns the `alt` into a command name, which described
  the picture rather than the action — and decorative images (`alt=""`) are
  skipped instead of becoming focusable buttons with no accessible name
  ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).
- Footer labels are no longer `<h2>`: eight column headings sat at the same
  level as content sections, so 8 of the 24 headings in the home page outline
  were footer labels. They are `<p id>` naming their region, and the four link
  columns are real `<ul>`/`<li>` lists — the only navigation links on the site
  that were not ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).
- Site logo drops its redundant `alt` (the site title reads "gwm" right next to
  it, so the brand announced as "gwm gwm"), and the two availability dots stop
  after three pulses instead of animating forever — three and not four because
  3 x 1.6s = 4.8s, just under the 5s past which an animation owes the reader a
  stop control ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).
- Four more accent-as-text usages closed, all of them invisible at 1440 px and
  found by replaying the audit at its own two other viewports (320 px reflow,
  640 px for 200% zoom): the whole mobile table of contents, which is simply
  not in the DOM above the breakpoint; the hero tagline, which the audit
  exempted as large text — true only above ~800 px, below which the `clamp`
  drops it under 24 px and the threshold rises to 4.5:1; the repo card link
  label ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).
- **Known exception, deliberate.** The primary action button keeps the charter
  pair — #f5f5f5 on #c15f3c, 3.87:1 against a 4.5:1 threshold. Moving its rest
  state to `accent-high` would clear it (11.27:1 dark, 6.90:1 light) but turns
  the call to action into a heavy brown slab in light theme, which is not a
  trade this site wants to make for its main button. #c15f3c sits mid-scale, so
  no text colour in the charter clears 4.5:1 on it: the only ways out are pure
  black (4.97:1) or 18.66px bold text, which would move the button to the 3:1
  large-text threshold. Left as one known failing node on `/` and `/fr/`
  ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).
- Hero install line can be reached with the keyboard. `overflow-x: auto` makes
  it scroll below ~340 px, and a scrolling region that no one can focus puts
  the end of the command out of reach without a mouse (WCAG 2.1.1)
  ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).
- Table of contents entries meet the 24px minimum target size. Ours were 23px —
  Starlight's `padding-block` was sized for its own font, not for the 12px this
  theme drops the sidebar to. The audit's three URLs each had a single-entry
  contents list, which is why it never showed up (WCAG 2.5.8)
  ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).
- Zoom dialog no longer jumps the page on open, nor drifts as you scroll. Anchoring
  the new close button with `position: relative` on the `<dialog>` overrode the
  `fixed` a browser gives a modal dialog, dropping it back into the flow at the
  end of `<body>`. The anchor moved to an inner frame
  ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).
- Footer copyright line reads "Built with Astro and Starlight" again. Astro
  glues text nodes to the element that follows them, and this paragraph lacked
  the explicit `{' '}` the one above it already used
  ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).

### Changed

- Light theme's background grid and diagonal stripes are visible again. A
  pattern reads against its own ground, not in the abstract: #e8e8e8 on the
  #ecebe8 shell gave 1.03:1 where dark posts 1.26:1, eight times less. #d8d8d8
  restores the ratio the dark theme has
  ([#78](https://github.com/kbrdn1/kbrdn-docs/issues/78)).

## Past releases

- [1.1.0](changelogs/1.1.0.md) — 2026-08-14
- [1.0.0](changelogs/1.0.0.md) — 2026-08-13
