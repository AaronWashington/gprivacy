// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyYahoo" ];

function gprivacyYahoo(engines) {
  this.engines = engines;
  this.gpr     = engines.gpr;
  
  this.PATTERN = /https?:\/\/(\w+\.)*?(yahoo)\.\w+\//
}

gprivacyYahoo.prototype = {
  ID:         "yahoo",
  NAME:       "Yahoo!",
  TRACKATTR:  [ "dirtyhref", "data-bk", "data-bns", // Yahoo! Search
                "inst_b", "inst_r", "data-guid"     // My Yahoo!
              ],
  LINK_CLASS: "",

  loggedIn: function(doc) {
    var logout = doc.evaluate('count(//a[@href[contains(.,"logout=1")]])', doc, null,
                              Components.interfaces.nsIDOMXPathResult.ANY_TYPE, null );
    return logout.numberValue > 0;
  },

  removeTracking: function(doc, link) {
    this.super.removeTracking(doc, link);
    // stop "mousedown", even if it's NOT handled by the link itself
    EventUtils.stopEvent("mousedown", link, true);
    EventUtils.stopEvent("click", link, true);
    EventUtils.stopEvent("focus", link, true);
  },
  
  insertLinkAnnot: function(doc, link, elt) {
    if (link.parentNode.tagName == "H3")
      return link.parentNode.parentNode.appendChild(elt);
    else
      return link.parentNode.insertBefore(elt, link.nextSibling);
  },

  IGNORED_ATTRS: ["role", "aria-haspopup", "tabindex"],
  
  changemonIgnored: function(doc, link, e) { // don't warn on certain pages without hits
    // my.yahoo.com
    var ignored = false;
    if (!ignored && e && e.attrChange) {
      if (e.attrName == "id") {
        ignored = (
          (!e.prevValue && e.newValue.match(/^yui[-_].*$/)) ||
          (e.newValue == link.id)
        );
      }
      if (!ignored && doc.location.host.match(/^my\.yahoo\..*$/)) {
        if (e.attrName == "class") {
          ignored = (
            (e.prevValue == "small strong" && e.newValue == "text") ||
            (e.prevValue.replace(/\s*yucs-(\w+-)?activate\s*/g, '') ==
             e.newValue.replace( /\s*yucs-(\w+-)?activate\s*/g, ''))
          );
        } else if (e.attrName == "title") {
          ignored = (link.host == doc.location.host);
        }
      }
    }
    if (ignored)
      this.gpr.debug(this+": ignoring unchanged ' "+(link?"link":"page")+" "+doc.location.href.substring(0, 128)+"'"); 
    return ignored;
  }  
};
