// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var gpr              = require("../lib/gprtests");
var {CommonTests}    = require("../lib/common");
var {assert, expect} = require("../lib/mozmill/assertions");
var el               = elementslib;

const TEST_URL    = "https://www.google.com/search?q=Wikipedia";
const PREFS = {
  "gprivacy.active.loggedin": false,
};

var setupModule = function (mod) {
  mod.ctlr    = mozmill.getBrowserController();
  mod.saved   = gpr.setPrefs(PREFS, "extensions");
  mod.common  = new CommonTests("google", 10);
// mod.common.testDelay = 5000;
// mod.common.testConfirm = true;
}

var teardownModule = function(mod) {
  gpr.setPrefs(saved);
  mod.common.progress("Finished!");
}

var testLoad = function () {
  assert.equal(Services.prefs.getBoolPref("extensions.gprivacy.active.loggedin"), false, "Active when logged in");

  let {track} = common.refreshResults(TEST_URL);
  common.expect.minLinks(track);
  common.progress("testLoad");
};

var testLogon = function() {
  let doc = ctlr.tabs.activeTab;
  let data = gpr.testData("google");
  if (!data.user || !data.password) {
    gpr.frame.events.skip("No user data found. Cannot login.");
    return;
  }
  let elt = new el.ID(doc, "gb_70")
  ctlr.waitForElement(elt);
  ctlr.click(elt)
  doc = gpr.waitPage(ctlr);
  ctlr.type(new el.ID(doc, "Email"),  data.user);
  ctlr.type(new el.ID(doc, "Passwd"), data.password);
  ctlr.click(new el.ID(doc, "signIn"));
  ctlr.sleep(500);
  gpr.waitPage(ctlr);
  let {doc} = common.refreshResults(TEST_URL); // ...then reload
  ctlr.tabs.findWindow(doc).content.location.reload();
  ctlr.sleep(500);
  doc = gpr.waitPage(ctlr);
  assert.notEqual(doc.getElementById("gbi4") || doc.getElementById("gbi4i"), null, "Logged in.");
  common.progress("testLogon");
};
//testLogon.__force_skip__ = "unreliable";

var testWhenLoggedOn = function() {
  let { doc, found, track, priv } = common.refreshResults(TEST_URL);
  if ((doc.getElementById("gbi4") || doc.getElementById("gbi4i")) == null) {
    gpr.frame.events.skip("Not logged in.");
    return;
  }
  common.expect.minLinks(found);
  expect.equal(track.length, found.length, "Only Tracked links");
  expect.equal(priv.length,  0,            "No private links");
  
  for (let i in track) {
    expect.equal(track[i].getAttribute("gpr-icon"), "css", "Icon");
    expect.notEqual(track[i].style.backgroundImage.indexOf("modified16"), -1, "Warning Icon");
  }
  common.progress("testWhenLoggedOn");
};
//testWhenLoggedOn.__force_skip__ = "unreliable";

var testLogoff = function() {
  let doc = ctlr.tabs.activeTab;
  let log = doc.getElementById("gbi4") || doc.getElementById("gbi4i");
  if (log != null) {
    common.progress("logging off");
/*
    log = doc.getElementById("gbg4") || doc.getElementById("gbg6");
    if (log) ctlr.click(new el.Elem(log));  // make sign out visible
    ctlr.waitThenClick(new el.ID(doc, "gb_71")); // but try, anyway
    doc = gpr.waitPage(ctlr);
*/    
    let off = doc.getElementById("gb_71")
    assert.notEqual(off, null, "Logoff link found");
    let { doc: odoc } = common.refreshResults(off.href);
    ctlr.sleep(500);
    let { doc: ndoc } = common.refreshResults(TEST_URL);
    doc = ndoc;
    assert.equal(doc.getElementById("gbi4"), null, "Logged out.")
  }
  ctlr.waitForElement(new el.ID(doc, "gb_70"));
  ctlr.sleep(500);
  common.progress("testLogoff");
};

var testDefaultSettings = function() { common.testDefaultSettings(); };

var testAllowOwnLinks   = function() { common.testAllowOwnLinks(); };
var testDisableEngine   = function() { common.testDisableEngine(); }
var testReplaceLinks    = function() { common.testReplaceLinks(); }
var testRemoveOriginals = function() { common.testRemoveOriginals(); }
var testRemoveText      = function() { common.testRemoveText(); }
var testDefaultsAgain   = function() { common.testDefaultSettings(); };

function isSameLocation(l, r) { return l.host == r.host; } // relax restrictions

var testPrivateClick     = function() { common.testPrivateClick(".google.", isSameLocation); };
var testTrackedClick     = function() { common.testTrackedClick(".google.", isSameLocation); };
var testLinkModification = function() { common.testLinkModification(".google.", false); };
var testInnerLinkElements= function() { common.testInnerLinkElements(".google.", isSameLocation, true); };

var testInnerLinkCtrlClick = function() {}
testInnerLinkCtrlClick.__force_skip__ = "Find out how to implement";

var testWarningPopup = function() {
  common.progress("testWarningPopup");
  // TODO: 
};
testWarningPopup.__force_skip__ = "May be obsolete";

