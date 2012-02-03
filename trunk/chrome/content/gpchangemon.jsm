// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/PopupNotifications.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");
Components.utils.import("chrome://gprivacy/content/gpcmdatabase.jsm");

var EXPORTED_SYMBOLS = [ "ChangeMonitor" ];

const DPFX   = "DO"+"M";
const DOMSTM = DPFX+"Subtree"+"Modified";

function MoniData(eng, doc, e, ts) {
  var link = e.currentTarget || doc.location;
  var attr = e.attrName || null, oldv = e.prevValue || null, newv = e.newValue || null;
  
  if (!e.attrChange && e.type == DOMSTM) {
    var elt = e.originalTarget;
    attr = elt.tagName; oldv = link.outerHTML; newv = elt.outerHTML;
  }
  this.ts     = ts || new Date().getTime();
  this.engine = eng.ID;                  this.what  = e.type;
  this.id     = link.id || null;         this.attr  = attr;
  this.oldv   = oldv;                    this.newv  = newv;
  this.proto  = link.protocol || null;   this.host  = link.host || null;
  this.path   = link.pathname || null;   this.query = link.search || null;
  this.doc    = doc.location.href||null; this.note  = null;
  try { this.note = (link.hasAttribute("gprivacy") &&
                     link.getAttribute("gprivacy") == "false" && "tracking") || null;
  } catch (exc) {}
}

//***************************************************************************
//*
//*
//***************************************************************************

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
  OFF:       0,
  WARN:      1,  // write warnings to error console
  NOTIFY:    2,  // Popup-notifications
  TRACKING:  4,  // Monitor tracking links, too
  ALL:       8,  // Monitor _ALL_ links on a page
  STORE:    16,  // Store events in gpchangemon.sqlite
  SILENT: 1024,  // Don't show icons when watching all links, ...

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
    this.db         = null;
    this.ignorerules= [];
    
    this.refresh();

    if (this.level & this.NOTIFY) {
      try {
        this.notify     = new PopupNotifications(this.tabbrowser,  
                                                 xulwindow.document.getElementById("notification-popup"),
                                                 xulwindow.document.getElementById("notification-popup-box"));
      } catch (exc) {
        Logging.logException(exc);
        this.notify = null; // nevermind
      }
    }
    this.debug("ChangeMonitor instance initialized");
  },
  
  close: function() {
    if (this.db) this.db.close();
  },
  
  refresh: function(doc, eng) {
    this.DEBUG       = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    this.level       = Services.prefs.getIntPref( "extensions.gprivacy.changemon");
    this.active      = this.level != 0;
    if (this.level & this.STORE) {
      if (!this.db) this.db = ChangeMonitorDB.open(this);
    }
    this.ignorerules = new IgnoreRules(this.db,
      this.IGNORED_ATTRS.concat(eng && eng.IGNORED_ATTRS ? eng.IGNORED_ATTRS : []));
  },
  
  pageLoaded: function(eng, doc, links, changed) {
    var self = this;
    if (changed == 0 && links.length > 0) {
      if (this.active) {
        let msg = "changemon: Engine '"+eng+"' matched, but no links were modified on '" +
                  doc.location.href.substring(0, 128) + "'. Did the website change its tracking method?";
        this.warnLink(msg, false, new MoniData(eng, doc, { type: "NoTrackingFound" }) );

        this.showPopup("gprmon-popup-modified", msg, null, null, null, null);
      }
    } else if (this.active && changed > 0) {
      Logging.log("changemon: Engine '"+eng+"': "+changed+" links changed "+
                  "in " + (new Date().getTime() - doc.gprivacyLoaded.getTime()) + " ms " +
                  "when loading page '"+doc.location.href.substring(0, 128)+"'");
    }
  },
  
  nodeInserted: function(eng, doc, _node, _links, changed) {
    if (this.active && changed > 0) {
      Logging.log("Engine '"+eng+"': "+changed+" links changed while inserting on page '"+doc.location.href.substring(0, 128)+"'");
    }
  },
  
  getWrapper: function(eng, doc) {
    return function(link) {
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
      var mods = [  DPFX + "Attr"+"Modified", DPFX + "Node"+"Inserted",
                    /* deprecated, I know: */ DPFX + "Subtree"+"Modified" ];
      var status = { eng: eng,   doc: doc,        link:    link,
                     hit: false, notified: false, ignored: this.ignorerules }

      for (var m in mods) {
        link.addEventListener(mods[m], function(e) { self.onPrivacyCompromised(e, status); }, false, true);
      }

      link.gpwatched = true;
    }
  },
  
  warnLink: function(msg, severe, data) {
    if (this.level & this.WARN)
      severe ? Logging.error(msg, false) : Logging.warn(msg);
    if ((this.level & this.STORE) && this.db)
      this.db.writeEntry(this, data);
  },
  
  onPrivacyCompromised: function(e, status) {
    var self = this;
    
    var link = e.currentTarget;
    
    if (link.gprivacyCompromised !== undefined && e.type == DOMSTM) // got it already
      return;

    var data = new MoniData(status.eng, status.doc, e);
    
    if (this.ignorerules.match(data) ||
        status.eng.call("changemonIgnored", status.doc, link, e) || // Engine said it's OK!
        e.type == this.gpr.INSERT_EVT) { // This is handled by gprivacy itself
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
        link.getAttribute("gprivacy") == "false") { // monitoring tracking links means we're in debug mode
      this.warnLink("Maybe " + msg, false, data);
      return;
    }

    status.link = link;
    status.evt  = e;

    if (!status.hit) {
    
      this.warnLink(msg, true, data);
    
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
    if (((this.level & this.NOTIFY) || (opts && opts.force)) && this.notify) {

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
    
      if (opts || opts.force !== undefined) delete opts.force; // for us only
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
