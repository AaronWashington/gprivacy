Components.utils.import("chrome://gprivacy/content/gpengines.jsm");
Components.utils.import("chrome://gprask/content/ask.jsm");

var gprask = {
  onLoad: function() {
    Engines.add(new gprivacyAsk(Engines));
  }
}

window.addEventListener("load", function () { gprask.onLoad(); }, false);

