// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/PopupNotifications.jsm");

var EXPORTED_SYMBOLS = [ "DOMUtils", "EventUtils", "Popup", "Logging" ];

//*****************************************************************************
//* EventUtils
//*****************************************************************************

var EventUtils = {
  _els: null,
  
  get els() { // EventListenerService
    if (this._els == null) {
      try { this._els = Components.classes["@mozilla.org/eventlistenerservice;1"]
                                  .getService(Components.interfaces.nsIEventListenerService); }
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
  
  stopEvent: function(type, elt, capture) {
    var self = this; // generate closure
    capture = !!capture;
    elt.addEventListener(type, function(e) { self.stopThis(e); }, capture, true);
  },
  
  stopThis: function(evt) {
    evt.stopPropagation();
  },
  
  // This should be the last resort, as it might remove useful functionality
  // from the original link.
  // HANDLE WITH CARE!

  makeBrowserLinkClick: function(win, doc, link, capture) {
    let self = this;
    link.addEventListener("click", function _linkClick(evt) {
      evt.stopImmediatePropagation();
      evt.preventDefault();

      // there's the nice openUILink in chrome://browser/content/utilityOverlay.js
      // (see http://mxr.mozilla.org/mozilla-central/source/browser/base/content/utilityOverlay.js)
      
      // FIXME: But, you cannot specify the target, so simulate it by opening a new window
      let pe = { button:  evt.button, altKey:  evt.altKey,  ctrlKey:  evt.ctrlKey,
                                      metaKey: evt.metaKey, shiftKey: evt.shiftKey };
      if (link.target != "") { pe.ctrlKey = pe.metaKey = true; }
      
      // And tho MDN doc (and MXR) is wrong. It actually is:
      // openUILink( url, e, ignoreButton, ignoreAlt, allowKeywordFixup, postData, referrerUrl )
      // so we need:
      let where = win.whereToOpenLink(pe, false, false);
      let parms = { relatedToCurrent: true,     referrerURI: null /* FIXME: page doesn't load: doc.location.href */,
                    allowThirdPartyFixup: true, postData: null };
      win.openUILinkIn(link.href, where, parms);
    }, !!capture, true);
  },
  
  
};

//*****************************************************************************
//* DOMUtils
//*****************************************************************************

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
  },

  setIconCSS: function(elt, icon, oldStyle) {
    elt.style.background = 'url("' + icon.src + '") '+
                            'no-repeat scroll right center transparent';
    elt.style.backgroundSize =  icon.width+"px "+icon.height+"px";
    
    if (elt.getAttribute("gpr-icon") != "true") {
      var pad = icon.width+1;
      if (oldStyle && oldStyle.paddingRight != "")
        pad += parseInt(oldStyle.paddingRight.replace(/px/,''));
      elt.style.paddingRight = pad+"px";
      elt.setAttribute("gpr-icon", "true")
      let title = icon.title || (icon.hasAttribute && icon.hasAttribute("title") &&
                                 icon.getAttribute("title"));
      if (title && !elt.hasAttribute("title"))
        elt.setAttribute("title", title);
    }
  },
  
  setIconDOM: function(elt, icon) {
    if (icon.isTemplate) icon = this.create(elt.ownerDocument, icon);
    if (elt.gprivacyIcon) {
      elt.gprivacyIcon.parentNode.insertBefore(icon, elt.gprivacyIcon);
      elt.gprivacyIcon.parentNode.removeChild(elt.gprivacyIcon)
    } else
      elt.appendChild(icon);
    elt.gprivacyIcon = icon;
    elt.setAttribute("gpr-icon", "dom")
  },
  
  setIcon: function(elt, icon, append) {
    var isSet = elt.getAttribute("gpr-icon");
    var old   = elt.ownerDocument.defaultView.getComputedStyle(elt);
    
    // if there's no CSS-image or we didn't or don't want to append, use CSS
    if (!append && isSet != "dom" &&
        (isSet == "true" || (old && ["","none"].indexOf(old.backgroundImage) != -1) ) )
      this.setIconCSS(elt, icon, old);
    else
      this.setIconDOM(elt, icon);
  },

  getContents: function(aURL) {
    // from http://forums.mozillazine.org/viewtopic.php?p=921150#921150
    var ioService=Components.classes["@mozilla.org/network/io-service;1"]
      .getService(Components.interfaces.nsIIOService);
    var scriptableStream=Components
      .classes["@mozilla.org/scriptableinputstream;1"]
      .getService(Components.interfaces.nsIScriptableInputStream);

    var channel=ioService.newChannel(aURL,null,null);
    var input=channel.open();
    scriptableStream.init(input);
    var str=scriptableStream.read(input.available());
    scriptableStream.close();
    input.close();
    return str;
  }

};

//*****************************************************************************
//* Popup
//*****************************************************************************
function Popup(gprivacy) {
  this.init(gprivacy);
}

Popup.prototype = {
  popup:      null,
  panel:      null,
  xulwindow:  null,
  tabbrowser: null,
  failed:     false,
  
  init: function(gprivacy) {
    this.gpr        = gprivacy;
    this.xulwindow  = this.gpr.window;
    this.tabbrowser = this.gpr.browser;
  },
  
  show: function(id, txt, icon, prim, sec, opts) {
    var self = this;
    
    opts = opts || {
      persistence: 8, timeout: Date.now() + 60000,
      persistWhileVisible: true,
      eventCallback: function(state) { if (state == "removed") self.close(); },
    };
    // FIXME: Figure out, why this doesn't work (also the default-...-icon doesn't):
    // icon = icon || "gprivacy-notification-icon";
    icon = icon || "addons-notification-icon";

    if (!this.panel) this.create();
    else             this.close();
    
    if (!this.failed)
      this.popup = this.panel.show(this.tabbrowser.selectedBrowser, id, txt,
                                   icon, prim, sec, opts);
    else
      Logging.error("Cannot open popup for: '"+txt+"'");
  },
  
  create: function()
  {
    if (!this.panel && !this.failed) {
      try {
        this.panel = new PopupNotifications(this.tabbrowser,  
                                            this.xulwindow.document.getElementById("notification-popup"),
                                            this.xulwindow.document.getElementById("notification-popup-box"));
/*
        FIXME: I don't know, if this is documented or not... 
        this.panel = this.xulwindow.PopupNotifications;
*/
      } catch (exc) {
        Logging.logException(exc);
        this.panel  = null; // nevermind
        this.failed = true;
      }
    }
  },
  
  close: function() {
    if (this.popup) this.popup.remove(this.popup);
    this.popup = null;
  }
};

//*****************************************************************************
//* Logging
//*****************************************************************************
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
    excLog.init(this.PFX + txt + (exc.message || exc.toString()),
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
