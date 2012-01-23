Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyYahoo" ];

function gprivacyYahoo(gprivacy) {
  this.gpr   = gprivacy
  
  this.PATTERN = Services.prefs.getCharPref("extensions.gprivacy.engines.yahoo.match");
}

gprivacyYahoo.prototype = {
  ID:         "yahoo",
  NAME:       "Yahoo!",
  PATTERN:    Services.prefs.getCharPref("extensions.gprivacy.engines.yahoo.match"),
  TRACKATTR:  [ "dirtyhref", "data-bk", "data-bns" ],
  LINK_CLASS: "",

  onLinkMousedown: function(e) {
    e.stopPropagation();
  },
  
  loggedIn: function(doc) {
    var logout = doc.evaluate('count(//a[@href[contains(.,"logout=1")]])', doc, null,
                              Components.interfaces.nsIDOMXPathResult.ANY_TYPE, null );
    return logout.numberValue > 0;
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
