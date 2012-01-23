Components.utils.import("resource://gre/modules/Services.jsm");

Components.utils.import("chrome://gprivacy/content/google.jsm");
Components.utils.import("chrome://gprivacy/content/yahoo.jsm");
Components.utils.import("chrome://gprivacy/content/bing.jsm");
Components.utils.import("chrome://gprivacy/content/facebook.jsm");
Components.utils.import("chrome://gprivacy/content/youtube.jsm");

Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "Engines" ];

//***************************************************************************
//* Default engine
//***************************************************************************
function gprivacyDefault(engines, instance) {
  this.engines = engines;
  this.gpr     = engines.gpr;
  
  this.CUSTOM  = this.gpr.lockedprop;
  
  if (instance) {
    this.instance = instance;
    for (var i in this._COPYPROPS)
      if (instance[this._COPYPROPS[i]])
        this[this._COPYPROPS[i]] = instance[this._COPYPROPS[i]];
  }
  else
    this.instance = null;
}

gprivacyDefault.prototype = {
  ID:        "default",
  NAME:      "Default",
  PATTERN:   /<PLEASEDONTMATCH>/, // 'abstract' class ;-)
  TRACKATTR:  [ "onmousedown", "dirtyhref" ],
  BAD_EVENTS: [ "mousedown", "mouseup", "mouseover", "mouseout",
                "click",     "focus",   "blur" ],
  LINK_CLASS: null,
  LINK_STYLE: null,

  _COPYPROPS: [ "TRACKATTR", "BAD_EVENTS", "LINK_CLASS", "LINK_STYLE" ],
  
  loggedIn: function(_doc) { return false; },
  
  refresh: function() {
    if (this.instance) {
      var custom = null;
      try { custom = Services.prefs.getCharPref("extensions.gprivacy.engines." + this.instance.ID + ".custom"); }
      catch (exc) {}
      if (custom) this.instance[this.CUSTOM] = new RegExp(custom);
    }
  },
  
  isTracking: function(_doc, link) {
    var is = false; // only for debugging...

    for (var i in this.TRACKATTR) {
      if (link.hasAttribute(this.TRACKATTR[i])) {
        is = true;
        if (!this.engines.DEBUG) break;
        this.engines.debug(this.TRACKATTR[i] + ": <" + link.href + "> " + link.getAttribute(this.TRACKATTR[i]));
      }
    }
    return is;
  },
  
  hasBadHandler: function(_doc, link) {
    var evts = EventUtils.getEvents(link) || {};
    for (var i = 0; i < this.BAD_EVENTS.length; i++) {
      if (this.BAD_EVENTS[i] in evts ||
          link.hasAttribute("on" + this.BAD_EVENTS[i]))
        return true;
    }
    return false;
  },
  
  cloneLink: function(_doc, link) {
    var neew = link.cloneNode(false);
    neew.setMark = function(elt) {
      this.appendChild(elt);
    }
    return neew;
  },
  
  createLinkAnnot: function(doc, _orgLink, _isReplacement) {
    var lclass = "gl";
    if (this.LINK_CLASS) lclass = this.LINK_CLASS;
    var lstyle = null;
    if (this.LINK_STYLE) lstyle = this.LINK_STYLE;
      
    var span = DOMUtils.create(doc, { node: "span", class: lclass, style: lstyle});
    // if this is prettier than span.innerHTML = "&nbsp;-&nbsp;"; ???
    // but if it makes reviewers happy...
    span.appendChild(doc.createTextNode("\u00A0-\u00A0"));
    span.setLink = function(link) {
      this.appendChild(link)
    }
    return span;
  },
  
  insertLinkAnnot: function(_doc, link, what) {
    return link.parentNode.insertBefore(what, link.nextSibling);
  },
  
  removeTracking: function(_doc, link) {
    for (var i in this.TRACKATTR) {
      if (link.hasAttribute(this.TRACKATTR[i]))
        link.removeAttribute(this.TRACKATTR[i]);
    }
    var evts = EventUtils.getEvents(link);
    // FIXME: stopping "click" events breaks Ctrl-Click!
//  if ("click" in evts)     EventUtils.stopEvent("click",     link);
    if ("mousedown" in evts) EventUtils.stopEvent("mousedown", link);
  },
  
  removeAll: function(_doc, link) {
    var evts = EventUtils.getEvents(link) || {};
    for (var i = 0; i < this.BAD_EVENTS.length; i++) {
      var evt  = this.BAD_EVENTS[i];
      var stop = null;
      if (evt in evts) {
        EventUtils.stopEvent(evt, link);
        this.engines.debug("Removed '" + evt + "' handler from '" + link.href + "'");
      }
      if (link.hasAttribute("on" + evt)) {
        link.removeAttribute("on" + evt);
        this.engines.debug("Removed 'on" + evt + "' from '" + link.href + "'");
      }
    }
  },
  
  removeGlobal:  function(_doc) {
    // see youtube.jsm
  }
  
};

function EngineError(txt, level) {
  if (level === undefined) level = 0
  this.message = txt;
  this.name    = "EngineError";
  var info = Logging.callerInfo(level+1);
  for (p in info)
    this[p] = info[p];
}

EngineError.prototype = new Error();
EngineError.prototype.constructor = EngineError;

//***************************************************************************
//***************************************************************************

