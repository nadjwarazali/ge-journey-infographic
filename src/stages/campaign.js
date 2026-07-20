import { uniquifySvg, prefersReducedMotion } from "./utils.js";

const FLAG_COUNT    = 3;
const SLOGAN_TEXTS  = ["Vote me!", "Undi Ali!", "Vote Ah Hock!", "Pilih Muthu!"];
const SLOGAN_FONTS  = ["Impact, sans-serif", "Georgia, serif", "'Courier New', monospace", "Arial Black, sans-serif"];
const SLOGAN_COLORS = ["#D447E5", "#FFAF36", "#3AD6A6", "#F15613", "#ffffff"];

export function initCampaign(raw, PLAY) {
  const topRow    = document.getElementById("campaign-top");
  const bottomRow = document.getElementById("campaign-bottom");
  const street    = document.querySelector(".campaign-street");

  function makeFlags(row, prefix) {
    row.innerHTML = "";
    for (let i = 0; i < FLAG_COUNT; i++) {
      const cell = document.createElement("div");
      cell.className = "campaign-flag";
      cell.innerHTML = uniquifySvg(raw, `${prefix}${i}`);
      row.appendChild(cell);
    }
    return Array.from(row.querySelectorAll(".campaign-flag"));
  }

  const topFlags    = makeFlags(topRow,    "ft");
  const bottomFlags = makeFlags(bottomRow, "fb");

  gsap.set(topFlags,    { y: "-100%" });
  gsap.set(bottomFlags, { y: "100%" });

  const flagTl = gsap.timeline({ paused: true });
  flagTl
    .to(topFlags,    { y: 0, duration: 1.2, ease: "expo.out", stagger: { each: 0.18, from: "end" } },   0)
    .to(bottomFlags, { y: 0, duration: 1.2, ease: "expo.out", stagger: { each: 0.18, from: "start" } }, 0);

  const layer = document.createElement("div");
  layer.className = "vote-shouts-layer";
  street.appendChild(layer);

  const shoutTweens = Array.from({ length: 8 }, (_, i) => {
    const el = document.createElement("span");
    el.className   = "vote-shout";
    el.textContent = SLOGAN_TEXTS[(Math.floor(i / 2) + (i % 2) * 2) % SLOGAN_TEXTS.length];
    el.style.left       = `${4 + i * 12 + (i % 3) * 2}%`;
    el.style.bottom     = `${i % 2 === 0 ? 20 : 55}%`;
    el.style.fontFamily = SLOGAN_FONTS[i % SLOGAN_FONTS.length];
    el.style.color      = SLOGAN_COLORS[i % SLOGAN_COLORS.length];
    el.style.fontSize   = `${0.7 + (i % 4) * 0.25}em`;
    layer.appendChild(el);

    const rise = 60 + (i % 5) * 20;
    return gsap.fromTo(el,
      { y: 0, opacity: 0 },
      {
        y: -rise, opacity: 1,
        duration: 1.4 + (i % 4) * 0.35,
        ease: "power1.inOut",
        delay: i * 0.3,
        repeat: -1,
        repeatDelay: 1 + (i % 3) * 0.5,
        paused: true,
        onRepeat() { gsap.set(el, { opacity: 0, y: 0 }); },
      },
    );
  });

  PLAY.campaign = () => {
    if (prefersReducedMotion()) { flagTl.progress(1); return; }
    flagTl.restart();
    shoutTweens.forEach((t) => t.restart());
  };
}
