// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var gpr              = require("../lib/gprtests");
var {CommonTests}    = require("../lib/common");
var {assert, expect} = require("../lib/mozmill/assertions");
var el               = elementslib;

const TEST_URL    = "http://www.bing.com/search?q=Wikipedia";
const PREFS = {
  "gprivacy.active.loggedin": false,
};

var setupModule = function (mod) {
  mod.ctlr    = mozmill.getBrowserController();
  mod.saved   = gpr.setPrefs(PREFS, "extensions");
  mod.common  = new CommonTests("bing", 10);
//  mod.common.testDelay = 2000;
//  mod.common.testConfirm = true;
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

function isSameLocation(l, r)    { return l.host == r.host; } // relax restrictions
// Bing doesn't redirect it bings - pings. We need a way to check network traffic ;-)
function isNotSameLocation(l, r) { return !isSameLocation(l,r); }

// HACK ALERT: Mozilla doesn't support fn_matches in XPath, but RequestPolicy allows all those...
var mickey = ".bing.')) and not(contains(@href,'.microsoft.')) " +
                       "and not(contains(@href,'.live.')) "+
                       "and not(contains(@href,'.ciao.')) "+
                       "and not(contains(@href,'.msn.";

var testPrivateClick     = function() { common.testPrivateClick(mickey, isSameLocation); };
// TODO: Test network traffic
var testTrackedClick     = function() { common.testTrackedClick(mickey, isNotSameLocation); };
var testClickNetwork     = function() { assert.fail("Not implemented"); };
testClickNetwork.__force_skip__ = "Not implemented";
var testLinkModification = function() { common.testLinkModification(mickey, true); };
var testInnerLinkElements= function() { common.testInnerLinkElements(mickey, isSameLocation, true); };

var testInnerLinkCtrlClick = function() {}
testInnerLinkCtrlClick.__force_skip__ = "Find out how to implement";
