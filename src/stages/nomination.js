import { prefersReducedMotion } from "./utils.js";

export function initNomination(raw, PLAY) {
  const container = document.getElementById("nomination-visual");
  container.innerHTML = raw;

  const flags = Array.from(container.querySelectorAll(".flag"));
  gsap.set(container, { opacity: 0 });
  gsap.set(flags, { opacity: 0 });

  const tl = gsap.timeline({ paused: true })
    .to(container, { opacity: 1, duration: 0.15, ease: "none" })
    .to(flags[0],  { opacity: 1, duration: 0.25, ease: "power2.out" }, ">")
    .to(flags[1],  { opacity: 1, duration: 0.25, ease: "power2.out" }, ">")
    .to(flags[2],  { opacity: 1, duration: 0.25, ease: "power2.out" }, ">");

  PLAY.nomination = () => prefersReducedMotion() ? tl.progress(1) : tl.restart();
}
