// $Id$

"use strict";

var gpr = require("../lib/gprtests");

var setupModule = function (mod) {
  mod.ctlr    = mozmill.getBrowserController();

  gpr.refreshResults(mod.ctlr, null, "https://www.google.com/search?q=Wikipedia");

  mod.ctlr.window.alert("Gentlemen, start your debuggers!");
  debugger;
}
