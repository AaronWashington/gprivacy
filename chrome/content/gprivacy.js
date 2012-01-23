Components.utils.import("resource://gre/modules/Services.jsm");

Components.utils.import("chrome://gprivacy/content/gputils.jsm");
Components.utils.import("chrome://gprivacy/content/gpengines.jsm");

var gprivacy = {
  INSERT_EVT: "DOMNode" + "Inserted",
  DEBUG:      false,
  MARKHTML:   { node: "img", height:12, width:12, title: "Privacy Respected!", src: "chrome://gprivacy/skin/private.png"  },
  MARKORIG:   { node: "img", height:12, width:12, title: "Privacy Violated!",  src: "chrome://gprivacy/skin/tracking.png" },

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
    
    Engines.initialize(this);
    
    this.debug("initialized!");
  },

  loadPrefs: function() {
    this.DEBUG      = Services.prefs.getBoolPref("extensions.gprivacy.debug");
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

      var doc   = e.type != "DOMFrameContentLoaded" ? e.originalTarget : e.originalTarget.contentDocument;
      var repl  = Services.prefs.getBoolPref("extensions.gprivacy.replace");
    
      this.loadPrefs();

      Engines.refresh(doc);
    
      var eng = Engines.find(doc.location.href, true)

      if (eng != null) {
        this.debug("page '" + doc.location.href + "' matched engine " + eng.NAME);

        var links = doc.getElementsByTagName("a");
      
        for (var i = 0; i < links.length; i++)
            this.changeLink(eng, doc, links[i], repl);

        eng.call("removeGlobal", doc);

        doc.addEventListener(this.INSERT_EVT, function(e) { self.onNodeInserted(e, eng); }, false);
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
    if (elt.nodeName == "#text") return;
    var repl  = Services.prefs.getBoolPref("extensions.gprivacy.replace");
    if (!elt.getElementsByTagName) {
      Looging.error(elt.tagName + " doesn't have a 'getElementsByTagName' method! Not inserted!");
      return;
    }
    var links = elt.getElementsByTagName("a");
    // doc.removeEventListener(this.INSERT_EVT, gprivacy.onNodeInserted, false);

    for (var i = 0; i < links.length; i++)
        this.changeLink(eng, doc, links[i], repl);

  },
  
  isActive: function(eng, doc) {
    return Services.prefs.getBoolPref("extensions.gprivacy.active") &&
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
    if (link !== orgLink) // original link is kept
    {
      if (orgLink.setMark) orgLink.setMark(orgMark);
      else                 orgLink.appendChild(orgMark);
    }
  },
  
  changeLink: function(eng, doc, orgLink, repl) {
    if (orgLink.hasAttribute("gprivacy")) return; // already handled
    if (!this._isTracking(eng, doc, orgLink))   return; // maybe they're hiding too well...

    var link   = orgLink;
    var mark   = DOMUtils.create(doc, this.MARKHTML);
    var active = Services.prefs.getBoolPref("extensions.gprivacy.active");
    var verb   = Services.prefs.getBoolPref("extensions.gprivacy.text") ||
                 !Services.prefs.getBoolPref("extensions.gprivacy.mark");

    if (this.isActive(eng, doc)) {

      if (!repl) { // don't replace, append private link
        var priv = this._createLinkAnnot(eng, doc, orgLink, true);
        link     = this._cloneLink(eng, doc, orgLink);
        
        DOMUtils.removeAllChildren(link);
        if (verb) link.appendChild(doc.createTextNode(this.strings.getString("privateLink")));
        
        link.setAttribute("gprivacy", "true"); // mark as visited
        
        priv.setLink(link);
        this._insertLinkAnnot(eng, doc, orgLink, priv);
      } else {
        if (Services.prefs.getBoolPref("extensions.gprivacy.orig")) {
          // keep original link, too
          var orig = this._createLinkAnnot(eng, doc, orgLink, false);
          orgLink  = this._cloneLink(eng, doc, link);
          
          DOMUtils.removeAllChildren(orgLink);
          if (verb) orgLink.appendChild(doc.createTextNode(this.strings.getString("origLink")));

          orgLink.setAttribute("gprivacy", "true"); // mark as visited

          orig.setLink(orgLink);
          this._insertLinkAnnot(eng, doc, link, orig);
        }
      }
      this._removeTracking(eng, doc, link);
    }
    else
      mark = DOMUtils.create(doc, this.MARKORIG);

    if (Services.prefs.getBoolPref("extensions.gprivacy.mark") && active ) // Set icons
      this._setMarks(eng, doc, link, orgLink, mark, DOMUtils.create(doc, this.MARKORIG));

    if (active)
      link.setAttribute("gprivacy", "true"); // mark as visited
  },
  
  showContextMenu: function(e) {
    // show or hide the menuitem based on what the context menu is on
    var eng = Engines.find(gBrowser.selectedBrowser.contentDocument, false, this.embedded);
    document.getElementById("context-gprivacy").hidden = (eng == null);
  },

  onMenuItemCommand: function(e) {
    var args = { rc: null };
    window.openDialog("chrome://gprivacy/content/options.xul", "",
                      "chrome, dialog, modal, resizable=no", args).focus();
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
