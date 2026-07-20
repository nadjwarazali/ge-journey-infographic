import { getX, getCY, prefersReducedMotion } from "./utils.js";

function voteColor(cy) {
  return cy < 400 ? "#D447E5" : cy < 850 ? "#FFAF36" : "#3AD6A6";
}

export function initCounting(raw, PLAY) {
  const marked = raw.replace(
    /(<path d="M(?:568|664|760|856|952|1048) \d+[^"]*)" fill="white"\/>/g,
    '$1" class="vote" fill="white"/>',
  );
  const container = document.getElementById("counting-visual");
  container.innerHTML = marked;

  const votes     = Array.from(container.querySelectorAll(".vote"));
  const fillOrder = [...votes].sort((a, b) => {
    const dx = getX(a) - getX(b);
    return dx !== 0 ? dx : getCY(a) - getCY(b);
  });

  gsap.set(container, { opacity: 0 });

  const tl = gsap.timeline({ paused: true })
    .to(container, { opacity: 1, duration: 0.15, ease: "power2.inOut" })
    .to(fillOrder, {
      fill: (i) => voteColor(getCY(fillOrder[i])),
      duration: 0,
      stagger: { each: 0.02, from: "start" },
      ease: "none",
    }, ">");

  PLAY.counting = () => prefersReducedMotion() ? tl.progress(1) : tl.restart();
}
