# General Election Journey Infographic

An interactive scrollytelling page that walks through the six stages of a Malaysian General Election.

## Demo

Deployed on Vercel: *[https://general-election-journey-infographic.vercel.app/](https://ge-journey-infographic.vercel.app/)*

## What it is

A plain HTML page — no framework, no bundler — with GSAP animations and a 3D ballot box built on Three.js. A hero landing screen precedes six full-viewport stages, each driven by a paused GSAP timeline triggered on scroll.

## Stages

1. **Dissolution** — Parliament is dissolved, triggering the election cycle
2. **Nomination** — Candidates register and contest their seats
3. **Campaign** — Parties take to the streets across 222 constituencies
4. **Polling** — Voters cast their ballot *(interactive)*
5. **Counting** — Ballot papers are tallied seat by seat
6. **Results** — The winning party forms the next government

## Interactive elements

- **Scroll / wheel** — navigates between stages with a 120px delta threshold
- **Journey map** — click any numbered step to jump to that stage; tooltips on hover
- **Ballot paper** — click a candidate to cast your vote; dims the rest
- **Ballot box** — 3D GLB model (Three.js); drops the ballot when a candidate is selected
- **Restart** — returns to the hero from the results stage

## Embeddable Ballot Box

The `<ballot-box>` custom element is a self-contained 3D ballot box that can be dropped into any HTML page independently of the infographic.

```html
<!-- Load the component -->
<script type="module" src="/src/ballot-box.js"></script>

<!-- Drop anywhere -->
<ballot-box style="width:300px;height:300px"></ballot-box>
```

### Public API

```js
const box = document.querySelector("ballot-box");

box.drop(); // animate a ballot dropping into the slot
```

### Events

```js
box.addEventListener("ballot-dropped", (e) => {
  console.log(e.detail.count); // cumulative drop count
});
```

### Notes

- Loads Three.js and GLTFLoader dynamically from `esm.sh` — no bundler needed
- Falls back to a procedural box if the GLB fails to load
- `drop()` is the only public entry point — click-on-box is intentionally removed
- Dispatches `ballot-dropped` with `{ bubbles: true, composed: true }` so it pierces Shadow DOM

## Stack & Libraries

| Library | Version | Use |
|---------|---------|-----|
| Vanilla HTML/CSS/JS | — | No framework, no bundler |
| [GSAP](https://gsap.com) | 3.12.5 | Stage animations (paused timelines) |
| [Three.js](https://threejs.org) | 0.160.0 | 3D ballot box rendering |
| GLTFLoader + OrbitControls | via [esm.sh](https://esm.sh) | GLB model loading + camera controls |
| [Zalando Sans Expanded](https://fonts.google.com) | — | Display typeface (Google Fonts) |
| [Vercel](https://vercel.com) | — | Deployment |

## Development

```bash
npx serve .   # static file server — SVG fetch requires HTTP, not file://
```

No build step. Open `index.html` over a local server.

## Architecture

| File | Role |
|------|------|
| `index.html` | All markup, scroll logic, stage init, PLAY registry |
| `src/style.css` | All styles |
| `src/stages/*.js` | One `init*()` per stage + shared `utils.js` |
| `src/ballot-box.js` | `<ballot-box>` custom element (Three.js, GLB loader) |
| `src/assets/*.svg` | Stage illustrations |
| `src/assets/ballot-box.glb` | 3D ballot box model |

## Responsive

| Breakpoint | Layout |
|------------|--------|
| > 768px | 50/50 split — fixed left panel (stage info + nav), fixed right panel (visuals) |
| ≤ 768px | Stacked — top panel 40svh (stage info + journey map), bottom panel 60svh (visuals) |
