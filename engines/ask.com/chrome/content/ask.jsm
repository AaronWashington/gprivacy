Components.utils.import("resource://gre/modules/Services.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyAsk" ];

function gprivacyAsk(engines) {
  this.engines = engines;
  this.gpr     = engines.gpr;
  
  this.PATTERN = /https?:\/\/(\w+\.)*?(ask)\.\w+\//
}

gprivacyAsk.prototype = {
  ID:        "ask",
  NAME:      "Ask.com",
  TRACKATTR:  [ "onmousedown" ],
  PREF_OWN:  true,

  loggedIn: function(doc) {
    false;
  }
};
