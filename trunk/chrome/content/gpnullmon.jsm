// $Id$

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
  OFF:     0,
  WARN:    1,
  NOTIFY:  2,
  TRACKED: 4,
  ALL:     8,
  PROXY:  16,
  
  active:  false,
  level:   0,
  engines: null,
  isNull:  true,
  
  init: function(gpr, xulwindow, mainwindow) {
    this.gpr        = gpr;
    this.xulwindow  = xulwindow;
  },
  
  refresh: function(doc) {
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
  
  // TODO: Move popup functions to gputils.jsm
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
