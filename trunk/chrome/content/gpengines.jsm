// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");

Components.utils.import("chrome://gprivacy/content/google.jsm");
Components.utils.import("chrome://gprivacy/content/yahoo.jsm");
Components.utils.import("chrome://gprivacy/content/bing.jsm");
Components.utils.import("chrome://gprivacy/content/facebook.jsm");
Components.utils.import("chrome://gprivacy/content/youtube.jsm");

Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "Engines", "gBrowserEngines" ];

var UID = 0;

var gBrowserEngines = [];

//***************************************************************************
//* Default engine
//***************************************************************************
function gprivacyDefault(engines, instance) {
  this.engines = engines;
  this.gpr     = engines.gpr;
  
  this.CUSTOM  = this.gpr.lockedprop;
  
  if (instance) {
    // manual subclassing...
    this.instance = instance;
    for (let i in this._COPYPROPS)
      if (instance[this._COPYPROPS[i]])
        this[this._COPYPROPS[i]]     = instance[this._COPYPROPS[i]];
      else
        instance[this._COPYPROPS[i]] = this[this._COPYPROPS[i]];
  }
  else
    this.instance = null;
}

gprivacyDefault.prototype = {
  ID:        "default",
  UID:       UID,
  NAME:      "Default",
  PATTERN:   /<PLEASEDONTMATCH>/, // 'abstract' class ;-)
  TRACKATTR:  [ "onmousedown", "dirtyhref" ],
  BAD_EVENTS: [ "mousedown", "mouseup", "mouseover", "mouseout",
                "click",     "focus",   "blur" ],
  LINK_CLASS: null,
  LINK_STYLE: null,

  _COPYPROPS: [ "TRACKATTR", "BAD_EVENTS", "LINK_CLASS", "LINK_STYLE" ],
  
  loggedIn: function(_doc) { return false; },
  
  close: function() {
  },
  
  refresh: function(_doc) {
    if (this.instance) {
      let custom = null;
      try { custom = Services.prefs.getCharPref("extensions.gprivacy.engines." + this.instance.ID + ".custom"); }
      catch (exc) {}
      if (custom) this.instance[this.CUSTOM] = new RegExp(custom);
    }
  },
  
  isTracking: function(_doc, link) {
    let is = false; // only for debugging...

    for (let i in this.TRACKATTR) {
      if (link.hasAttribute(this.TRACKATTR[i])) {
        is = true;
        if (!this.gpr.DEBUG) break;
        this.gpr.debug(this.TRACKATTR[i] + ": <" + link.href + "> " + link.getAttribute(this.TRACKATTR[i]));
      }
    }
    return is;
  },
  
  hasBadHandler: function(_doc, link) {
    let evts = EventUtils.getEvents(link) || {};
    for (let i = 0; i < this.BAD_EVENTS.length; i++) {
      if (this.BAD_EVENTS[i] in evts ||
          link.hasAttribute("on" + this.BAD_EVENTS[i]))
        return true;
    }
    return false;
  },
  
  cloneLink: function(_doc, link) {
    let neew = link.cloneNode(true);
    neew.setIcon = function(elt) {
      DOMUtils.setIcon(neew, elt);
    }
    return neew;
  },
  
  createLinkAnnot: function(doc, _orgLink, _isReplacement) {
    let lclass = "gl";
    if (this.LINK_CLASS) lclass = this.LINK_CLASS;
    let lstyle = null;
    if (this.LINK_STYLE) lstyle = this.LINK_STYLE;
      
    let span = DOMUtils.create(doc, { node: "span", class: lclass, style: lstyle});
    // if this is prettier than span.innerHTML = "&nbsp;-&nbsp;"; ???
    // but if it makes reviewers happy...
    span.appendChild(doc.createTextNode("\u00A0-\u00A0"));
    span.setLink = function(link) {
      this.appendChild(link)
    }
    return span;
  },
  
  replaceLink: function(_doc, link, neew) {
    return link.parentNode.replaceChild(neew, link);
  },
  
  insertLinkAnnot: function(_doc, link, what) {
    return link.parentNode.insertBefore(what, link.nextSibling);
  },
  
  removeTracking: function(_doc, link, _replaced) {
    for (let i in this.TRACKATTR) {
      if (link.hasAttribute(this.TRACKATTR[i]))
        link.removeAttribute(this.TRACKATTR[i]);
    }
    let evts = EventUtils.getEvents(link);
    // FIXME: stopping "click" events breaks Ctrl-Click!
//  if ("click" in evts)     EventUtils.stopEvent("click",     link);
    if ("mousedown" in evts) EventUtils.stopEvent("mousedown", link);
  },
  
  removeAll: function(_doc, link, _replaced) {
    let evts = EventUtils.getEvents(link) || {};
    for (let i = 0; i < this.BAD_EVENTS.length; i++) {
      let evt  = this.BAD_EVENTS[i];
      let stop = null;
      if (evt in evts) {
        EventUtils.stopEvent(evt, link);
        this.gpr.debug("Removed '" + evt + "' handler from '" + link.href + "'");
      }
      if (link.hasAttribute("on" + evt)) {
        link.removeAttribute("on" + evt);
        this.gpr.debug("Removed 'on" + evt + "' from '" + link.href + "'");
      }
    }
  },
  
  removeGlobal: function(_doc) {
    // see youtube.jsm
    return 0;
  },
  
  changemonIgnored: function(_doc, _link, _evt) {
    return false;
  },

  _toString: function() {
    let self = this.instance || this;
    return "["+self.NAME+",{ID:'"+self.ID+",UID:"+self.UID+"}]";
  }
};

