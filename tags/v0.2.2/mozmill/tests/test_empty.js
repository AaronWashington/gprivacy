// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var gpr              = require("../lib/gprtests");
var {CommonTests}    = require("../lib/common");
var {assert, expect} = require("../lib/mozmill/assertions");
var el               = elementslib;

const TEST_URL    = "https://www.google.com/search?q=%22google+privacy%22";
const PREFS = {
  "gprivacy.active.loggedin": false,
  "requestpolicy.allowedOriginsToDestinations": "gmail.com|google.com googlemail.com|google.com google.com|ggpht.com gmodules.com|googleapis.com google.de|googlepages.com googlepages.com|google.com",
};

var setupModule = function (mod) {
  mod.ctlr    = mozmill.getBrowserController();
  mod.saved   = gpr.setPrefs(PREFS, "extensions");
  mod.common  = new CommonTests("google", 10, "[@onmousedown]");
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
  
  var reqlog = ctlr.window.document.getElementById("requestpolicy-requestLog");
  if (reqlog && reqlog.hidden)
    ctlr.window.requestpolicy.overlay.toggleRequestLog();

  gpr.pause(ctlr, "Press <ENTER> to continue...");

};

