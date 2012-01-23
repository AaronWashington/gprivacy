Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyYouTube" ];

function gprivacyYouTube(gprivacy) {
  this.gpr   = gprivacy
  
  this.PATTERN = Services.prefs.getCharPref("extensions.gprivacy.engines.youtube.match");
}

gprivacyYouTube.prototype = {
  ID:        "youtube",
  NAME:      "YouTube",
  PATTERN:    Services.prefs.getCharPref("extensions.gprivacy.engines.youtube.match"),
  TRACKATTR:  [  ],
  
  loggedIn: function(doc) {
    return doc.getElementById("gbi4s1") == null;
  },
  
  isTracking: function(doc, link) {
    for (var i = 0; i < link.classList.length; i++)
      if (link.classList[i] == "yt-uix-redirect-link")
        return true;
  },
  
};
