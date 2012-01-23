Components.utils.import("resource://gre/modules/Services.jsm");

Components.utils.import("chrome://gprivacy/content/gputils.jsm");
Components.utils.import("chrome://gprivacy/content/gpengines.jsm");

var gprivacy = {
  INSERT_EVT: "DOMNode" + "Inserted",
  DEBUG:      false,
  MARKHTML:   '<img height=12 width=12 title="Privacy Respected!" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAG7AAABuwE67OPiAAAACXZwQWcAAAAQAAAAEABcxq3DAAACS0lEQVQ4y6WTT0iTcRjHP68pa85XN1SQWFCgghu0EnfoGNHJdusaOPTiabsIHh1BlAdRdrBLMFSK952W6E4GHko3yNpiTGQnXxzpsPZHyXRJPh1aMttu/uB3+fJ9Pvye5/d9FBHhMqe+lqgoSiPwAOgoS1ngnYj8rDKLyIULOFRVHU0kEpulUumkVCqdJBKJTVVVRwFHlb+isBcY9vl8s4VC4UCLa+IOusX9wi1aUpNCoXDg8/lmgWGg9wIA6Pb7/TPZbHY/uZMUT9AjPEWYRXiDMI14Xnok+TUp2Wx23+/3zwDdIkJduRPVbrer+ke93fXExXJuGaxAI9AGaodK7CyGa9KF/kVvt9vtKqAC54BcKpXK21QbclX+jrYRaAH1TGX11ipL95cQi2BTbaRSqTyQqwTkY7FYznnDKZyB9lBDu63RXN/Min2FVksr3lde+A3O606JxWI5IH/+jSJyqCjKtuXUYvS09dxc+LBA8HGQjaMNGq400P+6n/S1NI6ig6aTJiOdTm+LyGHlCwDi8+H5+MDdAfQ9Hf+cHwQ8Cx627m3BDxjqGyIcDseBeFUOALPVah3LfMscdY53CuMIkwifEeaQruku2f2+e2S1WscA87+6ugrQcbFYXJt6PrUYehQSc8kMv4D3YN4zE+oPycSzicVisbgmIsc1k1huaTASiaxHjah433rFu+iV6E5UIpHIOjAI1NVMYgWkxWQyjQQCAd0wjIxhGJlAIKCbTKYRoOV/v1JrGxVFaQDuAH1l6ROQEJHTKu9l1/kPlZNl+Gs4iZMAAAAldEVYdGNyZWF0ZS1kYXRlADIwMDktMTEtMTVUMTc6MDI6MzQtMDc6MDC2544SAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDEwLTAyLTIwVDIzOjI2OjI2LTA3OjAwuVxB/wAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxMC0wMS0xMVQwOToyNDo0NS0wNzowML7m1FMAAABndEVYdExpY2Vuc2UAaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMy4wLyBvciBodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9MR1BMLzIuMS9bjzxjAAAAJXRFWHRtb2RpZnktZGF0ZQAyMDA5LTAzLTE5VDEwOjUyOjUxLTA2OjAwf2j9BgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAATdEVYdFNvdXJjZQBPeHlnZW4gSWNvbnPsGK7oAAAAJ3RFWHRTb3VyY2VfVVJMAGh0dHA6Ly93d3cub3h5Z2VuLWljb25zLm9yZy/vN6rLAAAAAElFTkSuQmCC" />',
  MARKORIG:   '<img height=12 width=12 title="Privacy Violated!"  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAG7AAABuwE67OPiAAAACXZwQWcAAAAQAAAAEABcxq3DAAACTUlEQVQ4y6WTwUuTcRjHPz9bL0zdelmogQMJB8s3YiSMDl061mVeGuTNUdBF5D3s5mlCl/6BTpEYkq8OkjHFWxe36uBrrhmsS2/ZdBqMV0w0m3u6vIimdumB3+XL9/eB53m+jxIR/qd8Z4lKKR9wG7jiSTWgICKNU2YROfGA7mAwOGLb9uq+V7ZtrwaDwRGg+5T/2MdeYNA0zQnXdbcrliW5eFwW4nH5Ylniuu62aZoTwCDQewIA9JimOVGr1bbWSyV5lUjIa5BPIBsgRZC5REK2SiWp1WpbHqhHRGjxOukMh8OBD5bV8SwW4zCXo8cwCAJdQHckQmsuRzYW47NldYTD4QDQCRwB6uVyuR4IhWgT4bJhEFta4iB5n+/37hJeXkYzDAIitIVClMvlOlA/GiKgR6PRp19tu/kEZApkJZmU5t6eHO7syMcHSXmnkBcg67bdjEajTwH9eAtupVKp7re1OXpfHw3g96995LABF33st8AB0GoY/GxvdyqVShVwj3IgIiillrPZrH1naOjq5vg4N6csSo9TNHwt9D+fYGFllWsPHzEzM2MDy0cBPLbGgK7rYz/W1nYnIxGZNwxZ9V+QbyFN3ty4LvORiNSr1V1d18eAwKkceJCBdDo9WV1cbL70+2UWZE4hs36/bBYKzXQ6PQkMnBkkD6ABw/l8vrBRLMpiKiVvUynZKhYln88XgGFAOxfgQbo0TRvNZDLTjuOsOY6zlslkpjVNGwW6/vars65RKXUJuAX0e5INvBeR7VPef52zUkp5gz7X9AdrpYh10GpkSwAAACV0RVh0Y3JlYXRlLWRhdGUAMjAwOS0xMS0xNVQxNzowMjozNC0wNzowMLbnjhIAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTAtMDItMjBUMjM6MjY6MjYtMDc6MDC5XEH/AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDEwLTAxLTExVDA5OjI0OjQ3LTA3OjAwKXnFegAAAGd0RVh0TGljZW5zZQBodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvIG9yIGh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL0xHUEwvMi4xL1uPPGMAAAAldEVYdG1vZGlmeS1kYXRlADIwMDktMDMtMTlUMTA6NTI6NTEtMDY6MDB/aP0GAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAABN0RVh0U291cmNlAE94eWdlbiBJY29uc+wYrugAAAAndEVYdFNvdXJjZV9VUkwAaHR0cDovL3d3dy5veHlnZW4taWNvbnMub3JnL+83qssAAAAASUVORK5CYII=" />',

  onLoad: function() {
    // initialization code
    var self = this;
    this.DEBUG      = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    this.strings    = document.getElementById("gprivacy-strings");
    this.appcontent = document.getElementById("appcontent");
    this.anonlinks  = Services.prefs.getBoolPref("extensions.gprivacy.anonlinks"); this.lockedprop = "PATTERN";
    
    if (this.appcontent) {
        this.appcontent.addEventListener("DOMContentLoaded", function(e) { self.onPageLoad(e); }, false);
    }
    document.getElementById("contentAreaContextMenu")
            .addEventListener("popupshowing", function (e){ self.showContextMenu(e); }, false);
    window.addEventListener("unload", function() { self.onUnload(); }, false);
    
    Engines.initialize(this);
    
    this.debug("initialized!");
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

      var doc   = e.originalTarget;
      var repl  = Services.prefs.getBoolPref("extensions.gprivacy.replace");
    
      this.DEBUG      = Services.prefs.getBoolPref("extensions.gprivacy.debug");
      this.anonlinks  = Services.prefs.getBoolPref("extensions.gprivacy.anonlinks");

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
    else              link.innerHTML += mark;
    if (link !== orgLink) // original link is kept
    {
      if (orgLink.setMark) orgLink.setMark(orgMark);
      else                 orgLink.innerHTML += orgMark;
    }
  },
  
  changeLink: function(eng, doc, orgLink, repl) {
    if (orgLink.hasAttribute("gprivacy")) return; // already handled
    if (!this._isTracking(eng, doc, orgLink))   return; // maybe they're hiding too well...

    var link   = orgLink;
    var mark   = this.MARKHTML;
    var active = Services.prefs.getBoolPref("extensions.gprivacy.active");
    var verb   = Services.prefs.getBoolPref("extensions.gprivacy.text") ||
                 !Services.prefs.getBoolPref("extensions.gprivacy.mark");

    if (this.isActive(eng, doc)) {

      if (!repl) { // don't replace, append private link
        var priv = this._createLinkAnnot(eng, doc, orgLink, true);
        link     = this._cloneLink(eng, doc, orgLink);
        
        link.innerHTML = (verb ?  this.strings.getString("privateLink") : "");
        link.setAttribute("gprivacy", "true"); // mark as visited
        
        priv.setLink(link);
        this._insertLinkAnnot(eng, doc, orgLink, priv);
      } else {
        if (Services.prefs.getBoolPref("extensions.gprivacy.orig")) {
          // keep original link, too
          var orig = this._createLinkAnnot(eng, doc, orgLink, false);
          orgLink  = this._cloneLink(eng, doc, link);
          
          orgLink.innerHTML = (verb ? this.strings.getString("origLink") : "");
          orgLink.setAttribute("gprivacy", "true"); // mark as visited

          orig.setLink(orgLink);
          this._insertLinkAnnot(eng, doc, link, orig);
        }
      }
      this._removeTracking(eng, doc, link);
    }
    else
      mark = this.MARKORIG;

    if (Services.prefs.getBoolPref("extensions.gprivacy.mark") && active ) // Set icons
      this._setMarks(eng, doc, link, orgLink, mark, this.MARKORIG);

    if (active)
      link.setAttribute("gprivacy", "true"); // mark as visited
  },
  
  showContextMenu: function(e) {
    // show or hide the menuitem based on what the context menu is on
    var eng = Engines.find(gBrowser.selectedBrowser.currentURI.spec, false);
    document.getElementById("context-gprivacy").hidden = (eng == null);
  },

  onMenuItemCommand: function(e) {
    var args = { rc: null };
    window.openDialog("chrome://gprivacy/content/options.xul", "",
                      "chrome, dialog, modal, resizable=no", args).focus();
    if (args.rc)
      for (var i = 0; i < gBrowser.browsers.length; i++) {
        var b = gBrowser.getBrowserAtIndex(i);
        if (Engines.find(b.currentURI.spec, false) != null)
          b.reload();
      }
  },

  debug: function(txt) {
    if (this.DEBUG)
      Logging.log("DEBUG: " + txt);
  }

};

window.addEventListener("load", function () { gprivacy.onLoad(); }, false);
