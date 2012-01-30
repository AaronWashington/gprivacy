//*****************************************************************************
//*
//* Sample engine for gprivacy
//*
//* Search for '@change' to find hints where you should edit this engine
//*
//*****************************************************************************
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "gprivacyAsk" ]; // @change: you may want to rename this

function gprivacyAsk(engines) {           // @change: ...and here
  this.engines = engines;
  this.gpr     = engines.gpr;
  
  // @change: You should probably remove the next line:
  Logging.info("You have successfully installed the demo engine '" + this.NAME + "'.");
}

gprivacyAsk.prototype = { // @change: ...and here
  
  ID:        "ask",       // @change: @required, may overwrite an existing
                          // engine, but please clearly state this in your docs!
                        
  NAME:      "Ask.com",   // @change: @required
  
  PATTERN:   /https?:\/\/(\w+\.)*?(ask)\.\w+\//, // which urls match this engine
  
  TRACKATTR:  [ "onmousedown" ], // these attributes on links will be checked
                                 // and removed by the default engine.
                                 // @change: @optional, but you probably need
                                 // to find them out and change them!

  PREF_ENABLED: true,            // An engine has three standard preferences:
                                 // 'extensions.gprivacy.engines.<ID>.enabled',
                                 // '.<ID>.own' and '.<ID>.allevts' (see
                                 // 'defaults/preferences/prefs.js')
                                 // If you don't want to create that file, override
  PREF_ALLEVTS: false,           // the system defaults here ('PREF_ENABLED', ...)
  PREF_OWN: true,                // @change: @optional, if you have 'prefs.js'
  
  
  //***************************************************************************
  //* None of the following methods _needs_ to be implemented!
  //* They mainly show, what methods are available and how to use their
  //* default implementation.
  //* They are also roughly in the order they will be called, but don't
  //* rely on it...
  //* @change: If you dont need any of these, just remove them all...
  //***************************************************************************
  
  loggedIn: function(doc) {
    // Use the document to find out, if a user is logged in.
    return false; // returns 
  },
  
  refresh: function() { 
    // Is called after a matching page is loaded, but before cleaning starts
    // may be used to re-load engine specific preferences.
    return this.super.refresh(); // super was added by Engines.add(). See 'overlay.js'
  },
  
  isTracking: function(doc, link) {
    // Determine, whether a link is a tracking link.
    // The default implementations checks for any of this.TRACKATTR
    return this.super.isTracking(doc, link);
  },
  
  hasBadHandler: function(doc, link) {
    // This is called, if the 'allevts' option is set, to check if a link
    // should be cleaned up.
    // Better leave this alone...
    return this.super.hasBadHandler(doc, link);
  },

  cloneLink: function(_doc, link) {
    // Create a copy of the original link. Below is a annotated version
    // of the default implementation
    // @change: You only need to implement this (and the next two methods),
    // If the modified web page looks particularly ugly.
    var neew = link.cloneNode(true);  // use DOM, copy children.
                                      // @change this if you need...
    neew.setIcon = function(elt) {
      // Will be called to insert those little icons somewhere in the DOM.
      // if you don't attach this function, this happens:
      DOMUtils.setIcon(neew, elt);
    }
    return neew;
  },
  
  createLinkAnnot: function(doc, trackedLink, wasReplaced) {
    // Create a HTML element that will hold the private (or original) link.
    // can attach a function 'setLink' where the private (or original) link
    // will be inserted (see 'setIcon' in 'cloneLink' above, or better, see
    // 'gpengines.jsm')
    // 'wasReplaced' indicates wheter the tracked link was replaced by the
    // private link, if you need this info.
    return this.super.createLinkAnnot(doc, trackedLink, wasReplaced);
  },
  
  insertLinkAnnot: function(doc, link, annot) {
    // Insert the element created by 'createLinkAnnot' into the DOM.
    return this.super.insertLinkAnnot(doc, link, annot);
  },
  
  removeTracking: function(doc, privateLink, replaced) {
    // Remove or override all known tracking methods from a link
    // @change: This is probably the point where you want to start, if
    // adjusting this.TRACKATTR doesn't help
    // 'replaced' tells you, if the the private link replaced the tracked one
    return this.super.removeTracking(doc, privateLink);
  },
  
  removeAll: function(doc, privateLink, replaced) {
    // This is called, if the 'allevts' option is set.
    // The default implementation remove all mouse, click and focus 
    // attributes and stops their atached event handling.
    // This may severely impair a webpage ;-)
    // 'replaced' tells you, if the the private link replaced the tracked one
    return this.super.removeAll(doc, privateLink, replaced);
  },
  
  removeGlobal: function(doc) {
    // If the webpage defines any tracking not attached to the links
    // (e.g. onClick-handlers on the document), you may remove or override
    // it here. The default does nothing.
    // Return true, if you found something
    return this.super.removeGlobal(doc);
  },
  
  // Well, thats it!
  // @change: You may remove any method up to here!
};
