// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyBing" ];

function gprivacyBing(engines) {
  this.engines = engines;
  this.gpr     = engines.gpr;
  
  this.PATTERN = /https?:\/\/(\w+\.)*?(bing|(mail\.live))\.\w+\//
}

gprivacyBing.prototype = {
  ID:         "bing",
  NAME:       "Bing",
  TRACKATTR:  [ "onmousedown" ],
  LINK_CLASS: "sb_meta",
  
  loggedIn: function(doc) {
    var logout = doc.evaluate('count(//a[@href[contains(.,"logout.srf")]])', doc, null,
                              Components.interfaces.nsIDOMXPathResult.ANY_TYPE, null );
    return logout.numberValue > 0;
  },

  isTracking: function(doc, link) {
    return this.super.isTracking(doc, link) ||
           (/mail\.live\./.test(doc.location.host) &&
            link.target && link.target == "_blank");
  },
  
  removeTracking: function(doc, link) {
    this.super.removeTracking(doc, link);
    if (/mail\.live\./.test(doc.location.host)) {
      EventUtils.stopEvent("mousedown", link, true);
      EventUtils.stopEvent("mouseup", link, true);
      EventUtils.stopEvent("focus", link, true);
      if (link.onclick && /onClickUnsafeLink/.test(link.onclick)) {
        var onclick = link.onclick;
        link.onclick = function(e) {
          doc.defaultView.alert("If you don't want to be tracked, press 'Cancel' on\n"+
                                "the next prompt, and allow content manually!");
          onclick(e);
        }
        EventUtils.stopEvent("click", link, true);
      }
      else
        EventUtils.makeBrowserLinkClick(this.gpr.window, doc, link, true);
    }
  },
  
  removeGlobal: function(doc) {
    if (/mail\.live\./.test(doc.location.host)) {
      return 1;
    }
    return 0;
  },
  
  insertLinkAnnot: function(doc, link, elt) {
    if (/mail\.live\./.test(doc.location.host)) {
      return this.super.insertLinkAnnot(doc, link, elt);
    } else {
      if (link.parentNode.tagName == "H3" || link.parentNode.tagName == "H2") {
        var hdg = link.parentNode;
        return hdg.parentNode.insertBefore(elt, hdg.nextSibling);
      }
      else
        return link.parentNode.appendChild(elt);
    }
  }
  
};
