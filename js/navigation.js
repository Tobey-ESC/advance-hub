/* ============================================================================
   NAVIGATION — hash router (works on file://) + mobile sidebar.
     #/dashboard   #/inbox   #/automation   #/all
     #/<view>/<ID>   -> same view with the quick-preview drawer open (deep-linkable)
     #/doc/<ID>      -> full-page documentation reader
   ========================================================================== */
window.AH = window.AH || {};

AH.Nav = (function () {
  var VIEWS = ["dashboard", "inbox", "automation", "all", "doc"];
  var handler = null;
  var curHash = "", prevHash = "";   // lets "close" know whether Back would land on the list

  function parse() {
    var parts = (location.hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
    var view = VIEWS.indexOf(parts[0]) !== -1 ? parts[0] : "dashboard";
    var id = parts[1] ? decodeURIComponent(parts[1]) : null;
    return { view: view, id: id };
  }

  /** history.replaceState can throw on file:// in some browsers; fall back to location.replace. */
  function replaceHash(h) {
    try { history.replaceState(null, "", h); }
    catch (e) { location.replace(h); }
  }

  function hashFor(view, id) { return "#/" + view + (id ? "/" + encodeURIComponent(id) : ""); }

  function fire() { if (handler) handler(parse()); }

  /** Go to a view (and optionally open a conversation). */
  function go(view, id) {
    var target = hashFor(view, id);
    if (location.hash === target) { fire(); return; }
    location.hash = target;
  }

  /** Close the detail panel, staying on the current view. */
  function closeDetail() {
    var r = parse();
    if (!r.id) return;
    if (prevHash === hashFor(r.view)) { history.back(); return; }   // opened from this very list: just step back
    replaceHash(hashFor(r.view));
    curHash = location.hash;
    fire();
  }

  /** Replace the current detail entry (used by prev/next so Back does not step through every case). */
  function swap(view, id) {
    replaceHash(hashFor(view, id));
    curHash = location.hash;
    fire();
  }

  function openMobile(open) {
    document.body.classList.toggle("nav-open", open);
    var btn = document.getElementById("menuToggle");
    if (btn) btn.setAttribute("aria-expanded", String(open));
    var scrim = document.getElementById("scrim");
    if (scrim) scrim.hidden = !open;
  }

  function init(onChange) {
    handler = onChange;
    curHash = location.hash;
    window.addEventListener("hashchange", function () {
      prevHash = curHash; curHash = location.hash;
      fire();
      openMobile(false);
    });
    document.getElementById("menuToggle").addEventListener("click", function () {
      openMobile(!document.body.classList.contains("nav-open"));
    });
    document.getElementById("scrim").addEventListener("click", function () { openMobile(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 960) openMobile(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) openMobile(false);
    });
    fire();
  }

  return { init: init, go: go, swap: swap, parse: parse, closeDetail: closeDetail, hashFor: hashFor, replaceHash: replaceHash, closeMobile: function () { openMobile(false); } };
})();
