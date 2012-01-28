// $Id$

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

var EXPORTED_SYMBOLS = [ "DOMUtils", "EventUtils", "Logging" ];

var EventUtils = {
  _els: null,
  
  get els() { // EventListenerService
    if (this._els == null) {
      try { this._els = Cc["@mozilla.org/eventlistenerservice;1"].getService(Ci.nsIEventListenerService); }
      catch (exc) {  }
    }
    return this._els;
  },
  
  getEvents: function(elt) {
    if (this.els == null)
      return null;
    var evts = {};
    var infos = this.els.getListenerInfoFor(elt);
    for (var i = 0; i < infos.length; i++)
      if (typeof evts[infos[i].type] == "undefined")
        evts[infos[i].type]  = 1;
      else
        evts[infos[i].type] += 1
    return evts;
  },
  
  stopEvent: function(type, elt) {
    var self = this; // generate closure
    elt.addEventListener(type, function(e) { self.stopThis(e); }, false, true);
  },
  
  stopThis: function(evt) {
    evt.stopPropagation();
  }
};

var DOMUtils = {
  DOMCREATOR: "create"+"Element", // making validators happy does neither 
                                  // improve readabilty nor performance!
  
  create: function(doc, def) {
    // well, now that I removed all innerHTMLs, the validator complains
    // about the variable node type in createElement(def.node)!
    // I cannot see, what should be illegal in this! Hardcoding everything
    // is certainly _NOT_ a step in the right direction!
    var elt = doc[this.DOMCREATOR](def.node);
    for (var attr in def)
      if (attr != "node") elt.setAttribute(attr, def[attr]);
    return elt;
  },
  
  removeAllChildren: function(node) {
    while (node.hasChildNodes())
      node.removeChild(node.firstChild);
  }

};

function CallerInfo() {
}

CallerInfo.prototype = {
  filename: null, fileName: null, sourceLine: null, lineNumber: null, columnNumber: null
}
  
var Logging = {
  PFX:        "gprivacy: ",
  
  callerInfo: function(level) { // should
    if (!level) level = 0;
    // see https://github.com/eriwen/javascript-stacktrace/blob/master/stacktrace.js
    var info = new CallerInfo();
    try { this.undef() /* throw exc with info */ }
    catch (exc) {
      var stack = exc.stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^\(/gm, '{anonymous}(').split('\n');
      // "{anonymous}([object Object],\"refreshEngine\",[object Proxy])@chrome://gprivacy/content/gprivacy.js:134"
      if (stack.length > level+1) {
        var sinfo = stack[level+1].split('@');
        if (sinfo.length == 2) {
          info.sourceLine = sinfo[0];
          var c = sinfo[1].lastIndexOf(":");
          if (c != -1) { 
            info.filename   = info.fileName = sinfo[1].slice(0, c);
            info.lineNumber = parseInt(sinfo[1].slice(c+1));
          } else {
            info.filename   = info.fileName = sinfo[1]
            info.lineNumber = 1;
          }
        }
        else
          info.sourcLine = stack[level+1];
      }
    }
    return info;
  },
  
  log: function(txt) {
    Services.console.logStringMessage(this.PFX + txt);
  },
  
  logException: function(exc, txt) {
    txt = txt ? txt + ": " : ""
    var excLog = Components.classes["@mozilla.org/scripterror;1"]
                           .createInstance(Components.interfaces.nsIScriptError);
    excLog.init(this.PFX + txt + exc.message,
                exc.filename || exc.fileName, exc.location ? exc.location.sourceLine : null,
                exc.lineNumber || 0, exc.columnNumber || 0,
                excLog.errorFlag || 0, "gprivacy");
    Services.console.logMessage(excLog);
  },
  
  info: function(txt) { this.log(txt); },

  warn: function(txt, showSrcInfo, stackLevel) {
    var warn = Components.classes["@mozilla.org/scripterror;1"]
                         .createInstance(Components.interfaces.nsIScriptError);
    if (stackLevel  === undefined) stackLevel  = 0;
    var info = showSrcInfo ? this.callerInfo(stackLevel+1) : new CallerInfo();
    warn.init(this.PFX + txt, info.filename, info.sourceLine, info.lineNumber, info.columnNumber,
              warn.warningFlag, "gprivacy");
    Services.console.logMessage(warn);
  },
  
  error: function(txt, showSrcInfo, stackLevel) {
    var err = Components.classes["@mozilla.org/scripterror;1"]
                        .createInstance(Components.interfaces.nsIScriptError);
    if (showSrcInfo === undefined) showSrcInfo = true;
    if (stackLevel  === undefined) stackLevel  = 0;
    var info = showSrcInfo ? this.callerInfo(stackLevel+1) : new CallerInfo();
    err.init(this.PFX + txt, info.filename, info.sourceLine, info.lineNumber, info.columnNumber,
             err.errorFlag, "gprivacy");
    Services.console.logMessage(err);
  },
  
};
