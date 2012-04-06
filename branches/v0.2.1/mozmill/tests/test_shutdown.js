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
  
  
  assert.equal(Logging._mozmill.length, Logging._mozmillExpected.length,
               "Unexpected errors or warnings - see logfile");
  // TODO: thorough examination...
  for (let l in Logging._mozmill) {
    let log = Logging._mozmill[l].args[0].toString();
    assert.ok(log.indexOf(Logging._mozmillExpected[l]) != -1,
              "Expcected log entry '"+Logging._mozmillExpected[l]+"' matched '"+log+"'");
  }
}
