// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var gpr              = require("../lib/gprtests");
var {CommonTests}    = require("../lib/common");
var {assert, expect} = require("../lib/mozmill/assertions");
var el               = elementslib;

const TEST_URL    = "http://www.ask.com/web?q=Wikipedia";
const PREFS = {
  "gprivacy.active.loggedin": false,
};

var setupModule = function (mod) {
  mod.ctlr    = mozmill.getBrowserController();
  mod.saved   = gpr.setPrefs(PREFS, "extensions");
  mod.common  = new CommonTests("ask", 10);
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
};
testLogoff.__force_skip__ = "Not implemented";

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

var testPrivateClick     = function() { common.testPrivateClick(".ask.", isSameLocation); };
var testTrackedClick     = function() { common.testTrackedClick(".ask.", isSameLocation); };
var testLinkModification = function() { common.testLinkModification(".ask.", false); };
var testInnerLinkElements= function() { common.testInnerLinkElements(".ask.", isSameLocation, true); };

var testInnerLinkCtrlClick = function() {}
testInnerLinkCtrlClick.__force_skip__ = "Find out how to implement";

// TODO: Addon compatibility