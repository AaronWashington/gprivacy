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

var testLogoff = function() {
  let doc = ctlr.tabs.activeTab;
  let log = doc.getElementById("gbg6");
  if (log != null) {
    ctlr.click(new el.Elem(log));
    ctlr.waitThenClick(new el.ID(doc, "gb_71"));
    doc = gpr.waitPage(ctlr);
    assert.match(doc.location.host, /accounts\.google\./, "Google logout page redirect");
    ctlr.goBack();
    ctlr.refresh();
    doc = gpr.waitPage(ctlr);
    assert.equal(doc.getElementById("gbg6"), null, "Logged out.")
  }
  ctlr.waitForElement(new el.ID(doc, "gbi4s1"));
  common.progress("testLogoff");
};

var testDefaultSettings = function() { common.testDefaultSettings(); };

var testAllowOwnLinks   = function() { common.testAllowOwnLinks(); };
var testDisableEngine   = function() { common.testDisableEngine(); }
var testReplaceLinks    = function() { common.testReplaceLinks(); }
var testRemoveOriginals = function() { common.testRemoveOriginals(); }
var testRemoveText      = function() { common.testRemoveText(); }
var testDefaultsAgain   = function() { common.testDefaultSettings(); };

var testLogon = function() {
  common.progress("testLogon");
  // TODO: 
};
testLogon.__force_skip__ = "Not implemented";

var testWhenLoggedOn = function() {
  common.progress("testWhenLoggedOn");
  // TODO: active.loggedin
};
testWhenLoggedOn.__force_skip__ = "Not implemented";

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

