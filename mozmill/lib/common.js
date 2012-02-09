// $Id$

"use strict";

Components.utils.import("chrome://gprivacy/content/gputils.jsm");
var frame = {}; Components.utils.import('resource://mozmill/modules/frame.js', frame);

var gpr = require("gprtests");

var common = exports;

var {assert, expect} = require("mozmill/assertions");
var tabs             = require("mozmill/tabs");

const el = elementslib;

common.CommonExpect = function(CommonTests) {
  this.tests = CommonTests;
};

common.CommonExpect.prototype = {
  minLinks: function(coll) {
    let found = coll.snapshotLength ? coll.snapshotLength : coll.length;
    expect.equal(found >= this.tests.minLinks, true, "Min. links found: "+found+" >= "+this.tests.minLinks);
  }
};


function CommonTests(eng, minLinks, linkPred, iconTest) {
  this.ctlr       = mozmill.getBrowserController();
  this.eng        = eng;          // engine ID
  this.minLinks   = minLinks;   // min. no. of links found for tests to work
  this.linkPred   = linkPred;     // predicate that is true for P(link) or XPath sub-path (after //a) 
  this.iconTest   = iconTest || function(link) { return ["css","dom"].indexOf(link.getAttribute("gpr-icon")) != -1; };
  this.expect     = new common.CommonExpect(this);
  this.testDelay  = 0;
  this.testCofirm = false;
}

