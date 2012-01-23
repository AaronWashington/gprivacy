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
  TRACKATTR:  [ "dirtyhref", "data-bk", "data-bns" ],
  LINK_CLASS: "",

  loggedIn: function(doc) {
    var logout = doc.evaluate('count(//a[@href[contains(.,"logout=1")]])', doc, null,
                              Components.interfaces.nsIDOMXPathResult.ANY_TYPE, null );
    return logout.numberValue > 0;
  },

  removeTracking: function(doc, link) {
    this.super.removeTracking(doc, link);
    // stop "mousedown", even if it's NOT handled by the link itself
    EventUtils.stopEvent("mousedown", link);
  },
  
  insertLinkAnnot: function(doc, link, elt) {
    if (link.parentNode.tagName == "H3")
      return link.parentNode.parentNode.appendChild(elt);
    else
      return link.parentNode.insertBefore(elt, link.nextSibling);
  },

  cloneLink: function(doc, link) {
    var neew = link.cloneNode(false);
    neew.setAttribute("class", null);
    return neew;
  }
};