var Engines = {
  _initialized: false,
  
  initialize: function(gprivacy) {
    if (this._initialized) throw new EngineError("Already initialized");
    this.DEBUG = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    var self   = this;

    this.gpr       = gprivacy;
    this.debug     = gprivacy.debug;
    this.register  = Components.utils.import;
    var stdEngines = [ new gprivacyGoogle(self), new gprivacyYahoo(self),
                       new gprivacyBing(self),   new gprivacyFacebook(self), 
                       new gprivacyYouTube(self)
                     ];
    this._engines     = {};
    this._initialized = true;
    this._load(stdEngines, "extensions.gprivacy.engines.custom");
    this._load = null; // add-ons must use Engines.add(..)
  },

  add: function(eng) {
    var self   = this;
    if (!this._initialized) throw new EngineError("Not initialized", 1);
    if (!("ID" in eng) || !("NAME" in eng))
      throw new EngineError("Invalid engine", 1)
    if (eng.ID in this._engines)
      Logging.warn("Engine '" + eng.NAME + "' will be replaced.")
    this.setPreferences(eng);
    eng.super   = new gprivacyDefault(self, eng);
    eng.call    = function(func, doc, p1, p2, p3, p4, p5) {
      return self.call(this, func, doc, p1, p2, p3, p4, p5);
    }
    this._engines[eng.ID] = eng;
    this.debug("Engine '" + eng.NAME + "' " + (eng.enabled ? "" : "not ") + "active for '" + eng.PATTERN.toString() + "'");
  },
  
  get: function() {
    if (!this._initialized) throw new EngineError("Not initialized", 1);
    return this._engines;
  },
  get engines() {
    return this.get();
  },
  
  get gprivacy() {
    if (!this._initialized) throw new EngineError("Not initialized", 1);
    return this.gpr;
  },
  
  setPreferences: function(eng) {
    eng.sameorigin = this.getEnginePref(eng, "own",     "bool", false);
    eng.enabled    = this.getEnginePref(eng, "enabled", "bool", true);
    eng.all        = this.getEnginePref(eng, "allevts", "bool", false);
  },
  
  getEnginePref: function(eng, name, type, dflt) { // get prefs with defaults, in case add-ons don't set them
    var pref = null; var prefs = { get: Services.prefs.getBoolPref, dflt: Services.prefs.setBoolPref };
    switch (type) {
      case "char":
        prefs = { get: Services.prefs.getCharPref, dflt: Services.prefs.setCharPref };
        break;
      case "bool": break;
      default:
        Logging.warn("Preference type '"+type+"' for '"+name+"', engine '"+eng.NAME+"' unknown. Assuming 'bool'.");
    }
    if (eng["PREF_"+name.toUpperCase()] !== undefined) dflt = eng["PREF_"+name.toUpperCase()];
    try   { pref = prefs.get("extensions.gprivacy.engines."+eng.ID+"."+name); }
    catch (exc) {}
    if (pref === null && dflt !== null) { pref = dflt; prefs.dflt("extensions.gprivacy.engines."+eng.ID+"."+name, pref); }
    return pref;
  },
  
  refresh: function(doc) {
    this.DEBUG = Services.prefs.getBoolPref("extensions.gprivacy.debug");
    for (var e in this.engines) {
      this.setPreferences(this._engines[e]);
      this._engines[e].call("refresh", doc);
    }
  },
  
  _load: function(stdEngines, settings) {
    for (var i in stdEngines)
      this.add(stdEngines[i]);
    
    var ret = {};
    var set = Services.prefs.getChildList(settings, ret);
    for (var c in set) {
      var name = Services.prefs.getCharPref(set[c]); ret = {};
      try { this.register(name, ret); for (var r in ret) this.add(new ret[r](this)); }
      catch (exc) { Logging.logException(exc); }
    }
    this.register = null;
  },
  
  find: function(href, enabledOnly, embedded) {
    var doc = null;
    if (href.nodeType && href.nodeType == href.DOCUMENT_NODE) {
      doc = href;
      href = doc.location.href;
    }
    for (var e in this.engines) {
      var eng   = this._engines[e];

      if (enabledOnly && !eng.enabled)
        continue;

      if (href.match(eng.PATTERN) != null)
        return eng;
    }
    if (doc != null && embedded) {
      var frames = { i: doc.getElementsByTagName("iframe"), f: doc.getElementsByTagName("frame") };
      for (var what in frames)
        for (var f = 0; f < frames[what].length; f++) {
          var emb = this.find(frames[what][f].contentDocument, enabledOnly, false);
          if (emb != null) return emb;
        }
    }
    return null;
  },
  
  call: function(eng, func, doc, p1, p2, p3, p4, p5) {
    var ret = null;
    try {
      if (eng[func]) ret = eng[func] (doc, p1, p2, p3, p4, p5); 
      else ret = undefined;
    }
    catch (exc) {
      Logging.logException(exc, "PRIVACY ENGINE ERROR: " + eng.NAME + "." + func)
      Logging.warn("PRIVACY WARNING: Trying to call generic method '" + func + "' after engine error");
      ret = undefined;
    }
    if (ret === undefined && eng.super[func])
      return eng.super[func](doc, p1, p2, p3, p4, p5);
    else if (!eng.super[func])
      Logging.error("Engine '" + eng.NAME + "' does not have a method '" + func + "', and there's no default method too...", false);
    return ret;
  },
  
};


