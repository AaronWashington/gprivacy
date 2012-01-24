Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/PopupNotifications.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "ChangeMonitor" ];

var ChangeMonitor = {
  active: Services.prefs.getIntPref("extensions.gprivacy.changemon"),
  DPFX:  "DO"+"M",
  engines: null,
  init: function(gpr, xuldoc, tabBrowser, toOpenWindowByType) {
    this.gpr        = gpr;

    this.tabBrowser = tabBrowser; // :-( all these are not defined in modules...
    this.notify     = new PopupNotifications(tabBrowser,  
                                             xuldoc.getElementById("notification-popup"),  
                                             xuldoc.getElementById("notification-popup-box"));
    this.popup      = null;
    this.toOpenWindowByType = toOpenWindowByType;

    this.refresh();
  },
  
  refresh: function(doc) {
    this.active  = Services.prefs.getIntPref( "extensions.gprivacy.changemon");
    this.verbose = this.active; // MAYBE: get a differnt pref
  },
  
  pageLoaded: function(eng, doc, links, changed) {
    var self = this;
    if (changed == 0 && links.length > 0) {
      var msg = "Engine '" + eng.NAME + "' matched, but no links were modified on '" +
                doc.location.href.substring(0, 128) + "'. Did the website change its tracking method?";
      Logging.warn(msg);

      if (this.active) {
        this.showPopup(this.tabBrowser.selectedBrowser, "gprmon-popup",
          msg, null, // "gprmon-notification-icon",
          { label: "OK ", accessKey: "O",  callback: function(state) { self.closePopup(); } },
          null,
          { persistence: 256, /* timeout: Date.now() + 600000, */ persistWhileVisible: true } );
      }
    } else if (this.active && changed > 0) {
      Logging.log("Engine '" + eng.NAME + "': " + changed + " links changed when loading page '" + doc.location.href.substring(0, 128) + "'");
    }
  },
  
  showPopup: function(brws, id, txt, icon, prim, sec, opts) {
    this.closePopup();
    this.popup = this.notify.show(brws, id, txt, icon, prim, sec, opts);
  },
  
  closePopup: function() {
    if (this.popup) this.notify.remove(this.popup);
    this.popup = null;
  },
  
  nodeInserted: function(eng, _doc, _node, _links, changed) {
    if (this.active && changed > 0) {
      Logging.log("Engine '" + eng.NAME + "': " + changed + " links changed while inserting on page '" + doc.location.href.substring(0, 128) + "'");
    }
  },
  
  getWrapper: function(eng, doc) {
    var self = this;
    return function(link) {
      var eng = eng;
      var doc = doc;
      if (!link.gprwapper) {
        if (self.verbose > 2) {
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
      }
      return link;
    }
  },
  
  watch: function(eng, doc, link) {
    var self = this;

    if (this.active) {
      var mods = [  this.DPFX + "Attr"+"Modified", this.DPFX + "Node"+"Inserted",
                    /* deprecated, I know: */      this.DPFX + "Subtree"+"Modified" ];
      var status = { eng: eng, doc: doc, link: link, hit: false, notified: false }
      for (var m in mods) {
        link.addEventListener(mods[m], function(e) { self.onPrivacyCompromised(e, status); }, false);
      }
      link.gpwatched = true;
    }
  },
  
  onPrivacyCompromised: function(e, status) {
    var self = this;
    
    var msg = "'" + e.currentTarget.href + "' was compromised: " + e.type; 
    if (e.attrChange) msg += ", '" + e.attrName +  "': '" +
                             e.prevValue + "' -> '" + e.newValue;
                             
    if (e.currentTarget !== e.originalTarget) {
      Logging.warn("Maybe " + msg);
      return;
    }

    Logging.error(msg, false);
    
    if (!status.hit) {
      status.hit = true;
      var link = e.currentTarget;
      if (link.gprivacyMark) {
        var bogus = DOMUtils.create(status.doc, this.MARKBOGUS);
        link.gprivacyMark.parentNode.insertBefore(bogus, link.gprivacyMark);
        link.gprivacyMark.parentNode.removeChild(link.gprivacyMark)
        link.gprivacyMark = null;
      }
      if (link.grpivacyText)
        link.appendChild(status.doc.createTextNode("\u00A0(compromised!)"));
    }
      
    if (!status.notified) {
      status.notified = true;

      this.showPopup(this.tabBrowser.selectedBrowser, "gprmon-popup",
        msg + "'. See error log for details!", null, // "gprmon-notification-icon",
        { label: "Open error console", accessKey: "E",
          callback: function(state) { 
              self.toOpenWindowByType("global:console", "chrome://global/content/console.xul");
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
