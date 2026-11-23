/* CupCoff — small SVG chart kit (no dependencies).
 * Charts.timeSeries(el, opts) — line or bar over time, crosshair/hover tooltip, arrow-key navigation.
 * Charts.hbar(el, opts)       — horizontal bars with direct labels + hover tooltip.
 */
const Charts = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const fmtNum = (n) => Number(n).toLocaleString("en-US");
  const observers = new WeakMap();

  function niceMax(v) {
    if (v <= 4) return 4;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * p;
  }
  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }
  function labelFor(t, bucket, long) {
    const d = new Date(t);
    if (bucket === "month") return d.toLocaleDateString("en-GB", { month: long ? "long" : "short", year: long ? "numeric" : undefined });
    if (bucket === "week") {
      if (!long) return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const e = new Date(d.getTime() + 6 * 86400000);
      return `Week of ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    }
    return d.toLocaleDateString("en-GB", long ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric", month: "short" });
  }
  function watch(container, render) {
    observers.get(container)?.disconnect();
    let w = 0;
    const ro = new ResizeObserver(() => {
      const nw = Math.round(container.clientWidth);
      if (nw && nw !== w) { w = nw; render(nw); }
    });
    ro.observe(container);
    observers.set(container, ro);
  }
  function tooltip(container) {
    let tip = container.querySelector(".chart-tip");
    if (!tip) { tip = document.createElement("div"); tip.className = "chart-tip"; tip.setAttribute("role", "status"); container.appendChild(tip); }
    return tip;
  }
  function placeTip(container, tip, x, y) {
    const cw = container.clientWidth;
    tip.style.opacity = "1";
    const tw = tip.offsetWidth;
    let left = x + 12;
    if (left + tw > cw - 4) left = x - tw - 12;
    tip.style.transform = `translate(${Math.max(4, left)}px, ${Math.max(0, y - 10)}px)`;
  }

  function timeSeries(container, { data, kind = "line", color = "#382B25", name = "Value", bucket = "day", height = 220, unit = "" }) {
    container.classList.add("chart");
    container.tabIndex = 0;
    container.setAttribute("role", "img");
    const total = data.reduce((a, d) => a + d.v, 0);
    container.setAttribute("aria-label", `${name}: ${fmtNum(total)} in total across ${data.length} ${bucket === "day" ? "days" : bucket + "s"}. Use left and right arrow keys to read values.`);

    const render = (W) => {
      container.querySelector("svg")?.remove();
      const m = { l: 40, r: 12, t: 14, b: 28 };
      const H = height, iw = W - m.l - m.r, ih = H - m.t - m.b;
      const max = niceMax(Math.max(1, ...data.map((d) => d.v)));
      const svg = el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true" });
      container.prepend(svg);
      const g = el("g", { transform: `translate(${m.l},${m.t})` }, svg);
      // grid + y ticks
      for (let i = 0; i <= 4; i++) {
        const y = ih - (ih * i) / 4;
        el("line", { x1: 0, x2: iw, y1: y, y2: y, class: i === 0 ? "axis" : "grid" }, g);
        const tx = el("text", { x: -8, y: y + 4, "text-anchor": "end", class: "tick" }, g);
        tx.textContent = fmtNum(Math.round((max * i) / 4 * 10) / 10);
      }
      const n = data.length;
      const band = iw / Math.max(1, n);
      const xAt = (i) => (kind === "bar" ? band * i + band / 2 : n === 1 ? iw / 2 : (iw * i) / (n - 1));
      const yAt = (v) => ih - (v / max) * ih;
      // x labels
      const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 78))));
      data.forEach((d, i) => {
        if (i % every !== 0 && i !== n - 1) return;
        if (i === n - 1 && i % every !== 0 && (n - 1) % every < every * 0.6) return;
        const tx = el("text", { x: xAt(i), y: ih + 18, "text-anchor": "middle", class: "tick" }, g);
        tx.textContent = labelFor(d.t, bucket);
      });
      const marks = el("g", {}, g);
      if (kind === "bar") {
        const bw = Math.max(2, Math.min(28, band - 2));
        data.forEach((d, i) => {
          const h = (d.v / max) * ih;
          if (h <= 0) return;
          const x = xAt(i) - bw / 2, y = ih - h, r = Math.min(4, bw / 2, h);
          el("path", { d: `M${x},${ih}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${ih}Z`, fill: color, class: "bar", "data-i": i }, marks);
        });
      } else {
        const pts = data.map((d, i) => `${xAt(i)},${yAt(d.v)}`);
        el("path", { d: `M${pts.join("L")}L${xAt(n - 1)},${ih}L${xAt(0)},${ih}Z`, fill: color, opacity: 0.08 }, marks);
        el("path", { d: "M" + pts.join("L"), fill: "none", stroke: color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, marks);
      }
      // hover layer
      const cross = el("line", { y1: 0, y2: ih, class: "crosshair", visibility: "hidden" }, g);
      const dot = el("circle", { r: 5, fill: color, stroke: "#fff", "stroke-width": 2, visibility: "hidden" }, g);
      const tip = tooltip(container);
      let cur = -1;
      const show = (i) => {
        if (i < 0 || i >= n) return;
        cur = i;
        const d = data[i], x = xAt(i), y = yAt(d.v);
        cross.setAttribute("x1", x); cross.setAttribute("x2", x); cross.setAttribute("visibility", "visible");
        if (kind === "line") { dot.setAttribute("cx", x); dot.setAttribute("cy", y); dot.setAttribute("visibility", "visible"); }
        marks.querySelectorAll(".bar").forEach((b) => b.classList.toggle("dim", +b.dataset.i !== i));
        tip.innerHTML = `<span class="tip-date">${labelFor(d.t, bucket, true)}</span><span class="tip-row"><i style="background:${color}"></i>${name}<b>${fmtNum(d.v)}${unit}</b></span>`;
        placeTip(container, tip, m.l + x, m.t + y);
      };
      const hide = () => {
        cur = -1; tip.style.opacity = "0";
        cross.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden");
        marks.querySelectorAll(".bar").forEach((b) => b.classList.remove("dim"));
      };
      const hit = el("rect", { x: 0, y: 0, width: iw, height: ih + 20, fill: "transparent" }, g);
      hit.addEventListener("pointermove", (ev) => {
        const r = svg.getBoundingClientRect();
        const px = ev.clientX - r.left - m.l;
        const i = kind === "bar" ? Math.floor(px / band) : Math.round((px / iw) * (n - 1));
        show(Math.max(0, Math.min(n - 1, i)));
      });
      hit.addEventListener("pointerleave", hide);
      container.onkeydown = (ev) => {
        if (ev.key === "ArrowRight") { show(cur < 0 ? 0 : Math.min(n - 1, cur + 1)); ev.preventDefault(); }
        if (ev.key === "ArrowLeft") { show(cur < 0 ? n - 1 : Math.max(0, cur - 1)); ev.preventDefault(); }
        if (ev.key === "Escape") hide();
      };
      container.onblur = hide;
    };
    watch(container, render);
  }

  function hbar(container, { rows, name = "Value", unit = "" }) {
    container.classList.add("chart", "hbar");
    container.innerHTML = "";
    const max = Math.max(1, ...rows.map((r) => r.value));
    const tip = tooltip(container);
    rows.forEach((r) => {
      const row = document.createElement("div");
      row.className = "hbar-row";
      row.tabIndex = 0;
      row.innerHTML = `<span class="hbar-label">${r.label}</span><span class="hbar-track"><span class="hbar-fill" style="width:${(r.value / max) * 100}%;background:${r.color || "#382B25"}"></span></span><span class="hbar-value">${fmtNum(r.value)}${unit}</span>`;
      const showTip = () => {
        tip.innerHTML = `<span class="tip-date">${r.label}</span><span class="tip-row"><i style="background:${r.color || "#382B25"}"></i>${name}<b>${fmtNum(r.value)}${unit}</b></span>${r.extra ? `<span class="tip-extra">${r.extra}</span>` : ""}`;
        const cr = container.getBoundingClientRect(), rr = row.getBoundingClientRect();
        placeTip(container, tip, rr.left - cr.left + rr.width * 0.5, rr.top - cr.top - 8);
      };
      row.addEventListener("pointerenter", showTip);
      row.addEventListener("focus", showTip);
      row.addEventListener("pointerleave", () => (tip.style.opacity = "0"));
      row.addEventListener("blur", () => (tip.style.opacity = "0"));
      container.insertBefore(row, tip);
    });
  }

  // Day x hour grid, single-hue (burgundy) sequential ramp, light = quiet, dark = busy.
  const RAMP = ["#FCF1F3", "#F5D3DA", "#E7A2B0", "#CF6A80", "#9E2A44", "#51000E"];
  function heatmap(container, { values, rows, rowsLong, cols, name = "Visits" }) {
    container.classList.add("chart", "heat");
    const max = Math.max(1, ...values.flat());
    const step = (v) => (v === 0 ? -1 : Math.min(RAMP.length - 1, Math.floor((v / max) * RAMP.length * 0.999)));
    container.setAttribute("role", "img");
    container.setAttribute("aria-label", `${name} by day and hour. Use Show table for exact numbers.`);
    container.innerHTML = `<div class="heat-grid" style="grid-template-columns:44px repeat(${cols.length},minmax(0,1fr))">
      <span></span>${cols.map((c, i) => `<span class="heat-col">${i % 2 === 0 ? c.slice(0, 2) : ""}</span>`).join("")}
      ${values.map((row, r) => `<span class="heat-row">${rows[r]}</span>${row.map((v, c) => { const k = step(v); return `<span class="heat-cell" data-r="${r}" data-c="${c}" style="background:${k < 0 ? "#fff" : RAMP[k]}"></span>`; }).join("")}`).join("")}
    </div>
    <div class="heat-legend"><span>Quiet</span>${RAMP.map((c) => `<i style="background:${c}"></i>`).join("")}<span>Busy</span></div>`;
    const tip = tooltip(container);
    container.querySelectorAll(".heat-cell").forEach((cell) => {
      cell.addEventListener("pointerenter", () => {
        const r = +cell.dataset.r, c = +cell.dataset.c, v = values[r][c];
        tip.innerHTML = `<span class="tip-date">${(rowsLong || rows)[r]}, ${cols[c]}–${cols[c + 1] || String(parseInt(cols[c], 10) + 1).padStart(2, "0") + ":00"}</span><span class="tip-row"><i style="background:${RAMP[Math.max(0, step(v))]}"></i>${name}<b>${fmtNum(v)}</b></span>`;
        const cr = container.getBoundingClientRect(), rr = cell.getBoundingClientRect();
        placeTip(container, tip, rr.left - cr.left + rr.width, rr.top - cr.top - 6);
      });
      cell.addEventListener("pointerleave", () => (tip.style.opacity = "0"));
    });
  }

  return { timeSeries, hbar, heatmap, labelFor };
})();

export default Charts;
export { Charts };
