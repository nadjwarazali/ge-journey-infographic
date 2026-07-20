const NAME_STYLE =
  "font-family:system-ui,sans-serif;font-size:64px;font-weight:600";
const X_STYLE =
  "font-family:system-ui,sans-serif;font-size:160px;font-weight:700";
const ROW_H = 332;
const ROW_STRIDE = 342;
const CANDIDATES = ["Ali", "Muthu", "Ah Hock"];

function ballotRow(name, i) {
  const rowY = i * ROW_STRIDE;
  const nameY = rowY + ROW_H / 2;
  return `
    <g class="ballot-row">
      <rect x="0" y="${rowY}" width="1417" height="${ROW_H}" fill="transparent" style="pointer-events:all"/>
      <text x="761" y="${nameY}" text-anchor="middle" dominant-baseline="middle" style="${NAME_STYLE}" fill="#111">${name}</text>
      <text class="row-x" x="1251" y="${nameY}" text-anchor="middle" dominant-baseline="middle" style="${X_STYLE}" fill="#111">X</text>
    </g>`;
}

export function initPolling(raw, PLAY) {
  const svgWithCandidates = raw.replace(
    "</svg>",
    CANDIDATES.map((name, i) => ballotRow(name, i)).join("") + "</svg>",
  );

  const container = document.getElementById("polling-visual");
  container.innerHTML = svgWithCandidates;

  const hint = document.createElement("p");
  hint.className = "poll-hint";
  hint.textContent = "Click a candidate to cast your vote";
  container.parentElement.appendChild(hint);

  const rows = Array.from(container.querySelectorAll(".ballot-row"));
  const xMarks = Array.from(container.querySelectorAll(".row-x"));

  rows.forEach((row) => {
    row.style.cursor = "pointer";
    row.addEventListener("click", () => {
      const already = row.classList.contains("selected");
      rows.forEach((r) => r.classList.remove("selected"));
      gsap.set(xMarks, { clearProps: "opacity" });
      if (!already) {
        row.classList.add("selected");
        const idx = rows.indexOf(row);
        rows.forEach((r, i) => {
          gsap.to(r, { opacity: i === idx ? 1 : 0.3, duration: 0.25 });
        });
        gsap.set(xMarks[idx], { opacity: 1 });
        gsap.to(hint, { opacity: 0, duration: 0.3 });
        document.querySelector("ballot-box")?.drop();
      } else {
        rows.forEach((r) => gsap.to(r, { opacity: 1, duration: 0.25 }));
        gsap.to(hint, { opacity: 1, duration: 0.3 });
      }
    });
  });

  PLAY.polling = () => {
    rows.forEach((r) => {
      r.classList.remove("selected");
      gsap.set(r, { opacity: 1 });
    });
    gsap.set(xMarks, { clearProps: "opacity" });
    gsap.set(hint, { opacity: 1 });
  };
}