CommonTests.prototype = {
  pageDelay: 0,
  
  progress: function(what) {
    this.ctlr.tabs.activeTab.title = what;
    if (this.testConfirm)
      assert.ok(this.ctlr.window.confirm("Test '"+what+"' is OK?"), "Confirmed");
    else if (this.testDelay)
      this.ctlr.sleep(this.testDelay);
    frame.events.pass({'function': what});
  },
  
  refreshResults: function(url) {
    let ret = gpr.refreshResults(this.ctlr, this.linkPred, url);
    if (this.pageDelay) this.ctlr.sleep(this.pageDelay);
    return ret;
  },

  get defaultPrefs() {
    // Test defaults for these settings when logged off (thus active)
    let prefs = { "extensions.gprivacy.active":  true,
                  "extensions.gprivacy.auto":    true,
                  "extensions.gprivacy.replace": false,
                  "extensions.gprivacy.orig":    true,
                  "extensions.gprivacy.mark":    true,
                  "extensions.gprivacy.text":    true, 
                };
    prefs["extensions.gprivacy.engines."+this.eng+".enabled"] = true;  // These two we have to make fixed
    prefs["extensions.gprivacy.engines."+this.eng+".own"]     = false; // to test both variants
    return prefs;
  },
  
  findFirstUsableLink: function(doc, domain, gprivacy, moreXPath) {
    // avoid parametrized links as, they tend to redirect, too
    let xpth = "//a[@gprivacy='"+gprivacy+"']" +
      "[contains(@href,'http:') or contains(@href,'https:')]" +
      "[not(contains(@href,'"+domain+"')) and not(contains(@href,'?'))]" +
      (moreXPath || "");
    let iter = gpr.XPath(doc, xpth, gpr.XPathResult.ORDERED_NODE_ITERATOR_TYPE);
    let node = iter.iterateNext();
    assert.ok(node, "Usable link in result");
    let more = iter.iterateNext(); // well, let's take the second....
    return more || node;
  },
  
  likelyClickOffset: function(elt) {
    // Problem: the offset is relative to the bounding rect of an element.
    // The default takes x, y = w/2, h/2 - which is unlikely to hit, if there's
    // a line break in the link...
    let first = elt.getClientRects()[0];
    let bound = elt.getBoundingClientRect();
    return { dX: first.left - bound.left + first.width / 2,
             dY: first.top  - bound.top  + first.height / 2 };
  },
  
  testDefaultSettings: function() {
    let { ctlr, eng, iconTest } = this;

    const strings = ctlr.window.document.getElementById("gprivacy-strings");

    assert.ok(strings.getString("privateLink"), "gprivacy Strings");
  
    let tsaved = gpr.setPrefs(this.defaultPrefs)
  
    try { // plain default settings:
      let { found, track, priv } = this.refreshResults();
      
      this.expect.minLinks(found);

      expect.equal(track.length, found.length, "Links recognized as tracking");
      expect.equal(priv.length,  found.length, "Private Links");

      for (let i in priv) {
        expect.notEqual(["css","dom"].indexOf(priv[i].getAttribute("gpr-icon")), -1, "Icon");
        expect.equal(priv[i].textContent, strings.getString("privateLink"), "Private Link");
      }
    } finally {
      gpr.setPrefs(tsaved);
    }
    this.progress("testDefaultSettings");
  },    
  
  testAllowOwnLinks: function() {
    let { ctlr, eng, iconTest } = this;
    let prefs = this.defaultPrefs;
    prefs["extensions.gprivacy.engines."+eng+".own"] = true;
    let tsaved = gpr.setPrefs(prefs)

    try { // allow links to same website:
  
      let { doc, found, track, priv } = this.refreshResults();

      this.expect.minLinks(found);

      let goog = 0;
      for (let i in found) {
        if (found[i].host == doc.location.host) {
          expect.equal(found[i].hasAttribute("gprivacy"), false, "'gprivacy' attribute set");
          goog++;
        }
      }
      expect.equal(track.length, found.length-goog, "Links recognized as tracking");
      expect.equal(priv.length,  track.length,      "Private Links");
    } finally {
      gpr.setPrefs(tsaved);
    }
    this.progress("testAllowOwnLinks");
  },
    
  testDisableEngine: function() {
    let { ctlr, eng, iconTest } = this;
    let prefs = this.defaultPrefs;
    prefs["extensions.gprivacy.engines."+eng+".enabled"] = false;
    let tsaved = gpr.setPrefs(prefs);

    try { // disable engine:

      let { found, track, priv } = this.refreshResults();
      
      this.expect.minLinks(found);

      expect.equal(track.length, /*niente*/ 0, "Links recognized as tracking");
      expect.equal(priv.length,  /*zilch*/  0, "Private Links");
      this.progress("testDisableEngine");
    } finally {
      gpr.setPrefs(tsaved);
    }
  },
    
  testReplaceLinks: function() {
    let { ctlr, eng, iconTest } = this;
    let prefs = this.defaultPrefs;
    prefs["extensions.gprivacy.replace"] = true;
    let tsaved = gpr.setPrefs(prefs);

    try { // replace links:
      
      let { found, track, priv } = this.refreshResults();
      
      this.expect.minLinks(track);
      
      expect.equal(track.length, found.length, "Links recognized as tracking");
      expect.equal(priv.length,  found.length, "Private Links");

      const strings = ctlr.window.document.getElementById("gprivacy-strings");

      for (let i in track) { // check original
        expect.notEqual(["css","dom"].indexOf(track[i].getAttribute("gpr-icon")), -1, "Icon");
        expect.equal(track[i].textContent, strings.getString("origLink"), "Tracking Link");
      }
    } finally {
      gpr.setPrefs(tsaved);
    }
    this.progress("testReplaceLinks");
  },

  testRemoveOriginals: function() {
    let { ctlr, eng, iconTest } = this;
    let prefs = this.defaultPrefs;
    prefs["extensions.gprivacy.replace"] = true;
    prefs["extensions.gprivacy.orig"]    = false;
    let tsaved = gpr.setPrefs(prefs);

    try { // remove originals:
      
      let { found, track, priv } = this.refreshResults();
      
      this.expect.minLinks(priv);

      expect.equal(found.length , /*nada*/ 0,   "tracking search results found == ZERO");
      expect.equal(track.length , /*nada*/ 0,   "tracking search results found == ZERO");
      
      for (let i in priv) {
        expect.notEqual(["css","dom"].indexOf(priv[i].getAttribute("gpr-icon")), -1, "Icon");
      }
    } finally {
      gpr.setPrefs(tsaved);
    }
    this.progress("testRemoveOriginals");
  },
    
  testRemoveText: function() {
    let { ctlr, eng, minLinks, iconTest } = this;
    let prefs = this.defaultPrefs;
    prefs["extensions.gprivacy.text"] = false;
    let tsaved = gpr.setPrefs(prefs);

    try { // remove descriptive text:
      
      let { priv } = this.refreshResults();
      
      this.expect.minLinks(priv);

      let links = priv;
      
      // Now reverse...
      gpr.setPrefs({ "extensions.gprivacy.replace": true});

      let { track } = this.refreshResults();
      
      links = links.concat(track);
      
      expect.equal(links.length >= 2 * minLinks, true, "search results found >= "+minLinks);
      
      for (let i in links) {
        expect.equal(iconTest(links[i]),          true, "Icon");
        expect.equal(links[i].textContent.trim(), "",   "Annotated link");
      }
    } finally {
      gpr.setPrefs(tsaved);
    }
    this.progress("testRemoveText");
  },
  
  // TODO: active auto mark

  _testLinkClick: function(domain, expectSame, isSameFunc, link, info) {
    let { ctlr, eng, iconTest } = this;

    // assume page is refreshed with correct settings! so don't: this.refreshResults();
    let doc    = ctlr.tabs.activeTab;
    link       = link || this.findFirstUsableLink(doc, domain, expectSame);
    let expct  = link.href ? link.cloneNode(false) : link.parentNode.cloneNode(false);
    let curr   = doc.location.href;
    let {dX,dY}= this.likelyClickOffset(link);

    link = new el.Elem(link)

    // requires RequestPolicy to block clicks
    // doesn't accept modifiers: ctlr.waitThenClick(link);
    ctlr.waitForElement(link);
    ctlr.mouseEvent(link, dX, dY, info || {});
    frame.events.pass({'function':"common.click('"+expct.href+"',"+JSON.stringify(info||{})+")"});

    let newTab = (!!expct.target && expct.target != "_self" && expct.target != "_top")
              || (info && (info.accelKey || info.ctrlKey || info.metaKey || (info.button && info.button == 2)));
    if (newTab) ctlr.sleep(500);

    doc = gpr.waitPage(this.ctlr, false, newTab ? 1 : undefined);

    let nhref = doc.location.href;
    
    let same  = isSameFunc ? isSameFunc(expct, doc.location) : gpr.equalURI(expct, doc.location);

    if (newTab) {
      assert.equal(ctlr.tabs.length, 2, "Number of tabs");
      ctlr.tabs.selectTabIndex(1);
      ctlr.window.gBrowser.removeCurrentTab();
    } else {
      this.ctlr.goBack(); this.ctlr.waitForPageLoad();
    }
    if (expectSame != same) { // make messages nicer
      assert.notEqual(curr, nhref, "Document not loaded");
      if (expectSame) assert.equal(   expct.href, nhref, "Link not tracked");
      else            assert.notEqual(expct.href, nhref, "Link tracked");
    }
    this.refreshResults(); // links may have been modified by click events
  },
  
  testPrivateClick: function(domain, isSameFunc, optLink, noAccel) {
    this._testLinkClick(domain, true, isSameFunc, optLink);
    if (!noAccel)
      this._testLinkClick(domain, true, isSameFunc, optLink, { button: 0, accelKey: true });
    this.progress("testPrivateClick("+(optLink ? " '"+optLink.textContent+"'" : "")+")");
  },
  
  testTrackedClick: function(domain, isSameFunc, optLink, noAccel) {
    this._testLinkClick(domain, false, isSameFunc, optLink);
    if (!noAccel)
      this._testLinkClick(domain, false, isSameFunc, optLink, { button: 0, accelKey: true });
    this.progress("testTrackedClick("+(optLink ? " '"+optLink.textContent+"'" : "")+")");
  },
  
  testLinkModification: function(domain, expectSame) {
    let { ctlr, eng, iconTest } = this;

    // assume page is refreshed with correct settings! so don't: this.refreshResults();
    let doc = ctlr.tabs.activeTab;
    let tracked = this.findFirstUsableLink(doc, domain, false);
    let href    = tracked.href;
    let curr    = doc.location.href;
    let trackel = new el.Elem(tracked);
    let match   = new RegExp(domain.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"));
    let {dX,dY} = this.likelyClickOffset(tracked);
    
    ctlr.mouseDown(trackel, 0, dX, dY);
    ctlr.sleep(125);
    ctlr.keypress(trackel, 'VK_ESCAPE', {});
    ctlr.sleep(125);

    doc = ctlr.tabs.activeTab;
    expect.equal(curr, doc.location.href, "Document still the same");

    if (!expectSame) {
      expect.notEqual(href, tracked.href, "Tracking link changed");
      expect.match(tracked.host, match,   "Tracked by Website");
    } else {
      expect.equal(href, tracked.href,    "Tracking link unchanged");
    }
    this.progress("testTrackModification");
    if (curr != doc.location.href) {
      ctlr.goBack(); gpr.waitPage(ctlr);
    }
  },
  
  testInnerLinkElements: function(domain, isSameFunc, noAccel) {
    let prefs = this.defaultPrefs;
    prefs["extensions.gprivacy.replace"] = true;
    prefs["extensions.gprivacy.orig"]    = false;
    let tsaved = gpr.setPrefs(prefs);
    let ftags  = ["em", "span", "b", "strong"];
    let xpath  = "[" + ftags.join(" or ") + "]";
    try {
      let { doc, found, track, priv } = this.refreshResults();
      this.expect.minLinks(priv);
      assert.equal(track.length, 0, "No tracked links");
      let link = this.findFirstUsableLink(doc, domain, true, xpath);
      let clks = 0;
      for (let f in ftags) {
        let elts = link.getElementsByTagName(ftags[f]);
        if (elts && elts.length > 0) {
          for (let e = 0; e < elts.length; e++) {
            elts[e].focus(); // doesn't help... accelKey doesn't work in mozmill
            this.testPrivateClick(null, isSameFunc, elts[e], noAccel);
            clks++;
          }
        }
      }
      assert.equal(clks > 0, true, "Formatted links > 0");
    } finally {
      gpr.setPrefs(tsaved);
    }
    this.progress("testInnerLinkElements");

  }

};


common.CommonTests = CommonTests;
