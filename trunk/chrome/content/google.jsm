// $Id$

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyGoogle" ];

function gprivacyGoogle(engines) {
  this.engines = engines;
  this.gpr     = engines.gpr;
  this.strings = this.gpr.strings;
  this.PATTERN = /https?:\/\/((?!(maps|code|(plusone)))\w+\.)*?(google)\.\w+\//
  this.nowarn  = this.engines.getEnginePref(this, "nowarn", "bool", false);
}

gprivacyGoogle.prototype = {
  ID:        "google",
  NAME:      "Google",
  TRACKATTR:  [ "onmousedown", "data-ctorig" ],
  
  loggedIn: function(doc) {
    return doc.getElementById("gbi4s1") == null;
  },
  
  isTracking: function(doc, link) {
    return this.super.isTracking(doc, link) ||
           (doc.location.hostname &&
            doc.location.hostname.match(/^news\./) &&
            link.hasAttribute("url"))
  },
  
  removeTracking: function(doc, link, replaced) {
  
    if (doc.location.hostname.match(/^news\./)) {
      link.classList.add("_tracked"); // as simple as that?
      return;
    }
    this.super.removeTracking(doc, link);

    // In search results, clicks on embedded elements (span, em, ...) are
    // routed to the main window, which tracks. I don't know how to prevent
    // this other than by removing them :-(
    if (replaced) {
      let html  = link.innerHTML; // getting it should be legal, dear reviewer?
      if (link.textContent != html) {
        let plain = link.textContent;
        DOMUtils.removeAllChildren(link);
        link.appendChild(doc.createTextNode(plain));
        this.engines.debug("google: replaced '"+html+"' with '"+plain+"'");
      }
      if (!this.nowarn)
        this.showWarning();
      this.nowarn = true; // only once per page
    }
    
  },
  
  removeGlobal: function(doc) {
    if (doc.getElementById("gsr") != null && // google search home
        doc.getElementById("cnt") == null)   // search result contents
      // no search result on page. probably google home page so ignore and...
      return 1; // ...make ChangeMonitor happy
    return 0;
  },
  
  showWarning: function() {
    let self = this;
    this.gpr.showPopup("gprmon-popup",
        this.strings.getString("googleWarning"), null, // "gprmon-notification-icon",
        { label: this.strings.getString("googleWarningKeep"), accessKey: "O",
          callback: function(state) { self.gpr.closePopup(); }
        },  
        [ { label: this.strings.getString("googleWarningRemove"), accessKey: "C",
            callback: function(state) {
              Services.prefs.setBoolPref("extensions.gprivacy.engines.google.nowarn", true);
              self.gpr.closePopup();
             } }
        ],
        { persistence: 256,    timeout: Date.now() + 600000,
          persistWhileVisible: true } );
    
  }
};
