// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");
Components.utils.import("chrome://gprivacy/content/gpcmdatabase.jsm");

var EXPORTED_SYMBOLS = [ "ChangeMonitor" ];

const DPFX   = "DO"+"M";
const DOMSTM = DPFX+"Subtree"+"Modified";

function MoniData(eng, doc, e, ts) {
  let link = e.currentTarget || doc.location;
  let attr = e.attrName || null, oldv = e.prevValue || null, newv = e.newValue || null;
  
  if (!e.attrChange && e.type == DOMSTM) {
    let elt = e.originalTarget;
    attr = elt.tagName; oldv = link.outerHTML; newv = elt.outerHTML;
  }
  this.ts     = ts || new Date().getTime();
  this.engine = eng.ID;                  this.what  = e.type;
  this.id     = link.id || null;         this.attr  = attr;
  this.oldv   = oldv;                    this.newv  = newv;
  this.proto  = link.protocol || null;   this.host  = link.host || null;
  this.path   = link.pathname || null;   this.query = link.search || null;
  this.doc    = doc.location.href||null; this.note  = null;
  try { this.note = (link.hasAttribute && link.hasAttribute("gprivacy") &&
                     link.getAttribute("gprivacy") == "false" && "tracking") || null;
  } catch (exc) {}
}

//***************************************************************************
//*
//*
//***************************************************************************

function ChangeMonitor(gprivacy) {
  try {
    this.init(gprivacy);
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
  
  init: function CM_init(gpr) {
    this.gpr        = gpr;

    this.tabbrowser = this.gpr.browser; // only works, if the window is already opened Services.wm.getMostRecentWindow("navigator:browser");
    this.xulwindow  = this.gpr.window;
    this.popup      = this.gpr.popup;
    this.debug      = this.gpr.debug.bind(this.gpr);
    this.db         = null;
    this.ignorerules= [];
    
    this.refresh();

    this.debug("ChangeMonitor instance initialized");
  },
  
  close: function CM_close() {
    if (this.db) this.db.close();
    this.debug("ChangeMonitor instance closed");
  },
  
  refresh: function CM_refresh(doc, eng) {
    this.DEBUG       = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    this.level       = Services.prefs.getIntPref( "extensions.gprivacy.changemon");
    this.active      = this.level != 0;
    if (this.level & this.STORE) {
      if (!this.db) this.db = ChangeMonitorDB.open(this);
    }
    this.ignorerules = new IgnoreRules(this.db,
      this.IGNORED_ATTRS.concat(eng && eng.IGNORED_ATTRS ? eng.IGNORED_ATTRS : []));
  },
  
  pageLoaded: function CM_pageLoaded(eng, doc, links, changed) {
    let self = this;
    if (changed == 0 && links.length > 0) {
      if (this.active) {
        let msg = "changemon: Engine '"+eng+"' matched, but no links were modified on '" +
                  doc.location.href.substring(0, 128) + "'. Did the website change its tracking method?";
        this.warnLink(msg, false, new MoniData(eng, doc, { type: "NoTrackingFound" }) );

        this.showPopup("gprmon-popup-modified", msg, null, null, null, null);
      }
    } else if (this.active && changed > 0) {
      Logging.log("changemon: Engine '"+eng+"': "+changed+" links changed "+
                  "in " + (new Date().getTime() - this.gpr._pageLoadTime(doc)) + " ms " + // see _pageLoadTime in gprivacy.js
                  "when loading page '"+doc.location.href.substring(0, 128)+"'");
    }
  },
  
  nodeInserted: function CM_nodeInserted(eng, doc, _node, _links, changed) {
    if (this.active && changed > 0) {
      Logging.log("Engine '"+eng+"': "+changed+" links changed while inserting on page '"+doc.location.href.substring(0, 128)+"'");
    }
  },
  
  getWrapper: function CM_getWrapper(eng) {
    return function CM_wrappedLink(link) {
      if (!link.gprwapper) {
        link.gpwrapper = this;
        link.gpwatched = false;
      }
      return link;
    }
  },
  
  watch: function CM_watch(eng, doc, link) {
    let self = this;

    if (this.active) {
      let mods = [  DPFX + "Attr"+"Modified", DPFX + "Node"+"Inserted",
                    /* deprecated, I know: */ DPFX + "Subtree"+"Modified" ];
      let status = { eng: eng,   doc: doc,        link:    link,
                     hit: false, notified: false, ignored: this.ignorerules }

      for (let m in mods) {
        link.addEventListener(mods[m], function CM_opc(e) { self.onPrivacyCompromised(e, status); }, false, true);
      }

      link.gpwatched = true;
    }
  },
  
  warnLink: function CM_warnLink(msg, severe, data) {
    if (this.level & this.WARN)
      severe ? Logging.error(msg, false) : Logging.warn(msg);
    if ((this.level & this.STORE) && this.db)
      this.db.writeEntry(this, data);
  },
  
  onPrivacyCompromised: function CM_onPrivacyCompromised(e, status) {
    let self = this;
    
    let link = e.currentTarget;
    
    if (link.gprivacyCompromised !== undefined && e.type == DOMSTM) // got it already
      return;

    let data = new MoniData(status.eng, status.doc, e);
    
    if (this.ignorerules.match(data) ||
        status.eng.changemonIgnored(status.doc, link, e) || // Engine said it's OK!
        e.type == this.gpr.INSERT_EVT) { // This is handled by gprivacy itself
      link.gprivacyCompromised = false;
      return;
    }
    
    link.gprivacyCompromised = true;

    let msg = status.eng+": "+(link.id ? "#"+link.id+" " : "")+"'"+link.href+
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
  
  switchOff: function CM_switchOff(flags) {
    this.level &= ~flags;
    Services.prefs.setIntPref("extensions.gprivacy.changemon", this.level);
  },
  
  showLogs: function CM_showLogs() {
    let self = this;
    
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

  showPopup: function CM_showPopup(id, txt, icon, prim, sec, opts) {
    let self = this;
    
    if ((this.level & this.NOTIFY) && this.popup) {
      prim = prim || {           
        label: "Open error console", accessKey: "E",
        callback: function CM_popPrimCb(state) { self.showLogs(); self.popup.close(); }
      };
      sec = sec || [ 
        { label: "Stop nagging in this window", accessKey: "S", 
          callback: function CM_popSecCb1(state) { self.popup.close(); self.popup = null; }
        },
        { label: "Turn off completely", accessKey: "O", 
          callback: function CM_popSecCb2(state) { self.switchOff(self.NOTIFY); self.popup.close(); }
        }
      ];
      this.popup.show(id, txt, icon, prim, sec, opts);
    }
  }
};
