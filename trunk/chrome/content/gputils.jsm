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
    elt.addEventListener(type, function(e) { self.stopThis(e); });
  },
  
  stopThis: function(evt) {
    evt.stopPropagation();
  }
};

var DOMUtils = {
  create: function(doc, def) {
    var elt = doc.createElement(def.node);
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

  callerInfo: function(level) { // should
    if (!level) level = 0;
    // see https://github.com/eriwen/javascript-stacktrace/blob/master/stacktrace.js
    var info = new CallerInfo();
    try { this.undef() }
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
    Services.console.logStringMessage("gprivacy: " + txt);
  },
  
  logException: function(exc, txt) {
    txt = txt ? txt + ": " : ""
    var excLog = Components.classes["@mozilla.org/scripterror;1"]
                           .createInstance(Components.interfaces.nsIScriptError);
    excLog.init(txt + exc.message,
                exc.filename || exc.fileName, exc.location ? exc.location.sourceLine : null,
                exc.lineNumber, exc.columnNumber,
                excLog.errorFlag, "gprivacy");
    Services.console.logMessage(excLog);
  },
  
  warn: function(txt, showSrcInfo) {
    var warn = Components.classes["@mozilla.org/scripterror;1"]
                         .createInstance(Components.interfaces.nsIScriptError);
    var info = showSrcInfo ? this.callerInfo(1) : new CallerInfo();
    warn.init(txt, info.filename, info.sourceLine, info.lineNumber, info.columnNUmber,
              warn.warningFlag, "gprivacy");
    Services.console.logMessage(warn);
  },
  
  error: function(txt, showSrcInfo) {
    var err = Components.classes["@mozilla.org/scripterror;1"]
                        .createInstance(Components.interfaces.nsIScriptError);
    if (showSrcInfo === undefined) showSrcInfo = true;
    var info = showSrcInfo ? this.callerInfo(1) : new CallerInfo();
    err.init(txt, info.filename, info.sourceLine, info.lineNumber, info.columnNUmber,
             err.errorFlag, "gprivacy");
    Services.console.logMessage(err);
  },
  
};
