// $Id$

Components.utils.import("resource://gre/modules/Services.jsm");
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
  PROXY:  16,
  
  IGNORED_ATTRS: [
    "wrc-processed", // avast! WebRep marker
  ],
  active: Services.prefs.getIntPref("extensions.gprivacy.changemon"),
  DPFX:  "DO"+"M",
  engines: null,
  
  init: function(gpr, xulwindow, mainwindow) {
    this.gpr        = gpr;

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
  
  refresh: function(doc) {
    this.level  = Services.prefs.getIntPref( "extensions.gprivacy.changemon");
    this.active = this.level != 0;
  },
  
  pageLoaded: function(eng, doc, links, changed) {
    var self = this;
    if (changed == 0 && links.length > 0) {
      if (this.active) {
        let msg = "Engine '"+eng+"' matched, but no links were modified on '" +
                  doc.location.href.substring(0, 128) + "'. Did the website change its tracking method?";
        this.warnLink(msg);

        this.showPopup("gprmon-popup-modified",
          msg, null, // "gprmon-notification-icon",
          { label: "OK ", accessKey: "O",  callback: function(state) { self.closePopup(); } },
          null,
          { persistence: 256, /* timeout: Date.now() + 600000, */ persistWhileVisible: true } );
      }
    } else if (this.active && changed > 0) {
      Logging.log("Engine '"+eng+"': "+changed+" links changed when loading page '"+doc.location.href.substring(0, 128)+"'");
    }
  },
  
  warnLink: function(msg, severe) {
    if (this.level & this.WARN)
      severe ? Logging.error(msg, false) : Logging.warn(msg);
  },
  
  // TODO: Move popup functions to gputils.jsm
  showPopup: function(id, txt, icon, prim, sec, opts) {
    if (((this.level & this.NOTIFY) || opts.force) && this.notify) {
      if (opts.force !== undefined) delete opts.force;
      this.closePopup();
      this.popup = this.notify.show(this.tabbrowser.selectedBrowser,
                                    id, txt, icon, prim, sec, opts);
    }
  },
  
  closePopup: function() {
    if (this.popup) this.notify.remove(this.popup);
    this.popup = null;
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
        if (self.level & self.PROXY) {
          var neew = link.cloneNode(true);
          neew = Proxy.create(self.loggingProxyHandler(neew));
          try {
            link.parentNode.replaceChild(neew, link);
            link = neew;
          } // doesn't work: NS_ERROR_INVALID_POINTER
          catch (exc) { Logging.logException(exc); } 
        }
        link.gpwrapper = this;
        link.gpwatched = false;

/* doesn't seem to work in content - TODO: find a replacement
        if (self.active) {
          var status = { eng: eng,   doc: doc,        link:    link,
                         hit: false, notified: false, ignored: self.IGNORED_ATTRS }
          link._ael = link.addEventListener;
          link.addEventListener = function(type, func, flag) {
            var evt = { type: "AddEventListener",
                        currentTarget: link, originalTarget: link,
                        attrChange: true,    attrName:  type,
                        newValue:   "func",  prevValue: ""
                      }
            if (link.gpwatched)
              self.onPrivacyCompromised(evt, status);
            link._ael(type, func, flag);
          }
        }
*/

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
    
    var link = e.currentTarget;
    
    if (link.gprivacyCompromised !== undefined) // got it already
      return;

    if (e.attrChange && status.ignored.indexOf(e.attrName) != -1) {
      link.gprivacyCompromised = false;
      return;
    }

    link.gprivacyCompromised = true;

    var msg = "'" + link.href + "' was compromised: " + e.type; 
    if (e.attrChange) msg += ", '" + e.attrName +  "': '" +
                             e.prevValue + "' -> '" + e.newValue + "'";
                             
   
    if (link !== e.originalTarget &&
        link.getAttribute("gprivacy") == "true") { // monitoring tracked links means we're in debug mode
      this.warnLink("Maybe " + msg);
      return;
    }

    this.warnLink(msg, true);
    
    if (!status.hit) {
      status.hit = true;
      if (link.gprivacyIcon) {
        var bogus = DOMUtils.create(status.doc, this.gpr.MARKBOGUS);
        link.gprivacyIcon.parentNode.insertBefore(bogus, link.gprivacyIcon);
        link.gprivacyIcon.parentNode.removeChild(link.gprivacyIcon)
        link.gprivacyIcon = null;
      }
      if (link.gprivacyText)
        link.appendChild(status.doc.createTextNode("\u00A0(compromised!)"));
    }
      
    if (!status.notified) {
      status.notified = true;

      this.showPopup("gprmon-popup-tracking",
        msg + "'. See error log for details!", null, // "gprmon-notification-icon",
        { label: "Open error console", accessKey: "E",
          callback: function(state) { 
              self.xulwindow.toOpenWindowByType("global:console", "chrome://global/content/console.xul");
          } },  
        [ { label: "Show more from this page", accessKey: "O",
            callback: function(state) { status.notified = false; } },
          { label: "Stop this", accessKey: "S", 
            callback: function(state) {  } }
        ],
        { persistence: 256,    timeout: Date.now() + 600000,
          persistWhileVisible: true } );
    }
  },
  
  loggingProxyHandler: function gpr_loggingProxyHandler(obj) {
    // template from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Proxy
    // But proxies don't work as DOM-nodes, so no logging functionality is 
    // implemented yet :-(
    return {
      // Fundamental traps
      getOwnPropertyDescriptor: function(name) {
        var desc = Object.getOwnPropertyDescriptor(obj, name);
        // a trapping proxy's properties must always be configurable
        if (desc !== undefined) { desc.configurable = true; }
        return desc;
      },
      getPropertyDescriptor:  function(name) {
        var desc = Object.getPropertyDescriptor(obj, name); // not in ES5
        // a trapping proxy's properties must always be configurable
        if (desc !== undefined) { desc.configurable = true; }
        return desc;
      },
      getOwnPropertyNames: function() {
        return Object.getOwnPropertyNames(obj);
      },
      getPropertyNames: function() {
        return Object.getPropertyNames(obj);                // not in ES5
      },
      defineProperty: function(name, desc) {
        Object.defineProperty(obj, name, desc);
      },
      delete:       function(name) { return delete obj[name]; },   
      fix:          function() {
        if (Object.isFrozen(obj)) {
          return Object.getOwnPropertyNames(obj).map(function(name) {
            return Object.getOwnPropertyDescriptor(obj, name);
          });
        }
        // As long as obj is not frozen, the proxy won't allow itself to be fixed
        return undefined; // will cause a TypeError to be thrown
      },
   
      // derived traps
      has:          function(name) { return name in obj; },
      hasOwn:       function(name) { return Object.prototype.hasOwnProperty.call(obj, name); },
      get:          function(receiver, name) { return obj[name]; },
      set:          function(receiver, name, val) { obj[name] = val; return true; }, // bad behavior when set fails in non-strict mode
      enumerate:    function() {
        var result = [];
        for (name in obj) { result.push(name); };
        return result;
      },
      keys: function() { return Object.keys(obj) }
    };
  }

};
