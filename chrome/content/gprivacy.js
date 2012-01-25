Components.utils.import("resource://gre/modules/Services.jsm");

Components.utils.import("chrome://gprivacy/content/gputils.jsm");
Components.utils.import("chrome://gprivacy/content/gpengines.jsm");
Components.utils.import("chrome://gprivacy/content/gpchangemon.jsm");

var gprivacy = {
  INSERT_EVT: "DOMNode" + "Inserted", // What are we going to do, when these will be removed (already deprecated)???
  DEBUG:      false,
  MARKHTML:   { node: "img", height:12, width:12, title: "Privacy Respected!", src: "chrome://gprivacy/skin/private.png",  class: "gprivacy-private"  },
  MARKORIG:   { node: "img", height:12, width:12, title: "Privacy Violated!",  src: "chrome://gprivacy/skin/tracking.png", class: "gprivacy-tracking" },
  MARKBOGUS:  { node: "img", height:12, width:12, title: "Compromised!",       src: "chrome://gprivacy/skin/modified.png", class: "gprivacy-bogus" },

  onLoad: function() {
    // initialization code
    var self = this;
    this.loadPrefs();
    this.strings    = document.getElementById("gprivacy-strings");
    this.appcontent = document.getElementById("appcontent");

    if (this.appcontent) {
        this.appcontent.addEventListener("DOMContentLoaded", function(e) { self.onPageLoad(e); }, false);
    }
    document.getElementById("contentAreaContextMenu")
            .addEventListener("popupshowing", function (e){ self.showContextMenu(e); }, false);
    window.addEventListener("unload", function() { self.onUnload(); }, false);
    
    ChangeMonitor.init(this, document, gBrowser, toOpenWindowByType);

    Engines.initialize(this);
    
    this.debug("initialized!");
  },

  loadPrefs: function() {
    this.DEBUG      = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    this.active     = Services.prefs.getBoolPref("extensions.gprivacy.active");
    this.replace    = Services.prefs.getBoolPref("extensions.gprivacy.replace");
    this.anonlinks  = Services.prefs.getBoolPref("extensions.gprivacy.anonlinks"); this.lockedprop = "PATTERN";
    this.embedded   = Services.prefs.getBoolPref("extensions.gprivacy.embedded");
  },

  onUnload: function() {
    if(this.appcontent)
    {
        this.appcontent.removeEventListener("DOMContentLoaded", function(e) { self.onPageLoad(e); }, false);
        this.appcontent = null;
    }
  },
  
  onPageLoad: function(e) {
    try {
      var self = this;

      this.loadPrefs();
      
      if (!this.active) return;
      
      var doc   = e.type != "DOMFrameContentLoaded" ? e.originalTarget : e.originalTarget.contentDocument;
    
      ChangeMonitor.refresh(doc);

      Engines.refresh(doc);
    
      var eng = Engines.find(doc.location.href, true)

      if (eng != null) {
        this.debug("page '" + doc.location.href + "' matched engine " + eng.NAME);

        var links   = doc.getElementsByTagName("a");
        var changed = 0;

        for (var i = 0; i < links.length; i++)
            changed += this.changeLink(eng, doc, links[i], this.replace) ? 1 : 0;

        changed += eng.call("removeGlobal", doc) ? 1 : 0;

        doc.addEventListener(this.INSERT_EVT, function(e) { self.onNodeInserted(e, eng); }, false);
        
        ChangeMonitor.pageLoaded(eng, doc, links, changed);
      }

      /* Not necessary, iframes trigger onPageLoad anyway...
      if (this.embedded) {
        var frames = { i: doc.getElementsByTagName("iframe"), f: doc.getElementsByTagName("frame") };
        for (var[w] in frames)
          for (var f = 0; i < frames[w].length; f++)
            frames[w][f].addEventListener("load", function(e) { self.onPageLoad(e); }, false);
      }
      */

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
        
    ChangeMonitor.nodeInserted(eng, doc, elt, links, changed);
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

  _removeTracking: function(eng, doc, link) {
    if (eng.all) return this._removeAll(eng, doc, link);
    return eng.call("removeTracking", doc, link);
  },
  
  _removeAll: function(eng, doc, link) {
    return eng.call("removeAll", doc, link);
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
  
  // /REMOVEME

  _setMarks: function(_eng, _doc, link, orgLink, mark, orgMark) {
    if (link.setMark) link.setMark(mark); 
    else              link.appendChild(mark);
    link.gprivacyMark = mark;

    if (link !== orgLink) // original link is kept
    {
      if (orgLink.setMark) orgLink.setMark(orgMark);
      else                 orgLink.appendChild(orgMark);
    }
  },
  
  changeLink: function(eng, doc, orgLink, replace) {
    if (!this.active) return false;

    var self   = this;

    if (orgLink.hasAttribute("gprivacy")) return; // already handled
    if (!this._isTracking(eng, doc, orgLink))   return; // maybe they're hiding too well...

    var verb   = Services.prefs.getBoolPref("extensions.gprivacy.text") ||
                 !Services.prefs.getBoolPref("extensions.gprivacy.mark");

    var wrap    = ChangeMonitor.getWrapper(eng, doc);

    var link    = wrap(orgLink);
    var mark    = DOMUtils.create(doc, this.MARKHTML);
    var changed = false;
    
    if (this.isActive(eng, doc)) {

      if (!replace) { // don't replace, append private link
        var priv = this._createLinkAnnot(eng, doc, orgLink, true);
        link     = wrap(this._cloneLink(eng, doc, orgLink));
        
        DOMUtils.removeAllChildren(link);
        if (verb) {
          link.appendChild(doc.createTextNode(this.strings.getString("privateLink")));
          link.grpivacyText = true;
        }
        
        link.setAttribute("gprivacy", "true"); // mark as visited
        priv.setLink(link);
        this._insertLinkAnnot(eng, doc, orgLink, priv);
      } else {
        if (Services.prefs.getBoolPref("extensions.gprivacy.orig")) {
          // keep original link, too
          var orig = this._createLinkAnnot(eng, doc, orgLink, false);
          orgLink  = wrap(this._cloneLink(eng, doc, link));
          
          DOMUtils.removeAllChildren(orgLink);
          if (verb) orgLink.appendChild(doc.createTextNode(this.strings.getString("origLink")));

          orgLink.setAttribute("gprivacy", "true"); // mark as visited

          orig.setLink(orgLink);
          this._insertLinkAnnot(eng, doc, link, orig);
        }
      }
      this._removeTracking(eng, doc, link);
      changed = true;
    }
    else {
      mark = DOMUtils.create(doc, this.MARKORIG);
      changed = true;
    }

    if (Services.prefs.getBoolPref("extensions.gprivacy.mark")) // Set icons
      this._setMarks(eng, doc, link, orgLink, mark, DOMUtils.create(doc, this.MARKORIG));

    link.setAttribute("gprivacy", "true"); // mark as visited
    
    ChangeMonitor.watch(eng, doc, link);

    return changed;
  },
  
  showOptions: function(args) {
    return window.openDialog("chrome://gprivacy/content/options.xul", "",
                             "chrome, dialog, modal, resizable=no", args).focus();
  },
  
  showContextMenu: function(e) {
    // show or hide the menuitem based on what the context menu is on
    var eng = Engines.find(gBrowser.selectedBrowser.contentDocument, false, this.embedded);
    document.getElementById("context-gprivacy").hidden = (eng == null);
  },

  onMenuItemCommand: function(e) {
    var args = { rc: null };
    this.showOptions(args);
    if (args.rc)
      for (var i = 0; i < gBrowser.browsers.length; i++) {
        var b = gBrowser.getBrowserAtIndex(i);
        if (Engines.find(b.contentDocument, false, this.embedded) != null)
          b.reload();
      }
  },

  debug: function(txt) {
    if (this.DEBUG)
      Logging.log("DEBUG: " + txt);
  }

};

window.addEventListener("load", function () { gprivacy.onLoad(); }, false);
