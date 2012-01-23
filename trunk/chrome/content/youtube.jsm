Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyYouTube" ];

function gprivacyYouTube(engines) {
  this.engines = engines;
  this.gpr     = engines.gpr;
  
  this.PATTERN = /https?:\/\/(\w+\.)*?(youtube)\.\w+\//
}

gprivacyYouTube.prototype = {
  ID:        "youtube",
  NAME:      "YouTube",
  TRACKATTR:  [  ],
  
  loggedIn: function(doc) {
    return doc.getElementById("gbi4s1") == null;
  },
  
  isTracking: function(doc, link) {
    return link.classList.contains("yt-uix-redirect-link");
  },
  
};
