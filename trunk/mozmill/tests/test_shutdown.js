// $Id$

"use strict";

Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var gpr              = require("../lib/gprtests");
var {assert, expect} = require("../lib/mozmill/assertions");

const PREFS = {
//  "gprivacy.active.loggedin": false,
};

var setupModule = function (mod) {
  mod.ctlr    = mozmill.getBrowserController();
  mod.saved   = gpr.setPrefs(PREFS, "extensions");
//  mod.common.testDelay = 2000;
//  mod.common.testConfirm = true;

  if (Logging._saved) gpr.setPrefs(Logging._saved);
  
  assert.equal(Logging._mozmill.length-1, 0, "No errors or warnings - see logfile");
}
