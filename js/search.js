/* ============================================================================
   SEARCH — Fuse.js (CDN) when available, otherwise a built-in fuzzy matcher.
   Multi-word queries are AND-ed: every word must match something.
   ========================================================================== */
window.AH = window.AH || {};

AH.Search = (function () {
  var records = [];
  var fuse = null;

  var FIELD_WEIGHTS = [
    { name: "id", weight: 3 },
    { name: "title", weight: 3 },
    { name: "tags", weight: 2 },
    { name: "topic", weight: 2 },
    { name: "summary", weight: 1.2 },
    { name: "findings", weight: 1 },
    { name: "investigation", weight: 0.8 },
    { name: "resolution", weight: 0.8 }
  ];

  function tokenize(q) {
    return String(q || "").toLowerCase().split(/\s+/).filter(Boolean);
  }

  function init(list) {
    records = list;
    fuse = null;
    if (typeof window.Fuse === "function") {
      try {
        fuse = new window.Fuse(list, {
          keys: FIELD_WEIGHTS,
          includeScore: true,
          threshold: 0.3,
          ignoreLocation: true,
          minMatchCharLength: 2
        });
      } catch (e) {
        console.warn("[Advanced Hub] Fuse.js failed to initialise, using built-in search.", e);
        fuse = null;
      }
    }
  }

  function engine() { return fuse ? "Fuse.js" : "built-in"; }

  /* ---------- built-in fuzzy matching ---------- */
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      var rowMin = cur[0];
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < rowMin) rowMin = cur[j];
      }
      if (rowMin > max) return max + 1;
      var t = prev; prev = cur; cur = t;
    }
    return prev[b.length];
  }

  function haystack(r) {
    return {
      id: String(r.id).toLowerCase(),
      title: String(r.title || "").toLowerCase(),
      tags: (r.tags || []).join(" ").toLowerCase(),
      topic: String(r.topic || "").toLowerCase(),
      body: [r.summary, r.findings, r.investigation, r.resolution].join(" ").toLowerCase()
    };
  }

  /** Returns a score >0 (higher is better) or 0 for no match. */
  function scoreToken(tok, h) {
    var s = 0;
    if (h.id.indexOf(tok) !== -1) s = Math.max(s, 10);
    if (h.title.indexOf(tok) !== -1) s = Math.max(s, 8);
    if (h.tags.indexOf(tok) !== -1) s = Math.max(s, 6);
    if (h.topic.indexOf(tok) !== -1) s = Math.max(s, 5);
    if (h.body.indexOf(tok) !== -1) s = Math.max(s, 3);
    if (s) return s;
    if (tok.length < 4) return 0;
    var max = tok.length >= 8 ? 2 : 1;
    var fields = [[h.title, 4], [h.tags, 3], [h.topic, 2.5], [h.body, 1.5]];
    for (var f = 0; f < fields.length; f++) {
      var words = fields[f][0].split(/[^a-z0-9]+/);
      for (var w = 0; w < words.length; w++) {
        if (words[w].length >= 3 && lev(tok, words[w], max) <= max) s = Math.max(s, fields[f][1]);
      }
    }
    return s;
  }

  function builtIn(tokens) {
    var out = [];
    records.forEach(function (r) {
      var h = haystack(r), total = 0;
      for (var i = 0; i < tokens.length; i++) {
        var sc = scoreToken(tokens[i], h);
        if (!sc) return;
        total += sc;
      }
      out.push({ item: r, rank: total });
    });
    return out;
  }

  function withFuse(tokens) {
    var maps = tokens.map(function (t) {
      var m = Object.create(null);
      if (t.length < 2) {            // Fuse ignores 1-character patterns: use plain substring matching
        records.forEach(function (r) { var sc = scoreToken(t, haystack(r)); if (sc) m[r.id] = sc / 10; });
      } else {
        fuse.search(t).forEach(function (x) { m[x.item.id] = 1 - (x.score || 0); });
      }
      return m;
    });
    var out = [];
    records.forEach(function (r) {
      var total = 0;
      for (var i = 0; i < maps.length; i++) {
        if (maps[i][r.id] === undefined) return;
        total += maps[i][r.id];
      }
      out.push({ item: r, rank: total });
    });
    return out;
  }

  /**
   * Search every record. Returns records ordered by relevance, or all
   * records (original order) when the query is blank.
   */
  function search(query) {
    var tokens = tokenize(query);
    if (!tokens.length) return records.slice();
    var hits = fuse ? withFuse(tokens) : builtIn(tokens);
    var q = tokens.join(" ");
    hits.forEach(function (h) {
      // exact ID match always wins ("adv-007" or "007")
      var id = String(h.item.id).toLowerCase();
      var isNumber = /^\d+$/.test(q);
      if (id === q || (isNumber && id.replace(/\D/g, "").replace(/^0+/, "") === q.replace(/^0+/, ""))) h.rank += 100;
    });
    hits.sort(function (a, b) { return b.rank - a.rank; });
    return hits.map(function (h) { return h.item; });
  }

  /** Wrap query words found in `text` with <mark>. Returns safe HTML. */
  function highlight(text, query) {
    var safe = AH.esc(text);
    var tokens = tokenize(query).filter(function (t) { return t.length > 1; });
    if (!tokens.length) return safe;
    var pattern = tokens
      .map(function (t) { return AH.esc(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); })
      .join("|");
    try {
      return safe.replace(new RegExp("(" + pattern + ")", "gi"), "<mark>$1</mark>");
    } catch (e) { return safe; }
  }

  return { init: init, search: search, highlight: highlight, engine: engine, tokenize: tokenize };
})();
