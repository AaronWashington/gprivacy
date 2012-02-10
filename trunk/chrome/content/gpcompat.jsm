// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "AddonCompat" ];


//***************************************************************************
function FirebugCompat(compatMgr, addon) {
  this.init(compatMgr, addon)
}

FirebugCompat.prototype = {
  INTERNAL_NAME: "firebugAddon",
  
  init: function(compatMgr, addon) {
    this.compat    = compatMgr;
    this.xulwindow = this.compat.xulwindow;
    this.compat.debug("Firebug compatibility established");
  },

  refresh: function(doc) {
  },
  
  showLog: function() {
    if (this.xulwindow.Firebug) this.xulwindow.Firebug.toggleBar(true, "net");
    else Logging.warn("compat: Firebug not found");
  }
};


//***************************************************************************
function RequestPolicyCompat(compatMgr, addon) {
  this.init(compatMgr, addon)
}

RequestPolicyCompat.prototype = {
  INTERNAL_NAME: "requestPolicyAddon",
  
  init: function(compatMgr, addon) {
    this.compat    = compatMgr;
    this.xulwindow = this.compat.xulwindow;
    this.rpService = Components.classes["@requestpolicy.com/requestpolicy-service;1"]
                               .getService(Components.interfaces.nsIRequestPolicy);
    this.compat.debug("RequestPolicy compatibility established");
  },

  refresh: function(doc) {
  },
  
  fixPrivateLink: function(eng, doc, link) {
    var self = this;
    // If RequestPolicies page load handler is called before us, it won't
    // register the clicked link and complain!
    // Unfortunately, there's no way to find out what happened, so just register!
    link.addEventListener("click", function(event) {
      self.rpService.registerLinkClicked(event.currentTarget.ownerDocument.URL,
                                         event.currentTarget.href);
    }, false);
  },
  
  showLog: function() {
    var reqlog = this.xulwindow.document.getElementById("requestpolicy-requestLog");
    if (reqlog && reqlog.hidden)
      this.xulwindow.requestpolicy.overlay.toggleRequestLog();
  }
};

//***************************************************************************
//*
//*
//***************************************************************************
const KNOWN_ADDONS = {
  "firebug@software.joehewitt.com":  FirebugCompat,
  "requestpolicy@requestpolicy.com": RequestPolicyCompat
};
  

function AddonCompat(gprivacy) {
  try {
    this.init(gprivacy);
  } catch (exc) {
    Logging.logException(exc);
    Logging.error("compat: Error initializing. Addon compatibility checks are off!");
    this.active = this.level = 0;
  }
}

AddonCompat.prototype = {

  init: function(gpr) {
    var self        = this;
    
    this.gpr        = gpr;

    this.debug      = this.gpr.debug.bind(this.gpr);
    this.tabbrowser = this.gpr.browser; // only works, if the window is already opened Services.wm.getMostRecentWindow("navigator:browser");
    this.xulwindow  = this.gpr.window;
    
    this.addons     = [];

    // Why doesn't this work: KNOWN_ADDONS.keys()
    var keys = []
    for (let k in KNOWN_ADDONS) keys.push(k);

    if (keys) {
      AddonManager.getAddonsByIDs(keys, function initAddons(addons) {
        for (let a = 0; a < addons.length; a++) {
          if (addons[a] == null ) {
            // Seems to happen with disabled addons
            // This seems to be fixed in Gecko 12.0 (maybe even 11.0)
            Logging.error("AddonManager returned null for installed addon '"+keys[a]+"'. Compatibility checks not added!");
            continue;
          }
          if (addons[a].isActive) {
            var id = addons[a].id;
            try {
              var addcomp = new KNOWN_ADDONS[id](self, addons[a]);
              if (addcomp.INTERNAL_NAME && addcomp.INTERNAL_NAME != "")
                self.gpr[addcomp.INTERNAL_NAME] = addcomp;
              self.addons.push(addcomp);
              self.debug("compat: Checks for add-on '"+id+"' added");
            } catch (exc)
              { this.logAddonException(exc, id, "compatibility not installed"); }
          }
        }
        self.initDone();
      });
    } else
      this.initDone();
    // DO NOT INSERT INITIALIZATZION CODE HERE
  },
  
  initDone: function() {
    this.debug("compat: Initialization done.");
  },
  
  close: function() {
  },
  
  refresh: function(doc) {
    for (let a in this.addons) {
      try { this.addons[a].refresh(doc); }
      catch (exc) { this.logAddonException(exc, id, "refresh failed"); }
    }        
  },
  
  fixPrivateLink: function(eng, doc, link) {
    for (let a in this.addons) {
      var add = this.addons[a];
      if (add.fixPrivateLink) {
        try { add.fixPrivateLink(eng, doc, link); }
        catch (exc) { this.logAddonException(exc, id, "fixing link failed"); }
      }
    }        
  },

  logAddonException: function(exc, id, desc) {
     Logging.logException(exc);
     Logging.error("compat: Add-on id '"+id+"': "+desc);
  }
};
