Components.utils.import("resource://gre/modules/Services.jsm");

var gprivacyOpts = {
  onLoad:  function() {
    this.con     = Services.console;
    this.DEBUG   = Services.prefs.getBoolPref("extensions.gprivacy.debug")
    this.enableCtls();
    this.debug("Options loaded");
  },
  
  onOK: function() {
    if (window.arguments)
      window.arguments[0].rc = true;
  },
  
  enableCtls: function(what) {
    var inact = !document.getElementById("checkactive").checked;
    var repl  = document.getElementById("checkreplace").checked;
    
    document.getElementById("checkorig").disabled = !repl || inact;

    this.debug("Privacy is " + (inact ? "NOT " : "") + "active");

    // options
    var ctls  = [ "checkreplace", "checkactivel", "checkmark", "checktext", "checkanon" ];
    // engines
    var xpres = function(pfx) { return "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"; }
    var ectls = document.evaluate('//xul:checkbox[starts-with(@id,"ce") or starts-with(@id,"cs") or starts-with(@id,"ca")]', document, xpres,
                                  Components.interfaces.nsIDOMXPathResult.ANY_TYPE, null );
    for (var ctl = ectls.iterateNext(); ctl; ctl = ectls.iterateNext())
      ctls.push(ctl.id)
    
    for (var i = 0; i < ctls.length; i++)
      document.getElementById(ctls[i]).disabled = inact;

    this.debug("changed: " + what + " " + document.getElementById("checkmark").checked + " " + document.getElementById("checktext").checked);
    if (what == "text" && !document.getElementById("checktext").checked)
      document.getElementById("checkmark").checked = true;
    if (what == "mark" && !document.getElementById("checkmark").checked)
      document.getElementById("checktext").checked = true;
      
    // Cannot deactivate embbedded frames for now
    document.getElementById("checkembed").disabled = true;
  },

  log: function(txt) {
    this.con.logStringMessage("gprivacyOpts: " + txt);
  },
  
  debug: function(txt) {
    if (this.DEBUG)
      this.log("DEBUG: " + txt);
  }
};

// window.addEventListener("load", function () { gprivacyOpts.onLoad(); }, false);
