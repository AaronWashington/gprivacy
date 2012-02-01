// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyBing" ];

function gprivacyBing(engines) {
  this.engines = engines;
  this.gpr     = engines.gpr;
  
  this.PATTERN = /https?:\/\/(\w+\.)*?(bing)\.\w+\//
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

  insertLinkAnnot: function(doc, link, elt) {
    if (link.parentNode.tagName == "H3" || link.parentNode.tagName == "H2") {
      var hdg = link.parentNode;
      return hdg.parentNode.insertBefore(elt, hdg.nextSibling);
    }
    else
      return link.parentNode.appendChild(elt);
  }
  
};
