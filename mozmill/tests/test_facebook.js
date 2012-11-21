// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var gpr              = require("../lib/gprtests");
var {CommonTests}    = require("../lib/common");
var {assert, expect} = require("../lib/mozmill/assertions");
var el               = elementslib;

const TEST_URL  = "https://www.facebook.com/?sk=nf";
const LINK_PATH = "[@onmousedown and not(contains(@class,'UIImageBlock_Image')) and not(contains(@class,'uiImageBlockImage'))]"
const PREFS     = {
  "gprivacy.active.loggedin": true,
  "requestpolicy.allowedOriginsToDestinations": "facebook.com|fbcdn.net fbcdn.net|facebook.com facebook.com|akamaihd.net facebook.com|recaptcha.net facebook.com|facebook.net",
};

var setupModule = function (mod) {
  mod.ctlr    = mozmill.getBrowserController();
  mod.saved   = gpr.setPrefs(PREFS, "extensions");
  mod.common  = new CommonTests("facebook", 2, linkPred(), null, true);
  mod.loggedin= true;
//  mod.common.testDelay = 2000;
//  mod.common.testConfirm = true;
}

var teardownModule = function(mod) {
  gpr.setPrefs(saved);
  mod.common.progress("Finished!");
}

var setupTest = function(test) {
  assert.ok(loggedin, "Logged in");
}

var testLoad = function () {
  assert.equal(Services.prefs.getBoolPref("extensions.gprivacy.active.loggedin"), true, "Active when logged in");

  let {doc, track} = common.refreshResults(TEST_URL);
  loggedin = !(new el.ID(doc, "email").exists());
  assert.ok(loggedin, "Logged in. For the facebook tests you need to be logged in. "+
                      "For now, use the --template option of gprmill to copy cookies from a profile.");

  common.expect.minLinks(track);
  common.progress("testLoad");
}

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

var testPrivateClick = function() {
  // avoid the blue bar obstructing the the link when scrollIntoView is used
  let     { blueBar, disp } = dispBlueBar("none");
  try     { common.testPrivateClick(".facebook.", isSameLocation, null); }
  finally { blueBar.style.display = disp; }
};

var testTrackedClick = function() {
  let     { blueBar, disp } = dispBlueBar("none");
  try     { common.testTrackedClick(".facebook.", isSameLocation, null); }
  finally { blueBar.style.display = disp; }
};



// Helpers

function linkPred() {
  // Ignore images for now and treat them in a separate test
  let gprLinkPred = function(link, what) {
    let gprivacy = (what=="priv").toString();
    if (!link.getAttribute("gprivacy") ||
        link.getAttribute("gprivacy") != gprivacy ||
        link.classList.contains("UIImageBlock_Image") ||
        link.classList.contains("uiImageBlockImage") )
      return false;
    return true;
  };
  
  return { found: LINK_PATH, track: gprLinkPred, priv:  gprLinkPred, };
}  

function dispBlueBar(how) { // see testPrivateLink
  let blueBar = new el.ID(ctlr.tabs.activeTab, "blueBar")
  ctlr.waitForElement(blueBar);
  let disp = blueBar.getNode().style.display;
  blueBar.getNode().style.display = how;
  ctlr.sleep(100);
  return { blueBar: blueBar.getNode(), disp: disp };
}

