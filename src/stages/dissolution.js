import { PALETTE, getX, colorSeatsByWeight, prefersReducedMotion } from "./utils.js";

export function initDissolution(raw, PLAY) {
  const marked = raw.replace(
    /(<path d="M[^C"]*C[^"]*)" fill="white"\/>/g,
    '$1" class="seat" fill="white"/>',
  );
  const container = document.getElementById("dissolution-visual");
  container.innerHTML = marked;

  const seats  = Array.from(container.querySelectorAll(".seat"));
  colorSeatsByWeight(seats, [116, 20, 26, 60], PALETTE);
  const sorted = [...seats].sort((a, b) => getX(a) - getX(b));

  const legend = document.createElement("div");
  legend.className = "seat-legend";
  legend.innerHTML = `
    <span class="seat-legend-item"><span class="seat-legend-dot" style="background:#D447E5"></span>Pink Coalition</span>
    <span class="seat-legend-item"><span class="seat-legend-dot" style="background:#FFAF36"></span>Yellow Coalition</span>
    <span class="seat-legend-item"><span class="seat-legend-dot" style="background:#3AD6A6"></span>Green Coalition</span>
    <span class="seat-legend-item"><span class="seat-legend-dot" style="background:#F15613"></span>Orange Coalition</span>
  `;
  container.appendChild(legend);

  const tl = gsap.timeline({ paused: true }).to(sorted, {
    fill: "#ffffff",
    duration: 0,
    stagger: { each: 0.006, from: "start" },
    ease: "none",
  });

  PLAY.dissolution = () => prefersReducedMotion() ? tl.progress(1) : tl.restart();
}
