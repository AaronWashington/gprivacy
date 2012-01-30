// $Id$

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/PopupNotifications.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "ChangeMonitor" ];

function ChangeMonitor(gprivacy, xulwindow, mainwindow) {
  try {
    this.init(gprivacy, xulwindow, mainwindow);
  } catch (exc) {
    Logging.logException(exc);
    Logging.error("changemon: Error initializing. Link monitoring is off!");
    this.active = this.level = 0;
  }
}

ChangeMonitor.prototype = {
  OFF:     0,
  WARN:    1,
  NOTIFY:  2,
  TRACKED: 4,
  ALL:     8,
  STORE:  16,
  
  IGNORED_ATTRS: [
    "wrc-processed", // avast! WebRep marker
  ],
  active: Services.prefs.getIntPref("extensions.gprivacy.changemon") != 0,
  DPFX:  "DO"+"M",
  engines: null,
  
  init: function(gpr, xulwindow, mainwindow) {
    this.gpr        = gpr;

    this.DEBUG      = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    this.tabbrowser = mainwindow; // only works, if the window is already opened Services.wm.getMostRecentWindow("navigator:browser");
    this.xulwindow  = xulwindow;
    this.popup      = null;
    this.debug      = gpr.debug;
    this.refresh();
    try {
      this.notify     = new PopupNotifications(this.tabbrowser,  
                                               xulwindow.document.getElementById("notification-popup"),
                                               xulwindow.document.getElementById("notification-popup-box"));
    } catch (exc) {
      Logging.logException(exc);
      this.notify = null; // nevermind
    }
    this.debug("ChangeMonitor instance initialized");
  },
  
  close: function() {
    if (this.dbconn) this.dbconn.asyncClose();
  },
  
  refresh: function(doc) {
    this.DEBUG  = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    this.level  = Services.prefs.getIntPref( "extensions.gprivacy.changemon");
    this.active = this.level != 0;
    this.openDB();
  },
  
  pageLoaded: function(eng, doc, links, changed) {
    var self = this;
    if (changed == 0 && links.length > 0) {
      if (this.active) {
        let msg = "Engine '"+eng+"' matched, but no links were modified on '" +
                  doc.location.href.substring(0, 128) + "'. Did the website change its tracking method?";
        this.warnLink(msg, false, { eng: eng, doc: doc, evt: { type: "NoTrackingFound" } });

        this.showPopup("gprmon-popup-modified", msg, null, null, null, null);
      }
    } else if (this.active && changed > 0) {
      Logging.log("Engine '"+eng+"': "+changed+" links changed when loading page '"+doc.location.href.substring(0, 128)+"'");
    }
  },
  
  warnLink: function(msg, severe, data) {
    if (this.level & this.WARN)
      severe ? Logging.error(msg, false) : Logging.warn(msg);
    if ((this.level & this.STORE) && this.dbconn)
      this.logToDB(data);
  },
  
  nodeInserted: function(eng, doc, _node, _links, changed) {
    if (this.active && changed > 0) {
      Logging.log("Engine '"+eng+"': "+changed+" links changed while inserting on page '"+doc.location.href.substring(0, 128)+"'");
    }
  },
  
  getWrapper: function(eng, doc) {
    var self = this;
    return function(link) {
      var eng  = eng;
      var doc  = doc;
      var link = link;
      
      if (!link.gprwapper) {
        link.gpwrapper = this;
        link.gpwatched = false;
      }
      return link;
    }
  },
  
  watch: function(eng, doc, link) {
    var self = this;

    if (this.active) {
      var mods = [  this.DPFX + "Attr"+"Modified", this.DPFX + "Node"+"Inserted",
                    /* deprecated, I know: */      this.DPFX + "Subtree"+"Modified" ];
      var status = { eng: eng,   doc: doc,        link:    link,
                     hit: false, notified: false, ignored: this.IGNORED_ATTRS }
      if (eng.IGNORED_ATTRS)
        status.ignored = status.ignored.concat(eng.IGNORED_ATTRS);

      for (var m in mods) {
        link.addEventListener(mods[m], function(e) { self.onPrivacyCompromised(e, status); }, false, true);
      }

      link.gpwatched = true;
    }
  },
  
  onPrivacyCompromised: function(e, status) {
    var self = this;
    
    const DOMSTM = this.DPFX+"Subtree"+"Modified";
    
    var link = e.currentTarget;
    
    if (link.gprivacyCompromised !== undefined && e.type == DOMSTM) // got it already
      return;

    if (status.eng.call("changemonIgnored", status.doc, link, e) || // Engine said it's OK!
        e.type == this.gpr.INSERT_EVT) { // This is handled by gprivacy itself
      link.gprivacyCompromised = false;
//      status.hit = true;
      return;
    }
    
    if (e.attrChange && status.ignored.indexOf(e.attrName) != -1) {
      link.gprivacyCompromised = false;
      return;
    }

    link.gprivacyCompromised = true;

    var msg = status.eng+": "+(link.id ? "#"+link.id+" " : "")+"'"+link.href+
              "' was compromised: "+e.type; 

    if (e.attrChange) {
      if (e.prevValue == e.newValue) return; // Why are we getting those...

      msg += ", '" + e.attrName +  "': '" +
      e.prevValue + "' -> '" + e.newValue + "'";
    }
   
    if (link !== e.originalTarget &&
        link.getAttribute("gprivacy") == "true") { // monitoring tracked links means we're in debug mode
      this.warnLink("Maybe " + msg, false, status);
      return;
    }

    if (e.type == DOMSTM) {
      var elt = e.originalTarget;
      var dummy = {
        type:    e.type,          attrChange: true, attrName: elt.tagName,
        prevValue:link.outerHTML, newValue:   elt.outerHTML
      }
      e = dummy;
    }

    status.link = link;
    status.evt  = e;

    if (!status.hit) {
    
      this.warnLink(msg, true, status);
    
      status.hit = true;
      if (link.gprivacyIcon) {
        DOMUtils.setIcon(link, this.gpr.MARKBOGUS);
      }
      if (link.gprivacyText)
        link.appendChild(status.doc.createTextNode("\u00A0(compromised!)"));
    }
      
    if (!status.notified) {
      status.notified = true;

      this.showPopup("gprmon-popup-tracking", msg + "'. See error log for details!",
                     null /* "gprmon-notification-icon" */, null, null, null);
    }
  },
  
  switchOff: function(flags) {
    this.level &= ~flags;
    Services.prefs.setIntPref("extensions.gprivacy.changemon", this.level);
  },
  
  
  _warnAndTurnOffDB: function (msg) {
    Logging.warn(msg || "changemon: Error accessing database. Logging turned off for this page.");
    var conn = this.dbconn;
    if (conn) {
      this.dbconn = null;
      this.level &= ~this.STORE;
      conn.asyncClose();
    }
  },

  openDB: function() {
    var pbs = null;
    try { var pbs = Components.classes["@mozilla.org/privatebrowsing;1"].getService(Components.interfaces.nsIPrivateBrowsingService); }
    catch (exc) { }
    if (pbs && pbs.privateBrowsingEnabled) {
      this._warnAndTurnOffDB("changemon: No logging in private browsing mode");
      return;
    }
     
    var self = this;

    if ((this.level & this.STORE) && !this.dbconn) {
      var there = true, file = null;
      try {
        var file    = FileUtils.getFile("ProfD", ["gpchangemon.sqlite"]);
        var there   = file.exists();
        this.dbconn = Services.storage.openDatabase(file);
        if (!there) {
          var creates = DOMUtils.getContents("resource://gpchangemon/changemon.sql");
          this.dbconn.executeSimpleSQL(creates);
        }
      } catch (exc) {
        Logging.logException(exc);
        self._warnAndTurnOffDB();
        if (!there && file && file.exists()) // we just ried to create it, so remove it...
          try { file.remove() } catch (exc) { Logging.logException(exc); }
      }
    }
  },
  
  logToDB:  function(data) {
    if (!this.dbconn) return;
    
    var self = this;

    try {
      var link = data.link || data.doc.location, evt = data.evt;
/*
      var stmt = this.dbconn.createStatement("insert into changemon " + 
               "(ts, engine, what, attr, oldv, newv, id, proto, host, path, query, doc) " +
        "values(  0,      1,    2,    3,    4,    5,  6,     7,    8,    9,    10,  11)");
*/
      var stmt = this.dbconn.createStatement("insert into changemon " + 
               "(ts, engine, what, attr, oldv, newv, id, proto, host, path, query, doc) " +
        "values(:ts,:engine,:what,:attr,:oldv,:newv,:id,:proto,:host,:path,:query,:doc)");
      var par = stmt.params;
      
      par.ts     = new Date().getTime();      par.engine = data.eng.ID;
      par.what   = (evt && evt.type) || "";   par.id     = link.id || null;
      par.proto  = link.protocol || null;     par.host   = link.host || null;
      par.path   = link.pathname || null;     par.query  = link.search || null;
      par.doc    = data.doc.location.href || null;
      if (evt && evt.attrChange) {
        par.attr = evt.attrName || null;      par.oldv = evt.prevValue || null;
        par.newv = evt.newValue || null;
      }
      stmt.executeAsync({
        handleCompletion: function(rc)  { self.debug("SQL completed rc="+rc); },
        handleError:      function(err) {
          Logging.error("SQL Error: "+err.message);
          self._warnAndTurnOffDB();
        }
      });
    } catch (exc) {
      Logging.logException(exc);
      self._warnAndTurnOffDB();
    }
  },
  
  showLogs: function() {
    var self = this;
    
    // Show native error console
    self.xulwindow.toOpenWindowByType("global:console", "chrome://global/content/console.xul");
    
    // Try to find a network protcol
    if (self.gpr.firebugAddon) {
      self.gpr.firebugAddon.showLog();
    } else if (self.xulwindow.HUDConsoleUI) { // Firefox Web console
      if(!self.xulwindow.HUDConsoleUI.getOpenHUD()) self.xulwindow.HUDConsoleUI.toggleHUD()
    } else if (self.gpr.requestPolicyAddon) { // SeaMonkey or Firefox with RequestPolicy
      self.gpr.requestPolicyAddon.showLog();
    }
  },

  // TODO: Move popup functions (preferably) to gputils.jsm
  showPopup: function(id, txt, icon, prim, sec, opts) {
    var self = this;
 // icon = icon || "gprmon-notification-icon";
    prim = prim || {           
      label: "Open error console", accessKey: "E",
      callback: function(state) { self.showLogs(); self.closePopup(); }
    };
    sec = sec || [ 
      { label: "Stop nagging in this window", accessKey: "S", 
        callback: function(state) { self.closePopup(); self.notify = null; }
      },
      { label: "Turn off completely", accessKey: "O", 
        callback: function(state) { self.switchOff(self.NOTIFY); self.closePopup(); }
      }
    ];
    opts = opts || {
      persistence: 8, timeout: Date.now() + 60000,
      persistWhileVisible: true,
      eventCallback: function(state) { if (state == "removed") self.closePopup(); },
    };
    
    if (((this.level & this.NOTIFY) || opts.force) && this.notify) {
      if (opts.force !== undefined) delete opts.force;
      this.closePopup();
      this.popup = this.notify.show(this.tabbrowser.selectedBrowser, id, txt,
                                    icon, prim, sec, opts);
    }
  },
  
  closePopup: function() {
    if (this.popup) this.notify.remove(this.popup);
    this.popup = null;
  }
  
};
