export const PALETTE = ["#D447E5", "#FFAF36", "#3AD6A6", "#F15613"];

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function getX(el) {
  const m = el.getAttribute("d").match(/^M([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

export function getCY(el) {
  const m = el.getAttribute("d").match(/^M\d+ ([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

export function colorSeatsByWeight(seats, weights, palette) {
  const colMap = new Map();
  seats.forEach((s) => {
    const x = getX(s);
    colMap.set(x, [...(colMap.get(x) || []), s]);
  });
  const mainCols = [...colMap.keys()].filter((x) => colMap.get(x).length >= 5).sort((a, b) => a - b);
  const buckets  = new Map(mainCols.map((c) => [c, [...colMap.get(c)]]));
  colMap.forEach((list, x) => {
    if (list.length >= 5) return;
    const nearest = mainCols.reduce((best, c) => Math.abs(c - x) < Math.abs(best - x) ? c : best);
    buckets.get(nearest).push(...list);
  });
  const nCols = mainCols.length;
  const wSum  = weights.reduce((a, b) => a + b, 0);
  let cumW = 0;
  const boundaries = weights.map((w) => { cumW += w; return Math.round((cumW / wSum) * nCols); });
  let ci = 0;
  mainCols.forEach((col, i) => {
    while (ci < palette.length - 1 && i >= boundaries[ci]) ci++;
    buckets.get(col).forEach((s) => { s.style.fill = palette[ci]; });
  });
}

export function colorSeatsByRow(seats, weights, palette) {
  const rowMap = new Map();
  seats.forEach((s) => {
    const rowKey = Math.round(getCY(s) / 30) * 30;
    rowMap.set(rowKey, [...(rowMap.get(rowKey) || []), s]);
  });
  const wSum = weights.reduce((a, b) => a + b, 0);
  rowMap.forEach((rowSeats) => {
    rowSeats.sort((a, b) => getX(a) - getX(b));
    let start = 0;
    weights.forEach((w, i) => {
      const n   = rowSeats.length;
      const end = i === weights.length - 1 ? n : Math.min(n, Math.round(start + (w / wSum) * n));
      for (let j = start; j < end; j++) rowSeats[j].style.fill = palette[i];
      start = end;
    });
  });
}

export function uniquifySvg(svg, suffix) {
  return svg
    .replace(/\bid="(pattern[^"]+)"/g,        `id="$1_${suffix}"`)
    .replace(/url\(#(pattern[^)]+)\)/g,        `url(#$1_${suffix})`)
    .replace(/\bid="(image[^"]+)"/g,           `id="$1_${suffix}"`)
    .replace(/xlink:href="#(image[^"]+)"/g,    `xlink:href="#$1_${suffix}"`);
}
