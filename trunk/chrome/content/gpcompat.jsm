// $Id$

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
    this.compat.debug("RequestPolicy compatibility established");
  },

  refresh: function(doc) {
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
  

function AddonCompat(gprivacy, xulwindow, mainwindow) {
  try {
    this.init(gprivacy, xulwindow, mainwindow);
  } catch (exc) {
    Logging.logException(exc);
    Logging.error("compat: Error initializing. Addon compatibility checks are off!");
    this.active = this.level = 0;
  }
}

AddonCompat.prototype = {

  init: function(gpr, xulwindow, mainwindow) {
    var self        = this;
    
    this.gpr        = gpr;

    this.DEBUG      = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    this.debug      = gpr.debug;
    this.tabbrowser = mainwindow; // only works, if the window is already opened Services.wm.getMostRecentWindow("navigator:browser");
    this.xulwindow  = xulwindow;
    
    this.addons     = [];

    // Why doesn't this work: KNOWN_ADDONS.keys()
    var keys = []
    for (let k in KNOWN_ADDONS) keys.push(k);

    if (keys) {
      AddonManager.getAddonsByIDs(keys, function initAddons(addons) {
        for (let a in addons) {
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
    this.DEBUG = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    for (let a in this.addons) {
      try { this.addons[a].refresh(doc); }
      catch (exc) { this.logAddonException(exc, id, "refresh failed"); }
    }        
  },
  
  logAddonException: function(exc, id, desc) {
     Logging.logException(exc);
     Logging.error("compat: Add-on id '"+id+"': "+desc);
  }
};
