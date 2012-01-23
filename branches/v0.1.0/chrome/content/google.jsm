Components.utils.import("resource://gre/modules/Services.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyGoogle" ];

function gprivacyGoogle(gprivacy) {
  this.gpr   = gprivacy
  
  this.PATTERN = Services.prefs.getCharPref("extensions.gprivacy.engines.google.match");
}

gprivacyGoogle.prototype = {
  ID:        "google",
  NAME:      "Google",
  PATTERN:    Services.prefs.getCharPref("extensions.gprivacy.engines.google.match"),
  TRACKATTR:  [ "onmousedown" ],
  
  loggedIn: function(doc) {
    return doc.getElementById("gbi4s1") == null;
  }
};
