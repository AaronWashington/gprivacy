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
  
  init: function(gpr, xulwindow, mainwindow) {
    this.gpr        = gpr;
    this.xulwindow  = xulwindow;
    this.refresh();
  },
  
  close: function() {
  },
  
  refresh: function(doc) {
    if(Services.prefs.getIntPref( "extensions.gprivacy.changemon") > 0)
      Logging.warn("changemon: Change monitoring set in config, but no change monitor installed.");
  },
  
  pageLoaded: function(eng, doc, links, changed) {
  },
  
  nodeInserted: function(eng, doc, _node, _links, changed) {
  },
  
  getWrapper: function(eng, doc) {
    return function(link) { return link; }
  },
  
  watch: function(eng, doc, link) {
  },
  
  // TODO: Move popup functions (preferably) to gputils.jsm
  showPopup: function(id, txt, icon, prim, sec, opts) {
    var ok = this.gpr.strings.getString("okButton"); 
    var cancel = (sec && sec.length > 0) ? this.gpr.strings.getString("cancelButton") : null;
    var msg    = this.gpr.name + ": " + txt;
    if (cancel) {
      // reverse ok / cancel
      if (this.xulwindow.confirm(msg+" \n("+ok+": "+sec[0].label+", "+cancel+": "+prim.label+")") )
        sec[0].callback("removed");
      else
        prim.callback("removed");
    } else {
      this.xulwindow.alert(msg);
      prim.callback("removed");
    }
  },
  
  closePopup: function() {
  },
  
};
