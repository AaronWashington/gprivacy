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
  
  mod.ctlr.window.toOpenWindowByType("global:console", "chrome://global/content/console.xul");

  Logging._mozmill = [];
//  Logging._saved   = gpr.setPrefs({"extensions.gprivacy.changemon": 1052 });

//  mod.common.testDelay = 2000;
//  mod.common.testConfirm = true;
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
  catch (exc) { Logging.logException(exc, "There should be exactly this one entry"); }

}

// TODO: Options
// TODO: Context Menu
// TODO: Addon compatibility