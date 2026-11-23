/* ============================================================================
   ADVANCED HUB — application (views, rendering, events)
   Reads ONLY from window.ADVANCED_CONVERSATIONS (js/conversations.js).
   ========================================================================== */
(function () {
  "use strict";

  var C = AH.CONFIG;
  var CAT_KEYS = Object.keys(C.categories);
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  AH.state = {
    data: [],
    current: null,        // currently rendered view key
    views: {},            // filter state per library view
    page: {},             // current page per library view
    sig: {},              // filter signature per view (resets page on change)
    tagsOpen: {},         // whether the "browse by tag" panel is open, per view
    moreTopics: {},       // whether the full topic list is expanded, per view
    tree: {},             // sidebar tree open/closed overrides, keyed "category::Topic"
    docId: null,          // case shown in the reader
    lastLib: "all",       // library view to return to from the reader
    list: [],             // ids shown by the active view, used for prev/next in the detail panel
    modalId: null,
    lastFocus: null
  };
  var S = AH.state;
  var PAGE_SIZE = 10;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  /* ======================================================================
     Helpers
     ==================================================================== */
  AH.esc = function (v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };
  var esc = AH.esc;
  var icon = AH.icon;

  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  }
  function fmtDate(s) {
    var d = parseDate(s);
    return d ? d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear() : "No date";
  }
  function relDate(s) {
    var d = parseDate(s);
    if (!d) return "";
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var days = Math.round((now - d) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days > 1 && days <= 30) return days + " days ago";
    return "";
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many || one + "s"); }
  function catOf(r) { return C.categories[r.category]; }

  function toast(msg) {
    var el = document.createElement("div");
    el.className = "toast"; el.textContent = msg;
    $("#toasts").appendChild(el);
    setTimeout(function () { el.remove(); }, 2400);
  }
  function announce(msg) {
    var a = $("#announcer");
    if (a) a.textContent = msg;
  }
  function copyText(text) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { /* ignore */ }
      ta.remove();
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
  }

  /* ======================================================================
     Data validation: keeps the app resilient to typos when editing by hand
     ==================================================================== */
  function loadData() {
    var raw = window.ADVANCED_CONVERSATIONS;
    var warnings = [], seen = Object.create(null), out = [];
    if (!Array.isArray(raw)) {
      warnings.push("window.ADVANCED_CONVERSATIONS is missing or is not an array. Check js/conversations.js for a syntax error.");
      return { records: [], warnings: warnings };
    }
    raw.forEach(function (r, idx) {
      var label = r && r.id ? r.id : "record #" + (idx + 1);
      if (!r || typeof r !== "object") { warnings.push("Skipped " + label + ": not an object."); return; }
      if (!r.id || typeof r.id !== "string") { warnings.push("Skipped " + label + ": missing string id."); return; }
      if (seen[r.id]) { warnings.push("Skipped duplicate id " + r.id + " (ids must be unique)."); return; }
      if (!r.title) { warnings.push("Skipped " + r.id + ": missing title."); return; }
      if (!C.categories[r.category]) { warnings.push("Skipped " + r.id + ': category must be one of "' + CAT_KEYS.join('", "') + '" (got "' + r.category + '").'); return; }
      seen[r.id] = true;

      var rec = {
        id: r.id.trim(), title: String(r.title).trim(), category: r.category,
        topic: r.topic ? String(r.topic).trim() : "Other",
        tags: [], status: String(r.status || "").trim().toLowerCase(), dateAdded: r.dateAdded || "",
        summary: String(r.summary || ""), investigation: String(r.investigation || ""),
        findings: String(r.findings || ""), resolution: String(r.resolution || ""),
        intercomUrl: String(r.intercomUrl || "").trim()
      };
      if (!r.topic) warnings.push(rec.id + ': no topic set, using "Other".');
      else if (C.categories[rec.category].topics.indexOf(rec.topic) === -1) warnings.push(rec.id + ': topic "' + rec.topic + '" is not in the ' + C.categories[rec.category].label + " list in js/config.js (it is still shown).");
      if (!C.statuses[rec.status]) { warnings.push(rec.id + ': unknown status "' + r.status + '", using "investigating".'); rec.status = "investigating"; }
      if (!parseDate(rec.dateAdded)) { warnings.push(rec.id + ': dateAdded must be "YYYY-MM-DD" (got "' + rec.dateAdded + '").'); rec.dateAdded = "0000-00-00"; }
      if (rec.intercomUrl && !/^https?:\/\//i.test(rec.intercomUrl)) { warnings.push(rec.id + ": intercomUrl must start with http(s)://, link ignored."); rec.intercomUrl = ""; }
      (Array.isArray(r.tags) ? r.tags : []).forEach(function (t) {
        t = String(t).trim();
        if (t && rec.tags.indexOf(t) === -1) rec.tags.push(t);
      });
      out.push(rec);
    });
    return { records: out, warnings: warnings };
  }

  function showWarnings(list) {
    var box = $("#dataWarnings");
    if (!list.length) { box.hidden = true; return; }
    list.forEach(function (w) { console.warn("[Advanced Hub] " + w); });
    box.hidden = false;
    box.innerHTML = '<div class="warning-box" role="alert"><strong>' + icon("triangle-alert") + " Data check: " + plural(list.length, "issue") + " in js/conversations.js</strong><ul>" +
      list.slice(0, 8).map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") +
      (list.length > 8 ? "<li>&hellip; and " + (list.length - 8) + " more (see browser console)</li>" : "") + "</ul></div>";
  }

  /* ======================================================================
     Rich text for technical notes (safe: everything is escaped first)
     ==================================================================== */
  function inline(s) {
    return s.split(/(`[^`\n]+`)/).map(function (p, i) {
      if (i % 2) return "<code>" + esc(p.slice(1, -1)) + "</code>";
      var h = esc(p);
      h = h.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
      h = h.replace(/(^|[\s(])\*([^*\s][^*\n]*?)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
      h = h.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)&#;])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
      return h;
    }).join("");
  }
  var RE_UL = /^\s*[-*\u2022]\s+/, RE_OL = /^\s*\d+[.)]\s+/, RE_H = /^##\s+/, RE_Q = /^>\s?/;
  function blocks(t) {
    var lines = t.split("\n"), html = [], i = 0, items;
    while (i < lines.length) {
      var ln = lines[i];
      if (!ln.trim()) { i++; continue; }
      if (RE_UL.test(ln)) {
        items = []; while (i < lines.length && RE_UL.test(lines[i])) items.push(lines[i++].replace(RE_UL, ""));
        html.push("<ul>" + items.map(function (x) { return "<li>" + inline(x) + "</li>"; }).join("") + "</ul>");
      } else if (RE_OL.test(ln)) {
        items = []; while (i < lines.length && RE_OL.test(lines[i])) items.push(lines[i++].replace(RE_OL, ""));
        html.push("<ol>" + items.map(function (x) { return "<li>" + inline(x) + "</li>"; }).join("") + "</ol>");
      } else if (RE_H.test(ln)) {
        html.push("<h4>" + inline(ln.replace(RE_H, "")) + "</h4>"); i++;
      } else if (RE_Q.test(ln)) {
        items = []; while (i < lines.length && RE_Q.test(lines[i])) items.push(lines[i++].replace(RE_Q, ""));
        html.push("<blockquote>" + items.map(inline).join("<br>") + "</blockquote>");
      } else {
        items = [];
        while (i < lines.length && lines[i].trim() && !RE_UL.test(lines[i]) && !RE_OL.test(lines[i]) && !RE_H.test(lines[i]) && !RE_Q.test(lines[i])) items.push(lines[i++]);
        html.push("<p>" + items.map(inline).join("<br>") + "</p>");
      }
    }
    return html.join("");
  }
  function rich(text) {
    text = String(text || "").replace(/\r\n?/g, "\n").trim();
    if (!text) return "";
    var out = [], re = /```[^\n]*\n([\s\S]*?)```/g, last = 0, m;
    while ((m = re.exec(text))) {
      out.push(blocks(text.slice(last, m.index)));
      out.push("<pre><code>" + esc(m[1].replace(/\n$/, "")) + "</code></pre>");
      last = re.lastIndex;
    }
    out.push(blocks(text.slice(last)));
    return out.join("");
  }

  /* ======================================================================
     Reusable fragments
     ==================================================================== */
  function statusBadge(status) {
    var l = C.statuses[status] ? C.statuses[status].label : status;
    return '<span class="status status--' + esc(status) + '"><i></i>' + esc(l) + "</span>";
  }
  function stateFor(key) {
    if (!S.views[key]) S.views[key] = AH.Filters.defaultState(key);
    return S.views[key];
  }
  function countBy(fn) { return S.data.filter(fn).length; }
  function byDateDesc(list) { return list.slice().sort(function (a, b) { return AH.Filters.compareDate(b, a); }); }
  function pad2(n) { return n < 10 ? "0" + n : String(n); }
  function isLibrary(v) { return v === "inbox" || v === "automation" || v === "all"; }
  function findRecord(id) {
    for (var i = 0; i < S.data.length; i++) if (S.data[i].id === id) return S.data[i];
    return null;
  }

  /** Intercom conversation ID from the intercomUrl, e.g. .../conversation/215476887573636?x=1 -> 215476887573636 */
  function convId(rec) {
    var u = rec && rec.intercomUrl || "";
    var m = /\/conversation\/(\d+)/.exec(u) || /(\d{8,})(?!.*\d{8,})/.exec(u.split("?")[0]);
    return m ? m[1] : "";
  }

  /** The four written sections of a case, skipping empty ones. */
  function sectionsFor(rec) {
    var resTitle = rec.status === "workaround" ? "Workaround" : rec.status === "resolved" ? "Resolution" : "Resolution / workaround";
    return [
      { k: "summary", t: "Summary", v: rec.summary },
      { k: "investigation", t: "Investigation", v: rec.investigation },
      { k: "findings", t: "Findings", v: rec.findings },
      { k: "resolution", t: resTitle, v: rec.resolution }
    ].filter(function (s) { return s.v && s.v.trim(); });
  }

  /** Same topic first, then shared tags, then same category. */
  function relatedTo(rec, max) {
    return S.data.filter(function (r) { return r.id !== rec.id; }).map(function (r) {
      var shared = r.tags.filter(function (t) { return rec.tags.indexOf(t) !== -1; }).length;
      var score = (r.category === rec.category && r.topic === rec.topic ? 3 : 0) + shared * 2 + (r.category === rec.category ? 1 : 0);
      return { r: r, score: shared || (r.category === rec.category && r.topic === rec.topic) ? score : 0 };
    }).filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score || AH.Filters.compareDate(b.r, a.r); })
      .slice(0, max).map(function (x) { return x.r; });
  }

  /** One row of the documentation index. Whole row opens the full page; tags and quick view sit above the link. */
  function entryHtml(r, viewKey, query, showTags) {
    var hl = function (t) { return AH.Search.highlight(t, query); };
    var tags = showTags && r.tags.length
      ? '<div class="entry__tags">' + r.tags.slice(0, 4).map(function (t) {
          return '<button type="button" class="tag-link" data-action="add-tag" data-tag="' + esc(t) + '">#' + esc(t) + "</button>";
        }).join("") + (r.tags.length > 4 ? '<span class="tag-link">+' + (r.tags.length - 4) + "</span>" : "") + "</div>"
      : "";
    return '<article class="entry"><div>' +
      '<a class="entry__link" href="' + AH.Nav.hashFor("doc", r.id) + '">' +
        '<span class="entry__title"><span class="entry__id">' + hl(r.id) + '</span><span class="entry__sep">&middot;</span>' + hl(r.title) + "</span>" +
        '<span class="entry__meta"><span>' + hl(r.topic) + '</span><span class="dot-sep">' + statusBadge(r.status) + '</span><span class="dot-sep">' + esc(fmtDate(r.dateAdded)) + "</span></span>" +
      "</a>" + tags + "</div>" +
      '<button type="button" class="quick" data-action="preview" data-id="' + esc(r.id) + '" data-view="' + esc(viewKey) + '" aria-label="Quick view ' + esc(r.id) + '">' + icon("eye") + "Quick view</button></article>";
  }

  /* ======================================================================
     SIDEBAR: documentation tree (category > topic > case)
     ==================================================================== */
  function sideLink(href, ic, label, n, active) {
    return '<a class="side-link' + (active ? " is-active" : "") + '" href="' + href + '"' + (active ? ' aria-current="page"' : "") + ">" + icon(ic) + "<span>" + esc(label) + "</span>" +
      (n != null ? '<span class="n">' + n + "</span>" : "") + "</a>";
  }

  function treeOpen(key, cur) {
    if (S.tree[key] !== undefined) return S.tree[key];
    return !!(cur && AH.Filters.encodeTopic(cur.category, cur.topic) === key);
  }

  function renderSidebar() {
    var cur = S.current === "doc" ? findRecord(S.docId) : null;
    var html = sideLink("#/dashboard", "layout-dashboard", "Dashboard", null, S.current === "dashboard") +
      sideLink("#/all", "library", "Knowledge Library", S.data.length, S.current === "all") +
      '<div class="side-label eyebrow">Categories</div>';

    CAT_KEYS.forEach(function (cat) {
      var recs = S.data.filter(function (r) { return r.category === cat; });
      var topics = AH.Filters.topicOptions(S.data, { scope: cat, category: "" })[0].topics.filter(function (t) {
        return recs.some(function (r) { return r.topic === t; });
      });
      html += '<div class="side-cat"><a class="side-cat__head' + (S.current === cat ? " is-active" : "") + '" href="#/' + cat + '">' + icon(C.categories[cat].icon) +
        "<span>" + esc(C.categories[cat].label) + '</span><span class="n">' + recs.length + "</span></a>";
      topics.forEach(function (t) {
        var key = AH.Filters.encodeTopic(cat, t);
        var inTopic = byDateDesc(recs.filter(function (r) { return r.topic === t; }));
        var open = treeOpen(key, cur);
        html += '<button type="button" class="side-topic" data-action="tree-toggle" data-key="' + esc(key) + '" aria-expanded="' + open + '">' + icon("chevron-right") +
          "<span>" + esc(t) + '</span><span class="n">' + inTopic.length + "</span></button>";
        if (open) {
          html += '<div class="side-cases">' + inTopic.map(function (r) {
            var on = cur && cur.id === r.id;
            return '<a class="side-case' + (on ? " is-active" : "") + '" href="' + AH.Nav.hashFor("doc", r.id) + '" title="' + esc(r.id + " · " + r.title) + '"' + (on ? ' aria-current="page"' : "") + ">" + esc(r.title) + "</a>";
          }).join("") + "</div>";
        }
      });
      html += "</div>";
    });

    var latest = byDateDesc(S.data)[0];
    html += '<div class="sys">' + plural(S.data.length, "case") + " documented<br>" + (latest ? "Last added " + esc(fmtDate(latest.dateAdded)) : "No cases yet") + "<br>Search: " + esc(AH.Search.engine()) + "</div>";
    $("#sidebar").innerHTML = html;

    document.querySelectorAll("#topnav a").forEach(function (a) {
      var r = a.getAttribute("data-route");
      var on = r === "dashboard" ? S.current === "dashboard" : S.current !== "dashboard";
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }

  /* ======================================================================
     DASHBOARD: overview, recently added, activity, topics
     ==================================================================== */
  function renderDashboard() {
    var d = S.data, total = d.length;
    var n = {
      inbox: countBy(function (r) { return r.category === "inbox"; }),
      automation: countBy(function (r) { return r.category === "automation"; }),
      investigating: countBy(function (r) { return r.status === "investigating"; }),
      resolved: countBy(function (r) { return r.status === "resolved"; })
    };
    var recent = byDateDesc(d).slice(0, C.recentCount);
    S.list = recent.map(function (r) { return r.id; });

    function stat(href, num, label, attrs) {
      return '<a class="stat" href="' + href + '"' + (attrs || "") + '><span class="stat__n">' + num + '</span><span class="stat__l">' + label + "</span></a>";
    }

    $("#view").innerHTML = '<div class="page">' +
      '<header><h1>Overview</h1><p class="lead">Recently added cases, activity and statistics across the knowledge base.</p></header>' +
      '<section class="stats" aria-label="Statistics">' +
        stat("#/all", total, "Total cases") + stat("#/inbox", n.inbox, "Inbox Advanced") + stat("#/automation", n.automation, "Automation Advanced") +
        stat("#/all", n.investigating, "Investigating", ' data-action="filter-status" data-status="investigating"') +
        stat("#/all", n.resolved, "Resolved", ' data-action="filter-status" data-status="resolved"') +
      "</section>" +

      '<section class="dash-sec" aria-labelledby="recentTitle"><div class="dash-sec__head"><h2 id="recentTitle">Recently added</h2><a href="#/all">Open the library</a></div>' +
        (recent.length ? '<div class="entries">' + recent.map(function (r) { return entryHtml(r, "dashboard", "", false); }).join("") + "</div>" : emptyHtml({ none: true })) +
      "</section>" +

      '<section class="dash-sec" aria-labelledby="actTitle"><div class="dash-sec__head"><h2 id="actTitle">Activity &middot; cases added per week</h2></div>' + activityHtml() + "</section>" +

      '<section class="dash-sec" aria-labelledby="topicsTitle"><div class="dash-sec__head"><h2 id="topicsTitle">Topics</h2></div>' +
        '<div class="topics-grid">' + CAT_KEYS.map(categoryCard).join("") + "</div></section>" +
      '<footer class="footer-note"><span>Records live in <code>js/conversations.js</code></span></footer></div>';
  }

  /** Last 8 weeks, anchored on the most recent case so the chart never looks empty. */
  function activityHtml() {
    var dated = S.data.map(function (r) { return parseDate(r.dateAdded); }).filter(Boolean);
    if (!dated.length) return '<div class="activity"></div>';
    var latest = new Date(Math.max.apply(null, dated));
    var mon = new Date(latest); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7)); mon.setHours(0, 0, 0, 0);
    var weeks = [];
    for (var i = 7; i >= 0; i--) { var s = new Date(mon); s.setDate(s.getDate() - i * 7); weeks.push({ start: s, n: 0 }); }
    dated.forEach(function (dt) {
      var idx = Math.floor((dt - weeks[0].start) / (7 * 86400000));
      if (idx >= 0 && idx < weeks.length) weeks[idx].n++;
    });
    var max = Math.max.apply(null, weeks.map(function (w) { return w.n; }).concat([1]));
    return '<div class="activity-wrap"><div class="activity" role="img" aria-label="Cases added per week, last 8 weeks">' + weeks.map(function (w) {
      return '<div class="activity__col"><span class="activity__n">' + (w.n || "") + '</span><span class="activity__bar' + (w.n ? "" : " is-zero") + '" style="height:' + Math.round((w.n / max) * 78) + 'px"></span></div>';
    }).join("") + '</div><div style="display:flex;gap:10px;padding:0 18px">' + weeks.map(function (w) {
      return '<span class="activity__x" style="flex:1;text-align:center">' + w.start.getDate() + " " + MONTHS[w.start.getMonth()] + "</span>";
    }).join("") + "</div></div>";
  }

  function categoryCard(cat) {
    var recs = S.data.filter(function (r) { return r.category === cat; });
    var opts = AH.Filters.topicOptions(S.data, { scope: cat, category: "" })[0].topics;
    var counts = opts.map(function (t) { return { t: t, n: recs.filter(function (r) { return r.topic === t; }).length }; })
      .filter(function (c) { return c.n > 0; }).sort(function (a, b) { return b.n - a.n; });
    return '<article class="topics"><header><h3>' + esc(C.categories[cat].label) + '</h3><span class="big">' + pad2(recs.length) + "</span></header>" +
      (counts.length ? counts.map(function (c) {
        return '<button type="button" class="topic-row" data-n="' + c.n + '" data-action="topic-jump" data-cat="' + cat + '" data-topic="' + esc(c.t) + '"><span class="topic-row__name">' + esc(c.t) + '</span><span class="topic-row__n">' + pad2(c.n) + "</span></button>";
      }).join("") : '<p class="lead" style="padding:10px 0">Nothing documented yet.</p>') + "</article>";
  }

  /* ======================================================================
     KNOWLEDGE LIBRARY (Inbox / Automation / All): a documentation index
     ==================================================================== */
  var LIB_META = {
    inbox:      { title: "Inbox Advanced", lead: C.categories.inbox.blurb },
    automation: { title: "Automation Advanced", lead: C.categories.automation.blurb },
    all:        { title: "All conversations", lead: "Documented investigations and solutions across every category." }
  };
  var MAX_TOPIC_PILLS = 8;

  function renderLibrary(key) {
    var st = stateFor(key), meta = LIB_META[key];
    $("#view").innerHTML = '<div class="page" data-view-key="' + key + '">' +
      '<header class="page-head"><div><h1>' + esc(meta.title) + '</h1><p class="lead">' + esc(meta.lead) + '</p></div><span class="count-pill" id="countPill"></span></header>' +
      '<label class="searchbox">' + icon("search") + '<span class="sr-only">Search documented cases</span><input id="libSearch" type="search" autocomplete="off" spellcheck="false" placeholder="Search documented cases..."></label>' +
      '<div class="pills" id="tabs" role="group" aria-label="Topics"></div>' +
      '<div class="toolbar">' +
        '<label class="tool">Status <select id="fStatus"></select></label>' +
        '<label class="tool">Sort <select id="fSort"></select></label>' +
        '<button type="button" class="tool-btn" id="tagBtn" data-action="toggle-tags" aria-controls="tagpanel" aria-expanded="false">' + icon("tag") + 'Browse by tag<span id="tagN"></span>' + icon("chevron-down") + "</button>" +
      "</div>" +
      '<div class="tagpanel" id="tagpanel" hidden></div>' +
      '<div class="activebar" id="activeFilters"></div>' +
      '<div id="results"></div></div>';

    var fs = $("#fStatus");
    fs.innerHTML = opt("", "Any", !st.status) + Object.keys(C.statuses).map(function (k) { return opt(k, C.statuses[k].label, st.status === k); }).join("");
    fs.addEventListener("change", function (e) { st.status = e.target.value; updateLibrary(key); });
    $("#fSort").addEventListener("change", function (e) { st.sort = e.target.value; st.sortTouched = true; updateLibrary(key); });
    updateLibrary(key);
  }

  function opt(value, label, selected, disabled) {
    return '<option value="' + esc(value) + '"' + (selected ? " selected" : "") + (disabled ? " disabled" : "") + ">" + esc(label) + "</option>";
  }

  function setQuery(st, value) {
    var had = st.query.trim().length > 0, has = value.trim().length > 0;
    st.query = value;
    if (has && !had && !st.sortTouched) st.sort = "relevance";
    if (!has && st.sort === "relevance") st.sort = "newest";
  }
  function onQuery(key, value) { setQuery(stateFor(key), value); updateLibrary(key); }

  /** Topic pills: only topics with at least one case, long lists collapse behind "+N more". */
  function pillsHtml(key, scoped, st) {
    var map = Object.create(null), list = [];
    scoped.forEach(function (r) {
      var v = AH.Filters.encodeTopic(r.category, r.topic);
      if (!map[v]) { map[v] = { v: v, name: r.topic, cat: r.category, n: 0 }; list.push(map[v]); }
      map[v].n++;
    });
    list.sort(function (a, b) { return b.n - a.n || a.name.localeCompare(b.name); });
    var dup = Object.create(null);
    list.forEach(function (t) { dup[t.name] = (dup[t.name] || 0) + 1; });
    function pill(value, label) {
      return '<button type="button" class="pill-btn" aria-pressed="' + (st.topic === value) + '" data-action="tab" data-topic="' + esc(value) + '">' + esc(label) + "</button>";
    }
    var shown = list;
    var open = !!S.moreTopics[key];
    if (list.length > MAX_TOPIC_PILLS && !open) {
      shown = list.slice(0, MAX_TOPIC_PILLS);
      var sel = list.filter(function (t) { return t.v === st.topic; })[0];
      if (sel && shown.indexOf(sel) === -1) shown.push(sel);
    }
    return pill("", "All topics") + shown.map(function (t) {
      return pill(t.v, dup[t.name] > 1 ? t.name + " (" + C.categories[t.cat].short + ")" : t.name);
    }).join("") + (list.length > MAX_TOPIC_PILLS
      ? '<button type="button" class="pill-btn pill-btn--ghost" data-action="toggle-topics">' + (open ? "Show fewer" : "+" + (list.length - shown.length) + " more") + "</button>" : "");
  }

  function updateLibrary(key) {
    var st = stateFor(key);
    var wrap = $('[data-view-key="' + key + '"]');
    if (!wrap) return;
    var results = AH.Filters.apply(S.data, st);
    var scoped = AH.Filters.inScope(S.data, st);
    var hasQuery = !!st.query.trim();
    var filtered = AH.Filters.hasActive(st);
    S.list = results.map(function (r) { return r.id; });

    // search boxes stay in sync (header + page)
    var gs = $("#globalSearch"), ls = $("#libSearch");
    if (gs.value !== st.query) gs.value = st.query;
    if (ls.value !== st.query) ls.value = st.query;

    // secondary controls
    var fs = $("#fStatus"); fs.value = st.status; fs.classList.toggle("is-set", !!st.status);
    if (!hasQuery && st.sort === "relevance") st.sort = "newest";
    var sort = $("#fSort");
    sort.innerHTML = opt("newest", "Newest first", st.sort === "newest") + opt("oldest", "Oldest first", st.sort === "oldest") + opt("relevance", "Best match", st.sort === "relevance", !hasQuery);
    sort.value = st.sort;

    $("#countPill").textContent = results.length === scoped.length ? pad2(scoped.length) + (scoped.length === 1 ? " case" : " cases") : results.length + " of " + scoped.length + " cases";
    $("#tabs").innerHTML = pillsHtml(key, scoped, st);

    // tags are secondary navigation: a quiet, collapsible index of text links
    var tagOpen = !!S.tagsOpen[key];
    var tb = $("#tagBtn"); tb.setAttribute("aria-expanded", String(tagOpen));
    $("#tagN").textContent = st.tags.length ? " (" + st.tags.length + ")" : "";
    var panel = $("#tagpanel"); panel.hidden = !tagOpen;
    if (tagOpen) {
      var focusedTag = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("data-tag");
      var facets = AH.Filters.tagFacets(S.data, st);
      panel.innerHTML = facets.length ? facets.map(function (f) {
        var on = st.tags.indexOf(f.tag) !== -1;
        return '<button type="button" data-action="toggle-tag" data-tag="' + esc(f.tag) + '" aria-pressed="' + on + '"' + (f.count === 0 && !on ? " disabled" : "") + ">#" + esc(f.tag) + " <small>" + f.count + "</small></button>";
      }).join("") : '<span class="lead">No tags yet.</span>';
      if (focusedTag) { var again = panel.querySelector('[data-tag="' + CSS.escape(focusedTag) + '"]'); if (again) again.focus(); }
    }

    // active filters (topic is already the selected pill)
    var af = AH.Filters.activeFilters(st).filter(function (a) { return a.key !== "topic"; });
    $("#activeFilters").innerHTML = af.map(function (a) {
      return '<span class="pill-x">' + esc(a.label) + '<button type="button" data-action="remove-filter" data-key="' + a.key + '"' + (a.value ? ' data-value="' + esc(a.value) + '"' : "") + ' aria-label="Remove filter ' + esc(a.label) + '">' + icon("x") + "</button></span>";
    }).join("") + (filtered ? '<button type="button" class="link-btn" data-action="clear-filters">Clear all</button>' : "");

    announce((results.length === scoped.length ? plural(results.length, "conversation") : results.length + " of " + scoped.length + " conversations") + (hasQuery ? " matching " + st.query.trim() : ""));

    // pagination: back to page 1 whenever the filters change
    var sig = JSON.stringify([st.query, st.category, st.topic, st.status, st.sort, st.tags]);
    if (S.sig[key] !== sig) { S.sig[key] = sig; S.page[key] = 1; }
    var pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    var page = Math.min(Math.max(1, S.page[key] || 1), pages);
    S.page[key] = page;
    var from = (page - 1) * PAGE_SIZE, slice = results.slice(from, from + PAGE_SIZE);

    var label = hasQuery ? "Results for \u201C" + st.query.trim() + "\u201D" : filtered ? "Results" : st.sort === "oldest" ? "Oldest investigations" : "Recent investigations";
    $("#results").innerHTML = results.length
      ? '<div class="list-label eyebrow">' + esc(label) + '</div><div class="entries">' + slice.map(function (r) { return entryHtml(r, key, st.query, true); }).join("") + "</div>" + pagerHtml(page, pages, from, slice.length, results.length)
      : emptyHtml({ none: scoped.length === 0, filtered: true, query: st.query });
  }

  function pagerHtml(page, pages, from, shown, total) {
    var info = "<span>Showing " + (from + 1) + "&ndash;" + (from + shown) + " of " + plural(total, "case") + "</span>";
    if (pages < 2) return '<div class="pager">' + info + "</div>";
    var nums = "";
    for (var i = 1; i <= pages; i++) nums += '<button type="button" data-action="page" data-page="' + i + '"' + (i === page ? ' aria-current="page"' : "") + ' aria-label="Page ' + i + '">' + i + "</button>";
    return '<nav class="pager" aria-label="Pagination">' + info + '<div class="pager__nav">' +
      '<button type="button" data-action="page" data-page="' + (page - 1) + '" aria-label="Previous page"' + (page === 1 ? " disabled" : "") + ">" + icon("chevron-left") + "</button>" + nums +
      '<button type="button" data-action="page" data-page="' + (page + 1) + '" aria-label="Next page"' + (page === pages ? " disabled" : "") + ">" + icon("chevron-right") + "</button></div></nav>";
  }

  function emptyHtml(o) {
    if (o.none) {
      return '<div class="empty"><div>' + icon("file-text") + "</div><h3>Nothing documented here yet</h3><p>Add an object to <code>js/conversations.js</code> and refresh the page. It will show up here automatically.</p></div>";
    }
    return '<div class="empty"><div>' + icon("search-x") + "</div><h3>No conversations match</h3>" +
      "<p>" + (o.query && o.query.trim() ? "Nothing found for &ldquo;" + esc(o.query.trim()) + "&rdquo; with the current filters. Try a shorter keyword or remove a filter." : "No cases match this combination of filters. Try removing one.") + "</p>" +
      '<p style="margin-top:14px"><button type="button" class="btn btn--ink" data-action="clear-filters">' + icon("rotate-ccw") + "Clear all filters</button></p></div>";
  }

  /* ======================================================================
     DOCUMENTATION READER: full-page article for one investigation
     ==================================================================== */
  function metaLine(rec) {
    return '<p class="doc-meta"><span>' + esc(catOf(rec).label) + '</span><span class="sep"></span><span>' + esc(rec.topic) + '</span><span class="sep"></span>' +
      statusBadge(rec.status) + '<span class="sep"></span><span>' + esc(fmtDate(rec.dateAdded)) + "</span></p>";
  }
  function tagsRow(rec) {
    return rec.tags.length ? '<div class="doc-tags"><span class="eyebrow">Tags</span>' + rec.tags.map(function (t) {
      return '<button type="button" class="tag-link" data-action="set-tag" data-tag="' + esc(t) + '">#' + esc(t) + "</button>";
    }).join("") + "</div>" : "";
  }

  function renderDoc(rec) {
    leaveDoc();
    S.current = "doc"; S.docId = rec.id;
    document.body.classList.add("is-doc");

    var secs = sectionsFor(rec);
    var related = relatedTo(rec, 4);
    var toc = secs.map(function (s) { return { id: "sec-" + s.k, t: s.t }; });
    if (related.length) toc.push({ id: "sec-related", t: "Related cases" });

    var order = byDateDesc(S.data), idx = order.indexOf(rec);
    var newer = idx > 0 ? order[idx - 1] : null, older = idx < order.length - 1 ? order[idx + 1] : null;
    var back = LIB_META[S.lastLib] || LIB_META.all;
    var cid = convId(rec);

    var openBtn = rec.intercomUrl
      ? '<a class="icon-btn icon-btn--line" href="' + esc(rec.intercomUrl) + '" target="_blank" rel="noopener noreferrer" aria-label="Open original conversation in Intercom" title="Open in Intercom">' + icon("external-link") + "</a>"
      : '<span class="icon-btn icon-btn--line" style="opacity:.35;cursor:default" title="No Intercom link recorded" role="img" aria-label="No Intercom link recorded">' + icon("external-link") + "</span>";

    var html = '<article class="doc" data-doc="' + esc(rec.id) + '">' +
      '<div class="doc-top"><a class="back" href="#/' + esc(S.lastLib) + '">' + icon("arrow-left") + esc(back.title) + "</a>" +
        '<div class="doc-actions">' + (cid ? '<button type="button" class="icon-btn icon-btn--line" data-action="copy-id" data-conv="' + esc(cid) + '" aria-label="Copy conversation ID" title="Copy conversation ID">' + icon("copy") + "</button>" : "") + openBtn + "</div></div>" +
      '<span class="idpill">' + esc(rec.id) + "</span>" +
      "<h1>" + esc(rec.title) + "</h1>" + metaLine(rec) + tagsRow(rec) + '<hr class="doc-rule">' +
      secs.map(function (s, i) {
        return '<section class="dsec" id="sec-' + s.k + '" data-sec><h2><span class="num">' + pad2(i + 1) + "</span> / " + esc(s.t) + '</h2><div class="prose">' + rich(s.v) + "</div></section>";
      }).join("") +
      (secs.length ? "" : '<section class="dsec"><p class="lead">No notes have been written for this case yet.</p></section>') +
      (related.length ? '<section class="dsec" id="sec-related" data-sec><h2><span class="num">' + pad2(secs.length + 1) + '</span> / Related cases</h2><ul class="related">' +
        related.map(function (r) {
          return '<li><a href="' + AH.Nav.hashFor("doc", r.id) + '"><span><span class="id">' + esc(r.id) + '</span><span class="sep">&middot;</span>' + esc(r.title) + "</span>" + icon("arrow-up-right") + "</a></li>";
        }).join("") + "</ul></section>" : "") +
      '<nav class="pn" aria-label="Neighbouring cases">' +
        (newer ? '<a href="' + AH.Nav.hashFor("doc", newer.id) + '" rel="prev"><small>&larr; Newer</small><span>' + esc(newer.id + " · " + newer.title) + "</span></a>" : "") +
        (older ? '<a href="' + AH.Nav.hashFor("doc", older.id) + '" rel="next"><small>Older &rarr;</small><span>' + esc(older.id + " · " + older.title) + "</span></a>" : "") +
      '</nav><div id="doc-end" aria-hidden="true" style="height:1px"></div></article>';
    $("#view").innerHTML = html;

    $("#toc").innerHTML = '<div class="eyebrow toc-title">' + icon("list") + "On this page</div>" +
      '<ul class="toc-list">' + toc.map(function (t, i) {
        return '<li><a href="#" data-action="toc" data-target="' + t.id + '"' + (i === 0 ? ' class="is-active"' : "") + ">" + esc(t.t) + "</a></li>";
      }).join("") + "</ul>" +
      '<div class="toc-actions">' +
        (rec.intercomUrl ? '<a href="' + esc(rec.intercomUrl) + '" target="_blank" rel="noopener noreferrer">' + icon("external-link") + "Open in Intercom</a>" : '<span class="is-off" style="display:flex;gap:10px;align-items:center;padding:6px 0">' + icon("external-link") + "No Intercom link</span>") +
        (rec.intercomUrl ? '<button type="button" data-action="copy-link" data-url="' + esc(rec.intercomUrl) + '">' + icon("link") + "Copy link</button>" : "") +
        (cid ? '<button type="button" data-action="copy-id" data-conv="' + esc(cid) + '">' + icon("copy") + "Copy case ID</button>" : "") + "</div>";

    document.title = rec.id + " · " + rec.title + " · Advanced Hub";
    renderSidebar();
    toTop();
    bindSpy();
  }

  function toTop() {
    try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, 0); }
  }

  /** "On this page" highlighting via IntersectionObserver: no scroll listener, no layout reads per frame. */
  var spyObs = null, endObs = null;
  function setActiveToc(id) {
    document.querySelectorAll(".toc-list a").forEach(function (a) {
      var on = a.getAttribute("data-target") === id;
      if (a.classList.contains("is-active") !== on) a.classList.toggle("is-active", on);
    });
  }
  function unbindSpy() {
    if (spyObs) { spyObs.disconnect(); spyObs = null; }
    if (endObs) { endObs.disconnect(); endObs = null; }
  }
  function bindSpy() {
    unbindSpy();
    if (!("IntersectionObserver" in window)) return;
    var secs = [].slice.call(document.querySelectorAll("[data-sec]"));
    if (!secs.length) return;
    var vis = Object.create(null), atEnd = false;
    function pick() {
      var act = null;
      if (atEnd) act = secs[secs.length - 1];
      else for (var i = 0; i < secs.length; i++) if (vis[secs[i].id]) { act = secs[i]; break; }
      if (act) setActiveToc(act.id);
    }
    spyObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { vis[e.target.id] = e.isIntersecting; });
      pick();
    }, { rootMargin: "-130px 0px -55% 0px" });
    secs.forEach(function (el) { spyObs.observe(el); });
    var end = document.getElementById("doc-end");
    if (end) {
      endObs = new IntersectionObserver(function (entries) { atEnd = entries[0].isIntersecting; pick(); });
      endObs.observe(end);
    }
  }
  function leaveDoc() {
    unbindSpy();
    document.body.classList.remove("is-doc");
    S.docId = null;
    var t = $("#toc"); if (t) t.innerHTML = "";
  }

  /* ======================================================================
     QUICK PREVIEW (optional drawer). The full page is the primary reader.
     ==================================================================== */
  function openModal(rec) {
    var root = $("#modalRoot");
    var existing = $(".overlay", root);
    if (!existing) S.lastFocus = document.activeElement;
    S.modalId = rec.id;

    var idx = S.list.indexOf(rec.id);
    var prevId = idx > 0 ? S.list[idx - 1] : null;
    var nextId = idx >= 0 && idx < S.list.length - 1 ? S.list[idx + 1] : null;
    var secs = sectionsFor(rec);

    var html = '<div class="overlay' + (existing ? " no-anim" : "") + '" data-action="overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<div class="modal__bar"><div><span class="idpill" style="margin:0;font-size:13px">' + esc(rec.id) + "</span><span class=\"eyebrow\">Quick view</span></div>" +
      "<div>" +
        '<button type="button" class="icon-btn" data-action="prev"' + (prevId ? ' data-id="' + esc(prevId) + '"' : " disabled") + ' aria-label="Previous case" title="Previous (\u2190)">' + icon("chevron-left") + "</button>" +
        '<button type="button" class="icon-btn" data-action="next"' + (nextId ? ' data-id="' + esc(nextId) + '"' : " disabled") + ' aria-label="Next case" title="Next (\u2192)">' + icon("chevron-right") + "</button>" +
        '<a class="btn btn--ink btn--sm" href="' + AH.Nav.hashFor("doc", rec.id) + '">Open full page' + icon("arrow-right") + "</a>" +
        '<button type="button" class="icon-btn" data-action="close-modal" id="modalClose" aria-label="Close preview" title="Close (Esc)">' + icon("x") + "</button>" +
      "</div></div>" +
      '<div class="modal__body" id="modalBody"><h2 class="modal__title" id="modalTitle">' + esc(rec.title) + "</h2>" + metaLine(rec) + tagsRow(rec) +
      secs.map(function (s) { return '<section class="dsec"><h2>' + esc(s.t) + '</h2><div class="prose">' + rich(s.v) + "</div></section>"; }).join("") +
      (secs.length ? "" : '<p class="lead" style="margin-top:24px">No notes have been written for this case yet.</p>') +
      '<div class="modal__cta"><span>' + (rec.intercomUrl ? "Need the original thread?" : "No Intercom link recorded.") + "</span>" +
        (rec.intercomUrl ? '<a class="btn btn--sm" href="' + esc(rec.intercomUrl) + '" target="_blank" rel="noopener noreferrer">' + icon("external-link") + "Open in Intercom</a>" : "") + "</div>" +
      "</div></div></div>";

    root.innerHTML = html;
    document.body.classList.add("is-locked");
    if (!existing) $("#modalClose").focus();
    document.title = rec.id + " · " + rec.title + " · Advanced Hub";
  }

  function closeModal() {
    var root = $("#modalRoot");
    if (!$(".overlay", root)) return;
    root.innerHTML = "";
    document.body.classList.remove("is-locked");
    S.modalId = null;
    setTitleFor(S.current);
    var f = S.lastFocus;
    S.lastFocus = null;
    if (f && document.contains(f)) { try { f.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }

  /* ======================================================================
     ROUTING glue
     ==================================================================== */
  function setTitleFor(view) {
    var names = { dashboard: "Dashboard", inbox: "Inbox Advanced", automation: "Automation Advanced", all: "All conversations" };
    if (names[view]) document.title = names[view] + " · Advanced Hub";
  }

  function renderView(view) {
    leaveDoc();
    S.current = view;
    if (view === "dashboard") renderDashboard(); else { S.lastLib = view; renderLibrary(view); }
    renderSidebar();
    setTitleFor(view);
  }

  function onRoute(r) {
    if (r.view === "doc") {
      var doc = r.id ? findRecord(r.id) : null;
      closeModal();
      if (doc) { if (S.current !== "doc" || S.docId !== doc.id) renderDoc(doc); return; }
      if (r.id) toast("Conversation " + r.id + " was not found.");
      AH.Nav.replaceHash(AH.Nav.hashFor("all"));
      r = { view: "all", id: null };
    }
    if (r.view !== S.current) {
      renderView(r.view);
      if (!r.id) toTop();
    }
    if (r.id) {
      var rec = findRecord(r.id);
      if (!rec) {
        toast("Conversation " + r.id + " was not found.");
        AH.Nav.replaceHash(AH.Nav.hashFor(r.view));
        closeModal();
        return;
      }
      if (S.modalId !== rec.id) openModal(rec);
    } else {
      closeModal();
    }
  }

  function goFiltered(view, mutate) {
    var st = stateFor(view);
    AH.Filters.reset(st);
    mutate(st);
    AH.Nav.go(view);
    if (S.current === view) renderView(view);   // already on that view: re-render with the new filters
  }

  /* ======================================================================
     Events (delegated)
     ==================================================================== */
  function activeKey(el) {
    var w = el.closest("[data-view-key]");
    return w ? w.getAttribute("data-view-key") : S.current;
  }

  function onClick(e) {
    var el = e.target.closest("[data-action]");
    if (!el) return;
    var a = el.getAttribute("data-action");
    var key, st, id;

    switch (a) {
      case "overlay": if (e.target === el) AH.Nav.closeDetail(); break;
      case "close-modal": AH.Nav.closeDetail(); break;
      case "prev": case "next":
        if (el.getAttribute("data-id")) AH.Nav.swap(AH.Nav.parse().view, el.getAttribute("data-id"));
        break;
      case "preview":
        AH.Nav.go(el.getAttribute("data-view"), el.getAttribute("data-id"));
        break;
      case "copy-id":
        id = el.getAttribute("data-conv");
        copyText(id).then(function (ok) { toast(ok ? "Copied " + id : "Copy failed. Select the ID manually."); });
        break;
      case "copy-link":
        copyText(el.getAttribute("data-url")).then(function (ok) { toast(ok ? "Intercom link copied" : "Copy failed."); });
        break;
      case "toc":
        e.preventDefault();
        var target = document.getElementById(el.getAttribute("data-target"));
        if (target) {
          setActiveToc(target.id);
          target.scrollIntoView({ block: "start", behavior: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        }
        break;
      case "tree-toggle":
        key = el.getAttribute("data-key");
        S.tree[key] = el.getAttribute("aria-expanded") !== "true";
        renderSidebar();
        break;
      case "set-tag":     // reader / drawer: jump to the library filtered by this tag
        goFiltered("all", function (s) { s.tags = [el.getAttribute("data-tag")]; });
        break;
      case "add-tag":     // index rows: narrow the current library, or open one from the dashboard
        if (isLibrary(S.current)) {
          st = stateFor(S.current);
          var tg = el.getAttribute("data-tag");
          if (st.tags.indexOf(tg) === -1) st.tags.push(tg);
          updateLibrary(S.current);
        } else {
          goFiltered("all", function (s) { s.tags = [el.getAttribute("data-tag")]; });
        }
        break;
      case "filter-status":
        e.preventDefault();
        goFiltered("all", function (s) { s.status = el.getAttribute("data-status"); });
        break;
      case "topic-jump":
        goFiltered(el.getAttribute("data-cat"), function (s) { s.topic = AH.Filters.encodeTopic(el.getAttribute("data-cat"), el.getAttribute("data-topic")); });
        break;
      case "toggle-tag":
        key = activeKey(el); st = stateFor(key);
        var t = el.getAttribute("data-tag"), i = st.tags.indexOf(t);
        if (i === -1) st.tags.push(t); else st.tags.splice(i, 1);
        updateLibrary(key);
        break;
      case "toggle-tags":
        key = activeKey(el); S.tagsOpen[key] = !S.tagsOpen[key];
        updateLibrary(key);
        break;
      case "toggle-topics":
        key = activeKey(el); S.moreTopics[key] = !S.moreTopics[key];
        updateLibrary(key);
        break;
      case "page":
        key = activeKey(el);
        S.page[key] = parseInt(el.getAttribute("data-page"), 10) || 1;
        updateLibrary(key);
        var lb = $(".list-label"); if (lb) lb.scrollIntoView({ block: "start" });
        break;
      case "tab":
        key = activeKey(el); st = stateFor(key);
        st.topic = el.getAttribute("data-topic") || "";
        updateLibrary(key);
        break;
      case "clear-filters":
        key = activeKey(el); AH.Filters.reset(stateFor(key));
        updateLibrary(key);
        break;
      case "remove-filter":
        key = activeKey(el); st = stateFor(key);
        var k = el.getAttribute("data-key");
        if (k === "query") { onQuery(key, ""); return; }
        else if (k === "tag") { st.tags = st.tags.filter(function (x) { return x !== el.getAttribute("data-value"); }); }
        else { st[k] = ""; }
        updateLibrary(key);
        break;
    }
  }

  function trapFocus(e) {
    var modal = $(".modal");
    if (!modal) return;
    var f = Array.prototype.filter.call(modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'), function (n) { return n.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (!modal.contains(document.activeElement)) { first.focus(); e.preventDefault(); }
    else if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }

  function onKey(e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || "")) || e.target.isContentEditable;
    if (S.modalId) {
      if (e.key === "Escape") { e.preventDefault(); AH.Nav.closeDetail(); return; }
      if (e.key === "Tab") { trapFocus(e); return; }
      if (!typing && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        var b = $('[data-action="' + (e.key === "ArrowLeft" ? "prev" : "next") + '"]');
        if (b && b.getAttribute("data-id")) { e.preventDefault(); b.click(); }
      }
      return;
    }
    if (((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) && !e.altKey) {
      e.preventDefault();
      $("#globalSearch").focus();
    } else if (e.key === "Escape" && e.target.type === "search" && e.target.value) {
      e.target.value = ""; onGlobalSearch("");
    }
  }

  /** Header search: filters in place on a library page, otherwise jumps to the library. */
  function onGlobalSearch(value) {
    if (isLibrary(S.current)) { onQuery(S.current, value); return; }
    setQuery(stateFor("all"), value);
    if (value.trim()) AH.Nav.go("all");
  }

    /** Console helper: run AH.perf() then scroll/navigate for 15s to log long tasks and slow frames. */
  AH.perf = function () {
    var log = function (k, v) { console.log("[perf] " + k, v); };
    try {
      new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { log("long task " + Math.round(e.duration) + "ms", e.attribution && e.attribution[0] ? e.attribution[0].name : ""); }); }).observe({ entryTypes: ["longtask"] });
    } catch (e) { log("longtask unsupported", e.message); }
    var last = performance.now(), slow = 0, frames = 0, end = last + 15000;
    (function tick(t) {
      frames++; if (t - last > 50) { slow++; log("slow frame " + Math.round(t - last) + "ms", ""); }
      last = t; if (t < end) requestAnimationFrame(tick); else log("done", frames + " frames, " + slow + " slow (>50ms)");
    })(last);
    log("running for 15s: scroll and navigate now", "");
  };


  /* ======================================================================
     Boot
     ==================================================================== */
  function init() {
    AH.hydrateIcons(document);
    var live = document.createElement("div");
    live.id = "announcer"; live.className = "sr-only"; live.setAttribute("aria-live", "polite");
    document.body.appendChild(live);

    var loaded = loadData();
    S.data = loaded.records;
    showWarnings(loaded.warnings);
    AH.Search.init(S.data);

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    var qTimer = 0;   // debounce: re-filter ~120ms after the last keystroke, not on every one
    document.addEventListener("input", function (e) {
      var id = e.target.id;
      if (id !== "globalSearch" && id !== "libSearch") return;
      var v = e.target.value;
      clearTimeout(qTimer);
      qTimer = setTimeout(function () {
        if (id === "globalSearch") onGlobalSearch(v);
        else if (isLibrary(S.current)) onQuery(S.current, v);
      }, 120);
    });
    $("#globalSearch").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); if (!isLibrary(S.current)) AH.Nav.go("all"); }
    });

    AH.Nav.init(onRoute);
  }

  try { init(); }
  catch (err) {
    console.error("[Advanced Hub] Failed to start:", err);
    var v = document.getElementById("view");
    if (v) v.innerHTML = '<div class="warning-box" role="alert"><strong>Advanced Hub could not start.</strong><br>' + String(err && err.message ? err.message : err).replace(/</g, "&lt;") + "<br>Open the browser console (Cmd+Option+J) for details.</div>";
  }
})();