function EngineError(txt, level) {
  if (level === undefined) level = 0
  this.message = txt;
  this.name    = "EngineError";
  let info = Logging.callerInfo(level+1);
  for (let p in info)
    this[p] = info[p];
}

EngineError.prototype = new Error();
EngineError.prototype.constructor = EngineError;

//***************************************************************************
//*
//*
//***************************************************************************
var gEngineClasses = [ gprivacyGoogle, gprivacyYahoo,
                       gprivacyBing,   gprivacyFacebook, 
                       gprivacyYouTube
                     ];

function Engines(gprivacy) {
  this.initialize(gprivacy);
}

Engines.prototype = {
  _initialized: false,
  UID:          0,
  
  initialize: function(gprivacy) {
    if (this._initialized) throw new EngineError("Already initialized");
    let self   = this;

    this.gpr       = gprivacy;
    this.debug     = gprivacy.debug.bind(gprivacy);
    this.register  = Components.utils.import;
    let stdEngines = [];

    for (let i in gEngineClasses) {
      let Class = gEngineClasses[i];
      try { stdEngines.push(new Class(this)); }
      catch (exc) { Logging.logException(exc, "Engine '"+Class.prototype.NAME+"' (id: '"+Class.prototype.ID+"') failed to initialize"); }
    }
    this._engines     = {};
    this._initialized = true;
    this._load(stdEngines, "extensions.gprivacy.engines.custom");
    this._load = null; // add-ons must use Engines.add(..)
    gBrowserEngines.push(this);
    this.debug("Engines instance initialized");
  },

  add: function(eng) {
    let self   = this;
    if (!this._initialized) throw new EngineError("Not initialized", 1);
    if (!("ID" in eng) || !("NAME" in eng))
      throw new EngineError("Invalid engine", 1)
    this.setPreferences(eng);
    eng.super   = new gprivacyDefault(self, eng);
    eng.UID     = ++UID;
    eng.call    = function(func, doc, p1, p2, p3, p4, p5) {
      return self.call(this, func, doc, p1, p2, p3, p4, p5);
    }
    eng.toString = function() {
        return self.call(this, "_toString");
    };
    if (eng.ID in this._engines) {
      Logging.warn("Engine '"+eng+"' will be replaced.");
      this._closeEngine(eng.ID);
    }
    this._engines[eng.ID] = eng;
    this.debug("Engine "+eng+" "+(eng.enabled ? "" : "not ")+"active for '"+eng.PATTERN.toString()+"'");
  },
  
  addClass: function(engClass) {
    if (gEngineClasses.indexOf(engClass) == -1) {
      gEngineClasses.push(engClass);
      if (this._initialized)
        this.add(new engClass(this));
    } else {
      try { this.debug("Engine class for '"+engClass.prototype.ID+"' already registered"); } catch (exc) {}
    }
  },
  
  removeClass: function(engClass) {
    for (let e in this._engines) {
      try {
        if (this._engines[e] instanceof engClass)
          this._closeEngine(this._engines[e].ID);
      } catch (exc) {
        Logging.logException(exc);
      }
    }
    if (gEngineClasses.indexOf(engClass) != -1)
      gEngineClasses.splice(gEngineClasses.indexOf(engClass), 1);
  },
  
  _closeEngine: function(id) {
    try {
      let eng = this._engines[id];
      this.debug("Closing engine "+eng);
      eng.call("close");
      delete eng.call;    delete eng.UID; delete eng.super;
      delete eng.enabled; delete eng.all; delete eng.sameorigin;
      delete this._engines[id];
    } catch (exc) {
      Logging.logException(id);
    }
  },
  
  close: function() {
    for (let id in this.engines)
      this._closeEngine(id);

    let me = gBrowserEngines.indexOf(this);
    if (me >= 0) gBrowserEngines.splice(me, 1);
    else         Logging.error("Engine collection not found. How did this happen?");
    this.debug("Engine collection closed");
  },
  
  remove: function(eng) { this._closeEngine(eng.ID); },
  
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
    let pref = null; let prefs = { get: Services.prefs.getBoolPref, dflt: Services.prefs.setBoolPref };
    switch (type) {
      case "char":
        prefs = { get: Services.prefs.getCharPref, dflt: Services.prefs.setCharPref };
        break;
      case "bool": break;
      default:
        Logging.warn("Preference type '"+type+"' for '"+name+"', engine '"+eng+"' unknown. Assuming 'bool'.");
    }
    if (eng["PREF_"+name.toUpperCase()] !== undefined) dflt = eng["PREF_"+name.toUpperCase()];
    try   { pref = prefs.get("extensions.gprivacy.engines."+eng.ID+"."+name); }
    catch (exc) {}
    if (pref === null && dflt !== null) { pref = dflt; prefs.dflt("extensions.gprivacy.engines."+eng.ID+"."+name, pref); }
    return pref;
  },
  
  refresh: function(doc) {
    for (let e in this.engines) {
      this.setPreferences(this._engines[e]);
      this._engines[e].call("refresh", doc);
    }
  },
  
  _load: function(stdEngines, settings) {
    for (let i in stdEngines)
      this.add(stdEngines[i]);
    
    let ret = {}, reg;
    let set = Services.prefs.getChildList(settings, ret);
    for (let c in set) {
      let name = Services.prefs.getCharPref(set[c]); ret = {};
      try { this.register(name, ret); for (let r in ret) { reg = new ret[r](this); this.add(reg); } }
      catch (exc) { Logging.logException(exc, "Error registering '"+name+"'"); }
    }
    this.register = null;
  },
  
  find: function(href, enabledOnly, embedded) {
    let doc = null;
    if (href.nodeType && href.nodeType == href.DOCUMENT_NODE) {
      doc = href;
      href = doc.location.href;
    }
    for (let e in this.engines) {
      let eng   = this._engines[e];

      if (enabledOnly && !eng.enabled)
        continue;

      if (href.match(eng.PATTERN) != null)
        return eng;
    }
    if (doc != null && embedded) {
      let frames = { i: doc.getElementsByTagName("iframe"), f: doc.getElementsByTagName("frame") };
      for (let what in frames)
        for (let f = 0; f < frames[what].length; f++) {
          let emb = this.find(frames[what][f].contentDocument, enabledOnly, false);
          if (emb != null) return emb;
        }
    }
    return null;
  },
  
  call: function(eng, func, doc, p1, p2, p3, p4, p5) {
    let ret = null;
    try {
      let f = eng[func];
      if (f) ret = f.call(eng, doc, p1, p2, p3, p4, p5); 
      else ret = undefined;
    }
    catch (exc) {
      Logging.logException(exc, "PRIVACY ENGINE ERROR: " +eng+"."+func)
      Logging.warn("PRIVACY WARNING: Trying to call generic method '" + func + "' after engine error");
      ret = undefined;
    }
    let superf = eng.super[func];
    if (ret === undefined && superf)
      return superf.call(eng, doc, p1, p2, p3, p4, p5);
    else if (!superf)
      Logging.error("Engine '"+eng+"' does not have a method '"+func+"', and there's no default method too...", false);
    return ret;
  },
  
};


