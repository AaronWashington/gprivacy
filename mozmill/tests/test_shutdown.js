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
};

var setupModule = function (mod) {
  mod.ctlr    = mozmill.getBrowserController();
  mod.saved   = gpr.setPrefs(PREFS, "extensions");
  mod.common  = new CommonTests("google", 10);
//  mod.common.testDelay = 2000;
//  mod.common.testConfirm = true;

  if (Logging._saved) gpr.setPrefs(Logging._saved);
  
  assert.equal(Logging._mozmill.length-1, 0, "No errors or warnings - see logfile");
}
// setupModule.__force_skip__ = "Not implemented";

// TODO: Options
// TODO: Context Menu
// TODO: Addon compatibility