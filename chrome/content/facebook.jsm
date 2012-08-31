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
  
  adjustLink: function FB_adjustLink(link, moreStyles) {
    var style = link.hasAttribute("style") ? link.getAttribute("style")+" " : ""
    style += "display: inline !important;"
    if (moreStyles) style += moreStyles;
    link.setAttribute("style", style);
  },
  
  cloneLink: function FB_cloneLink(doc, link) {
    var neew = link.cloneNode(true);
    this.adjustLink(neew);

    return neew;
  },
  
  isTracking: function FB_isTracking(doc, link) {
    // the old method: replace link on mouse down
    // if (this.super.isTracking(doc, link)) return true;
    // TODO: decide what to do with the old method for internal links
    return link.hasAttribute("onmouseover") &&
           link.getAttribute("onmouseover").match(/^Link[\w\.]*\.swap/);
  },
  
  removeTracking: function FB_removeTracking(doc, link, replaced) {
    let shim = link.getAttribute("onmouseover");
    let href = shim.replace(/^Link[\w\.]*\.swap\s*\(.*?,\s*"(.*?)".*/, "$1");
    link.href = JSON.parse('"'+href+'"');
    link.removeAttribute("onmouseover");
    link.removeAttribute("onclick");
  },
  
  createLinkAnnot: function FB_createLinkAnnot(doc, orgLink, isReplacement) {
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
  
  insertLinkAnnot: function FB_insertLinkAnnot(doc, link, elt) {
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

  loggedIn: function FB_loggedIn(doc) {
    return true; // TODO: really check...
  }
};
