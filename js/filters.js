/* ============================================================================
   FILTERS — one state object per library view; pure functions over the data.
   Category, topic and tags stay independent: each is filtered on its own field.
   ========================================================================== */
window.AH = window.AH || {};

AH.Filters = (function () {
  var NO_VALUE = "";

  function defaultState(scope) {
    return {
      scope: scope,          // "inbox" | "automation" | "all"
      query: "",
      category: NO_VALUE,    // only used by the "all" view
      topic: NO_VALUE,       // encoded "category::Topic" (so both "Other"s stay distinct)
      status: NO_VALUE,
      tags: [],              // multi-select, AND semantics
      sort: "newest",        // newest | oldest | relevance
      sortTouched: false
    };
  }

  function encodeTopic(cat, name) { return cat + "::" + name; }
  function decodeTopic(v) {
    var i = (v || "").indexOf("::");
    return i < 0 ? null : { category: v.slice(0, i), name: v.slice(i + 2) };
  }

  function hasActive(st) {
    return !!(st.query.trim() || st.category || st.topic || st.status || st.tags.length);
  }

  function activeFilters(st) {
    var list = [];
    if (st.query.trim()) list.push({ key: "query", label: "Search: \u201C" + st.query.trim() + "\u201D" });
    if (st.category) list.push({ key: "category", label: AH.CONFIG.categories[st.category].label });
    if (st.topic) list.push({ key: "topic", label: "Topic: " + decodeTopic(st.topic).name });
    if (st.status) list.push({ key: "status", label: "Status: " + AH.CONFIG.statuses[st.status].label });
    st.tags.forEach(function (t) { list.push({ key: "tag", value: t, label: "#" + t }); });
    return list;
  }

  function compareDate(a, b) {
    if (a.dateAdded !== b.dateAdded) return a.dateAdded < b.dateAdded ? -1 : 1;
    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
  }

  /** Records visible inside the view's scope (before any user filter). */
  function inScope(records, st) {
    return st.scope === "all" ? records : records.filter(function (r) { return r.category === st.scope; });
  }

  /**
   * @param skip  optional facet name to ignore ("tags") — used so tag chips
   *              can show counts based on every OTHER active filter.
   */
  function apply(records, st, skip) {
    var base = inScope(records, st);
    var ranked = st.query.trim() ? AH.Search.search(st.query) : null;
    var rankIndex = null;
    if (ranked) {
      rankIndex = Object.create(null);
      ranked.forEach(function (r, i) { rankIndex[r.id] = i; });
    }
    var topic = decodeTopic(st.topic);

    var out = base.filter(function (r) {
      if (rankIndex && rankIndex[r.id] === undefined) return false;
      if (st.category && r.category !== st.category) return false;
      if (topic && (r.category !== topic.category || r.topic !== topic.name)) return false;
      if (st.status && r.status !== st.status) return false;
      if (skip !== "tags" && st.tags.length) {
        for (var i = 0; i < st.tags.length; i++) if (r.tags.indexOf(st.tags[i]) === -1) return false;
      }
      return true;
    });

    if (st.sort === "relevance" && rankIndex) {
      out.sort(function (a, b) { return rankIndex[a.id] - rankIndex[b.id]; });
    } else if (st.sort === "oldest") {
      out.sort(compareDate);
    } else {
      out.sort(function (a, b) { return compareDate(b, a); });
    }
    return out;
  }

  /** Topic options for a view: configured topics first, then any extras found in data. */
  function topicOptions(records, st) {
    var cats = st.scope === "all" ? (st.category ? [st.category] : Object.keys(AH.CONFIG.categories)) : [st.scope];
    return cats.map(function (c) {
      var names = AH.CONFIG.categories[c].topics.slice();
      records.forEach(function (r) {
        if (r.category === c && names.indexOf(r.topic) === -1) names.push(r.topic);
      });
      return { category: c, label: AH.CONFIG.categories[c].label, topics: names };
    });
  }

  /**
   * Tags (with counts) for the chip row. Counts are "how many results you would
   * see" under the current filters, so combinations that cannot match are disabled.
   */
  function tagFacets(records, st) {
    var pool = apply(records, st);
    var counts = Object.create(null);
    pool.forEach(function (r) { r.tags.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    st.tags.forEach(function (t) { if (counts[t] === undefined) counts[t] = 0; });
    // keep the whole vocabulary visible (greyed out when it cannot match)
    inScope(records, st).forEach(function (r) { r.tags.forEach(function (t) { if (counts[t] === undefined) counts[t] = 0; }); });
    return Object.keys(counts).map(function (t) { return { tag: t, count: counts[t] }; })
      .sort(function (a, b) { return b.count - a.count || a.tag.localeCompare(b.tag); });
  }

  function reset(st) {
    var keepSort = st.sortTouched ? st.sort : "newest";
    st.query = ""; st.category = NO_VALUE; st.topic = NO_VALUE; st.status = NO_VALUE; st.tags = [];
    st.sort = keepSort === "relevance" ? "newest" : keepSort;
  }

  return {
    defaultState: defaultState, apply: apply, hasActive: hasActive, activeFilters: activeFilters,
    topicOptions: topicOptions, tagFacets: tagFacets, reset: reset,
    encodeTopic: encodeTopic, decodeTopic: decodeTopic, compareDate: compareDate, inScope: inScope
  };
})();
