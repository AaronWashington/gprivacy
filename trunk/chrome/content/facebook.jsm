// $Id$

"use strict";

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
  
  adjustLink: function(link, moreStyles) {
    var style = link.hasAttribute("style") ? link.getAttribute("style")+" " : ""
    style += "display: inline !important;"
    if (moreStyles) style += moreStyles;
    link.setAttribute("style", style);
  },
  
  cloneLink: function(doc, link) {
    var neew = link.cloneNode(true);
    this.adjustLink(neew);

    return neew;
  },
  
  createLinkAnnot: function(doc, orgLink, isReplacement) {
    let annot = null;
    if (!orgLink.classList.contains("UIImageBlock_Image") &&
        !orgLink.classList.contains("uiImageBlockImage") ) {
      annot = this.super.createLinkAnnot(doc, orgLink, isReplacement);
    } else {
      annot = { gprfbdummy: true,
                setLink: function(link) { this.link = link, this.after = orgLink; } };
    }
    if (isReplacement) {
      let setlink = annot.setLink;
      annot.setLink = function(link) {
        link.style.minHeight = "0px";    link.style.height = "auto";
        link.style.display   = "inline"; link.style.border = "none";
        setlink.call(annot, link);
      };
    }
    return annot;
  },
  
  insertLinkAnnot: function(doc, link, elt) {
    if (elt.gprfbdummy) {
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
    return true; // TODO: really check...
  }
};
