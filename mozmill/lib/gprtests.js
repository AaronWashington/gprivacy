// $Id$

"use strict";

var gpr = exports;

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var {assert, expect} = require("mozmill/assertions");

gpr.XPathResult = Components.interfaces.nsIDOMXPathResult;

const DEBUG = Services.prefs.getBoolPref("extensions.gprivacy.debug");

gpr.XPath = function(doc, xpath, type) {
  type = type || XPathResult.ANY_TYPE;
  return doc.evaluate(xpath, doc, null, type, null );
};

gpr.setPrefs = function(prefs, pfx) {
  debug(JSON.stringify([prefs, pfx]));

  let saved = {}
  for (let p in prefs) {
    let neew = prefs[p];
    if (pfx) p = pfx+"."+p;
    let type = Services.prefs.getPrefType(p);
    switch (type) {
      case  32:
        saved[p] = Services.prefs.getCharPref(p);
        if (neew!=null) Services.prefs.setCharPref(p, neew);
        break;
      case  64:
        saved[p] = Services.prefs.getIntPref(p);
        if (neew!=null) Services.prefs.setIntPref(p,  neew);
        break;
      case 128:
        saved[p] = Services.prefs.getBoolPref(p);
        if (neew!=null) Services.prefs.setBoolPref(p, neew);
        break;
      default:
        throw Error("Invalid preference type '"+type+"' for '"+p+"'");
    }
    // debug("prefs: '"+p+"' '"+saved[p]+"' -> '"+neew+"'")
    if (neew==null) Services.prefs.clearUserPref(p);
  }
  return saved;
};

gpr.waitPage = function(ctlr, refresh, tabIndex, url) {
  let doc = ctlr.tabs.activeTab;
  if (tabIndex !== undefined && tabIndex !== null) {
    assert.equal(tabIndex < ctlr.tabs.length, true, "Tab index: "+tabIndex+" < "+ctlr.tabs.length);
    doc = ctlr.tabs.getTab(tabIndex);
  }
  let win = ctlr.tabs.findWindow(doc);
  if (refresh) win.content.location.reload();
  ctlr.waitForPageLoad(win);
  
  if (tabIndex !== undefined && tabIndex !== null)
    doc = ctlr.tabs.getTab(tabIndex);
  else
    doc = ctlr.tabs.activeTab;

  return doc;
};

gpr.refreshResults = function(ctlr, linkPred, url) {
  if (!!url)
    ctlr.open(url);

  let doc    = gpr.waitPage(ctlr, !url), found = [], track = [], priv = [];
  
  let getLinkPred = function(lp, what, dflt) {
    let always = function(l, w) { return true; };
    if (!lp || !lp[what]) return { pred: always, path: dflt };
    if (typeof lp[what] == "function")
      return { pred: lp[what], path: "" }
    return { pred: always, path: lp[what] };
  };

  let f = getLinkPred(linkPred, "found", "[@onmousedown]");
  let t = getLinkPred(linkPred, "track", "[@gprivacy='false']");
  let p = getLinkPred(linkPred, "priv",  "[@gprivacy='true']");
  
  let xfound = gpr.XPath(doc, "//a"+f.path, gpr.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
  let xtrack = gpr.XPath(doc, "//a"+t.path, gpr.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
  let xpriv  = gpr.XPath(doc, "//a"+p.path, gpr.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
  
  for (let i = 0; i < xfound.snapshotLength; i++)
    if (f.pred(xfound.snapshotItem(i), "found"))
      found.push(xfound.snapshotItem(i));
  for (let i = 0; i < xtrack.snapshotLength; i++)
    if (t.pred(xtrack.snapshotItem(i), "track"))
      track.push(xtrack.snapshotItem(i));
  for (let i = 0; i < xpriv.snapshotLength; i++)
    if (p.pred(xpriv.snapshotItem(i), "priv"))
      priv.push(xpriv.snapshotItem(i));
  return { doc: doc, found: found, track: track, priv: priv }
};

gpr.equalURI = function(l, r) {
  if (!l.host || !r.host)
    return l.replace(/\/$/, "") == r.replace(/\/$/, "");
  else
    return    l.host     == r.host // including port
           && l.pathname == r.pathname
           && l.search   == r.search
       //  && l.protocol == r.protocol  // ignore for now, allow http->https
       //  && l.hash     == r.hash
    ;
}           

gpr.firePythonCallback = function (ctlr, method, obj) {
  assert.equal(typeof ctlr, "object", "Invalid controller object");
  ctlr.fireEvent("firePythonCallback", {"method":method, "arg":obj,
                 "fire_now":true, "filename": "gprtest" });
}

gpr.dump = function(ctlr, obj) {
  gpr.firePythonCallback(ctlr, "dump", obj);
}

gpr.print = function(ctlr, msg) {
  gpr.firePythonCallback(ctlr, "printMsg", msg);
}

gpr.pause = function(ctlr, msg) {
  gpr.firePythonCallback(ctlr, "pause", msg);
}


gpr.log = function(ctlr, msg) {
  gpr.print(ctlr, "GPRIVACY | " + msg);
}

gpr.debug = function(msg) {
  if (DEBUG) Logging.log("mozmill: "+msg);
};
