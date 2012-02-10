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
  
  mod.ctlr.window.toOpenWindowByType("global:console", "chrome://global/content/console.xul");
  mod.ctlr.sleep(750);
  
  let cons = mozmill.wm.getMostRecentWindow('global:console');  
  let consCtrl = new mozmill.controller.MozMillController(cons);  
  consCtrl.window.changeSortOrder("reverse")

  ctlr.window.focus();
  
  Logging._mozmill = [];
//  Logging._saved   = gpr.setPrefs({"extensions.gprivacy.changemon": 1052 });

//  mod.common.testDelay = 2000;
//  mod.common.testConfirm = true;
}

var teardownModule = function(mod) {
  gpr.setPrefs(saved);
}

var testHookLogging = function() {
  let hookLogFunc = function(which) {
    let logFunc = Logging[which];
    assert.equal(typeof logFunc, "function", "Valid log function");
    return function() {
      Logging._mozmill.push({ func: which, args: arguments });
      return logFunc.apply(Logging, Array.prototype.slice.call(arguments))
    };
  }

  let hooks = [ "_logException", "warn", "error" ];
  for (let h in hooks) Logging[hooks[h]] = hookLogFunc(hooks[h]);

  try         { undefined(); }
  catch (exc) { Logging.logException(exc, "mozmill-tests: There should be exactly this one entry"); }

}

// TODO: Options
// TODO: Context Menu
// TODO: Addon compatibility