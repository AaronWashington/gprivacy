// $Id$

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("chrome://gprivacy/content/gputils.jsm");

var EXPORTED_SYMBOLS = [ "ChangeMonitorDB", "IgnoreRule", "IgnoreRules" ];

// MAYBE: Those classes should probably be in their own module...
function IgnoreRule(def) {
  this.rules = {};
  
  for (let k in def) {
    let r = def[k];
    if (!r) continue;
    if      (r == "<null>") r = null;
    else if (r[0] == "/")   r = r.replace(/^\/|\/$/g, "");
    else                    r = "^"+r.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")+"$";
    if (r != null) r = new RegExp(r);
    this.rules[k] = r;
  }
}

IgnoreRule.prototype = {

  match: function(data) {
    for (let k in this.rules) {
      let r  = this.rules[k];
      if (r == null && !!data[k])         return false; // want null, data there
      if (r != null &&  !data[k])         return false; // got rule,  data null
      if (r != null &&  !r.test(data[k])) return false; // got rule,  don't match
    }
    return true; // all rules matched
  },
  
};

IgnoreRule.databaseToRuleDef = function(row, colnames) {
  let def = {};
  for (let i in colnames) def[colnames[i]] = row[colnames[i]];
  return def;
}

function IgnoreRules(db, simple) {
  simple.forEach(function(a) { this.push(new IgnoreRule({ attr: a })); }, this);
  if (db)
    db.getIgnoreRules().forEach(function(r) { this.push(r); }, this);
}
IgnoreRules.prototype   = new Array();
IgnoreRules.constructor = IgnoreRules;

IgnoreRules.prototype.match = function(data) {
  for (let i = 0; i < this.length; i++)
    if (this[i].match(data)) return true;
  return false;
}

//***************************************************************************
//*
//*
//***************************************************************************

var ChangeMonitorDB = {
  dbconn: null,
  refcnt: 0,
  
  open: function(changemon) {
    var self = this;

    // refres some prefs
    this.DEBUG = changemon.DEBUG;
    this.debug = changemon.debug;
    
    if (!this.dbconn) {
      var pbs = null;
      try { var pbs = Components.classes["@mozilla.org/privatebrowsing;1"].getService(Components.interfaces.nsIPrivateBrowsingService); }
      catch (exc) { }
      if (pbs && pbs.privateBrowsingEnabled) {
        this._warnAndTurnOffDB(changemon, "changemon: No logging in private browsing mode");
        return this;
      }
     
      if (!this.dbconn) {
        try {
          var file    = FileUtils.getFile("ProfD", ["gpchangemon.sqlite"]);
          this.dbconn = !file.exists() ? this.createDB(file) :
                                         Services.storage.openDatabase(file);
          // somehow, the views keep disappearing, so, re-create them
          var views = DOMUtils.getContents("resource://gpchangemon/cmviews.sql");
          this.dbconn.executeSimpleSQL("pragma journal_mode = wal"); // this is getting lost, too
          this.dbconn.executeSimpleSQL(views);
        } catch (exc) {
          this.logSQLException();
          self._warnAndTurnOffDB(changemon);
        }
      }
      if (this.dbconn)
        try { this.dbconn.executeSimpleSQL("pragma wal_checkpoint"); } catch (dexc) { this.logSQLException(dexc); }
    }
    this.refcnt++
    this.debug("changemon: new database connection, refcnt = "+this.refcnt);
    return this;
  },
  
  close: function() {
    if (!this.dbconn || this.refcnt <= 0) return;
    this.refcnt--;
    if (this.refcnt == 0) {
      this.dbconn.asyncClose();
      this.dbconn = null;
      this.debug("changemon: database closed");
    }
    this.debug("changemon: database connection closed, refcnt = "+this.refcnt);
  },
  
  getIgnoreRules: function() {
    if (!this.dbconn) return [];
    
    var rules = [];
    var stmt  = null;

    try {
      stmt = this.dbconn.createStatement("select * from ignore");
      var cols = []; for (let i = 0; i < stmt.columnCount; i++) cols.push(stmt.getColumnName(i));
      while (stmt.executeStep()) {
        rules.push(new IgnoreRule(IgnoreRule.databaseToRuleDef(stmt.row, cols)));
      }
    } catch (exc) {
      if (this.DEBUG) this.logSQLException(exc);
      Logging.warn("changemon: Error reading ignore rules. Does the table 'ignore' exist?");
    } finally {
      if (stmt) stmt.reset();
    }
    this.debug("changemon: "+rules.length+" ignore-rules read from database.")
    return rules;
  },
  
  writeEntry:  function(changemon, data) {
    if (!this.dbconn) return;
    
    var self = this;

    try {
/*
      var stmt = this.dbconn.createStatement("insert into changemon " + 
               "(ts, engine, what, attr, oldv, newv, id, proto, host, path, query, doc, note) " +
        "values(  0,      1,    2,    3,    4,    5,  6,     7,    8,    9,    10,  11,   12)");
*/
      var stmt = this.dbconn.createStatement("insert into changemon " + 
               "(ts, engine, what, attr, oldv, newv, id, proto, host, path, query, doc, note) " +
        "values(:ts,:engine,:what,:attr,:oldv,:newv,:id,:proto,:host,:path,:query,:doc,:note)");
        
      for (let d in stmt.params)
        if (data[d]) stmt.params[d] = data[d];
      
      stmt.executeAsync({
        handleCompletion: function(rc)  { self.debug("changemon: async SQL completed rc="+rc); },
        handleError:      function(err) {
          Logging.error("changemon: SQL Error: "+err.message);
          self._warnAndTurnOffDB(changemon);
        }
      });
    } catch (exc) {
      this.logSQLException(exc);
      self._warnAndTurnOffDB(changemon);
    }
  },
  
  createDB: function(file) {
    try { 
      var dbconn = Services.storage.openDatabase(file);
      dbconn.executeSimpleSQL("pragma journal_mode = wal");
      var creates = DOMUtils.getContents("resource://gpchangemon/changemon.sql");
      dbconn.beginTransaction();
      dbconn.executeSimpleSQL(creates);
      dbconn.commitTransaction();
      this.debug("changemon: database created");
      /* REMOVEME: */ this.xulwindow.alert("gprivacy: changemon: database created"); // it keeps happening???
      return dbconn
    } catch (exc) {
      if (file.exists()) {
        try { this.dbconn.close() } catch (dexc) { this.logSQLException(dexc); }
        try { file.remove(false)  } catch (fexc) { Logging.logException(fexc); }
      }
      throw(exc);
    }
  },
  
  _warnAndTurnOffDB: function (changemon, msg) {
    Logging.warn(msg || "changemon: Error accessing database. Logging turned off.");
    var conn = this.dbconn;
    if (conn) {
      this.dbconn = null;
      this.refcnt = 0;
      changemon.level &= ~this.STORE;
      conn.asyncClose();
    }
  },

  logSQLException: function(exc) {
    Logging.logException(exc, this.dbconn ? "changemon: SQL Error: '"+this.dbconn.lastErrorString+"'" : null);
  },
  
};
  
  
