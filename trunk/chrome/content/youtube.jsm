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
    return doc.getElementById("masthead-user-button") != null;
  },
  
  isTracking: function(doc, link) {
    return link.classList.contains("yt-uix-redirect-link");
  },
  
  removeTracking: function(doc, link) {
    this.super.removeTracking(doc, link);
    // stop "click", even if it's NOT handled by the link itself
    // this breaks Ctrl-Click!
    // EventUtils.stopEvent("click", link.parentNode);
    link.setAttribute("data-redirect-href-updated", "true");
  },
  
  removeGlobal: function(doc) {
    return this.super.removeGlobal(doc);
  }
  
};
