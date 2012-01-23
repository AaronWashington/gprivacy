const Cc = Components.classes;
const Ci = Components.interfaces;

var EXPORTED_SYMBOLS = [ "EventUtils" ];

var EventUtils = {
  _els: null,
  
  get els() { // EventListenerService
    if (this._els == null) {
      try { this._els = Cc["@mozilla.org/eventlistenerservice;1"].getService(Ci.nsIEventListenerService); }
      catch (exc) {  }
    }
    return this._els;
  },
  
  getEvents: function(elt) {
    if (this.els == null)
      return null;
    var evts = {};
    var infos = this.els.getListenerInfoFor(elt);
    for (var i = 0; i < infos.length; i++)
      if (typeof evts[infos[i].type] == "undefined")
        evts[infos[i].type]  = 1;
      else
        evts[infos[i].type] += 1
    return evts;
  },
  
  stopEvent: function(type, elt) {
    var self = this; // generate closure
    elt.addEventListener(type, function(e) { self.stopThis(e); });
  },
  
  stopThis: function(evt) {
    evt.stopPropagation();
  }
};
