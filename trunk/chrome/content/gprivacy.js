Components.utils.import("resource://gre/modules/Services.jsm");

Components.utils.import("chrome://gprivacy/content/google.jsm");
Components.utils.import("chrome://gprivacy/content/yahoo.jsm");
Components.utils.import("chrome://gprivacy/content/bing.jsm");
Components.utils.import("chrome://gprivacy/content/facebook.jsm");
Components.utils.import("chrome://gprivacy/content/youtube.jsm");

Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var gprivacy = {
  INSERT_EVT: "DOMNode" + "Inserted",
  TRACKATTR:  [ "onmousedown", "dirtyhref" ],
  DEBUG:      false,
  ENGINES:    [ ],
  MARKHTML:   '<img height=12 width=12 title="Privacy Respected!" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAG7AAABuwE67OPiAAAACXZwQWcAAAAQAAAAEABcxq3DAAACS0lEQVQ4y6WTT0iTcRjHP68pa85XN1SQWFCgghu0EnfoGNHJdusaOPTiabsIHh1BlAdRdrBLMFSK952W6E4GHko3yNpiTGQnXxzpsPZHyXRJPh1aMttu/uB3+fJ9Pvye5/d9FBHhMqe+lqgoSiPwAOgoS1ngnYj8rDKLyIULOFRVHU0kEpulUumkVCqdJBKJTVVVRwFHlb+isBcY9vl8s4VC4UCLa+IOusX9wi1aUpNCoXDg8/lmgWGg9wIA6Pb7/TPZbHY/uZMUT9AjPEWYRXiDMI14Xnok+TUp2Wx23+/3zwDdIkJduRPVbrer+ke93fXExXJuGaxAI9AGaodK7CyGa9KF/kVvt9vtKqAC54BcKpXK21QbclX+jrYRaAH1TGX11ipL95cQi2BTbaRSqTyQqwTkY7FYznnDKZyB9lBDu63RXN/Min2FVksr3lde+A3O606JxWI5IH/+jSJyqCjKtuXUYvS09dxc+LBA8HGQjaMNGq400P+6n/S1NI6ig6aTJiOdTm+LyGHlCwDi8+H5+MDdAfQ9Hf+cHwQ8Cx627m3BDxjqGyIcDseBeFUOALPVah3LfMscdY53CuMIkwifEeaQruku2f2+e2S1WscA87+6ugrQcbFYXJt6PrUYehQSc8kMv4D3YN4zE+oPycSzicVisbgmIsc1k1huaTASiaxHjah433rFu+iV6E5UIpHIOjAI1NVMYgWkxWQyjQQCAd0wjIxhGJlAIKCbTKYRoOV/v1JrGxVFaQDuAH1l6ROQEJHTKu9l1/kPlZNl+Gs4iZMAAAAldEVYdGNyZWF0ZS1kYXRlADIwMDktMTEtMTVUMTc6MDI6MzQtMDc6MDC2544SAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDEwLTAyLTIwVDIzOjI2OjI2LTA3OjAwuVxB/wAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxMC0wMS0xMVQwOToyNDo0NS0wNzowML7m1FMAAABndEVYdExpY2Vuc2UAaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMy4wLyBvciBodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9MR1BMLzIuMS9bjzxjAAAAJXRFWHRtb2RpZnktZGF0ZQAyMDA5LTAzLTE5VDEwOjUyOjUxLTA2OjAwf2j9BgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAATdEVYdFNvdXJjZQBPeHlnZW4gSWNvbnPsGK7oAAAAJ3RFWHRTb3VyY2VfVVJMAGh0dHA6Ly93d3cub3h5Z2VuLWljb25zLm9yZy/vN6rLAAAAAElFTkSuQmCC" />',
  MARKORIG:   '<img height=12 width=12 title="Privacy Violated!"  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAG7AAABuwE67OPiAAAACXZwQWcAAAAQAAAAEABcxq3DAAACTUlEQVQ4y6WTwUuTcRjHPz9bL0zdelmogQMJB8s3YiSMDl061mVeGuTNUdBF5D3s5mlCl/6BTpEYkq8OkjHFWxe36uBrrhmsS2/ZdBqMV0w0m3u6vIimdumB3+XL9/eB53m+jxIR/qd8Z4lKKR9wG7jiSTWgICKNU2YROfGA7mAwOGLb9uq+V7ZtrwaDwRGg+5T/2MdeYNA0zQnXdbcrliW5eFwW4nH5Ylniuu62aZoTwCDQewIA9JimOVGr1bbWSyV5lUjIa5BPIBsgRZC5REK2SiWp1WpbHqhHRGjxOukMh8OBD5bV8SwW4zCXo8cwCAJdQHckQmsuRzYW47NldYTD4QDQCRwB6uVyuR4IhWgT4bJhEFta4iB5n+/37hJeXkYzDAIitIVClMvlOlA/GiKgR6PRp19tu/kEZApkJZmU5t6eHO7syMcHSXmnkBcg67bdjEajTwH9eAtupVKp7re1OXpfHw3g96995LABF33st8AB0GoY/GxvdyqVShVwj3IgIiillrPZrH1naOjq5vg4N6csSo9TNHwt9D+fYGFllWsPHzEzM2MDy0cBPLbGgK7rYz/W1nYnIxGZNwxZ9V+QbyFN3ty4LvORiNSr1V1d18eAwKkceJCBdDo9WV1cbL70+2UWZE4hs36/bBYKzXQ6PQkMnBkkD6ABw/l8vrBRLMpiKiVvUynZKhYln88XgGFAOxfgQbo0TRvNZDLTjuOsOY6zlslkpjVNGwW6/vars65RKXUJuAX0e5INvBeR7VPef52zUkp5gz7X9AdrpYh10GpkSwAAACV0RVh0Y3JlYXRlLWRhdGUAMjAwOS0xMS0xNVQxNzowMjozNC0wNzowMLbnjhIAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTAtMDItMjBUMjM6MjY6MjYtMDc6MDC5XEH/AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDEwLTAxLTExVDA5OjI0OjQ3LTA3OjAwKXnFegAAAGd0RVh0TGljZW5zZQBodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvIG9yIGh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL0xHUEwvMi4xL1uPPGMAAAAldEVYdG1vZGlmeS1kYXRlADIwMDktMDMtMTlUMTA6NTI6NTEtMDY6MDB/aP0GAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAABN0RVh0U291cmNlAE94eWdlbiBJY29uc+wYrugAAAAndEVYdFNvdXJjZV9VUkwAaHR0cDovL3d3dy5veHlnZW4taWNvbnMub3JnL+83qssAAAAASUVORK5CYII=" />',
  BAD_EVENTS: [ "mousedown", "mouseup", "mouseover", "mouseout",
                "click",     "focus",   "blur" ],

  onLoad: function() {
    // initialization code
    var self = this;
    this.DEBUG      = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    this.strings    = document.getElementById("gprivacy-strings");
    this.con        = Services.console;
    this.appcontent = document.getElementById("appcontent");
    this.anonlinks  = Services.prefs.getBoolPref("extensions.gprivacy.anonlinks");
    
    if (this.appcontent) {
        this.appcontent.addEventListener("DOMContentLoaded", function(e) { self.onPageLoad(e); }, false);
    }
    this.ENGINES = [ new gprivacyGoogle(this), new gprivacyYahoo(this),
                     new gprivacyBing(this),   new gprivacyFacebook(this), 
                     new gprivacyYouTube(this)
                   ];
    document.getElementById("contentAreaContextMenu")
            .addEventListener("popupshowing", function (e){ self.showContextMenu(e); }, false);
    window.addEventListener("unload", function() { self.onUnload(); }, false);
    this.debug("initialized!");
    this.initialized = true;
  },

  onUnload: function() {
    if(this.appcontent)
    {
        this.appcontent.removeEventListener("DOMContentLoaded", function(e) { self.onPageLoad(e); }, false);
        this.appcontent = null;
    }
  },
  
  onPageLoad: function(e) {
    var self = this;

    var doc   = e.originalTarget;
    var repl  = Services.prefs.getBoolPref("extensions.gprivacy.replace");
    
    this.DEBUG      = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    this.anonlinks  = Services.prefs.getBoolPref("extensions.gprivacy.anonlinks");

    var eng = this.findEngine(doc.location.href, true)

    if (eng != null) {
      this.debug("page '" + doc.location.href + "' matched engine " + eng.NAME);

      var links = doc.getElementsByTagName("a");
      
      for (var i = 0; i < links.length; i++)
          this.changeLink(eng, doc, links[i], repl);

      doc.addEventListener(this.INSERT_EVT, function(e) { self.onNodeInserted(e, eng); }, false);
    }
  },
  
  onNodeInserted:  function(e, eng) {
    var doc = e.currentTarget;
    var elt = e.originalTarget
    if (elt.nodeName == "#text") return;
    var repl  = Services.prefs.getBoolPref("extensions.gprivacy.replace");
    var links = elt.getElementsByTagName("a");
    // doc.removeEventListener(this.INSERT_EVT, gprivacy.onNodeInserted, false);

    for (var i = 0; i < links.length; i++)
        this.changeLink(eng, doc, links[i], repl);

  },
  
  isTracking: function(eng, doc, link) {
    var is = false; // only for debugging...

    for (var i in eng.TRACKATTR) {
      if (link.hasAttribute(eng.TRACKATTR[i])) {
        is = true;
        if (!this.DEBUG) break;
        this.debug(eng.TRACKATTR[i] + ": <" + link.href + "> " + link.getAttribute(eng.TRACKATTR[i]));
      }
    }
    return is;
  },
  
  _isTracking: function(eng, doc, link) {
    if (eng.sameorigin && doc.location.hostname == link.hostname)
      return false;

    if (link.hostname == "" && !this.anonlinks)
      return false;

    var is = this.engineCall(eng, "isTracking", doc, link);

    if (eng.all)
      return is || this.hasBadHandler(eng, doc, link);

    return is;
  },
    
  
  findEngine: function(href, enabledOnly) {
    for (var e in this.ENGINES) {
      var eng   = this.ENGINES[e];

      if (enabledOnly &&
          !Services.prefs.getBoolPref("extensions.gprivacy.engines."+eng.ID+".enabled"))
        continue;

      if (href.match(new RegExp(eng.PATTERN)) != null) {
        eng.all        = Services.prefs.getBoolPref("extensions.gprivacy.engines."+eng.ID+".allevts")
        eng.sameorigin = Services.prefs.getBoolPref("extensions.gprivacy.engines."+eng.ID+".own")
        return eng;
      }
    }
    return null;
  },
  
  hasBadHandler: function(eng, doc, link) {
    var evts = EventUtils.getEvents(link) || {};
    for (var i = 0; i < this.BAD_EVENTS.length; i++) {
      if (this.BAD_EVENTS[i] in evts ||
          link.hasAttribute("on" + this.BAD_EVENTS[i]))
        return true;
    }
    return false;
  },
  
  engineCall: function(eng, func, doc, p1, p2, p3, p4, p5) {
    if (eng[func]) return eng[func] (     doc, p1, p2, p3, p4, p5);
    else           return this[func](eng, doc, p1, p2, p3, p4, p5);
  },
  
  removeTracking: function(eng, doc, link) {
    for (var i in eng.TRACKATTR) {
      if (link.hasAttribute(eng.TRACKATTR[i]))
        link.removeAttribute(eng.TRACKATTR[i]);
    }
    EventUtils.stopEvent("click",     link);
    EventUtils.stopEvent("mousedown", link);
  },
  
  _removeTracking: function(eng, doc, link) {
    if (eng.all)            return this._removeAll(eng, doc, link);
    return this.engineCall(eng, "removeTracking", doc, link);
  },
  
  removeAll: function(_eng, doc, link) {
    var evts = EventUtils.getEvents(link) || {};
    for (var i = 0; i < this.BAD_EVENTS.length; i++) {
      var evt  = this.BAD_EVENTS[i];
      var stop = null;
      if (evt in evts) {
        EventUtils.stopEvent(evt, link);
        this.debug("Removed '" + evt + "' handler from '" + link.href + "'");
      }
      if (link.hasAttribute("on" + evt)) {
        link.removeAttribute("on" + evt);
        this.debug("Removed 'on" + evt + "' from '" + link.href + "'");
      }
    }
  },
  _removeAll: function(eng, doc, link) { return this.engineCall(eng, "removeAll", doc, link); },

  isActive: function(eng, doc) {
    return Services.prefs.getBoolPref("extensions.gprivacy.active") &&
      (Services.prefs.getBoolPref("extensions.gprivacy.active.loggedin") ||
       !this._loggedIn(eng, doc) )
  },
  
  loggedIn: function(_eng, doc) {
    return false;
  },
  _loggedIn: function(eng, doc) { return this.engineCall(eng, "loggedIn", doc); },
  
  cloneLink: function(_eng, doc, link) {
    return link.cloneNode(false);
  },
  _cloneLink: function(eng, doc, link) { return this.engineCall(eng, "cloneLink", doc, link); },
  
  insertLinkAnnot: function(_eng, doc, link, what) {
    return link.parentNode.insertBefore(what, link.nextSibling);
  },
  _insertLinkAnnot: function(eng, doc, link, what) { return this.engineCall(eng, "insertLinkAnnot", doc, link, what); },
  
  changeLink: function(eng, doc, orgLink, repl) {
    if (orgLink.hasAttribute("gprivacy")) return; // already handled
    if (!this._isTracking(eng, doc, orgLink))   return; // maybe they're hiding too well...

    var link   = orgLink;
    var mark   = this.MARKHTML;
    var active = Services.prefs.getBoolPref("extensions.gprivacy.active");
    var verb   = Services.prefs.getBoolPref("extensions.gprivacy.text") ||
                 !Services.prefs.getBoolPref("extensions.gprivacy.mark");

    if (this.isActive(eng, doc)) {

      var lclass = "gl";
      if (eng.LINK_CLASS) lclass = eng.LINK_CLASS;
      var lstyle = null;
      if (eng.LINK_STYLE) lstyle = eng.LINK_STYLE;
      
      if (!repl) {
        var span = doc.createElement("span");
        span.setAttribute("class", lclass);
        span.setAttribute("style", lstyle);
        span.innerHTML = "&nbsp;-&nbsp;";
        
        link = this._cloneLink(eng, doc, orgLink);
        
        if (verb) link.innerHTML = this.strings.getString("privateLink");
        else      link.innerHTML = "";
        link.setAttribute("gprivacy", "true"); // mark as visited
        span.appendChild(link);
        this._insertLinkAnnot(eng, doc, orgLink, span);
      } else {
        if (Services.prefs.getBoolPref("extensions.gprivacy.orig")) {
          var span = doc.createElement("span");
          span.setAttribute("class", lclass);
          span.setAttribute("style", lstyle);
          span.innerHTML = "&nbsp;-&nbsp;";
          
          orgLink = this._cloneLink(eng, doc, link);
          
          if (verb) orgLink.innerHTML = this.strings.getString("origLink");
          else      orgLink.innerHTML = "";
          orgLink.setAttribute("gprivacy", "true"); // mark as visited
          span.appendChild(orgLink);
          this._insertLinkAnnot(eng, doc, link, span);
        }
      }
      this._removeTracking(eng, doc, link);
    }
    else
      mark = this.MARKORIG;

    if (Services.prefs.getBoolPref("extensions.gprivacy.mark") && active ) {
      link.innerHTML += mark;
      if (link !== orgLink)
        orgLink.innerHTML += this.MARKORIG;
    }
    if (active)
      link.setAttribute("gprivacy", "true"); // mark as visited
  },
  
  showContextMenu: function(e) {
    // show or hide the menuitem based on what the context menu is on
    var eng = this.findEngine(gBrowser.selectedBrowser.currentURI.spec, false);
    document.getElementById("context-gprivacy").hidden = (eng == null);
  },

  onMenuItemCommand: function(e) {
    var args = { rc: null };
    window.openDialog("chrome://gprivacy/content/options.xul", "",
                      "chrome, dialog, modal, resizable=no", args).focus();
    if (args.rc)
      for (var i = 0; i < gBrowser.browsers.length; i++) {
        var b = gBrowser.getBrowserAtIndex(i);
        if (this.findEngine(b.currentURI.spec, false) != null)
          b.reload();
      }
  },

  log: function(txt) {
    this.con.logStringMessage("gprivacy: " + txt);
  },
  
  debug: function(txt) {
    if (this.DEBUG)
      this.log("DEBUG: " + txt);
  }
};

window.addEventListener("load", function () { gprivacy.onLoad(); }, false);
