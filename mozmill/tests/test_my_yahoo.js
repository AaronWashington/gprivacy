// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var gpr              = require("../lib/gprtests");
var yahoo            = require("test_yahoo_search");
var {CommonTests}    = require("../lib/common");
var {assert, expect} = require("../lib/mozmill/assertions");
var el               = elementslib;
var global           = null;

const TEST_URL    = "http://my.yahoo.com/";
const PREFS = {
  "gprivacy.active.loggedin": false,
};

var setupModule = function (mod) {
  mod.ctlr    = mozmill.getBrowserController();
  mod.saved   = gpr.setPrefs(PREFS, "extensions");
  mod.common  = new CommonTests("yahoo", 2, linkPred());
  global      = mod;
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

var testLogoff          = function() { yahoo. logoffTest(ctlr, common, gpr); }
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

function isSameLocation(l, r) { return l.host == r.host; }  // relax restrictions

var testPrivateClick     = function() { common.testPrivateClick(".yahoo.", isSameLocation); };
var testTrackedClick     = function() { common.testTrackedClick(".yahoo.", isSameLocation); };
var testLinkModification = function() { common.testLinkModification(".yahoo.", false); };
var testInnerLinkElements= function() { common.testInnerLinkElements(".yahoo.", isSameLocation, true); };

var testInnerLinkCtrlClick = function() {}
testInnerLinkCtrlClick.__force_skip__ = "Find out how to implement";

// Helpers

function linkPred() {
  // Ignore images for now and treat them in a separate test
  let yhLinkPred = function(link, what) {
    if (what != "found") return true; // not ours...
    if (!link.hasAttribute("dirtyhref") &&
        !link.hasAttribute("data-bk")   &&
        !link.getAttribute("data-bns") )
      return false;
    return true;
  };
  
  return { found: yhLinkPred, track: null, priv: null, };
}  
