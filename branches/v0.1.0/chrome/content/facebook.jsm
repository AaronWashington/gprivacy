Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyFacebook" ];

function gprivacyFacebook(gprivacy) {
  this.gpr   = gprivacy
  
  this.PATTERN = Services.prefs.getCharPref("extensions.gprivacy.engines.facebook.match");
}

gprivacyFacebook.prototype = {
  ID:        "facebook",
  NAME:      "Facebook",
  PATTERN:    Services.prefs.getCharPref("extensions.gprivacy.engines.facebook.match"),
  TRACKATTR:  [ "onmousedown" ],
  LINK_CLASS: "emuEvent1",
  // DELCLASSES: /(force(LTR|RTL))|identity/g,
  
  adjustLink: function(link) {
    if (link.hasAttribute("class") && (typeof this.DELCLASSES !== "undefined")) {
      var clazz = link.getAttribute("class").replace(this.DELCLASSES, "");
      link.setAttribute("class", clazz);
    }
    var style = link.hasAttribute("style") ? link.getAttribute("style")+" " : ""
    style += "display: inline !important;"
    link.setAttribute("style", style);
  },
  
  cloneLink: function(doc, link) {
    var neew = link.cloneNode(false);
    this.adjustLink(neew);
    var style = link.hasAttribute("style") ? link.getAttribute("style")+" " : ""
    style += "float: none !important;"
    neew.setAttribute("style", style);
    return neew;
  },
  
  insertLinkAnnot: function(doc, link, elt) {
    this.adjustLink(link);
    return link.parentNode.insertBefore(elt, link.nextSibling);
  },

  loggedIn: function(doc) {
    true; // TODO: really check...
  }
};
