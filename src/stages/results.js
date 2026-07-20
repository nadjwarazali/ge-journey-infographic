import { PALETTE, colorSeatsByRow, prefersReducedMotion } from "./utils.js";

export function initResults(raw, PLAY, { restart }) {
  const marked = raw.replace(
    /(<path d="M[^C"]*C[^"]*)" fill="white"\/>/g,
    '$1" class="seat" fill="white"/>',
  );
  const container = document.getElementById("results-visual");
  container.innerHTML = marked;

  const seats = Array.from(container.querySelectorAll(".seat"));
  colorSeatsByRow(seats, [60, 116, 46], PALETTE.slice(0, 3));

  const legend = document.createElement("div");
  legend.className = "seat-legend";
  legend.innerHTML = `
    <span class="seat-legend-item"><span class="seat-legend-dot" style="background:#D447E5"></span>Pink Coalition</span>
    <span class="seat-legend-item"><span class="seat-legend-dot" style="background:#FFAF36"></span>Yellow Coalition</span>
    <span class="seat-legend-item"><span class="seat-legend-dot" style="background:#3AD6A6"></span>Green Coalition</span>
  `;
  container.appendChild(legend);

  const btn = document.createElement("button");
  btn.className = "restart-btn";
  btn.textContent = "↺ Restart journey";
  btn.addEventListener("click", () => restart());
  container.appendChild(btn);

  gsap.set(container, { opacity: 0 });

  const tl = gsap.timeline({ paused: true })
    .to(container, { opacity: 1, duration: 0.4, ease: "power2.inOut" });

  PLAY.results = () => prefersReducedMotion() ? tl.progress(1) : tl.restart();
}
