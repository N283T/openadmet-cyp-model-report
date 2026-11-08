/* CYP model-report charts. Vendored ECharts + JSON in assets/data/.
   Palette and theme handling follow the PXR report. */
(function () {
  "use strict";

  var DATA = window.CYP_DATA_BASE || "assets/data/";
  var JA = document.documentElement.lang === "ja";
  var charts = {};
  var cache = {};

  function t(en, ja) { return JA ? ja : en; }

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function palette() {
    return {
      ink: css("--ink"), muted: css("--muted"), line: css("--line"),
      surface: css("--surface"), bg: css("--bg"),
      blue: css("--color-blue"), coral: css("--color-coral"), teal: css("--color-teal"),
      font: "Zen Maru Gothic, Zen Maru Gothic JP, system-ui, sans-serif",
    };
  }

  function axisStyle(p) {
    return {
      axisLine: { show: true, onZero: false, lineStyle: { color: p.muted, width: 1.6 } },
      axisTick: { show: true, lineStyle: { color: p.muted, width: 1.6 } },
      axisLabel: { color: p.muted },
      splitLine: { lineStyle: { color: p.line, opacity: 0.5 } },
      nameTextStyle: { color: p.muted },
    };
  }

  function getJSON(name) {
    return fetch(DATA + name + "?v=" + Date.now()).then(function (r) {
      if (!r.ok) throw new Error("failed to load " + name);
      return r.json();
    });
  }

  function tooltip(p, fmt) {
    return { trigger: "item", backgroundColor: p.surface, borderColor: p.line,
      textStyle: { color: p.ink }, formatter: fmt };
  }

  // Deterministic jitter so the strip does not reshuffle on every redraw.
  function jitter(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return (x - Math.floor(x)) - 0.5; }

  // Every Final-board entry for one track as a strip per target; ours in coral.
  function optStrip(track) {
    return function (d, p) {
      var rows = d.targets.filter(function (r) { return r.track === track; });
      var cats = rows.map(function (r) { return r.label; });
      var field = [], mine = [], best = [];
      rows.forEach(function (r, ci) {
        r.scores.forEach(function (s, i) {
          field.push([s, ci + jitter(i + ci * 997) * 0.5, i + 1, r.scores.length]);
        });
        var f = r.boards.final;
        mine.push([f.value, ci, f.rank, f.n]);
        best.push([r.best, ci, 1, f.n]);
      });
      var lower = track === "regression";
      var metric = lower ? "ST-RAE" : "MCC";
      function fmt(o) {
        var r = rows[Math.round(o.data[1])];
        var who = o.seriesIndex === 1 ? "N283T" : o.seriesIndex === 2 ? t("best", "1位") : t("entry", "参加者");
        return r.label + "<br/>" + who + ": <b>" + o.data[0].toFixed(4) + "</b> " + metric +
          "<br/>" + t("rank ", "順位 ") + o.data[2] + " / " + o.data[3];
      }
      return {
        textStyle: { color: p.ink, fontFamily: p.font },
        grid: { left: 8, right: 18, top: 16, bottom: 42, containLabel: true },
        tooltip: tooltip(p, fmt),
        xAxis: Object.assign({
          type: "value", scale: true, inverse: lower,
          name: metric + (t(" (better →)", "（右ほど良い）")),
          nameLocation: "middle", nameGap: 28,
        }, axisStyle(p)),
        yAxis: Object.assign({
          type: "value", inverse: true, min: -0.5, max: rows.length - 0.5,
          axisLabel: { color: p.ink, fontFamily: p.font,
            customValues: cats.map(function (_, i) { return i; }),
            formatter: function (v) { return cats[v] !== undefined ? cats[v].replace(" · ", "\n") : ""; } },
          axisTick: { customValues: cats.map(function (_, i) { return i; }) },
          splitLine: { show: false },
        }, (function () { var a = axisStyle(p); delete a.axisLabel; delete a.axisTick; delete a.splitLine; return a; })()),
        series: [
          { type: "scatter", data: field, symbolSize: 6, itemStyle: { color: p.blue, opacity: 0.35 } },
          { type: "scatter", data: mine, symbolSize: 15, z: 5,
            itemStyle: { color: p.coral, borderColor: p.ink, borderWidth: 1.2 },
            label: { show: true, position: "top", color: p.ink, fontSize: 11,
              formatter: function (o) { return "#" + o.data[2]; } } },
          { type: "scatter", data: best, symbol: "diamond", symbolSize: 11, z: 4,
            itemStyle: { color: p.teal, borderColor: p.ink, borderWidth: 1 } },
        ],
      };
    };
  }

  // Our value on three boards per target: the 09-24 Interim entry and the Final
  // entry share the full test set; Live used about half of it.
  function optBoards(d, p) {
    var rows = d.targets;
    var cats = rows.map(function (r) { return r.label; });
    function series(key, name, color, symbol, size) {
      return {
        type: "scatter", name: name, symbol: symbol, symbolSize: size,
        itemStyle: { color: key === "live" ? "transparent" : color, borderColor: color, borderWidth: 2 },
        data: rows.map(function (r, i) {
          var b = r.boards[key];
          // Plot the change from the 09-24 Interim entry, signed so that up is better.
          var sign = r.better === "lower" ? -1 : 1;
          return [i, sign * (b.value - r.boards.interim.value), b.value, b.rank, b.n];
        }),
      };
    }
    return {
      textStyle: { color: p.ink, fontFamily: p.font },
      legend: { top: 0, textStyle: { color: p.muted } },
      grid: { left: 34, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: tooltip(p, function (o) {
        var r = rows[o.data[0]];
        return r.label + "<br/>" + o.seriesName + ": <b>" + o.data[2].toFixed(4) + "</b>" +
          "<br/>" + t("rank ", "順位 ") + o.data[3] + " / " + o.data[4];
      }),
      xAxis: Object.assign({ type: "category", data: cats,
        axisLabel: { color: p.ink, interval: 0, fontSize: 11, fontFamily: p.font,
          formatter: function (v) { return v.replace(" · ", "\n").replace(" pIC50", "\npIC50").replace(" TDI", "\nTDI"); } } },
        (function () { var a = axisStyle(p); delete a.axisLabel; return a; })()),
      yAxis: Object.assign({ type: "value",
        name: t("change vs 09-24 Interim entry (up = better)", "9/24 Interim からの変化（上ほど良い）"),
        nameLocation: "middle", nameGap: 44 }, axisStyle(p)),
      series: [
        series("interim", t("Interim (09-24 entry, full test)", "Interim（9/24 提出、フルテスト）"), p.muted, "rect", 9),
        series("final", t("Final (11-03 entry, full test)", "Final（11/3 提出、フルテスト）"), p.coral, "circle", 13),
        series("live", t("Live (11-03 entry, half test)", "Live（11/3 提出、半分のテスト）"), p.blue, "circle", 12),
      ],
    };
  }

  var SPECS = [
    { el: "chart-strip-reg", file: "standings.json", build: optStrip("regression") },
    { el: "chart-strip-cls", file: "standings.json", build: optStrip("classification") },
    { el: "chart-boards", file: "standings.json", build: optBoards },
  ];

  function renderAll() {
    var p = palette();
    SPECS.forEach(function (spec) {
      var node = document.getElementById(spec.el);
      if (!node) return;
      var apply = function (d) {
        cache[spec.file] = d;
        if (charts[spec.el]) charts[spec.el].dispose();
        var inst = echarts.init(node, null, { renderer: "canvas" });
        inst.setOption(spec.build(d, p));
        charts[spec.el] = inst;
      };
      if (cache[spec.file]) apply(cache[spec.file]);
      else getJSON(spec.file).then(apply).catch(function (e) {
        node.innerHTML = '<p style="padding:20px;color:var(--muted)">' + t("Chart data unavailable.", "グラフのデータを読み込めませんでした。") + "</p>";
        console.error(e);
      });
    });
  }

  function setupTheme() {
    var toggle = document.getElementById("theme-toggle");
    var root = document.documentElement;
    if (!toggle) return;
    function sync() { toggle.textContent = root.getAttribute("data-theme") === "dark" ? "☾" : "☀"; }
    sync();
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      sync();
      requestAnimationFrame(renderAll);
    });
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      Object.keys(charts).forEach(function (k) { charts[k].resize(); });
    }, 150);
  });

  document.addEventListener("DOMContentLoaded", function () { setupTheme(); renderAll(); });
})();
