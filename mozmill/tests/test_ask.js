// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var gpr              = require("../lib/gprtests");
var {CommonTests}    = require("../lib/common");
var {assert, expect} = require("../lib/mozmill/assertions");
var el               = elementslib;

const TEST_URL    = "https://www.ask.com/search?q=Wikipedia";
const PREFS = {
  "gprivacy.active.loggedin": false,
};

var setupModule = function (mod) {
  mod.ctlr    = mozmill.getBrowserController();
  mod.saved   = gpr.setPrefs(PREFS, "extensions");
  mod.common  = new CommonTests("ask.com", 10);
//  mod.common.testDelay = 2000;
//  mod.common.testConfirm = true;
}
setupModule.__force_skip__ = "Not implemented";

// TODO: Options
// TODO: Context Menu
// TODO: Addon compatibility