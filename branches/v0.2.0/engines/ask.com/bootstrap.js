// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");

var myData = null;

function startup(data, reason)
{
  myData = data;
  
  Services.ww.registerNotification(observer);
  
  if (Services.ww.getWindowEnumerator().hasMoreElements())
    addEngineClass();
}

function shutdown(data, reason)
{
  Services.ww.unregisterNotification(observer);
  
  Components.utils.import("chrome://gprivacy/content/gpengines.jsm");
  Components.utils.import("chrome://gprask/content/engine.jsm");

  for(let coll in gBrowserEngines) {
    gBrowserEngines[coll].removeClass(gprivacyAsk);
  }
}

function install(params, reason) {}

function uninstall(params, reason) {}

var observer = { // it's not that easy with bootstrapped add-ons...
  observe: function(subj, topic, data) {
    let win = subj.QueryInterface(Components.interfaces.nsIDOMWindow);
    let listener = function() {
      addEngineClass();
    }
    if (topic == "domwindowopened") {
      // bootstrapped engines must listen to this:
      win.addEventListener("gprivacy:engines", listener, false);
    } else if (topic == "domwindowclosed") {
      win.removeEventListener("gprivacy:engines", listener, false);
    }
  }
}

function addEngineClass() {
  Components.utils.import("chrome://gprivacy/content/gpengines.jsm");
  Components.utils.import("chrome://gprask/content/engine.jsm");

  // for bootstrapped extensions, we have to find existing browsers...
  for(let coll in gBrowserEngines) {
    // Just load our engine and add it to gprivacy
    // @change this to match your EXPORTED_SYMBOLS in engine.jsm
    gBrowserEngines[coll].addClass(gprivacyAsk);
  }
}
