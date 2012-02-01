// $Id$

"use strict";

Components.utils.import("chrome://gprivacy/content/gpengines.jsm");
Components.utils.import("chrome://gprask/content/engine.jsm");

var gprask = {
  // Just load our engine and add it to gprivacy
  onLoad: function() {
    // @change this to match your EXPORTED_SYMBOLS in engine.jsm
    gprivacy.engines.add(new gprivacyAsk(Engines));
  }
}

window.addEventListener("load", function () { gprask.onLoad(); }, false);

