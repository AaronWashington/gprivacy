// $Id$

Components.utils.import("resource://gre/modules/Services.jsm");

Components.utils.import("chrome://gprivacy/content/gputils.jsm");
Components.utils.import("chrome://gprivacy/content/gpengines.jsm");
Components.utils.import("chrome://gprivacy/content/gpchangemon.jsm");
Components.utils.import("chrome://gprivacy/content/gpcompat.jsm");

var gprivacy = {
  INSERT_EVT: "DOMNode" + "Inserted", // What are we going to do, when these will be removed (already deprecated)???
  DEBUG:      false,
  MARKHTML:   { node: "img", height:12, width:12, title: "Privacy Respected!", src: "chrome://gprivacy/skin/private16.png",  class: "gprivacy-private" , isTemplate: true },
  MARKORIG:   { node: "img", height:12, width:12, title: "Privacy Violated!",  src: "chrome://gprivacy/skin/tracking16.png", class: "gprivacy-tracking", isTemplate: true },
  MARKBOGUS:  { node: "img", height:12, width:12, title: "Compromised!",       src: "chrome://gprivacy/skin/modified16.png", class: "gprivacy-bogus",    isTemplate: true },

  onLoad: function() {
    try {
      var self = this;
      this.loadPrefs();
      this.strings    = document.getElementById("gprivacy-strings");
      this.appcontent = document.getElementById("appcontent");
      this.name       = this.strings.getString("gprivacy");
      this.privtext   = this.strings.getString("privateLink");
      this.tracktext  = this.strings.getString("origLink");

      this.MARKHTML.title  = this.strings.getString("privateTip");
      this.MARKORIG.title  = this.strings.getString("origTip");
      this.MARKBOGUS.title = this.strings.getString("compromisedTip");
      
      if (this.appcontent) { // this is a browser
        // Property intializaion should be done by here...

        this.compat    = new AddonCompat(this, window, gBrowser);
        this.changemon = new ChangeMonitor(this, window, gBrowser);
        this.engines   = new Engines(this);

        // Now for the event listeners

        this.appcontent.addEventListener("DOMContentLoaded", function(e) {
          self.onPrePageLoad(e);
        }, false, true);
        document.getElementById("contentAreaContextMenu")
                .addEventListener("popupshowing", function (e){ self.showContextMenu(e); }, false);
      }
      window.addEventListener("unload", function() { self.onUnload(); }, false);
    
    
      this.debug("initialized!");
    }
    catch (exc) {
      Logging.logException(exc);
    }
  },

  loadPrefs: function() {
    this.DEBUG      = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    this.active     = Services.prefs.getBoolPref("extensions.gprivacy.active");
    this.replace    = Services.prefs.getBoolPref("extensions.gprivacy.replace");
    this.keeporg    = Services.prefs.getBoolPref("extensions.gprivacy.orig");
    this.anonlinks  = Services.prefs.getBoolPref("extensions.gprivacy.anonlinks"); this.lockedprop = "PATTERN";
    this.embedded   = Services.prefs.getBoolPref("extensions.gprivacy.embedded");
    this.seticons   = Services.prefs.getBoolPref("extensions.gprivacy.mark");
  },

  onUnload: function() {
    if (this.appcontent)
    {
      this.appcontent.removeEventListener("DOMContentLoaded", function(e) { self.onPageLoad(e); }, false);
      this.appcontent = null;
      this.changemon.close();
      this.compat.close();
      this.debug("instance unloaded");
    }
  },
  
  onPrePageLoad: function(e) {
    var self = this;
    var evt  = e;

    try {
      this.loadPrefs();
      
      if (!this.active) return;
      
      this.compat.refresh(doc);
      this.engines.refresh(doc);
    
      var doc = e.type != "DOMFrameContentLoaded" ? e.originalTarget : e.originalTarget.contentDocument;
    
      var eng = self.engines.find(doc.location.href, true)

      if (eng != null) {
        self.debug("page '"+doc.location.href+"' matched engine "+eng);
      
        this.changemon.refresh(doc, eng);

        doc.defaultView.addEventListener("load",   function _opl()  { self.onPageLoad(eng, doc, e)   }, false);
        doc.defaultView.addEventListener("unload", function _opul() { self.onPageUnload(eng, doc, e) }, false);
      }
    } catch (exc) {
      Logging.logException(exc);
    }
  },
  
  onPageUnload: function(eng, doc, e) {
    // TODO: find and remove all listeners
    Logging.log("Page '"+doc.location.href+"' unloaded.");
  },
  
  onPageLoad: function(eng, doc, e) {
    try {
      var self = this;

      doc.gprivacyLoaded = new Date(); // a little bit of performance timing
    
      var links   = doc.getElementsByTagName("a");
      var changed = 0;

      for (var i = 0; i < links.length; i++)
          changed += self.changeLink(eng, doc, links[i], self.replace) ? 1 : 0;

      changed += eng.call("removeGlobal", doc) ? 1 : 0;

      doc.addEventListener(self.INSERT_EVT, function(e) { self.onNodeInserted(e, eng); }, false, true);
        
      self.changemon.pageLoaded(eng, doc, links, changed);

    } catch (exc) {
      Logging.logException(exc);
    }
  },
  
  onNodeInserted:  function(e, eng) {
    var doc = e.currentTarget;
    var elt = e.originalTarget
    
    if (elt.nodeType == elt.COMMENT_NODE || elt.nodeType == elt.TEXT_NODE)
      return;

    if (!elt.getElementsByTagName) {
      Logging.error(elt.tagName + " doesn't have a 'getElementsByTagName' method! Not inserted!");
      return;
    }
    var links = elt.getElementsByTagName("a");
    // doc.removeEventListener(this.INSERT_EVT, gprivacy.onNodeInserted, false);

    var changed = 0;
    
    for (var i = 0; i < links.length; i++)
        changed += this.changeLink(eng, doc, links[i], this.replace) ? 1 : 0;
        
    this.changemon.nodeInserted(eng, doc, elt, links, changed);
  },
  
  isActive: function(eng, doc) {
    return this.active &&
      (Services.prefs.getBoolPref("extensions.gprivacy.active.loggedin") ||
       !this._loggedIn(eng, doc) )
  },
  
  _isTracking: function(eng, doc, link) {
    if (eng.sameorigin && doc.location.hostname == link.hostname)
      return false;

    if (link.hostname == "" && !this.anonlinks)
      return false;

    var is = eng.call("isTracking", doc, link);

    if (eng.all)
      return is || this._hasBadHandler(eng, doc, link);

    return is;
  },
    
  // REMOVEME: These stubs should  be removed, if there's no additional functionality

  _hasBadHandler: function(eng, doc, link) {
    return eng.call("hasBadHandler", doc, link);
  },

  _removeTracking: function(eng, doc, link, replaced) {
    if (eng.all) return this._removeAll(eng, doc, link, replaced);
    return eng.call("removeTracking", doc, link, replaced);
  },
  
  _removeAll: function(eng, doc, link, replaced) {
    return eng.call("removeAll", doc, link, replaced);
  },

  _loggedIn: function(eng, doc) {
    return eng.call("loggedIn", doc);
  },
  
  _cloneLink: function(eng, doc, link) {
    return eng.call("cloneLink", doc, link);
  },
  
  _createLinkAnnot: function(eng, doc, orgLink, isRepl) {
    return eng.call("createLinkAnnot", doc, orgLink, isRepl);
  },
  
  _insertLinkAnnot: function(eng, doc, link, what) {
    return eng.call("insertLinkAnnot", doc, link, what);
  },
  
  // end of REMOVEME:
  
  _setIcons: function(_eng, _doc, priv, tracked, privicon, trackicon) {
    
    if (priv && privicon) {
      if (priv.setIcon) priv.setIcon(privicon); 
      else              DOMUtils.setIcon(priv, privicon);
      priv.gprivacyIcon = privicon; // remember it
    }
    
    if (tracked && trackicon) // original link is kept
    {
      if (tracked.setIcon) tracked.setIcon(trackicon);
      else                 DOMUtils.setIcon(tracked, trackicon);
      tracked.gprivacyIcon = trackicon;
    }
  },
  
  changeLink: function(eng, doc, orgLink, replace) {
    if (!this.active) return false;

    var self   = this;

    if (orgLink.hasAttribute("gprivacy"))       return false; // already handled
    
    var verb = Services.prefs.getBoolPref("extensions.gprivacy.text") ||
                 !Services.prefs.getBoolPref("extensions.gprivacy.mark");
    var wrap = this.changemon.getWrapper(eng, doc);
    
    
    var tracking = this._isTracking(eng, doc, orgLink);   
    
    if (!tracking && // do we watch this link anyway?
        (this.changemon.level & this.changemon.ALL) &&
        (orgLink.hostname != "" || this.anonlinks)) {
      var moni = wrap(orgLink), icon = DOMUtils.create(doc, this.MARKORIG);
      moni.setAttribute("gprivacy", "unknown"); // mark as visited
      icon.setAttribute("title", "Unknown...");
      if (this.seticons && !(this.changemon.level & this.changemon.SILENT))
        this._setIcons(eng, doc, moni, null, icon, null);
      this.changemon.watch(eng, doc, moni);
    }

    if (!tracking) return false; // maybe they're hiding too well...

    var tracked = wrap(orgLink);
    var priv    = null; 
    
    var linkActive = this.isActive(eng, doc);

    if (linkActive) { // maybe we're logged in
      var annot = null; 
      
      priv = wrap(this._cloneLink(eng, doc, tracked));

      if (!replace || this.keeporg)
        annot = this._createLinkAnnot(eng, doc, orgLink, replace);
      
      var first  = tracked;
      var second = priv;
      
      if (replace) {
        eng.call("replaceLink", doc, tracked, priv);
        first = priv; second = tracked;
      }

      if (annot !== null) {
        DOMUtils.removeAllChildren(second);
        if (verb)
          second.appendChild(replace ? doc.createTextNode(this.tracktext)
                                     : doc.createTextNode(this.privtext));

        this._insertLinkAnnot(eng, doc, first, annot);
        if (annot.setLink) annot.setLink(second);
        else               annot.appendChild(second);
      }

      priv.setAttribute("gprivacy", "true"); // mark as visited
    }    

    //-------------------------------------------------------------------------
    // no for the important part...
    //-------------------------------------------------------------------------
    if (priv) {

      this._removeTracking(eng, doc, priv, replace);

    }    
    
    if (this.seticons) {
      this._setIcons(eng, doc, priv, tracked,
                     DOMUtils.create(doc, this.MARKHTML),
                     DOMUtils.create(doc, this.MARKORIG));
    }

    tracked.setAttribute("gprivacy", "false"); // mark as visited
    
    if (priv) {
      this.compat.fixPrivateLink(eng, doc, priv);
      this.changemon.watch(eng, doc, priv);
    }

    if ((!priv && linkActive) || this.changemon.level >= this.changemon.TRACKING)
      this.changemon.watch(eng, doc, tracked); // for engine developers

    return true;
  },
  
  showOptions: function(args) {
    return window.openDialog("chrome://gprivacy/content/options.xul", "",
                             "chrome, dialog, modal, resizable=no", args).focus();
  },
  
  showContextMenu: function(e) {
    // show or hide the menuitem based on what the context menu is on
    var eng = this.engines.find(gBrowser.selectedBrowser.contentDocument, false, this.embedded);
    document.getElementById("context-gprivacy").hidden = (eng == null);
  },

  onMenuItemCommand: function(e) {
    var self = (this || gprivacy);
    var args = { rc: null };
    this.showOptions(args);
    if (args.rc)
      for (var i = 0; i < gBrowser.browsers.length; i++) {
        var b = gBrowser.getBrowserAtIndex(i);
        if (self.engines.find(b.contentDocument, false, this.embedded) != null)
          b.reload();
      }
  },

  showPopup: function(id, txt, icon, prim, sec, opts) {
    if (this.changemon) {
      opts = opts || {}; opts.force = true;
      this.changemon.showPopup(id, txt, icon, prim, sec, opts);
    }
    Logging.log("MESSAGE: " + txt);
  },
  
  closePopup: function() {
    if (this.changemon) this.changemon.closePopup();
  },
  
  debug: function(txt) {
    if (this.DEBUG)
      Logging.log("DEBUG: " + txt);
  }

};

window.addEventListener("load", function () { gprivacy.onLoad(); }, false);
