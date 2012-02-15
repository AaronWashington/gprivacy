// $Id$

"use strict";

var gpr              = require("../lib/gprtests");
var {assert, expect} = require("../lib/mozmill/assertions");

var setupModule = function (mod) {
  mod.ctlr    = mozmill.getBrowserController();

}

var testStupidDOMCreate = function() {
  let {doc} = gpr.refreshResults(ctlr, null, "https://www.google.com/search?q=Wikipedia");
  let elt = DOMUtils.create(doc, { node: "img", class: "foobar" });
  assert.equal(elt.getAttribute("class"), "foobar", "Element created");
  try {
    elt = DOMUtils.create(doc, { node: "strong", class: "foobar" }); 
    assert.fail("Unknown DOM Element didn't throw error");
  }
  catch (exc) {
    assert.pass("'"+exc.message+"' thrown");
  }
}

