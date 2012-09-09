// $Id$

"use strict";

/*
 * ChangeMonitor template for future use
 */
 
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/PopupNotifications.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "ChangeMonitor" ];

function ChangeMonitor(gprivacy, xulwindow, mainwindow) {
  this.init(gprivacy, xulwindow, mainwindow);
}

ChangeMonitor.prototype = {
  OFF:       0,
  WARN:      1,  // write warnings to error console
  NOTIFY:    2,  // Popup-notifications
  TRACKING:  4,  // Monitor tracking links, too
  ALL:       8,  // Monitor _ALL_ links on a page
  STORE:    16,  // Store events in gpchangemon.sqlite
  SILENT: 1024,  // Don't show icons when watching all links, ...
  
  active:  false,
  level:   0,
  engines: null,
  isNull:  true,
  
  init: function(gpr) {
    this.gpr        = gpr;
    this.xulwindow  = this.gpr.window;
    this.refresh();
  },
  
  close: function() {
  },
  
  refresh: function(doc, eng) {
    this.level = Services.prefs.getIntPref( "extensions.gprivacy.changemon");
    if(this.level > 0)
      Logging.warn("changemon: Change monitoring set in config, but no change monitor installed.");
  },
  
  pageLoaded: function(eng, doc, links, changed) {
    if (this.level > 0 && changed > 0) {
      Logging.log("changemon: Engine '"+eng+"': "+changed+" links changed "+
                  "in " + (new Date().getTime() - this.gpr._pageLoadTime(doc)) + " ms " + // see _pageLoadTime in gprivacy.js
                  "when loading page '"+doc.location.href.substring(0, 128)+"'");
    }
  },
  
  nodeInserted: function(eng, doc, _node, _links, changed) {
  },
  
  getWrapper: function(eng, doc) {
    return function(link) { return link; }
  },
  
  watch: function(eng, doc, link) {
  },
  
};
