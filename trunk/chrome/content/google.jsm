Components.utils.import("resource://gre/modules/Services.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyGoogle" ];

function gprivacyGoogle(engines) {
  this.engines = engines;
  this.gpr     = engines.gpr;
  
  this.PATTERN = /https?:\/\/(\w+\.)*?(google)\.\w+\//
}

gprivacyGoogle.prototype = {
  ID:        "google",
  NAME:      "Google",
  TRACKATTR:  [ "onmousedown" ],
  
  loggedIn: function(doc) {
    return doc.getElementById("gbi4s1") == null;
  }
};
