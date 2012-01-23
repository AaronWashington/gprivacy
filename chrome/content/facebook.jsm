Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyFacebook" ];

function gprivacyFacebook(engines) {
  this.engines = engines;
  this.gpr     = engines.gpr;
  
  this.PATTERN = /https?:\/\/(\w+\.)*?(facebook)\.\w+\//
}

gprivacyFacebook.prototype = {
  ID:        "facebook",
  NAME:      "Facebook",
  TRACKATTR:  [ "onmousedown" ],
  LINK_CLASS: "emuEvent1",
  // DELCLASSES: /(force(LTR|RTL))|identity/g,
  
  adjustLink: function(link, moreStyles) {
    if (link.hasAttribute("class") && (typeof this.DELCLASSES !== "undefined")) {
      var clazz = link.getAttribute("class").replace(this.DELCLASSES, "");
      link.setAttribute("class", clazz);
    }
    var style = link.hasAttribute("style") ? link.getAttribute("style")+" " : ""
    style += "display: inline !important;"
    if (moreStyles) style += moreStyles;
    link.setAttribute("style", style);
  },
  
  cloneLink: function(doc, link) {
    var neew = link.cloneNode(false);
    this.adjustLink(neew);
/*
    var style = link.hasAttribute("style") ? link.getAttribute("style")+" " : ""
    style += "float: none !important;"
    neew.setAttribute("style", style);
*/
    return neew;
  },
  
  createLinkAnnot: function(doc, orgLink, isReplacement) {
    if (!orgLink.classList.contains("UIImageBlock_Image") &&
        !orgLink.classList.contains("uiImageBlockImage"))
      return this.super.createLinkAnnot(doc, orgLink, isReplacement);
    else {
      return { gprdummy: true,
               setLink: function(link) { this.link = link, this.after = orgLink; } }
    }
    
  },
  
  insertLinkAnnot: function(doc, link, elt) {
    if (elt.gprdummy) {
      if (elt.after && elt.link) {
        this.adjustLink(elt.link, "clear: left !important;");
        return elt.after.parentNode.insertBefore(elt.link, elt.after.nextSibling);
      }
      else
        return null;
    }
    this.adjustLink(link);
    return link.parentNode.insertBefore(elt, link.nextSibling);
  },

  loggedIn: function(doc) {
    true; // TODO: really check...
  }
};
